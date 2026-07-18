# Phase 04 - Multi-turn combat engine

## Context links

- [Plan overview](./plan.md)
- [Combat design](../reports/260717-2035-conquest-learning-game-design.md#combat-state)
- [Phase 01 contracts](./phase-01-deterministic-foundation.md)

## Overview

- Priority: P1
- Status: Completed
- Effort: 14h
- Dependencies: Phase 01
- Parallel group: A
- Goal: tạo combat engine nhiều lượt, deterministic và được chứng minh bằng 10.000 trận mô phỏng.

## Key insights

- Giới hạn sát thương trực tiếp 15% chưa đủ; morale/fatigue/supply mới là cơ chế kết thúc trận.
- Surrender hoặc rout tính là toàn bộ quân đã bị đánh bại nhưng không đồng nghĩa toàn bộ tử trận.
- Reinforcement không được reset battle turn/morale và phải đến trễ một lượt.
- Combat config phải được inject; Phase 07 mới sở hữu constants production.

## Requirements

- Battle state gồm participants, unit stacks, initial force, morale, supply, fortification, breach, turn, tactic and reinforcement queue.
- Tactics: siege, engage, assault, consolidate, retreat.
- Assault khóa đến khi breach đạt ngưỡng config.
- Loss rate dùng effective-power ratio, tactic exposure/damage và clamp theo tactic.
- Casualty outcomes tách dead, wounded, routed/captured; mọi chuyển trạng thái được bảo toàn.
- Capture tạo occupation event, không trực tiếp sửa UI hoặc global campaign ngoài event contract.
- Mọi random result lấy từ `combat` RNG stream.

## Architecture

```text
BattleAction + BattleState + config + combat RNG
  -> validate tactic/reinforcement
  -> effective power
  -> simultaneous losses
  -> morale/supply/fortification
  -> outcome events or next BattleState
```

Loss của hai bên tính từ snapshot đầu pulse để thứ tự xử lý không tạo lợi thế.

## Related code files

Create:

- `C:\Users\pgb31\mln222-quiz\game\engine\combat.js`
- `C:\Users\pgb31\mln222-quiz\game\engine\combat-casualties.js`
- `C:\Users\pgb31\mln222-quiz\game\engine\combat-tactics.js`
- `C:\Users\pgb31\mln222-quiz\scripts\simulate-combat.js`
- `C:\Users\pgb31\mln222-quiz\tests\game\combat.test.cjs`

No economy, map, quiz or production balance file modified.

## Implementation steps

1. Define battle state factory and validate attacking/defending stacks.
2. Implement effective power factors with bounded morale/supply/terrain/fortification multipliers.
3. Implement tactic metadata and assault availability.
4. Implement simultaneous attrition using seeded random variance inside narrow bounds.
5. Enforce tactic-specific 2-6%, 4-10% and 7-15% loss envelopes.
6. Implement morale loss, fortification shield and fatigue after battle turn 3.
7. Implement increased supply pressure after battle turn 8.
8. Implement reinforcement queue, withdrawal and bounded pursuit loss.
9. Implement casualty category allocation and recovery queue events.
10. Implement surrender/rout outcome that sets active defenders to zero without marking all dead.
11. Add conservation, symmetry, deterministic replay and malformed-action tests.
12. Build simulation matrix across ratios 0.5, 0.75, 1, 1.5, 2 and 3 with varied terrain/supply/tactics.

## Todo

- [x] Define battle state and tactics
- [x] Implement effective power and simultaneous attrition
- [x] Implement morale, fatigue and supply pressure
- [x] Implement reinforcement, withdrawal and surrender
- [x] Implement casualty state transitions
- [x] Add deterministic/property tests
- [x] Run 10.000-battle assertion simulation

## Success criteria

- Equal-force median duration: 5-7 turns.
- Approximate 2:1 median duration: 3-5 turns.
- At least 80% representative battles end in 3-7 turns; at least 95% before turn 10.
- Direct active-force loss never exceeds 15% in one pulse.
- Battle accounting never creates soldiers and never removes more than available.
- Same seed/tactics produce identical battle states and events.

## Risk assessment

- Risk: weak side can stall forever with consolidate. Mitigation: fatigue and supply escalation independent of tactic.
- Risk: surrender misread as mass death. Mitigation: separate active/dead/wounded/routed/captured counters.
- Risk: configuration passes one ratio but fails terrain extremes. Mitigation: matrix assertions across terrain/supply/tactics.

## Security considerations

- Reject unit IDs, province IDs and tactic IDs not in injected data.
- Clamp all multipliers and counts; never trust save payload numeric ranges.

## Next steps

Phase 06 consumes combat events. Production tuning remains owned by Phase 07.
