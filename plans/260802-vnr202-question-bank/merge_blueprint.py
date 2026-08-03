#!/usr/bin/env python3
"""Merge the reviewed VNR202 blueprint fragments deterministically."""

from __future__ import annotations

import json
import re
import unicodedata
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parent
FRAGMENTS = (
    ROOT / "blueprint-intro-conclusion.json",
    ROOT / "blueprint-ch1-ch3a.json",
    ROOT / "blueprint-ch2-ch3b.json",
)
OUTPUTS = (
    ROOT / "blueprint.json",
    ROOT.parents[1] / "content" / "subjects" / "vnr202" / "blueprint.json",
)
DIFFICULTIES = ("Nhận biết", "Thông hiểu", "Vận dụng")


def first_line(group: dict) -> int:
    text = " ".join(group["sourceSections"])
    match = re.search(r"(?:dòng|lines?)\s+(\d+)", text, flags=re.IGNORECASE)
    return int(match.group(1)) if match else 10**9


groups: list[dict] = []
for path in FRAGMENTS:
    payload = json.loads(path.read_text(encoding="utf-8"))
    groups.extend(payload["groups"])

groups.sort(key=lambda group: (group["chapterNum"], first_line(group), group["id"]))
ids = [group["id"] for group in groups]
if len(ids) != len(set(ids)):
    raise SystemExit("Duplicate blueprint group IDs")

total = sum(group["target"] for group in groups)
difficulty = Counter()
for group in groups:
    if group["target"] != sum(group["difficultyTargets"].values()):
        raise SystemExit(f"Target mismatch: {group['id']}")
    difficulty.update(group["difficultyTargets"])

if total != 850 or [difficulty[name] for name in DIFFICULTIES] != [340, 340, 170]:
    raise SystemExit(f"Unexpected quota: target={total}, difficulty={dict(difficulty)}")

payload = {"schemaVersion": 1, "target": total, "groups": groups}
text = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
text = unicodedata.normalize("NFC", text)
for output in OUTPUTS:
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(text, encoding="utf-8", newline="\n")
    print(f"Wrote {output} with {len(groups)} groups and target {total}")
