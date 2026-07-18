# Phase 02 validation report

## Scope

Phase 02 stores the owner-provided Vietnam map locally and defines the normalized data used by later campaign modules. It does not modify `template.html` or generated `index.html`.

## Source provenance

- Page: `https://fptlichsuviet.io.vn/map/index.html`
- Province and island mapping: `https://fptlichsuviet.io.vn/map/app.js`
- SVG geometry: `https://fptlichsuviet.io.vn/map/map-svg.js`
- Retrieved: 2026-07-17

The local SVG is the extracted geometry string. It contains no script, style element or attribute, event handler, `foreignObject`, external URL, external resource element, or unsafe XML declaration.

## Validated data

| Check | Result |
|---|---:|
| Playable provinces | 34 |
| Regions | 6 |
| SVG groups | 44 |
| Island groups inheriting an owner | 10 |
| Symmetric adjacency edges | 58 |
| Connected graph nodes | 34 |
| Semantic unit definitions | 5 |
| Starting modifier spread | 17.39% |

Neighbors are normalized in `adjacency.json`; they are not duplicated in each province record. Every playable province has exactly one adjacency entry, while island groups never become graph nodes.

## Review findings

The post-implementation review found three validator gaps and one contract ambiguity. The validator now rejects namespace-prefixed active SVG elements, multiple root documents, and invalid trait advantage/weakness identifiers. The phase contract now states explicitly that province neighbor entries live in `adjacency.json`.

The adjacency review independently reproduced all 58 edges. Two retained edges have very short boundaries inherited from former administrative units:

- `ho-chi-minh` to `lam-dong`
- `ho-chi-minh` to `dong-thap`

They remain valid campaign borders and are covered by symmetry tests.

## Verification

| Command or check | Result |
|---|---|
| `node scripts/validate-game-data.js` | Pass |
| `node --test tests/game/*.test.cjs` | 30 passed, 0 failed |
| `python -m unittest -v test_pipeline.py` | 28 passed, 0 failed |
| Chrome headless SVG render | Pass, 900x1200 PNG |
| Render blank check | 545 colors, 173,902 non-white pixels |

The SVG renders as a complete map with visible province boundaries and island geometry. Campaign ownership colors are intentionally deferred to the Phase 08 UI.
