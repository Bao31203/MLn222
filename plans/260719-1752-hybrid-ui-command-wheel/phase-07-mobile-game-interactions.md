# Phase 07: Mobile game interactions

## Context links

- [Plan](./plan.md)
- [Phase 05](./phase-05-context-command-wheel.md)
- [Phase 06](./phase-06-campaign-panels-order-tray.md)

## Overview

- Priority: P1
- Status: Complete
- Effort: 9h
- Mục tiêu: thiết kế game mobile theo map-first, action palette hữu hình và gesture không xung đột.

## Key insights

- `touch-action:none` đang giao toàn bộ gesture map cho custom pointer handling.
- Radial 220px không phù hợp mọi màn 360px và dễ che target.
- Bottom navigation mới từ P2, game sheet và action dock phải chia sẻ safe-area budget.

## Requirements

- Map chiếm 45-55dvh khi campaign; sheet có collapsed/peek/expanded rõ.
- Tap foreign province chọn target và làm nút `Hành động` khả dụng.
- Nút `Hành động` mở palette 2x2/nửa vòng cùng bốn nhóm desktop.
- Mobile palette controls có hit target tối thiểu 48px và không thu nhỏ theo số action.
- Long press là shortcut tùy chọn, có delay khoảng 450ms và movement threshold tối thiểu 10px.
- Pan/pinch không vô tình mở action palette; mở palette không làm map nhảy.
- Order tray/reward/end-turn dùng bottom dock nhưng không chồng app bottom nav.
- Landscape và keyboard-height viewport vẫn thoát/đóng được sheet.

## Architecture

- Dùng cùng context action model; chỉ đổi renderer radial desktop sang mobile palette.
- Gesture state machine phân biệt tap, drag, pinch, long-press và context-open.
- UI safe-area tokens dùng chung cho app nav, sheet và action dock.
- Sheet state là ephemeral hoặc UI sidecar hiện có; không vào campaign schema.

## Related files

- Modify: `C:\Users\pgb31\mln222-quiz\game\ui\context-command-menu.js`
- Modify: `C:\Users\pgb31\mln222-quiz\game\ui\map-view.js`
- Modify: `C:\Users\pgb31\mln222-quiz\game\ui\game-app.js`
- Modify: `C:\Users\pgb31\mln222-quiz\game\styles\game.css`
- Modify: `C:\Users\pgb31\mln222-quiz\template.html`
- Modify: `C:\Users\pgb31\mln222-quiz\tests\game\ui-controller.test.cjs`
- Generate: `C:\Users\pgb31\mln222-quiz\index.html`

## Implementation steps

1. Chốt vertical budget cho map, resource strip, sheet peek, dock và bottom nav.
2. Thêm visible action button gắn selected foreign target.
3. Xây mobile palette renderer từ cùng sector model.
4. Cài gesture arbitration với timer và movement threshold; cancel khi pinch/drag.
5. Tổ chức sheet transitions và focus khi palette/action sheet mở.
6. Tối ưu condensed resource strip và expandable resources.
7. Test 360x800, 390x844, 390x500, 844x390 và 768x1024.
8. Test tap target nhỏ, islands, selected edge target, browser text zoom và reduced motion.

## Todo

- [x] Visible action button hoạt động không cần long press.
- [x] Long press không xung đột pan/pinch.
- [x] Palette và sheet không che nút đóng/confirm.
- [x] Bottom dock/nav có safe-area đúng.
- [x] Mobile full campaign workflow hoàn thành bằng touch.

## Success criteria

- Không horizontal overflow hoặc incoherent overlap ở viewport matrix.
- Tất cả interactive target đạt tối thiểu 44x44px.
- Từ tap target đến action confirmation không quá ba tap.
- Gesture cancel ổn định; không double-stage action.

## Risk assessment

- Pointer capture có thể giữ timer sau cancel. Clear timer trên pointercancel, multi-touch, mode change và visibility change.
- Browser context/selection menu khi long press. Prevent chỉ khi gesture xác định trên province; giữ accessibility alternative.

## Security considerations

- Mobile renderer không tạo payload riêng.
- Không lưu raw pointer coordinates hoặc target ngoài validated UI state.

## Next steps

Visual checkpoint mobile trước P8.
