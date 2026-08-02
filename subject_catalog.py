# -*- coding: utf-8 -*-
"""Strict registry/profile loading for the multi-subject study catalog."""
from __future__ import annotations

import json
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Any, Iterable


BASE = Path(__file__).resolve().parent
REGISTRY_LIMIT = 256 * 1024
PROFILE_LIMIT = 256 * 1024
CHAPTER_FILE_LIMIT = 4 * 1024 * 1024
SUBJECT_BANK_LIMIT = 12 * 1024 * 1024
ID_PATTERN = re.compile(r"^[a-z][a-z0-9-]{1,31}$")
KIND_PATTERN = re.compile(r"^[a-z][a-z0-9_]{1,63}$")
RESERVED_IDS = frozenset({"__proto__", "prototype", "constructor"})
STATUSES = frozenset({"ready", "draft", "comingSoon"})
FEATURE_KEYS = frozenset({"quiz", "flashcards", "search", "lectures", "game"})
DIFFICULTIES = ("Nhận biết", "Thông hiểu", "Vận dụng")
SOURCE_SCHEMAS = frozenset({"markdown-section", "legacy-pdf-page"})
BIDI_CLASSES = frozenset({"LRE", "RLE", "LRO", "RLO", "PDF", "LRI", "RLI", "FSI", "PDI"})

REGISTRY_FIELDS = frozenset({"schemaVersion", "subjects"})
REGISTRY_ITEM_FIELDS = frozenset({"id", "code", "legacyAliases", "status", "metadataPath"})
PROFILE_BASE_FIELDS = frozenset({
    "schemaVersion", "id", "code", "legacyAliases", "title", "description", "status",
    "studyReady", "copyReviewRequired", "features", "questionTarget", "chapters",
})
PROFILE_CONTENT_FIELDS = frozenset({"questionFiles", "lectureManifest", "validation"})
CHAPTER_FIELDS = frozenset({"id", "number", "title", "questionTarget"})
QUESTION_FILE_FIELDS = frozenset({"chapterNum", "path"})
VALIDATION_FIELDS = frozenset({
    "questionIdPattern", "courseIdPolicy", "allowedKinds", "difficultyTargets",
    "answerPositionTargets", "chapterTargets", "sourcePolicy", "reviewSignoffPath",
})
CHAPTER_TARGET_FIELDS = frozenset({"chapterNum", "difficultyTargets", "answerPositionTargets"})
SOURCE_POLICY_FIELDS = frozenset({
    "schema", "allowedSources", "allowedSlideFiles", "chapterPageRanges",
})
ALLOWED_SOURCE_FIELDS = frozenset({"file", "label"})
ALLOWED_SLIDE_FIELDS = frozenset({"chapterNum", "file"})
PAGE_RANGE_FIELDS = frozenset({"chapterNum", "first", "last"})


class CatalogError(ValueError):
    """Raised when registry/profile data violates the frozen content contract."""


@dataclass(frozen=True)
class RegistryItem:
    id: str
    code: str
    legacy_aliases: tuple[str, ...]
    status: str
    metadata_path: str


@dataclass(frozen=True)
class Registry:
    content_root: Path
    subjects_root: Path
    items: tuple[RegistryItem, ...]

    def canonical_id(self, value: str) -> str | None:
        key = normalized_key(value)
        for item in self.items:
            if key == normalized_key(item.id) or any(
                key == normalized_key(alias) for alias in item.legacy_aliases
            ):
                return item.id
        return None

    def get(self, value: str) -> RegistryItem | None:
        canonical = self.canonical_id(value)
        return next((item for item in self.items if item.id == canonical), None)


@dataclass(frozen=True)
class ChapterProfile:
    id: str
    number: int
    title: str
    question_target: int


@dataclass(frozen=True)
class QuestionFile:
    chapter_num: int
    relative_path: str
    path: Path


@dataclass(frozen=True)
class SourcePolicy:
    schema: str
    allowed_sources: tuple[tuple[str, str], ...]
    allowed_slide_files: tuple[tuple[int, str], ...]
    chapter_page_ranges: tuple[tuple[int, int, int], ...]

    @property
    def labels(self) -> dict[str, str]:
        return dict(self.allowed_sources)

    @property
    def slide_files(self) -> dict[int, str]:
        return dict(self.allowed_slide_files)

    @property
    def page_ranges(self) -> dict[int, tuple[int, int]]:
        return {chapter: (first, last) for chapter, first, last in self.chapter_page_ranges}


