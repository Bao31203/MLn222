# Phase 03 - Kiểm thử workspace Công thành desktop

Ngày kiểm thử: 2026-07-18  
Artifact: `index.html` mở trực tiếp bằng `file://`

## Kết quả bản đồ

- Giữ đủ 44 nhóm SVG; đúng 34 tỉnh gốc có `role="button"` và `tabindex="0"`.
- Hoàng Sa và Trường Sa được clone vào hai inset chỉ để trình bày; inset có 0 target/focus node và đồng bộ class owner, selected, warning, battle.
- ViewBox mainland cố định, không phụ thuộc timing đo DOM; bản đồ có toolbar zoom 100-250%, Fit và Focus tỉnh đang chọn.
- Enter trên tỉnh đang focus chọn đúng tỉnh; tooltip dùng text node và nhãn target chứa tên chủ sở hữu/trạng thái.
- Ở 1440x900, map viewport là 1000x567px, panel là 399x617px; ở 1024x768 là 614x435px và 369x485px.
- Không có horizontal/vertical page overflow, request mạng ngoài hoặc console error.

## Workspace

- HUD hiển thị lượt, lương thực, tiền, dân thường, quân đội, giới hạn dân và điểm lệnh.
- Bốn panel Tỉnh/Ngoại giao/Mặt trận/Báo cáo giữ panel content cuộn độc lập và dock kết thúc lượt cố định ở đáy cột.
- Empty state, warning, pending action và report timeline dùng icon + nhãn + mô tả, không chỉ dùng màu.

## Ảnh kiểm chứng

- [Khởi tạo 1440x900](./phase-03-game-setup-1440x900.png)
- [Chiến dịch 1440x900](./phase-03-game-campaign-1440x900.png)
- [Chiến dịch 1024x768](./phase-03-game-campaign-1024x768.png)
- [Ngoại giao](./phase-03-game-diplomacy-1440x900.png)
- [Mặt trận](./phase-03-game-battle-1440x900.png)
- [Báo cáo](./phase-03-game-report-1440x900.png)

## Kết luận

Phase 03 đạt hợp đồng map, keyboard target, desktop density và panel hierarchy.
