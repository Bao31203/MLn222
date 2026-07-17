# -*- coding: utf-8 -*-
"""Compose reviewed chapter files into the production question bank."""
from __future__ import annotations

import json
import sys
from pathlib import Path

from validate_questions import configure_utf8_console, validate_file


BASE = Path(__file__).resolve().parent
CHAPTER_DIR = BASE / "content" / "chapters"
OUTPUT = BASE / "questions.json"
NEXT_OUTPUT = BASE / ".questions.next.json"
EXPECTED_COUNTS = (64, 89, 99, 84, 84, 84)


def main() -> int:
    configure_utf8_console()
    questions: list[dict] = []

    for chapter_num, expected_count in enumerate(EXPECTED_COUNTS, start=1):
        path = CHAPTER_DIR / f"chapter-{chapter_num:02d}.json"
        if not path.exists():
            print(f"Thiếu file chương: {path}", file=sys.stderr)
            return 1

        try:
            items = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            print(f"Không đọc được {path.name}: {exc}", file=sys.stderr)
            return 1

        if not isinstance(items, list) or len(items) != expected_count:
            actual = len(items) if isinstance(items, list) else "không phải mảng"
            print(
                f"{path.name}: cần {expected_count} câu, nhận được {actual}",
                file=sys.stderr,
            )
            return 1

        for item_index, item in enumerate(items, start=1):
            if not isinstance(item, dict):
                print(
                    f"{path.name}: phần tử {item_index} phải là object JSON",
                    file=sys.stderr,
                )
                return 1
            question = dict(item)
            question["num"] = len(questions) + 1
            questions.append(question)

    NEXT_OUTPUT.write_text(
        json.dumps(questions, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    errors, _, report = validate_file(NEXT_OUTPUT, write_report=False)
    if errors:
        NEXT_OUTPUT.unlink(missing_ok=True)
        print(report, file=sys.stderr)
        print("Ngân hàng hiện tại được giữ nguyên vì bản hợp nhất chưa hợp lệ.", file=sys.stderr)
        return 1

    NEXT_OUTPUT.replace(OUTPUT)
    _, _, final_report = validate_file(OUTPUT, write_report=True)
    print(final_report)
    print(f"Đã hợp nhất {len(questions)} câu vào {OUTPUT}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