@dataclass(frozen=True)
class ChapterTarget:
    chapter_num: int
    difficulty_targets: dict[str, int]
    answer_position_targets: tuple[int, int, int, int]


@dataclass(frozen=True)
class ValidationProfile:
    question_id_pattern: str
    course_id_policy: str
    allowed_kinds: tuple[str, ...]
    difficulty_targets: dict[str, int]
    answer_position_targets: tuple[int, int, int, int]
    chapter_targets: tuple[ChapterTarget, ...]
    source_policy: SourcePolicy
    review_signoff_path: Path | None


@dataclass(frozen=True)
class SubjectProfile:
    content_root: Path
    metadata_path: Path
    id: str
    code: str
    legacy_aliases: tuple[str, ...]
    title: str
    description: str
    status: str
    declared_study_ready: bool
    copy_review_required: bool
    features: dict[str, bool]
    question_target: int
    chapters: tuple[ChapterProfile, ...]
    question_files: tuple[QuestionFile, ...]
    lecture_manifest: Path | None
    validation: ValidationProfile | None

    @property
    def chapter_by_number(self) -> dict[int, ChapterProfile]:
        return {chapter.number: chapter for chapter in self.chapters}


def normalized_key(value: str) -> str:
    return unicodedata.normalize("NFC", value).casefold()


def validate_safe_text(
    value: object,
    field: str,
    max_length: int,
    *,
    minimum: int = 1,
) -> str:
    if not isinstance(value, str):
        raise CatalogError(f"{field} must be a string.")
    if unicodedata.normalize("NFC", value) != value:
        raise CatalogError(f"{field} must use NFC normalization.")
    if not minimum <= len(value) <= max_length or (minimum and not value.strip()):
        raise CatalogError(f"{field} length must be {minimum}-{max_length} code points.")
    for character in value:
        code = ord(character)
        if (code < 32 or 127 <= code <= 159) and character not in "\t\n":
            raise CatalogError(f"{field} contains a forbidden control character.")
        if unicodedata.bidirectional(character) in BIDI_CLASSES:
            raise CatalogError(f"{field} contains a forbidden bidi control.")
    return value


def validate_identifier(value: object, field: str) -> str:
    text = validate_single_line_text(value, field, 32)
    if not ID_PATTERN.fullmatch(text) or normalized_key(text) in RESERVED_IDS:
        raise CatalogError(f"{field} is not an allowed identifier.")
    return text


def validate_single_line_text(
    value: object,
    field: str,
    max_length: int,
    *,
    minimum: int = 1,
) -> str:
    text = validate_safe_text(value, field, max_length, minimum=minimum)
    if "\n" in text or "\r" in text or "\t" in text:
        raise CatalogError(f"{field} must be a single-line string without tabs.")
    return text


