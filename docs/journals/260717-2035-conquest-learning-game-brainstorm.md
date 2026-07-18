---
date: 2026-07-17
session: conquest-learning-game-brainstorm
status: completed
---

# Journal: Chốt thiết kế game Công thành học tập

## Context

Người dùng muốn bổ sung vào website MLN222 một chế độ học qua game công thành chiếm đất. Chế độ dùng bản đồ 34 tỉnh/thành do chính người dùng sở hữu, có kinh tế, dân số, quân đội, ngoại giao, NPC, chiến tranh nhiều lượt và quiz 10 câu cuối lượt.

## What happened

- Khảo sát website MLN222 hiện tại, pipeline HTML tĩnh, dữ liệu 504 câu và cơ chế lưu `localStorage`.
- Khảo sát bản đồ nguồn: SVG có định danh tỉnh rõ ràng, gồm 34 đơn vị hành chính và các nhóm đảo trực thuộc.
- Tách yêu cầu thành bản đồ, kinh tế, dân số, ngoại giao, AI, chiến đấu và tích hợp quiz.
- Đánh giá ba hướng mô phỏng và chọn mô hình lai.
- Chốt chiến dịch 45-60 lượt và trận đánh kéo dài qua nhiều lượt chiến lược.
- Xây dựng công thức dân số đạt đỉnh tăng trưởng ở mức 40% sức chứa.
- Xây dựng mô hình tổn thất có giới hạn, sĩ khí, tiếp tế và mệt mỏi để trận cân sức kéo dài 5-7 lượt.
- Chốt phạm vi MVP và tiêu chí mô phỏng trước khi hoàn thiện UI.

## Reflection

Rủi ro lớn nhất không nằm ở việc hiển thị bản đồ mà ở cân bằng tương tác giữa tăng dân số, huy động quân, duy trì và tốc độ chiếm đất. Việc giữ engine thuần dữ liệu và chạy mô phỏng trước UI là điều kiện cần để tránh sửa giao diện quanh một vòng chơi chưa ổn định.

Quiz 10 câu mỗi lượt phù hợp với ngân hàng 504 câu cho một chiến dịch khoảng 50 lượt, nhưng bắt buộc phải lưu liên tục để người học có thể chia chiến dịch thành nhiều phiên.

## Decisions

| Quyết định | Lý do | Tác động |
|---|---|---|
| Dùng mô hình lai | Đủ chiều sâu nhưng không vi mô 34 kho tài nguyên | Tiền và lương thực toàn cục; dân số và đồn trú theo tỉnh |
| Trận chiến kéo dài qua lượt chiến lược | Tạo cơ hội tiếp viện, rút quân và chịu chi phí chiến tranh | Mục tiêu 5-7 lượt khi cân sức |
| Giới hạn tổn thất trực tiếp 15% | Tránh xóa sổ một lượt | Chiến thắng chủ yếu qua bào mòn, sĩ khí và tiếp tế |
| Không trừ quân hoặc giết dân trực tiếp do sai quiz | Tránh vòng xoáy thua và liên hệ phản giáo dục | Hình phạt tập trung vào kho và năng suất có giới hạn |
| Giữ HTML tĩnh | Phù hợp ứng dụng hiện tại và cách mở `file://` | Cần đóng gói SVG, engine và dữ liệu vào bản build |
| Mô phỏng trước UI | Hệ số ban đầu chưa được chứng minh | Cần hàng nghìn trận và chiến dịch AI-only |

## Next

- Tạo kế hoạch triển khai chi tiết khi người dùng yêu cầu.
- Bắt đầu kế hoạch bằng schema dữ liệu, engine thuần và vertical slice.
- Chưa triển khai hoặc sửa mã nguồn game trong phiên brainstorm này.
