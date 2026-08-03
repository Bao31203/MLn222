# -*- coding: utf-8 -*-
"""Build the validated question bank and game assets into one standalone HTML file."""
from __future__ import annotations

import base64
import gzip
import hashlib
import json
import re
import shutil
import tempfile
import xml.etree.ElementTree as ET
from collections.abc import Mapping
from pathlib import Path, PurePosixPath

from validate_questions import REPORT, configure_utf8_console, validate_file


BASE = Path(__file__).resolve().parent
BANK = BASE / "questions.json"
TEMPLATE = BASE / "template.html"
OUTPUT = BASE / "index.html"
DIST = BASE / "dist"
VERCEL_CONFIG = BASE / "vercel.json"
RELEASE_MANIFEST_NAME = "release-manifest.json"
RELEASE_ALLOWLIST = frozenset({"index.html", RELEASE_MANIFEST_NAME})
COMPILER_INPUTS = (
    "subject_catalog.py", "compose_questions.py", "validate_questions.py", "build_html.py",
)

PLACEHOLDER = "/*__QUESTIONS__*/[]"
LECTURES_PLACEHOLDER = "/*__LECTURES__*/{}"
SUBJECT_CATALOG_PLACEHOLDER = "/*__SUBJECT_CATALOG__*/[]"
QUESTION_BANKS_PLACEHOLDER = "/*__QUESTION_BANKS__*/{}"
LECTURE_CATALOGS_PLACEHOLDER = "/*__LECTURE_CATALOGS__*/{}"
GAME_DATA_PLACEHOLDER = "/*__GAME_DATA__*/{}"
GAME_STYLES_PLACEHOLDER = "/*__GAME_STYLES__*/"
GAME_SCRIPTS_PLACEHOLDER = "/*__GAME_SCRIPTS__*/"
GAME_SVG_PLACEHOLDER = "<!--__GAME_SVG__-->"
GAME_MAP_TEXTURE_PLACEHOLDER = "__GAME_MAP_TEXTURE__"

FORBIDDEN_SVG_TAGS = {
    "script", "style", "foreignobject", "iframe", "object", "embed", "audio", "video"
}
GAME_DATA_KEYS = {
    "provinces", "adjacency", "balance", "personalities", "victoryRules", "units"
}
GAME_IMAGE_KEYS = {"mapTexture"}
IMAGE_MIME_TYPES = {".webp": "image/webp"}
MAX_EMBEDDED_IMAGE_BYTES = 1_000_000
LECTURE_MANIFEST_KEYS = {"schemaVersion", "provider", "playlistId", "lectures"}
LECTURE_KEYS = {
    "id", "chapterNum", "title", "durationSeconds", "videoId", "chapterValue", "summary"
}
YOUTUBE_VIDEO_ID = re.compile(r"^[A-Za-z0-9_-]{11}$")
YOUTUBE_PLAYLIST_ID = re.compile(r"^[A-Za-z0-9_-]{12,64}$")
RAW_BUDGET_BYTES = 5 * 1024 * 1024
GZIP_BUDGET_BYTES = 1 * 1024 * 1024
PUBLIC_QUESTION_FIELDS = (
    "id", "num", "chapterId", "chapterNum", "chapter", "topic", "difficulty",
    "kind", "stem", "options", "answer", "explanation", "source",
)
PUBLIC_SUBJECT_FIELDS = (
    "id", "code", "legacyAliases", "title", "description", "status", "studyReady",
    "copyReviewRequired", "features", "questionTarget", "questionCount", "chapters",
)
PUBLIC_LECTURE_FIELDS = (
    "id", "chapterId", "chapterNum", "title", "durationSeconds", "videoId", "summary",
)
INLINE_SCRIPT_PATTERN = re.compile(
    r"<script\b(?![^>]*\bsrc\s*=)[^>]*>(.*?)</script\s*>", re.IGNORECASE | re.DOTALL
)
INLINE_STYLE_PATTERN = re.compile(r"<style\b[^>]*>(.*?)</style\s*>", re.IGNORECASE | re.DOTALL)
SHA256_HEX_PATTERN = re.compile(r"^[0-9a-f]{64}$")
CSP_SHA256_PATTERN = re.compile(r"^sha256-[A-Za-z0-9+/]+={0,2}$")


class ReleaseRollbackError(RuntimeError):
    """Raised when promotion and its rollback both fail; staging is retained for recovery."""

    def __init__(self, message: str, staging: Path):
        super().__init__(message)
        self.staging = staging


def serialize_for_inline_script(data: object) -> str:
    """Serialize JSON without exposing HTML parser control sequences."""
    return (
        json.dumps(data, ensure_ascii=False, separators=(",", ":"))
        .replace("<", "\\u003c")
        .replace("\u2028", "\\u2028")
        .replace("\u2029", "\\u2029")
    )


