# -*- coding: utf-8 -*-
"""Build a machine-generated draft from extracted MLN222 lecture text.

The MLN222 source folder contains lecture notes, not a ready-made quiz with
answers. This script therefore creates study questions from nearby text:
- fact recognition: pick the statement that belongs to a topic
- concept recall: match a short heading with the following explanation
- reverse lookup: identify the topic for a quoted statement

This legacy extractor is kept only for source exploration. Its output is never
used by the production website and cannot overwrite the curated question bank.
"""
from __future__ import annotations

import hashlib
import json
import random
import re
import sys
import unicodedata
from dataclasses import dataclass
from pathlib import Path


SRC_DIR = Path(r"F:\MLN222")
OUT_DIR = Path(r"C:\Users\pgb31\mln222-quiz")
OUT = OUT_DIR / "questions.generated-draft.json"
REPORT = OUT_DIR / "draft_parse_report.txt"
PDF_STOP_HEADINGS = [
    "cau hoi on tap",
    "van de thao luan",
    "cac thuat ngu can ghi nho",
    "tai lieu tham khao",
]
PDF_SKIP_HEADINGS = [
    "tom tat chuong",
]


@dataclass(frozen=True)
class Block:
    slot: str
    file: str
    title: str
    lines: list[str]
    page: int | None = None
    source_type: str = "slides"


def clean_line(line: str) -> str:
    line = line.replace("\u000b", " ").replace("\ufeff", "")
    line = re.sub(r"\s+", " ", line)
    return line.strip()


def strip_marks(text: str) -> str:
    text = unicodedata.normalize("NFD", text)
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    return text.replace("đ", "d").replace("Đ", "D").lower()


def natural_key(path: Path) -> tuple[int, int, str]:
    match = re.search(r"Slot\s+(\d+)(?:\+(\d+))?", path.name, re.IGNORECASE)
    if not match:
        return (999, 999, path.name)
    return (int(match.group(1)), int(match.group(2) or match.group(1)), path.name)


def slot_label(path: Path) -> str:
    match = re.search(r"Slot\s+(\d+(?:\+\d+)?)\.\s*(.*?)\.pptx\.txt$", path.name, re.IGNORECASE)
    if not match:
        return path.stem
    return f"Slot {match.group(1)}: {match.group(2).strip()}"


def is_noise(line: str) -> bool:
    if not line:
        return True
    if re.fullmatch(r"\d{1,3}", line):
        return True
    if re.fullmatch(r"[-–—•·]+", line):
        return True
    return False


def looks_like_title(line: str) -> bool:
    if len(line) > 110:
        return False
    if line.endswith((".", ":", ";", ",")):
        return False
    return True


def split_blocks(path: Path) -> list[Block]:
    raw_lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    lines = [clean_line(line) for line in raw_lines]
    blocks: list[Block] = []
    current: list[str] = []

    def flush() -> None:
        nonlocal current
        meaningful = [line for line in current if not is_noise(line)]
        current = []
        if len(meaningful) < 3:
            return
        title = meaningful[0]
        if not looks_like_title(title) and len(meaningful) > 1:
            title = meaningful[1]
        blocks.append(Block(slot_label(path), path.name, title, meaningful))

    for line in lines:
        if not line:
            continue
        if re.fullmatch(r"\d{1,3}", line):
            if len([x for x in current if not is_noise(x)]) >= 3:
                flush()
            continue
        current.append(line)
    flush()
    return blocks


def is_pdf_heading(line: str) -> bool:
    if not looks_like_title(line) or len(line) < 4:
        return False
    norm = strip_marks(line)
    if any(marker in norm for marker in PDF_STOP_HEADINGS + PDF_SKIP_HEADINGS):
        return True
    if re.match(r"^\d+\.\s*(c\. mac|ph\.|v\.i\.|ho chi minh|dang cong san|jeremy|josep|manfred|klaus)", norm):
        return False
    if re.match(r"^(chuong\s+\d+|[ivx]+-|[0-9]+[.)]\s+|[0-9]+(\.[0-9]+)+[.)]?\s+|[a-z]\)\s+)", norm):
        return True
    letters = [ch for ch in line if ch.isalpha()]
    if len(letters) >= 8:
        upper = sum(1 for ch in letters if ch.upper() == ch)
        if upper / len(letters) > 0.72:
            return True
    return False


def is_pdf_stop_heading(line: str) -> bool:
    norm = strip_marks(line)
    return any(marker in norm for marker in PDF_STOP_HEADINGS)


def is_pdf_skip_heading(line: str) -> bool:
    norm = strip_marks(line)
    return any(marker in norm for marker in PDF_SKIP_HEADINGS)


