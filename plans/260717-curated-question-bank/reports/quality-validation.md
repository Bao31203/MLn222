# Báo cáo kiểm định ngân hàng câu hỏi MLN222

## Kết quả

- Ngân hàng chính: `questions.json`.
- Tổng số: 300 câu, đủ 6 chương.
- Mức độ: 120 Nhận biết, 120 Thông hiểu, 60 Vận dụng.
- Mỗi câu có 4 phương án, một đáp án, giải thích, trang PDF và slide bổ trợ khi phù hợp.
- Kết quả validator: 0 lỗi, 0 cảnh báo.

| Chương | Số câu | Nhận biết | Thông hiểu | Vận dụng | Đáp án A/B/C/D |
|---:|---:|---:|---:|---:|---:|
| 1 | 30 | 12 | 12 | 6 | 8/8/7/7 |
| 2 | 55 | 22 | 22 | 11 | 14/14/14/13 |
| 3 | 65 | 26 | 26 | 13 | 17/16/16/16 |
| 4 | 50 | 20 | 20 | 10 | 13/13/12/12 |
| 5 | 50 | 20 | 20 | 10 | 13/13/12/12 |
| 6 | 50 | 20 | 20 | 10 | 13/13/12/12 |

## Quy trình kiểm định

1. Mỗi chương được biên soạn từ toàn bộ dải trang PDF tương ứng và file slide đầy đủ.
2. Người biên soạn tự kiểm đáp án, phép tính, phương án nhiễu và dẫn nguồn.
3. Một người khác đọc phản biện 100% câu, đối chiếu lại PDF và slide.
4. Các file chương được hợp nhất bằng `compose_questions.py`; chỉ bản vượt validator mới được thay `questions.json`.
5. `validate_questions.py` kiểm tra schema chặt, kiểu JSON lồng nhau, ID, số câu, tên chương, nguồn, trang, slide, đáp án, HTML rác, trùng lặp, dấu cắt nội dung và phân bố đáp án.

## Điều chỉnh sau phản biện

- Cân lại phương án ở Chương 2 để giảm dấu hiệu đáp án đúng dài hơn rõ rệt.
- Thay các câu trùng ý ở Chương 3 và Chương 4 bằng tình huống vận dụng hoặc nội dung còn thiếu.
- Sửa các dẫn trang chưa chính xác và làm rõ các cặp khái niệm dễ lẫn.
- Loại dẫn chiếu slide cho nhận định kinh tế tư nhân là “động lực quan trọng nhất”; giáo trình chỉ xác định đây là “một động lực quan trọng”.
- Cân lại phương án dài/ngắn ở Chương 6 và loại các nhiễu không cùng phạm trù.

## Kết luận

Ngân hàng đạt tiêu chí nội dung và dữ liệu để đóng gói vào website. Giáo trình PDF được dùng làm nguồn chuẩn khi slide rút gọn hoặc diễn đạt vượt quá giáo trình.
