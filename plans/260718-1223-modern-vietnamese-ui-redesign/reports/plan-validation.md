---
date: 2026-07-18
type: plan-validation
status: passed
project: mln222-quiz
plan: 260718-1223-modern-vietnamese-ui-redesign
---

# Validation kế hoạch làm mới UI

## Summary

Kế hoạch đủ điều kiện triển khai. Sáu phase có dependency tuần tự, phạm vi file, acceptance criteria và release gates rõ. Không có quyết định sản phẩm còn mở đủ lớn để chặn Phase 01.

## Checks

| Check | Result | Evidence |
|---|---|---|
| Approved direction | Pass | Approach B, Sử Việt hiện đại |
| Plan frontmatter | Pass | `status: pending`, P1, 56h, branch main |
| Phase effort sum | Pass | 8 + 10 + 14 + 10 + 8 + 6 = 56h |
| Dependency graph | Pass | P1 -> P2 -> P3 -> P4 -> P5 -> P6 |
| Local links | Pass | Plan, phase, source and report targets resolve |
| Engine boundary | Pass | Core/engine/quiz/storage/data behavior explicitly excluded |
| Offline boundary | Pass | `file://`, no CDN/network, inline-safety gates |
| Persistence boundary | Pass | Existing keys/schema retained; new sheet state ephemeral |
| Responsive coverage | Pass | 360x800, 390x844, 1024x768, 1440x900 plus landscape smoke |
| Accessibility coverage | Pass | AA, 44px, keyboard, focus, live region, reduced motion |
| Map integrity | Pass | 34 primary targets, 44 groups, ten island groups |
| Release evidence | Pass | Automated suites, simulations, screenshots, console/network, hash |

## Critical questions resolved

### Có cần framework mới không?

Không. UI modules hiện tại đủ ownership; framework migration tăng rủi ro và không tạo giá trị tương xứng.

### Có sửa SVG gốc để phóng bản đồ không?

Ưu tiên không. `map-view.js` đo primary bounds và tạo island inset presentation. Deterministic constants là fallback nếu `getBBox()` không ổn định dưới `file://`.

### Mobile sheet có cần kéo tự do không?

Không trong scope bắt buộc. Collapsed/expanded button bảo đảm keyboard/touch; swipe chỉ là enhancement sau gate.

### Có lưu trạng thái mở sheet/resource không?

Không. Đây là ephemeral presentation state; campaign save và UI sidecar giữ nguyên schema.

### Resource delta lấy từ đâu?

Chỉ từ snapshot/report event đã phát sinh. Không chạy lại công thức kinh tế ở UI.

### Font và icon xử lý offline thế nào?

System font là mặc định. Chỉ nhúng font local sau size/license gate. Icon dùng subset Lucide inline sau license verification.

## Residual risks

| Risk | Severity | Owner phase | Gate |
|---|---|---|---|
| SVG fit/inset khác giữa browser | High | P3 | Browser bounds + 44-group screenshot/test |
| Bottom sheet che action/content | High | P4 | Longest-panel viewport matrix |
| DOM restructure phá selector | High | P1-P3 | ID map + source/browser regression |
| UI tính sai delta | Medium | P3 | Event-payload-only assertion |
| Artifact vượt size budget | Medium | P1/P6 | Measure each asset and final build |
| Manual browser QA khó lặp lại | Medium | P6 | Fixed workflow/state matrix and saved evidence |

## Recommendation

Triển khai tuần tự. Không bỏ hai visual checkpoints. Nếu P3 island inset vượt effort, giữ national fit + một inset tĩnh có state đồng bộ; không sửa province schema hoặc bỏ nhóm đảo để đạt deadline.
