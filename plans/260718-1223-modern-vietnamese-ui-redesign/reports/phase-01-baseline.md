# Phase 01: Baseline and app-shell checkpoint

## Status

- Implementation: complete
- Automated verification: pass
- Browser verification: pass
- Visual checkpoint: awaiting user approval
- Next phase remains blocked until the checkpoint is approved.

## Scope delivered

- Added one semantic token layer for canvas, surfaces, borders, text, brass, jade, status colors, focus, spacing, radii, and motion.
- Aliased the game palette to the global tokens without changing engine or save behavior.
- Rebuilt the shared shell with a compact MLN222 brand lockup, course label, question total, and four stable mode tabs.
- Added five local SVG symbols (`landmark`, `book-open`, `layers`, `search`, `castle`) and a safe dynamic icon helper.
- Kept the application fully self-contained under `file://`; no font, icon, framework, or CDN dependency was added.

## Artifact metrics

| Metric | Baseline | Phase 01 | Delta |
|---|---:|---:|---:|
| `index.html` bytes | 1,379,258 | 1,387,689 | +8,431 (+0.61%) |
| SHA-256 | `5EC1EC5FF9F68AF9FD9EAD0C63CD89B400234F7CFFC23985764BFC1F7CF0FD34` | `B6C212EF2C899018980EF768C02B81CF27EF3C43D3F88362E9BD06484FBDBA37` | changed as expected |
| Production questions | 504 | 504 | 0 |
| Artifact budget | < 1.7 MB | 1.388 MB | pass |

## Contrast evidence

Ratios were calculated from the final semantic token values.

| Foreground / background | Ratio |
|---|---:|
| Ink / canvas | 16.61:1 |
| Ink / surface | 15.51:1 |
| Muted ink / canvas | 9.26:1 |
| Muted ink / surface | 8.64:1 |
| Brass / canvas | 8.71:1 |
| Brass soft / surface | 11.65:1 |
| Focus / raised surface | 9.13:1 |
| Success / success surface | 5.15:1 |
| Danger / danger surface | 4.78:1 |

All listed text and focus pairs meet WCAG AA. Keyboard verification measured a `3px` focus outline with a `2px` offset.

## Automated verification

| Command | Result |
|---|---|
| `node --test --test-concurrency=1 tests/game/*.test.cjs` | 131 passed, 0 failed |
| `python -m unittest -v test_pipeline.py` | 34 passed, 0 failed |
| `python validate_questions.py` | 504 questions, 0 errors, 0 warnings |
| `node scripts/validate-game-data.js` | 34 provinces, 44 SVG groups, pass |
| `python build_html.py` | production artifact generated successfully |
| `git diff --check` | pass |

The added contracts verify unique prefixed sprite IDs, local-only `<use>` references, safe DOM construction, the third-party notice, and source/build consistency.

The default parallel Node runner passed once, then breached only the wall-clock
`p95TurnMs` benchmark while competing with another CPU-heavy simulation in two
repeat runs. The benchmark passed in isolation and the complete suite passed
with test-file concurrency set to one, so the documented verification command
now runs this timing-sensitive suite serially.

## Browser matrix

Chromium opened the production `index.html` directly by `file://`.

| Viewport | Study | Game setup | Campaign | Horizontal overflow |
|---|---|---|---|---|
| 1440x900 | pass | pass | pass | none |
| 1024x768 | pass | pass | pass | none |
| 390x844 | pass | pass | pass | none |
| 360x800 | pass | pass | pass | none |

- Console: no errors or warnings observed.
- Network: only the local `index.html` document was requested.
- Navigation: all four tabs retained stable dimensions and mutually exclusive `aria-pressed` values.
- Persistence: the active campaign remained available after switching through study, flashcard, search, and game modes.
- Icons: all five symbols rendered with non-zero dimensions; no sprite/map ID collision was observed.

## Screenshots

### Before

- `baseline-study-1440x900.png`
- `baseline-study-390x844.png`
- `baseline-game-setup-1440x900.png`
- `baseline-game-setup-390x844.png`
- `baseline-game-campaign-1440x900.png`
- `baseline-game-campaign-390x844.png`

### Phase 01

- `phase-01-study-1440x900.png`, `phase-01-study-1024x768.png`, `phase-01-study-390x844.png`, `phase-01-study-360x800.png`
- `phase-01-game-setup-1440x900.png`, `phase-01-game-setup-1024x768.png`, `phase-01-game-setup-390x844.png`, `phase-01-game-setup-360x800.png`
- `phase-01-game-campaign-1440x900.png`, `phase-01-game-campaign-1024x768.png`, `phase-01-game-campaign-390x844.png`, `phase-01-game-campaign-360x800.png`
- `phase-01-focus-360x800.png`

## License decision

The selected paths come from Lucide. The source application keeps only the five used symbols, and `docs/third-party-notices.md` includes the upstream ISC notice plus the Feather MIT notice required by the derived `search` icon. No third-party runtime code is loaded.

## Visual review

The new shell is quieter and denser than the baseline: branding and the question total are separated, the four modes read as primary navigation, and brass is reserved for active state and emphasis. Study content keeps a controlled reading width while game mode expands to the available workspace.

Deep study-card composition and the game map/right-panel workspace are intentionally unchanged in this phase. Those are the scope of Phases 02 and 03.
