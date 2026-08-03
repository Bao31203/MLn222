# Tự rà soát ngân hàng MLN131 — 2026-08-02

## Phạm vi và giới hạn

- Người rà soát: chính tác giả ngân hàng; đây **không phải** phản biện độc lập.
- Phạm vi: 280/280 câu, 1.120/1.120 phương án, bảy tệp chương.
- Nguồn: `giao-trinh-chu-nghia-xa-hoi-khoa-hoc-2021.md`, SHA-256 `1379d246e3466b5451752e31279c50081b85894296c3feea873fa68fd66c6ee8`.
- Trạng thái đề nghị: `self-reviewed`, giữ môn ở `draft`, `studyReady: false`, `copyReviewRequired: true`.

## Công việc đã thực hiện

1. Đọc tuần tự toàn bộ phần học thuật của bảy chương; loại metadata Studocu, mục lục lặp, số trang, URL và tài liệu tham khảo khỏi corpus ra câu hỏi.
2. Khóa blueprint trước khi viết: 35 nhóm nội dung, đủ 280 ID, quota chương `35/45/45/40/35/45/35`.
3. Kiểm từng câu trong quá trình biên soạn về tri thức đích, một đáp án bảo vệ được, ba nhiễu sai phạm vi/quan hệ/điều kiện, giải thích và mục nguồn.
4. Quét toàn ngân hàng về schema, NFC, đường dẫn nguồn, ID liên tục, quota độ khó, vị trí đáp án, chuỗi/chu kỳ đáp án, cue tuyệt đối, độ dài, trùng chính xác và stem gần trùng.
5. Chạy validator của skill với `--warnings-as-errors`; kết quả cuối `280 câu · 0 error · 0 warning`.
6. Chạy composer và validator của website; MLN131 có `280 câu · 0 error · 0 warning`, không phát hành runtime vì trạng thái `draft`.

## Kết quả định lượng

| Gate | Kết quả |
|---|---:|
| Số câu theo chương | 35 / 45 / 45 / 40 / 35 / 45 / 35 |
| Độ khó | 112 Nhận biết / 112 Thông hiểu / 56 Vận dụng |
| Vị trí đáp án A/B/C/D | 70 / 70 / 70 / 70 |
| Schema/source/hash errors | 0 |
| Warnings ở chế độ nghiêm | 0 |
| Independent chapter reviews | 0/7 |

## Finding

- Critical: 0 mở.
- High: 0 mở.
- Medium: 0 mở.
- Low: 0 mở.
- Giới hạn quy trình: chưa có người thứ hai đọc lại từng câu và đối chiếu độc lập với nguồn. Vì vậy kết quả này không được nâng lên `approved` và không đủ điều kiện công bố production.

## Kết luận

Ngân hàng đạt gate tự kiểm định kỹ thuật và nội dung của vòng tác giả trên canonical bank SHA-256 `6c1e2272f53912d9b3d1939b143c90f36675c4a673278c187e0cc49a9adcdd73`. Sign-off này mất hiệu lực nếu source, config, blueprint hoặc bất kỳ tệp chương nào thay đổi hash.
