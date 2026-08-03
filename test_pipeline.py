# -*- coding: utf-8 -*-
"""Regression tests for the curated question-bank pipeline."""
from __future__ import annotations

import json
import hashlib
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
import unittest
from collections import Counter
from pathlib import Path

from build_html import (
    GAME_DATA_PLACEHOLDER,
    GAME_MAP_TEXTURE_PLACEHOLDER,
    GAME_SCRIPTS_PLACEHOLDER,
    GAME_STYLES_PLACEHOLDER,
    GAME_SVG_PLACEHOLDER,
    LECTURE_CATALOGS_PLACEHOLDER,
    LECTURES_PLACEHOLDER,
    PLACEHOLDER,
    QUESTION_BANKS_PLACEHOLDER,
    SUBJECT_CATALOG_PLACEHOLDER,
    PUBLIC_QUESTION_FIELDS,
    PUBLIC_SUBJECT_FIELDS,
    build_catalogs,
    build_release_manifest,
    build_vercel_config,
    canonical_input_snapshot_sha256,
    catalog_accessor_source,
    discard_release_staging,
    enforce_artifact_budget,
    inline_csp_hashes,
    load_game_assets,
    load_lectures,
    measure_artifact,
    render_catalog_html,
    render_html,
    serialize_for_inline_script,
    snapshot_input_manifest,
    stage_release_artifacts,
    promote_release,
)
from compose_questions import compose_subject
from subject_catalog import CatalogError, load_registry, load_subject_profile, load_subjects
from validate_questions import (
    find_repeated_answer_cycle,
    has_truncation_ellipsis,
    normalize_option,
    validate_file,
    validate_subject,
)


BASE = Path(__file__).resolve().parent
_CATALOG_TEST_FIXTURE: tuple[
    list[dict[str, object]],
    dict[str, list[dict[str, object]]],
    dict[str, dict[str, object]],
    str,
] | None = None


def catalog_test_fixture() -> tuple[
    list[dict[str, object]],
    dict[str, list[dict[str, object]]],
    dict[str, dict[str, object]],
    str,
]:
    global _CATALOG_TEST_FIXTURE
    if _CATALOG_TEST_FIXTURE is None:
        subjects, banks, lectures = build_catalogs(BASE)
        template = (BASE / "template.html").read_text(encoding="utf-8")
        rendered = render_catalog_html(
            template, subjects, banks, lectures, load_game_assets(BASE)
        )
        _CATALOG_TEST_FIXTURE = subjects, banks, lectures, rendered
    return _CATALOG_TEST_FIXTURE


