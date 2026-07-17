# MLN222 Quiz

Ứng dụng trắc nghiệm MLN222 dạng HTML tĩnh, hiện đóng gói 300 câu hỏi đã biên soạn theo 6 chương.

## Mở ứng dụng

Mở trực tiếp `index.html` bằng trình duyệt, không cần chạy web server. Trên PowerShell tại thư mục dự án:

```powershell
Start-Process .\index.html
```

`index.html` đã chứa dữ liệu câu hỏi và cung cấp các chế độ Luyện thi, Flashcard và Tìm kiếm.

## Các file chính

- `content/chapters/chapter-01.json` đến `chapter-06.json`: dữ liệu biên soạn theo từng chương.
- `content/AUTHORING.md`: schema và tiêu chuẩn biên soạn câu hỏi.
- `questions.json`: ngân hàng 300 câu được hợp nhất từ các file chương.
- `template.html`: mẫu ứng dụng; `index.html`: bản HTML độc lập đã đóng gói.
- `parse_report.txt`: báo cáo kiểm định gần nhất.
- `compose_questions.py`, `validate_questions.py`, `build_html.py`, `test_pipeline.py`: pipeline hợp nhất, kiểm định, đóng gói và kiểm thử.

## Nguồn nội dung

Nguồn nằm tại `F:\MLN222`:

- Giáo trình chuẩn: `GIAO-TRINH-KINH-TE-CHINH-TRI-MAC-LENIN-BO-GIAO-DUC-VA-DAO-TAO.pdf`.
- Bài giảng bổ trợ: các file `*.pptx.txt` tương ứng với từng slot.

PDF là nguồn chuẩn để xác định đáp án. Khi PDF và slide khác nhau, ưu tiên PDF; slide chỉ dùng để xác định trọng tâm và ví dụ bổ trợ.

## Compose, validate, build và test

Chạy từ thư mục gốc dự án:

```powershell
python compose_questions.py
python validate_questions.py
python build_html.py
python test_pipeline.py
```

- `compose_questions.py` kiểm tra đủ 6 file chương, thêm số thứ tự `num`, hợp nhất và kiểm định trước khi thay `questions.json`.
- `validate_questions.py` kiểm định `questions.json` theo mặc định và ghi kết quả vào `parse_report.txt`; có thể truyền một đường dẫn JSON khác làm đối số.
- `build_html.py` kiểm định dữ liệu rồi chèn `questions.json` vào `template.html` để tạo `index.html` độc lập.
- `test_pipeline.py` chạy kiểm thử hồi quy cho validator, tính đồng nhất giữa file chương và ngân hàng production, cùng bản HTML đã đóng gói.

`parse_questions.py` là trình trích xuất cũ phục vụ khảo sát nguồn; đầu ra `questions.generated-draft.json` không được website production sử dụng.
