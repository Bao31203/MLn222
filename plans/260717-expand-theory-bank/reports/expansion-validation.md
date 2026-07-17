# Báo cáo mở rộng lý thuyết MLN222

## Phạm vi

- Ngân hàng trước mở rộng: 300 câu.
- Câu mới: 204 câu, chia đều 34 câu cho mỗi chương.
- Ngân hàng sau mở rộng: 504 câu.
- Nguồn chuẩn: giáo trình PDF trong `F:\MLN222`; slide chỉ dùng khi hỗ trợ trực tiếp.

## Phân bố sau mở rộng

| Chương | Tổng câu | Câu mới | Nhận biết | Thông hiểu | Vận dụng | A/B/C/D toàn chương |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 64 | 34 | 26 | 26 | 12 | 16/16/16/16 |
| 2 | 89 | 34 | 36 | 36 | 17 | 23/22/22/22 |
| 3 | 99 | 34 | 40 | 40 | 19 | 25/25/25/24 |
| 4 | 84 | 34 | 34 | 34 | 16 | 21/21/21/21 |
| 5 | 84 | 34 | 34 | 34 | 16 | 21/21/21/21 |
| 6 | 84 | 34 | 34 | 34 | 16 | 21/21/21/21 |

Toàn ngân hàng có 204 câu Nhận biết, 204 câu Thông hiểu và 96 câu Vận dụng.

## Độ phủ mới

- 204 câu mới sử dụng 204 nhãn chủ đề riêng.
- Các câu mới dẫn 141 trang PDF khác nhau trên toàn bộ sáu chương.
- Dạng câu mới: 81 khái niệm, 44 phân biệt, 43 quan hệ và 36 tình huống vận dụng.
- Không bổ sung câu tính toán; lần mở rộng này tập trung vào lý thuyết, quan hệ và khả năng phân biệt khái niệm.

Các lớp nội dung được mở rộng gồm lịch sử học thuyết và phương pháp; các quy luật và chủ thể thị trường; tuần hoàn, tích lũy và hình thức biểu hiện của giá trị thặng dư; độc quyền và độc quyền nhà nước; sở hữu, thể chế và quan hệ lợi ích; công nghiệp hóa, kinh tế tri thức và rủi ro hội nhập.

## Kiểm định nội dung

1. Mỗi chương do một người đọc toàn bộ câu cũ, PDF và slide trước khi nối thêm 34 câu.
2. Một người khác phản biện 100% câu mới của chương đó.
3. Vòng phản biện đã thay hoặc viết lại các câu trùng mục tiêu, câu chỉ tình huống hóa kiến thức cũ, nhiễu khác phạm trù và đáp án dài nổi bật.
4. Đã sửa các dẫn trang/slide chưa trực tiếp và loại một câu có hai đáp án cùng đúng.
5. Đã xáo vị trí đáp án bằng chuỗi bất quy tắc nhưng vẫn giữ phân bố A/B/C/D cân bằng; validator phát hiện và chặn chu kỳ ngắn lặp lại.
6. Với từng chương, trong 34 câu mới có không quá 9 đáp án đúng dài nhất hoặc ngắn nhất duy nhất, không quá 12 đáp án đúng dài nhất/ngắn nhất kể cả đồng hạng; chênh lệch tuyệt đối giữa độ dài trung bình đúng và nhiễu không quá 4 ký tự.
7. Kiểm tra metadata cuối đã đồng bộ chủ đề của `C02-Q083` với nội dung “Hàng hóa cá nhân”.
8. Sau phản biện, validator toàn ngân hàng trả 0 lỗi và 0 cảnh báo.

## Artifact

- `content/chapters/chapter-01.json` đến `chapter-06.json`: nguồn biên soạn theo chương.
- `questions.json`: ngân hàng sản xuất 504 câu.
- `index.html`: website độc lập đã nhúng đủ 504 câu.
- `parse_report.txt`: báo cáo validator gần nhất.
