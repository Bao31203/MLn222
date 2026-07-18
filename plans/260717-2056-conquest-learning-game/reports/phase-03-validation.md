# Phase 03 validation report

## Scope

Phase 03 implements the deterministic population, production, upkeep, shortage, desertion, recruitment, unlock, and start-turn economy flow. All balance values remain injected through test or simulator configuration; this phase does not add a production balance file or modify the generated website.

## Implemented behavior

- Piecewise civilian growth peaks at 40% capacity and falls to zero at full capacity.
- Military mobilization reduces both population growth and civilian productivity.
- Production is settled before upkeep so a faction can start with zero stored food and coin.
- Field armies use a separate upkeep multiplier.
- Consecutive shortages reduce readiness and trigger proportional desertion from the configured threshold.
- Recruitment transfers civilians into the military, consumes resources and action points, and completes through a one-turn queue.
- Unit unlocks validate prerequisites, territory, turn, action points, and coin.
- Start-turn processing has a fixed deterministic order and emits structured breakdowns and events.

## Review and correction

The implementation review tightened malformed-state checks, crisis-counter overflow handling, readiness rounding, unlock-cost validation, and turn-state validation.

The first full test run found one validation-order defect: a wrong-phase recruitment request returned before collecting other applicable business-rule errors. Structural validation remains fail-fast, while phase, ownership, unlock, population, resource, and action-point errors are now collected together. The targeted test and full suite passed after the correction.

## Verification

Phase 03 was re-run directly on 2026-07-18 after completion of the remaining phases. The targeted suite again passed all 23 tests, including the generated 100,000-transition invariant check.

| Command or check | Result |
|---|---|
| `node --test tests/game/economy.test.cjs` | 23 passed, 0 failed |
| `node --test tests/game/*.test.cjs` | 130 passed, 0 failed |
| `node scripts/simulate-economy.js --runs 100000 --assert` | 100,000 transitions passed |
| `node scripts/validate-game-data.js` | Pass: 34 provinces, 58 adjacency edges, 5 units |
| `python -m unittest -v test_pipeline.py` | 33 passed, 0 failed |

The deterministic simulation recorded 29,641 shortage transitions and 16,257 desertion transitions without a negative or non-finite resource, population-capacity violation, or conservation failure.

## Phase gate

All implementation and verification criteria for Phase 03 pass. Phase 03 was approved for closure when work continued to the remaining phases.