def normalized_text(value: str) -> str:
    value = unicodedata.normalize("NFD", value.casefold())
    value = "".join(char for char in value if unicodedata.category(char) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", value.replace("đ", "d")).strip()


class ContentContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.content_root = BASE / "content"
        cls.subjects_root = cls.content_root / "subjects"
        cls.registry = json.loads(
            (cls.subjects_root / "registry.json").read_text(encoding="utf-8")
        )
        cls.profiles = {
            item["id"]: json.loads(
                (cls.content_root / Path(item["metadataPath"])).read_text(encoding="utf-8")
            )
            for item in cls.registry["subjects"]
        }

    def load_authored_questions(self, subject_id: str) -> list[dict]:
        questions: list[dict] = []
        for item in self.profiles[subject_id]["questionFiles"]:
            path = self.content_root / Path(item["path"])
            questions.extend(json.loads(path.read_text(encoding="utf-8")))
        return questions

    def test_registry_has_exact_five_subject_contract(self) -> None:
        self.assertEqual(set(self.registry), {"schemaVersion", "subjects"})
        self.assertEqual(self.registry["schemaVersion"], 1)
        self.assertEqual(
            [item["id"] for item in self.registry["subjects"]],
            ["mln111", "mln112", "mln131", "hcm202", "vnr202"],
        )
        self.assertEqual(
            [item["status"] for item in self.registry["subjects"]],
            ["ready", "ready", "ready", "ready", "ready"],
        )
        self.assertFalse((self.subjects_root / "hcm201").exists())
        expected_fields = {"id", "code", "legacyAliases", "status", "metadataPath"}
        ids: set[str] = set()
        codes: set[str] = set()
        paths: set[str] = set()
        aliases: set[str] = set()
        for item in self.registry["subjects"]:
            with self.subTest(subject=item["id"]):
                self.assertEqual(set(item), expected_fields)
                self.assertRegex(item["id"], r"^[a-z][a-z0-9-]{1,31}$")
                self.assertNotIn(item["id"], {"__proto__", "prototype", "constructor"})
                self.assertNotIn(item["id"], ids)
                self.assertNotIn(item["code"], codes)
                self.assertNotIn(item["metadataPath"], paths)
                ids.add(item["id"])
                codes.add(item["code"])
                paths.add(item["metadataPath"])
                metadata_path = Path(item["metadataPath"])
                self.assertFalse(metadata_path.is_absolute())
                self.assertNotIn("..", metadata_path.parts)
                self.assertTrue((self.content_root / metadata_path).is_file())
                for alias in item["legacyAliases"]:
                    self.assertNotIn(alias, ids | aliases)
                    aliases.add(alias)
        self.assertEqual(self.registry["subjects"][1]["legacyAliases"], ["mln122", "mln222"])
        self.assertEqual(self.registry["subjects"][4]["legacyAliases"], ["vnr201"])

    def test_ready_profiles_have_unique_stable_chapters_and_existing_sources(self) -> None:
        expected_features = {"quiz", "flashcards", "search", "lectures", "game"}
        content_root = self.content_root.resolve()
        all_chapter_ids: set[str] = set()
        all_paths: set[Path] = set()
        for subject_id in ("mln111", "mln112", "mln131", "hcm202", "vnr202"):
            profile = self.profiles[subject_id]
            with self.subTest(subject=subject_id):
                self.assertEqual(profile["status"], "ready")
                self.assertIs(profile["studyReady"], True)
                self.assertEqual(set(profile["features"]), expected_features)
                self.assertEqual(
                    sum(chapter["questionTarget"] for chapter in profile["chapters"]),
                    profile["questionTarget"],
                )
                self.assertEqual(
                    [chapter["number"] for chapter in profile["chapters"]],
                    list(range(1, len(profile["chapters"]) + 1)),
                )
                for chapter in profile["chapters"]:
                    self.assertEqual(
                        set(chapter), {"id", "number", "title", "questionTarget"}
                    )
                    self.assertRegex(chapter["id"], r"^[a-z][a-z0-9-]{1,31}$")
                    self.assertNotIn(chapter["id"], all_chapter_ids)
                    all_chapter_ids.add(chapter["id"])
                for question_file in profile["questionFiles"]:
                    self.assertEqual(set(question_file), {"chapterNum", "path"})
                    relative_path = Path(question_file["path"])
                    self.assertFalse(relative_path.is_absolute())
                    self.assertNotIn("..", relative_path.parts)
                    resolved = (self.content_root / relative_path).resolve()
                    self.assertTrue(resolved.is_relative_to(content_root))
                    self.assertTrue(resolved.is_file())
                    self.assertNotIn(resolved, all_paths)
                    all_paths.add(resolved)

    def test_mln131_and_vnr202_profiles_expose_authored_banks(self) -> None:
        expected_fields = {
            "schemaVersion", "id", "code", "legacyAliases", "title", "description",
            "status", "studyReady", "copyReviewRequired", "features", "questionTarget",
            "chapters", "questionFiles", "lectureManifest", "validation",
        }
        for subject_id, target, chapter_count in (("mln131", 280, 7), ("vnr202", 850, 5)):
            profile = self.profiles[subject_id]
            with self.subTest(subject=subject_id):
                self.assertEqual(set(profile), expected_fields)
                self.assertEqual(profile["status"], "ready")
                self.assertIs(profile["studyReady"], True)
                self.assertIs(profile["copyReviewRequired"], False)
                self.assertEqual(profile["questionTarget"], target)
                self.assertEqual(len(profile["chapters"]), chapter_count)
                self.assertEqual(len(profile["questionFiles"]), chapter_count)
                self.assertTrue(profile["features"]["quiz"])
                self.assertTrue(profile["features"]["flashcards"])
                self.assertTrue(profile["features"]["search"])

    def test_mln111_bank_matches_reviewed_distribution_and_schema(self) -> None:
        profile = self.profiles["mln111"]
        questions = self.load_authored_questions("mln111")
        self.assertEqual(len(questions), 380)
        self.assertEqual(
            Counter(question["chapterNum"] for question in questions),
            Counter({1: 70, 2: 150, 3: 160}),
        )
        self.assertEqual(
            Counter(question["difficulty"] for question in questions),
            Counter({"Nhận biết": 152, "Thông hiểu": 152, "Vận dụng": 76}),
        )
        self.assertEqual(
            [Counter(question["answer"] for question in questions)[index] for index in range(4)],
            [96, 96, 94, 94],
        )
        expected_fields = {
            "id", "courseId", "chapter", "chapterNum", "topic", "difficulty", "kind",
            "stem", "options", "answer", "explanation", "source",
        }
        ids: set[str] = set()
        stems: set[str] = set()
        allowed_sources = {
            item["file"] for item in profile["validation"]["sourcePolicy"]["allowedSources"]
        }
        for question in questions:
            with self.subTest(question=question["id"]):
                self.assertEqual(set(question), expected_fields)
                self.assertEqual(question["courseId"], "mln111")
                self.assertRegex(question["id"], r"^MLN111-C\d{2}-Q\d{3}$")
                self.assertNotIn(question["id"], ids)
                ids.add(question["id"])
                normalized_stem = normalized_text(question["stem"])
                self.assertNotIn(normalized_stem, stems)
                stems.add(normalized_stem)
                self.assertEqual(len(question["options"]), 4)
                self.assertEqual(
                    len({normalized_text(option) for option in question["options"]}), 4
                )
                self.assertIn(question["answer"], range(4))
                self.assertIn(question["kind"], profile["validation"]["allowedKinds"])
                self.assertEqual(set(question["source"]), {"file", "section", "text"})
                self.assertIn(question["source"]["file"], allowed_sources)

    def test_hcm202_bank_matches_reviewed_distribution_schema_and_length_gates(self) -> None:
        profile = self.profiles["hcm202"]
        questions = self.load_authored_questions("hcm202")
        self.assertEqual(len(questions), 480)
        self.assertEqual(
            Counter(question["chapterNum"] for question in questions),
            Counter({1: 45, 2: 75, 3: 100, 4: 95, 5: 75, 6: 90}),
        )
        self.assertEqual(
            Counter(question["difficulty"] for question in questions),
            Counter({"Nhận biết": 192, "Thông hiểu": 192, "Vận dụng": 96}),
        )
        self.assertEqual(
            [Counter(question["answer"] for question in questions)[index] for index in range(4)],
            [120, 120, 120, 120],
        )
        expected_fields = {
            "id", "courseId", "chapter", "chapterNum", "topic", "difficulty", "kind",
            "stem", "options", "answer", "explanation", "source",
        }
        absolute_cue_pattern = re.compile(
            r"(?<!\w)(?:chỉ|mọi|toàn bộ|hoàn toàn|không cần|tự động|duy nhất|"
            r"bất kỳ|thay thế|đứng ngoài|khép kín|loại bỏ|phủ nhận|tuyệt đối|"
            r"không bao giờ)(?!\w)",
            flags=re.IGNORECASE,
        )
        ids: set[str] = set()
        stems: set[str] = set()
        absolute_cue_ids: list[str] = []
        chapter_titles = {chapter["number"]: chapter["title"] for chapter in profile["chapters"]}
        for question in questions:
            with self.subTest(question=question["id"]):
                self.assertEqual(set(question), expected_fields)
                self.assertEqual(question["courseId"], "hcm202")
                self.assertRegex(question["id"], r"^HCM202-C\d{2}-Q\d{3}$")
                self.assertNotIn(question["id"], ids)
                ids.add(question["id"])
                normalized_stem = normalized_text(question["stem"])
                self.assertNotIn(normalized_stem, stems)
                stems.add(normalized_stem)
                self.assertEqual(question["chapter"], chapter_titles[question["chapterNum"]])
                self.assertEqual(len(question["options"]), 4)
                self.assertEqual(
                    len({normalized_text(option) for option in question["options"]}), 4
                )
                self.assertIn(question["answer"], range(4))
                correct_has_cue = bool(
                    absolute_cue_pattern.search(question["options"][question["answer"]])
                )
                distractors_with_cues = sum(
                    bool(absolute_cue_pattern.search(option))
                    for index, option in enumerate(question["options"])
                    if index != question["answer"]
                )
                if not correct_has_cue and distractors_with_cues >= 2:
                    absolute_cue_ids.append(question["id"])
                self.assertIn(question["kind"], profile["validation"]["allowedKinds"])
                self.assertEqual(set(question["source"]), {"file", "section", "text"})
                self.assertEqual(
                    question["source"]["file"], "Giáo trình tư tưởng Hồ Chí Minh.md"
                )
                self.assertTrue(
                    question["source"]["section"].startswith(
                        f"Chương {question['chapterNum']} >"
                    )
                )

        self.assertEqual(absolute_cue_ids, [])

        for chapter_num in range(1, 7):
            chapter_questions = [
                question for question in questions if question["chapterNum"] == chapter_num
            ]
            unique_longest = 0
            correct_length = 0
            distractor_length = 0
            distractor_count = 0
            untied_ranks = [0, 0, 0, 0]
            length_signals: list[tuple[bool, bool]] = []
            for question in chapter_questions:
                lengths = [len(option) for option in question["options"]]
                answer = question["answer"]
                correct = lengths[answer]
                distractors = [length for index, length in enumerate(lengths) if index != answer]
                is_unique_longest = correct > max(distractors)
                is_unique_shortest = correct < min(distractors)
                unique_longest += int(is_unique_longest)
                length_signals.append((is_unique_longest, is_unique_shortest))
                correct_length += correct
                distractor_length += sum(distractors)
                distractor_count += len(distractors)
                if len(set(lengths)) == 4:
                    untied_ranks[sum(length > correct for length in lengths)] += 1
            with self.subTest(chapter=chapter_num, gate="length-bias"):
                self.assertLessEqual(unique_longest / len(chapter_questions), 0.45)
                ratio = (correct_length / len(chapter_questions)) / (
                    distractor_length / distractor_count
                )
                self.assertGreaterEqual(ratio, 0.85)
                self.assertLessEqual(ratio, 1.15)
                if sum(untied_ranks):
                    self.assertLessEqual(max(untied_ranks) / sum(untied_ranks), 0.50)
                for start in range(0, len(length_signals) - 19):
                    window = length_signals[start : start + 20]
                    self.assertLessEqual(sum(longest for longest, _ in window), 14)
                    self.assertLessEqual(sum(shortest for _, shortest in window), 14)

        blueprint_ranges = {
            1: ((1, 9), (10, 14), (15, 29), (30, 35), (36, 45)),
            2: ((1, 11), (12, 26), (27, 30), (31, 60), (61, 75)),
            3: ((1, 18), (19, 37), (38, 54), (55, 66), (67, 74), (75, 88), (89, 100)),
            4: ((1, 8), (9, 43), (44, 63), (64, 75), (76, 82), (83, 95)),
            5: ((1, 24), (25, 38), (39, 46), (47, 62), (63, 75)),
            6: ((1, 9), (10, 23), (24, 29), (30, 46), (47, 57), (58, 74), (75, 90)),
        }
        by_id = {question["id"]: question for question in questions}
        for chapter_num, ranges in blueprint_ranges.items():
            for first, last in ranges:
                group = [
                    by_id[f"HCM202-C{chapter_num:02d}-Q{number:03d}"]
                    for number in range(first, last + 1)
                ]
                signals = []
                for question in group:
                    lengths = [len(option) for option in question["options"]]
                    correct = lengths[question["answer"]]
                    distractors = [
                        length
                        for index, length in enumerate(lengths)
                        if index != question["answer"]
                    ]
                    signals.append((correct > max(distractors), correct < min(distractors)))
                with self.subTest(
                    chapter=chapter_num,
                    blueprint=f"Q{first:03d}-Q{last:03d}",
                    gate="blueprint-length-bias",
                ):
                    self.assertLessEqual(sum(longest for longest, _ in signals) / len(group), 0.60)
                    self.assertLessEqual(sum(shortest for _, shortest in signals) / len(group), 0.60)

        application_ranges = {
            3: range(89, 101),
            4: range(83, 96),
            5: range(63, 76),
            6: range(75, 91),
        }
        for question in questions:
            chapter_range = application_ranges.get(question["chapterNum"])
            question_number = int(question["id"].rsplit("Q", 1)[1])
            if chapter_range is None or question_number not in chapter_range:
                continue
            with self.subTest(question=question["id"], gate="2021-framing"):
                framed_text = " ".join(
                    (
                        question["stem"],
                        question["explanation"],
                        question["source"]["section"],
                    )
                )
                self.assertIn("2021", framed_text)

    def test_vnr202_bank_matches_reviewed_distribution_schema_and_blueprint(self) -> None:
        profile = self.profiles["vnr202"]
        questions = self.load_authored_questions("vnr202")
        self.assertEqual(len(questions), 850)
        self.assertEqual(
            Counter(question["chapterNum"] for question in questions),
            Counter({1: 63, 2: 120, 3: 220, 4: 400, 5: 47}),
        )
        self.assertEqual(
            Counter(question["difficulty"] for question in questions),
            Counter({"Nhận biết": 340, "Thông hiểu": 340, "Vận dụng": 170}),
        )
        self.assertEqual(
            [Counter(question["answer"] for question in questions)[index] for index in range(4)],
            [213, 213, 212, 212],
        )
        expected_fields = {
            "id", "courseId", "chapter", "chapterNum", "topic", "difficulty", "kind",
            "stem", "options", "answer", "explanation", "source",
        }
        ids: set[str] = set()
        stems: set[str] = set()
        chapter_titles = {chapter["number"]: chapter["title"] for chapter in profile["chapters"]}
        for question in questions:
            with self.subTest(question=question["id"]):
                self.assertEqual(set(question), expected_fields)
                self.assertEqual(question["courseId"], "vnr202")
                self.assertRegex(question["id"], r"^VNR202-C\d{2}-Q\d{3}$")
                self.assertNotIn(question["id"], ids)
                ids.add(question["id"])
                stem = normalized_text(question["stem"])
                self.assertNotIn(stem, stems)
                stems.add(stem)
                self.assertEqual(question["chapter"], chapter_titles[question["chapterNum"]])
                self.assertEqual(len(question["options"]), 4)
                self.assertEqual(
                    len({normalized_text(option) for option in question["options"]}), 4
                )
                self.assertIn(question["answer"], range(4))
                self.assertIn(question["kind"], profile["validation"]["allowedKinds"])
                self.assertEqual(set(question["source"]), {"file", "section", "text"})
                self.assertEqual(
                    question["source"]["file"],
                    "gt-lich-su-dang-csvn-ban-tuyen-giao-tw.md",
                )

        blueprint = json.loads(
            (self.content_root / "subjects" / "vnr202" / "blueprint.json").read_text(
                encoding="utf-8"
            )
        )
        covered = [group for group in blueprint["groups"] if group["status"] == "covered"]
        mapped_ids = [question_id for group in covered for question_id in group["questionIds"]]
        self.assertEqual(sum(group["target"] for group in covered), 850)
        self.assertEqual(len(mapped_ids), 850)
        self.assertEqual(len(set(mapped_ids)), 850)
        self.assertEqual(set(mapped_ids), ids)

    def test_mln111_review_signoff_matches_exact_bank_bytes(self) -> None:
        profile = self.profiles["mln111"]
        signoff_path = self.content_root / Path(profile["validation"]["reviewSignoffPath"])
        signoff = json.loads(signoff_path.read_text(encoding="utf-8"))
        questions = self.load_authored_questions("mln111")
        canonical = json.dumps(
            questions, ensure_ascii=False, sort_keys=True, separators=(",", ":")
        ).encode("utf-8")
        self.assertEqual(hashlib.sha256(canonical).hexdigest(), signoff["bankSha256"])
        self.assertEqual(signoff["reviewStatus"], "approved")
        self.assertEqual(signoff["questionCount"], 380)
        self.assertEqual(signoff["review"]["openCritical"], 0)
        self.assertEqual(signoff["review"]["openHigh"], 0)
        self.assertEqual(signoff["review"]["openMedium"], 0)
        for item in profile["questionFiles"]:
            chapter_path = self.content_root / Path(item["path"])
            self.assertEqual(
                hashlib.sha256(chapter_path.read_bytes()).hexdigest(),
                signoff["chapterFileSha256"][chapter_path.name],
            )

    def test_hcm202_review_signoff_matches_exact_bank_bytes(self) -> None:
        profile = self.profiles["hcm202"]
        signoff_path = self.content_root / Path(profile["validation"]["reviewSignoffPath"])
        signoff = json.loads(signoff_path.read_text(encoding="utf-8"))
        questions = self.load_authored_questions("hcm202")
        canonical = json.dumps(
            questions, ensure_ascii=False, sort_keys=True, separators=(",", ":")
        ).encode("utf-8")
        self.assertEqual(hashlib.sha256(canonical).hexdigest(), signoff["bankSha256"])
        self.assertEqual(signoff["reviewStatus"], "approved")
        self.assertEqual(signoff["questionCount"], 480)
        self.assertEqual(signoff["review"]["independentChapterReviews"], 6)
        self.assertEqual(signoff["review"]["openCritical"], 0)
        self.assertEqual(signoff["review"]["openHigh"], 0)
        self.assertEqual(signoff["review"]["openMedium"], 0)
        for item in profile["questionFiles"]:
            chapter_path = self.content_root / Path(item["path"])
            self.assertEqual(
                hashlib.sha256(chapter_path.read_bytes()).hexdigest(),
                signoff["chapterFileSha256"][chapter_path.name],
            )

    def test_mln112_legacy_bank_and_lecture_identity_are_unchanged(self) -> None:
        profile = self.profiles["mln112"]
        questions = self.load_authored_questions("mln112")
        self.assertEqual(len(questions), 504)
        self.assertEqual(
            Counter(question["chapterNum"] for question in questions),
            Counter({1: 64, 2: 89, 3: 99, 4: 84, 5: 84, 6: 84}),
        )
        self.assertEqual(
            Counter(question["difficulty"] for question in questions),
            Counter({"Nhận biết": 204, "Thông hiểu": 204, "Vận dụng": 96}),
        )
        for chapter_num, expected_count in enumerate((64, 89, 99, 84, 84, 84), start=1):
            chapter = [q for q in questions if q["chapterNum"] == chapter_num]
            self.assertEqual(
                [q["id"] for q in chapter],
                [f"C{chapter_num:02d}-Q{index:03d}" for index in range(1, expected_count + 1)],
            )
        lectures = json.loads(
            (self.content_root / Path(profile["lectureManifest"])).read_text(encoding="utf-8")
        )
        self.assertEqual(lectures["playlistId"], "PLAN8e5g76wQs")
        self.assertEqual(
            [lecture["videoId"] for lecture in lectures["lectures"]],
            ["IN62DsH0neI", "eSNZjv3diE0", "TrG62r4VHsc", "BhjrFABpLdI", "rNZSe5YgryI", "HzMbw07P2RQ"],
        )
        self.assertEqual(
            [lecture["chapterNum"] for lecture in lectures["lectures"]],
            [1, 2, 3, 4, 5, 6],
        )


class SubjectCatalogMutationTests(unittest.TestCase):
    def make_content_fixture(self) -> tuple[tempfile.TemporaryDirectory, Path]:
        directory = tempfile.TemporaryDirectory()
        root = Path(directory.name)
        shutil.copytree(BASE / "content", root / "content")
        return directory, root

    @staticmethod
    def mutate_json(path: Path, mutate) -> None:
        value = json.loads(path.read_text(encoding="utf-8"))
        mutate(value)
        path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    def test_production_registry_and_profiles_load_in_declared_order(self) -> None:
        registry, profiles = load_subjects(BASE)
        self.assertEqual(
            [profile.id for profile in profiles],
            ["mln111", "mln112", "mln131", "hcm202", "vnr202"],
        )
        self.assertEqual(registry.canonical_id("mln222"), "mln112")
        self.assertEqual(registry.canonical_id("MLN122"), "mln112")
        self.assertEqual(registry.canonical_id("vnr201"), "vnr202")
        self.assertEqual(registry.canonical_id("VNR201"), "vnr202")
        self.assertIsNone(registry.canonical_id("hcm201"))
        self.assertIsNone(registry.canonical_id("__proto__"))

    def test_composer_derives_subject_chapter_ids_without_rewriting_question_ids(self) -> None:
        _, profiles = load_subjects(BASE)
        by_id = {profile.id: profile for profile in profiles}
        mln111 = compose_subject(BASE, by_id["mln111"])
        mln112 = compose_subject(BASE, by_id["mln112"])
        mln131 = compose_subject(BASE, by_id["mln131"])
        hcm202 = compose_subject(BASE, by_id["hcm202"])
        vnr202 = compose_subject(BASE, by_id["vnr202"])
        self.assertEqual(len(mln111), 380)
        self.assertEqual(len(mln112), 504)
        self.assertEqual(len(mln131), 280)
        self.assertEqual(len(hcm202), 480)
        self.assertEqual(len(vnr202), 850)
        self.assertEqual(mln111[0]["id"], "MLN111-C01-Q001")
        self.assertEqual(mln111[-1]["id"], "MLN111-C03-Q160")
        self.assertEqual(mln112[0]["id"], "C01-Q001")
        self.assertEqual(mln112[-1]["id"], "C06-Q084")
        self.assertEqual(hcm202[0]["id"], "HCM202-C01-Q001")
        self.assertEqual(hcm202[-1]["id"], "HCM202-C06-Q090")
        self.assertEqual(vnr202[0]["id"], "VNR202-C01-Q001")
        self.assertEqual(vnr202[-1]["id"], "VNR202-C05-Q047")
        self.assertEqual(mln111[0]["chapterId"], "mln111-c01")
        self.assertEqual(mln112[-1]["chapterId"], "mln112-c06")
        self.assertEqual(hcm202[0]["chapterId"], "hcm202-c01")
        self.assertEqual(hcm202[-1]["chapterId"], "hcm202-c06")
        self.assertEqual(vnr202[0]["chapterId"], "vnr202-c01")
        self.assertEqual(vnr202[-1]["chapterId"], "vnr202-c05")
        self.assertEqual([question["num"] for question in mln111], list(range(1, 381)))
        self.assertEqual([question["num"] for question in mln112], list(range(1, 505)))
        self.assertEqual([question["num"] for question in hcm202], list(range(1, 481)))
        self.assertEqual([question["num"] for question in vnr202], list(range(1, 851)))

    def test_registry_rejects_unknown_fields_and_reserved_or_duplicate_ids(self) -> None:
        mutations = {
            "unknown field": lambda value: value.update({"unexpected": True}),
            "reserved id": lambda value: value["subjects"][0].update({"id": "prototype"}),
            "duplicate id": lambda value: value["subjects"][1].update({"id": "mln111"}),
            "alias collision": lambda value: value["subjects"][0]["legacyAliases"].append("mln112"),
        }
        for label, mutate in mutations.items():
            with self.subTest(case=label):
                directory, root = self.make_content_fixture()
                with directory:
                    path = root / "content" / "subjects" / "registry.json"
                    self.mutate_json(path, mutate)
                    with self.assertRaises(CatalogError):
                        load_registry(root)

    def test_registry_rejects_traversal_and_oversized_input_before_parse(self) -> None:
        directory, root = self.make_content_fixture()
        with directory:
            path = root / "content" / "subjects" / "registry.json"
            self.mutate_json(
                path,
                lambda value: value["subjects"][0].update(
                    {"metadataPath": "subjects/../subjects/mln111/subject.json"}
                ),
            )
            with self.assertRaises(CatalogError):
                load_registry(root)

        directory, root = self.make_content_fixture()
        with directory:
            path = root / "content" / "subjects" / "registry.json"
            path.write_bytes(b" " * (256 * 1024 + 1))
            with self.assertRaisesRegex(CatalogError, "exceeds"):
                load_registry(root)

    def test_profile_rejects_unknown_fields_duplicate_chapters_and_missing_bank(self) -> None:
        mutations = {
            "unknown field": lambda value: value.update({"unexpected": True}),
            "duplicate chapter": lambda value: value["chapters"][1].update(
                {"id": value["chapters"][0]["id"]}
            ),
            "missing bank": lambda value: value["questionFiles"][0].update(
                {"path": "subjects/mln111/chapters/missing.json"}
            ),
            "lecture mismatch": lambda value: value["features"].update({"lectures": True}),
            "ready copy review": lambda value: value.update({"copyReviewRequired": True}),
            "missing ready sign-off": lambda value: value["validation"].update(
                {"reviewSignoffPath": None}
            ),
        }
        for label, mutate in mutations.items():
            with self.subTest(case=label):
                directory, root = self.make_content_fixture()
                with directory:
                    path = root / "content" / "subjects" / "mln111" / "subject.json"
                    self.mutate_json(path, mutate)
                    registry = load_registry(root)
                    with self.assertRaises(CatalogError):
                        load_subject_profile(root, registry.items[0], registry=registry)

    def test_profile_rejects_active_placeholder_and_hostile_unicode(self) -> None:
        directory, root = self.make_content_fixture()
        with directory:
            registry_path = root / "content" / "subjects" / "registry.json"
            self.mutate_json(
                registry_path,
                lambda value: value["subjects"][4].update({"status": "comingSoon"}),
            )
            path = root / "content" / "subjects" / "vnr202" / "subject.json"
            self.mutate_json(
                path,
                lambda value: value.update(
                    {"status": "comingSoon", "studyReady": False, "copyReviewRequired": True}
                ),
            )
            registry = load_registry(root)
            with self.assertRaises(CatalogError):
                load_subject_profile(root, registry.items[4], registry=registry)

        for payload in ("Tên\x00môn", "Tên\u202emôn", "Trie\u0302t ho\u0323c"):
            with self.subTest(payload=ascii(payload)):
                directory, root = self.make_content_fixture()
                with directory:
                    path = root / "content" / "subjects" / "mln111" / "subject.json"
                    self.mutate_json(path, lambda value, payload=payload: value.update({"title": payload}))
                    registry = load_registry(root)
                    with self.assertRaises(CatalogError):
                        load_subject_profile(root, registry.items[0], registry=registry)

    def test_draft_catalog_reports_authored_progress_without_publishing_bank(self) -> None:
        directory, root = self.make_content_fixture()
        with directory:
            registry_path = root / "content" / "subjects" / "registry.json"
            self.mutate_json(
                registry_path,
                lambda value: value["subjects"][0].update({"status": "draft"}),
            )
            profile_path = root / "content" / "subjects" / "mln111" / "subject.json"
            self.mutate_json(
                profile_path,
                lambda value: value.update(
                    {"status": "draft", "studyReady": False, "copyReviewRequired": True}
                ),
            )
            for chapter_num in range(1, 4):
                chapter_path = (
                    root
                    / "content"
                    / "subjects"
                    / "mln111"
                    / "chapters"
                    / f"chapter-{chapter_num:02d}.json"
                )
                self.mutate_json(
                    chapter_path,
                    lambda value: value.__setitem__(slice(1, None), []),
                )

            subjects, banks, _ = build_catalogs(root)
            draft = next(subject for subject in subjects if subject["id"] == "mln111")
            self.assertEqual(draft["status"], "draft")
            self.assertFalse(draft["studyReady"])
            self.assertEqual(draft["questionCount"], 3)
            self.assertEqual(
                [chapter["questionCount"] for chapter in draft["chapters"]],
                [1, 1, 1],
            )
            self.assertNotIn("mln111", banks)


class ProfileValidatorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        _, profiles = load_subjects(BASE)
        cls.profiles = {profile.id: profile for profile in profiles}

    def validate_mutated_subject(self, subject_id: str, mutate):
        profile = self.profiles[subject_id]
        questions = compose_subject(BASE, profile)
        mutate(questions)
        return validate_subject(profile, questions, root=BASE, check_similarity=False)

    def test_ready_subjects_and_draft_validate_from_profiles(self) -> None:
        for subject_id in ("mln111", "mln112", "mln131", "hcm202", "vnr202"):
            profile = self.profiles[subject_id]
            result = validate_subject(
                profile, compose_subject(BASE, profile), root=BASE, check_similarity=False
            )
            with self.subTest(subject=subject_id):
                self.assertEqual(result.errors, ())
                self.assertEqual(result.warnings, ())
                self.assertTrue(result.study_ready)
                self.assertEqual(result.question_count, profile.question_target)

    def test_validator_rejects_subject_identity_schema_and_chapter_mutations(self) -> None:
        mutations = {
            "wrong course": lambda questions: questions[0].update({"courseId": "mln112"}),
            "unknown chapter": lambda questions: questions[0].update({"chapterId": "mln111-c99"}),
            "duplicate logical id": lambda questions: questions[1].update({"id": questions[0]["id"]}),
            "unknown field": lambda questions: questions[0].update({"unexpected": True}),
        }
        for label, mutate in mutations.items():
            with self.subTest(case=label):
                result = self.validate_mutated_subject("mln111", mutate)
                self.assertTrue(result.errors)
                self.assertFalse(result.study_ready)

    def test_validator_rejects_source_markup_controls_and_wrong_page(self) -> None:
        cases = (
            ("mln111", lambda questions: questions[0]["source"].update({"text": "<img src=x onerror=alert(1)>"})),
            ("mln111", lambda questions: questions[0]["source"].update({"file": []})),
            ("mln111", lambda questions: questions[0].update({"stem": "Nội dung\u202eđảo chiều"})),
            ("mln112", lambda questions: questions[0]["source"].update({"page": 999})),
        )
        for subject_id, mutate in cases:
            with self.subTest(subject=subject_id):
                result = self.validate_mutated_subject(subject_id, mutate)
                self.assertTrue(result.errors)
                self.assertFalse(result.study_ready)

    def test_content_change_invalidates_signed_readiness(self) -> None:
        for subject_id in ("mln111", "hcm202"):
            with self.subTest(subject=subject_id), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                shutil.copytree(BASE / "content", root / "content")
                chapter_path = (
                    root / "content" / "subjects" / subject_id / "chapters" / "chapter-01.json"
                )
                chapter = json.loads(chapter_path.read_text(encoding="utf-8"))
                chapter[0]["explanation"] += " Nội dung chưa ký."
                chapter_path.write_text(
                    json.dumps(chapter, ensure_ascii=False, indent=2) + "\n",
                    encoding="utf-8",
                )
                _, profiles = load_subjects(root)
                profile = next(item for item in profiles if item.id == subject_id)
                result = validate_subject(
                    profile, compose_subject(root, profile), root=root, check_similarity=False
                )
                self.assertTrue(any("sign-off" in error.casefold() for error in result.errors))
                self.assertFalse(result.study_ready)

    def test_review_signoff_requires_one_independent_review_per_chapter(self) -> None:
        for subject_id in ("mln111", "hcm202"):
            with self.subTest(subject=subject_id), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                shutil.copytree(BASE / "content", root / "content")
                signoff_path = (
                    root / "content" / "subjects" / subject_id / "review-signoff.json"
                )
                signoff = json.loads(signoff_path.read_text(encoding="utf-8"))
                signoff["review"]["independentChapterReviews"] = 0
                signoff_path.write_text(
                    json.dumps(signoff, ensure_ascii=False, indent=2) + "\n",
                    encoding="utf-8",
                )
                _, profiles = load_subjects(root)
                profile = next(item for item in profiles if item.id == subject_id)
                result = validate_subject(
                    profile, compose_subject(root, profile), root=root, check_similarity=False
                )
                self.assertTrue(
                    any(
                        "one independent review per chapter" in error.casefold()
                        for error in result.errors
                    )
                )
                self.assertFalse(result.study_ready)


class CatalogBuildTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        (
            cls.subject_catalog,
            cls.question_banks,
            cls.lecture_catalogs,
            cls.rendered_html,
        ) = catalog_test_fixture()

    def test_catalogs_publish_only_ready_banks_and_declared_features(self) -> None:
        self.assertEqual(
            [subject["id"] for subject in self.subject_catalog],
            ["mln111", "mln112", "mln131", "hcm202", "vnr202"],
        )
        self.assertEqual(
            set(self.question_banks), {"mln111", "mln112", "mln131", "hcm202", "vnr202"}
        )
        self.assertEqual(set(self.lecture_catalogs), {"mln112"})
        self.assertEqual(len(self.question_banks["mln111"]), 380)
        self.assertEqual(len(self.question_banks["mln112"]), 504)
        self.assertEqual(len(self.question_banks["hcm202"]), 480)
        self.assertEqual(len(self.question_banks["mln131"]), 280)
        self.assertEqual(len(self.question_banks["vnr202"]), 850)
        by_id = {subject["id"]: subject for subject in self.subject_catalog}
        self.assertEqual(by_id["mln111"]["questionCount"], 380)
        self.assertEqual(by_id["mln112"]["questionCount"], 504)
        self.assertEqual(by_id["hcm202"]["questionCount"], 480)
        self.assertEqual(by_id["vnr202"]["questionCount"], 850)
        self.assertEqual(by_id["mln111"]["features"], {
            "flashcards": True, "game": False, "lectures": False,
            "quiz": True, "search": True,
        })
        self.assertEqual(by_id["hcm202"]["features"], {
            "flashcards": True, "game": False, "lectures": False,
            "quiz": True, "search": True,
        })
        self.assertEqual(by_id["vnr202"]["features"], {
            "flashcards": True, "game": False, "lectures": False,
            "quiz": True, "search": True,
        })
        self.assertEqual(by_id["vnr202"]["legacyAliases"], ["vnr201"])
        self.assertEqual(by_id["mln131"]["questionCount"], 280)
        self.assertTrue(by_id["mln131"]["studyReady"])

    def test_public_projection_has_exact_fields_and_no_authoring_evidence(self) -> None:
        for subject in self.subject_catalog:
            self.assertEqual(tuple(subject), PUBLIC_SUBJECT_FIELDS)
        for subject_id, questions in self.question_banks.items():
            for question in questions:
                with self.subTest(subject=subject_id, question=question["id"]):
                    self.assertEqual(tuple(question), PUBLIC_QUESTION_FIELDS)
                    self.assertEqual(set(question["source"]), {"label", "section"})
                    self.assertNotIn("courseId", question)
        serialized = serialize_for_inline_script(
            [self.subject_catalog, self.question_banks, self.lecture_catalogs]
        )
        for forbidden in (
            "sourcePolicy", "reviewSignoffPath", "questionFiles", "chapterFileSha256",
            "Giáo trình Triết học Mác-Lênin.md",
            "Giáo trình tư tưởng Hồ Chí Minh.md",
            "gt-lich-su-dang-csvn-ban-tuyen-giao-tw.md",
            "GIAO-TRINH-KINH-TE-CHINH-TRI-MAC-LENIN-BO-GIAO-DUC-VA-DAO-TAO.pdf",
            '"text":', "F:\\MLN111", "F:\\MLN222", "F:\\Kỳ 9",
        ):
            self.assertNotIn(forbidden, serialized)

    def test_lecture_projection_has_stable_chapter_ids_and_video_identity(self) -> None:
        manifest = self.lecture_catalogs["mln112"]
        self.assertEqual(manifest["playlistId"], "PLAN8e5g76wQs")
        self.assertEqual(
            [lecture["chapterId"] for lecture in manifest["lectures"]],
            [f"mln112-c{chapter:02d}" for chapter in range(1, 7)],
        )
        self.assertEqual(
            [lecture["videoId"] for lecture in manifest["lectures"]],
            ["IN62DsH0neI", "eSNZjv3diE0", "TrG62r4VHsc", "BhjrFABpLdI", "rNZSe5YgryI", "HzMbw07P2RQ"],
        )
        self.assertTrue(all("chapterValue" not in lecture for lecture in manifest["lectures"]))

    def test_hardened_accessors_keep_game_alias_fixed_to_mln112(self) -> None:
        source = catalog_accessor_source()
        self.assertIn("Object.create(null)", source)
        self.assertIn("Object.hasOwn(SUBJECT_BY_ID,id)", source)
        self.assertIn("Object.hasOwn(QUESTION_BANKS,id)", source)
        self.assertIn("Object.hasOwn(LECTURE_CATALOGS,id)", source)
        self.assertIn("value:getQuestionBank('mln112')", source)
        self.assertIn("writable:false,configurable:false", source)
        self.assertNotIn("activeSubject", source)

    def test_catalog_renderer_is_deterministic_and_replaces_every_placeholder(self) -> None:
        template = """<!doctype html><style>/*__GAME_STYLES__*/</style><body>
<script>const SUBJECT_CATALOG=/*__SUBJECT_CATALOG__*/[];
const QUESTION_BANKS=/*__QUESTION_BANKS__*/{};
const LECTURE_CATALOGS=/*__LECTURE_CATALOGS__*/{};
const GAME_DATA=/*__GAME_DATA__*/{};</script>
<!--__GAME_SVG__--><i style="--map:url('__GAME_MAP_TEXTURE__')"></i>
<script>/*__GAME_SCRIPTS__*/</script></body>"""
        game_assets = {
            "data": {"balance": {"version": 1}},
            "styles": ["body{color:#fff}"],
            "scripts": ["globalThis.__gameFixture=true;"],
            "svg": '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
            "images": {"mapTexture": "data:image/webp;base64,UklGRg=="},
        }
        rendered_once = render_catalog_html(
            template, self.subject_catalog, self.question_banks, self.lecture_catalogs,
            game_assets,
        )
        rendered_twice = render_catalog_html(
            template, self.subject_catalog, self.question_banks, self.lecture_catalogs,
            game_assets,
        )
        self.assertEqual(rendered_once, rendered_twice)
        for placeholder in (
            SUBJECT_CATALOG_PLACEHOLDER, QUESTION_BANKS_PLACEHOLDER,
            LECTURE_CATALOGS_PLACEHOLDER, GAME_DATA_PLACEHOLDER,
            GAME_STYLES_PLACEHOLDER, GAME_SCRIPTS_PLACEHOLDER,
            GAME_SVG_PLACEHOLDER, GAME_MAP_TEXTURE_PLACEHOLDER,
        ):
            self.assertNotIn(placeholder, rendered_once)

    def test_artifact_measurement_budget_and_manifest_are_deterministic(self) -> None:
        payload = "<style>body{color:red}</style><script>const a=1;</script>"
        self.assertEqual(measure_artifact(payload), measure_artifact(payload))
        self.assertEqual(inline_csp_hashes(payload), inline_csp_hashes(payload))
        self.assertEqual(enforce_artifact_budget(payload)["rawBytes"], len(payload))
        with self.assertRaisesRegex(ValueError, "exceeds"):
            enforce_artifact_budget(payload, raw_limit=1, gzip_limit=1)
        first = build_release_manifest({"index.html": payload}, subject_counts={"mln112": 504, "mln111": 380})
        second = build_release_manifest({"index.html": payload}, subject_counts={"mln111": 380, "mln112": 504})
        self.assertEqual(first, second)
        self.assertEqual(list(first["subjects"]), ["mln111", "mln112"])
        self.assertTrue(first["csp"]["scriptSrcHashes"])
        self.assertTrue(first["csp"]["styleSrcHashes"])

    def test_release_stage_promotes_synced_allowlist_manifest_and_vercel(self) -> None:
        payload = "<style>body{color:red}</style><script>const a=1;</script>"
        input_snapshot = {"template.html": "a" * 64, "build_html.py": "b" * 64}
        manifest = build_release_manifest(
            {"index.html": payload},
            subject_counts={"mln111": 380, "mln112": 504},
            input_snapshot=input_snapshot,
        )
        config = build_vercel_config(manifest["csp"])
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "index.html").write_text("old-index", encoding="utf-8")
            (root / "vercel.json").write_text("old-config", encoding="utf-8")
            (root / "dist").mkdir()
            (root / "dist" / "old.txt").write_text("old-dist", encoding="utf-8")
            staging = stage_release_artifacts(root, payload, manifest, config)
            promote_release(staging, root)
            self.assertFalse(staging.exists())
            self.assertEqual((root / "index.html").read_text(encoding="utf-8"), payload)
            self.assertEqual(
                {path.name for path in (root / "dist").iterdir()},
                {"index.html", "release-manifest.json"},
            )
            self.assertEqual(
                json.loads((root / "dist" / "release-manifest.json").read_text(encoding="utf-8")),
                manifest,
            )
            self.assertEqual(
                json.loads((root / "vercel.json").read_text(encoding="utf-8")),
                config,
            )

    def test_invalid_release_stage_preserves_previous_release(self) -> None:
        payload = "<style>body{color:red}</style><script>const a=1;</script>"
        snapshot = {"template.html": "c" * 64}
        manifest = build_release_manifest(
            {"index.html": payload}, subject_counts={"mln111": 380}, input_snapshot=snapshot
        )
        config = build_vercel_config(manifest["csp"])
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "index.html").write_bytes(b"previous-index")
            (root / "vercel.json").write_bytes(b"previous-config")
            (root / "dist").mkdir()
            (root / "dist" / "previous.txt").write_bytes(b"previous-dist")
            before = {
                "index": (root / "index.html").read_bytes(),
                "vercel": (root / "vercel.json").read_bytes(),
                "dist": (root / "dist" / "previous.txt").read_bytes(),
            }
            staging = stage_release_artifacts(root, payload, manifest, config)
            (staging / "dist" / "unexpected.txt").write_text("reject", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "allowlist"):
                promote_release(staging, root)
            self.assertEqual((root / "index.html").read_bytes(), before["index"])
            self.assertEqual((root / "vercel.json").read_bytes(), before["vercel"])
            self.assertEqual((root / "dist" / "previous.txt").read_bytes(), before["dist"])
            discard_release_staging(staging, root)
            self.assertFalse(staging.exists())

    def test_input_snapshot_is_stable_and_covers_declared_sources(self) -> None:
        first = snapshot_input_manifest(BASE)
        second = snapshot_input_manifest(BASE)
        self.assertEqual(first, second)
        for required in (
            "content/subjects/registry.json",
            "content/subjects/mln111/subject.json",
            "content/subjects/mln111/review-signoff.json",
            "content/subjects/mln111/chapters/chapter-01.json",
            "content/subjects/hcm202/subject.json",
            "content/subjects/hcm202/review-signoff.json",
            "content/subjects/hcm202/chapters/chapter-01.json",
            "content/subjects/hcm202/chapters/chapter-02.json",
            "content/subjects/hcm202/chapters/chapter-03.json",
            "content/subjects/hcm202/chapters/chapter-04.json",
            "content/subjects/hcm202/chapters/chapter-05.json",
            "content/subjects/hcm202/chapters/chapter-06.json",
            "content/subjects/vnr202/subject.json",
            "content/subjects/vnr202/chapters/chapter-01.json",
            "content/subjects/vnr202/chapters/chapter-02.json",
            "content/subjects/vnr202/chapters/chapter-03.json",
            "content/subjects/vnr202/chapters/chapter-04.json",
            "content/subjects/vnr202/chapters/chapter-05.json",
            "content/subjects/mln112/subject.json",
            "content/chapters/chapter-01.json",
            "content/lectures.json",
            "game/build-manifest.json",
            "template.html",
            "subject_catalog.py",
            "compose_questions.py",
            "validate_questions.py",
            "build_html.py",
        ):
            self.assertIn(required, first)
        self.assertEqual(
            canonical_input_snapshot_sha256(first), canonical_input_snapshot_sha256(second)
        )
        self.assertTrue(all(re.fullmatch(r"[0-9a-f]{64}", digest) for digest in first.values()))

