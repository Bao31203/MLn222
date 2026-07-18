---
date: 2026-07-17
type: plan-red-team
status: completed
result: revised
---

# Red-team review

## Summary

Kế hoạch khả thi nhưng bản đầu có một dependency sai và một file-ownership conflict có thể làm branch đỏ trong nhiều pha. Hai lỗi đã được sửa trước validation.

## Findings

### High: UI hoàn tất trước production campaign

Pha 08 ban đầu chỉ phụ thuộc vertical slice trong khi build manifest, controller và smoke flow cần module campaign/AI production từ pha 07. Dùng mock có thể phát triển UI song song, nhưng không thể đạt acceptance gate production/offline đầy đủ.

Resolution: đổi critical path thành `P6 -> P7 -> P8 -> P9`. Vẫn giữ song song thực sự ở pha 2-5.

### High: Build changes break existing tests until release phase

Pha 08 sửa `template.html` và `build_html.py`, nhưng `test_pipeline.py` ban đầu thuộc pha 09. Các test byte-equality/question-only placeholder hiện tại sẽ fail ngay khi pha 08 bắt đầu.

Resolution: chuyển exclusive ownership `test_pipeline.py` sang pha 08. Pha 09 chỉ chạy lại và ghi bằng chứng, không sửa test theo kết quả.

### Medium: Victory condition chưa đo được

“Chi phối 4/6 vùng” chưa có định nghĩa máy tính.

Resolution: region controlled khi faction giữ hơn 50% weighted territory score của vùng; thắng chuẩn cần 60% toàn quốc và bốn vùng. Defeat cơ sở là zero province.

### Medium: Campaign benchmark dễ overfit

Một benchmark bot và cùng seed cho tuning/evaluation có thể tạo kết quả 45-60 lượt giả.

Resolution: thêm ít nhất ba benchmark policies, nhiều quiz-score profiles và held-out evaluation seeds.

### Medium: Build injection thiếu hai lớp bảo vệ

Kế hoạch chỉ nêu `</script` và SVG active content, chưa chặn `</style` hoặc manifest path traversal.

Resolution: builder phải reject closing style sequence và mọi resolved path nằm ngoài `game/`.

## Remaining risks

- 102 giờ là estimate kỹ thuật, chưa gồm vòng playtest người thật kéo dài nhiều ngày.
- Campaign gate phụ thuộc chất lượng benchmark policies; vẫn cần playtest sau MVP.
- Độ chính xác adjacency 34 tỉnh cần visual review thủ công ngoài automated graph checks.

## Recommendation

Proceed to validation với dependency graph đã sửa. Không triển khai P8 trước khi P7 đạt campaign API và balance gate.
