---
date: 2026-07-18
type: planning-journal
status: completed
project: mln222-quiz
---

# Lập kế hoạch làm mới UI Sử Việt hiện đại

## Context

Người dùng yêu cầu cải thiện toàn bộ UI theo phương án hệ thống thiết kế chung và tái cấu trúc vừa. Website hiện có ba chế độ học, game Công thành 34 tỉnh, 504 câu hỏi và production artifact chạy offline bằng `file://`.

## What happened

- Audit `template.html`, game CSS/UI modules, SVG, build pipeline, tests và screenshot desktop/mobile hiện có.
- Xác định vấn đề chính: hierarchy phẳng, app identity yếu, game giống admin UI, map dài/hẹp và island bounds làm fit khó, mobile thiếu action focus.
- So sánh facelift, targeted redesign và framework rewrite; chốt targeted redesign.
- Ghi báo cáo thiết kế đã duyệt.
- Tạo kế hoạch 56 giờ, sáu phase và hai visual checkpoints.
- Validate frontmatter, effort, dependency, required sections, local links và whitespace.

## Reflection

Giữ JavaScript module hiện tại là lựa chọn đúng. Engine/controller đã có ownership rõ; viết lại framework chỉ chuyển rủi ro sang migration. Hai phần khó nhất không phải màu sắc mà là map presentation giữ đủ đảo và mobile bottom sheet không phá touch/focus.

## Decisions

- Không đổi engine, balance, save schema hoặc question bank.
- Không thêm framework, CDN hoặc request mạng.
- System font mặc định; font local chỉ qua size/license gate.
- Lucide subset nhúng inline sau license verification.
- Map fit bằng primary bounds; đảo dùng inset đồng bộ state.
- Mobile sheet dùng collapsed/expanded button; drag chỉ là enhancement.
- Resource delta chỉ đọc event payload, không tính lại economy.
- Release chạy đủ automated regression, simulations và browser viewport/state matrix.

## Next

Bắt đầu Phase 01 từ [plan](../../plans/260718-1223-modern-vietnamese-ui-redesign/plan.md): capture baseline, khóa design tokens/app shell và dừng ở visual checkpoint trước khi redesign study modes.
