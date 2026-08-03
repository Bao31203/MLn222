#!/usr/bin/env python3
"""Merge independently authored VNR202 Chapter 4 slices deterministically."""

from __future__ import annotations

import json
import re
import unicodedata
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parent
SLICES = (ROOT / "drafts" / "chapter-04a.json", ROOT / "drafts" / "chapter-04b.json")
OUTPUT = ROOT.parents[1] / "content" / "subjects" / "vnr202" / "chapters" / "chapter-04.json"


questions: list[dict] = []
for path in SLICES:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, list):
        raise SystemExit(f"{path.name} must be a JSON array")
    questions.extend(payload)

expected_ids = [f"VNR202-C04-Q{number:03d}" for number in range(1, 401)]
actual_ids = [question.get("id") for question in questions]
if actual_ids != expected_ids:
    raise SystemExit("Chapter 4 IDs/order do not cover Q001..Q400 exactly")

difficulties = Counter(question.get("difficulty") for question in questions)
answers = Counter(question.get("answer") for question in questions)
if difficulties != Counter({"Nhận biết": 160, "Thông hiểu": 160, "Vận dụng": 80}):
    raise SystemExit(f"Unexpected Chapter 4 difficulty quota: {difficulties}")
if answers != Counter({0: 100, 1: 100, 2: 100, 3: 100}):
    raise SystemExit(f"Unexpected Chapter 4 answer quota: {answers}")
if any(not re.fullmatch(r"VNR202-C04-Q\d{3}", question["id"]) for question in questions):
    raise SystemExit("Invalid Chapter 4 question ID")

text = json.dumps(questions, ensure_ascii=False, indent=2) + "\n"
text = unicodedata.normalize("NFC", text)
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(text, encoding="utf-8", newline="\n")
print(f"Wrote {OUTPUT} with {len(questions)} questions")
