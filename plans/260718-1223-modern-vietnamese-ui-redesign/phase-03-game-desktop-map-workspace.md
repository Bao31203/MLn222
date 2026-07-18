# Phase 03: Workspace Công thành desktop và map fit

## Context links

- [Kế hoạch tổng](./plan.md)
- [Phase 02](./phase-02-study-modes-redesign.md)
- [Thiết kế đã duyệt](../reports/260718-1223-modern-vietnamese-ui-design.md)
- [Map view](../../game/ui/map-view.js)
- [Game CSS](../../game/styles/game.css)
- [Province data](../../game/data/provinces.json)
- [SVG source](../../game/assets/vietnam-map.svg)

## Overview

| Field | Value |
|---|---|
| Priority | P1 |
| Status | Completed |
| Effort | 14h |
| Depends on | Phases 01-02 |

Biến Công thành desktop thành workspace chiến thuật: bản đồ quốc gia được fit đúng, đảo có inset, resource HUD rõ, panel lệnh có hierarchy và turn action dock luôn thấy. Không đổi legal actions, controller snapshot hoặc engine.

## Key insights

- SVG gốc có viewBox `3129.7 x 4901.01`, 34 primary province và 10 island groups.
- Chín tỉnh quản lý các nhóm đảo; `map-view.js` đã đồng bộ owner/state giữa primary và island assets.
- Hình Việt Nam dài và hẹp; chỉ crop viewBox chưa đủ. Cần national fit tốt, island inset và focus selected province.
- `game-app.js` truyền cùng snapshot cho mọi view, gồm `reportEvents`; HUD có thể hiển thị delta mà không tính lại engine.
- Right panel render động từ bốn module; giữ nguyên controller API nhưng có thể đổi DOM presentation.

## Requirements

### Map

- National view hiển thị toàn bộ 34 primary province, dùng tối thiểu 75% chiều cao canvas.
- Hoàng Sa, Trường Sa và các nhóm đảo không biến mất; hiển thị qua inset presentation và cùng state màu với tỉnh chủ quản.
- Có fit-country, zoom in/out và reset/focus control bằng icon.
- Chọn tỉnh bằng mouse/touch/Enter/Space; selected/warning/battle/occupation khác nhau ngoài màu sắc.
- Tooltip cung cấp tên, chủ sở hữu và trạng thái ngắn; không chứa action chỉ dùng hover.
- Resize workspace không làm map trôi khỏi vùng nhìn.

### Resource HUD

- Hiển thị lượt, food, coin, civilians, military, capacity và action points.
- Số liệu dùng tabular numerals, cell width ổn định.
- Delta chỉ lấy từ `snapshot.reportEvents` hoặc chênh lệch snapshot presentation được chứng minh; không gọi công thức engine.
- Action points và cảnh báo thiếu tài nguyên có ưu tiên thị giác cao hơn chỉ số phụ.

### Command panel

- Panel 380-420px trong viewport desktop; content cuộn độc lập.
- Tab Tỉnh/Ngoại giao/Mặt trận/Báo cáo giữ `data-game-panel` và controller persistence.
- Tab có badge đếm presentation-only cho cảnh báo/mặt trận khi có dữ liệu.
- Province action list phân biệt command, cost, duration và pending/disabled state.
- Turn action dock cố định trong panel grid, không bị list đẩy ra ngoài.

## Architecture

### Map presentation

1. Preserve original SVG data and asset ownership mapping.
2. Determine union bounds of 34 primary groups with `getBBox()` after SVG is attached.
3. Apply padded main viewBox/presentation transform for national view.
4. Clone island groups into one or more nested SVG inset viewports; register clones in `groupsByProvince` so update classes remain synchronized.
5. Keep only primary groups keyboard-focusable; inset clones are `aria-hidden`.
6. Store pan/zoom/focus as ephemeral view state in `map-view.js`; never persist in campaign save.
7. Recompute constraints on `ResizeObserver` or safe resize fallback, not on every pointer move.

If `getBBox()` behaves inconsistently under `file://`, record deterministic bounds as presentation constants in `map-view.js`; do not mutate province data schema.

### View rendering

- `game-app.js` remains coordinator and single subscriber.
- Each view owns its DOM subtree and derives display values from snapshot.
- Shared icon/status helpers stay in `ui-utils.js`.
- No module calls engine functions for display-only values.

## Related code files

