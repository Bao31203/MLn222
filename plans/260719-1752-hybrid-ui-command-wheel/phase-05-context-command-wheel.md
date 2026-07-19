# Phase 05: Context action model và radial menu

## Context links

- [Plan](./plan.md)
- [OpenFront notes](./research/openfront-interaction-notes.md)
- [Phase 04](./phase-04-tactical-map-hud.md)

## Overview

- Priority: P1
- Status: Complete
- Effort: 14h
- Mục tiêu: thêm chuột phải trên tỉnh NPC, radial menu bốn nhóm và action sheet dùng legal action hiện có.

## Key insights

- `controller.legalActions()` chỉ trả legal actions, chưa có disabled reasons.
- Map đã có click, keyboard, pointer pan và pinch; context interaction phải không phá gesture.
- `WARN_ATTACK` có thể có nhiều nguồn/strength ratio cho cùng target; radial sector không đủ chỗ chọn trực tiếp.

## Requirements

- Right-click foreign province: select target, open menu tại pointer và chặn native context menu trong map.
- Bốn nhóm ổn định: info, diplomacy, trade, military.
- Capability catalog giữ vị trí bốn nhóm ngay cả khi legal set rỗng; chỉ exact legal actions mới tạo option/payload.
- Menu clamp trong viewport; target anchor vẫn chính xác.
- Sector mở action sheet; lệnh state-changing không execute trực tiếp từ ring.
- Enabled iff exact legal action tồn tại; stage bằng controller hiện có.
- `Esc`, click ngoài, right-click lại, mode/state change đóng menu.
- `ContextMenu`/`Shift+F10`, arrows, Enter/Space và focus restoration hoạt động.
- Own province/blank map không mở foreign wheel; vẫn đóng menu an toàn.
- Setup, active quiz, completed campaign hoặc invalid target không được mở foreign wheel.
- Zoom/pan/resize/visibility change đóng hoặc recompute menu; không để stale anchor/action.
- Có list-menu fallback dùng cùng view model nếu radial renderer không phù hợp/không khả dụng.

## Architecture

```text
map target event
  -> context-command-menu state
  -> context-action-model(snapshot, legalActions, target)
  -> radial sectors
  -> action sheet exact descriptors
  -> controller.stageAction(action)
  -> snapshot update/order overlay
```

- `context-action-model.js` là pure module, test được bằng fixture.
- Descriptor giữ clone payload từ legal action; UI không dựng payload thủ công.
- Capability group có thể disabled với reason cấp nhóm; disabled explanations không có quyền enable/execute action.
- Menu state `{open, provinceId, point, activeGroup, focusIndex}` là ephemeral.
- Desktop wheel diameter 208-224px; mỗi sector có effective hit target tối thiểu 52px.

## Related files

- Create: `C:\Users\pgb31\mln222-quiz\game\ui\context-action-model.js`
- Create: `C:\Users\pgb31\mln222-quiz\game\ui\context-command-menu.js`
- Create: `C:\Users\pgb31\mln222-quiz\tests\game\context-actions.test.cjs`
- Modify: `C:\Users\pgb31\mln222-quiz\game\build-manifest.json`
- Modify: `C:\Users\pgb31\mln222-quiz\build_html.py`
- Modify: `C:\Users\pgb31\mln222-quiz\game\ui\map-view.js`
- Modify: `C:\Users\pgb31\mln222-quiz\game\ui\game-controller.js`
- Modify: `C:\Users\pgb31\mln222-quiz\game\ui\game-app.js`
- Modify: `C:\Users\pgb31\mln222-quiz\game\styles\game.css`
- Modify: `C:\Users\pgb31\mln222-quiz\template.html`
- Modify: `C:\Users\pgb31\mln222-quiz\tests\game\build-assets.test.cjs`
- Modify: `C:\Users\pgb31\mln222-quiz\tests\game\ui-controller.test.cjs`
- Modify: `C:\Users\pgb31\mln222-quiz\test_pipeline.py`
- Generate: `C:\Users\pgb31\mln222-quiz\index.html`

## Implementation steps

1. Viết fixture prototype cho wheel geometry/focus và list fallback trước khi nối controller.
2. Viết capability grouping contract theo target faction/province/relation.
3. Viết disabled reason priority: phase/quiz, outcome, AP, relation, adjacency, route/treaty/front capacity.
4. Đối chiếu model enabled descriptors với exact `legalActions()` bằng fixture tests.
5. Thêm target-context callback vào map view; xử lý `contextmenu` riêng khỏi drag/click suppression.
6. Xây radial DOM/SVG sectors, icon/label, center target và clamped positioning.
7. Xây action sheet cho exact options, cost/AP/ETA và confirmation.
8. Recompute legal set ngay trước confirmation; controller validation vẫn là gate cuối.
9. Stage action, đóng menu, focus target và cập nhật pending overlay/order status.
10. Thêm keyboard roving focus, Escape/outside click và focus restoration.
11. Đóng/recompute menu trên transform, resize, mode, quiz và relevant snapshot change.
12. Thêm module vào manifest đúng dependency order và inline-safety tests.
13. Browser test foreign target ở bốn góc, browser zoom 200%, hết AP, active quiz và battle warning.

## Todo

- [x] Pure context-action model có action parity tests.
- [x] Right-click không phá left-click/pan/pinch.
- [x] Radial menu không tràn viewport và target anchor đúng.
- [x] Action sheet không stage nhầm hoặc stage action stale.
- [x] Keyboard/context key và focus restoration pass.
- [x] Native context menu chỉ bị chặn trong vùng game cần kiểm soát.
- [x] List fallback và state gating pass.
- [x] Manifest/module dependency order pass trên production artifact.

## Success criteria

- Mở menu và phản hồi hover/press trong 100ms trên máy kiểm thử.
- Từ menu tới confirmation tối đa hai lựa chọn.
- Không descriptor enabled nào thiếu exact legal action.
- Pending action sau stage giống payload từ legal set và survive save/resume như trước.
- Console errors, duplicate listeners và memory leak không xuất hiện qua 50 lần mở/đóng.
- Wheel sector đạt effective 52px; list fallback đạt control 44px.

## Risk assessment

- `contextmenu` phát sau pointer events có thể kích hoạt click. Dùng button/pointer guards và test event order thực tế.
- Legal set có thể đổi sau một staged order. Recompute trước render và trước stage; controller vẫn validate cuối.
- Disabled reason có thể không bao phủ mọi rule. Dùng generic fallback, không tự bật action.

## Security considerations

- Target IDs chỉ lấy từ validated province data/map bindings.
- Labels dùng safe DOM/textContent.
- Không dùng dynamic code, HTML string hoặc external asset.

## Next steps

Visual checkpoint radial/action sheet trước khi P6 tái cấu trúc panel.
