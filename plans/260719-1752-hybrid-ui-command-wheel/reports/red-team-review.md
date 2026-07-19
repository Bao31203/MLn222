---
title: "Red team review - Hybrid UI command wheel"
date: 2026-07-19
type: plan-review
status: completed
---

# Red team review - Hybrid UI command wheel

## Summary

- Findings: 10
- Severity: 1 Critical, 6 High, 3 Medium
- Disposition: 9 Accept, 1 Reject
- Lenses: security, failure modes, assumptions, scope/complexity

## Findings

| # | Finding | Severity | Disposition | Applied to |
|---:|---|---|---|---|
| 1 | Disabled action detail không thể lấy từ legal set rỗng | Critical | Accept | P5 |
| 2 | Thiếu gating setup/quiz/outcome cho context menu | High | Accept | P5 |
| 3 | Menu có thể stale sau pan/zoom/resize/snapshot update | High | Accept | P5 |
| 4 | Radial menu không có fallback renderer | High | Accept | P5 |
| 5 | Chưa khóa wheel geometry và hit area | High | Accept | P5, P7 |
| 6 | Rebuild/module order có thể nạp sai dependency | High | Accept | P5, P9 |
| 7 | Scope 84h thiếu rollback checkpoint | High | Accept | plan.md |
| 8 | Visual QA phụ thuộc screenshot thủ công | Medium | Accept | P1, P9 |
| 9 | Đại tu map có thể làm mất cải tiến liền khối hiện có | Medium | Accept | P1, P4 |
| 10 | Cần đưa toàn bộ UI sang framework để quản lý state | Medium | Reject | - |

## Adjudication

### 1. Disabled action detail không thể lấy từ legal set rỗng

`controller.legalActions()` trả `[]` khi hết AP hoặc ngoài action phase. Nếu UI tự dựng source/target/cost bị khóa, nó sẽ tái triển khai rules. Chấp nhận: capability catalog chỉ giữ bốn nhóm cố định và reason cấp nhóm; exact option/payload chỉ render từ legal set.

### 2. Thiếu gating setup/quiz/outcome

Context menu phải vô hiệu khi setup, quiz modal, campaign outcome hoặc target không hợp lệ. Chấp nhận và thêm state matrix.

### 3. Stale menu

Map transform hoặc snapshot đổi sau khi menu mở có thể làm anchor/action cũ. Chấp nhận: đóng hoặc recompute menu khi zoom/pan/resize/mode/snapshot làm target/action đổi; recompute trước confirmation.

### 4. Không có fallback renderer

Clip-path/SVG geometry hoặc browser zoom có thể làm radial khó dùng. Chấp nhận: cùng view model có list-menu fallback, dùng cho unsupported/reduced-complexity states và làm đường kiểm thử.

### 5. Wheel geometry

Không có kích thước cụ thể nên sector có thể nhỏ hơn 44px. Chấp nhận: desktop diameter 208-224px, ring thickness/hitbox đảm bảo tối thiểu 52px; mobile dùng palette target 48px+.

### 6. Module order

Hai module mới có thể được nhúng sau consumer. Chấp nhận: manifest dependency order, module registration assertion và production artifact smoke.

### 7. Rollback checkpoint

Scope lớn, nếu P5 không đạt usability thì P6-P9 bị khóa. Chấp nhận: phase checkpoint, source tests, rebuild và commit/restore point; fallback list menu là minimum shippable interaction.

### 8. Visual QA thủ công

Screenshot không bắt hitbox/overflow. Chấp nhận: thêm browser geometry assertions, interaction coordinates, control-size checks và screenshot evidence; chưa thêm pixel-diff CI vì YAGNI.

### 9. Bảo toàn map hiện có

P4 có thể vô tình quay lại inset/crop hoặc đổi path data. Chấp nhận: freeze full viewBox, 44 groups, 34 targets, inline islands và 3-unit border contract từ baseline.

### 10. Chuyển framework

Reject. Static modules hiện có đủ để cô lập state; migration framework tăng bundle, dependency và regression mà không giải quyết trực tiếp UX.

## Recommendation

Proceed sau khi các thay đổi accepted được truyền vào plan/phases. Không còn blocker kiến trúc.
