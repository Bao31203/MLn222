---
title: "Phase 01 - Khóa nguồn, blueprint và hợp đồng biên soạn"
description: "Chốt phạm vi sáu chương, quota tiểu mục, schema, provenance và gate xử lý lỗi OCR."
status: completed
priority: P1
effort: 8h
issue: null
branch: main
tags: [research, content, schema, fact-check]
created: 2026-08-02
---

# Phase 01: Khóa nguồn, blueprint và hợp đồng biên soạn

## Mục tiêu

Tạo hợp đồng đủ cụ thể để sáu author viết độc lập mà vẫn ghép thành một bank thống nhất. Chưa đăng ký HCM202 vào registry và chưa làm app thấy bank dở dang.

## Nguồn và phạm vi

- File: `F:\Kỳ 9\Tư tưởng Hồ Chí Minh - HCM202\Giáo trình tư tưởng Hồ Chí Minh.md`.
- Baseline: 444.353 byte trên đĩa, 9.272 dòng, SHA-256 `2df4ae100168afae7bd7830705db466fb1c1a36474576f3cf8e0f2741c1ceec4`.
- Chỉ hỏi nội dung học thuật thuộc sáu chương; bỏ metadata Studocu, quảng bá, mục lục lặp và câu hỏi ôn tập cuối sách nếu không có đáp án trong thân bài.
- Không sao chép cả giáo trình vào repo. `AUTHORING.md` ghi đường dẫn/hashes để truy xuất; artifact public chỉ có citation rút gọn.

## Blueprint quota theo tiểu mục

| Chương 1 · Khái niệm, đối tượng, phương pháp, ý nghĩa | Câu |
|---|---:|
| Khái niệm, nội hàm, cơ sở và ý nghĩa tư tưởng Hồ Chí Minh | 9 |
| Đối tượng nghiên cứu và quá trình vận dụng/phát triển | 5 |
| Phương pháp luận: tính đảng–khoa học; lý luận–thực tiễn; lịch sử–cụ thể; toàn diện–hệ thống; kế thừa–phát triển | 15 |
| Phương pháp lôgíc, lịch sử, liên ngành và các phương pháp cụ thể | 6 |
| Ý nghĩa học tập: tư duy lý luận; đạo đức/niềm tin/lòng yêu nước; phương pháp/phong cách | 10 |
| **Tổng** | **45** |

| Chương 2 · Cơ sở, quá trình hình thành và giá trị | Câu |
|---|---:|
| Thực tiễn Việt Nam; thực tiễn thế giới cuối XIX–đầu XX | 11 |
| Truyền thống dân tộc; tinh hoa văn hóa nhân loại; chủ nghĩa Mác–Lênin | 15 |
| Phẩm chất và năng lực hoạt động/tổng kết thực tiễn của Hồ Chí Minh | 4 |
| Năm thời kỳ: trước 1911; 1911–1920; 1920–1930; 1930–1940; 1941–1969 | 30 |
| Giá trị đối với cách mạng Việt Nam và tiến bộ nhân loại | 15 |
| **Tổng** | **75** |

| Chương 3 · Độc lập dân tộc và chủ nghĩa xã hội | Câu |
|---|---:|
| Bốn nội dung của độc lập dân tộc | 18 |
| Năm luận điểm về cách mạng giải phóng dân tộc | 19 |
| Quan niệm, tính tất yếu, đặc trưng của chủ nghĩa xã hội | 17 |
| Mục tiêu và động lực xây dựng chủ nghĩa xã hội | 12 |
| Thời kỳ quá độ: đặc điểm/nhiệm vụ và nguyên tắc xây dựng | 8 |
| Quan hệ độc lập dân tộc–chủ nghĩa xã hội và các điều kiện bảo đảm | 14 |
| Bốn hướng vận dụng hiện nay | 12 |
| **Tổng** | **100** |

| Chương 4 · Đảng và Nhà nước | Câu |
|---|---:|
| Tính tất yếu, vai trò lãnh đạo của Đảng | 8 |
| Đảng là đạo đức/văn minh; nguyên tắc hoạt động; cán bộ, đảng viên | 35 |
| Nhà nước dân chủ: bản chất giai cấp; của dân, do dân, vì dân | 20 |
| Nhà nước pháp quyền: hợp hiến/hợp pháp, thượng tôn pháp luật, pháp quyền nhân nghĩa | 12 |
| Nhà nước trong sạch: kiểm soát quyền lực, phòng chống tiêu cực | 7 |
| Vận dụng xây dựng Đảng và Nhà nước | 13 |
| **Tổng** | **95** |

