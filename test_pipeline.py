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

from build_html import PLACEHOLDER, serialize_for_inline_script
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
        self.assertNotIn("/*__QUESTIONS__*/", html)
        self.assertIn('const QUESTIONS = [{"id":"C01-Q001"', html)

    def test_built_html_embeds_current_production_bank(self) -> None:
        html = (BASE / "index.html").read_text(encoding="utf-8")
        match = re.search(
            r"const QUESTIONS = (\[.*?\]);\s*const LETTERS =",
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
        expected = template.replace(PLACEHOLDER, serialize_for_inline_script(production))
        actual = (BASE / "index.html").read_text(encoding="utf-8")
        self.assertEqual(actual, expected)

    def test_progress_storage_is_versioned(self) -> None:
        template = (BASE / "template.html").read_text(encoding="utf-8")
        self.assertIn("mln222.v2.marked", template)
        self.assertIn("mln222.v2.stats", template)
        self.assertNotIn('localStorage.getItem("mln222.marked")', template)
        self.assertNotIn('localStorage.getItem("mln222.stats")', template)
        self.assertIn("function readStoredJson", template)
        self.assertNotIn("new Set(JSON.parse(localStorage", template)

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

    def test_source_rendering_does_not_interpolate_inner_html(self) -> None:
        template = (BASE / "template.html").read_text(encoding="utf-8")
        self.assertIn("function renderSource(source)", template)
        self.assertIn("el.replaceChildren()", template)
        self.assertNotIn('$("#source").innerHTML=`', template)

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
        self.assertIn('id="searchStatus" role="status"', template)
        self.assertIn('$("#feedback").focus({preventScroll:true})', template)


if __name__ == "__main__":
    unittest.main(verbosity=2)
