# Chuẩn biên soạn ngân hàng câu hỏi MLN131

## Phạm vi và nguồn

- Mục tiêu: 280 câu trắc nghiệm bốn lựa chọn, bao phủ bảy chương của học phần Chủ nghĩa xã hội khoa học.
- Nguồn chuẩn duy nhất: `giao-trinh-chu-nghia-xa-hoi-khoa-hoc-2021.md`.
- Snapshot nguồn: SHA-256 `1379d246e3466b5451752e31279c50081b85894296c3feea873fa68fd66c6ee8`, 521.726 byte, 10.959 dòng.
- Nội dung học thuật trên trang tên sách ghi Hà Nội – 2019. Tên file có hậu tố `2021` không được dùng để suy diễn năm xuất bản.
- Mục lục, lời nói đầu, mục tiêu chương, câu hỏi ôn tập, tài liệu tham khảo, số trang, watermark Studocu, email và URL không được dùng làm kiến thức kiểm tra.

## Ma trận bắt buộc

| Chương | Tổng | Nhận biết | Thông hiểu | Vận dụng | A/B/C/D |
|---|---:|---:|---:|---:|---:|
| 1 | 35 | 14 | 14 | 7 | 9/9/9/8 |
| 2 | 45 | 18 | 18 | 9 | 11/11/11/12 |
| 3 | 45 | 18 | 18 | 9 | 11/11/12/11 |
| 4 | 40 | 16 | 16 | 8 | 10/10/10/10 |
| 5 | 35 | 14 | 14 | 7 | 9/9/8/9 |
| 6 | 45 | 18 | 18 | 9 | 12/11/11/11 |
| 7 | 35 | 14 | 14 | 7 | 8/9/9/9 |
| **Tổng** | **280** | **112** | **112** | **56** | **70/70/70/70** |

## Quy tắc nội dung

- Mỗi câu đo một learning objective, có đúng một đáp án và citation đến mục nhỏ nhất có thể.
- `source.file` chỉ chứa basename; `source.section` không chứa đường dẫn máy hoặc URL.
- Nội dung mang tính thời điểm phải mở đầu bằng “Theo giáo trình” hoặc ghi rõ ngữ cảnh của giáo trình biên soạn năm 2019.
- Không hỏi trực tiếp các số liệu thời điểm ở những đoạn có lỗi OCR hoặc mốc không nhất quán.
- Trạng thái phát hành là `ready`. Sign-off `approved` ngày 2026-08-03 phải tiếp tục khớp canonical bank hash; mọi thay đổi vào câu hỏi cần review và ký lại trước khi phát hành.

## Schema authored

Mỗi file chương là JSON array. Compiler bổ sung `chapterId` và `num`; object authored gồm `id`, `courseId`, `chapter`, `chapterNum`, `topic`, `difficulty`, `kind`, `stem`, `options`, `answer`, `explanation`, `source`.
