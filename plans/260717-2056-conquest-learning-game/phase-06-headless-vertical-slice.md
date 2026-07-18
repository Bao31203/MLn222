# Phase 06 - Headless vertical slice

## Context links

- [Plan overview](./plan.md)
- [Phase 02 map data](./phase-02-map-province-data.md)
- [Phase 03 economy](./phase-03-economy-population-engine.md)
- [Phase 04 combat](./phase-04-multi-turn-combat-engine.md)
- [Phase 05 quiz/save](./phase-05-quiz-persistence.md)

## Overview

- Priority: P1
- Status: Completed
- Effort: 10h
- Dependencies: Phases 02, 03, 04, 05
- Goal: chứng minh vòng chơi đầu-cuối bằng một scenario nhỏ trước khi viết full AI và UI production.

## Key insights

- Vertical slice phải dùng data thật và API thật, không tạo engine thứ hai chỉ để demo.
- Chưa cần full diplomacy/33 NPC; scripted opponent và trade event đủ kiểm chứng các module giao tiếp.
- Save/resume giữa quiz và battle là gate, không phải polish cuối dự án.
- Pha này khóa campaign API mà Phase 07 và Phase 08 phải cùng tuân theo.

## Requirements

- Scenario dùng một player và hai NPC trên ba tỉnh kề nhau từ dữ liệu Phase 02.
- Chạy ít nhất tám lượt với production, upkeep, recruitment, một trade event, một battle nhiều lượt, quiz và reward.
- Save/load ít nhất một lần giữa quiz và một lần giữa battle.
- Mọi state change đi qua action runtime; scenario không sửa object trực tiếp.
- Event log đủ dữ liệu để CLI in báo cáo và UI sau này dựng view model.
- Campaign API contract khóa command, query, event và error shapes.

## Architecture

```text
scripted action sequence
  -> Phase 01 runtime
  -> Phase 03/04/05 handlers
  -> actual Phase 02 fixtures
  -> save/load checkpoints
  -> snapshots + invariant assertions
```

Vertical slice là headless acceptance harness, không phải UI tạm sẽ bị mang vào production.

## Related code files

Create:

- `C:\Users\pgb31\mln222-quiz\game\contracts\campaign-api.md`
- `C:\Users\pgb31\mln222-quiz\game\scenarios\vertical-slice.js`
- `C:\Users\pgb31\mln222-quiz\scripts\run-game-vertical-slice.js`
- `C:\Users\pgb31\mln222-quiz\tests\game\vertical-slice.test.cjs`

Do not modify modules owned by Phases 01-05.

## Implementation steps

1. Select three connected province fixtures and define deterministic initial factions.
2. Compose handler registry from economy, combat and quiz modules.
3. Define stable campaign commands and read-only queries/view models in `campaign-api.md`.
4. Script a legal eight-to-twelve-turn flow containing recruitment and resource pressure.
5. Inject a scripted trade result without implementing production diplomacy.
6. Start and resolve a battle over multiple strategic turns with at least one reinforcement/tactic change.
7. Generate and answer ten questions each turn using deterministic answer fixtures.
8. Serialize/restore at mid-quiz and mid-battle, then compare uninterrupted/reloaded terminal state.
9. Print concise per-turn resource, action, battle and quiz summaries from events.
10. Add negative flow tests: invalid phase action, insufficient resources and corrupt resume.

## Todo

- [x] Lock campaign command/query/event contract
- [x] Build three-province deterministic scenario
- [x] Exercise economy, recruitment and trade event
- [x] Exercise multi-turn battle and reinforcement
- [x] Exercise 10-question quiz and rewards
- [x] Prove mid-quiz/mid-battle resume equivalence

## Success criteria

- Scenario completes at least eight turns without invariant violation.
- Includes a completed recruitment, trade benefit and 3-7-turn battle.
- Every strategic turn completes exactly one quiz of ten questions.
- Reloaded and uninterrupted runs serialize to identical terminal state.
- Invalid actions return structured errors and do not partially mutate state.
- Campaign API is sufficient for both production AI and UI without exposing mutable internals.

## Risk assessment

- Risk: scripted flow hides missing APIs. Mitigation: include alternate/invalid actions and derive UI-facing queries.
- Risk: scenario becomes a second campaign engine. Mitigation: it only composes production handlers and scripted decisions.
- Risk: later AI requires contract changes. Mitigation: review command/query/event needs before marking phase complete.

## Security considerations

- Treat scenario answers/actions as untrusted through the same validators used for UI/save.
- Never bypass save validation for test fixtures.

## Next steps

After this gate, Phase 07 production campaign and Phase 08 UI may proceed in parallel.
