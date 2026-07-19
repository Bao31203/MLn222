# Phase 06: Campaign panels và order tray

## Context links

- [Plan](./plan.md)
- [Phase 05](./phase-05-context-command-wheel.md)

## Overview

- Priority: P1
- Status: Complete
- Effort: 10h
- Mục tiêu: biến panel phải thành inspector theo mục tiêu và làm lệnh đã xếp dễ xem, bỏ, xác nhận.

## Key insights

- Province panel hiện vừa chứa thông tin vừa chứa toàn bộ legal actions, tạo danh sách dài.
- Diplomacy panel tổng hợp mọi faction; context wheel cần view được lọc theo target.
- Pending action tối đa nhỏ nhưng hiện chỉ có `clearOrders`, không bỏ từng lệnh.

## Requirements

- Inspector header luôn nêu tỉnh, owner, relation và trạng thái quân sự.
- Tabs giữ bốn miền: lãnh thổ, ngoại giao, mặt trận, nhật trình; nội dung lọc theo target khi có.
- Context action sheet và panel dùng chung descriptor/formatter, không lặp label/cost logic.
- Order tray hiển thị thứ tự, AP, source-target, chi phí và trạng thái pending.
- Cho bỏ từng lệnh nếu phần còn lại vẫn hợp lệ; không silent cascade.
- End-turn CTA và reward priority luôn thấy trên desktop.
- Battle panel thể hiện own/enemy force, morale, supply, breach, tactics và reinforcement rõ.

## Architecture

- `context-action-model` cung cấp formatter chung cho exact actions.
- Controller thêm `removePendingAction(key/index)` ở UI state layer; candidate còn lại phải qua `validatePending`.
- Panel modules chỉ render snapshot và gọi controller methods.
- Active target/filter là presentation state; không đổi campaign state/schema.

## Related files

- Modify: `C:\Users\pgb31\mln222-quiz\game\ui\game-controller.js`
- Modify: `C:\Users\pgb31\mln222-quiz\game\ui\game-app.js`
- Modify: `C:\Users\pgb31\mln222-quiz\game\ui\province-panel.js`
- Modify: `C:\Users\pgb31\mln222-quiz\game\ui\diplomacy-panel.js`
- Modify: `C:\Users\pgb31\mln222-quiz\game\ui\battle-panel.js`
- Modify: `C:\Users\pgb31\mln222-quiz\game\ui\turn-report.js`
- Modify: `C:\Users\pgb31\mln222-quiz\game\ui\ui-utils.js`
- Modify: `C:\Users\pgb31\mln222-quiz\game\styles\game.css`
- Modify: `C:\Users\pgb31\mln222-quiz\template.html`
- Modify: `C:\Users\pgb31\mln222-quiz\tests\game\ui-controller.test.cjs`
- Generate: `C:\Users\pgb31\mln222-quiz\index.html`

## Implementation steps

1. Xác định inspector information hierarchy cho own/neutral/ally/enemy province.
2. Tách action formatter dùng chung khỏi panel-specific render.
3. Lọc diplomacy/treaty/trade content theo target faction nhưng giữ global overview route.
4. Làm battle cards gọn, tập trung decision controls và disabled reasons.
5. Xây order tray từ `snapshot.pendingActions` và action descriptors.
6. Thêm controller method bỏ một pending action; validate candidate và save sidecar.
7. Hiển thị dependency error nếu không thể bỏ lệnh mà không làm lệnh sau vô hiệu.
8. Tổ chức fixed action dock với reward priority, clear all và end turn.
9. Test stage/remove/clear/save/resume và stale target transitions.

## Todo

- [x] Inspector thay đổi đúng theo target relation.
- [x] Panel không lặp full legal-action list sau khi có context sheet.
- [x] Order tray bỏ từng lệnh an toàn.
- [x] Battle/diplomacy/report tabs có badge và empty state rõ.
- [x] End-turn CTA không bị panel content đẩy khỏi viewport.

## Success criteria

- Người chơi thấy được lệnh đã xếp và AP còn lại trong một lần quét.
- Remove action không tạo pending sequence invalid.
- Save/reload giữ pending orders đúng như trước.
- Desktop không có nested scroll khó điều khiển; chỉ panel content cuộn độc lập khi cần.

## Risk assessment

- Bỏ lệnh đầu có thể làm lệnh sau phụ thuộc mất hợp lệ. Revalidate toàn candidate và từ chối có giải thích.
- Filter theo target có thể che incoming proposal khác. Badge/global overview vẫn đưa đường truy cập.

## Security considerations

- Render report/action text qua safe DOM utilities.
- Không tin action payload từ DOM; controller nhận clone từ legal descriptor và validate.

## Next steps

Mở P7 sau desktop campaign workflow pass bằng mouse và keyboard.
