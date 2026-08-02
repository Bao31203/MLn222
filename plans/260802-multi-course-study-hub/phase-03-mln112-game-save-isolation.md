---
title: "Phase 03 - MLN112 game compatibility gate"
description: "Keep the current game on its fixed legacy MLN112 bank and prove that multi-course navigation cannot feed it MLN111 questions or alter saves."
status: completed
priority: P1
effort: 1h
issue: null
branch: main
tags: [compatibility, verification, game]
created: 2026-08-02
---

# Phase 03: MLN112 Game Compatibility Gate

## Context links

- [Plan](./plan.md)
- [Phase 02 pipeline](./phase-02-multi-subject-validation-build-pipeline.md)
- [Codebase audit](./research/codebase-audit.md)
- `C:\Users\pgb31\mln222-quiz\game\contracts\campaign-api.md`

## Overview

- Priority: P1
- Status: Completed
- Owner: compatibility verifier
- Depends on: Phase 2's rendered catalog contract.
- Scope: freeze and verify existing behavior; do not refactor the controller/view or game storage.

## Requirements

- Phase 2 permanently binds `globalThis.MLN222_QUESTIONS` to `getQuestionBank("mln112")` for this release. It never follows the active study subject.
- Phase 4 exposes the game tab only when active subject is `mln112` and `features.game === true`; leaving that route uses the existing mode-deactivation path.
- Keep current game implementation, `MLN222Game` namespace, RNG, balance, question IDs, and save keys byte-compatible.
- Do not inject banks through game app → controller → view or add a second lifecycle/event protocol until another course actually needs a game.
- Missing/corrupt MLN112 bank fails through the current controlled unavailable path and never falls back to MLN111.

## Exclusive file ownership

This began as a read-only integration gate. Phase 2 owns the fixed alias, Phase 4 owns visibility/mode gating, and Phase 5 owns permanent regressions. Integration review found one actual display leak: the game quiz source renderer still expected authoring-only source fields after the public projection changed. The scoped `game/ui/game-quiz-view.js` compatibility fix accepts public `{label, section}` citations while retaining the legacy fallback; no engine, state, RNG, balance, or save implementation changed.

## Verification steps

1. Record the current MLN112 bank hash, 504 IDs, game globals, storage keys, and baseline test result.
2. Render a temporary dual-bank fixture and assert `MLN222_QUESTIONS === getQuestionBank("mln112")` before and after switching MLN111 ↔ MLN112.
3. Under MLN111 and placeholder routes, assert game navigation is absent and existing campaign save bytes remain unchanged.
4. Under `#/mln112/game`, start/resume a campaign and assert every quiz ID belongs to the unchanged 504-question bank.
5. Run all 141 existing Node tests. Any required game-code change invalidates this simplification and must be re-planned before Phase 4.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Active study bank leaks into campaign | Keep the legacy alias permanently fixed to MLN112; regression-check dual-bank switches |
| UI hides game but mutates save | Use existing deactivation path only and compare save bytes |
| Compatibility alias is removed too early | Make it a release contract; removal requires a later dedicated plan |

## Success criteria

- No game engine, state, RNG, balance, or save implementation file changed; the scoped quiz citation display adapter is the only compatibility exception.
- Game draws only unchanged MLN112 IDs across subject switches.
- MLN111/placeholders cannot expose or activate game UI.
- All legacy campaign/UI saves and 141 baseline tests remain green.

## Completion record

- Completed: immutable `MLN222_QUESTIONS` remains bound to the unchanged MLN112 bank across subject switches.
- Completed: the final Node suite passed 158/158.
- Completed: the 1,000 × 60 campaign gate passed with 0 invalid actions, 0 invariant failures, and 0 warning violations.

## Next steps

- Subject-aware visibility and the fixed-alias/save-preservation regressions were completed in Phases 4 and 5.
