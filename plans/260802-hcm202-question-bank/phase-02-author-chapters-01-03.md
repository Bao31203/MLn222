---
title: "Phase 02 - Biên soạn Chương 1–3"
description: "Viết 220 câu cho ba chương đầu theo blueprint và quota đã khóa."
status: completed
priority: P1
effort: 18h
issue: null
branch: main
tags: [content, authoring, hcm202]
created: 2026-08-02
---

# Phase 02: Biên soạn Chương 1–3

## Mục tiêu

Tạo ba file độc lập với tổng 220 câu, bám sát Phase 1. Phase này có thể chạy song song với Phase 3 và không sửa registry/runtime/tests/generated outputs.

## Ownership

| Writer | File duy nhất được sửa | Tổng | Độ khó | A/B/C/D |
|---|---|---:|---:|---:|
| C1 | `content/subjects/hcm202/chapters/chapter-01.json` | 45 | 18/18/9 | 12/11/11/11 |
| C2 | `content/subjects/hcm202/chapters/chapter-02.json` | 75 | 30/30/15 | 18/19/19/19 |
| C3 | `content/subjects/hcm202/chapters/chapter-03.json` | 100 | 40/40/20 | 25/25/25/25 |

Không writer nào sửa file của người khác. Nếu cần thay đổi contract, gửi finding cho contract owner; không tự ý đổi schema/quota.

## Chương 1 · 45 câu

- [x] 9 câu: khái niệm, nội hàm, cơ sở hình thành, bản chất khoa học/cách mạng và ý nghĩa.
- [x] 5 câu: đối tượng môn học, di sản/hoạt động và quá trình hiện thực hóa, vận dụng, phát triển.
- [x] 15 câu: năm quan điểm phương pháp luận; mỗi quan điểm tối thiểu 2 câu và toàn nhóm đủ phân biệt/vận dụng.
- [x] 6 câu: lôgíc, lịch sử, kết hợp hai phương pháp, liên ngành, phân tích/tổng hợp/so sánh/điều tra.
- [x] 10 câu: ba nhóm ý nghĩa học tập; tối thiểu 3 câu tình huống học tập/rèn luyện.
- [x] Không dùng mốc Đại hội XI cho đến khi errata xác nhận năm đúng.

## Chương 2 · 75 câu

- [x] 6 câu thực tiễn Việt Nam, 5 câu thực tiễn thế giới.
- [x] 5 câu truyền thống dân tộc, 5 câu tinh hoa văn hóa nhân loại, 5 câu chủ nghĩa Mác–Lênin.
- [x] 2 câu phẩm chất, 2 câu tài năng hoạt động/tổng kết thực tiễn/phát triển lý luận.
- [x] Năm thời kỳ có quota lần lượt `5/6/8/5/6`; câu trình tự phải phân biệt đúng bước ngoặt, tác phẩm và hoạt động.
- [x] 8 câu giá trị đối với cách mạng Việt Nam, 7 câu giá trị đối với tiến bộ nhân loại.
- [x] Không biến chi tiết tiểu sử ngoài giáo trình thành kiến thức bắt buộc.

## Chương 3 · 100 câu

- [x] Độc lập dân tộc: quyền thiêng liêng 5; tự do/hạnh phúc 5; thật sự/hoàn toàn/triệt để 4; thống nhất/toàn vẹn 4.
- [x] Cách mạng giải phóng: con đường vô sản 4; Đảng lãnh đạo 4; đại đoàn kết 4; chủ động/sáng tạo 3; bạo lực cách mạng 4.
- [x] Chủ nghĩa xã hội: quan niệm 6; tất yếu 5; đặc trưng 6.
- [x] Xây dựng CNXH: mục tiêu 6; động lực 6.
- [x] Thời kỳ quá độ: tính chất/đặc điểm/nhiệm vụ 4; nguyên tắc 4.
- [x] Quan hệ độc lập–CNXH: độc lập là tiền đề 4; CNXH bảo đảm độc lập 4; điều kiện gắn kết 6.
- [x] Vận dụng: bốn hướng, mỗi hướng 3 câu.
- [x] Chuẩn hóa “Độc lạ dân tộc” theo ledger; không đưa lỗi OCR vào distractor gây nhập nhằng.

## Chuẩn viết từng câu

- Stem tự đủ ngữ cảnh, một yêu cầu, không mớm đáp án bằng độ dài/từ khóa.
- Distractor cùng phạm trù, có lý do sai xác định được và không đúng trong diễn giải hợp lý khác.
- Explanation nêu vì sao đáp án đúng và gỡ nhầm chính; không chỉ lặp lại option.
- Câu Nhận biết hỏi khái niệm/luận điểm; Thông hiểu yêu cầu phân biệt/quan hệ; Vận dụng dùng tình huống có đủ dữ kiện.
- `source.section` định vị được mục lá; `source.text` diễn giải tối thiểu 20 ký tự, không chép đoạn dài.
- Chuẩn Unicode NFC, không control/bidi/HTML, không URL/đường dẫn máy trong nội dung câu.

## Kiểm soát ID và đáp án

- C1: `HCM202-C01-Q001`…`Q045`; C2: `HCM202-C02-Q001`…`Q075`; C3: `HCM202-C03-Q001`…`Q100`.
- Phân bố answer đúng target nhưng không dùng chu kỳ A-B-C-D, chu kỳ 2–4 lặp ba lần hoặc run cùng đáp án quá 3.
- Không đổi thứ tự câu chỉ để đạt quota sau review; mọi reorder làm thay đổi canonical bank và phải review lại citation/context.

## Checklist hoàn tất của mỗi writer

- [x] JSON array UTF-8 parse được; exact field schema.
- [x] Đúng số câu, độ khó, answer target và ID liên tục.
- [x] Mọi quota tiểu mục đạt; topic cụ thể, không dùng nhãn chung chung “Tư tưởng Hồ Chí Minh”.
- [x] Không stem/options trùng trong file hoặc trùng rõ với chương khác.
- [x] Mỗi câu đối chiếu nguồn; ghi finding OCR vào ERRATA qua contract owner.
- [x] Tự red-team từng distractor; chưa tự ký review độc lập.
- [x] Chỉ giao patch file sở hữu cùng bảng thống kê.

## Bằng chứng hoàn thành

Ba chương đầu có đúng 220 câu và đã đi qua review/fact-check/sign-off của bank
480 câu ở trạng thái `ready`.

## Lệnh kiểm tra cục bộ

```powershell
Get-ChildItem content/subjects/hcm202/chapters/chapter-0[1-3].json | ForEach-Object { Get-Content -Raw -Encoding utf8 $_.FullName | ConvertFrom-Json | Out-Null }
rg -n 'Tất cả các phương án|Cả A và B|<script|Downloaded by|Studocu' content/subjects/hcm202/chapters/chapter-0[1-3].json
git diff --check -- content/subjects/hcm202/chapters/chapter-01.json content/subjects/hcm202/chapters/chapter-02.json content/subjects/hcm202/chapters/chapter-03.json
```

Sau khi profile được đăng ký ở Phase 4, chạy lại:

```powershell
python compose_questions.py --subject hcm202 --check
python validate_questions.py --subject hcm202 --check
```

## Gate hoàn thành

Ba file có đúng 220 câu, đạt quota chi tiết và tự kiểm tra schema; không có fact chưa xác minh hoặc finding Critical/High chưa chuyển cho Phase 4.
