# -*- coding: utf-8 -*-
"""Regression tests for the curated question-bank pipeline."""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from collections import Counter
from pathlib import Path

from build_html import (
    GAME_DATA_PLACEHOLDER,
    GAME_MAP_TEXTURE_PLACEHOLDER,
    GAME_SCRIPTS_PLACEHOLDER,
    GAME_STYLES_PLACEHOLDER,
    GAME_SVG_PLACEHOLDER,
    PLACEHOLDER,
    load_game_assets,
    render_html,
    serialize_for_inline_script,
)
from validate_questions import (
    find_repeated_answer_cycle,
    has_truncation_ellipsis,
    normalize_option,
    validate_file,
)


BASE = Path(__file__).resolve().parent


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
        questions = json.loads((BASE / "questions.json").read_text(encoding="utf-8"))
        template = (BASE / "template.html").read_text(encoding="utf-8")
        for placeholder in (
            PLACEHOLDER,
            GAME_DATA_PLACEHOLDER,
            GAME_STYLES_PLACEHOLDER,
            GAME_SCRIPTS_PLACEHOLDER,
            GAME_SVG_PLACEHOLDER,
            GAME_MAP_TEXTURE_PLACEHOLDER,
        ):
            with self.subTest(placeholder=placeholder):
                with self.assertRaises(ValueError):
                    render_html(template.replace(placeholder, "", 1), questions, assets)

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
        html = (BASE / "index.html").read_text(encoding="utf-8")
        self.assertEqual(template.count("/*__QUESTIONS__*/[]"), 1)
        for placeholder in (
            "/*__QUESTIONS__*/",
            GAME_DATA_PLACEHOLDER,
            GAME_SCRIPTS_PLACEHOLDER,
            GAME_STYLES_PLACEHOLDER,
            GAME_SVG_PLACEHOLDER,
            GAME_MAP_TEXTURE_PLACEHOLDER,
        ):
            self.assertNotIn(placeholder, html)
        self.assertIn('const QUESTIONS = [{"id":"C01-Q001"', html)
        self.assertIn('id="Layer_1"', html)
        self.assertIn('registerModule("game-app"', html)
        self.assertIn('data:image/webp;base64,', html)

    def test_built_html_embeds_current_production_bank(self) -> None:
        html = (BASE / "index.html").read_text(encoding="utf-8")
        match = re.search(
            r"const QUESTIONS = (\[.*?\]);\s*globalThis\.MLN222_QUESTIONS = QUESTIONS;",
            html,
            flags=re.DOTALL,
        )
        self.assertIsNotNone(match)
        embedded = json.loads(match.group(1))
        production = json.loads((BASE / "questions.json").read_text(encoding="utf-8"))
        self.assertEqual(embedded, production)

    def test_built_html_matches_current_template_and_bank(self) -> None:
        template = (BASE / "template.html").read_text(encoding="utf-8")
        production = json.loads((BASE / "questions.json").read_text(encoding="utf-8"))
        expected = render_html(template, production, load_game_assets(BASE))
        actual = (BASE / "index.html").read_text(encoding="utf-8")
        self.assertEqual(actual, expected)

    def test_public_brand_is_mln122(self) -> None:
        template = (BASE / "template.html").read_text(encoding="utf-8")
        html = (BASE / "index.html").read_text(encoding="utf-8")
        controller = (BASE / "game" / "ui" / "game-controller.js").read_text(encoding="utf-8")
        for source in (template, html):
            self.assertIn("<title>MLN122 — Ôn tập Kinh tế chính trị Mác-Lênin</title>", source)
            self.assertIn("<h1>MLN122</h1>", source)
            self.assertIn("tài liệu MLN122", source)
            self.assertIn('value="mln122-campaign"', source)
            self.assertNotIn("<h1>MLN222</h1>", source)
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
        self.assertIn('const STUDY_PROGRESS_KEY="mln222.v3.studyProgress"', template)
        self.assertIn("function normalizeStudySession(value,mode)", template)
        self.assertIn("function saveStudySession()", template)
        self.assertIn("function restoreStudySession(mode)", template)
        self.assertIn("window.addEventListener(\"pagehide\",saveStudySession)", template)
        self.assertIn("window.localStorage.removeItem(STUDY_PROGRESS_KEY)", template)
        self.assertNotIn('localStorage.getItem("mln222.marked")', template)
        self.assertNotIn('localStorage.getItem("mln222.stats")', template)
        self.assertIn("function readStoredJson", template)
        self.assertNotIn("new Set(JSON.parse(localStorage", template)

    def test_study_progress_is_saved_across_answers_navigation_and_modes(self) -> None:
        template = (BASE / "template.html").read_text(encoding="utf-8")
        choose_block = template[template.index("function choose(q,i){"):template.index("function next(){")]
        next_block = template[template.index("function next(){"):template.index("function toggleStar(){")]
        mode_block = template[template.index("function setMode(m){"):template.index("/* ====== Wire up ====== */")]
        self.assertIn("state.answered[q.id]=i", choose_block)
        self.assertIn("saveStudySession();", choose_block)
        self.assertGreaterEqual(next_block.count("saveStudySession();"), 4)
        self.assertIn("if(STUDY_MODES.has(state.mode)) saveStudySession();", mode_block)
        self.assertIn("if(!restoreStudySession(m)) buildPool();", mode_block)

    def test_build_uses_validated_snapshot_and_atomic_replace(self) -> None:
        builder = (BASE / "build_html.py").read_text(encoding="utf-8")
        self.assertIn("bank_snapshot = BANK.read_bytes()", builder)
        self.assertIn("validate_file(snapshot_path", builder)
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
        self.assertIn("function renderSource(source)", template)
        self.assertIn("el.replaceChildren()", template)
        self.assertNotIn('$("#source").innerHTML=`', template)
        self.assertIn('optsEl.replaceChildren()', template)
        self.assertIn('box.replaceChildren(fragment)', template)
        self.assertNotIn('box.innerHTML=res.slice', template)

    def test_redesigned_workspaces_keep_dom_mobile_and_map_contracts(self) -> None:
        template = (BASE / "template.html").read_text(encoding="utf-8")
        game_styles = (BASE / "game" / "styles" / "game.css").read_text(encoding="utf-8")
        map_view = (BASE / "game" / "ui" / "map-view.js").read_text(encoding="utf-8")
        game_app = (BASE / "game" / "ui" / "game-app.js").read_text(encoding="utf-8")
        ids = re.findall(r'\bid="([A-Za-z][A-Za-z0-9_-]*)"', template)
        self.assertEqual(len(ids), len(set(ids)))
        for required_id in (
            "nextLabel", "searchStatus", "gameResourceToggle", "gameMapFocus",
            "gameMapTooltip", "gameSheetToggle", "gameSheetTitle",
            "gameBattleBadge", "gameReportBadge", "gameQuizResult", "gameRewardBanner",
            "gameTargetActionBtn", "gameContextMenu", "gameContextActionSheet", "gameOrderTray",
        ):
            self.assertIn(f'id="{required_id}"', template)
        self.assertIn('data-study-mode="quiz"', template)
        self.assertIn('data-filters-expanded="false"', template)
        self.assertIn('document.body.dataset.experience=game?"game":"study"', template)
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
                "template.html",
            ):
                shutil.copy2(BASE / filename, root / filename)
            shutil.copytree(BASE / "content" / "chapters", root / "content" / "chapters")
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
            self.assertEqual(
                (root / "index.html").read_bytes(),
                (BASE / "index.html").read_bytes(),
            )

    def test_inactive_options_and_dynamic_search_are_accessible(self) -> None:
        template = (BASE / "template.html").read_text(encoding="utf-8")
        self.assertIn("b.disabled=true", template)
        self.assertRegex(template, r'id="searchStatus"[^>]+role="status"')
        self.assertIn('$("#feedback").focus({preventScroll:true})', template)


if __name__ == "__main__":
    unittest.main(verbosity=2)
