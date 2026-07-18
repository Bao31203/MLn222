# Phase 04: Công thành mobile và bottom sheet

## Context links

- [Kế hoạch tổng](./plan.md)
- [Phase 03](./phase-03-game-desktop-map-workspace.md)
- [Game app](../../game/ui/game-app.js)
- [Map view](../../game/ui/map-view.js)
- [Game CSS](../../game/styles/game.css)

## Overview

| Field | Value |
|---|---|
| Priority | P1 |
| Status | Completed |
| Effort | 10h |
| Depends on | Phase 03 checkpoint approved |

Thiết kế mobile như một workspace riêng: map-first, resource strip gọn, campaign panel dạng bottom sheet và turn action dock luôn tiếp cận được. Giữ UI-only state ngoài campaign save.

## Key insights

- Layout hiện tại dùng map `48-52dvh` và context `42-46dvh`, làm tổng chiều cao khó kiểm soát khi browser chrome/keyboard thay đổi.
- Panel content dài; một bottom sheet có drag gesture đầy đủ sẽ tăng đáng kể complexity và accessibility risk.
- Giải pháp KISS: hai trạng thái collapsed/expanded bằng nút toggle; swipe chỉ là enhancement không bắt buộc.
- Active panel đã được controller sidecar lưu; sheet expansion và resource expansion không cần persistence.
- Map cần giữ pointer pan/zoom mà không cạnh tranh với scroll/sheet control.

## Requirements

### Layout

- 360x800 và 390x844 không cuộn ngang.
- Map là vùng chính, tối thiểu 340px và khoảng 45-55dvh khi campaign chạy.
- Bottom sheet có collapsed/expanded states, title/handle button và region label rõ.
- Sheet expanded cho phép content cuộn độc lập; collapsed vẫn cho thấy tỉnh/tab đang chọn.
- Action dock nằm trên safe area, không che sheet content hoặc map controls.

### Resource strip

- Primary view ưu tiên lượt, food, coin và action points.
- Civilians, military và capacity xuất hiện khi expand, không bị mất khỏi accessibility tree khi đang mở.
- Horizontal scrolling chỉ dùng khi không thể tránh; nếu dùng phải có snap và không giấu action points.

### Interaction

- Chạm tỉnh mở/cập nhật province sheet nhưng không tự expand bất ngờ sau mỗi render.
- Tab panel hoạt động bằng touch và keyboard.
- Virtual keyboard ở seed input không đẩy CTA ra ngoài khả năng cuộn.
- End-turn vẫn yêu cầu quiz 10 câu và không thể kích hoạt hai lần.
- Orientation change/resize giữ map và sheet ở trạng thái hợp lệ.

## Architecture

- `game-app.js` sở hữu ephemeral view state: `sheetState`, `resourcesExpanded`.
- State biểu diễn bằng class/data attribute trên `.game-root`; không thêm vào controller snapshot hoặc storage sidecar.
- Sheet toggle là button thật với `aria-expanded` và `aria-controls`.
- CSS breakpoints xử lý layout; JavaScript chỉ thay state người dùng và phản ứng resize cần thiết.
- Không triển khai drag physics trong scope bắt buộc. Có thể thêm swipe threshold nhỏ sau accessibility gate, nhưng toggle luôn là đường chính.
- Action dock dùng sticky/fixed có spacer tương ứng và `env(safe-area-inset-bottom)` fallback.

## Related code files

