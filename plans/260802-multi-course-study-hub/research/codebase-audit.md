# Khảo sát codebase cho website đa môn

## Hiện trạng

- Repo là SPA HTML tĩnh, không có React/Next, backend hoặc API.
- `template.html` chứa toàn bộ app shell, giao diện và logic học tập.
- Python hợp nhất và kiểm định câu hỏi, sau đó nhúng câu hỏi, bài giảng và game vào một `index.html` tự chứa.
- Vercel phục vụ static root; video MLN112 dùng YouTube Unlisted.
- Baseline khảo sát: 41/41 Python tests và 141/141 Node tests đạt.

## Luồng dữ liệu hiện tại

```text
content/chapters/*.json
  -> compose_questions.py
  -> questions.json
  -> validate_questions.py
  -> build_html.py + template.html + lectures + game assets
  -> index.html
```

Các composer, validator, builder, nhãn giao diện, localStorage và game đều đang gắn cứng với một môn, sáu chương và 504 câu.

## Hạn chế khi thêm môn

- ID dạng `C01-Q001` đụng nhau giữa các môn.
- Tiến độ lưu ở khóa `mln222.*`, không có namespace theo môn.
- Lecture liên kết với chương bằng chuỗi hiển thị `chapterValue`, dễ vỡ khi đổi tên.
- Game đọc trực tiếp global question bank hiện tại và đã được cân bằng theo ngân hàng MLN112.
- Validator hard-code số chương, số câu, nguồn và phân bố của môn hiện tại.
- Một `index.html` chứa thêm nhiều ngân hàng sẽ tăng nhanh kích thước tải đầu.

## Kiến trúc tối thiểu đề xuất

1. Giữ pipeline static, chưa đổi framework.
2. Thêm subject registry cho `mln111`, `mln112`, `mln131`, `hcm201`, `vnr201`.
3. Tổ chức nội dung theo `content/subjects/<subjectId>/...`.
4. Mỗi môn có metadata, question bank, lecture catalog và feature flags riêng.
5. Namespace tiến độ MLN111 riêng; giữ nguyên ba khóa legacy của MLN112 trong lần phát hành đầu để tránh migration không cần thiết.
6. Dùng `chapterId` ổn định cho quiz và bài giảng.
7. Tách validator thành schema chung và profile từng môn.
8. Giữ `Công thành` chỉ cho môn hiện tại trong giai đoạn đầu.
9. Ba môn chưa có dữ liệu dùng trạng thái `comingSoon`, không tạo bộ lọc hoặc phiên học rỗng.

## Quyết định tương thích

- Không sửa trực tiếp `index.html`; luôn sinh lại từ source.
- Không đổi ID câu hoặc storage key MLN112 trong lần tích hợp đầu để bảo toàn tiến độ cũ.
- Dùng cặp `(subjectId, questionId)` làm định danh logic toàn hệ thống.
- Public label được khóa theo yêu cầu hiện tại là `MLN112`; triển khai phải quét đầu ra để `MLN122`/`MLN222` chỉ còn trong alias, global và storage tương thích nội bộ.
- Đo kích thước/gzip sau khi nhúng MLN111. Chỉ chuyển sang tải JSON theo môn nếu ngân sách tải đầu bị vượt.
