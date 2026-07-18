# Phase 03 - Economy and population engine

## Context links

- [Plan overview](./plan.md)
- [Population/economy design](../reports/260717-2035-conquest-learning-game-design.md#population-model)
- [Phase 01 contracts](./phase-01-deterministic-foundation.md)

## Overview

- Priority: P1
- Status: Completed
- Effort: 10h
- Dependencies: Phase 01
- Parallel group: A
- Goal: triển khai dân số, sản xuất, duy trì, tuyển quân, mở khóa và điểm hành động bằng hàm thuần.

## Key insights

- Kho lương thực và tiền khởi đầu bằng 0, nên lượt đầu phải sản xuất trước khi duy trì.
- `C + A <= K` là invariant trung tâm; tuyển quân chuyển `C` sang `A`, không tạo dân số mới.
- Mobilization làm giảm tăng dân số và năng suất ngoài tác động giảm số dân thường.
- Toàn bộ hệ số phải nhận từ config, không rải literal trong engine.

## Requirements

- Piecewise population curve đạt đỉnh tại `C / K = 0.4`.
- Production phụ thuộc dân thường, trait, stability, mobilization và effect.
- Upkeep theo binh chủng; field army dùng multiplier riêng.
- Thiếu tài nguyên tạo crisis counter, giảm supply/morale và chỉ desert sau hai lượt.
- Recruitment queue hoàn tất sau một lượt; validate capacity, resources, unlock và action points.
- Resources clamp tại 0; không `NaN`, `Infinity` hoặc fractional drift ngoài quy tắc làm tròn.

## Architecture

```text
province + faction + config -> calculateGrowth/Production/Upkeep
action(RECRUIT/UNLOCK)       -> validate -> queued state/events
startTurn                    -> quiz effects -> growth -> production -> trade input -> upkeep
```

Các hàm trả breakdown để UI và simulator giải thích từng thay đổi.

## Related code files

Create:

- `C:\Users\pgb31\mln222-quiz\game\engine\population.js`
- `C:\Users\pgb31\mln222-quiz\game\engine\economy.js`
- `C:\Users\pgb31\mln222-quiz\game\engine\recruitment.js`
- `C:\Users\pgb31\mln222-quiz\game\engine\turn-economy.js`
- `C:\Users\pgb31\mln222-quiz\scripts\simulate-economy.js`
- `C:\Users\pgb31\mln222-quiz\tests\game\economy.test.cjs`

Do not create production `balance.json` here; tests inject fixtures. Phase 07 owns final balance constants.

## Implementation steps

1. Implement population curve and explicit zero/empty-capacity behavior.
2. Implement mobilization factor using civilians and all military statuses consuming capacity.
3. Implement gross food/coin production with structured breakdown.
4. Implement unit upkeep, field multiplier and crisis counters.
5. Implement recruitment queue and civilian-to-soldier conservation.
6. Implement global unit unlock validation and costs through config.
7. Implement two strategic action points and reject actions in wrong turn phase.
8. Register economy/recruitment action handlers through Phase 01 runtime.
9. Add table tests at 0%, 40%, near-capacity and over-mobilized states.
10. Fuzz at least 100,000 generated economy transitions and assert invariants.

## Todo

- [x] Implement population growth curve
- [x] Implement production and upkeep breakdowns
- [x] Implement shortage/crisis behavior
- [x] Implement recruitment and unlock actions
- [x] Implement economy simulator
- [x] Add table, mutation and fuzz tests

## Success criteria

- Peak growth occurs at 40% civilian occupancy within integer-rounding tolerance.
- First turn with zero stock completes and produces a non-deadlocked state.
- 100,000 random transitions produce no negative/NaN resource and never violate capacity.
- Recruitment conserves `C + A` before combat outcomes.
- At 20-30% mobilization economy is materially strained; over 40% cannot remain stable indefinitely under baseline config fixture.

## Risk assessment

- Risk: rounding creates/loses resources. Mitigation: round once at named boundaries and test conservation.
- Risk: double-count army ratio. Mitigation: document intended direct and indirect penalties, tune only in Phase 07.
- Risk: zero civilians divides by zero. Mitigation: explicit safe denominator and test empty province.

## Security considerations

- Validate all numeric action inputs as bounded safe integers.
- Ignore object prototype fields; accept known unit and province IDs only.

## Next steps

Economy functions feed Phase 06 vertical slice and Phase 07 campaign simulator.
