# Sổ xử lý lỗi nguồn HCM202

## Nguyên tắc

Tài liệu Markdown là bản chuyển đổi từ PDF và có lỗi OCR/đánh máy. Sổ này chỉ sửa lỗi truyền đạt rõ ràng; không mở rộng phạm vi giáo trình. Nguồn ngoài chỉ dùng để kiểm chứng cách đọc đúng của dữ kiện đã có trong giáo trình.

Trạng thái:

- `verified-correction`: có căn cứ đủ mạnh; được dùng dạng đã sửa.
- `confirmed-error`: chắc chắn là lỗi nhưng không cần đưa chi tiết đó vào câu hỏi.
- `ambiguous-do-not-use`: chưa đủ căn cứ; cấm dùng trong stem, đáp án và distractor.
- `excluded-metadata`: không phải nội dung học thuật.

## Ledger

| Vị trí nguồn | Nguyên văn/lỗi | Xử lý | Trạng thái | Căn cứ |
|---|---|---|---|---|
| Dòng 1–7 | Metadata “bản word”, Studocu | Bỏ khỏi phạm vi | `excluded-metadata` | Không thuộc thân giáo trình |
| Dòng 8919–9272 | Mục lục lặp lại | Không sinh câu từ bản lặp | `excluded-metadata` | Nội dung đã có ở dòng 19–8917 |
| Khoảng dòng 25 | “Đại hội XI ... năm 2021” | Dùng năm 2011 | `verified-correction` | Đại hội XI họp 12–19/01/2011 theo Văn kiện Đảng |
| Khoảng dòng 1463 | `18-6-919` | Dùng 18/06/1919 | `verified-correction` | Hồ sơ chính thức về *Yêu sách của nhân dân An Nam* |
| Khoảng dòng 1555 | `Hội Việt Nam thanh niên Cách mạng` | Chuẩn hóa `Hội Việt Nam Cách mạng Thanh niên` | `verified-correction` | Biên niên tiểu sử của Bảo tàng Hồ Chí Minh dùng tên tổ chức này |
| Khoảng dòng 6237, 6519 | “chủ nghĩa đế quốc vô sản” | Dùng “chủ nghĩa quốc tế vô sản” | `verified-correction` | Ngữ cảnh đoàn kết quốc tế và Biên niên tiểu sử Hồ Chí Minh |
| Khoảng dòng 261, 6911 | `24C/18.6.5` / `24C/18.65` | Chuẩn hóa `24C/18.65`, năm 1987 | `verified-correction` | Hồ sơ khóa họp UNESCO được các nguồn chính thức dẫn lại |
| Dòng 2195 | `LChương`, `HỒ CHISMINH` | “Chương”, “HỒ CHÍ MINH” | `confirmed-error` | Tiêu đề chương và mục lục thống nhất |
| Nhiều vị trí | `Độc lạ`, `thiên liêng`, `dân tọc`, `toán dân`, `lực lương`, `chiến lượt`, `tinh thân`, `nhận loại` | Chuẩn hóa theo ngữ cảnh: độc lập, thiêng liêng, dân tộc, toàn dân, lực lượng, chiến lược, tinh thần, nhân loại | `confirmed-error` | Cùng thuật ngữ xuất hiện đúng ở phần khác |
| Khoảng dòng 1375 | Chuỗi `6tnj654321` | Bỏ chuỗi rác | `confirmed-error` | Không tạo thành từ/nghĩa trong câu |
| Khoảng dòng 755 | Tên `Đặng Thai Mai` trong phong trào chống thuế | Không hỏi tên này | `ambiguous-do-not-use` | Có dấu hiệu nhầm tên; chưa có bản gốc đủ chắc |
| Khoảng dòng 2897 | Câu bị cụt “giành chính quyền về tay...” | Không dùng đoạn cụt làm evidence | `ambiguous-do-not-use` | Thiếu phần kết trong bản chuyển đổi |
| Phần văn hóa Chương 6 | Danh sách nhảy từ mục 3 sang 5 | Không hỏi số thứ tự/mục bị thiếu | `ambiguous-do-not-use` | Có khả năng mất mục khi chuyển đổi |
| Phần 1945 | Mốc “Lời kêu gọi Tổng khởi nghĩa ngày 18-8-1945” | Không hỏi ngày này nếu chưa đối chiếu bản gốc | `ambiguous-do-not-use` | Mốc cần xác minh văn kiện gốc |
| Phần chống tiêu cực | Các sắc lệnh ngày 26-1-1946 và 27-11-1946 | Không hỏi số/ngày khi chưa kiểm chứng văn bản | `ambiguous-do-not-use` | Không đủ chú thích trong Markdown |

## Nguồn kiểm chứng

- [Nghị quyết Đại hội XI — Tư liệu Văn kiện Đảng](https://tulieuvankien.dangcongsan.vn/ban-chap-hanh-trung-uong-dang/dai-hoi-dang/lan-thu-xi/nghi-quyet-dai-hoi-dai-bieu-toan-quoc-lan-thu-xi-dang-cong-san-viet-nam-1524?categoryId=104000019): Đại hội họp từ 12 đến 19/01/2011.
- [Hồ sơ mật thám Pháp về Nguyễn Ái Quốc — Cổng thông tin Hồ Chí Minh](https://hochiminh.vn/ho-chi-minh-va-the-gioi/ban-be-quoc-te-voi-ho-chi-minh/he-lo-ho-so-mat-tham-phap-ve-nha-bao-nguyen-ai-quoc-12523): *Yêu sách của nhân dân An Nam* được gửi ngày 18/06/1919.
- [Nguyễn Ái Quốc sáng lập Hội Việt Nam Cách mạng Thanh niên — Bảo tàng Hồ Chí Minh](https://baotanghochiminh.vn/nguyen-ai-quoc-sang-lap-hoi-viet-nam-cach-mang-thanh-nien.htm): xác nhận tên chuẩn của tổ chức.
- [Biên niên tiểu sử — Bảo tàng Hồ Chí Minh](https://baotanghochiminh.vn/bien-nien-tieu-su/p-229.htm): dùng thuật ngữ “chủ nghĩa quốc tế vô sản”.
- [Hồ Chí Minh tăng cường đoàn kết quốc tế](https://english.hochiminh.vn/ho-chi-minh-and-the-world/president-ho-chi-minh-enhances-international-solidarity-522): dẫn Nghị quyết `24C/18.65` của khóa họp UNESCO thứ 24.

## Quy tắc cho tác giả và reviewer

- Không dùng lỗi OCR làm distractor nếu người học có thể hiểu đó chỉ là lỗi chính tả.
- Không sao chép nguyên văn đoạn bị ngắt dòng; nối theo cú pháp nhưng giữ nguyên ý.
- Nếu một dữ kiện mới bị nghi ngờ, thêm vào ledger trước khi viết câu liên quan.
- Nếu không thể xác minh, bỏ learning objective chi tiết đó và dùng luận điểm khái quát đã rõ trong cùng mục.
- Mọi thay đổi trạng thái `ambiguous-do-not-use` cần ghi căn cứ và được reviewer độc lập xác nhận.