def load_lectures(root: Path = BASE) -> dict[str, object]:
    """Load and validate the public YouTube lecture manifest."""
    path = root / "content" / "lectures.json"
    manifest = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(manifest, dict) or set(manifest) != LECTURE_MANIFEST_KEYS:
        raise ValueError("Lecture manifest has unknown or missing fields.")
    if (
        manifest["schemaVersion"] != 1
        or manifest["provider"] != "youtube"
        or not isinstance(manifest["playlistId"], str)
        or not YOUTUBE_PLAYLIST_ID.fullmatch(manifest["playlistId"])
        or not isinstance(manifest["lectures"], list)
        or len(manifest["lectures"]) != 6
    ):
        raise ValueError("Lecture manifest schema is unsupported or incomplete.")

    video_ids: set[str] = set()
    chapter_values: set[str] = set()
    for expected_chapter, lecture in enumerate(manifest["lectures"], start=1):
        if not isinstance(lecture, dict) or set(lecture) != LECTURE_KEYS:
            raise ValueError(f"Lecture {expected_chapter} has unknown or missing fields.")
        if (
            lecture["id"] != f"chapter-{expected_chapter:02d}"
            or type(lecture["chapterNum"]) is not int
            or lecture["chapterNum"] != expected_chapter
            or not isinstance(lecture["title"], str)
            or not lecture["title"].strip()
            or len(lecture["title"]) > 180
            or type(lecture["durationSeconds"]) is not int
            or not 1 <= lecture["durationSeconds"] <= 14_400
            or not isinstance(lecture["videoId"], str)
            or not YOUTUBE_VIDEO_ID.fullmatch(lecture["videoId"])
            or not isinstance(lecture["chapterValue"], str)
            or not lecture["chapterValue"].strip()
            or not isinstance(lecture["summary"], str)
            or not lecture["summary"].strip()
            or len(lecture["summary"]) > 300
        ):
            raise ValueError(f"Lecture {expected_chapter} contains invalid metadata.")
        if lecture["videoId"] in video_ids or lecture["chapterValue"] in chapter_values:
            raise ValueError("Lecture video IDs and chapter values must be unique.")
        video_ids.add(lecture["videoId"])
        chapter_values.add(lecture["chapterValue"])
    return manifest


def _game_path(root: Path, relative: str) -> Path:
    if not isinstance(relative, str) or not relative or Path(relative).is_absolute():
        raise ValueError("Manifest paths must be non-empty relative strings.")
    game_root = (root / "game").resolve()
    candidate = (game_root / relative).resolve()
    if candidate != game_root and game_root not in candidate.parents:
        raise ValueError(f"Manifest path escapes game/: {relative}")
    if not candidate.is_file():
        raise ValueError(f"Manifest asset does not exist: {relative}")
    return candidate


def _validate_svg(source: str) -> str:
    lowered = source.lower()
    if "<!doctype" in lowered or "<!entity" in lowered or "<?xml-stylesheet" in lowered:
        raise ValueError("Game SVG cannot contain a document type, entity, or stylesheet declaration.")
    try:
        root = ET.fromstring(source)
    except ET.ParseError as exc:
        raise ValueError(f"Game SVG is not well formed: {exc}") from exc
    if root.tag.rsplit("}", 1)[-1] != "svg":
        raise ValueError("Game SVG must contain exactly one SVG root.")
    for element in root.iter():
        tag = element.tag.rsplit("}", 1)[-1].lower()
        if tag in FORBIDDEN_SVG_TAGS:
            raise ValueError(f"Game SVG contains forbidden element: {tag}")
        for raw_name, value in element.attrib.items():
            name = raw_name.rsplit("}", 1)[-1].lower()
            normalized = value.strip().lower()
            if name.startswith("on"):
                raise ValueError(f"Game SVG contains active event attribute: {name}")
            if name in {"href", "src"} and normalized and not normalized.startswith("#"):
                raise ValueError("Game SVG can only use internal fragment references.")
            if any(token in normalized for token in ("javascript:", "data:", "http:", "https:")):
                raise ValueError("Game SVG contains an external or active reference.")
    return source


def _image_data_uri(path: Path) -> str:
    mime_type = IMAGE_MIME_TYPES.get(path.suffix.lower())
    if mime_type is None:
        raise ValueError(f"Game image type is unsupported: {path.suffix}")
    payload = path.read_bytes()
    if not payload or len(payload) > MAX_EMBEDDED_IMAGE_BYTES:
        raise ValueError(f"Game image has an invalid embedded size: {path.name}")
    if mime_type == "image/webp" and not (
        payload.startswith(b"RIFF") and payload[8:12] == b"WEBP"
    ):
        raise ValueError(f"Game image does not match its WebP extension: {path.name}")
    encoded = base64.b64encode(payload).decode("ascii")
    return f"data:{mime_type};base64,{encoded}"


def load_game_assets(root: Path = BASE) -> dict[str, object]:
    manifest_path = root / "game" / "build-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if set(manifest) != {"schemaVersion", "data", "images", "svg", "styles", "scripts"}:
        raise ValueError("Game build manifest has unknown or missing fields.")
    if (
        manifest["schemaVersion"] != 1
        or not isinstance(manifest["data"], dict)
        or not isinstance(manifest["images"], dict)
    ):
        raise ValueError("Game build manifest schema is unsupported.")
    if set(manifest["data"]) != GAME_DATA_KEYS:
        raise ValueError("Game build manifest data keys are unknown or incomplete.")
    if set(manifest["images"]) != GAME_IMAGE_KEYS:
        raise ValueError("Game build manifest image keys are unknown or incomplete.")
    if not isinstance(manifest["styles"], list) or not isinstance(manifest["scripts"], list):
        raise ValueError("Game build manifest style and script sections must be arrays.")
    all_paths = (
        list(manifest["data"].values())
        + list(manifest["images"].values())
        + [manifest["svg"]]
        + manifest["styles"]
        + manifest["scripts"]
    )
    if any(not isinstance(relative, str) for relative in all_paths) or len(set(all_paths)) != len(all_paths):
        raise ValueError("Game build manifest paths must be unique strings.")

    data: dict[str, object] = {}
    for name, relative in manifest["data"].items():
        if not isinstance(name, str) or not name:
            raise ValueError("Game data manifest keys must be non-empty strings.")
        data[name] = json.loads(_game_path(root, relative).read_text(encoding="utf-8"))

    images: dict[str, str] = {}
    for name, relative in manifest["images"].items():
        images[name] = _image_data_uri(_game_path(root, relative))

    svg = _validate_svg(_game_path(root, manifest["svg"]).read_text(encoding="utf-8"))
    styles: list[str] = []
    for relative in manifest["styles"]:
        source = _game_path(root, relative).read_text(encoding="utf-8")
        lowered = source.lower()
        if "</style" in lowered or "@import" in lowered or "url(" in lowered:
            raise ValueError(f"Game stylesheet contains an unsafe inline sequence: {relative}")
        styles.append(source)
    scripts: list[str] = []
    for relative in manifest["scripts"]:
        source = _game_path(root, relative).read_text(encoding="utf-8")
        if "</script" in source.lower():
            raise ValueError(f"Game script contains a closing script sequence: {relative}")
        scripts.append(source)
    return {"data": data, "images": images, "svg": svg, "styles": styles, "scripts": scripts}