| Chương 5 · Đại đoàn kết | Câu |
|---|---:|
| Vai trò/mục tiêu; chủ thể/nền tảng; điều kiện đại đoàn kết | 24 |
| Mặt trận dân tộc thống nhất, nguyên tắc và phương thức xây dựng | 14 |
| Sự cần thiết của đoàn kết quốc tế | 8 |
| Lực lượng, hình thức tổ chức và nguyên tắc đoàn kết quốc tế | 16 |
| Ba hướng vận dụng hiện nay | 13 |
| **Tổng** | **75** |

| Chương 6 · Văn hóa, đạo đức, con người | Câu |
|---|---:|
| Khái niệm văn hóa và quan hệ với chính trị, kinh tế, xã hội | 9 |
| Vai trò văn hóa và xây dựng nền văn hóa mới | 14 |
| Đạo đức là gốc/nền tảng | 6 |
| Bốn chuẩn mực đạo đức cách mạng | 17 |
| Ba nguyên tắc xây dựng đạo đức | 11 |
| Quan niệm, vai trò và xây dựng con người | 17 |
| Vận dụng xây dựng văn hóa/con người và đạo đức hiện nay | 16 |
| **Tổng** | **90** |

## Schema câu hỏi

Exact fields: `id`, `courseId`, `chapter`, `chapterNum`, `topic`, `difficulty`, `kind`, `stem`, `options`, `answer`, `explanation`, `source`.

- ID `^HCM202-C\d{2}-Q\d{3}$`; `courseId` luôn `hcm202`; số thứ tự liên tục trong từng chương.
- `difficulty`: `Nhận biết`, `Thông hiểu`, `Vận dụng`.
- `kind`: `nhan_biet_khai_niem`, `thong_hieu_phan_biet`, `trinh_tu_quan_he`, `van_dung_tinh_huong`.
- Đúng bốn option không trùng, `answer` là integer 0–3, không “tất cả/cả A và B”, không phủ định kép.
- `source.file` đúng basename `Giáo trình tư tưởng Hồ Chí Minh.md`; `section` theo mẫu `Chương N > La Mã > số/chữ + tiêu đề`; `text` là diễn giải ngắn để kiểm chứng.

## Gate errata và fact-check

- Tạo `ERRATA.md` với trạng thái `confirmed-error`, `verified-correction`, `ambiguous-do-not-use` và bằng chứng.
- Lỗi đã biết phải xử lý trước: “Đại hội XI (2021)” → kiểm chứng 2011; `HỒ CHISMINH`; `Độc lạ dân tộc`; `18-6-919`; “chủ nghĩa đế quốc vô sản”; cùng lỗi nối/ngắt từ làm đổi nghĩa.
- Không tự sửa bằng trực giác. Ưu tiên đối chiếu mục lục và đoạn khác trong cùng giáo trình; dữ kiện ngày/tên/văn kiện cần nguồn thẩm quyền. Nếu chưa xác minh được thì cấm dùng làm stem, đáp án hoặc distractor.
- Citation giữ tiêu đề chuẩn hóa nhưng ledger phải ghi nguyên văn OCR, vị trí dòng, cách sửa và căn cứ.

## Checklist

- [x] Ghi baseline worktree và nguồn; xác nhận hash chưa đổi.
- [x] Tạo `AUTHORING.md`, `ERRATA.md` và ma trận quota/difficulty/answer.
- [x] Khóa tên/title sáu chapter và label nguồn.
- [x] Khóa quy tắc viết stem, distractor, explanation, citation và Unicode NFC.
- [x] Khóa rule tránh lặp ý: mỗi câu một learning objective; câu gần giống phải đo khác cấp nhận thức.
- [x] Chỉ định owner/reviewer không trùng nhau.
- [x] Chưa sửa registry/profile/runtime/generated artifact.

## Lệnh kiểm tra

```powershell
Get-FileHash -LiteralPath 'F:\Kỳ 9\Tư tưởng Hồ Chí Minh - HCM202\Giáo trình tư tưởng Hồ Chí Minh.md' -Algorithm SHA256
rg -n -i 'Đại hội.*2021|CHISMINH|Độc lạ|18-6-919|đế quốc vô sản' -- 'F:\Kỳ 9\Tư tưởng Hồ Chí Minh - HCM202\Giáo trình tư tưởng Hồ Chí Minh.md'
git status --short
git diff --check -- plans/260802-hcm202-question-bank
```

## Gate hoàn thành

Blueprint cộng đúng 480 và map được mọi mục lớn/tiểu mục của sáu chương; schema cùng errata policy đủ rõ để các author làm độc lập; tuyệt đối chưa làm thay đổi behavior website.
