# Báo cáo kiểm thử đầu cuối ngân hàng 504 câu

## Pipeline

- `python compose_questions.py`: PASS, hợp nhất 504 câu.
- `python build_html.py`: PASS, tạo `index.html` độc lập khoảng 587 KiB theo số ký tự.
- Validator: 0 lỗi, 0 cảnh báo.
- `python -m unittest -v test_pipeline.py`: PASS 28/28.
- JSON nhúng đã escape mọi ký tự `<` và các dấu phân cách dòng JavaScript; test round-trip với chuỗi điều khiển parser HTML đạt.
- Integration test chạy compose/build trong thư mục tạm và so sánh đầu ra byte-for-byte, không ghi đè artifact production.
- Python compile và JavaScript runtime: không có lỗi.

## Trình duyệt

Đã kiểm tra bằng Playwright và kiểm tra lại bản đóng gói cuối bằng `agent-browser`/Chrome ở desktop `1440x900` và mobile `390x844`.

- Tổng hiển thị: 504 câu.
- Bộ lọc chương trả đúng `64/89/99/84/84/84` câu.
- Quiz: chọn sai, phản hồi, giải thích, nguồn, focus và khóa phương án hoạt động đúng.
- Đánh dấu, lọc câu đã đánh dấu, lọc câu hay sai và reset hoạt động đúng.
- Flashcard hiện đáp án, giải thích và live feedback đúng.
- Tìm kiếm không dấu tìm được nội dung lý thuyết mới như `tư bản giả`.
- JSON `localStorage` hỏng không ngăn ứng dụng khởi tạo.
- Đã render trạng thái hiện đáp án của 504/504 câu trên mobile; không có tràn ngang hoặc control bị cắt chữ.
- Không ghi nhận lỗi JavaScript console hoặc page error.

## Ảnh kiểm tra

- `ui-desktop-504.png`
- `ui-mobile-504.png`

## Kết luận

Website có thể mở trực tiếp từ `index.html`, không cần máy chủ, và đã nhúng đúng ngân hàng sản xuất 504 câu.
