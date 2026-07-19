---
date: 2026-07-18
type: implementation-journal
status: completed
project: mln222-quiz
plan: ../../plans/260718-1223-modern-vietnamese-ui-redesign/plan.md
---

# Triển khai UI Sử Việt hiện đại

## Context

Triển khai phương án 2 đã duyệt cho website MLN222: dùng một hệ thống thiết kế chung, làm mới ba chế độ học và tái cấu trúc workspace Công thành. Các ràng buộc giữ nguyên là 504 câu hỏi, engine và balance hiện có, save schema, 34 tỉnh, khả năng chạy trực tiếp bằng `file://` và một production artifact nội tuyến.

## What changed

- Xây app shell chung, token màu/chữ/trạng thái và sprite 32 biểu tượng Lucide/Feather có attribution nội tuyến.
- Làm mới Luyện thi, Flashcard và Tìm kiếm với DOM rendering an toàn, trạng thái đáp án rõ, thống kê ổn định và điều hướng mobile.
- Tái cấu trúc Công thành thành map-first workspace: HUD tài nguyên, panel tỉnh/ngoại giao/chiến đấu/báo cáo, action dock và bản đồ có zoom/fit/focus. Bản đồ mở ở 110%, zoom 100-300% bằng nút, con lăn, bàn phím hoặc pinch.
- Giữ 44 nhóm SVG và 34 keyboard target trong toàn bộ `viewBox` của nguồn; đất liền dùng biên đồng mảnh, Hoàng Sa/Trường Sa trở về vị trí địa lý gốc và nền trống đồng WebP được nhúng offline.
- Thêm bottom sheet mobile, resource disclosure, safe-area dock và xử lý viewport landscape/virtual keyboard.
- Hoàn thiện battle meter, timeline theo payload, quiz cuối lượt có focus trap/review/result, reward/penalty banner và reduced motion.
- Bổ sung regression contract cho layout, accessibility, offline asset và generated build; cập nhật README và báo cáo kiểm thử.

## Decisions

- Presentation state của sheet/resource chỉ nằm trong UI, không đi vào campaign save.
- UI chỉ hiển thị resource delta từ event engine, không tính lại economy hoặc combat.
- Bản đồ dùng nguyên `viewBox 0 0 3129.7 4901.01`; trạng thái sở hữu chỉ đổi màu fill/viền, không tách hình học tỉnh khỏi khối bản đồ.
- Không thêm framework, CDN, backend hoặc runtime network request.
- Các sửa lỗi responsive được xác nhận tại 1440x900, 1024x768, 390x844, 360x800, 844x390 và chiều cao bàn phím 390x500.

## Verification

- Question validator: 504 câu, 0 lỗi, 0 cảnh báo.
- Game data validator: 34 tỉnh, 6 vùng, 44 nhóm SVG, 58 cạnh.
- Node: 133/133 pass; Python: 35/35 pass.
- Economy 100.000 transitions và combat 10.000 runs pass toàn bộ invariant.
- Campaign 1.000 runs pass: standard win rate 83,83%, median thắng lượt 52, p95 turn 66,20ms, không invalid action/invariant failure.
- Hai build cuối byte-identical: SHA-256 `34FF996E78B151F39B3DAB84D77303C854200A107E154C877505C4F63D74FADB`, kích thước 1.737.687 bytes.
- Final `file://` smoke và offline reload không có console/page error, external request hoặc horizontal overflow.

## Residual risk

Browser QA hiện là workflow smoke và screenshot evidence, chưa có pixel-diff CI. Campaign simulation đầy đủ mất khoảng 37 phút 45 giây nên phù hợp release gate hơn là vòng lặp phát triển ngắn.

## Evidence

- [Kế hoạch hoàn tất](../../plans/260718-1223-modern-vietnamese-ui-redesign/plan.md)
- [Báo cáo đầu cuối](../../plans/260718-1223-modern-vietnamese-ui-redesign/reports/end-to-end-testing.md)
- [Simulation chiến dịch](../../plans/260718-1223-modern-vietnamese-ui-redesign/reports/campaign-simulation-1000.stdout.json)
