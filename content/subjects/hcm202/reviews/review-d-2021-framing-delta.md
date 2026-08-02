# Review D — Delta đóng khung nội dung năm 2021

## Phạm vi

- Reviewer độc lập: Codex code reviewer; không phải tác giả bốn thay đổi này.
- Ngày kiểm: 2026-08-02.
- Nguồn đối chiếu duy nhất: `Giáo trình tư tưởng Hồ Chí Minh.md`, 444.353 byte, SHA-256 `2DF4AE100168AFAE7BD7830705DB466FB1C1A36474576F3CF8E0F2741C1CEEC4`; ấn bản Hà Nội, 2021.
- ID được kiểm: `HCM202-C04-Q086`, `HCM202-C06-Q076`, `HCM202-C06-Q079`, `HCM202-C06-Q088`.
- Phạm vi byte xác nhận: chỉ thêm tiền tố `Theo phần vận dụng của giáo trình xuất bản năm 2021, ...` vào `stem`; `options`, `answer`, `explanation`, `source` và mọi câu khác không đổi. Thử loại đúng bốn tiền tố khỏi artifact mới tái tạo chính xác cả hai hash chương cũ.

## Hash trước → sau

| Artifact | Trước | Sau |
|---|---|---|
| `chapter-04.json` | `AFA8536773EA53EE149A8B730EBC7F25312CF5A51A4AEE8D291055D2FD7A16B6` | `B505F62A167F1DA67BA0C4BF9B772F4A133366DA67D5B56793DC9E21A66B55C1` |
| `chapter-06.json` | `688402286E9CC5F0420B94A47E12EC314C81B682A815877C22D26BD596180790` | `65538159F73DE2C3E6FFA9CB3277161FDC22DA5FC38EFF19B62233504472195E` |
| Bank chuẩn hóa 480 câu | `0972780542C4380DDADEE8C552C123B694163818F0F489B4A3D4E2B15414F0DE` | `C0C9A0EC983DE0E48DA565F8CB08625261836487B3B3D2A72C3B5D0502350255` |

## Đối chiếu nội dung

| Câu | Bằng chứng trong nguồn | Kết quả |
|---|---|---|
| `C04-Q086` | Chương 4, III.1 yêu cầu thống nhất nói với làm, tăng kiểm tra và biến quyền lực được giao thành kết quả phục vụ nhân dân. | Tiền tố năm 2021 phù hợp; đáp án A và diễn giải không đổi, vẫn được nguồn bảo vệ. |
| `C06-Q076` | Chương 6, IV.1 nêu nền văn hóa tiên tiến, đậm đà bản sắc dân tộc và “thống nhất trong đa dạng”. | Tiền tố phù hợp; đáp án B về giá trị chung đồng thời tôn trọng sắc thái đa dạng không đổi. |
| `C06-Q079` | Chương 6, IV.1 yêu cầu giải quyết đúng quan hệ văn hóa với kinh tế, chính trị, xã hội và coi văn hóa là sức mạnh nội sinh của phát triển. | Tiền tố phù hợp; đáp án A và quan hệ hai chiều trong diễn giải không đổi. |
| `C06-Q088` | Chương 6, IV.2 gắn tự tu dưỡng, hoàn thiện nhân cách với đóng góp vào đấu tranh chống suy thoái tư tưởng, đạo đức, lối sống trong Đảng và xã hội. | Tiền tố phù hợp; đáp án A và diễn giải không đổi. |

## Xác minh và verdict

- Cả bốn stem nay tự mang dấu vết `2021` trong dữ liệu public; không còn phụ thuộc vào `source.text` nội bộ bị loại khỏi projection.
- Thao tác nhận thức, độ khó, đáp án đúng, distractor, quota chương và phân bố A/B/C/D không thay đổi.
- Không biến nội dung năm 2021 thành tuyên bố cập nhật đến năm 2026; câu hỏi ghi rõ đây là phần vận dụng của giáo trình xuất bản năm 2021.

**APPROVED / SIGNED OFF** cho đúng Chương 4 SHA-256 `B505F62A…B55C1`, Chương 6 SHA-256 `65538159…195E` và bank chuẩn hóa SHA-256 `C0C9A0EC…0255`. Mọi thay đổi byte tiếp theo làm biên bản này mất hiệu lực.