| Action | Absolute path | Change |
|---|---|---|
| Modify | `C:\Users\pgb31\mln222-quiz\template.html` | Desktop game workspace wrappers, map tooltip/legend, panel/action dock hooks |
| Modify | `C:\Users\pgb31\mln222-quiz\game\styles\game.css` | Desktop grid, HUD, map/inset, panel, tabs, command states |
| Modify | `C:\Users\pgb31\mln222-quiz\game\ui\map-view.js` | Fit bounds, island inset, tooltip, resize, focus controls |
| Modify | `C:\Users\pgb31\mln222-quiz\game\ui\resource-bar.js` | Resource item structure and safe delta/status derivation |
| Modify | `C:\Users\pgb31\mln222-quiz\game\ui\province-panel.js` | Province hierarchy, unit rows and action presentation |
| Modify | `C:\Users\pgb31\mln222-quiz\game\ui\diplomacy-panel.js` | Relation rows, trade/treaty actions and states |
| Modify | `C:\Users\pgb31\mln222-quiz\game\ui\battle-panel.js` | Front summary, tactics and reinforcement presentation |
| Modify | `C:\Users\pgb31\mln222-quiz\game\ui\turn-report.js` | Progress/timeline presentation and event icons |
| Modify | `C:\Users\pgb31\mln222-quiz\game\ui\game-app.js` | Workspace UI coordination and badge counts only |
| Modify | `C:\Users\pgb31\mln222-quiz\tests\game\map-data.test.cjs` | Primary/inset/keyboard target contracts |
| Modify | `C:\Users\pgb31\mln222-quiz\tests\game\ui-controller.test.cjs` | Panel/pending state regression as needed |
| Modify | `C:\Users\pgb31\mln222-quiz\test_pipeline.py` | Required workspace IDs and build assertions |
| Generate | `C:\Users\pgb31\mln222-quiz\index.html` | Build after tests |
| Create | `C:\Users\pgb31\mln222-quiz\plans\260718-1223-modern-vietnamese-ui-redesign\reports\phase-03-game-desktop.md` | Visual checkpoint and browser evidence |

## Implementation steps

1. Add source tests locking 34 primary targets, 44 mapped SVG groups and current ID contracts.
2. Instrument browser to inspect `getBBox()` for primary/island sets and record deterministic bounds.
3. Implement national fit and pan/zoom constraints; verify reset after resize and mode activation.
4. Build island inset without changing province ownership/state semantics.
5. Add hover/focus tooltip and compact map legend; ensure keyboard path exposes equivalent panel details.
6. Rebuild desktop game grid and reserve stable heights for shell, HUD and action dock.
7. Redesign resource HUD; derive optional delta/status from existing report events only.
8. Redesign setup pane and campaign panel headers/tabs.
9. Rework province, diplomacy, battle and report rows into consistent un-nested sections.
10. Add count badges and warning markers from snapshot; do not persist badge state.
11. Verify new/resume/save, province selection, all legal action buttons, pending order clear and end-turn quiz entry.
12. Capture 1440x900 and 1024x768 screenshots for setup, province, diplomacy, battle and report.
13. Stop for second visual checkpoint before mobile work.

## Todo list

- [x] Lock map/DOM contracts with tests.
- [x] Measure primary and island SVG bounds.
- [x] Implement national fit and resize constraints.
- [x] Implement synchronized island inset.
- [x] Add tooltip, focus state and map legend.
- [x] Redesign resource HUD.
- [x] Redesign desktop workspace and action dock.
- [x] Redesign four command panel views.
- [x] Run full campaign browser smoke on desktop.
- [x] Save screenshots/report and obtain visual approval.

## Success criteria

- Exactly 34 primary keyboard targets and 44 mapped groups remain.
- National map uses at least 75% canvas height; no primary province clipped.
- All ten island groups are visible in main view or inset and mirror owner/state correctly.
- Reset/fit works after initial load, mode switch and viewport resize.
- Main panel and action dock fit inside 900px and 768px viewport heights without page-level action loss.
- Same controller action sequence produces same state/save before and after redesign.
- No console errors, network requests or source/build test failures.
- User approves desktop checkpoint.

## Risk assessment

| Risk | Mitigation |
|---|---|
| `getBBox()` unavailable before render | Measure after activation; deterministic bounds fallback |
| Cloned islands lose state classes | Add clones to same `groupsByProvince`; browser assert all asset groups |
| Focus selected province causes motion sickness | Short transform only, reduced-motion immediate update, explicit national-fit control |
| Dense panel still looks like admin UI | Clear command/cost/status hierarchy, restrained sections, no nested cards |
| Report delta misrepresents economy | Use emitted payload only; omit delta when payload cannot support it |

## Security considerations

- Tooltip content uses `textContent` and existing trusted data helpers.
- Cloned SVG comes only from validated embedded SVG; no string parsing or external href.
- Preserve builder SVG restrictions and internal-fragment-only references.

## Next steps

Proceed to [Phase 04](./phase-04-game-mobile-interactions.md) only after desktop visual checkpoint and campaign smoke pass.
