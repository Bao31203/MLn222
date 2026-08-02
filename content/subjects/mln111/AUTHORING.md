# Chuẩn biên soạn ngân hàng câu hỏi MLN111

## Mục tiêu

- Tổng số: 380 câu trắc nghiệm, bao phủ ba chương của học phần.
- Phân bổ: Chương 1 có 70 câu, Chương 2 có 150 câu, Chương 3 có 160 câu.
- Mức độ toàn ngân hàng: 152 Nhận biết, 152 Thông hiểu, 76 Vận dụng (40% / 40% / 20%).
- Mỗi câu kiểm tra một mục tiêu học tập, có đúng bốn lựa chọn và một đáp án đúng.

## Nguồn và thứ tự sử dụng

1. `F:\MLN111\markdown\Giáo trình Triết học Mác-Lênin.md`: nguồn học thuật chính để kiểm chứng khái niệm, quan hệ và đáp án.
2. `F:\MLN111\markdown\Triet hoc Mac-Lenin. Mot tom tat rat ngan gon. MKĐ-BQH.md`: khung ba chương và bản tóm lược để xác định phạm vi học phần hiện tại.
3. `F:\MLN111\markdown\On tap Triet hoc Mac - Lenin 2023.md`: nguồn xác định trọng tâm ôn tập và các cặp khái niệm dễ nhầm.
4. `F:\MLN111\markdown\Cửu âm chân kinh. 350 câu Trh Mác.md`: nguồn tham khảo cách hỏi và phương án nhiễu; không dùng làm căn cứ duy nhất vì chỉ nhận diện được 334 câu (329 câu bắt đầu bằng nhãn chuẩn và 5 câu bị bọc markup), có câu thiếu và nhiều cấu trúc không đạt chuẩn mới.

Khi nguồn tóm tắt và giáo trình khác mức độ chi tiết, dùng giáo trình để xác định nội dung đúng, nhưng chỉ hỏi phần nằm trong khung ba chương hiện hành. Loại câu nếu không xác định được một đáp án duy nhất từ nguồn.

## Schema câu hỏi

```json
{
  "id": "MLN111-C02-Q001",
  "courseId": "mln111",
  "chapter": "Chương 2 · Chủ nghĩa duy vật biện chứng",
  "chapterNum": 2,
  "topic": "Định nghĩa vật chất của V.I. Lênin",
  "difficulty": "Thông hiểu",
  "kind": "thong_hieu_phan_biet",
  "stem": "Câu hỏi hoàn chỉnh?",
  "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
  "answer": 1,
  "explanation": "Giải thích ngắn gọn đáp án và điểm dễ nhầm.",
  "source": {
    "file": "Triet hoc Mac-Lenin. Mot tom tat rat ngan gon. MKĐ-BQH.md",
    "section": "Chương 2 > I. Vật chất và ý thức > 1.c",
    "text": "Mệnh đề trong nguồn được diễn giải đủ để kiểm chứng đáp án."
  }
}
```

`kind` dùng một trong bốn giá trị phù hợp với môn này:

- `nhan_biet_khai_niem`
- `thong_hieu_phan_biet`
- `trinh_tu_quan_he`
- `van_dung_tinh_huong`

## Ma trận số lượng

| Chương | Tổng | Nhận biết | Thông hiểu | Vận dụng | Đáp án A/B/C/D |
|---|---:|---:|---:|---:|---:|
| 1 | 70 | 28 | 28 | 14 | 18/18/17/17 |
| 2 | 150 | 60 | 60 | 30 | 38/38/37/37 |
| 3 | 160 | 64 | 64 | 32 | 40/40/40/40 |
| **Tổng** | **380** | **152** | **152** | **76** | **96/96/94/94** |

Vị trí đáp án được cân bằng trong từng chương, không chỉ trên toàn ngân hàng.
Phân bố cân bằng không được tạo thành chu kỳ đoán được (như A–B–C–D lặp lại), dãy lặp ngắn hoặc chuỗi cùng vị trí quá dài; validator phải kiểm tra cả phân bố lẫn mẫu tuần tự.

## Ma trận kiến thức

### Chương 1

