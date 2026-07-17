# Báo cáo kiểm thử đầu cuối MLN222

## Kiểm tra tự động

- `python -m py_compile`: PASS cho toàn bộ script Python.
- `node --check`: PASS cho JavaScript trong template.
- `python -m unittest -v test_pipeline.py`: PASS 19/19.
- `python compose_questions.py`: PASS, 300 câu, 0 lỗi, 0 cảnh báo.
- `python build_html.py`: PASS, tạo `index.html` độc lập.
- Môi trường Windows dùng code page 1252: lệnh compose kết thúc mã 0, không còn lỗi `UnicodeEncodeError`.

## Kiểm thử trình duyệt

Đã chạy bằng Playwright với Chrome ở desktop `1440x900` và mobile `390x844`.

- Luyện thi: chọn sai/đúng, phản hồi, giải thích và nguồn hiển thị đúng.
- Bộ lọc chương + mức độ, đánh dấu, “Hay sai” và reset hoạt động đúng.
- Câu cuối thực hiện “Làm lại từ đầu” và đặt lại điểm phiên.
- Flashcard công bố đáp án qua vùng live, hiện giải thích/nguồn và chuyển câu đúng.
- Tìm kiếm không dấu `hang hoa` trả kết quả có dấu.
- Phương án đã khóa rời khỏi thứ tự tab; sau khi trả lời, focus chuyển tới phản hồi.
- Số kết quả tìm kiếm được công bố qua vùng status riêng.
- `localStorage` chứa JSON hỏng hoặc bị chặn không làm ứng dụng lỗi; tiến độ chuyển sang bộ nhớ tạm.
- Đã quét đủ 300/300 câu ở trạng thái hiện đáp án trên mobile; không có tràn ngang hoặc control bị cắt chữ.
- Không ghi nhận lỗi JavaScript trong console.

## Kiểm tra trực quan

- Ảnh desktop: `ui-desktop.png`.
- Ảnh mobile: `ui-mobile.png`.
- Không phát hiện chồng lấp, nội dung trắng, sai khung hoặc thanh cuộn ngang.
- Độ tương phản chữ trắng trên nút chủ đạo là `6.01:1`; viền control so với nền đạt từ `3.26:1`.

## Kết luận

Bản `index.html` đáp ứng các luồng học chính và có thể mở trực tiếp mà không cần máy chủ.
