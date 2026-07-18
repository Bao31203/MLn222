# Phase 05 - Quiz scheduler and persistence

## Context links

- [Plan overview](./plan.md)
- Question bank: `C:\Users\pgb31\mln222-quiz\questions.json`
- Existing storage logic: `C:\Users\pgb31\mln222-quiz\template.html`
- [Approved reward design](../reports/260717-2035-conquest-learning-game-design.md#quiz-rewards-and-penalties)

## Overview

- Priority: P1
- Status: Completed
- Effort: 10h
- Dependencies: Phase 01
- Parallel group: A
- Goal: tạo scheduler 10 câu deterministic, reward actions và save/resume an toàn giữa quiz/battle.

## Key insights

- Ngân hàng có 204 Nhận biết, 204 Thông hiểu và 96 Vận dụng.
- Tỷ lệ `4/4/2` dùng hết toàn bộ 96 câu Vận dụng sau 48 lượt, nên không thể vừa giữ tỷ lệ tuyệt đối vừa không lặp đến câu thứ 504.
- Priority đúng: 10 câu -> không lặp -> quota độ khó theo debt -> cân bằng chương.
- Save phải giữ quiz hiện tại và từng đáp án; reload không được đổi bộ câu hỏi.

## Requirements

- Mỗi quiz đúng 10 question IDs hợp lệ.
- Không lặp cho đến khi toàn bộ 504 câu của cycle được tiêu thụ.
- Khi cycle còn dưới 10 câu, dùng hết phần còn lại rồi mới điền từ cycle mới.
- Scheduler theo dõi difficulty/chapter debt để tiến gần 4/4/2 mà không vi phạm no-repeat.
- Quiz set được tạo/lưu trước khi render; mỗi answer được lưu ngay.
- Reward/penalty trả về action/event, không sửa trực tiếp economy state.
- Save envelope có schema version, payload, RNG counters và checksum nhẹ; save hỏng fallback an toàn.

## Architecture

```text
Question metadata + quiz RNG + cycle/debt state -> 10 stable IDs
Quiz answers -> score -> bounded reward action for next turn
GameState <-> validated save envelope <-> injected storage adapter
```

Storage codec không phụ thuộc `window.localStorage`; browser adapter thuộc Phase 08.

## Related code files

Create:

- `C:\Users\pgb31\mln222-quiz\game\quiz\question-deck.js`
- `C:\Users\pgb31\mln222-quiz\game\quiz\quiz-rewards.js`
- `C:\Users\pgb31\mln222-quiz\game\storage\save-codec.js`
- `C:\Users\pgb31\mln222-quiz\game\storage\save-validation.js`
- `C:\Users\pgb31\mln222-quiz\tests\game\quiz-save.test.cjs`

Do not modify current study-mode `mln222.v2.*` storage keys.

## Implementation steps

1. Build immutable question metadata index from injected production questions.
2. Implement cycle order with deterministic shuffle and persisted cursor.
3. Implement difficulty/chapter debt scoring over available unseen candidates.
4. Implement cycle-boundary behavior that exhausts remaining questions before repeats.
5. Persist quiz IDs, current position, selected options, score and completion state.
6. Implement score-to-reward action with caps based on injected production baseline.
7. Implement save envelope for `mln222.game.v1`, including schema version and known-field validation.
8. Implement safe fallback for missing, truncated, future-version and maliciously shaped saves.
9. Add in-memory storage adapter tests for save after every quiz answer and battle transition.
10. Replay at least 60 turns of generated quizzes and verify cycle/quota invariants.

## Todo

- [x] Implement deterministic no-repeat question cycle
- [x] Implement quota debt and chapter balancing
- [x] Implement bounded reward/penalty actions
- [x] Implement save codec and validation
- [x] Add mid-quiz/mid-battle round-trip tests
- [x] Add corrupted/future save tests

## Success criteria

- Exactly 10 questions per completed turn.
- No repeated ID before all 504 IDs are consumed.
- First 48 ideal turns can reach approximately 4/4/2; later turns use deterministic fallback without violating no-repeat.
- Reload after each answer restores identical set, position, answers and RNG counters.
- Save/load then continue is state-equivalent to uninterrupted play.
- Corrupt save does not throw into the UI and does not affect existing study statistics.

## Risk assessment

- Risk: strict quota causes premature repeats. Mitigation: explicit priority and debt-based target.
- Risk: localStorage quota exceeded. Mitigation: store IDs/state only, never duplicate 504 question bodies or SVG.
- Risk: future schema silently misread. Mitigation: reject unsupported versions and preserve original value for recovery.

## Security considerations

- Parse save as untrusted JSON and whitelist all fields/IDs/ranges.
- Avoid prototype merging and dynamic property execution.
- Reward action validates score server-style even though game is offline.

## Next steps

Phase 06 combines scheduler/save with economy, combat and actual province fixtures.
