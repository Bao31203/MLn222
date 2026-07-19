# Ghi chú tương tác OpenFront

## Nguồn

- [OpenFront](https://openfront.io/): help content mô tả radial menu, player info và input.
- [OpenFrontIO GitHub](https://github.com/openfrontio/OpenFrontIO): tham chiếu phạm vi dự án và giấy phép; không dùng lại mã hoặc asset.

## Quan sát có thể áp dụng

- Chuột phải hoặc touch mở radial menu tại mục tiêu.
- Click ngoài đóng menu.
- Sector thay đổi theo quan hệ: info, alliance, attack, build/trade tương ứng trạng thái.
- Player info tách khỏi radial menu; radial menu là launcher, không chứa toàn bộ chi tiết.
- Disabled/không khả dụng phải phản ánh context mục tiêu.

## Điều không áp dụng nguyên bản

- OpenFront là RTS; MLN222 là turn-based và có điểm lệnh.
- Không thực thi lệnh chiến tranh ngay từ sector.
- Không đưa slider hoặc mô tả dài vào vòng tròn.
- Không dùng gesture làm lối vào duy nhất trên mobile.
- Không sao chép CSS, SVG, icon, ảnh hoặc source implementation.

## Chuyển hóa cho MLN222

- Bốn sector ổn định: thông tin, ngoại giao, giao thương, quân sự.
- Sector mở action sheet được lọc theo faction/province.
- Exact action và payload lấy từ `controller.legalActions()`.
- Mọi lệnh thay đổi state đi qua `controller.stageAction()` và xuất hiện trong order tray.
- Context UI state là tạm thời, không thêm vào campaign save.
