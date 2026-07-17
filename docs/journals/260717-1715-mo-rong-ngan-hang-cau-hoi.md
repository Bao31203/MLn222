---
date: 2026-07-17
session: mo-rong-ngan-hang-cau-hoi-mln222
status: completed
---

# Journal: 2026-07-17 - Mở rộng ngân hàng câu hỏi MLN222

## Context

Mở rộng bộ câu hỏi triết học MLN222 để bao quát lý thuyết đồng đều hơn giữa sáu chương, đồng thời giữ chất lượng dữ liệu và trải nghiệm làm bài ổn định.

## What happened

- Bổ sung 204 câu mới, phân bổ 34 câu cho mỗi chương; tổng ngân hàng đạt 504 câu.
- Tổ chức phản biện chéo giữa các chương để giảm trùng lặp, sửa câu mơ hồ và tăng độ chính xác của nguồn dẫn.
- Cân bằng vị trí đáp án đúng và độ dài các phương án nhằm hạn chế dấu hiệu đoán đáp án.
- Validator hoàn tất với 0 lỗi, 0 cảnh báo; bộ kiểm thử đạt 28/28 sau khi thêm kiểm tra thiên lệch độ dài hai chiều, chu kỳ đáp án và hardening JSON nhúng.
- Kiểm tra trên trình duyệt đạt 504/504 trạng thái câu hỏi, không ghi nhận lỗi hiển thị hoặc tương tác.

## Reflection

Việc mở rộng theo hạn ngạch từng chương giúp độ phủ lý thuyết rõ ràng hơn. Phản biện chéo và kiểm tra thiên lệch đáp án tạo thêm một lớp kiểm soát cần thiết ngoài việc chỉ xác nhận đúng cấu trúc dữ liệu.

## Decisions

| Quyết định | Lý do | Tác động |
|---|---|---|
| Thêm đúng 34 câu cho mỗi chương | Giữ phân bổ phần mở rộng đồng đều | Tăng 204 câu và đưa tổng số lên 504 |
| Kiểm soát vị trí và độ dài đáp án | Giảm khả năng suy đoán bằng mẫu hình | Bộ câu hỏi công bằng và đáng tin cậy hơn |
| Chỉ chấp nhận sau phản biện, validator và kiểm thử trình duyệt | Kiểm soát cả nội dung, dữ liệu và giao diện | Có bằng chứng xác nhận 0/0, 28/28 và 504/504 |
| Escape mọi ký tự `<` trong JSON nhúng | Tránh chuỗi dữ liệu làm thay đổi trạng thái parser HTML | Website vẫn khởi tạo an toàn với nội dung bất thường |

## Next

- Theo dõi phản hồi khi học để phát hiện câu còn khó hiểu hoặc chưa phân hóa tốt.
- Duy trì các cổng kiểm tra hiện tại khi bổ sung hoặc chỉnh sửa câu hỏi sau này.
