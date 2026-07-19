# Phase 01 - Baseline and design contract

Date: 2026-07-19  
Status: PASS

## Verified baseline

| Check | Result |
|---|---|
| `python validate_questions.py` | PASS - 504 questions, 0 errors, 0 warnings |
| `node scripts/validate-game-data.js` | PASS - 34 provinces, 6 regions, 44 SVG groups, 58 adjacency edges, 5 unit types |
| `node --test --test-concurrency=1 tests/game/*.test.cjs` | PASS - 133/133 tests |
| `python -m unittest -v test_pipeline.py` | PASS - 35/35 tests |

## Locked contracts

- Gameplay truth remains in `game/core`, `game/engine`, `game/quiz`, and `game/storage`.
- UI modules may only enable commands returned by `controller.legalActions()`.
- Commands are staged through `controller.stageAction()`; the context menu must not mutate campaign state.
- Pending orders remain in the existing UI sidecar and retain their current validation rules.
- Save schema, storage keys, question data, province data, and deterministic RNG are unchanged.
- `template.html` and the build manifest are source; generated `index.html` is never edited directly.
- The production target remains a standalone offline `file://` document with no runtime network dependency.
- Map geometry and province IDs remain identical to `game/assets/vietnam-map.svg`.

## Interaction contract

- Study modes use a light reading workspace; game mode uses a dark tactical workspace.
- Desktop navigation is a persistent left rail; mobile navigation is a fixed bottom bar.
- Right-clicking a foreign province opens a four-group command wheel: information, diplomacy, trade, and military.
- Choosing a group opens a contextual action sheet. A destructive command requires explicit confirmation.
- Keyboard users can open the same menu with the Context Menu key or `Shift+F10`.
- Touch users get a visible action button and optional long-press shortcut.
- Dismissal works with `Escape`, outside click, pan, zoom, viewport resize, phase changes, and quiz activation.

## Visual baseline

- Study desktop: `plans/260718-1223-modern-vietnamese-ui-redesign/reports/phase-02-quiz-1440x900.png`
- Study mobile: `plans/260718-1223-modern-vietnamese-ui-redesign/reports/phase-02-quiz-390x844-viewport.png`
- Game desktop: `plans/260718-1223-modern-vietnamese-ui-redesign/reports/map-contiguous-1440x900.png`
- Game mobile: `plans/260718-1223-modern-vietnamese-ui-redesign/reports/map-contiguous-390x844.png`

These images are comparison evidence only. The new visual checkpoints are captured per phase.
