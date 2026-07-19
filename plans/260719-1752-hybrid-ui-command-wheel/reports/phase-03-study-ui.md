# Phase 03 - Study UI

Ngày: 2026-07-19  
Trạng thái: **PASS**

## Phạm vi

Ba chế độ Luyện thi, Flashcard và Tìm kiếm được chuyển sang workspace sáng, ưu tiên khả năng đọc. Logic câu hỏi, thống kê, đánh dấu, bộ lọc, storage key và ngân hàng 504 câu được giữ nguyên.

## Kết quả

- Luyện thi có session strip ổn định, question frame rõ thứ bậc và trạng thái chọn/đúng/sai bằng màu, biểu tượng và nội dung chữ.
- Flashcard tách thao tác lật thẻ khỏi chấm điểm; câu trả lời, giải thích và nguồn không làm dịch chuyển thanh điều hướng.
- Tìm kiếm dùng DOM node an toàn, nhóm kết quả theo chương và giữ trạng thái rỗng/query/results rõ ràng.
- Mobile dùng disclosure cho bộ lọc, luôn hiển thị tóm tắt bộ lọc đang áp dụng và giữ câu hỏi trong viewport đầu.
- `chapter` và `difficulty` được dựng bằng `Option`/`replaceChildren`; nội dung nguồn và highlight không dùng HTML động từ dữ liệu câu hỏi.

## Evidence

| Trạng thái | Evidence |
|---|---|
| Flashcard đã lật, 1440x900 | [ảnh](./phase-03-flashcard-revealed-1440x900.png) |
| Tìm kiếm có kết quả, 1440x900 | [ảnh](./phase-03-search-results-1440x900.png) |
| Bộ lọc mobile mở, 390x844 | [ảnh](./phase-03-mobile-filters-390x844.png) |
| App shell desktop | [ảnh](./phase-02-study-shell-1440x900.png) |
| App shell mobile | [ảnh](./phase-02-study-shell-390x844.png) |

## Verification

- Search không dấu `gia tri thang du`: 106 kết quả, 80 hàng đầu được render theo giới hạn UI.
- Không có cuộn ngang tại 1440x900, 390x844 và 360x800.
- Mode switch giữ state học hiện tại và campaign đang mở.
- Python source/artifact contracts: 35/35 pass.
- Production bank: 504 câu, 0 lỗi, 0 cảnh báo.

