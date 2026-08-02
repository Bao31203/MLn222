---
title: "Phase 05 - Automated validation and regression coverage"
description: "Lock multi-subject contracts, storage compatibility, core routing, game isolation, and deterministic builds into the existing Python and Node suites."
status: completed
priority: P1
effort: 10h
issue: null
branch: main
tags: [test, frontend, infra]
created: 2026-08-02
---

# Phase 05: Automated Validation and Regression Coverage

## Context links

- [Plan](./plan.md)
- [Phase 02 pipeline](./phase-02-multi-subject-validation-build-pipeline.md)
- [Phase 03 game isolation](./phase-03-mln112-game-save-isolation.md)
- [Phase 04 UI](./phase-04-course-home-dynamic-workspace.md)
- `C:\Users\pgb31\mln222-quiz\test_pipeline.py`
- `C:\Users\pgb31\mln222-quiz\tests\game\study-progress.test.cjs`

## Overview

- Priority: P1
- Status: Completed
- Owner: test worker
- Depends on: integrated Phases 2–4.
- Baseline to preserve: 41 Python tests and 141 Node tests passing before this feature.

## Key insights

- Current tests intentionally hard-code MLN122 branding, one question placeholder, 504 counts, six lectures, and legacy storage keys; these assertions must become subject-aware rather than merely deleted.
- Node uses built-in `node:test`, VM contexts, and lightweight DOM/storage fixtures. Keep that dependency-free pattern.
- Test commands can regenerate tracked artifacts or `.pyc`; tests must use temporary roots/outputs and leave the worktree clean.
- A valid test suite must prove negative behavior: placeholders do nothing, MLN111 never feeds game, and corrupt legacy storage cannot poison scoped state.

## Requirements

### Pipeline and content tests

- Registry exact schema/order/status/paths and unique subject/chapter IDs.
- MLN111 exact 380/70-150-160/difficulty/answer distributions and authored schema.
- MLN112 exact 504/current distribution/order/IDs and six unchanged lecture IDs.
- Placeholder invariants: no bank, lectures, or enabled features.
- Profile-driven validator mutation tests for each subject without Python hard-coded course constants.
- Safe serialization, path containment, atomic build, snapshot validation, deterministic byte output, and bundle-size reporting.
- Public-projection stripping, reserved/prototype-like IDs, Unicode/control/bidi policy, pre-parse caps, embedded bundle budget, and all-or-nothing release-directory staging.

### Browser logic tests

- Course home/card state, subject switcher, feature-derived mode list, dynamic labels/counts.
- Route parse/serialize/canonicalization, reload, Back/Forward semantics, invalid fragment recovery.
- Subject-scoped quiz/flash sessions, marks, stats, wrong filter, reset, and search.
- Byte-compatible MLN112 legacy-key behavior plus isolated MLN111 keys; no cross-key migration is introduced in this release.
- Same-tab in-memory preservation when every storage API fails, including MLN111↔MLN112 round trips and reset isolation.
- Placeholder route causes zero session writes, no pool, no iframe, no game activation.
- Lecture chapter link uses `chapterId`; iframe remains lazy and privacy enhanced.
- DOM text rendering and hash parsing resist markup/script payloads.

### Game regression tests

- Game resolves only MLN112 questions even while active study subject is MLN111.
- Legacy campaign/UI save keys and state round-trip unchanged.
- Repeated context events do not duplicate controllers/listeners or advance RNG.
- Subject exit deactivates presentation without mutating save.
- Existing deterministic engine/economy/combat/campaign simulations still pass.

### Accessibility contracts

- Semantic buttons/links, labels, `aria-current`/`aria-pressed`, status/live regions, and heading targets exist.
- Dynamic hidden/disabled states do not leave focus in removed content.
- No inline inaccessible click-only course cards.
- Existing 44 px, reduced-motion, modal focus trap, and safe search highlighting contracts remain.

## Exclusive file ownership

| Action | Absolute path | Purpose |
|---|---|---|
| Modify | `C:\Users\pgb31\mln222-quiz\test_pipeline.py` | Registry/profile/build/content and template contract tests |
| Modify | `C:\Users\pgb31\mln222-quiz\tests\game\study-progress.test.cjs` | Existing MLN112 key compatibility and subject-isolation fixtures |
| Modify if assertions change | `C:\Users\pgb31\mln222-quiz\tests\game\build-assets.test.cjs` | Catalog globals/event/build manifest contracts |
| Modify if fixture injection changes | `C:\Users\pgb31\mln222-quiz\tests\game\ui-controller.test.cjs` | Explicit MLN112 question dependency |
| Create | `C:\Users\pgb31\mln222-quiz\tests\study-hub\catalog-routing.test.cjs` | Catalog, readiness, canonical route-table, and feature tests |
| Create | `C:\Users\pgb31\mln222-quiz\tests\study-hub\storage-workspace.test.cjs` | Storage isolation, in-memory fallback, workspace, placeholder, and lecture contracts |
| Create | `C:\Users\pgb31\mln222-quiz\tests\game\subject-isolation.test.cjs` | MLN112-only game bank and context lifecycle |

Do not edit implementation, content, generated artifacts, docs, README, or screenshots.

## Implementation steps

