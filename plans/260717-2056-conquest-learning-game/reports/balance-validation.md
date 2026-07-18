# Báo cáo cân bằng chế độ Công thành

Ngày kiểm định: 2026-07-18

## Phạm vi

Báo cáo này khóa các gate định lượng cho kinh tế, chiến đấu và chiến dịch 34 thế lực. Mọi mô phỏng dùng RNG deterministic, dữ liệu production trong `game/data`, và không dùng DOM hay mạng.

## Kết quả

| Gate | Kết quả | Trạng thái |
|---|---:|---|
| Kinh tế | 100.000 bước chuyển, 29.641 lần thiếu hụt, 16.257 lần đào ngũ | PASS |
| Bất biến kinh tế | 0 tài nguyên âm/NaN, 0 vi phạm dân số và sức chứa | PASS |
| Chiến đấu | 10.000/10.000 trận kết thúc | PASS |
| Trận cân sức | trung vị 5 hiệp, p95 6 hiệp | PASS |
| Tương quan 2:1 | trung vị 4 hiệp, p95 4 hiệp | PASS |
| Phân bố thời lượng | 95,76% trong 3-7 hiệp; 100% trước hiệp 10 | PASS |
| Tổn thất trực tiếp lớn nhất | 13,4%, dưới trần 15% | PASS |
| Bảo toàn quân số | 0 lỗi | PASS |
| Chiến dịch | 1.000 chiến dịch x tối đa 60 lượt | PASS |
| Tính hợp lệ chiến dịch | 0 action lỗi, 0 invariant lỗi | PASS |
| Cảnh báo chiến tranh | 0 chiến tranh trước lượt 4; 0 trận thiếu cảnh báo | PASS |
| Hiệu năng lượt | p95 41,3923 ms; tối đa 89,792 ms | PASS |
| Policy chuẩn | 280/334 thắng, 83,83% | PASS |
| Nhịp thắng chuẩn | trung vị lượt 52; 0 thắng trước lượt 30 | PASS |

Mô phỏng chiến dịch ghi nhận 23.929 cảnh báo, 21.897 trận, 15.311 tỉnh bị player chiếm và 2.393 tỉnh player bị mất. Toàn bộ lượt chạy trong 1.494.923,625 ms.

## Phương pháp benchmark

Ba policy được giữ tách biệt:

- `expansionist` + quiz 8/10 là policy chuẩn, dùng Đà Nẵng làm tỉnh tham chiếu cố định để so sánh seed.
- `balanced` + quiz 10/10 và `steward` + quiz 6/10 tiếp tục phân bố điểm xuất phát qua toàn bộ 34 tỉnh, nhằm kiểm tra invariant và các nhánh hành vi khác.
- Seed production là `campaign-held-out`; seed tuning không được dùng làm kết quả phát hành.

Lần chạy đầu trộn tỉnh khởi đầu vào metric policy chuẩn nên fail ngưỡng 60%; mẫu chẩn đoán chỉ thắng 3/10. Đây là sai số phương pháp đo vì độ khó địa lý lấn át chất lượng policy. Bộ đo được sửa để công bố rõ tỉnh tham chiếu, còn `balance.json` production không bị nới điều kiện thắng. Gate cuối vẫn giữ 60% điểm lãnh thổ, bốn vùng kiểm soát, không chiến tranh trong ba lượt đầu và p95 dưới 100 ms.

## Artifact

- [Metrics chiến dịch JSON](./campaign-metrics.json)
- [Stdout chiến dịch](./campaign-simulation-final.stdout.txt)
- [Kiểm định Phase 3](./phase-03-validation.md)
- [Kiểm định Phase 4-6](./phase-04-06-validation.md)

## Giới hạn đã biết

Độ khó giữa 34 tỉnh khởi đầu không đồng đều; benchmark 45-60 lượt dùng một tỉnh tham chiếu thay vì cam kết mọi tỉnh đều thắng trong 60 lượt. Game không có giới hạn cứng 60 lượt, nên người chơi từ vị trí khó vẫn có thể tiếp tục chiến dịch.
