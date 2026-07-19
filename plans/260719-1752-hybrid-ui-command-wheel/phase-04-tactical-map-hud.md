# Phase 04: Tactical map và campaign HUD

## Context links

- [Plan](./plan.md)
- [Phase 03](./phase-03-study-workspaces.md)
- [Map verification trước](../260718-1223-modern-vietnamese-ui-redesign/reports/end-to-end-testing.md)

## Overview

- Priority: P1
- Status: Complete
- Effort: 12h
- Mục tiêu: biến game thành tactical workspace rõ ràng trước khi thêm command wheel.

## Key insights

- Source map có full viewBox `0 0 3129.7 4901.01`, 44 groups và 34 keyboard targets.
- Map Việt Nam có tỷ lệ cao/hẹp; phải ưu tiên chiều cao và tránh UI chrome dày.
- Province fill hiện phù hợp setup nhưng campaign cần hierarchy theo faction/relation.

## Requirements

- Map chiếm khoảng 70% workspace desktop và 45-55dvh mobile.
- Setup dùng neutral/regional palette có selected emphasis; campaign dùng faction/relation hierarchy.
- Biên nội tỉnh nhẹ; selected, warning, battle và focus đủ rõ khi zoom.
- HUD tài nguyên ổn định; số liệu/tabular delta không làm đổi kích thước.
- Selected target summary luôn thấy; map toolbar và legend gọn.
- Pending orders/fronts có route/anchor overlay không che province interaction.

## Architecture

- SVG source và province IDs giữ nguyên.
- Không đổi path data, full viewBox, inline-island contract hoặc quay lại inset layout.
- `map-view.js` tiếp tục quản lý transform/zoom/pan/focus và class state.
- Presentation state derive từ controller snapshot; không truy cập engine mutation.
- Overlays dùng một layer DOM/SVG riêng với `pointer-events:none`.

## Related files

- Modify: `C:\Users\pgb31\mln222-quiz\game\styles\game.css`
- Modify: `C:\Users\pgb31\mln222-quiz\game\ui\map-view.js`
- Modify: `C:\Users\pgb31\mln222-quiz\game\ui\resource-bar.js`
- Modify: `C:\Users\pgb31\mln222-quiz\game\ui\game-app.js`
- Modify: `C:\Users\pgb31\mln222-quiz\template.html`
- Modify: `C:\Users\pgb31\mln222-quiz\tests\game\map-data.test.cjs`
- Modify: `C:\Users\pgb31\mln222-quiz\test_pipeline.py`
- Generate: `C:\Users\pgb31\mln222-quiz\index.html`

## Implementation steps

1. Rút gọn command/resource chrome và xác lập map viewport dimensions.
2. Chuẩn hóa setup/campaign territory palettes và semantic class.
3. Điều chỉnh province stroke/hover/focus/selected/battle/warning ở toàn zoom range.
4. Giảm dominance của drum texture; giữ visual identity nhưng không cạnh tranh lãnh thổ.
5. Tái bố trí toolbar, selected-target summary và legend.
6. Thêm overlay layer cho pending route/front marker với accessible text ở panel.
7. Tối ưu transform-only map motion và pointer hit stability.
8. Test fit/zoom/pan/pinch/keyboard trên full viewBox và islands.

## Todo

- [x] Setup map dễ chọn tỉnh và không đọc như rainbow ngẫu nhiên.
- [x] Campaign map phân biệt player/ally/neutral/enemy/front.
- [x] HUD và map toolbar không ép bản đồ nhỏ.
- [x] Pending route overlay không bắt pointer.
- [x] 34 keyboard targets, 44 groups và islands pass.
- [x] Full-viewBox/liền-khối/border contract từ baseline vẫn pass.

## Success criteria

- Đất liền liền khối; biên tỉnh không tạo khe đen ở mọi zoom.
- Map không blank/crop và vẫn chọn được tỉnh nhỏ.
- Desktop CTA/panel và map cùng nằm trong viewport 1440x900.
- Không horizontal overflow trên mobile/landscape.

## Risk assessment

- Faction colors có thể xung đột nguồn fill. CSS custom property theo state, không chỉnh path data.
- Route overlay có thể lệch khi transform. Đặt cùng coordinate system SVG hoặc cập nhật bằng canonical transform.

## Security considerations

- Texture tiếp tục inline local asset; 0 runtime request.
- Tooltip/target labels dùng `textContent`.

## Next steps

Visual checkpoint tactical map bắt buộc trước P5.