1. Run both baseline suites and record names/counts. Ensure starting worktree changes are understood; never restore another worker’s files.
2. Refactor Python fixture helpers to create a complete temporary registry and subject tree. Do not copy production generated artifacts into root.
3. Replace single-bank assertions with a matrix over registry subjects while retaining exact MLN112 regression expectations.
4. Add MLN111 production-bank tests: files 70/150/160, 380 IDs, 28/60/64 etc. chapter difficulty quotas, answer position quotas, exact field/source contracts, unique normalized stems/options.
5. Add registry/profile mutation subtests: unknown field, duplicate/unsafe ID, duplicate chapter, path traversal, ready subject missing bank, comingSoon with content, enabled feature missing manifest.
6. Update build tests to extract and compare all three embedded catalogs with pipeline results. Assert no authoring-only path/config leaks into public catalog.
7. Preserve atomicity tests by forcing failures after snapshots and before replace; verify pre-existing target bytes survive. Render twice and compare bytes/hash.
8. Extract routing/storage/workspace functions from `template.html` into VM fixtures as current study-progress tests do. Expand DOM stubs only as needed; do not introduce jsdom/package management.
9. Test the canonical route table for five subjects and every valid mode. Include malformed `%`, encoded separators/NUL/dot segments, any query, extra/oversized segments, unknown subject/mode, missing/repeated hash, canonical round-trip, loop prevention, and Back/Forward order.
10. Test active-subject rebinding: derived indexes, controls, counters, search results, marked/wrong filters, quiz answer state, flash reveal, sanitized public-citation rendering, and reset isolation.
11. Build fixtures with known MLN112 IDs/sessions and assert the current keys and serialized behavior remain byte-compatible. Assert MLN111 writes only its own namespace and each reset leaves the other subject untouched.
12. Add storage failures for `getItem`, `setItem`, `removeItem`, malformed JSON, wrong versions, unknown/duplicate IDs, oversized arrays, and invalid counters. Switch MLN111↔MLN112 repeatedly and assert per-subject in-memory sessions survive in the current tab.
13. Add placeholder spy fixtures for pool creation, storage writes, iframe construction, and game events; every count must remain zero.
14. Add dual-bank game fixture with non-overlapping IDs. Start/resume multiple campaign quizzes and assert every ID belongs to MLN112. Replay existing save fixtures byte-equivalently.
15. Add static accessibility assertions and keyboard-event unit tests for card activation, switcher, tabs, flashcard, and focus destination.
16. Run the complete command matrix serially. Compare counts, no skipped tests, no root artifact diffs, no newly tracked caches.
17. Provide Phase 6 a compact release checklist with exact commands and expected subject counts/artifact budget.

## Required command matrix

```powershell
python compose_questions.py --all --check
python validate_questions.py --all --check
node scripts/validate-game-data.js
python -m unittest -v test_pipeline.py
node --test --test-concurrency=1 tests/game/*.test.cjs tests/study-hub/*.test.cjs
node scripts/simulate-economy.js --runs 100000 --assert
node scripts/simulate-combat.js --runs 10000 --assert --config game/data/balance.json
node scripts/simulate-campaign.js --runs 1000 --turns 60 --assert
git diff --check
git status --short
```

If PowerShell wildcard expansion differs from Node expectations, enumerate files deterministically with `Get-ChildItem | Sort-Object` and pass the array without changing package tooling.

## Risk-based scenario matrix

| Scenario | Expected result |
|---|---|
| Direct `#/mln111/quiz` | 380-bank workspace, MLN111 scoped state |
| Direct `#/mln112/game` | Existing campaign/new setup; MLN112 bank only |
| `#/mln111/game` | Canonical fallback; no game initialization |
| `#/mln131/quiz` | Coming-soon view; zero storage/session writes |
| Valid legacy MLN112 study state | Read unchanged from existing key; current question preserved |
| Corrupt current storage | Ignored safely; per-subject in-memory session continues |
| Leave lecture route | Iframe removed and playback stopped |
| Leave MLN112 game | Save unchanged; transient game UI inactive |
| Malicious content/hash | Rejected at build or rendered as plain text |
| Same source snapshots twice | Byte-identical HTML and catalogs |

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Tests are weakened to accommodate refactor | Keep old MLN112 counts/IDs/save assertions as explicit regressions |
| VM fixture diverges from browser | Extract exact source blocks and add Phase 6 real-browser smoke |
| Tests alter root artifacts | Temp roots/outputs; final clean-status assertion |
| Long simulations slow iteration | Run focused suites during development; full matrix is release gate |
| Accessibility checked only by strings | Combine DOM contracts, keyboard events, and manual browser pass |

## Security considerations

- Include injection/path traversal/prototype-like IDs and hostile localStorage fixtures.
- Do not execute authored content in tests; verify safe serialization/text rendering.
- Bound fuzz/mutation inputs to prevent test resource exhaustion.
- Ensure failure output never prints local source bodies or secrets.

## Success criteria

- All 41+ existing Python and 141 existing Node behaviors remain represented and passing.
- New tests prove five-course registry, MLN111 completeness/sign-off, placeholder no-op, storage isolation, canonical routes, and the fixed MLN112 game alias.
- Full deterministic simulations pass unchanged.
- Tests leave `index.html`, `questions.json`, `parse_report.txt`, caches, and unrelated worktree files untouched.
- Phase 6 receives exact green commands and expected counts.

## Completion record

| Gate | Final result |
|---|---|
| Python | 66/66 passed |
| Node | 158/158 passed |
| Economy/combat | Deterministic release simulations passed |
| Campaign | 1,000 × 60 passed; 0 invalid actions, 0 invariant failures, 0 warning violations |
| Local HTTP allowlist | Passed |

The final regression set covers registry/profile contracts, public projection, release staging and rollback, storage isolation, routing, placeholder no-op behavior, accessibility contracts, and the fixed MLN112 game alias/citation compatibility.

## Next steps

- The clean full matrix passed and authorized [Phase 06](./phase-06-production-build-release-rollback.md).
