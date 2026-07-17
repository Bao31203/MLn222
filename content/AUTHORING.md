# Chuẩn biên soạn ngân hàng câu hỏi MLN222

## Nguồn và thứ tự ưu tiên

1. Nguồn chuẩn: `F:\MLN222\GIAO-TRINH-KINH-TE-CHINH-TRI-MAC-LENIN-BO-GIAO-DUC-VA-DAO-TAO.pdf`.
2. Nguồn bổ trợ: bài giảng `F:\MLN222\*.pptx.txt` tương ứng với từng chương.
3. Khi hai nguồn khác nhau, dùng giáo trình để xác định đáp án; slide chỉ xác định trọng tâm và ví dụ.
4. Câu hỏi ôn tập cuối chương là checklist độ bao phủ, không phải nội dung để sao chép nguyên văn.

## Schema file chương

Mỗi file chương là một mảng JSON. Mỗi phần tử có đúng cấu trúc sau:

```json
{
  "id": "C02-Q001",
  "chapter": "Chương 2 · Slot 2: Hàng hóa, thị trường và các chủ thể tham gia thị trường",
  "chapterNum": 2,
  "topic": "Hai thuộc tính của hàng hóa",
  "difficulty": "Thông hiểu",
  "kind": "thong_hieu_phan_biet",
  "stem": "Câu hỏi hoàn chỉnh?",
  "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
  "answer": 1,
  "explanation": "Giải thích vì sao phương án đúng, đồng thời làm rõ điểm dễ nhầm khi cần.",
  "source": {
    "file": "GIAO-TRINH-KINH-TE-CHINH-TRI-MAC-LENIN-BO-GIAO-DUC-VA-DAO-TAO.pdf",
    "page": 35,
    "text": "Tóm lược mệnh đề trong nguồn trực tiếp chứng minh đáp án.",
    "slide": {
      "file": "MLN122. Slot 2. Hàng hoá và Thị trường.pptx.txt",
      "number": 5
    }
  }
}
```

`source.slide` là trường tùy chọn. `num` được gán tự động khi hợp nhất, không viết trong file chương.

## Giá trị hợp lệ

- `difficulty`: `Nhận biết`, `Thông hiểu`, `Vận dụng`.
- `kind`: `nhan_biet_khai_niem`, `thong_hieu_phan_biet`, `trinh_tu_quan_he`, `van_dung_tinh_huong`, `van_dung_tinh_toan`.
- `answer`: số nguyên từ 0 đến 3.
- `id`: `C<chương hai chữ số>-Q<số thứ tự ba chữ số>`.

## Tiêu chuẩn nội dung

- Một câu chỉ kiểm tra một mục tiêu học tập và chỉ có một đáp án đúng.
- Dùng bốn phương án cùng phạm trù, cấu trúc ngữ pháp song song và độ dài tương đối cân bằng.
- Phương án nhiễu xuất phát từ nhầm lẫn hợp lý trong cùng chủ đề, không lấy ngẫu nhiên từ chương khác.
- Không dùng `Tất cả các phương án trên`, `Cả A và B`, câu mẹo, phủ định kép hoặc dấu ba chấm để cắt nội dung.
- Câu phủ định chỉ dùng khi thực sự cần; viết hoa từ `KHÔNG`.
- Không để đáp án lộ qua độ dài, thuật ngữ lặp lại hoặc mức độ chi tiết vượt trội.
- Câu tính toán phải đủ dữ kiện, đơn vị và có phép giải trong `explanation`.
- `source.page` là số trang in trên PDF. `source.text` tóm lược đúng ý, không thêm kiến thức ngoài nguồn.
- Đọc phản biện từng câu: thử chứng minh từng phương án nhiễu cũng đúng; nếu có thể thì sửa hoặc loại câu.

## Phân bổ mục tiêu

- Tổng: 300 câu.
- Chương 1-6: lần lượt 30, 55, 65, 50, 50, 50 câu.
- Toàn bộ ngân hàng: khoảng 40% Nhận biết, 40% Thông hiểu, 20% Vận dụng.
- Vị trí đáp án đúng trong mỗi chương phải gần cân bằng; chênh lệch giữa vị trí nhiều nhất và ít nhất không quá 2 câu.

## Tự kiểm trước khi bàn giao file chương

1. JSON đọc được và đủ đúng số câu.
2. ID liên tục, không trùng.
3. Không trùng thân câu hoặc bốn phương án.
4. Mỗi câu có giải thích và trang nguồn nằm trong phạm vi chương.
5. Mỗi chủ đề cốt lõi có câu Thông hiểu; không chỉ hỏi định nghĩa.
6. Đáp án được đối chiếu lại với trang nguồn sau khi viết xong phương án nhiễu.