class ValidatorUnitTests(unittest.TestCase):
    def test_real_circulation_formula_is_not_truncation(self) -> None:
        self.assertFalse(has_truncation_ellipsis("T - H ... SX ... H' - T'"))

    def test_cut_sentence_is_truncation(self) -> None:
        self.assertTrue(has_truncation_ellipsis("Nội dung bị cắt giữa chừng..."))

    def test_prime_marks_remain_semantically_distinct(self) -> None:
        self.assertNotEqual(normalize_option("H - T - H"), normalize_option("H - T - H'"))

    def validate_mutated_bank(self, mutate) -> list[str]:
        questions = json.loads((BASE / "questions.json").read_text(encoding="utf-8"))
        mutate(questions)
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "questions.json"
            path.write_text(json.dumps(questions, ensure_ascii=False), encoding="utf-8")
            errors, _, _ = validate_file(
                path,
                write_report=False,
                check_similarity=False,
            )
        return errors

    def test_chapter_metadata_must_match_canonical_label(self) -> None:
        errors = self.validate_mutated_bank(
            lambda questions: questions[0].update({"chapter": "Chương tùy ý"})
        )
        self.assertTrue(any("chapter không khớp" in error for error in errors))

    def test_chapter_number_rejects_numeric_string(self) -> None:
        errors = self.validate_mutated_bank(
            lambda questions: questions[0].update({"chapterNum": "1"})
        )
        self.assertTrue(any("chapterNum phải là số nguyên" in error for error in errors))

    def test_slide_number_rejects_markup_payload(self) -> None:
        errors = self.validate_mutated_bank(
            lambda questions: questions[0]["source"]["slide"].update(
                {"number": '<img src=x onerror="alert(1)">' }
            )
        )
        self.assertTrue(any("source.slide.number" in error for error in errors))

    def test_invalid_nested_json_types_return_errors_instead_of_crashing(self) -> None:
        def mutate(questions) -> None:
            questions[0]["stem"] = 123
            questions[0]["difficulty"] = []
            questions[0]["kind"] = {}
            questions[0]["options"][0] = 42

        errors = self.validate_mutated_bank(mutate)
        self.assertTrue(any("stem phải là chuỗi" in error for error in errors))
        self.assertTrue(any("difficulty không hợp lệ" in error for error in errors))
        self.assertTrue(any("kind không hợp lệ" in error for error in errors))
        self.assertTrue(any("phương án 1 không hợp lệ" in error for error in errors))

    def test_html_tags_are_rejected_from_authored_text(self) -> None:
        errors = self.validate_mutated_bank(
            lambda questions: questions[0].update(
                {"explanation": '<script>alert("x")</script>'}
            )
        )
        self.assertTrue(any("explanation chứa thẻ HTML" in error for error in errors))

    def test_repeated_answer_cycles_are_detected(self) -> None:
        self.assertEqual(find_repeated_answer_cycle([0, 1, 2, 3] * 3), (0, 4))
        self.assertIsNone(find_repeated_answer_cycle([2, 0, 3, 1, 1, 3, 0, 2, 3, 1, 0, 3]))

    def test_validator_rejects_repeated_answer_cycles(self) -> None:
        def mutate(questions) -> None:
            chapter = [question for question in questions if question["chapterNum"] == 1]
            for index, question in enumerate(chapter):
                question["answer"] = index % 4

        errors = self.validate_mutated_bank(mutate)
        self.assertTrue(any("đáp án lặp chu kỳ" in error for error in errors))

    @staticmethod
    def set_chapter_one_expansion_lengths(
        questions: list[dict],
        correct_length: int,
        distractor_lengths: tuple[int, int, int],
    ) -> None:
        for question in questions:
            if question["chapterNum"] != 1 or int(question["id"].split("Q")[1]) < 31:
                continue
            distractor_index = 0
            for option_index in range(4):
                if option_index == question["answer"]:
                    length = correct_length
                else:
                    length = distractor_lengths[distractor_index]
                    distractor_index += 1
                label = f"Lua chon {question['id']} {option_index} "
                question["options"][option_index] = label + "x" * (length - len(label))

    def test_expansion_validator_rejects_long_correct_answer_bias(self) -> None:
        errors = self.validate_mutated_bank(
            lambda questions: self.set_chapter_one_expansion_lengths(
                questions, 90, (50, 52, 54)
            )
        )
        self.assertTrue(any("dài nhất duy nhất" in error for error in errors))
        self.assertTrue(any("dài hơn nhiễu trung bình" in error for error in errors))

    def test_expansion_validator_rejects_short_correct_answer_bias(self) -> None:
        errors = self.validate_mutated_bank(
            lambda questions: self.set_chapter_one_expansion_lengths(
                questions, 40, (80, 82, 84)
            )
        )
        self.assertTrue(any("ngắn nhất duy nhất" in error for error in errors))
        self.assertTrue(any("ngắn hơn nhiễu trung bình" in error for error in errors))

    def test_inline_script_serializer_neutralizes_html_parser_sequences(self) -> None:
        data = [{"text": "<!--<script </script>\u2028\u2029"}]
        payload = serialize_for_inline_script(data)
        self.assertNotIn("<", payload)
        self.assertIn("\\u003c", payload)
        self.assertIn("\\u2028", payload)
        self.assertIn("\\u2029", payload)
        self.assertEqual(json.loads(payload), data)

    def test_render_requires_every_placeholder_exactly_once(self) -> None:
        assets = load_game_assets(BASE)
        lectures = load_lectures(BASE)
        questions = json.loads((BASE / "questions.json").read_text(encoding="utf-8"))
        template = (BASE / "template.html").read_text(encoding="utf-8")
        for placeholder in (
            PLACEHOLDER,
            LECTURES_PLACEHOLDER,
            GAME_DATA_PLACEHOLDER,
            GAME_STYLES_PLACEHOLDER,
            GAME_SCRIPTS_PLACEHOLDER,
            GAME_SVG_PLACEHOLDER,
            GAME_MAP_TEXTURE_PLACEHOLDER,
        ):
            with self.subTest(placeholder=placeholder):
                with self.assertRaises(ValueError):
                    render_html(
                        template.replace(placeholder, "", 1),
                        questions,
                        assets,
                        lectures,
                    )

    def test_lecture_manifest_has_six_ordered_youtube_videos(self) -> None:
        manifest = load_lectures(BASE)
        self.assertEqual(manifest["provider"], "youtube")
        self.assertEqual(manifest["playlistId"], "PLAN8e5g76wQs")
        self.assertEqual(
            [lecture["videoId"] for lecture in manifest["lectures"]],
            [
                "IN62DsH0neI",
                "eSNZjv3diE0",
                "TrG62r4VHsc",
                "BhjrFABpLdI",
                "rNZSe5YgryI",
                "HzMbw07P2RQ",
            ],
        )
        self.assertEqual(
            [lecture["chapterNum"] for lecture in manifest["lectures"]],
            list(range(1, 7)),
        )
        serialized = json.dumps(manifest)
        self.assertNotRegex(serialized, r"https?://|[A-Za-z]:\\")

    def test_lecture_manifest_rejects_duplicate_video_ids(self) -> None:
        manifest = load_lectures(BASE)
        manifest["lectures"][1]["videoId"] = manifest["lectures"][0]["videoId"]
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            content = root / "content"
            content.mkdir()
            (content / "lectures.json").write_text(
                json.dumps(manifest, ensure_ascii=False),
                encoding="utf-8",
            )
            with self.assertRaisesRegex(ValueError, "must be unique"):
                load_lectures(root)

    def test_lecture_manifest_rejects_boolean_integer_fields(self) -> None:
        for field in ("chapterNum", "durationSeconds"):
            with self.subTest(field=field), tempfile.TemporaryDirectory() as directory:
                manifest = load_lectures(BASE)
                manifest["lectures"][0][field] = True
                root = Path(directory)
                content = root / "content"
                content.mkdir()
                (content / "lectures.json").write_text(
                    json.dumps(manifest, ensure_ascii=False),
                    encoding="utf-8",
                )
                with self.assertRaisesRegex(ValueError, "invalid metadata"):
                    load_lectures(root)

    def test_game_manifest_cannot_escape_game_directory(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            shutil.copytree(BASE / "game", root / "game")
            manifest_path = root / "game" / "build-manifest.json"
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            manifest["scripts"][0] = "../outside.js"
            (root / "outside.js").write_text("", encoding="utf-8")
            manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "escapes game"):
                load_game_assets(root)

    def test_game_svg_rejects_active_content(self) -> None:
        payloads = (
            '<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>',
            '<svg xmlns="http://www.w3.org/2000/svg"><style>@import url(https://example.com/map.css)</style></svg>',
        )
        for payload in payloads:
            with self.subTest(payload=payload), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                shutil.copytree(BASE / "game", root / "game")
                svg_path = root / "game" / "assets" / "vietnam-map.svg"
                svg_path.write_text(payload, encoding="utf-8")
                with self.assertRaisesRegex(ValueError, "forbidden element"):
                    load_game_assets(root)

    def test_game_stylesheet_rejects_runtime_asset_references(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            shutil.copytree(BASE / "game", root / "game")
            manifest = json.loads((root / "game" / "build-manifest.json").read_text(encoding="utf-8"))
            style_path = root / "game" / manifest["styles"][0]
            style_path.write_text('@import "https://example.com/game.css";', encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "unsafe inline sequence"):
                load_game_assets(root)


class ProductionBankTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        (
            cls.subject_catalog,
            cls.question_banks,
            cls.lecture_catalogs,
            cls.rendered_html,
        ) = catalog_test_fixture()

    def test_expanded_bank_distribution(self) -> None:
        questions = json.loads((BASE / "questions.json").read_text(encoding="utf-8"))
        self.assertEqual(len(questions), 504)
        self.assertEqual(
            Counter(question["chapterNum"] for question in questions),
            Counter({1: 64, 2: 89, 3: 99, 4: 84, 5: 84, 6: 84}),
        )
        self.assertEqual(
            Counter(question["difficulty"] for question in questions),
            Counter({"Nhận biết": 204, "Thông hiểu": 204, "Vận dụng": 96}),
        )

    def test_answer_order_and_expansion_length_do_not_leak_keys(self) -> None:
        questions = json.loads((BASE / "questions.json").read_text(encoding="utf-8"))
        starts = {1: 31, 2: 56, 3: 66, 4: 51, 5: 51, 6: 51}
        for chapter_num, start in starts.items():
            chapter = [q for q in questions if q["chapterNum"] == chapter_num]
            self.assertIsNone(find_repeated_answer_cycle([q["answer"] for q in chapter]))
            expansion = chapter[start - 1 :]
            unique_longest = 0
            longest_or_tied = 0
            unique_shortest = 0
            shortest_or_tied = 0
            correct_total = 0
            distractor_total = 0
            for question in expansion:
                lengths = [len(option.strip()) for option in question["options"]]
                longest = max(lengths)
                shortest = min(lengths)
                answer = question["answer"]
                correct_total += lengths[answer]
                distractor_total += sum(
                    length for option_index, length in enumerate(lengths) if option_index != answer
                )
                if lengths[answer] == longest:
                    longest_or_tied += 1
                    if lengths.count(longest) == 1:
                        unique_longest += 1
                if lengths[answer] == shortest:
                    shortest_or_tied += 1
                    if lengths.count(shortest) == 1:
                        unique_shortest += 1
            self.assertLessEqual(unique_longest, 9)
            self.assertLessEqual(longest_or_tied, 12)
            self.assertLessEqual(unique_shortest, 9)
            self.assertLessEqual(shortest_or_tied, 12)
            correct_average = correct_total / len(expansion)
            distractor_average = distractor_total / (3 * len(expansion))
            self.assertLessEqual(abs(correct_average - distractor_average), 4.0)

    def test_production_bank_is_valid(self) -> None:
        errors, warnings, _ = validate_file(BASE / "questions.json", write_report=False)
        self.assertEqual(errors, [])
        self.assertEqual(warnings, [])

    def test_production_bank_matches_chapter_sources(self) -> None:
        expected: list[dict] = []
        for chapter_num in range(1, 7):
            chapter_path = BASE / "content" / "chapters" / f"chapter-{chapter_num:02d}.json"
            items = json.loads(chapter_path.read_text(encoding="utf-8"))
            for item in items:
                question = dict(item)
                question["num"] = len(expected) + 1
                expected.append(question)

        actual = json.loads((BASE / "questions.json").read_text(encoding="utf-8"))
        self.assertEqual(actual, expected)

    def test_built_html_is_standalone(self) -> None:
        template = (BASE / "template.html").read_text(encoding="utf-8")
        html = self.rendered_html
        self.assertEqual(template.count(SUBJECT_CATALOG_PLACEHOLDER), 1)
        self.assertEqual(template.count(QUESTION_BANKS_PLACEHOLDER), 1)
        self.assertEqual(template.count(LECTURE_CATALOGS_PLACEHOLDER), 1)
        for placeholder in (
            SUBJECT_CATALOG_PLACEHOLDER,
            QUESTION_BANKS_PLACEHOLDER,
            LECTURE_CATALOGS_PLACEHOLDER,
            GAME_DATA_PLACEHOLDER,
            GAME_SCRIPTS_PLACEHOLDER,
            GAME_STYLES_PLACEHOLDER,
            GAME_SVG_PLACEHOLDER,
            GAME_MAP_TEXTURE_PLACEHOLDER,
        ):
            self.assertNotIn(placeholder, html)
        self.assertIn('"MLN111-C01-Q001"', html)
        self.assertIn('"HCM202-C01-Q001"', html)
        self.assertIn('"HCM202-C06-Q090"', html)
        self.assertIn('"C01-Q001"', html)
        self.assertIn('"playlistId":"PLAN8e5g76wQs"', html)
        self.assertIn('id="Layer_1"', html)
        self.assertIn('registerModule("game-app"', html)
        self.assertIn('data:image/webp;base64,', html)

    def test_built_html_embeds_current_production_bank(self) -> None:
        html = self.rendered_html
        match = re.search(
            r"const QUESTION_BANKS=Object\.assign\(Object\.create\(null\),(\{.*?\})\);",
            html,
            flags=re.DOTALL,
        )
        self.assertIsNotNone(match)
        embedded = json.loads(match.group(1))
        production = json.loads((BASE / "questions.json").read_text(encoding="utf-8"))
        self.assertEqual(embedded, self.question_banks)
        self.assertEqual(
            [question["id"] for question in embedded["mln112"]],
            [question["id"] for question in production],
        )

    def test_built_html_matches_current_template_and_bank(self) -> None:
        template = (BASE / "template.html").read_text(encoding="utf-8")
        expected = render_catalog_html(
            template, self.subject_catalog, self.question_banks, self.lecture_catalogs,
            load_game_assets(BASE),
        )
        self.assertEqual(self.rendered_html, expected)

    def test_built_html_embeds_current_lecture_manifest(self) -> None:
        html = self.rendered_html
        match = re.search(
            r"const LECTURE_CATALOGS=Object\.assign\(Object\.create\(null\),(\{.*?\})\);",
            html,
            flags=re.DOTALL,
        )
        self.assertIsNotNone(match)
        self.assertEqual(json.loads(match.group(1)), self.lecture_catalogs)

    def test_public_brand_is_subject_driven_while_legacy_seed_is_preserved(self) -> None:
        template = (BASE / "template.html").read_text(encoding="utf-8")
        controller = (BASE / "game" / "ui" / "game-controller.js").read_text(encoding="utf-8")
        self.assertIn("<title>Study Hub — Ôn tập các môn lý luận chính trị</title>", template)
        self.assertIn('id="brandCode">Study Hub</', template)
        self.assertIn("function updatePublicChrome(subject)", template)
        self.assertIn('document.title=subject.code+" — "+subject.title', template)
        self.assertIn('value="mln122-campaign"', template)
        self.assertNotIn("<h1>MLN122</h1>", template)
        self.assertNotIn("<h1>MLN222</h1>", template)
        for code in ("MLN111", "MLN112", "MLN131", "HCM202", "VNR202"):
            self.assertIn(f'"code":"{code}"', self.rendered_html)
        self.assertIn('"mln122-campaign"', controller)
        self.assertNotIn('"mln222-campaign"', controller)

    def test_game_build_manifest_is_complete_and_local(self) -> None:
        assets = load_game_assets(BASE)
        self.assertEqual(len(assets["data"]["provinces"]["provinces"]), 34)
        self.assertGreaterEqual(len(assets["scripts"]), 25)
        self.assertTrue(assets["images"]["mapTexture"].startswith("data:image/webp;base64,"))
        self.assertNotIn("<script", assets["svg"].lower())
        scripts = "\n".join(assets["scripts"])
        styles = "\n".join(assets["styles"])
        self.assertNotRegex(scripts, r"\bfetch\s*\(|XMLHttpRequest|WebSocket\s*\(")
        self.assertNotRegex(scripts, r"(?:src|href)\s*=\s*['\"]https?://")
        self.assertNotRegex(styles, r"url\(\s*['\"]?https?://")

    def test_progress_storage_is_versioned(self) -> None:
        template = (BASE / "template.html").read_text(encoding="utf-8")
        self.assertIn("mln222.v2.marked", template)
        self.assertIn("mln222.v2.stats", template)
        self.assertIn('progress:"mln222.v3.studyProgress"', template)
        self.assertIn('marked:"mln-study-hub.v1.mln111.marked"', template)
        self.assertIn('stats:"mln-study-hub.v1.mln111.stats"', template)
        self.assertIn('progress:"mln-study-hub.v1.mln111.studyProgress"', template)
        self.assertIn('marked:"mln-study-hub.v1.hcm202.marked"', template)
        self.assertIn('stats:"mln-study-hub.v1.hcm202.stats"', template)
        self.assertIn('progress:"mln-study-hub.v1.hcm202.studyProgress"', template)
        self.assertIn('const LAST_SUBJECT_KEY="mln-study-hub.v1.lastSubject"', template)
        self.assertIn("const STUDY_PROGRESS_VERSION=2", template)
        self.assertIn("const LEGACY_STUDY_PROGRESS_VERSION=1", template)
        self.assertIn("function studySessionKey(value)", template)
        self.assertIn("function normalizeStudySession(value,mode)", template)
        self.assertIn("function saveStudySession(shouldPersist)", template)
        self.assertIn("function restoreStudySession(mode,filters)", template)
        self.assertIn('id="questionCountRange"', template)
        self.assertIn('id="questionCountInput"', template)
        self.assertIn("questionStart", template)
        self.assertIn('id="flashCard"', template)
        self.assertIn("function toggleFlashcard()", template)
        self.assertIn('window.addEventListener("pagehide",commitCurrentRoute)', template)
        self.assertIn("function removeActiveStudyStorage()", template)
        self.assertIn("window.localStorage.removeItem(config.progress)", template)
        self.assertNotIn('localStorage.getItem("mln222.marked")', template)
        self.assertNotIn('localStorage.getItem("mln222.stats")', template)
        self.assertIn("function readStoredJson", template)
        self.assertNotIn("new Set(JSON.parse(localStorage", template)

    def test_study_progress_is_saved_across_answers_navigation_and_modes(self) -> None:
        template = (BASE / "template.html").read_text(encoding="utf-8")
        choose_block = template[template.index("function choose(question,index){"):template.index("function nextQuestion(){")]
        next_block = template[template.index("function nextQuestion(){"):template.index("function previousQuestion(){")]
        mode_block = template[template.index("function enterStudyMode(mode){"):template.index("/* ====== Search ====== */")]
        filter_block = template[template.index("function switchStudyFilters(update,options){"):template.index("function renderSourceInto(element,source){")]
        self.assertIn("app.study.answered[key]=index", choose_block)
        self.assertIn("saveStudySession();", choose_block)
        self.assertGreaterEqual(next_block.count("saveStudySession();"), 3)
        self.assertIn("if(!restoreStudySession(mode))", mode_block)
        self.assertIn("saveStudySession();", filter_block)
        self.assertIn("restoreStudySession(app.study.mode,currentStudyFilters())", filter_block)

    def test_build_uses_validated_snapshot_and_atomic_replace(self) -> None:
        builder = (BASE / "build_html.py").read_text(encoding="utf-8")
        self.assertIn("bank_snapshot = BANK.read_bytes()", builder)
        self.assertIn("validate_file(snapshot_path", builder)
        self.assertIn("before = snapshot_input_manifest(BASE)", builder)
        self.assertIn("after = snapshot_input_manifest(BASE)", builder)
        self.assertIn("if before != after:", builder)
        self.assertIn("enforce_artifact_budget(html)", builder)
        self.assertIn("output_path.replace(OUTPUT)", builder)

    def test_mode_navigation_uses_ordinary_buttons(self) -> None:
        template = (BASE / "template.html").read_text(encoding="utf-8")
        self.assertNotIn('role="tab"', template)
        self.assertNotIn('role="tablist"', template)
        self.assertIn('aria-pressed="true"', template)

    def test_app_shell_uses_semantic_tokens_and_local_icon_sprite(self) -> None:
        template = (BASE / "template.html").read_text(encoding="utf-8")
        game_styles = (BASE / "game" / "styles" / "game.css").read_text(encoding="utf-8")
        expected_icons = {
            "landmark", "book-open", "layers", "search", "castle", "shuffle",
            "bookmark", "rotate-ccw", "chevron-left", "chevron-right", "chevron-up",
            "chevron-down", "zoom-in", "zoom-out", "maximize-2", "locate-fixed",
            "wheat", "coins", "users", "shield", "gauge", "handshake", "swords",
            "scroll-text", "info", "triangle-alert", "circle-check", "clock-3",
            "lock-keyhole", "save", "plus", "trash-2", "sliders-horizontal",
            "x", "list-checks",
            "circle-play",
        }
        symbols = set(re.findall(r'<symbol id="ui-icon-([a-z0-9-]+)"', template))
        self.assertEqual(symbols, expected_icons)
        self.assertEqual(template.count('class="app-header"'), 1)
        self.assertIn('--canvas:#0d1211', template)
        self.assertIn('--surface:#141a18', template)
        self.assertIn('--game-surface:var(--surface)', game_styles)
        self.assertIn('Copyright (c) 2026 Lucide Icons and Contributors', template)
        self.assertIn('Copyright (c) 2013-present Cole Bemis', template)
        icon_references = set(re.findall(r'href="#ui-icon-([a-z0-9-]+)"', template))
        self.assertTrue(icon_references.issubset(expected_icons))
        self.assertIn("circle-check", (BASE / "game" / "ui" / "ui-utils.js").read_text(encoding="utf-8"))
        self.assertNotRegex(template, r'<use[^>]+href=["\']https?://')

    def test_source_rendering_does_not_interpolate_inner_html(self) -> None:
        template = (BASE / "template.html").read_text(encoding="utf-8")
        self.assertIn("function renderSourceInto(element,source)", template)
        self.assertIn("element.replaceChildren()", template)
        self.assertIn('label.textContent="Nguồn:"', template)
        self.assertIn('source.textContent="Nguồn: "+question.source.label', template)
        self.assertIn('results.replaceChildren(fragment)', template)
        self.assertNotIn(".innerHTML", template)

    def test_redesigned_workspaces_keep_dom_mobile_and_map_contracts(self) -> None:
        template = (BASE / "template.html").read_text(encoding="utf-8")
        game_styles = (BASE / "game" / "styles" / "game.css").read_text(encoding="utf-8")
        map_view = (BASE / "game" / "ui" / "map-view.js").read_text(encoding="utf-8")
        game_app = (BASE / "game" / "ui" / "game-app.js").read_text(encoding="utf-8")
        ids = re.findall(r'\bid="([A-Za-z][A-Za-z0-9_-]*)"', template)
        self.assertEqual(len(ids), len(set(ids)))
        for required_id in (
            "courseHome", "courseHomeHeading", "courseList", "subjectSelect",
            "subjectOverview", "subjectOverviewHeading", "workspaceHeading", "appStatus",
            "nextLabel", "searchStatus", "gameResourceToggle", "gameMapFocus",
            "gameMapTooltip", "gameSheetToggle", "gameSheetTitle",
            "gameBattleBadge", "gameReportBadge", "gameQuizResult", "gameRewardBanner",
            "gameTargetActionBtn", "gameContextMenu", "gameContextActionSheet", "gameOrderTray",
            "lecturePanel", "lecturePlayerShell", "lectureList", "lectureQuizBtn",
        ):
            self.assertIn(f'id="{required_id}"', template)
        self.assertIn('ui.study.dataset.studyMode=app.study.mode', template)
        self.assertIn('data-filters-expanded="false"', template)
        self.assertIn('document.body.dataset.experience=isGame?"game":"study"', template)
        self.assertIn('grid-template-columns:repeat(var(--mode-count,5),minmax(0,1fr))', template)
        self.assertIn("https://www.youtube-nocookie.com/embed/", template)
        self.assertIn('referrerPolicy="strict-origin-when-cross-origin"', template)
        self.assertIn('const leavingLecture=previousRoute.mode==="lecture"', template)
        self.assertIn('"Không thể tải bài giảng"', template)
        self.assertIn('button.textContent="Thử lại"', template)
        self.assertIn("navigator.onLine===false", template)
        self.assertIn('shell.dataset.state="loading"', template)
        self.assertNotIn("autoplay:\"1\"", template)
        self.assertIn('aria-controls="gameCampaignPane"', template)
        self.assertIn('env(safe-area-inset-bottom)', game_styles)
        self.assertIn('[data-sheet-state="expanded"]', game_styles)
        self.assertIn('[data-resources-expanded="true"]', game_styles)
        self.assertIn('width: 3129.7, height: 4901.01', map_view)
        self.assertIn('islandsInline: true', map_view)
        self.assertNotIn('gameMapInsets', map_view)
        self.assertIn('province[data-p="quan-dao-hoang-sa"]', game_styles)
        self.assertIn('background:var(--map-texture)', game_styles)
        self.assertIn('var sheetState = "collapsed"', game_app)
        self.assertIn('var resourcesExpanded = false', game_app)
        self.assertNotIn('sheetState:', game_app)
        self.assertNotIn('resourcesExpanded:', game_app)

    def test_legacy_parser_cannot_overwrite_production_bank(self) -> None:
        parser = (BASE / "parse_questions.py").read_text(encoding="utf-8")
        self.assertIn('OUT = OUT_DIR / "questions.generated-draft.json"', parser)
        self.assertNotIn('OUT = OUT_DIR / "questions.json"', parser)

    def test_composer_rejects_non_object_chapter_items(self) -> None:
        composer = (BASE / "compose_questions.py").read_text(encoding="utf-8")
        self.assertIn("if not isinstance(item, dict):", composer)

    def test_compose_and_build_commands_succeed_end_to_end(self) -> None:
        environment = os.environ.copy()
        environment["PYTHONIOENCODING"] = "utf-8"
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for filename in (
                "compose_questions.py",
                "validate_questions.py",
                "build_html.py",
                "subject_catalog.py",
                "template.html",
            ):
                shutil.copy2(BASE / filename, root / filename)
            shutil.copytree(BASE / "content", root / "content")
            shutil.copytree(BASE / "game", root / "game")

            for script in ("compose_questions.py", "build_html.py"):
                result = subprocess.run(
                    [sys.executable, str(root / script)],
                    cwd=root,
                    env=environment,
                    capture_output=True,
                    text=True,
                    encoding="utf-8",
                    timeout=120,
                    check=False,
                )
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

            self.assertEqual(
                (root / "questions.json").read_bytes(),
                (BASE / "questions.json").read_bytes(),
            )
            built = (root / "index.html").read_text(encoding="utf-8")
            self.assertNotIn(SUBJECT_CATALOG_PLACEHOLDER, built)
            self.assertNotIn(QUESTION_BANKS_PLACEHOLDER, built)
            self.assertNotIn(LECTURE_CATALOGS_PLACEHOLDER, built)
            self.assertIn('"MLN111-C01-Q001"', built)
            self.assertIn('"C01-Q001"', built)

    def test_inactive_options_and_dynamic_search_are_accessible(self) -> None:
        template = (BASE / "template.html").read_text(encoding="utf-8")
        self.assertIn("button.disabled=true", template)
        self.assertRegex(template, r'id="searchStatus"[^>]+role="status"')
        self.assertIn('scheduleFocus($("#feedback"))', template)


if __name__ == "__main__":
    unittest.main(verbosity=2)
