# -*- coding: utf-8 -*-
"""Regression tests for the curated question-bank pipeline."""
from __future__ import annotations

import json
import re
import tempfile
import unittest
from pathlib import Path

from validate_questions import (
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
            errors, _, _ = validate_file(path, write_report=False)
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


class ProductionBankTests(unittest.TestCase):
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

    def test_inactive_options_and_dynamic_search_are_accessible(self) -> None:
        template = (BASE / "template.html").read_text(encoding="utf-8")
        self.assertIn("b.disabled=true", template)
        self.assertIn('id="searchStatus" role="status"', template)
        self.assertIn('$("#feedback").focus({preventScroll:true})', template)


if __name__ == "__main__":
    unittest.main(verbosity=2)
