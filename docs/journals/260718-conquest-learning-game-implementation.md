---
date: 2026-07-18
session: conquest-learning-game-implementation
status: completed
---

# Journal: Triển khai game Công thành học tập

## Context

Mục tiêu là bổ sung một game chiến lược theo lượt vào website MLN222 tĩnh: 34 tỉnh, NPC cát cứ, kinh tế, dân số, quân đội, ngoại giao, chiến đấu nhiều lượt và quiz 10 câu cuối lượt. Website vẫn phải mở trực tiếp bằng `file://` và giữ nguyên ba chế độ học cũ.

## Thực hiện

- Xây nền RNG, contract, runtime và invariant deterministic.
- Chuẩn hóa 34 tỉnh, quan hệ kề, 10 nhóm đảo và năm binh chủng từ bản đồ do người dùng sở hữu.
- Xây engine tăng dân số theo đỉnh 40%, sản xuất, duy trì, thiếu hụt, đào ngũ, tuyển quân và mở khóa.
- Xây chiến đấu theo hiệp với tactic, công sự, sĩ khí, tiếp tế, thương vong, hồi phục và viện binh.
- Xây scheduler 10 câu, reward/penalty và save codec có checksum/validation.
- Mở rộng thành campaign 34 thế lực với ngoại giao, thương mại, cảnh báo chiến tranh, chiếm đóng, AI utility và điều kiện thắng theo điểm lãnh thổ/vùng.
- Xây UI bản đồ, panel tỉnh/ngoại giao/mặt trận/báo cáo, modal quiz và controller lưu liên tục.
- Mở rộng Python builder để nhúng JSON, SVG, CSS và JavaScript vào một `index.html` offline.

## Sửa lỗi đáng chú ý

- Chặn bypass quiz và score giả tại engine boundary.
- Xác thực production snapshot của mọi faction trước khi hoàn tất lượt.
- Buộc NPC dùng state machine đề nghị/phản hồi hiệp ước.
- Hủy viện binh chưa tới khi trận kết thúc mà không trừ quân ở tỉnh.
- Giữ nguyên câu review quiz và tab context sau reload.
- Làm sạch tactic/sidecar không tin cậy và hiển thị lỗi lưu bằng tiếng Việt.
- Chỉ pointer-capture sau khi thật sự kéo bản đồ, nên click tỉnh không bị mất.
- Chặn SVG active content, stylesheet import/runtime URL và đóng gói sai manifest.
- Làm nền inert và trap focus khi quiz bắt buộc đang mở.

## Kiểm định

- Node 130/130 và Python 33/33 pass.
- 100.000 bước kinh tế, 10.000 trận và 1.000 campaign production pass mọi assertion.
- Policy chuẩn thắng 83,83%, trung vị lượt 52; p95 xử lý lượt 41,3923 ms.
- Browser desktop/mobile, save/resume, lỗi lưu và offline network đều được kiểm tra trên artifact cuối.

## Quyết định

Benchmark policy chuẩn dùng Đà Nẵng làm tỉnh tham chiếu cố định. Việc này tách chất lượng policy khỏi chênh lệch địa lý giữa 34 tỉnh; hai policy còn lại vẫn phân bố điểm xuất phát để phủ invariant. Điều kiện thắng production không bị hạ.

`template.html` và module trong `game/` là source of truth; `index.html` chỉ được sinh bởi builder. Campaign dùng `mln222.campaign.v1`, sidecar dùng `mln222.campaign.ui.v1`, tách khỏi dữ liệu học `mln222.v2.*`.

## Kết quả

Chế độ Công thành đã hoàn tất toàn bộ chín phase. Báo cáo cân bằng và kiểm thử đầu cuối nằm trong `plans/260717-2056-conquest-learning-game/reports/`.