def render_html(
    template: str,
    questions: object,
    game_assets: dict[str, object],
    lectures: object,
) -> str:
    replacements = {
        PLACEHOLDER: serialize_for_inline_script(questions),
        LECTURES_PLACEHOLDER: serialize_for_inline_script(lectures),
        GAME_DATA_PLACEHOLDER: serialize_for_inline_script(game_assets["data"]),
        GAME_STYLES_PLACEHOLDER: "\n".join(game_assets["styles"]),
        GAME_SCRIPTS_PLACEHOLDER: "\n;\n".join(game_assets["scripts"]),
        GAME_SVG_PLACEHOLDER: str(game_assets["svg"]),
        GAME_MAP_TEXTURE_PLACEHOLDER: str(game_assets["images"]["mapTexture"]),
    }
    rendered = template
    for placeholder, payload in replacements.items():
        if rendered.count(placeholder) != 1:
            raise ValueError(f"Template must contain exactly one placeholder: {placeholder}")
        rendered = rendered.replace(placeholder, payload)
    return rendered


def _read_capped_json(path: Path, *, max_bytes: int = 512 * 1024) -> object:
    """Read an authored JSON input with a small, explicit resource cap."""
    try:
        payload = path.read_bytes()
    except OSError as exc:
        raise ValueError(f"Cannot read JSON input {path}: {exc}") from exc
    if not payload or len(payload) > max_bytes:
        raise ValueError(f"JSON input has an invalid size: {path}")
    try:
        return json.loads(payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ValueError(f"JSON input is not valid UTF-8 JSON: {path}") from exc


def load_subject_lectures(profile: object) -> dict[str, object] | None:
    """Validate and project one subject's optional lecture manifest."""
    manifest_path = getattr(profile, "lecture_manifest", None)
    if manifest_path is None:
        return None
    manifest = _read_capped_json(Path(manifest_path))
    if not isinstance(manifest, dict) or set(manifest) != LECTURE_MANIFEST_KEYS:
        raise ValueError("Lecture manifest has unknown or missing fields.")
    chapters = getattr(profile, "chapters")
    if (
        manifest["schemaVersion"] != 1
        or manifest["provider"] != "youtube"
        or not isinstance(manifest["playlistId"], str)
        or not YOUTUBE_PLAYLIST_ID.fullmatch(manifest["playlistId"])
        or not isinstance(manifest["lectures"], list)
        or len(manifest["lectures"]) != len(chapters)
    ):
        raise ValueError("Lecture manifest schema is unsupported or incomplete.")

    from subject_catalog import validate_single_line_text

    public_lectures: list[dict[str, object]] = []
    video_ids: set[str] = set()
    lecture_ids: set[str] = set()
    chapter_values: set[str] = set()
    chapters_by_number = {chapter.number: chapter for chapter in chapters}
    for index, lecture in enumerate(manifest["lectures"], start=1):
        if not isinstance(lecture, dict) or set(lecture) != LECTURE_KEYS:
            raise ValueError(f"Lecture {index} has unknown or missing fields.")
        chapter_num = lecture["chapterNum"]
        chapter = chapters_by_number.get(chapter_num) if type(chapter_num) is int else None
        if chapter is None:
            raise ValueError(f"Lecture {index} does not map to a declared chapter.")
        lecture_id = validate_single_line_text(lecture["id"], f"lecture {index} id", 64)
        title = validate_single_line_text(lecture["title"], f"lecture {index} title", 180)
        chapter_value = validate_single_line_text(
            lecture["chapterValue"], f"lecture {index} chapterValue", 220
        )
        summary = validate_single_line_text(lecture["summary"], f"lecture {index} summary", 300)
        video_id = lecture["videoId"]
        duration = lecture["durationSeconds"]
        if (
            chapter_value != chapter.title
            or type(duration) is not int
            or not 1 <= duration <= 14_400
            or not isinstance(video_id, str)
            or not YOUTUBE_VIDEO_ID.fullmatch(video_id)
        ):
            raise ValueError(f"Lecture {index} contains invalid metadata.")
        if lecture_id in lecture_ids or video_id in video_ids or chapter_value in chapter_values:
            raise ValueError("Lecture IDs, video IDs, and chapter values must be unique.")
        lecture_ids.add(lecture_id)
        video_ids.add(video_id)
        chapter_values.add(chapter_value)
        public_lectures.append({
            "id": lecture_id,
            "chapterId": chapter.id,
            "chapterNum": chapter_num,
            "title": title,
            "durationSeconds": duration,
            "videoId": video_id,
            "summary": summary,
        })
    public_lectures.sort(key=lambda item: (item["chapterNum"], item["id"]))
    return {
        "schemaVersion": 1,
        "provider": "youtube",
        "playlistId": manifest["playlistId"],
        "lectures": public_lectures,
    }


def project_public_question(profile: object, question: Mapping[str, object]) -> dict[str, object]:
    """Return the only question fields permitted in a browser bundle."""
    source = question.get("source")
    if not isinstance(source, dict):
        raise ValueError(f"Question {question.get('id', '?')} has no source object.")
    validation = getattr(profile, "validation")
    policy = validation.source_policy
    source_file = source.get("file")
    label = policy.labels.get(source_file)
    if label is None:
        raise ValueError(f"Question {question.get('id', '?')} has an unapproved source file.")
    if policy.schema == "markdown-section":
        section = source.get("section")
        if not isinstance(section, str) or not section.strip():
            raise ValueError(f"Question {question.get('id', '?')} has no source section.")
    else:
        page = source.get("page")
        if type(page) is not int:
            raise ValueError(f"Question {question.get('id', '?')} has no source page.")
        section = f"Trang {page}"
    projected = {field: question[field] for field in PUBLIC_QUESTION_FIELDS if field != "source"}
    projected["source"] = {"label": label, "section": section}
    if tuple(projected) != PUBLIC_QUESTION_FIELDS:
        raise AssertionError("Public question projection changed unexpectedly.")
    return projected


def _public_subject(
    profile: object,
    questions: list[Mapping[str, object]],
    study_ready: bool,
) -> dict[str, object]:
    chapter_counts = {chapter.number: 0 for chapter in profile.chapters}
    for question in questions:
        chapter_num = question.get("chapterNum")
        if type(chapter_num) is not int or chapter_num not in chapter_counts:
            raise ValueError(f"Subject {profile.id} contains an unknown chapter number.")
        chapter_counts[chapter_num] += 1
    chapters = [{
        "id": chapter.id,
        "number": chapter.number,
        "title": chapter.title,
        "questionTarget": chapter.question_target,
        "questionCount": chapter_counts[chapter.number],
    } for chapter in profile.chapters]
    public = {
        "id": profile.id,
        "code": profile.code,
        "legacyAliases": list(profile.legacy_aliases),
        "title": profile.title,
        "description": profile.description,
        "status": profile.status,
        "studyReady": study_ready,
        "copyReviewRequired": profile.copy_review_required,
        "features": dict(profile.features),
        "questionTarget": profile.question_target,
        "questionCount": len(questions),
        "chapters": chapters,
    }
    if tuple(public) != PUBLIC_SUBJECT_FIELDS:
        raise AssertionError("Public subject projection changed unexpectedly.")
    return public


def build_catalogs(
    root: Path | str = BASE,
) -> tuple[list[dict[str, object]], dict[str, list[dict[str, object]]], dict[str, dict[str, object]]]:
    """Load, validate, and sanitize all registered subject content."""
    from compose_questions import compose_subject
    from subject_catalog import load_subjects
    from validate_questions import validate_subject

    root_path = Path(root).resolve()
    _, profiles = load_subjects(root_path)
    subject_catalog: list[dict[str, object]] = []
    question_banks: dict[str, list[dict[str, object]]] = {}
    lecture_catalogs: dict[str, dict[str, object]] = {}
    for profile in profiles:
        questions: list[dict[str, object]] = []
        study_ready = False
        if profile.status != "comingSoon":
            questions = compose_subject(root_path, profile)
            result = validate_subject(profile, questions, root=root_path)
            if result.errors:
                preview = "; ".join(result.errors[:5])
                raise ValueError(f"Subject {profile.id} failed validation: {preview}")
            study_ready = result.study_ready
            if profile.status == "ready" and not study_ready:
                raise ValueError(f"Ready subject {profile.id} is not study-ready.")
        if study_ready:
            question_banks[profile.id] = [project_public_question(profile, question) for question in questions]
            lecture_manifest = load_subject_lectures(profile)
            if lecture_manifest is not None:
                lecture_catalogs[profile.id] = lecture_manifest
        subject_catalog.append(_public_subject(profile, questions, study_ready))
    return subject_catalog, question_banks, lecture_catalogs


def catalog_accessor_source() -> str:
    """Return the hardened browser accessor contract shared with the UI layer."""
    return "\n".join((
        "const SUBJECT_BY_ID=Object.assign(Object.create(null),",
        "  Object.fromEntries(SUBJECT_CATALOG.map(subject=>[subject.id,subject])));",
        "const EMPTY_QUESTION_BANK=Object.freeze([]);",
        "function hasSubject(id){return typeof id==='string'&&Object.hasOwn(SUBJECT_BY_ID,id);}",
        "function getSubject(id){return hasSubject(id)?SUBJECT_BY_ID[id]:null;}",
        "function getQuestionBank(id){return typeof id==='string'&&Object.hasOwn(QUESTION_BANKS,id)",
        "  ?QUESTION_BANKS[id]:EMPTY_QUESTION_BANK;}",
        "function getLectures(id){return typeof id==='string'&&Object.hasOwn(LECTURE_CATALOGS,id)",
        "  ?LECTURE_CATALOGS[id]:null;}",
        "Object.defineProperty(globalThis,'MLN222_QUESTIONS',{value:getQuestionBank('mln112'),",
        "  writable:false,configurable:false,enumerable:true});",
    ))


def render_catalog_html(
    template: str,
    subject_catalog: object,
    question_banks: object,
    lecture_catalogs: object,
    game_assets: dict[str, object],
) -> str:
    """Render a deterministic multi-subject bundle from sanitized catalogs."""
    replacements = {
        SUBJECT_CATALOG_PLACEHOLDER: serialize_for_inline_script(subject_catalog),
        QUESTION_BANKS_PLACEHOLDER: serialize_for_inline_script(question_banks),
        LECTURE_CATALOGS_PLACEHOLDER: serialize_for_inline_script(lecture_catalogs),
        GAME_DATA_PLACEHOLDER: serialize_for_inline_script(game_assets["data"]),
        GAME_STYLES_PLACEHOLDER: "\n".join(game_assets["styles"]),
        GAME_SCRIPTS_PLACEHOLDER: "\n;\n".join(game_assets["scripts"]),
        GAME_SVG_PLACEHOLDER: str(game_assets["svg"]),
        GAME_MAP_TEXTURE_PLACEHOLDER: str(game_assets["images"]["mapTexture"]),
    }
    rendered = template
    for placeholder, payload in replacements.items():
        if rendered.count(placeholder) != 1:
            raise ValueError(f"Template must contain exactly one placeholder: {placeholder}")
        rendered = rendered.replace(placeholder, payload)
    return rendered


def measure_artifact(data: bytes | str) -> dict[str, int | str]:
    """Return deterministic raw/gzip sizes and a SHA-256 digest."""
    payload = data.encode("utf-8") if isinstance(data, str) else bytes(data)
    return {
        "sha256": hashlib.sha256(payload).hexdigest(),
        "rawBytes": len(payload),
        "gzipBytes": len(gzip.compress(payload, mtime=0)),
    }


def enforce_artifact_budget(
    data: bytes | str,
    *,
    raw_limit: int = RAW_BUDGET_BYTES,
    gzip_limit: int = GZIP_BUDGET_BYTES,
) -> dict[str, int | str]:
    measurement = measure_artifact(data)
    if measurement["rawBytes"] > raw_limit or measurement["gzipBytes"] > gzip_limit:
        raise ValueError(
            "Rendered artifact exceeds its budget "
            f"({measurement['rawBytes']}/{raw_limit} raw bytes, "
            f"{measurement['gzipBytes']}/{gzip_limit} gzip bytes)."
        )
    return measurement


def _csp_hash(source: str) -> str:
    digest = hashlib.sha256(source.encode("utf-8")).digest()
    return "sha256-" + base64.b64encode(digest).decode("ascii")


def inline_csp_hashes(html: str) -> dict[str, list[str]]:
    """Hash inline script/style bodies exactly as browsers consume them."""
    return {
        "scriptSrcHashes": sorted({_csp_hash(body) for body in INLINE_SCRIPT_PATTERN.findall(html)}),
        "styleSrcHashes": sorted({_csp_hash(body) for body in INLINE_STYLE_PATTERN.findall(html)}),
    }


def canonical_input_snapshot_sha256(snapshot: Mapping[str, str]) -> str:
    """Hash a path-sorted input manifest using one documented canonical encoding."""
    if not snapshot:
        raise ValueError("Input snapshot cannot be empty.")
    canonical_inputs: dict[str, str] = {}
    for relative in sorted(snapshot):
        digest = snapshot[relative]
        if not isinstance(relative, str) or not relative or "\\" in relative:
            raise ValueError("Input snapshot paths must be canonical POSIX strings.")
        pure = PurePosixPath(relative)
        if pure.is_absolute() or any(part in {"", ".", ".."} for part in pure.parts):
            raise ValueError(f"Input snapshot path is unsafe: {relative}")
        if not isinstance(digest, str) or not SHA256_HEX_PATTERN.fullmatch(digest):
            raise ValueError(f"Input snapshot digest is invalid: {relative}")
        canonical_inputs[relative] = digest
    payload = json.dumps(
        {"schemaVersion": 1, "inputs": canonical_inputs},
        ensure_ascii=False,
        separators=(",", ":"),
    ).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def build_release_manifest(
    artifacts: Mapping[str, bytes | str],
    *,
    subject_counts: Mapping[str, int] | None = None,
    input_snapshot: Mapping[str, str] | None = None,
) -> dict[str, object]:
    """Build a stable release manifest without writing it to disk."""
    artifact_rows = {name: measure_artifact(artifacts[name]) for name in sorted(artifacts)}
    html_hashes = {"scriptSrcHashes": [], "styleSrcHashes": []}
    for name in sorted(artifacts):
        if name.lower().endswith(".html"):
            data = artifacts[name]
            html = data if isinstance(data, str) else bytes(data).decode("utf-8")
            hashes = inline_csp_hashes(html)
            for key in html_hashes:
                html_hashes[key].extend(hashes[key])
    html_hashes = {key: sorted(set(values)) for key, values in html_hashes.items()}
    manifest: dict[str, object] = {
        "schemaVersion": 1,
        "artifacts": artifact_rows,
        "totals": {
            "rawBytes": sum(row["rawBytes"] for row in artifact_rows.values()),
            "gzipBytes": sum(row["gzipBytes"] for row in artifact_rows.values()),
        },
        "csp": html_hashes,
    }
    if subject_counts is not None:
        counts: dict[str, int] = {}
        for key in sorted(subject_counts):
            count = subject_counts[key]
            if not isinstance(key, str) or not key or type(count) is not int or count < 0:
                raise ValueError("Subject release counts must be non-negative integer values.")
            counts[key] = count
        manifest["subjects"] = counts
    if input_snapshot is not None:
        manifest["inputSnapshotSha256"] = canonical_input_snapshot_sha256(input_snapshot)
    return manifest


def build_vercel_config(csp: Mapping[str, object]) -> dict[str, object]:
    """Generate the static Vercel contract from the exact rendered CSP hashes."""
    if set(csp) != {"scriptSrcHashes", "styleSrcHashes"}:
        raise ValueError("CSP manifest has unknown or missing fields.")
    script_hashes = csp["scriptSrcHashes"]
    style_hashes = csp["styleSrcHashes"]
    if not isinstance(script_hashes, list) or not isinstance(style_hashes, list):
        raise ValueError("CSP hashes must be arrays.")
    if not script_hashes or not style_hashes:
        raise ValueError("Rendered release must contain inline script and style hashes.")
    if any(not isinstance(value, str) or not CSP_SHA256_PATTERN.fullmatch(value) for value in script_hashes + style_hashes):
        raise ValueError("CSP manifest contains an invalid SHA-256 source expression.")
    scripts = sorted(set(script_hashes))
    styles = sorted(set(style_hashes))
    csp_value = "; ".join((
        "default-src 'self'",
        "base-uri 'none'",
        "object-src 'none'",
        "frame-ancestors 'self'",
        "form-action 'none'",
        "script-src 'self' " + " ".join(f"'{value}'" for value in scripts),
        "script-src-attr 'none'",
        "style-src 'self'",
        "style-src-elem 'self' " + " ".join(f"'{value}'" for value in styles),
        "style-src-attr 'unsafe-inline'",
        "img-src 'self' data: https://i.ytimg.com",
        "frame-src https://www.youtube-nocookie.com",
        "connect-src 'self'",
        "font-src 'self'",
        "media-src 'none'",
        "worker-src 'none'",
        "manifest-src 'self'",
        "upgrade-insecure-requests",
    ))
    return {
        "$schema": "https://openapi.vercel.sh/vercel.json",
        "outputDirectory": "dist",
        "headers": [{
            "source": "/(.*)",
            "headers": [
                {"key": "Cache-Control", "value": "public, max-age=0, must-revalidate"},
                {"key": "Content-Security-Policy", "value": csp_value},
                {"key": "X-Content-Type-Options", "value": "nosniff"},
                {"key": "Referrer-Policy", "value": "strict-origin-when-cross-origin"},
                {
                    "key": "Permissions-Policy",
                    "value": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
                },
            ],
        }],
    }


def _deterministic_json_bytes(value: object) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def snapshot_input_manifest(root: Path | str = BASE) -> dict[str, str]:
    """Hash every declared build input so a concurrent edit fails closed."""
    from subject_catalog import load_subjects

    root_path = Path(root).resolve()
    registry, profiles = load_subjects(root_path)
    paths = {root_path / "content" / "subjects" / "registry.json", root_path / "template.html"}
    for relative in COMPILER_INPUTS:
        declared_path = root_path / relative
        compiler_path = declared_path.resolve()
        if (
            declared_path.is_symlink()
            or not compiler_path.is_file()
            or compiler_path.parent != root_path
            or compiler_path.name != relative
        ):
            raise ValueError(f"Compiler input is missing or unsafe: {relative}")
        paths.add(compiler_path)
    for item in registry.items:
        paths.add((registry.content_root / item.metadata_path).resolve())
    for profile in profiles:
        paths.update(question_file.path for question_file in profile.question_files)
        if profile.lecture_manifest is not None:
            paths.add(profile.lecture_manifest)
        if profile.validation is not None and profile.validation.review_signoff_path is not None:
            paths.add(profile.validation.review_signoff_path)
    game_manifest_path = root_path / "game" / "build-manifest.json"
    paths.add(game_manifest_path)
    game_manifest = _read_capped_json(game_manifest_path)
    if not isinstance(game_manifest, dict):
        raise ValueError("Game build manifest is not an object.")
    relative_assets: list[object] = []
    data = game_manifest.get("data")
    images = game_manifest.get("images")
    if isinstance(data, dict):
        relative_assets.extend(data.values())
    if isinstance(images, dict):
        relative_assets.extend(images.values())
    relative_assets.extend((game_manifest.get("svg"),))
    for field in ("styles", "scripts"):
        values = game_manifest.get(field)
        if isinstance(values, list):
            relative_assets.extend(values)
    for relative in relative_assets:
        if not isinstance(relative, str):
            raise ValueError("Game build manifest contains an invalid path.")
        paths.add(_game_path(root_path, relative))
    snapshot: dict[str, str] = {}
    for path in sorted(paths, key=lambda item: item.as_posix()):
        try:
            relative = path.resolve().relative_to(root_path).as_posix()
            payload = path.read_bytes()
        except (OSError, ValueError) as exc:
            raise ValueError(f"Cannot snapshot build input {path}: {exc}") from exc
        snapshot[relative] = hashlib.sha256(payload).hexdigest()
    return snapshot


def _release_staging_path(root: Path, staging: Path) -> Path:
    root_path = root.resolve()
    if staging.is_symlink():
        raise ValueError("Release staging cannot be a symlink.")
    staging_path = staging.resolve()
    if (
        staging_path.parent != root_path
        or not staging_path.name.startswith(".release.staging-")
        or not staging_path.is_dir()
        or staging_path.is_symlink()
    ):
        raise ValueError("Release staging must be a real generated directory beneath the build root.")
    return staging_path


def discard_release_staging(staging: Path | str, root: Path | str = BASE) -> None:
    """Remove only a generated same-root staging directory; never follow a symlink."""
    staging_path = _release_staging_path(Path(root), Path(staging))
    shutil.rmtree(staging_path)


def _validate_release_staging(
    staging: Path,
    manifest: Mapping[str, object],
    vercel_config: Mapping[str, object],
) -> None:
    expected_root_entries = {"dist", "index.html", "vercel.json"}
    if {path.name for path in staging.iterdir()} != expected_root_entries:
        raise ValueError("Release staging contains unexpected root entries.")
    dist = staging / "dist"
    if not dist.is_dir() or dist.is_symlink():
        raise ValueError("Release staging dist must be a real directory.")
    if {path.name for path in dist.iterdir()} != RELEASE_ALLOWLIST:
        raise ValueError("Release dist does not match the exact deploy allowlist.")
    if any(not path.is_file() or path.is_symlink() for path in dist.iterdir()):
        raise ValueError("Release dist allowlist entries must be regular files.")

    root_index = (staging / "index.html").read_bytes()
    dist_index = (dist / "index.html").read_bytes()
    if root_index != dist_index:
        raise ValueError("Root and dist index artifacts are not byte-identical.")
    measurement = measure_artifact(dist_index)
    expected_manifest_fields = {
        "schemaVersion", "artifacts", "totals", "csp", "subjects", "inputSnapshotSha256",
    }
    if set(manifest) != expected_manifest_fields or manifest["schemaVersion"] != 1:
        raise ValueError("Release manifest fields are incomplete or include non-reproducible data.")
    if manifest["artifacts"] != {"index.html": measurement}:
        raise ValueError("Release manifest artifact digest/size does not match staged index.html.")
    if manifest["totals"] != {
        "rawBytes": measurement["rawBytes"],
        "gzipBytes": measurement["gzipBytes"],
    }:
        raise ValueError("Release manifest totals do not match staged artifacts.")
    if manifest["csp"] != inline_csp_hashes(dist_index.decode("utf-8")):
        raise ValueError("Release manifest CSP hashes do not match staged index.html.")
    if not isinstance(manifest["subjects"], dict):
        raise ValueError("Release manifest subject counts are invalid.")
    input_digest = manifest["inputSnapshotSha256"]
    if not isinstance(input_digest, str) or not SHA256_HEX_PATTERN.fullmatch(input_digest):
        raise ValueError("Release manifest input snapshot digest is invalid.")
    if (dist / RELEASE_MANIFEST_NAME).read_bytes() != _deterministic_json_bytes(manifest):
        raise ValueError("Release manifest bytes are not deterministic.")
    if (staging / "vercel.json").read_bytes() != _deterministic_json_bytes(vercel_config):
        raise ValueError("Vercel config bytes are not deterministic.")
    if vercel_config != build_vercel_config(manifest["csp"]):
        raise ValueError("Vercel CSP/security policy does not match the release manifest.")


def stage_release_artifacts(
    root: Path | str,
    index_html: bytes | str,
    manifest: Mapping[str, object],
    vercel_config: Mapping[str, object],
) -> Path:
    """Write and fully validate a fresh same-volume release transaction directory."""
    root_path = Path(root).resolve()
    if not root_path.is_dir() or root_path.is_symlink():
        raise ValueError("Release root must be a real directory.")
    staging = Path(tempfile.mkdtemp(prefix=".release.staging-", dir=root_path))
    try:
        payload = index_html.encode("utf-8") if isinstance(index_html, str) else bytes(index_html)
        dist = staging / "dist"
        dist.mkdir()
        (staging / "index.html").write_bytes(payload)
        (dist / "index.html").write_bytes(payload)
        (dist / RELEASE_MANIFEST_NAME).write_bytes(_deterministic_json_bytes(manifest))
        (staging / "vercel.json").write_bytes(_deterministic_json_bytes(vercel_config))
        _validate_release_staging(staging, manifest, vercel_config)
        return staging
    except Exception:
        if staging.exists():
            discard_release_staging(staging, root_path)
        raise


def _remove_promoted_target(path: Path) -> None:
    if path.is_symlink() or path.is_file():
        path.unlink(missing_ok=True)
    elif path.is_dir():
        shutil.rmtree(path)


def promote_release(staging: Path | str, root: Path | str = BASE) -> None:
    """Promote root/dist/config as one rollback-capable same-volume transaction."""
    root_path = Path(root).resolve()
    staging_path = _release_staging_path(root_path, Path(staging))
    manifest = json.loads((staging_path / "dist" / RELEASE_MANIFEST_NAME).read_text(encoding="utf-8"))
    vercel_config = json.loads((staging_path / "vercel.json").read_text(encoding="utf-8"))
    _validate_release_staging(staging_path, manifest, vercel_config)

    operations = (
        ("dist", staging_path / "dist", root_path / "dist"),
        ("index.html", staging_path / "index.html", root_path / "index.html"),
        ("vercel.json", staging_path / "vercel.json", root_path / "vercel.json"),
    )
    for _, _, target in operations:
        if target.is_symlink():
            raise ValueError(f"Release target cannot be a symlink: {target.name}")
    backup_dir = staging_path / ".previous"
    backup_dir.mkdir()
    backed_up: list[tuple[Path, Path]] = []
    installed: list[Path] = []
    try:
        for name, _, target in operations:
            if target.exists():
                backup = backup_dir / name
                target.replace(backup)
                backed_up.append((backup, target))
        for _, source, target in operations:
            source.replace(target)
            installed.append(target)
    except Exception as exc:
        rollback_errors: list[str] = []
        for target in reversed(installed):
            try:
                _remove_promoted_target(target)
            except OSError as rollback_exc:
                rollback_errors.append(f"remove {target.name}: {rollback_exc}")
        for backup, target in reversed(backed_up):
            try:
                backup.replace(target)
            except OSError as rollback_exc:
                rollback_errors.append(f"restore {target.name}: {rollback_exc}")
        if rollback_errors:
            raise ReleaseRollbackError(
                f"Release promotion failed ({exc}); rollback also failed: {'; '.join(rollback_errors)}",
                staging_path,
            ) from exc
        discard_release_staging(staging_path, root_path)
        raise
    discard_release_staging(staging_path, root_path)


def _legacy_main() -> int:
    configure_utf8_console()
    try:
        bank_snapshot = BANK.read_bytes()
        template = TEMPLATE.read_text(encoding="utf-8")
    except OSError as exc:
        print(f"Khong doc duoc du lieu dong goi: {exc}")
        return 1

    snapshot_path: Path | None = None
    output_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="wb", dir=BASE, prefix=".questions.build-", suffix=".json", delete=False
        ) as snapshot_file:
            snapshot_file.write(bank_snapshot)
            snapshot_path = Path(snapshot_file.name)

        errors, _, report = validate_file(snapshot_path, write_report=False)
        display_report = report.replace(str(snapshot_path), str(BANK), 1)
        REPORT.write_text(display_report + "\n", encoding="utf-8")
        if errors:
            print(display_report)
            print("Build dung vi questions.json chua hop le.")
            return 1

        questions = json.loads(bank_snapshot.decode("utf-8"))
        html = render_html(template, questions, load_game_assets(BASE), load_lectures(BASE))
        with tempfile.NamedTemporaryFile(
            mode="w", encoding="utf-8", newline="", dir=BASE,
            prefix=".index.build-", suffix=".html", delete=False
        ) as output_file:
            output_file.write(html)
            output_path = Path(output_file.name)
        output_path.replace(OUTPUT)
        output_path = None
    except (OSError, UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
        print(f"Khong the dong goi website: {exc}")
        return 1
    finally:
        if snapshot_path is not None:
            snapshot_path.unlink(missing_ok=True)
        if output_path is not None:
            output_path.unlink(missing_ok=True)

    print(f"Built index.html with {len(questions)} questions ({len(html) // 1024} KB).")
    return 0


def _catalog_main() -> int:
    staging: Path | None = None
    preserve_recovery = False
    try:
        before = snapshot_input_manifest(BASE)
        template = TEMPLATE.read_text(encoding="utf-8")
        subjects, question_banks, lecture_catalogs = build_catalogs(BASE)
        html = render_catalog_html(
            template, subjects, question_banks, lecture_catalogs, load_game_assets(BASE)
        )
        measurement = enforce_artifact_budget(html)
        after = snapshot_input_manifest(BASE)
        if before != after:
            raise ValueError("Build inputs changed during rendering; retry from a stable worktree.")
        subject_counts = {subject["id"]: subject["questionCount"] for subject in subjects}
        manifest = build_release_manifest(
            {"index.html": html},
            subject_counts=subject_counts,
            input_snapshot=before,
        )
        vercel_config = build_vercel_config(manifest["csp"])
        staging = stage_release_artifacts(BASE, html, manifest, vercel_config)
        final_snapshot = snapshot_input_manifest(BASE)
        if before != final_snapshot:
            raise ValueError("Build inputs changed before release promotion; previous release preserved.")
        promote_release(staging, BASE)
        staging = None
    except ReleaseRollbackError as exc:
        preserve_recovery = True
        print(f"Khong the dong goi website: {exc}")
        print(f"Release recovery data retained at: {exc.staging}")
        return 1
    except (OSError, UnicodeDecodeError, json.JSONDecodeError, RuntimeError, ValueError) as exc:
        print(f"Khong the dong goi website: {exc}")
        return 1
    finally:
        if (
            staging is not None
            and not preserve_recovery
            and staging.exists()
            and staging.parent.resolve() == BASE.resolve()
            and staging.name.startswith(".release.staging-")
        ):
            try:
                discard_release_staging(staging, BASE)
            except OSError as cleanup_exc:
                print(f"Release staging cleanup failed; recovery data retained at {staging}: {cleanup_exc}")

    question_count = sum(len(bank) for bank in question_banks.values())
    print(
        f"Built synchronized index.html/dist/vercel.json with {len(subjects)} subjects and "
        f"{question_count} questions ({measurement['rawBytes'] // 1024} KB raw, "
        f"{measurement['gzipBytes'] // 1024} KB gzip, SHA-256 {measurement['sha256']})."
    )
    return 0


def main() -> int:
    """Select the new catalog build only when the template opts into its contract."""
    configure_utf8_console()
    try:
        template = TEMPLATE.read_text(encoding="utf-8")
    except OSError as exc:
        print(f"Khong doc duoc du lieu dong goi: {exc}")
        return 1
    modern_placeholders = (
        SUBJECT_CATALOG_PLACEHOLDER,
        QUESTION_BANKS_PLACEHOLDER,
        LECTURE_CATALOGS_PLACEHOLDER,
    )
    if all(template.count(placeholder) == 1 for placeholder in modern_placeholders):
        return _catalog_main()
    if any(placeholder in template for placeholder in modern_placeholders):
        print("Khong the dong goi website: Template catalog placeholders are incomplete.")
        return 1
    return _legacy_main()


if __name__ == "__main__":
    raise SystemExit(main())