def add_pdf_text(lines: list[str], text: str) -> None:
    text = clean_line(text)
    if not text:
        return
    parts = [part.strip() for part in re.split(r"(?<=[.!?;:])\s+", text) if part.strip()]
    chunk = ""
    for part in parts or [text]:
        candidate = f"{chunk} {part}".strip()
        if len(candidate) <= 340:
            chunk = candidate
            continue
        if chunk:
            lines.append(chunk)
        chunk = part
    if chunk:
        lines.append(chunk)


def pdf_page_lines(text: str) -> list[str]:
    raw = [clean_line(line) for line in text.splitlines()]
    raw = [line for line in raw if line and not re.fullmatch(r"\d{1,3}", line)]
    lines: list[str] = []
    buf = ""

    def flush() -> None:
        nonlocal buf
        item = clean_line(buf)
        buf = ""
        if item and len(item) >= 4:
            add_pdf_text(lines, item)

    for line in raw:
        if is_pdf_stop_heading(line):
            flush()
            break
        if is_pdf_skip_heading(line):
            flush()
            continue
        if is_pdf_heading(line):
            flush()
            lines.append(line)
            continue
        if not buf:
            buf = line
        else:
            buf += " " + line
        if re.search(r"[.!?;:]$", line) or len(buf) >= 420:
            flush()
    flush()
    return lines


def split_pdf_blocks(path: Path) -> list[Block]:
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise RuntimeError("Missing dependency: install pypdf to parse the PDF source") from exc

    reader = PdfReader(str(path))
    blocks: list[Block] = []
    current_title = "Giáo trình Kinh tế chính trị Mác-Lênin"
    chapter_started = False
    # Last two pages are the table of contents in this PDF; skip them.
    last_content_page = max(0, len(reader.pages) - 2)

    for page_no, page in enumerate(reader.pages, start=1):
        if page_no > last_content_page:
            break
        text = page.extract_text() or ""
        norm_text = strip_marks(text)
        if not chapter_started:
            chapter_started = bool(re.search(r"chuong\s+1", norm_text))
            if not chapter_started:
                continue

        lines = pdf_page_lines(text)
        if len(lines) < 3:
            continue

        headings = [line for line in lines if is_pdf_heading(line) and not is_pdf_skip_heading(line)]
        for i, heading in enumerate(headings):
            norm = strip_marks(heading)
            if re.fullmatch(r"chuong\s+\d+", norm) and i + 1 < len(headings):
                current_title = f"{heading}: {headings[i + 1]}"
                break
            current_title = heading
            break

        meaningful = [line for line in lines if not is_noise(line)]
        if len(meaningful) < 3:
            continue
        title = current_title
        blocks.append(Block(
            "Giáo trình PDF",
            f"{path.name} · trang {page_no}",
            title,
            meaningful,
            page=page_no,
            source_type="pdf",
        ))
    return blocks


def is_sentence(line: str) -> bool:
    if len(line) < 55 or len(line) > 420:
        return False
    if re.fullmatch(r"[\d\s.,/%$-]+", line):
        return False
    return bool(re.search(r"\b(là|có|được|phải|trở thành|biểu hiện|phản ánh|tạo ra|quyết định)\b", line, re.I))


def option_text(text: str, max_len: int = 230) -> str:
    text = clean_line(text)
    if len(text) <= max_len:
        return text
    cut = text[: max_len - 1].rsplit(" ", 1)[0].rstrip(" ,.;:")
    return cut + "..."


def sample_distractors(rng: random.Random, pool: list[str], correct: str, n: int = 3) -> list[str]:
    seen = {correct.lower()}
    candidates = [x for x in pool if x.lower() not in seen and 24 <= len(x) <= 230]
    rng.shuffle(candidates)
    chosen: list[str] = []
    for item in candidates:
        key = item.lower()
        if key in seen:
            continue
        chosen.append(item)
        seen.add(key)
        if len(chosen) == n:
            break
    return chosen


def make_item(
    qid: int,
    block: Block,
    stem: str,
    correct: str,
    distractors: list[str],
    source_line: str,
    kind: str,
) -> dict | None:
    options = [option_text(correct), *[option_text(x) for x in distractors]]
    deduped: list[str] = []
    seen: set[str] = set()
    for opt in options:
        key = opt.lower()
        if key and key not in seen:
            deduped.append(opt)
            seen.add(key)
    if len(deduped) != 4:
        return None

    seed = int(hashlib.sha1((stem + correct).encode("utf-8")).hexdigest()[:8], 16)
    rng = random.Random(seed)
    rng.shuffle(deduped)
    return {
        "id": qid,
        "chapter": block.slot,
        "chapterNum": block.slot.split(":", 1)[0].replace("Slot ", ""),
        "num": qid,
        "kind": kind,
        "stem": stem,
        "options": deduped,
        "answer": deduped.index(option_text(correct)),
        "source": {
            "file": block.file,
            "topic": block.title,
            "text": option_text(source_line, 280),
            "type": block.source_type,
            "page": block.page,
        },
    }


