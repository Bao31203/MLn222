# Errata nguồn VNR202

Nguồn khóa: `gt-lich-su-dang-csvn-ban-tuyen-giao-tw.md`, SHA-256 `a686d4395752bf70302dff62cbf1502187f19ebcd1e9406a9a402e97b76799bc`.

## Quy tắc xử lý

- File nguồn không ở Unicode NFC; mọi chuỗi authored phải được chuẩn hóa NFC nhưng không làm đổi nghĩa.
- Loại toàn bộ 220 số trang độc lập, ký tự form-feed, dòng trắng, bìa lặp, chú thích thư mục và danh mục tài liệu tham khảo khỏi corpus kiểm tra.
- Dòng logic dùng cách đếm `splitlines()` của inventory; PowerShell mặc định có thể lệch vì không tách form-feed.
- `verified-correction` chỉ áp dụng cho lỗi chính tả/ngữ pháp có bằng chứng nội bộ rõ. `ambiguous-do-not-use` tuyệt đối không được dùng làm đáp án, stem hoặc evidence public.

## Nhóm lỗi đã xác nhận

Các lỗi OCR rõ, chỉ được dùng sau khi chuẩn hóa theo văn cảnh: `tình bày`→`trình bày`, `sấu sắc`→`sâu sắc`, `vị trị`→`vị trí`, `khủng khoảng`→`khủng hoảng`, `tổ cức`→`tổ chức`, `truyên truyền`→`tuyên truyền`, `Cánh mạng`→`Cách mạng`, `xây dưng`→`xây dựng`, `đầu đủ`→`đầy đủ`, `cơ chế chị trường`→`cơ chế thị trường`, `Đại đã thông qua`→`Đại hội đã thông qua`, `thực hiên`→`thực hiện`, `Quan diểm`→`Quan điểm`, `thẩm quyển`→`thẩm quyền`.

Các lỗi lặp/tách chữ rõ như `với với`, `phải phải`, `đã đã`, `toàn quốc toàn quốc`, `công công`, `của của`, từ bị tách qua dòng và ký tự `Ð` được chuẩn hóa khi authoring; không trích nguyên văn chuỗi hỏng.

## Ambiguous — không sử dụng

- Tên riêng/phiên âm nước ngoài không ổn định hoặc vỡ OCR, gồm các biến thể ở vùng Nguyễn Ái Quốc, kế hoạch quân sự Pháp–Mỹ và quan hệ quốc tế.
- Mâu thuẫn/chuỗi hỏng đã phát hiện: `Võ Nhai`/`Vũ Nhai`; `Hiệp nghị Geneve`/`Hiệp định`; năm `991`; mốc `204` cạnh mục tiêu 2045; kế hoạch `2016–2021` cạnh `2016–2020`; tháng 4-2001 cạnh sự kiện 11-9-2001; các cụm bị cắt giữa câu tại ranh giới chương và lát đọc.
- Dữ kiện có dấu hiệu sai chú thích hoặc sai khóa hội nghị, gồm các vùng quanh dòng logic 7319, 8006/8031, 8321–8327 và 8421/8440.
- Các đoạn mất từ làm đổi nghĩa, lời trích không đóng ngoặc, số chú thích lạc chuỗi và mọi câu không thể khôi phục duy nhất từ nội bộ nguồn.

## Nội dung không dùng để tạo câu

- Số lượng đại biểu, số báo, danh sách nhà tù/địa danh/cơ sở, tên ấn bản, tập, trang, số chú thích và thống kê vi mô nếu không quyết định bản chất chủ trương hoặc tiến trình.
- Câu hỏi ôn tập cuối chương và đoạn tổng kết lặp chỉ dùng làm checklist độ phủ, không sao chép thành câu mới.
- Danh mục tài liệu tham khảo cuối file và footnote bị chen vào danh mục.
- Số liệu hoặc phát biểu “hiện nay/đến nay” không được trình bày như thông tin cập nhật năm 2026; nếu thật sự cần, phải ghi rõ mốc của giáo trình tháng 6-2019.