def require_exact_fields(value: object, fields: Iterable[str], context: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise CatalogError(f"{context} must be an object.")
    expected = frozenset(fields)
    actual = frozenset(value)
    if actual != expected:
        missing = sorted(expected - actual)
        extra = sorted(actual - expected)
        raise CatalogError(f"{context} fields mismatch; missing={missing}, extra={extra}.")
    return value


def _strict_int(value: object, field: str, *, minimum: int = 0) -> int:
    if type(value) is not int or value < minimum:
        raise CatalogError(f"{field} must be an integer >= {minimum}.")
    return value


def _content_root(root: Path | str) -> Path:
    base = Path(root)
    candidate = base if base.name.casefold() == "content" else base / "content"
    resolved = candidate.resolve()
    if not resolved.is_dir():
        raise CatalogError(f"Content root does not exist: {candidate}")
    return resolved


def resolve_content_path(
    content_root: Path,
    relative: object,
    *,
    context: str,
    beneath: Path | None = None,
    must_exist: bool = True,
) -> Path:
    text = validate_single_line_text(relative, context, 320)
    if "\\" in text or ":" in text:
        raise CatalogError(f"{context} must be a canonical POSIX relative path.")
    pure = PurePosixPath(text)
    if pure.is_absolute() or not pure.parts or any(part in {"", ".", ".."} for part in pure.parts):
        raise CatalogError(f"{context} must not contain traversal or aliases.")
    anchor = (beneath or content_root).resolve()
    candidate = anchor.joinpath(*pure.parts)
    try:
        resolved = candidate.resolve(strict=must_exist)
    except OSError as exc:
        raise CatalogError(f"{context} does not resolve to a file: {text}") from exc
    if resolved == anchor or anchor not in resolved.parents:
        raise CatalogError(f"{context} escapes its allowed root.")
    if must_exist and not resolved.is_file():
        raise CatalogError(f"{context} is not a file: {text}")
    return resolved


def load_json(path: Path, *, max_bytes: int, context: str) -> Any:
    try:
        size = path.stat().st_size
        if size > max_bytes:
            raise CatalogError(f"{context} exceeds {max_bytes} bytes.")
        raw = path.read_bytes()
        text = raw.decode("utf-8")
        return json.loads(text)
    except CatalogError:
        raise
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise CatalogError(f"Cannot read {context}: {exc}") from exc


def _validate_features(value: object, context: str) -> dict[str, bool]:
    data = require_exact_fields(value, FEATURE_KEYS, context)
    if any(type(enabled) is not bool for enabled in data.values()):
        raise CatalogError(f"{context} values must be booleans.")
    return {name: data[name] for name in sorted(FEATURE_KEYS)}


def _targets(value: object, context: str) -> dict[str, int]:
    data = require_exact_fields(value, DIFFICULTIES, context)
    return {name: _strict_int(data[name], f"{context}.{name}") for name in DIFFICULTIES}


def _positions(value: object, context: str) -> tuple[int, int, int, int]:
    if not isinstance(value, list) or len(value) != 4:
        raise CatalogError(f"{context} must contain four counts.")
    return tuple(_strict_int(item, f"{context}[{index}]") for index, item in enumerate(value))  # type: ignore[return-value]


def load_registry(root: Path | str = BASE) -> Registry:
    content_root = _content_root(root)
    subjects_root = (content_root / "subjects").resolve()
    registry_path = resolve_content_path(
        content_root, "registry.json", context="registry path", beneath=subjects_root
    )
    data = require_exact_fields(
        load_json(registry_path, max_bytes=REGISTRY_LIMIT, context="registry"),
        REGISTRY_FIELDS,
        "registry",
    )
    if data["schemaVersion"] != 1 or not isinstance(data["subjects"], list):
        raise CatalogError("Registry schemaVersion/subjects are invalid.")
    items: list[RegistryItem] = []
    ids: set[str] = set()
    codes: set[str] = set()
    aliases: set[str] = set()
    paths: set[Path] = set()
    for index, raw in enumerate(data["subjects"]):
        item = require_exact_fields(raw, REGISTRY_ITEM_FIELDS, f"registry.subjects[{index}]")
        subject_id = validate_identifier(item["id"], f"registry.subjects[{index}].id")
        code = validate_single_line_text(item["code"], f"registry.subjects[{index}].code", 32)
        status = item["status"]
        if status not in STATUSES:
            raise CatalogError(f"registry.subjects[{index}].status is invalid.")
        if not isinstance(item["legacyAliases"], list):
            raise CatalogError(f"registry.subjects[{index}].legacyAliases must be an array.")
        item_aliases = tuple(
            validate_identifier(alias, f"registry.subjects[{index}].legacyAliases")
            for alias in item["legacyAliases"]
        )
        metadata_path = validate_single_line_text(
            item["metadataPath"], f"registry.subjects[{index}].metadataPath", 320
        )
        resolved = resolve_content_path(
            content_root, metadata_path, context="metadataPath", beneath=content_root
        )
        if subjects_root not in resolved.parents:
            raise CatalogError("metadataPath must resolve beneath content/subjects.")
        id_key, code_key = normalized_key(subject_id), normalized_key(code)
        alias_keys = {normalized_key(alias) for alias in item_aliases}
        if id_key in ids or code_key in codes or len(alias_keys) != len(item_aliases):
            raise CatalogError("Registry contains duplicate identifiers, codes, or aliases.")
        if (
            id_key in aliases
            or id_key in alias_keys
            or any(key in ids or key in aliases for key in alias_keys)
        ):
            raise CatalogError("Registry aliases collide with canonical subject identifiers.")
        if resolved in paths:
            raise CatalogError("Registry metadata paths must be unique.")
        ids.add(id_key)
        codes.add(code_key)
        aliases.update(alias_keys)
        paths.add(resolved)
        items.append(RegistryItem(subject_id, code, item_aliases, status, metadata_path))
    return Registry(content_root, subjects_root, tuple(items))


def _load_source_policy(raw: object, chapters: set[int], content_root: Path) -> SourcePolicy:
    data = require_exact_fields(raw, SOURCE_POLICY_FIELDS, "validation.sourcePolicy")
    schema = data["schema"]
    if schema not in SOURCE_SCHEMAS:
        raise CatalogError("validation.sourcePolicy.schema is invalid.")
    if not isinstance(data["allowedSources"], list) or not data["allowedSources"]:
        raise CatalogError("validation.sourcePolicy.allowedSources must be non-empty.")
    sources: list[tuple[str, str]] = []
    seen_files: set[str] = set()
    for index, raw_source in enumerate(data["allowedSources"]):
        source = require_exact_fields(raw_source, ALLOWED_SOURCE_FIELDS, f"allowedSources[{index}]")
        filename = validate_single_line_text(source["file"], f"allowedSources[{index}].file", 320)
        if PurePosixPath(filename).name != filename or "\\" in filename:
            raise CatalogError("Allowed source names must be basenames, not paths.")
        label = validate_single_line_text(source["label"], f"allowedSources[{index}].label", 160)
        key = normalized_key(filename)
        if key in seen_files:
            raise CatalogError("Allowed source files must be unique.")
        seen_files.add(key)
        sources.append((filename, label))

    slides: list[tuple[int, str]] = []
    if not isinstance(data["allowedSlideFiles"], list):
        raise CatalogError("allowedSlideFiles must be an array.")
    for index, raw_slide in enumerate(data["allowedSlideFiles"]):
        slide = require_exact_fields(raw_slide, ALLOWED_SLIDE_FIELDS, f"allowedSlideFiles[{index}]")
        chapter = _strict_int(slide["chapterNum"], "allowedSlideFiles.chapterNum", minimum=1)
        filename = validate_single_line_text(slide["file"], "allowedSlideFiles.file", 320)
        if chapter not in chapters or PurePosixPath(filename).name != filename or "\\" in filename:
            raise CatalogError("Allowed slide metadata is invalid.")
        slides.append((chapter, filename))
    if len({chapter for chapter, _ in slides}) != len(slides):
        raise CatalogError("Allowed slide chapter numbers must be unique.")

    ranges: list[tuple[int, int, int]] = []
    if not isinstance(data["chapterPageRanges"], list):
        raise CatalogError("chapterPageRanges must be an array.")
    for index, raw_range in enumerate(data["chapterPageRanges"]):
        item = require_exact_fields(raw_range, PAGE_RANGE_FIELDS, f"chapterPageRanges[{index}]")
        chapter = _strict_int(item["chapterNum"], "chapterPageRanges.chapterNum", minimum=1)
        first = _strict_int(item["first"], "chapterPageRanges.first", minimum=1)
        last = _strict_int(item["last"], "chapterPageRanges.last", minimum=first)
        if chapter not in chapters:
            raise CatalogError("Page range references an unknown chapter.")
        ranges.append((chapter, first, last))
    if len({chapter for chapter, _, _ in ranges}) != len(ranges):
        raise CatalogError("Page range chapter numbers must be unique.")
    if schema == "markdown-section" and (slides or ranges):
        raise CatalogError("markdown-section sources cannot declare slides/page ranges.")
    if schema == "legacy-pdf-page" and {item[0] for item in ranges} != chapters:
        raise CatalogError("legacy-pdf-page requires one page range per chapter.")
    return SourcePolicy(schema, tuple(sources), tuple(slides), tuple(ranges))


def load_subject_profile(
    root: Path | str,
    registry_item: RegistryItem,
    *,
    registry: Registry | None = None,
) -> SubjectProfile:
    registry = registry or load_registry(root)
    content_root = registry.content_root
    metadata_path = resolve_content_path(
        content_root, registry_item.metadata_path, context="metadataPath", beneath=content_root
    )
    raw = load_json(metadata_path, max_bytes=PROFILE_LIMIT, context=f"{registry_item.id} profile")
    if not isinstance(raw, dict):
        raise CatalogError("Subject profile must be an object.")
    expected_fields = PROFILE_BASE_FIELDS | (
        PROFILE_CONTENT_FIELDS if registry_item.status in {"ready", "draft"} else frozenset()
    )
    data = require_exact_fields(raw, expected_fields, f"profile {registry_item.id}")
    if data["schemaVersion"] != 1:
        raise CatalogError("Subject profile schemaVersion must be 1.")
    subject_id = validate_identifier(data["id"], "profile.id")
    code = validate_single_line_text(data["code"], "profile.code", 32)
    aliases_raw = data["legacyAliases"]
    if not isinstance(aliases_raw, list):
        raise CatalogError("profile.legacyAliases must be an array.")
    aliases = tuple(validate_identifier(alias, "profile.legacyAliases") for alias in aliases_raw)
    if (
        subject_id != registry_item.id
        or code != registry_item.code
        or aliases != registry_item.legacy_aliases
        or data["status"] != registry_item.status
    ):
        raise CatalogError("Subject identity does not match its registry entry.")
    title = validate_single_line_text(data["title"], "profile.title", 160)
    description = validate_single_line_text(data["description"], "profile.description", 400)
    if type(data["studyReady"]) is not bool or type(data["copyReviewRequired"]) is not bool:
        raise CatalogError("studyReady/copyReviewRequired must be booleans.")
    features = _validate_features(data["features"], "profile.features")
    question_target = _strict_int(data["questionTarget"], "profile.questionTarget")
    if not isinstance(data["chapters"], list):
        raise CatalogError("profile.chapters must be an array.")
    chapters: list[ChapterProfile] = []
    chapter_ids: set[str] = set()
    chapter_numbers: set[int] = set()
    for index, raw_chapter in enumerate(data["chapters"]):
        chapter = require_exact_fields(raw_chapter, CHAPTER_FIELDS, f"chapters[{index}]")
        chapter_id = validate_identifier(chapter["id"], f"chapters[{index}].id")
        number = _strict_int(chapter["number"], f"chapters[{index}].number", minimum=1)
        chapter_title = validate_single_line_text(chapter["title"], f"chapters[{index}].title", 160)
        target = _strict_int(chapter["questionTarget"], f"chapters[{index}].questionTarget")
        if normalized_key(chapter_id) in chapter_ids or number in chapter_numbers:
            raise CatalogError("Chapter IDs and numbers must be unique.")
        chapter_ids.add(normalized_key(chapter_id))
        chapter_numbers.add(number)
        chapters.append(ChapterProfile(chapter_id, number, chapter_title, target))
    if [chapter.number for chapter in chapters] != list(range(1, len(chapters) + 1)):
        raise CatalogError("Chapters must be ordered with contiguous numbers 1..N.")
    if sum(chapter.question_target for chapter in chapters) != question_target:
        raise CatalogError("Chapter targets must sum to profile.questionTarget.")

    if registry_item.status == "comingSoon":
        if data["studyReady"] or question_target or chapters or any(features.values()):
            raise CatalogError("comingSoon profiles must be metadata-only with all features disabled.")
        return SubjectProfile(
            content_root, metadata_path, subject_id, code, aliases, title, description,
            registry_item.status, False, data["copyReviewRequired"], features, 0,
            tuple(), tuple(), None, None,
        )

    if registry_item.status == "draft" and data["studyReady"]:
        raise CatalogError("draft profiles cannot declare studyReady=true.")
    if registry_item.status == "ready" and not data["studyReady"]:
        raise CatalogError("ready profiles must declare studyReady=true.")
    if registry_item.status == "ready" and data["copyReviewRequired"]:
        raise CatalogError("ready profiles cannot require copy review.")
    if not chapters or question_target <= 0 or not features["quiz"]:
        raise CatalogError("ready/draft profiles require chapters, questions, and quiz support.")

    if not isinstance(data["questionFiles"], list):
        raise CatalogError("profile.questionFiles must be an array.")
    question_files: list[QuestionFile] = []
    seen_paths: set[Path] = set()
    for index, raw_file in enumerate(data["questionFiles"]):
        item = require_exact_fields(raw_file, QUESTION_FILE_FIELDS, f"questionFiles[{index}]")
        chapter_num = _strict_int(item["chapterNum"], "questionFiles.chapterNum", minimum=1)
        relative = validate_single_line_text(item["path"], "questionFiles.path", 320)
        resolved = resolve_content_path(content_root, relative, context="questionFiles.path")
        if chapter_num not in chapter_numbers or resolved in seen_paths:
            raise CatalogError("Question files reference duplicate/unknown chapters or paths.")
        seen_paths.add(resolved)
        question_files.append(QuestionFile(chapter_num, relative, resolved))
    if [item.chapter_num for item in question_files] != [chapter.number for chapter in chapters]:
        raise CatalogError("questionFiles must match chapter order exactly.")
    if sum(item.path.stat().st_size for item in question_files) > SUBJECT_BANK_LIMIT:
        raise CatalogError("Subject bank exceeds the 12 MiB pre-parse limit.")
    if any(item.path.stat().st_size > CHAPTER_FILE_LIMIT for item in question_files):
        raise CatalogError("A chapter file exceeds the 4 MiB pre-parse limit.")

    lecture_manifest: Path | None = None
    if data["lectureManifest"] is not None:
        lecture_manifest = resolve_content_path(
            content_root, data["lectureManifest"], context="profile.lectureManifest"
        )
    if features["lectures"] != (lecture_manifest is not None):
        raise CatalogError("features.lectures must exactly match lectureManifest availability.")

    validation = require_exact_fields(data["validation"], VALIDATION_FIELDS, "profile.validation")
    pattern = validate_single_line_text(validation["questionIdPattern"], "questionIdPattern", 160)
    try:
        re.compile(pattern)
    except re.error as exc:
        raise CatalogError(f"questionIdPattern is invalid: {exc}") from exc
    policy = validation["courseIdPolicy"]
    if policy not in {"required", "forbidden"}:
        raise CatalogError("courseIdPolicy must be required or forbidden.")
    if not isinstance(validation["allowedKinds"], list) or not validation["allowedKinds"]:
        raise CatalogError("allowedKinds must be a non-empty array.")
    kinds = tuple(
        validate_single_line_text(kind, "allowedKinds", 64) for kind in validation["allowedKinds"]
    )
    if len(set(kinds)) != len(kinds) or any(not KIND_PATTERN.fullmatch(kind) for kind in kinds):
        raise CatalogError("allowedKinds contains duplicates or invalid values.")
    difficulty_targets = _targets(validation["difficultyTargets"], "difficultyTargets")
    answer_targets = _positions(validation["answerPositionTargets"], "answerPositionTargets")
    if sum(difficulty_targets.values()) != question_target or sum(answer_targets) != question_target:
        raise CatalogError("Overall validation targets must sum to questionTarget.")
    if not isinstance(validation["chapterTargets"], list):
        raise CatalogError("chapterTargets must be an array.")
    chapter_targets: list[ChapterTarget] = []
    for index, raw_target in enumerate(validation["chapterTargets"]):
        target = require_exact_fields(raw_target, CHAPTER_TARGET_FIELDS, f"chapterTargets[{index}]")
        chapter_num = _strict_int(target["chapterNum"], "chapterTargets.chapterNum", minimum=1)
        difficulties = _targets(target["difficultyTargets"], "chapterTargets.difficultyTargets")
        positions = _positions(target["answerPositionTargets"], "chapterTargets.answerPositionTargets")
        chapter = next((item for item in chapters if item.number == chapter_num), None)
        if chapter is None or sum(difficulties.values()) != chapter.question_target or sum(positions) != chapter.question_target:
            raise CatalogError("Chapter validation targets do not match chapter metadata.")
        chapter_targets.append(ChapterTarget(chapter_num, difficulties, positions))
    if [target.chapter_num for target in chapter_targets] != [chapter.number for chapter in chapters]:
        raise CatalogError("chapterTargets must match chapter order exactly.")
    source_policy = _load_source_policy(validation["sourcePolicy"], chapter_numbers, content_root)
    signoff_path = None
    if validation["reviewSignoffPath"] is not None:
        signoff_path = resolve_content_path(
            content_root, validation["reviewSignoffPath"], context="reviewSignoffPath"
        )
    if registry_item.status == "ready" and policy == "required" and signoff_path is None:
        raise CatalogError("ready profiles with required courseId must declare review sign-off.")
    profile_validation = ValidationProfile(
        pattern, policy, kinds, difficulty_targets, answer_targets,
        tuple(chapter_targets), source_policy, signoff_path,
    )
    return SubjectProfile(
        content_root, metadata_path, subject_id, code, aliases, title, description,
        registry_item.status, data["studyReady"], data["copyReviewRequired"], features,
        question_target, tuple(chapters), tuple(question_files), lecture_manifest,
        profile_validation,
    )


def load_subjects(root: Path | str = BASE) -> tuple[Registry, tuple[SubjectProfile, ...]]:
    registry = load_registry(root)
    profiles = tuple(
        load_subject_profile(root, item, registry=registry) for item in registry.items
    )
    return registry, profiles