- Nguồn gốc, khái niệm, đối tượng và sự biến đổi đối tượng triết học.
- Thế giới quan, cấu trúc, hình thức, vai trò và vị trí hạt nhân của triết học.
- Hai mặt của vấn đề cơ bản; duy vật, duy tâm, khả tri, bất khả tri.
- Phương pháp biện chứng, phương pháp siêu hình và các hình thức phép biện chứng.
- Điều kiện kinh tế - xã hội, nguồn gốc lý luận, tiền đề khoa học tự nhiên và nhân tố chủ quan của sự ra đời triết học Mác.
- Các thời kỳ Mác – Ăngghen; vai trò và các thời kỳ phát triển của V.I. Lênin.
- Thực chất cuộc cách mạng triết học; khái niệm, đối tượng, chức năng và vai trò của triết học Mác – Lênin.

### Chương 2

- Quan niệm vật chất trước Mác, cách mạng khoa học tự nhiên và định nghĩa vật chất của V.I. Lênin.
- Vận động, đứng im, không gian, thời gian và tính thống nhất vật chất của thế giới.
- Nguồn gốc, bản chất, kết cấu ý thức; quan hệ biện chứng giữa vật chất và ý thức.
- Biện chứng khách quan, biện chứng chủ quan và phép biện chứng duy vật.
- Nguyên lý mối liên hệ phổ biến; nguyên lý phát triển; quan điểm toàn diện, phát triển, lịch sử - cụ thể.
- Sáu cặp phạm trù: riêng/chung; nguyên nhân/kết quả; nội dung/hình thức; bản chất/hiện tượng; tất nhiên/ngẫu nhiên; khả năng/hiện thực.
- Ba quy luật: lượng - chất; thống nhất và đấu tranh của các mặt đối lập; phủ định của phủ định.
- Bản chất nhận thức; thực tiễn và vai trò của thực tiễn; cảm tính/lý tính; chân lý và các tính chất.

### Chương 3

- Sản xuất vật chất; phương thức sản xuất; lực lượng sản xuất và quan hệ sản xuất.
- Quy luật quan hệ sản xuất phù hợp với trình độ lực lượng sản xuất.
- Cơ sở hạ tầng, kiến trúc thượng tầng và quan hệ biện chứng.
- Hình thái kinh tế - xã hội và tiến trình lịch sử - tự nhiên.
- Giai cấp, đấu tranh giai cấp; dân tộc; quan hệ giai cấp - dân tộc - nhân loại.
- Nguồn gốc, bản chất, đặc trưng, chức năng, kiểu và hình thức nhà nước.
- Nguồn gốc, bản chất, lực lượng, động lực, điều kiện, thời cơ và phương pháp cách mạng xã hội.
- Tồn tại xã hội, ý thức xã hội, kết cấu, hình thái và tính độc lập tương đối của ý thức xã hội.
- Con người và bản chất con người; tha hóa và giải phóng; cá nhân - xã hội; quần chúng - lãnh tụ; con người trong sự nghiệp cách mạng Việt Nam.

## Tiêu chuẩn chất lượng

- Không dùng “Tất cả các phương án trên”, “Cả A và B”, câu mẹo hoặc phủ định kép.
- Chỉ dùng câu phủ định khi thực sự cần và viết hoa từ `KHÔNG`.
- Bốn phương án phải cùng phạm trù, song song về ngữ pháp và tương đối cân bằng độ dài.
- Phương án nhiễu phải là nhầm lẫn hợp lý trong cùng chủ đề, không lấy khái niệm ngẫu nhiên ở phần khác.
- Câu Vận dụng phải có tình huống đủ dữ kiện; không đòi hỏi kiến thức thời sự ngoài tài liệu.
- Giải thích phải tự đủ, nói rõ vì sao đáp án đúng và làm rõ điểm dễ nhầm khi cần.
- `source.section` phải định vị được nội dung; `source.text` là diễn giải ngắn, không sao chép đoạn dài.
- Phản biện từng câu bằng cách thử chứng minh mỗi phương án nhiễu cũng đúng; sửa hoặc loại nếu có hơn một đáp án hợp lý.
