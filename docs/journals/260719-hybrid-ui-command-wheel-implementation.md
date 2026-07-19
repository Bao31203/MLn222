---
date: 2026-07-19
type: implementation-journal
status: completed
project: mln222-quiz
plan: ../../plans/260719-1752-hybrid-ui-command-wheel/plan.md
---

# Triển khai hybrid UI và vòng lệnh Công thành

## Context

Triển khai phương án đã duyệt: không gian học sáng, game tối dạng tactical workspace và thao tác chuột phải với thế lực khác theo interaction pattern của OpenFront. Engine, dữ liệu, save schema, 504 câu hỏi và single-file offline artifact phải giữ nguyên.

## What changed

- Chuyển app shell sang desktop left rail/mobile bottom navigation; mode switch đặt `data-mode`, `data-experience` và phát sự kiện đóng UI tạm thời.
- Làm lại Luyện thi, Flashcard và Tìm kiếm theo reading workspace sáng; thêm mobile filter disclosure và loại dynamic `innerHTML` khỏi select/source rendering.
- Mở rộng map workspace, giảm nhiễu màu/đường biên và vẽ tuyến lệnh MOVE/TRADE/WARN_ATTACK/REINFORCE không bắt pointer.
- Thêm pure `context-action-model`, command wheel bốn nhóm và contextual action sheet. Enabled action chỉ lấy từ legal set của controller; destructive/state-changing action cần chọn cụ thể rồi xác nhận.
- Thêm right-click, keyboard context key, arrow navigation, focus restoration, visible touch action và long press 520ms.
- Thêm order tray và `removePendingAction(index)` có revalidation; province/diplomacy panels dùng chung action descriptors.
- Sửa layout mobile/tablet thành flex viewport owner và xử lý landscape thấp để map không tràn vào bottom navigation.

## Decisions

- Wheel chỉ là bộ điều hướng capability; sheet mới chứa exact action. UI không tự suy luận gameplay legality.
- Disabled group vẫn thao tác được để giải thích lý do, nhưng không tạo action giả và confirm luôn khóa khi không có exact option.
- Context menu, sheet và presentation state không serialize. Pending orders tiếp tục dùng UI sidecar hiện có.
- Không dùng source hoặc asset OpenFront; chỉ áp dụng interaction pattern.
- Production vẫn chạy từ `file://`, không thêm framework, CDN, backend hoặc runtime network.

## Verification

- Question validator: 504 câu, 0 lỗi, 0 cảnh báo.
- Game data: 34 tỉnh, 6 vùng, 44 SVG groups, 58 cạnh, 5 binh chủng.
- Node: 137/137 pass; Python: 35/35 pass.
- Context open/close 50 chu kỳ, keyboard parity, long press, staged action parity và full touch turn pass.
- Browser matrix 1440x900, 820x900, 390x844, 360x800 và 844x390 pass; console/page error và horizontal overflow bằng 0.
- Hai build cuối byte-identical: SHA-256 `A41326FFEC7C113FC06219DBC1867276AC814FDD0D433D28A84F6D6DD02C43E5`, kích thước 1.795.979 byte.

## Residual risk

Chưa có pixel-diff CI; native long press hiện được xác nhận bằng touch emulation. Các rủi ro này không ảnh hưởng legality, save integrity hoặc offline artifact.

## Evidence

- [Kế hoạch hoàn tất](../../plans/260719-1752-hybrid-ui-command-wheel/plan.md)
- [Báo cáo kiểm thử đầu cuối](../../plans/260719-1752-hybrid-ui-command-wheel/reports/end-to-end-testing.md)
- [Báo cáo Study UI](../../plans/260719-1752-hybrid-ui-command-wheel/reports/phase-03-study-ui.md)