| Action | Absolute path | Change |
|---|---|---|
| Modify | `C:\Users\pgb31\mln222-quiz\template.html` | Sheet toggle/header, resource expansion control, mobile action dock hooks |
| Modify | `C:\Users\pgb31\mln222-quiz\game\styles\game.css` | Mobile map-first layout, sheet states, safe area, no-overlap rules |
| Modify | `C:\Users\pgb31\mln222-quiz\game\ui\game-app.js` | Ephemeral mobile UI state and resize coordination |
| Modify | `C:\Users\pgb31\mln222-quiz\game\ui\map-view.js` | Touch constraints and activation/resize fit |
| Modify | `C:\Users\pgb31\mln222-quiz\game\ui\resource-bar.js` | Primary/secondary resource grouping presentation |
| Modify | `C:\Users\pgb31\mln222-quiz\game\ui\game-quiz-view.js` | Mobile viewport/focus compatibility if required |
| Modify | `C:\Users\pgb31\mln222-quiz\test_pipeline.py` | Mobile controls and generated DOM contract |
| Generate | `C:\Users\pgb31\mln222-quiz\index.html` | Build after tests |
| Create | `C:\Users\pgb31\mln222-quiz\plans\260718-1223-modern-vietnamese-ui-redesign\reports\phase-04-game-mobile.md` | Viewport screenshots and interaction evidence |

## Implementation steps

1. Define exact mobile vertical budget for shell, resources, map, sheet collapsed header and action dock.
2. Add semantic sheet toggle and resource expansion controls with stable IDs/ARIA.
3. Implement ephemeral state in `game-app.js`; verify controller snapshot/save bytes unchanged.
4. Replace fixed paired heights with map-first grid and max/min constraints using `dvh` plus safe fallbacks.
5. Make bottom sheet collapsed by default after campaign load; preserve user state during rerenders.
6. Ensure tab selection and province selection update content without unwanted sheet jumps.
7. Place action dock above safe area and add content padding/spacer to prevent occlusion.
8. Tune map pointer/touch behavior so vertical page/sheet interactions and map pan are predictable.
9. Test setup form with virtual-keyboard-sized viewport and long province names.
10. Test campaign at 360x800, 390x844, 844x390 landscape and 1024x768 transition boundary.
11. Exercise end-turn quiz, reload mid-review and resume campaign on mobile.
12. Save screenshots for collapsed/expanded sheet, battle tab and quiz overlay.

## Todo list

- [x] Define mobile vertical layout budget.
- [x] Add accessible sheet/resource toggles.
- [x] Add ephemeral UI state outside save schema.
- [x] Implement map-first responsive layout.
- [x] Implement collapsed/expanded bottom sheet.
- [x] Implement safe-area action dock.
- [x] Resolve map/sheet touch interaction.
- [x] Verify virtual keyboard and orientation changes.
- [x] Run mobile campaign/quiz resume smoke.
- [x] Save phase report and screenshots.

## Success criteria

- No horizontal overflow or incoherent overlap at 360x800 and 390x844.
- Map, bottom-sheet handle and end-turn control are visible in default campaign state.
- Expanded sheet content can reach final action/event without being covered by dock.
- Sheet/resource expansion does not modify campaign or UI sidecar save payload.
- Province touch selection, map pan/zoom and page/sheet scroll do not trigger each other unexpectedly.
- Virtual keyboard allows seed input and Begin Campaign CTA to remain reachable.
- Mobile quiz focus trap/resume and all controller tests pass.

## Risk assessment

| Risk | Mitigation |
|---|---|
| Bottom sheet and map compete for touch | Dedicated handle, explicit touch-action zones, no mandatory drag |
| Fixed dock covers content | Measured spacer + safe-area inset + screenshot of longest panels |
| `dvh` support variation | `vh`/min-height fallback and real Chromium checks |
| UI-only state accidentally persisted | Keep outside controller; assert storage payload equality |
| Landscape becomes unusable | Compact breakpoint and minimum map/panel constraints |

## Security considerations

- No new user-controlled HTML or storage field.
- Toggle state uses fixed enum values/classes, not arbitrary attribute injection.
- Continue sanitizing corrupt storage through existing controller/browser-storage path.

## Next steps

Proceed to [Phase 05](./phase-05-states-accessibility-polish.md) after mobile viewport matrix and resume smoke pass.
