---
title: "Lập kế hoạch đại tu UI và vòng lệnh"
date: 2026-07-19
type: planning-journal
status: completed
plan: "plans/260719-1752-hybrid-ui-command-wheel/plan.md"
---

# Lập kế hoạch đại tu UI và vòng lệnh

## Context

Người dùng chốt hướng hai không gian: study sáng, game tối; đồng thời yêu cầu thao tác chuột phải với thế lực khác tương tự OpenFront.

## What happened

- Khảo sát app shell, study modes, game panels, map pointer handling và legal action flow hiện có.
- Nghiên cứu radial menu OpenFront qua help content và ảnh tham chiếu chính thức.
- Chọn hybrid interaction: radial menu bốn nhóm + contextual action sheet.
- Tạo báo cáo thiết kế và kế hoạch 9 phase, tổng effort 84h.
- Red-team 10 findings; áp dụng 9, loại đề xuất chuyển framework.
- Validation xác nhận không còn quyết định bắt buộc chưa chốt.

## Decisions

- Study light theme; game dark tactical theme.
- Desktop nav rail; mobile bottom navigation.
- Right-click foreign province mở wheel; mobile có nút `Hành động` hữu hình.
- Wheel chỉ điều hướng nhóm; action thay đổi state cần action sheet/xác nhận.
- Exact enabled options/payload chỉ đến từ `controller.legalActions()`.
- Context UI state không serialize; engine/data/save schema giữ nguyên.
- Không sao chép code hoặc asset OpenFront.

## Reflection

Điểm dễ sai nhất không phải hình học radial menu mà là disabled-state logic. Khi legal set rỗng, UI không được dựng action giả để giải thích. Capability catalog chỉ nên giữ group-level discoverability; controller vẫn là gate duy nhất cho exact actions.

## Next

Triển khai tuần tự từ P1. Dừng tại visual checkpoint P2/P3/P4/P5/P7 nếu hướng thị giác hoặc interaction chưa đạt, thay vì tiếp tục tích lũy CSS và markup debt.
