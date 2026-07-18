# Phase 02 - Kiểm thử giao diện học tập

Ngày kiểm thử: 2026-07-18  
Artifact: `index.html` mở trực tiếp bằng `file://`

## Kết quả

- Luyện thi giữ nguyên ID/hành vi cũ, bổ sung toolbar có nhãn, bốn thống kê ổn định và vùng review không làm dịch layout lựa chọn.
- Flashcard chỉ lật nội dung; trước và sau khi lật, điểm và số câu đã trả lời vẫn bằng 0.
- Tìm kiếm `giá trị thặng dư` trả 106 kết quả theo thứ tự cố định, render tối đa 80 mục và dùng DOM text node để highlight an toàn.
- Trạng thái rỗng, số kết quả và heading theo chương đều được công bố bằng nội dung nhìn thấy được.
- Không có horizontal overflow tại 1440x900, 720x900, 390x844 và 360x800; mọi button nhìn thấy có kích thước tối thiểu 44px.
- Thanh điều hướng câu hỏi mobile bám đáy viewport nhưng vẫn cho phép cuộn tới toàn bộ bốn đáp án và nội dung review.

## Ảnh kiểm chứng

- [Luyện thi desktop](./phase-02-quiz-1440x900.png)
- [Review desktop](./phase-02-quiz-review-1440x900.png)
- [Flashcard desktop](./phase-02-flashcard-1440x900.png)
- [Tìm kiếm desktop](./phase-02-search-1440x900.png)
- [Luyện thi mobile](./phase-02-quiz-390x844-viewport.png)
- [Bốn lựa chọn mobile](./phase-02-quiz-options-390x844.png)
- [Tìm kiếm mobile](./phase-02-search-390x844.png)

## Kết luận

Phase 02 đạt yêu cầu chức năng, responsive, accessibility cơ bản và an toàn render.
