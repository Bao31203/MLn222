# -*- coding: utf-8 -*-
"""Validate the curated MLN222 question bank and write a quality report."""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
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


def main() -> int:
    configure_utf8_console()
    bank_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_BANK
    errors, _, report = validate_file(bank_path, write_report=True)
    print(report)
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
