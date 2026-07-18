# Phase 01 - Deterministic foundation

## Context links

- [Plan overview](./plan.md)
- [Approved design](../reports/260717-2035-conquest-learning-game-design.md)
- Existing build source: `C:\Users\pgb31\mln222-quiz\template.html`
- Existing regression suite: `C:\Users\pgb31\mln222-quiz\test_pipeline.py`

## Overview

- Priority: P1
- Status: Completed
- Effort: 8h
- Dependencies: none
- Goal: khóa state/action contract, RNG và runtime thuần dữ liệu trước khi các module chạy song song.

## Key insights

- Engine phải chạy được trong Node và browser mà không cần bundler hoặc package ngoài.
- Cùng seed và cùng action phải tạo cùng state, kể cả sau save/load.
- RNG cần stream/counter riêng cho `combat`, `ai`, `quiz` và `events`; thêm một lần rút ở AI không được làm đổi bộ câu hỏi.
- Mọi state production phải là plain JSON serializable.

## Requirements

- Namespace browser duy nhất, ví dụ `globalThis.MLN222Game`.
- Module dạng IIFE/UMD nhỏ, có thể nạp theo thứ tự trong browser và `require` từ Node test.
- `GameState`, `Action`, `Event`, `RngState`, `Result` được mô tả rõ.
- Runtime nhận handler registry qua dependency injection; không sửa runtime khi thêm economy/combat/quiz.
- Quy tắc làm tròn, clamp và clone nằm một chỗ.
- Invariant validator chạy được sau từng action trong test/debug.

## Architecture

```text
Action -> deterministic runtime -> registered handler -> nextState + events
                                  -> invariant validation
RNG request(stream) -> hash(seed, stream, counter) -> value + counter increment
```

Không lưu function, `Set`, `Map`, DOM node hoặc class instance trong `GameState`.

## Related code files

Create:

- `C:\Users\pgb31\mln222-quiz\game\core\namespace.js`
- `C:\Users\pgb31\mln222-quiz\game\core\rng.js`
- `C:\Users\pgb31\mln222-quiz\game\core\contracts.js`
- `C:\Users\pgb31\mln222-quiz\game\core\runtime.js`
- `C:\Users\pgb31\mln222-quiz\game\core\invariants.js`
- `C:\Users\pgb31\mln222-quiz\game\contracts\game-state.md`
- `C:\Users\pgb31\mln222-quiz\tests\game\test-helpers.cjs`
- `C:\Users\pgb31\mln222-quiz\tests\game\core.test.cjs`

No existing production file modified in this phase.

## Implementation steps

1. Define namespace/module registration pattern compatible with classic `<script>` and Node.
2. Define minimal serializable state envelope: schema version, campaign seed, turn, phase, RNG counters, factions, provinces, battles, quiz and event log.
3. Define action envelope with stable `id`, `type`, `payload` and expected phase.
4. Implement stream-based seeded RNG with integer-safe algorithm and explicit counter persistence.
5. Implement deterministic helpers for shuffle, weighted choice, clamp, integer rounding and stable sort.
6. Implement runtime accepting handler map and returning a new state plus ordered events.
7. Implement invariant collector that returns structured errors instead of mutating state.
8. Add source scan test rejecting `Math.random`, `Date.now`, DOM and storage access under `game/core`.
9. Add round-trip JSON and replay tests with stub handlers over at least 20 turns.
10. Run current Python regression suite to prove foundation files do not affect production build.

## Todo

- [x] Define state/action/event contracts
- [x] Implement seeded RNG streams and counters
- [x] Implement dependency-injected runtime
- [x] Implement structured invariants
- [x] Add Node test helper and deterministic replay tests
- [x] Confirm existing Python suite remains green

## Success criteria

- Same seed + same ordered actions = byte-equivalent serialized state.
- Save/load at turn 10 then continue to turn 30 = uninterrupted result.
- Different RNG streams do not perturb one another.
- No forbidden nondeterministic/browser API in core.
- Core test command exits 0 without third-party packages.

## Risk assessment

- Risk: global namespace collisions. Mitigation: one namespace and explicit module keys; fail on duplicate registration.
- Risk: counter overflow. Mitigation: use safe integers, validate, and derive values from bounded counters.
- Risk: later modules bypass runtime. Mitigation: production campaign only accepts actions through registered handlers.

## Security considerations

- Reject unknown action types and malformed payloads.
- Never merge untrusted objects through prototype-bearing assignment.
- Clone only known schema fields; no dynamic code execution.

## Next steps

After contract tests pass, phases 2, 3, 4 and 5 may start in parallel.
