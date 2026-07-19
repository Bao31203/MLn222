---
title: "Đại tu UI hai không gian và vòng lệnh Công thành"
description: "Tái cấu trúc toàn bộ trải nghiệm học và game, thêm radial menu theo mục tiêu nhưng giữ nguyên engine, dữ liệu và offline build."
status: complete
priority: P1
effort: 84h
branch: main
tags: [refactor, frontend, ux, game, accessibility]
created: 2026-07-19
---

# Đại tu UI hai không gian và vòng lệnh Công thành

## Tổng quan

Thực hiện thiết kế đã duyệt tại [báo cáo brainstorm](../reports/260719-1752-hybrid-ui-command-wheel-design.md): study sáng, game tối, app shell mới, tactical map workspace và radial menu chuột phải cho tỉnh NPC. Giữ toàn bộ game rules, save, 504 câu hỏi và single-file offline artifact.

## Phases

| # | Phase | Trạng thái | Effort | Phụ thuộc | Link |
|---:|---|---|---:|---|---|
| 1 | Baseline và design contract | Complete | 6h | - | [phase-01](./phase-01-baseline-design-contract.md) |
| 2 | App shell và dual theme | Complete | 9h | 1 | [phase-02](./phase-02-dual-theme-app-shell.md) |
| 3 | Study workspaces | Complete | 10h | 2 | [phase-03](./phase-03-study-workspaces.md) |
| 4 | Tactical map và campaign HUD | Complete | 12h | 2, 3 | [phase-04](./phase-04-tactical-map-hud.md) |
| 5 | Context action model và radial menu | Complete | 14h | 4 | [phase-05](./phase-05-context-command-wheel.md) |
| 6 | Campaign panels và order tray | Complete | 10h | 5 | [phase-06](./phase-06-campaign-panels-order-tray.md) |
| 7 | Mobile game interactions | Complete | 9h | 5, 6 | [phase-07](./phase-07-mobile-game-interactions.md) |
| 8 | Quiz, states và accessibility | Complete | 7h | 3, 6, 7 | [phase-08](./phase-08-quiz-states-accessibility.md) |
| 9 | Release verification | Complete | 7h | 8 | [phase-09](./phase-09-release-verification.md) |

## Dependency graph

```text
P1 -> P2 -> P3 -> P4 -> P5 -> P6 -> P7 -> P8 -> P9
```

Triển khai tuần tự vì `template.html`, `game/styles/game.css`, `game/ui/game-app.js` và map interaction có ownership chồng lấp. Mỗi phase phải kết thúc bằng source test và visual checkpoint trước phase kế tiếp.

## Kiến trúc

- `template.html`: source app shell, study UI, game host markup, icon sprite và build placeholders.
- `game/ui/*`: presentation/controller adapters; không tái tính gameplay outcome.
- `game/ui/context-action-model.js`: legal action grouping và disabled explanation.
- `game/ui/context-command-menu.js`: radial/palette interaction state, không serialize.
- `game/styles/game.css`: scope game/theme; study styles vẫn source trong template trừ khi phase 1 chứng minh cần tách.
- `build_html.py` + manifest: nhúng module/asset vào deterministic `index.html`.

## Guardrails

- Không thay đổi hành vi `game/core`, `game/engine`, `game/data`, `game/quiz`, `game/storage`.
- Không đổi questions/content hoặc save schema/key.
- Không chỉnh trực tiếp `index.html`.
- Enabled action chỉ từ exact result của `controller.legalActions()`.
- Không sao chép source/asset OpenFront; chỉ dùng interaction pattern.
- Context menu không lưu vào campaign; pending order tiếp tục dùng UI sidecar hiện có.
- 44px touch target; WCAG AA; keyboard parity; reduced motion.
- Không runtime network; artifact mục tiêu dưới 2.25MB hoặc có phê duyệt tăng budget.
- Tôn trọng dirty worktree hiện có; không revert thay đổi map đã hoàn thành.

## Visual checkpoints

1. P2: app shell, dual theme, navigation desktop/mobile.
2. P3: quiz/flash/search sáng ở 1440x900 và 390x844.
3. P4: map/HUD/territory hierarchy trước khi thêm command wheel.
4. P5: right-click, keyboard context menu, action sheet và pending route.
5. P7: touch palette, bottom sheet và map gestures mobile.

Mỗi checkpoint phải có source tests, production rebuild và browser evidence. Nếu checkpoint thất bại, dừng phase sau; giữ renderer/list layout gần nhất đang pass thay vì tiếp tục chồng thêm CSS. P5 có list-menu fallback là minimum shippable interaction nếu radial geometry không đạt usability.

## Verification baseline

```powershell
python validate_questions.py
node scripts/validate-game-data.js
node --test --test-concurrency=1 tests/game/*.test.cjs
$env:PYTHONDONTWRITEBYTECODE='1'; python -m unittest -v test_pipeline.py
python build_html.py
```

Browser QA dùng production `index.html` qua `file://`; kiểm tra console, network, overflow, keyboard, pointer, touch và browser zoom.

## Completion rule

Chỉ đánh dấu hoàn tất khi chín phase, năm visual checkpoint, action parity tests, desktop/mobile browser matrix, offline reload, deterministic build và tài liệu release đều pass.

## Red team review

### Session 2026-07-19

**Findings:** 10 (9 accepted, 1 rejected)  
**Severity:** 1 Critical, 6 High, 3 Medium

Các thay đổi accepted đã được truyền vào P1, P4, P5, P7 và P9. Xem [red-team report](./reports/red-team-review.md).

## Validation log

### Session 1 - 2026-07-19

- Chốt study sáng + game tối.
- Chốt radial menu + contextual action sheet cho foreign faction.
- Chốt desktop/mobile renderer riêng, engine/save/offline không đổi.
- Chốt exact enabled action chỉ từ `controller.legalActions()`.
- Chốt không dùng code/asset OpenFront.

Kết quả: **PASS**. Xem [validation report](./reports/plan-validation.md).
