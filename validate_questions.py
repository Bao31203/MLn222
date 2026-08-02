# -*- coding: utf-8 -*-
"""Validate the curated MLN222 question bank and write a quality report."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from dataclasses import dataclass
from difflib import SequenceMatcher
from pathlib import Path


BASE = Path(__file__).resolve().parent
DEFAULT_BANK = BASE / "questions.json"
REPORT = BASE / "parse_report.txt"
SOURCE_DIR = Path(r"F:\MLN222")
PDF_NAME = "GIAO-TRINH-KINH-TE-CHINH-TRI-MAC-LENIN-BO-GIAO-DUC-VA-DAO-TAO.pdf"

EXPECTED_COUNTS = {1: 64, 2: 89, 3: 99, 4: 84, 5: 84, 6: 84}
EXPECTED_DIFFICULTIES = {
    1: {"Nhận biết": 26, "Thông hiểu": 26, "Vận dụng": 12},
    2: {"Nhận biết": 36, "Thông hiểu": 36, "Vận dụng": 17},
    3: {"Nhận biết": 40, "Thông hiểu": 40, "Vận dụng": 19},
    4: {"Nhận biết": 34, "Thông hiểu": 34, "Vận dụng": 16},
    5: {"Nhận biết": 34, "Thông hiểu": 34, "Vận dụng": 16},
    6: {"Nhận biết": 34, "Thông hiểu": 34, "Vận dụng": 16},
}
EXPANSION_STARTS = {1: 31, 2: 56, 3: 66, 4: 51, 5: 51, 6: 51}
MAX_EXPANSION_UNIQUE_LONGEST = 9
MAX_EXPANSION_LONGEST_OR_TIED = 12
MAX_EXPANSION_UNIQUE_SHORTEST = 9
MAX_EXPANSION_SHORTEST_OR_TIED = 12
MAX_EXPANSION_LENGTH_DELTA = 4.0
EXPECTED_CHAPTERS = {
    1: "Chương 1 · Slot 1: Khái quát môn học",
    2: "Chương 2 · Slot 2: Hàng hóa, thị trường và các chủ thể tham gia thị trường",
    3: "Chương 3 · Slot 3+4: Giá trị thặng dư và tích lũy tư bản",
    4: "Chương 4 · Slot 5+6: Cạnh tranh và độc quyền trong nền kinh tế thị trường",
    5: "Chương 5 · Slot 7+8: Kinh tế thị trường định hướng XHCN và quan hệ lợi ích",
    6: "Chương 6 · Slot 9+10: Công nghiệp hóa, hiện đại hóa và hội nhập kinh tế quốc tế",
}
EXPECTED_SLIDE_FILES = {
    1: "MLN122. Slot 1. Khái quát môn học.pptx.txt",
    2: "MLN122. Slot 2. Hàng hoá và Thị trường.pptx.txt",
    3: "MLN122. Slot 3+4. Giá trị thặng dư-Tích luỹ tư bản.pptx.txt",
    4: "MLN122. Slot 5+6. Cạnh tranh và độc quyền trong nền KTTT.pptx.txt",
    5: "MLN122. Slot 7+8. Kinh tế thị trường định hướng XHCN và các quan hệ lợi ích KT.pptx.txt",
    6: "MLN122. Slot 9+10. Công nghiệp hoá-Hiện đại hoá và hội nhập kinh tế QT.pptx.txt",
}
PAGE_RANGES = {
    1: (8, 28),
    2: (29, 74),
    3: (75, 111),
    4: (112, 151),
    5: (152, 200),
    6: (201, 259),
}
DIFFICULTIES = {"Nhận biết", "Thông hiểu", "Vận dụng"}
KINDS = {
    "nhan_biet_khai_niem",
    "thong_hieu_phan_biet",
    "trinh_tu_quan_he",
    "van_dung_tinh_huong",
    "van_dung_tinh_toan",
}
REQUIRED_FIELDS = {
    "id",
    "chapter",
    "chapterNum",
    "num",
    "topic",
    "difficulty",
    "kind",
    "stem",
    "options",
    "answer",
    "explanation",
    "source",
}
SOURCE_REQUIRED_FIELDS = {"file", "page", "text"}
SOURCE_OPTIONAL_FIELDS = {"slide"}
SLIDE_FIELDS = {"file", "number"}
FORBIDDEN_OPTION_PHRASES = (
    "tất cả các phương án trên",
    "tất cả các đáp án trên",
    "cả a và b",
    "cả a, b và c",
)
HTML_TAG_PATTERN = re.compile(r"<\s*/?\s*[A-Za-z][^>]*>")


def configure_utf8_console() -> None:
    """Keep Vietnamese CLI output readable on legacy Windows code pages."""
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if callable(reconfigure):
            reconfigure(encoding="utf-8", errors="replace")


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFD", str(text).lower())
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    text = text.replace("đ", "d")
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


def normalize_option(text: str) -> str:
    # A prime mark changes the meaning of economic formulas (H vs H').
    return normalize(str(text).replace("'", " prime ").replace("’", " prime "))


def is_compact_formula(text: str) -> bool:
    return bool(re.fullmatch(r"[\dA-Za-zÀ-ỹ\s.,%()+\-/'’×=]+", text.strip()))


def has_control_chars(text: str) -> bool:
    return any(unicodedata.category(ch) == "Cc" and ch not in "\n\t" for ch in text)


def contains_html_tag(text: str) -> bool:
    return bool(HTML_TAG_PATTERN.search(text))


def has_truncation_ellipsis(text: str) -> bool:
    # The circulation formula legitimately uses ellipses around production.
    without_formula = re.sub(
        r"T\s*-\s*H\s*\.\.\.\s*SX\s*\.\.\.\s*H['’]?\s*-\s*T['’]?",
        "",
        text,
        flags=re.IGNORECASE,
    )
    return "..." in without_formula or "…" in without_formula


def find_repeated_answer_cycle(
    answers: list[int],
    *,
    max_period: int = 4,
    repetitions: int = 3,
) -> tuple[int, int] | None:
    """Return the first repeated short cycle as (start_index, period)."""
    for period in range(1, max_period + 1):
        span = period * repetitions
        for start in range(0, len(answers) - span + 1):
            pattern = answers[start : start + period]
            if answers[start : start + span] == pattern * repetitions:
                return start, period
    return None


def validate_file(
    bank_path: Path | str = DEFAULT_BANK,
    *,
    write_report: bool = True,
    check_similarity: bool = True,
) -> tuple[list[str], list[str], str]:
    path = Path(bank_path)
    errors: list[str] = []
    warnings: list[str] = []

    try:
        questions = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        report = f"Không đọc được ngân hàng {path}: {exc}"
        if write_report:
            REPORT.write_text(report + "\n", encoding="utf-8")
        return [report], [], report

    if not isinstance(questions, list):
        report = "Lỗi: questions.json phải chứa một mảng JSON."
        if write_report:
            REPORT.write_text(report + "\n", encoding="utf-8")
        return [report], [], report

    expected_total = sum(EXPECTED_COUNTS.values())
    if len(questions) != expected_total:
        errors.append(f"Toàn bộ: cần {expected_total} câu, hiện có {len(questions)} câu")

    ids: set[str] = set()
    stems: dict[str, str] = {}
    chapter_stems: defaultdict[int, list[tuple[str, str]]] = defaultdict(list)
    chapter_counts: Counter[int] = Counter()
    difficulty_counts: Counter[str] = Counter()
    chapter_difficulty_counts: defaultdict[int, Counter[str]] = defaultdict(Counter)
    kind_counts: Counter[str] = Counter()
    answer_counts: defaultdict[int, Counter[int]] = defaultdict(Counter)
    answer_sequences: defaultdict[int, list[int]] = defaultdict(list)
    expansion_length_stats: defaultdict[int, Counter[str]] = defaultdict(Counter)

    for index, question in enumerate(questions, start=1):
        prefix = f"Câu #{index}"
        if not isinstance(question, dict):
            errors.append(f"{prefix}: không phải object")
            continue

        missing = REQUIRED_FIELDS - set(question)
        if missing:
            errors.append(f"{prefix}: thiếu trường {', '.join(sorted(missing))}")
            continue
        extra = set(question) - REQUIRED_FIELDS
        if extra:
            errors.append(f"{prefix}: có trường ngoài schema: {', '.join(sorted(extra))}")

        qid = question.get("id")
        if not isinstance(qid, str) or not re.fullmatch(r"C\d{2}-Q\d{3}", qid):
            errors.append(f"{prefix}: id không hợp lệ: {qid!r}")
            qid = str(qid)
        elif qid in ids:
            errors.append(f"{qid}: id bị trùng")
        ids.add(qid)
        prefix = qid

        chapter_num = question.get("chapterNum")
        if not isinstance(chapter_num, int) or isinstance(chapter_num, bool):
            errors.append(f"{prefix}: chapterNum phải là số nguyên")
            continue

        if chapter_num not in EXPECTED_COUNTS:
            errors.append(f"{prefix}: chapterNum ngoài phạm vi 1-6")
            continue
        chapter_counts[chapter_num] += 1

        expected_id = f"C{chapter_num:02d}-Q{chapter_counts[chapter_num]:03d}"
        if qid != expected_id:
            errors.append(f"{prefix}: thứ tự id phải là {expected_id}")
        num = question.get("num")
        if not isinstance(num, int) or isinstance(num, bool) or num != index:
            errors.append(f"{prefix}: num phải là {index}")

        for field in ("chapter", "topic", "stem", "explanation"):
            value = question.get(field)
            if not isinstance(value, str) or not value.strip():
                errors.append(f"{prefix}: {field} phải là chuỗi không rỗng")
            elif has_control_chars(value):
                errors.append(f"{prefix}: {field} chứa ký tự điều khiển")
            elif contains_html_tag(value):
                errors.append(f"{prefix}: {field} chứa thẻ HTML không hợp lệ")

        if question.get("chapter") != EXPECTED_CHAPTERS[chapter_num]:
            errors.append(f"{prefix}: chapter không khớp tên chuẩn của chương {chapter_num}")

        stem_value = question.get("stem")
        stem = stem_value if isinstance(stem_value, str) else ""
        normalized_stem = normalize(stem)
        if normalized_stem in stems:
            errors.append(f"{prefix}: trùng thân câu với {stems[normalized_stem]}")
        elif normalized_stem:
            stems[normalized_stem] = qid
            chapter_stems[chapter_num].append((qid, normalized_stem))
        if has_truncation_ellipsis(stem):
            errors.append(f"{prefix}: thân câu chứa dấu cắt nội dung")
        if len(stem.strip()) < 20:
            warnings.append(f"{prefix}: thân câu ngắn, cần đọc lại")

        explanation = question.get("explanation", "")
        if isinstance(explanation, str) and len(explanation.strip()) < 35:
            warnings.append(f"{prefix}: giải thích ngắn hơn 35 ký tự")

        difficulty = question.get("difficulty")
        if not isinstance(difficulty, str) or difficulty not in DIFFICULTIES:
            errors.append(f"{prefix}: difficulty không hợp lệ: {difficulty!r}")
        else:
            difficulty_counts[difficulty] += 1
            chapter_difficulty_counts[chapter_num][difficulty] += 1

        kind = question.get("kind")
        if not isinstance(kind, str) or kind not in KINDS:
            errors.append(f"{prefix}: kind không hợp lệ: {kind!r}")
        else:
            kind_counts[kind] += 1

        options = question.get("options")
        if not isinstance(options, list) or len(options) != 4:
            errors.append(f"{prefix}: phải có đúng 4 phương án")
        else:
            normalized_options: list[str] = []
            lengths: list[int] = []
            valid_options: list[str] = []
            for option_index, option in enumerate(options):
                if not isinstance(option, str) or not option.strip():
                    errors.append(f"{prefix}: phương án {option_index + 1} không hợp lệ")
                    continue
                valid_options.append(option)
                normalized_option = normalize_option(option)
                normalized_options.append(normalized_option)
                lengths.append(len(option.strip()))
                if has_truncation_ellipsis(option):
                    errors.append(f"{prefix}: phương án {option_index + 1} chứa dấu cắt nội dung")
                if has_control_chars(option):
                    errors.append(f"{prefix}: phương án {option_index + 1} chứa ký tự điều khiển")
                if contains_html_tag(option):
                    errors.append(f"{prefix}: phương án {option_index + 1} chứa thẻ HTML")
                if any(phrase in option.lower() for phrase in FORBIDDEN_OPTION_PHRASES):
                    errors.append(f"{prefix}: dùng phương án tổng hợp bị cấm")
            if len(set(normalized_options)) != len(normalized_options):
                errors.append(f"{prefix}: có phương án trùng nhau")
            if lengths:
                shortest = max(1, min(lengths))
                if shortest < 5 and not all(is_compact_formula(option) for option in valid_options):
                    warnings.append(f"{prefix}: có phương án quá ngắn")
                if max(lengths) > 240:
                    warnings.append(f"{prefix}: có phương án dài hơn 240 ký tự")
                if max(lengths) / shortest > 4:
                    warnings.append(f"{prefix}: độ dài phương án chênh lệch trên 4 lần")

        answer = question.get("answer")
        if not isinstance(answer, int) or isinstance(answer, bool) or answer not in range(4):
            errors.append(f"{prefix}: answer phải là số nguyên 0-3")
        else:
            answer_counts[chapter_num][answer] += 1
            answer_sequences[chapter_num].append(answer)
            if (
                chapter_counts[chapter_num] >= EXPANSION_STARTS[chapter_num]
                and isinstance(options, list)
                and len(options) == 4
                and all(isinstance(option, str) and option.strip() for option in options)
            ):
                lengths = [len(option.strip()) for option in options]
                longest = max(lengths)
                shortest = min(lengths)
                stats = expansion_length_stats[chapter_num]
                stats["questions"] += 1
                stats["correct_total"] += lengths[answer]
                stats["distractor_total"] += sum(
                    length for option_index, length in enumerate(lengths) if option_index != answer
                )
                stats["distractor_count"] += 3
                if lengths[answer] == longest:
                    stats["longest_or_tied"] += 1
                    if lengths.count(longest) == 1:
                        stats["unique_longest"] += 1
                if lengths[answer] == shortest:
                    stats["shortest_or_tied"] += 1
                    if lengths.count(shortest) == 1:
                        stats["unique_shortest"] += 1

        source = question.get("source")
        if not isinstance(source, dict):
            errors.append(f"{prefix}: source phải là object")
        else:
            missing_source = SOURCE_REQUIRED_FIELDS - set(source)
            extra_source = set(source) - SOURCE_REQUIRED_FIELDS - SOURCE_OPTIONAL_FIELDS
            if missing_source:
                errors.append(
                    f"{prefix}: source thiếu trường {', '.join(sorted(missing_source))}"
                )
            if extra_source:
                errors.append(
                    f"{prefix}: source có trường ngoài schema: {', '.join(sorted(extra_source))}"
                )
            source_file = source.get("file")
            page = source.get("page")
            source_text = source.get("text")
            if source_file != PDF_NAME:
                errors.append(f"{prefix}: nguồn chuẩn phải là file giáo trình PDF")
            elif not (SOURCE_DIR / source_file).exists():
                errors.append(f"{prefix}: file nguồn không tồn tại")
            low_page, high_page = PAGE_RANGES[chapter_num]
            if not isinstance(page, int) or isinstance(page, bool) or not low_page <= page <= high_page:
                errors.append(
                    f"{prefix}: trang nguồn phải trong khoảng {low_page}-{high_page}, nhận {page!r}"
                )
            if not isinstance(source_text, str) or len(source_text.strip()) < 20:
                errors.append(f"{prefix}: source.text phải tóm lược căn cứ đáp án")
            elif has_control_chars(source_text):
                errors.append(f"{prefix}: source.text chứa ký tự điều khiển")
            elif contains_html_tag(source_text):
                errors.append(f"{prefix}: source.text chứa thẻ HTML không hợp lệ")

            if "slide" in source:
                slide = source.get("slide")
                if not isinstance(slide, dict):
                    errors.append(f"{prefix}: source.slide phải là object")
                else:
                    missing_slide = SLIDE_FIELDS - set(slide)
                    extra_slide = set(slide) - SLIDE_FIELDS
                    if missing_slide:
                        errors.append(
                            f"{prefix}: source.slide thiếu trường {', '.join(sorted(missing_slide))}"
                        )
                    if extra_slide:
                        errors.append(
                            f"{prefix}: source.slide có trường ngoài schema: {', '.join(sorted(extra_slide))}"
                        )
                    slide_file = slide.get("file")
                    slide_number = slide.get("number")
                    if slide_file != EXPECTED_SLIDE_FILES[chapter_num]:
                        errors.append(
                            f"{prefix}: source.slide.file không khớp tài liệu của chương {chapter_num}"
                        )
                    elif not (SOURCE_DIR / slide_file).exists():
                        errors.append(f"{prefix}: file slide bổ trợ không tồn tại")
                    if (
                        not isinstance(slide_number, int)
                        or isinstance(slide_number, bool)
                        or slide_number < 1
                    ):
                        errors.append(f"{prefix}: source.slide.number phải là số nguyên dương")

    for chapter_num, expected_count in EXPECTED_COUNTS.items():
        actual = chapter_counts[chapter_num]
        if actual != expected_count:
            errors.append(
                f"Chương {chapter_num}: cần {expected_count} câu, hiện có {actual} câu"
            )
        expected_difficulties = EXPECTED_DIFFICULTIES[chapter_num]
        actual_difficulties = chapter_difficulty_counts[chapter_num]
        for difficulty, expected_difficulty_count in expected_difficulties.items():
            actual_difficulty_count = actual_difficulties[difficulty]
            if actual_difficulty_count != expected_difficulty_count:
                errors.append(
                    f"Chương {chapter_num}: {difficulty} cần {expected_difficulty_count} câu, "
                    f"hiện có {actual_difficulty_count} câu"
                )
        positions = answer_counts[chapter_num]
        if sum(positions.values()) == expected_count:
            values = [positions[i] for i in range(4)]
            if max(values) - min(values) > 2:
                errors.append(
                    f"Chương {chapter_num}: vị trí đáp án lệch quá 2 câu: {values}"
                )
            cycle = find_repeated_answer_cycle(answer_sequences[chapter_num])
            if cycle is not None:
                start, period = cycle
                first_question = start + 1
                last_question = start + period * 3
                errors.append(
                    f"Chương {chapter_num}: đáp án lặp chu kỳ {period} tại câu "
                    f"{first_question}-{last_question}"
                )

        expansion_stats = expansion_length_stats[chapter_num]
        expected_expansion_count = expected_count - EXPANSION_STARTS[chapter_num] + 1
        if expansion_stats["questions"] == expected_expansion_count:
            unique_longest = expansion_stats["unique_longest"]
            longest_or_tied = expansion_stats["longest_or_tied"]
            unique_shortest = expansion_stats["unique_shortest"]
            shortest_or_tied = expansion_stats["shortest_or_tied"]
            correct_average = expansion_stats["correct_total"] / expected_expansion_count
            distractor_average = (
                expansion_stats["distractor_total"] / expansion_stats["distractor_count"]
            )
            if unique_longest > MAX_EXPANSION_UNIQUE_LONGEST:
                errors.append(
                    f"Chương {chapter_num}: đáp án đúng dài nhất duy nhất ở "
                    f"{unique_longest}/{expected_expansion_count} câu mới"
                )
            if longest_or_tied > MAX_EXPANSION_LONGEST_OR_TIED:
                errors.append(
                    f"Chương {chapter_num}: đáp án đúng dài nhất hoặc đồng hạng ở "
                    f"{longest_or_tied}/{expected_expansion_count} câu mới"
                )
            if unique_shortest > MAX_EXPANSION_UNIQUE_SHORTEST:
                errors.append(
                    f"Chương {chapter_num}: đáp án đúng ngắn nhất duy nhất ở "
                    f"{unique_shortest}/{expected_expansion_count} câu mới"
                )
            if shortest_or_tied > MAX_EXPANSION_SHORTEST_OR_TIED:
                errors.append(
                    f"Chương {chapter_num}: đáp án đúng ngắn nhất hoặc đồng hạng ở "
                    f"{shortest_or_tied}/{expected_expansion_count} câu mới"
                )
            length_delta = correct_average - distractor_average
            if abs(length_delta) > MAX_EXPANSION_LENGTH_DELTA:
                direction = "dài hơn" if length_delta > 0 else "ngắn hơn"
                errors.append(
                    f"Chương {chapter_num}: đáp án đúng câu mới {direction} nhiễu trung bình "
                    f"{abs(length_delta):.1f} ký tự"
                )

    if check_similarity:
        for chapter_num, items in chapter_stems.items():
            for left_index, (left_id, left_stem) in enumerate(items):
                for right_id, right_stem in items[left_index + 1 :]:
                    if SequenceMatcher(None, left_stem, right_stem).ratio() >= 0.94:
                        warnings.append(
                            f"{left_id}/{right_id}: thân câu rất giống nhau, cần kiểm tra trùng ý"
                        )

    report_lines = [
        f"Ngân hàng: {path}",
        f"Tổng số câu: {len(questions)}",
        f"Lỗi: {len(errors)}",
        f"Cảnh báo: {len(warnings)}",
        "",
        "Phân bố theo chương:",
    ]
    for chapter_num in EXPECTED_COUNTS:
        report_lines.append(f"  Chương {chapter_num}: {chapter_counts[chapter_num]}")
    report_lines.extend(["", "Phân bố mức độ:"])
    for difficulty in ("Nhận biết", "Thông hiểu", "Vận dụng"):
        report_lines.append(f"  {difficulty}: {difficulty_counts[difficulty]}")
    report_lines.extend(["", "Phân bố dạng câu:"])
    for kind in sorted(KINDS):
        report_lines.append(f"  {kind}: {kind_counts[kind]}")
    report_lines.extend(["", "Vị trí đáp án theo chương:"])
    for chapter_num in EXPECTED_COUNTS:
        values = [answer_counts[chapter_num][i] for i in range(4)]
        report_lines.append(f"  Chương {chapter_num}: A={values[0]}, B={values[1]}, C={values[2]}, D={values[3]}")
    report_lines.extend(["", "Dấu hiệu độ dài ở 204 câu mở rộng:"])
    for chapter_num in EXPECTED_COUNTS:
        stats = expansion_length_stats[chapter_num]
        question_count = stats["questions"]
        if question_count:
            correct_average = stats["correct_total"] / question_count
            distractor_average = stats["distractor_total"] / stats["distractor_count"]
            report_lines.append(
                f"  Chương {chapter_num}: dài nhất duy nhất={stats['unique_longest']}, "
                f"dài nhất/đồng hạng={stats['longest_or_tied']}, "
                f"ngắn nhất duy nhất={stats['unique_shortest']}, "
                f"ngắn nhất/đồng hạng={stats['shortest_or_tied']}, "
                f"TB đúng/nhiễu={correct_average:.1f}/{distractor_average:.1f}"
            )

    if errors:
        report_lines.extend(["", "Lỗi cần sửa:", *[f"  - {item}" for item in errors]])
    if warnings:
        report_lines.extend(["", "Cảnh báo cần đọc lại:", *[f"  - {item}" for item in warnings]])
    if not errors:
        report_lines.extend(["", "Kết quả: HỢP LỆ cho bước đóng gói website."])

    report = "\n".join(report_lines)
    if write_report:
        REPORT.write_text(report + "\n", encoding="utf-8")
    return errors, warnings, report


@dataclass(frozen=True)
class ValidationResult:
    subject_id: str
    status: str
    study_ready: bool
    question_count: int
    errors: tuple[str, ...]
    warnings: tuple[str, ...]
    report: str


def _max_answer_run(answers: list[int]) -> int:
    longest = current = 0
    previous: int | None = None
    for answer in answers:
        current = current + 1 if answer == previous else 1
        longest = max(longest, current)
        previous = answer
    return longest


def _find_generic_cycle(
    answers: list[int], *, min_period: int = 2, max_period: int = 4, repetitions: int = 3
) -> tuple[int, int] | None:
    for period in range(min_period, max_period + 1):
        span = period * repetitions
        for start in range(0, len(answers) - span + 1):
            pattern = answers[start : start + period]
            if answers[start : start + span] == pattern * repetitions:
                return start, period
    return None


def _validate_review_signoff(profile, errors: list[str]) -> None:
    """Bind a reviewed profile to canonical raw authoring bytes."""
    if profile.validation is None or profile.validation.review_signoff_path is None:
        return
    from subject_catalog import PROFILE_LIMIT, CatalogError, load_json, validate_safe_text

    fields = {
        "schemaVersion", "subjectId", "reviewStatus", "reviewedAt", "questionCount",
        "bankSha256", "canonicalization", "chapterFileSha256", "distribution",
        "review", "productionSources",
    }
    distribution_fields = {"chapterQuestions", "difficulty", "answerPositions"}
    review_fields = {
        "independentChapterReviews", "resolvedCritical", "resolvedHigh",
        "resolvedMediumGroups", "resolvedLow", "openCritical", "openHigh", "openMedium",
    }
    try:
        signoff = load_json(
            profile.validation.review_signoff_path,
            max_bytes=PROFILE_LIMIT,
            context=f"{profile.id} review sign-off",
        )
        if not isinstance(signoff, dict) or set(signoff) != fields:
            raise CatalogError("Review sign-off has unknown or missing fields.")
        if (
            signoff["schemaVersion"] != 1
            or signoff["subjectId"] != profile.id
            or signoff["reviewStatus"] != "approved"
            or type(signoff["questionCount"]) is not int
            or signoff["questionCount"] != profile.question_target
            or not isinstance(signoff["bankSha256"], str)
            or not re.fullmatch(r"[0-9a-f]{64}", signoff["bankSha256"])
        ):
            raise CatalogError("Review sign-off identity/status/count/hash is invalid.")
        validate_safe_text(signoff["reviewedAt"], "reviewedAt", 32)
        validate_safe_text(signoff["canonicalization"], "canonicalization", 400)
        if not isinstance(signoff["chapterFileSha256"], dict):
            raise CatalogError("chapterFileSha256 must be an object.")

        authored: list[dict] = []
        actual_file_hashes: dict[str, str] = {}
        for question_file in sorted(profile.question_files, key=lambda item: item.path.name):
            raw = json.loads(question_file.path.read_text(encoding="utf-8"))
            if not isinstance(raw, list):
                raise CatalogError("Signed chapter source must be an array.")
            authored.extend(raw)
            actual_file_hashes[question_file.path.name] = hashlib.sha256(
                question_file.path.read_bytes()
            ).hexdigest()
        canonical = json.dumps(
            authored, ensure_ascii=False, sort_keys=True, separators=(",", ":")
        ).encode("utf-8")
        bank_hash = hashlib.sha256(canonical).hexdigest()
        if signoff["bankSha256"] != bank_hash:
            raise CatalogError("Review sign-off bank SHA-256 does not match authored content.")
        if signoff["chapterFileSha256"] != actual_file_hashes:
            raise CatalogError("Review sign-off chapter hashes do not match authored files.")

        distribution = signoff["distribution"]
        if not isinstance(distribution, dict) or set(distribution) != distribution_fields:
            raise CatalogError("Review sign-off distribution has unknown or missing fields.")
        if distribution["chapterQuestions"] != [c.question_target for c in profile.chapters]:
            raise CatalogError("Review sign-off chapter distribution is stale.")
        if distribution["difficulty"] != profile.validation.difficulty_targets:
            raise CatalogError("Review sign-off difficulty distribution is stale.")
        if distribution["answerPositions"] != list(profile.validation.answer_position_targets):
            raise CatalogError("Review sign-off answer distribution is stale.")
        review = signoff["review"]
        if not isinstance(review, dict) or set(review) != review_fields:
            raise CatalogError("Review sign-off review summary has unknown or missing fields.")
        if any(type(value) is not int or value < 0 for value in review.values()):
            raise CatalogError("Review sign-off review counts must be non-negative integers.")
        if review["independentChapterReviews"] != len(profile.chapters):
            raise CatalogError(
                "Review sign-off must record one independent review per chapter."
            )
        if any(review[name] for name in ("openCritical", "openHigh", "openMedium")):
            raise CatalogError("Review sign-off still has open Critical/High/Medium findings.")
        if signoff["productionSources"] != [
            filename for filename, _ in profile.validation.source_policy.allowed_sources
        ]:
            raise CatalogError("Review sign-off productionSources do not match source policy.")
    except (CatalogError, OSError, UnicodeDecodeError, json.JSONDecodeError) as exc:
        errors.append(f"{profile.id}: invalid review sign-off: {exc}")


def validate_subject(
    profile,
    questions: list[dict],
    *,
    root: Path | str = BASE,
    check_similarity: bool = True,
) -> ValidationResult:
    """Validate common question fields plus all subject-profile invariants."""
    from subject_catalog import CatalogError, DIFFICULTIES as PROFILE_DIFFICULTIES, validate_safe_text

    errors: list[str] = []
    warnings: list[str] = []
    if profile.status == "comingSoon":
        if questions:
            errors.append(f"{profile.id}: comingSoon subject must not publish a question bank")
        report = (
            f"Subject: {profile.id}\nStatus: comingSoon\nQuestions: 0\nErrors: "
            f"{len(errors)}\nWarnings: 0"
        )
        return ValidationResult(
            profile.id, profile.status, False, 0, tuple(errors), tuple(), report
        )
    if profile.validation is None:
        errors.append(f"{profile.id}: missing validation profile")
        return ValidationResult(
            profile.id, profile.status, False, len(questions), tuple(errors), tuple(),
            f"Subject: {profile.id}\nErrors: 1\n  - {errors[0]}",
        )

    validation = profile.validation
    expected_fields = {
        "id", "chapter", "chapterNum", "chapterId", "num", "topic", "difficulty",
        "kind", "stem", "options", "answer", "explanation", "source",
    }
    if validation.course_id_policy == "required":
        expected_fields.add("courseId")
    chapter_map = profile.chapter_by_number
    chapter_targets = {target.chapter_num: target for target in validation.chapter_targets}
    ids: set[str] = set()
    stems: dict[str, str] = {}
    chapter_counts: Counter[int] = Counter()
    difficulties: Counter[str] = Counter()
    chapter_difficulties: defaultdict[int, Counter[str]] = defaultdict(Counter)
    answers: Counter[int] = Counter()
    chapter_answers: defaultdict[int, Counter[int]] = defaultdict(Counter)
    answer_sequences: defaultdict[int, list[int]] = defaultdict(list)
    chapter_stems: defaultdict[int, list[tuple[str, str]]] = defaultdict(list)
    source_labels = validation.source_policy.labels
    slide_files = validation.source_policy.slide_files
    page_ranges = validation.source_policy.page_ranges
    qid_pattern = re.compile(validation.question_id_pattern)

    for index, question in enumerate(questions, start=1):
        prefix = f"{profile.id} question #{index}"
        if not isinstance(question, dict):
            errors.append(f"{prefix}: must be an object")
            continue
        if set(question) != expected_fields:
            errors.append(
                f"{prefix}: field mismatch; missing={sorted(expected_fields - set(question))}, "
                f"extra={sorted(set(question) - expected_fields)}"
            )
            continue
        qid = question.get("id")
        try:
            qid = validate_safe_text(qid, f"{prefix}.id", 32)
        except CatalogError as exc:
            errors.append(str(exc))
            qid = str(qid)
        if not qid_pattern.fullmatch(qid):
            errors.append(f"{prefix}: id does not match subject questionIdPattern")
        if qid in ids:
            errors.append(f"{prefix}: duplicate id {qid}")
        ids.add(qid)
        prefix = qid
        if type(question["num"]) is not int or question["num"] != index:
            errors.append(f"{prefix}: num must equal {index}")
        chapter_num = question["chapterNum"]
        if type(chapter_num) is not int or chapter_num not in chapter_map:
            errors.append(f"{prefix}: unknown chapterNum")
            continue
        chapter = chapter_map[chapter_num]
        chapter_counts[chapter_num] += 1
        if question["chapterId"] != chapter.id or question["chapter"] != chapter.title:
            errors.append(f"{prefix}: chapterId/title must come from subject metadata")
        if validation.course_id_policy == "required" and question.get("courseId") != profile.id:
            errors.append(f"{prefix}: courseId must equal {profile.id}")

        for field, cap in (("chapter", 160), ("chapterId", 32), ("topic", 160), ("stem", 600), ("explanation", 1600)):
            try:
                validate_safe_text(question[field], f"{prefix}.{field}", cap)
            except CatalogError as exc:
                errors.append(str(exc))
            if isinstance(question[field], str) and contains_html_tag(question[field]):
                errors.append(f"{prefix}: {field} contains HTML")
        stem = question["stem"] if isinstance(question["stem"], str) else ""
        normalized_stem = normalize(stem)
        if normalized_stem in stems:
            errors.append(f"{prefix}: duplicate stem with {stems[normalized_stem]}")
        elif normalized_stem:
            stems[normalized_stem] = qid
            chapter_stems[chapter_num].append((qid, normalized_stem))
        if has_truncation_ellipsis(stem):
            errors.append(f"{prefix}: stem contains a truncation ellipsis")

        difficulty = question["difficulty"]
        if difficulty not in PROFILE_DIFFICULTIES:
            errors.append(f"{prefix}: invalid difficulty")
        else:
            difficulties[difficulty] += 1
            chapter_difficulties[chapter_num][difficulty] += 1
        kind = question["kind"]
        if kind not in validation.allowed_kinds:
            errors.append(f"{prefix}: kind is not allowed by the subject profile")

        options = question["options"]
        if not isinstance(options, list) or len(options) != 4:
            errors.append(f"{prefix}: must contain exactly four options")
        else:
            normalized_options: list[str] = []
            for option_index, option in enumerate(options):
                try:
                    validate_safe_text(option, f"{prefix}.options[{option_index}]", 400)
                except CatalogError as exc:
                    errors.append(str(exc))
                    continue
                normalized_options.append(normalize_option(option))
                if contains_html_tag(option) or has_truncation_ellipsis(option):
                    errors.append(f"{prefix}: option {option_index + 1} contains unsafe/cut text")
                if any(phrase in option.lower() for phrase in FORBIDDEN_OPTION_PHRASES):
                    errors.append(f"{prefix}: forbidden aggregate option")
            if len(normalized_options) == 4 and len(set(normalized_options)) != 4:
                errors.append(f"{prefix}: duplicate options")
        answer = question["answer"]
        if type(answer) is not int or answer not in range(4):
            errors.append(f"{prefix}: answer must be an integer 0-3")
        else:
            answers[answer] += 1
            chapter_answers[chapter_num][answer] += 1
            answer_sequences[chapter_num].append(answer)

        source = question["source"]
        source_schema = validation.source_policy.schema
        required_source = {"file", "section", "text"} if source_schema == "markdown-section" else {"file", "page", "text"}
        allowed_source = required_source | ({"slide"} if source_schema == "legacy-pdf-page" else set())
        if not isinstance(source, dict) or not required_source.issubset(source) or not set(source).issubset(allowed_source):
            errors.append(f"{prefix}: source fields do not match {source_schema}")
            continue
        source_file = source.get("file")
        if not isinstance(source_file, str) or source_file not in source_labels:
            errors.append(f"{prefix}: source.file is not allowlisted")
        for field, cap in (("file", 320), ("text", 1200)):
            try:
                validate_safe_text(source.get(field), f"{prefix}.source.{field}", cap)
            except CatalogError as exc:
                errors.append(str(exc))
        if isinstance(source.get("text"), str):
            if len(source["text"].strip()) < 20:
                errors.append(f"{prefix}: source.text must contain meaningful evidence")
            if contains_html_tag(source["text"]):
                errors.append(f"{prefix}: source.text contains HTML")
        if source_schema == "markdown-section":
            try:
                validate_safe_text(source.get("section"), f"{prefix}.source.section", 320)
            except CatalogError as exc:
                errors.append(str(exc))
        else:
            page = source.get("page")
            low, high = page_ranges.get(chapter_num, (1, 0))
            if type(page) is not int or not low <= page <= high:
                errors.append(f"{prefix}: source.page must be within {low}-{high}")
            if "slide" in source:
                slide = source["slide"]
                if not isinstance(slide, dict) or set(slide) != {"file", "number"}:
                    errors.append(f"{prefix}: source.slide fields are invalid")
                elif (
                    slide.get("file") != slide_files.get(chapter_num)
                    or type(slide.get("number")) is not int
                    or slide["number"] < 1
                ):
                    errors.append(f"{prefix}: source.slide does not match chapter policy")

    is_ready_profile = profile.status == "ready"
    if is_ready_profile and len(questions) != profile.question_target:
        errors.append(
            f"{profile.id}: expected {profile.question_target} questions, received {len(questions)}"
        )
    elif profile.status == "draft" and len(questions) != profile.question_target:
        warnings.append(
            f"{profile.id}: draft has {len(questions)}/{profile.question_target} authored questions"
        )
    for chapter in profile.chapters:
        target = chapter_targets[chapter.number]
        if is_ready_profile and chapter_counts[chapter.number] != chapter.question_target:
            errors.append(
                f"{profile.id}/{chapter.id}: expected {chapter.question_target} questions, "
                f"received {chapter_counts[chapter.number]}"
            )
        if is_ready_profile and dict(chapter_difficulties[chapter.number]) != target.difficulty_targets:
            errors.append(f"{profile.id}/{chapter.id}: difficulty targets do not match")
        actual_positions = tuple(chapter_answers[chapter.number][index] for index in range(4))
        if is_ready_profile and actual_positions != target.answer_position_targets:
            errors.append(f"{profile.id}/{chapter.id}: answer-position targets do not match")
        sequence = answer_sequences[chapter.number]
        if _max_answer_run(sequence) > 3:
            errors.append(f"{profile.id}/{chapter.id}: answer run exceeds 3")
        cycle = _find_generic_cycle(sequence)
        if cycle is not None:
            errors.append(
                f"{profile.id}/{chapter.id}: repeated answer cycle period {cycle[1]} "
                f"at offset {cycle[0] + 1}"
            )
    if is_ready_profile and dict(difficulties) != validation.difficulty_targets:
        errors.append(f"{profile.id}: overall difficulty targets do not match")
    actual_answers = tuple(answers[index] for index in range(4))
    if is_ready_profile and actual_answers != validation.answer_position_targets:
        errors.append(f"{profile.id}: overall answer-position targets do not match")
    if check_similarity:
        for items in chapter_stems.values():
            for left_index, (left_id, left_stem) in enumerate(items):
                for right_id, right_stem in items[left_index + 1 :]:
                    if SequenceMatcher(None, left_stem, right_stem).ratio() >= 0.94:
                        warnings.append(f"{left_id}/{right_id}: stems are very similar")
    if is_ready_profile:
        _validate_review_signoff(profile, errors)
    study_ready = is_ready_profile and profile.declared_study_ready and not errors
    lines = [
        f"Subject: {profile.id}",
        f"Status: {profile.status}",
        f"Study ready: {'yes' if study_ready else 'no'}",
        f"Questions: {len(questions)}",
        f"Errors: {len(errors)}",
        f"Warnings: {len(warnings)}",
        "Difficulty: " + ", ".join(f"{name}={difficulties[name]}" for name in PROFILE_DIFFICULTIES),
        "Answers: " + ", ".join(f"{'ABCD'[index]}={answers[index]}" for index in range(4)),
    ]
    if errors:
        lines.extend(["", "Errors:", *[f"  - {item}" for item in errors]])
    if warnings:
        lines.extend(["", "Warnings:", *[f"  - {item}" for item in warnings]])
    return ValidationResult(
        profile.id, profile.status, study_ready, len(questions), tuple(errors),
        tuple(warnings), "\n".join(lines),
    )


def _profile_cli(argv: list[str]) -> int:
    from compose_questions import compose_subject
    from subject_catalog import CatalogError, load_subjects

    parser = argparse.ArgumentParser(description="Validate subject-aware question banks.")
    selection = parser.add_mutually_exclusive_group(required=True)
    selection.add_argument("--subject", metavar="ID")
    selection.add_argument("--all", action="store_true")
    parser.add_argument("--check", action="store_true", help="Read-only validation.")
    parser.add_argument("--report", type=Path, help="Explicit report output path.")
    args = parser.parse_args(argv)
    if args.check and args.report is not None:
        parser.error("--check cannot be combined with --report")
    try:
        registry, profiles = load_subjects(BASE)
        if args.subject:
            canonical = registry.canonical_id(args.subject)
            if canonical is None:
                raise CatalogError(f"Unknown subject: {args.subject}")
            selected = [profile for profile in profiles if profile.id == canonical]
        else:
            selected = list(profiles)
        results: list[ValidationResult] = []
        for profile in selected:
            questions = [] if profile.status == "comingSoon" else compose_subject(BASE, profile)
            results.append(validate_subject(profile, questions, root=BASE))
        report = "\n\n".join(result.report for result in results)
        if args.report is not None:
            args.report.parent.mkdir(parents=True, exist_ok=True)
            args.report.write_text(report + "\n", encoding="utf-8")
        print(report)
        return 1 if any(result.errors for result in results) else 0
    except (CatalogError, OSError, ValueError) as exc:
        print(f"Validation failed: {exc}", file=sys.stderr)
        return 1


def main(argv: list[str] | None = None) -> int:
    configure_utf8_console()
    arguments = list(sys.argv[1:] if argv is None else argv)
    if arguments and any(argument.startswith("--") for argument in arguments):
        return _profile_cli(arguments)
    bank_path = Path(arguments[0]) if arguments else DEFAULT_BANK
    errors, _, report = validate_file(bank_path, write_report=True)
    print(report)
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
