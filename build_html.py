# -*- coding: utf-8 -*-
"""Validate and inject questions.json into a standalone index.html."""
from __future__ import annotations

import json
import tempfile
from pathlib import Path

from validate_questions import REPORT, configure_utf8_console, validate_file


BASE = Path(__file__).resolve().parent
BANK = BASE / "questions.json"
TEMPLATE = BASE / "template.html"
OUTPUT = BASE / "index.html"
PLACEHOLDER = "/*__QUESTIONS__*/[]"


def serialize_for_inline_script(data: object) -> str:
    """Serialize JSON without exposing HTML parser control sequences."""
    return (
        json.dumps(data, ensure_ascii=False, separators=(",", ":"))
        .replace("<", "\\u003c")
        .replace("\u2028", "\\u2028")
        .replace("\u2029", "\\u2029")
    )


def main() -> int:
    configure_utf8_console()

    try:
        bank_snapshot = BANK.read_bytes()
        template = TEMPLATE.read_text(encoding="utf-8")
    except OSError as exc:
        print(f"Không đọc được dữ liệu đóng gói: {exc}")
        return 1

    snapshot_path: Path | None = None
    output_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="wb",
            dir=BASE,
            prefix=".questions.build-",
            suffix=".json",
            delete=False,
        ) as snapshot_file:
            snapshot_file.write(bank_snapshot)
            snapshot_path = Path(snapshot_file.name)

        errors, _, report = validate_file(snapshot_path, write_report=False)
        display_report = report.replace(str(snapshot_path), str(BANK), 1)
        REPORT.write_text(display_report + "\n", encoding="utf-8")
        if errors:
            print(display_report)
            print("Build dừng vì questions.json chưa hợp lệ.")
            return 1

        data = json.loads(bank_snapshot.decode("utf-8"))
        if template.count(PLACEHOLDER) != 1:
            print("Template phải chứa đúng một placeholder dữ liệu.")
            return 1

        payload = serialize_for_inline_script(data)
        html = template.replace(PLACEHOLDER, payload)

        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            newline="",
            dir=BASE,
            prefix=".index.build-",
            suffix=".html",
            delete=False,
        ) as output_file:
            output_file.write(html)
            output_path = Path(output_file.name)

        output_path.replace(OUTPUT)
        output_path = None
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as exc:
        print(f"Không thể đóng gói website: {exc}")
        return 1
    finally:
        if snapshot_path is not None:
            snapshot_path.unlink(missing_ok=True)
        if output_path is not None:
            output_path.unlink(missing_ok=True)

    print(f"Built index.html with {len(data)} questions ({len(html) // 1024} KB).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
