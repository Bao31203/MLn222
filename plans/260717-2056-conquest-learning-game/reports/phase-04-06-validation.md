# Phases 04-06 validation report

## Scope

This report covers the deterministic multi-turn combat engine, the 504-question turn scheduler and save codec, and the three-province headless vertical slice.

## Combat

- Battle pulses use the dedicated `combat` RNG stream and simultaneous force snapshots.
- Siege, engage, assault, consolidate, retreat, delayed reinforcement, rout, mutual rout, casualty categories, and wounded recovery are represented explicitly.
- Campaign ownership and force transfer remain outside the Phase 04 pure engine; Phase 06 validates them in its composition handler and Phase 07 owns production campaign rules.
- Strict battle invariants cover nested participant, queue, tactic, fortification, winner, and outcome state.

The 10,000-battle matrix completed every battle. Median duration was 4 turns overall, P95 was 6, 95.68% ended in 3-7 turns, and 100% ended before turn 10. Maximum direct pulse loss was 13.4%, with zero conservation failures. Equal-force and two-to-one ratio-specific medians passed their respective gates.

## Quiz and save

- The scheduler emits ten unique IDs, exhausts all 504 IDs before a new cycle, and tracks difficulty and chapter debt.
- The first 48 turns reach the ideal cumulative 4/4/2 difficulty allocation.
- Quiz answers, position, score, deck counters, cycle state, and RNG counters survive round trips.
- Save envelopes use `mln222.game.v1`, strict known fields, a lightweight corruption checksum, and safe failures for malformed, oversized, future, or unavailable storage data.
- Reward actions require a completed ten-question quiz and reject unsafe arithmetic.

## Vertical slice

The acceptance scenario uses the real connected fixtures `ha-noi`, `bac-ninh`, and `thai-nguyen`. It completes eight strategic turns with production, upkeep, recruitment, trade, reinforcement, a six-pulse battle, eight quizzes, and 80 unique questions.

The harness performed 86 save checkpoints. Replacing live state from saves midway through quiz and battle produced a byte-equivalent terminal save. Core and combat validation returned zero errors.

## Verification

| Command | Result |
|---|---|
| `node --test tests/game/combat.test.cjs tests/game/quiz-save.test.cjs tests/game/vertical-slice.test.cjs` | 43 passed, 0 failed |
| `node scripts/simulate-combat.js --runs 10000 --assert` | 10,000 passed |
| `node scripts/run-game-vertical-slice.js` | Pass, 8 turns and 80 questions |
