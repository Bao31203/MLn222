# -*- coding: utf-8 -*-
"""Build the validated question bank and game assets into one standalone HTML file."""
from __future__ import annotations

import json
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path

from validate_questions import REPORT, configure_utf8_console, validate_file


BASE = Path(__file__).resolve().parent
BANK = BASE / "questions.json"
TEMPLATE = BASE / "template.html"
OUTPUT = BASE / "index.html"
GAME_ROOT = BASE / "game"
MANIFEST = GAME_ROOT / "build-manifest.json"

PLACEHOLDER = "/*__QUESTIONS__*/[]"
GAME_DATA_PLACEHOLDER = "/*__GAME_DATA__*/{}"
GAME_STYLES_PLACEHOLDER = "/*__GAME_STYLES__*/"
GAME_SCRIPTS_PLACEHOLDER = "/*__GAME_SCRIPTS__*/"
GAME_SVG_PLACEHOLDER = "<!--__GAME_SVG__-->"

FORBIDDEN_SVG_TAGS = {
    "script", "style", "foreignobject", "iframe", "object", "embed", "audio", "video"
}
GAME_DATA_KEYS = {
    "provinces", "adjacency", "balance", "personalities", "victoryRules", "units"
}


def serialize_for_inline_script(data: object) -> str:
    """Serialize JSON without exposing HTML parser control sequences."""
    return (
        json.dumps(data, ensure_ascii=False, separators=(",", ":"))
        .replace("<", "\\u003c")
        .replace("\u2028", "\\u2028")
        .replace("\u2029", "\\u2029")
    )


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


def load_game_assets(root: Path = BASE) -> dict[str, object]:
    manifest_path = root / "game" / "build-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if set(manifest) != {"schemaVersion", "data", "svg", "styles", "scripts"}:
        raise ValueError("Game build manifest has unknown or missing fields.")
    if manifest["schemaVersion"] != 1 or not isinstance(manifest["data"], dict):
        raise ValueError("Game build manifest schema is unsupported.")
    if set(manifest["data"]) != GAME_DATA_KEYS:
        raise ValueError("Game build manifest data keys are unknown or incomplete.")
    if not isinstance(manifest["styles"], list) or not isinstance(manifest["scripts"], list):
        raise ValueError("Game build manifest style and script sections must be arrays.")
    all_paths = list(manifest["data"].values()) + [manifest["svg"]] + manifest["styles"] + manifest["scripts"]
    if any(not isinstance(relative, str) for relative in all_paths) or len(set(all_paths)) != len(all_paths):
        raise ValueError("Game build manifest paths must be unique strings.")

    data: dict[str, object] = {}
    for name, relative in manifest["data"].items():
        if not isinstance(name, str) or not name:
            raise ValueError("Game data manifest keys must be non-empty strings.")
        data[name] = json.loads(_game_path(root, relative).read_text(encoding="utf-8"))

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
    return {"data": data, "svg": svg, "styles": styles, "scripts": scripts}


def render_html(template: str, questions: object, game_assets: dict[str, object]) -> str:
    replacements = {
        PLACEHOLDER: serialize_for_inline_script(questions),
        GAME_DATA_PLACEHOLDER: serialize_for_inline_script(game_assets["data"]),
        GAME_STYLES_PLACEHOLDER: "\n".join(game_assets["styles"]),
        GAME_SCRIPTS_PLACEHOLDER: "\n;\n".join(game_assets["scripts"]),
        GAME_SVG_PLACEHOLDER: str(game_assets["svg"]),
    }
    rendered = template
    for placeholder, payload in replacements.items():
        if rendered.count(placeholder) != 1:
            raise ValueError(f"Template must contain exactly one placeholder: {placeholder}")
        rendered = rendered.replace(placeholder, payload)
    return rendered


def main() -> int:
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
        html = render_html(template, questions, load_game_assets(BASE))
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


if __name__ == "__main__":
    raise SystemExit(main())
