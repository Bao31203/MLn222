# -*- coding: utf-8 -*-
"""Compose authored chapter files into validated per-subject question banks."""
from __future__ import annotations

import argparse
import json
import sys
import tempfile
from pathlib import Path
from typing import TYPE_CHECKING

from validate_questions import configure_utf8_console, validate_file

if TYPE_CHECKING:
    from subject_catalog import SubjectProfile


BASE = Path(__file__).resolve().parent
CHAPTER_DIR = BASE / "content" / "chapters"
OUTPUT = BASE / "questions.json"
NEXT_OUTPUT = BASE / ".questions.next.json"
EXPECTED_COUNTS = (64, 89, 99, 84, 84, 84)
LEGACY_SUBJECT_ID = "mln112"


def _authoring_chapter_labels(number: int, title: str) -> set[str]:
    """Return the one-time onboarding labels accepted from authored files."""
    return {title, f"Chương {number} · {title}"}


def compose_subject(root: Path | str, profile: "SubjectProfile") -> list[dict]:
    """Compose a ready/draft subject and derive num/chapterId from its profile."""
    from subject_catalog import CHAPTER_FILE_LIMIT, SUBJECT_BANK_LIMIT, CatalogError, load_json

    if profile.status == "comingSoon":
        return []
    if profile.validation is None:
        raise CatalogError(f"{profile.id} has no validation profile.")

    questions: list[dict] = []
    chapters = profile.chapter_by_number
    for question_file in profile.question_files:
        chapter = chapters[question_file.chapter_num]
        items = load_json(
            question_file.path,
            max_bytes=CHAPTER_FILE_LIMIT,
            context=f"{profile.id} chapter {chapter.number}",
        )
        if not isinstance(items, list):
            raise CatalogError(f"{question_file.relative_path} must contain a JSON array.")
        if profile.status == "ready" and len(items) != chapter.question_target:
            raise CatalogError(
                f"{question_file.relative_path}: expected {chapter.question_target} questions, "
                f"received {len(items)}."
            )
        for item_index, item in enumerate(items, start=1):
            if not isinstance(item, dict):
                raise CatalogError(
                    f"{question_file.relative_path}: item {item_index} must be a JSON object."
                )
            if type(item.get("chapterNum")) is not int or item["chapterNum"] != chapter.number:
                raise CatalogError(
                    f"{question_file.relative_path}: item {item_index} has the wrong chapterNum."
                )
            authored_chapter = item.get("chapter")
            if authored_chapter not in _authoring_chapter_labels(chapter.number, chapter.title):
                raise CatalogError(
                    f"{question_file.relative_path}: item {item_index} chapter label does not "
                    "match subject metadata."
                )
            if profile.validation.course_id_policy == "required":
                if item.get("courseId") != profile.id:
                    raise CatalogError(
                        f"{question_file.relative_path}: item {item_index} has the wrong courseId."
                    )
            elif "courseId" in item:
                raise CatalogError(
                    f"{question_file.relative_path}: item {item_index} must not declare courseId."
                )
            question = dict(item)
            question["chapter"] = chapter.title
            question["chapterId"] = chapter.id
            question["num"] = len(questions) + 1
            questions.append(question)

    encoded = json.dumps(
        questions, ensure_ascii=False, sort_keys=True, separators=(",", ":")
    ).encode("utf-8")
    if len(encoded) > SUBJECT_BANK_LIMIT:
        raise CatalogError(f"{profile.id} composed bank exceeds the 12 MiB limit.")
    return questions


def compose_all(root: Path | str = BASE) -> tuple[dict[str, list[dict]], tuple["SubjectProfile", ...]]:
    """Compose every non-placeholder profile without opening comingSoon banks."""
    from subject_catalog import load_subjects

    _, profiles = load_subjects(root)
    banks = {
        profile.id: compose_subject(root, profile)
        for profile in profiles
        if profile.status != "comingSoon"
    }
    return banks, profiles


def _atomic_json_write(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            newline="",
            dir=path.parent,
            prefix=f".{path.name}.",
            suffix=".next",
            delete=False,
        ) as stream:
            json.dump(value, stream, ensure_ascii=False, indent=2)
            stream.write("\n")
            temporary = Path(stream.name)
        temporary.replace(path)
        temporary = None
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


def _legacy_main() -> int:
    """Preserve the original no-argument MLN112 snapshot workflow byte-for-byte."""
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
            print(f"{path.name}: cần {expected_count} câu, nhận được {actual}", file=sys.stderr)
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
        json.dumps(questions, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
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


def _profile_main(argv: list[str]) -> int:
    from subject_catalog import CatalogError, load_subjects
    from validate_questions import validate_subject

    parser = argparse.ArgumentParser(description=__doc__)
    selection = parser.add_mutually_exclusive_group(required=True)
    selection.add_argument("--subject", metavar="ID")
    selection.add_argument("--all", action="store_true")
    parser.add_argument("--check", action="store_true", help="Validate without writing outputs.")
    parser.add_argument("--output", type=Path, help="Explicit output file/directory.")
    args = parser.parse_args(argv)
    if args.check and args.output is not None:
        parser.error("--check cannot be combined with --output")
    if not args.check and args.output is None:
        parser.error("profile composition requires --check or an explicit --output")

    try:
        registry, profiles = load_subjects(BASE)
        if args.subject:
            canonical = registry.canonical_id(args.subject)
            if canonical is None:
                raise CatalogError(f"Unknown subject: {args.subject}")
            selected = [profile for profile in profiles if profile.id == canonical]
        else:
            selected = list(profiles)

        exit_code = 0
        written: list[tuple[Path, list[dict]]] = []
        for profile in selected:
            if profile.status == "comingSoon":
                print(f"{profile.id}: comingSoon metadata valid; question bank not opened.")
                continue
            questions = compose_subject(BASE, profile)
            result = validate_subject(profile, questions, root=BASE)
            print(result.report)
            if result.errors:
                exit_code = 1
                continue
            if profile.status == "draft" or not result.study_ready:
                print(f"{profile.id}: draft/incomplete; no runtime bank will be published.")
                continue
            if not args.check:
                assert args.output is not None
                destination = (
                    args.output / f"{profile.id}.questions.json" if args.all else args.output
                )
                written.append((destination, questions))
        if exit_code:
            return exit_code
        for destination, questions in written:
            _atomic_json_write(destination, questions)
            print(f"Wrote {len(questions)} questions to {destination}.")
        return 0
    except (CatalogError, OSError, ValueError) as exc:
        print(f"Composition failed: {exc}", file=sys.stderr)
        return 1


def main(argv: list[str] | None = None) -> int:
    configure_utf8_console()
    arguments = list(sys.argv[1:] if argv is None else argv)
    if not arguments:
        return _legacy_main()
    return _profile_main(arguments)


if __name__ == "__main__":
    raise SystemExit(main())