def heading_pairs(block: Block) -> list[tuple[str, str]]:
    pairs: list[tuple[str, str]] = []
    lines = block.lines
    for i, line in enumerate(lines[:-1]):
        nxt = lines[i + 1]
        if 4 <= len(line) <= 85 and looks_like_title(line) and is_sentence(nxt):
            pairs.append((line, nxt))
    return pairs


def generate_questions(blocks: list[Block]) -> list[dict]:
    rng = random.Random(222)
    all_sentences: list[str] = []
    all_titles: list[str] = []
    for block in blocks:
        all_titles.append(block.title)
        for line in block.lines[1:]:
            if is_sentence(line):
                all_sentences.append(option_text(line))

    questions: list[dict] = []

    def add(block: Block, stem: str, correct: str, distractor_pool: list[str], source_line: str, kind: str) -> None:
        distractors = sample_distractors(rng, distractor_pool, option_text(correct))
        item = make_item(len(questions) + 1, block, stem, correct, distractors, source_line, kind)
        if item:
            questions.append(item)

    for block in blocks:
        sentences = [option_text(line) for line in block.lines[1:] if is_sentence(line)]
        if sentences:
            correct = sentences[0]
            add(
                block,
                f"Nội dung nào sau đây gắn với chủ đề “{block.title}”?",
                correct,
                all_sentences,
                correct,
                "topic_fact",
            )

            quote = sentences[-1]
            add(
                block,
                f"Nhận định sau thuộc chủ đề nào: “{option_text(quote, 170)}”?",
                block.title,
                all_titles,
                quote,
                "reverse_topic",
            )

        for heading, explanation in heading_pairs(block)[:2]:
            add(
                block,
                f"Theo nội dung học, “{heading}” được hiểu như thế nào?",
                explanation,
                all_sentences,
                explanation,
                "concept_recall",
            )

    return questions


def validate(questions: list[dict]) -> list[str]:
    problems: list[str] = []
    for q in questions:
        if len(q.get("options", [])) != 4:
            problems.append(f"id={q.get('id')}: expected 4 options")
        if q.get("answer") not in range(4):
            problems.append(f"id={q.get('id')}: invalid answer {q.get('answer')}")
        if len({x.lower() for x in q.get("options", [])}) != 4:
            problems.append(f"id={q.get('id')}: duplicate options")
        if not q.get("source", {}).get("file"):
            problems.append(f"id={q.get('id')}: missing source")
    return problems


def main() -> int:
    if not SRC_DIR.exists():
        print(f"Missing source folder: {SRC_DIR}", file=sys.stderr)
        return 1

    files = sorted(SRC_DIR.glob("*.pptx.txt"), key=natural_key)
    pdf_files = sorted(SRC_DIR.glob("*.pdf"))
    blocks: list[Block] = []
    for path in files:
        blocks.extend(split_blocks(path))
    for path in pdf_files:
        blocks.extend(split_pdf_blocks(path))

    questions = generate_questions(blocks)
    problems = validate(questions)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(questions, ensure_ascii=False, indent=1), encoding="utf-8")

    counts: dict[str, int] = {}
    source_counts: dict[str, int] = {}
    for q in questions:
        counts[q["chapter"]] = counts.get(q["chapter"], 0) + 1
        source_type = q.get("source", {}).get("type", "unknown")
        source_counts[source_type] = source_counts.get(source_type, 0) + 1

    report: list[str] = [
        f"Source folder: {SRC_DIR}",
        f"Lecture text files: {len(files)}",
        f"PDF files: {len(pdf_files)}",
        f"Content blocks parsed: {len(blocks)}",
        f"Total questions generated: {len(questions)}",
        "",
        "Questions by source:",
    ]
    for source_type, count in source_counts.items():
        report.append(f"  {source_type}: {count}")
    report.extend([
        "",
        "Questions by slot:",
    ])
    for slot, count in counts.items():
        report.append(f"  {slot}: {count}")
    report.extend([
        "",
        f"Validation problems: {len(problems)}",
        *[f"  {p}" for p in problems[:50]],
        "",
        "DRAFT ONLY: this file is not used by build_html.py.",
        "Generated answers are unreviewed and must never replace questions.json.",
    ])
    REPORT.write_text("\n".join(report), encoding="utf-8")
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    print("\n".join(report))
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
