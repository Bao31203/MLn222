# Chuẩn biên soạn ngân hàng câu hỏi VNR202

## Mục tiêu và nguồn

- Tổng số: 850 câu trắc nghiệm, bao phủ phần Nhập môn, ba chương lịch sử và phần Kết luận của học phần Lịch sử Đảng Cộng sản Việt Nam.
- Nguồn học thuật duy nhất: `gt-lich-su-dang-csvn-ban-tuyen-giao-tw.md`.
- Snapshot nguồn: SHA-256 `a686d4395752bf70302dff62cbf1502187f19ebcd1e9406a9a402e97b76799bc`, 831.134 byte, 9.916 dòng logic, kiểm tra ngày 2026-08-02.
- Tài liệu: *Giáo trình Lịch sử Đảng Cộng sản Việt Nam*, dùng trong các trường đại học hệ không chuyên lý luận chính trị, Ban Tuyên giáo Trung ương và Bộ Giáo dục và Đào tạo, Hà Nội, tháng 6-2019.
- Không dùng bìa lặp, số trang rời, form-feed, chú thích thư mục, câu hỏi ôn tập lặp, số liệu vụn hoặc đoạn OCR mơ hồ làm kiến thức kiểm tra.
- Mọi lỗi chuyển đổi phải xử lý theo [ERRATA.md](./ERRATA.md); không tự khôi phục dữ kiện còn nghi vấn bằng trí nhớ hoặc nguồn ngoài.

## Ma trận bắt buộc

| Đơn vị | Tổng | Nhận biết | Thông hiểu | Vận dụng | A/B/C/D |
|---|---:|---:|---:|---:|---:|
| 1. Nhập môn | 63 | 25 | 25 | 13 | 16/16/16/15 |
| 2. Đảng ra đời và giành chính quyền, 1930–1945 | 120 | 48 | 48 | 24 | 30/30/30/30 |
| 3. Kháng chiến, giải phóng và thống nhất, 1945–1975 | 220 | 88 | 88 | 44 | 55/55/55/55 |
| 4. Quá độ lên chủ nghĩa xã hội và đổi mới, 1975–2018 | 400 | 160 | 160 | 80 | 100/100/100/100 |
| 5. Kết luận và bài học lớn | 47 | 19 | 19 | 9 | 12/12/11/12 |
| **Tổng** | **850** | **340** | **340** | **170** | **213/213/212/212** |

Vị trí đáp án phải đạt quota nhưng không tạo chu kỳ đoán được. Một vị trí không lặp quá ba câu liên tiếp; cấm chu kỳ độ dài 2–4 lặp ba lần.

## Schema authored

```json
{
  "id": "VNR202-C03-Q001",
  "courseId": "vnr202",
  "chapter": "Đảng lãnh đạo hai cuộc kháng chiến, hoàn thành giải phóng và thống nhất đất nước (1945–1975)",
  "chapterNum": 3,
  "topic": "Đường lối kháng chiến toàn quốc",
  "difficulty": "Thông hiểu",
  "kind": "trinh_tu_quan_he",
  "stem": "Câu hỏi hoàn chỉnh?",
  "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
  "answer": 1,
  "explanation": "Căn cứ đúng và điểm dễ nhầm.",
  "source": {
    "file": "gt-lich-su-dang-csvn-ban-tuyen-giao-tw.md",
    "section": "Chương 2 > I.2 Đường lối kháng chiến toàn quốc",
    "text": "Diễn giải ngắn bằng chứng trực tiếp trong giáo trình."
  }
}
```

Exact fields không gồm `num` hoặc `chapterId`; compiler sinh hai trường đó từ profile. `chapter` phải trùng tiêu đề chuẩn trong profile.

Các `kind` được phép: `nhan_biet_khai_niem`, `thong_hieu_phan_biet`, `trinh_tu_quan_he`, `van_dung_tinh_huong`.

## Chuẩn chất lượng

- Mỗi câu đo một learning objective, có đúng bốn lựa chọn cùng phạm trù và chỉ một đáp án bảo vệ được.
- Distractor là near-miss có nghĩa: thiếu điều kiện, sai chủ thể/phạm vi/thời điểm, đảo quan hệ hoặc sai trình tự; không dùng phương án vô nghĩa hay cực đoan để đủ bốn lựa chọn.
- Không dùng “tất cả các phương án”, “cả A và B”, phủ định kép hoặc dấu ba chấm cắt nội dung. Nếu hỏi phủ định, viết hoa `KHÔNG`.
- Explanation phải nêu căn cứ và tháo gỡ nhầm lẫn chính; citation đến mục lá nhỏ nhất có thể.
- Câu Vận dụng chỉ yêu cầu suy luận từ nguyên tắc, tiến trình hoặc quan hệ đã có trong giáo trình; không đòi hỏi kiến thức thời sự và không biến mô tả bạo lực lịch sử thành chỉ dẫn hiện đại.
- Các cụm “hiện nay”, “đến nay” và số liệu đương thời phải được đóng khung theo giáo trình tháng 6-2019 hoặc đúng mốc đại hội/sự kiện được mô tả.
- Chuỗi public dùng UTF-8 NFC, không chứa form-feed, ký tự điều khiển/bidi, HTML, URL, email hoặc đường dẫn máy cục bộ.
- Trong mỗi chương, đáp án đúng dài duy nhất hoặc ngắn duy nhất không vượt 45%; mọi cửa sổ 20 câu không vượt 14 tín hiệu cực trị; độ dài trung bình đáp án đúng không lệch quá khoảng 15% so với distractor.
- Nếu đáp án đúng không có cue tuyệt đối, không để từ hai distractor trở lên dùng cue như `chỉ`, `mọi`, `toàn bộ`, `hoàn toàn`, `không cần`, `tự động`, `duy nhất`, `bất kỳ`, `thay thế`, `phủ nhận`, `tuyệt đối`, `không bao giờ`.

## Review và readiness

- Tác giả không tự duyệt phần mình viết. Reviewer đọc 100% stem, options, answer, explanation và citation, đồng thời thử bảo vệ từng distractor.
- Mọi finding Critical/High/Medium phải đóng trước sign-off; sau sửa phải chạy lại validator toàn bank và red-team pattern.
- `reviewStatus: approved` chỉ dùng khi đủ năm review độc lập, hash ngân hàng và từng file chương khớp sign-off.
- Bất kỳ thay đổi nội dung nào sau sign-off đều làm chữ ký cũ mất hiệu lực.
