# Phase 04 - Kiểm thử Công thành mobile

Ngày kiểm thử: 2026-07-18  
Artifact: `index.html` mở trực tiếp bằng `file://`

## Portrait

- 390x844: layout chiến dịch gồm map 390x405px và sheet thu gọn 390x159px; map không còn bị cột desktop ép chiều rộng.
- HUD mặc định chỉ hiện Lượt/Lương thực/Tiền/Điểm lệnh; mở rộng hiện đủ 7 tài nguyên và trạng thái này không đi vào campaign save.
- Sheet thu gọn vẫn hiển thị toggle, bốn tab, ưu tiên thưởng, Hủy lệnh và Kết thúc lượt; sheet mở rộng cao tối đa 70dvh và dock bám đáy.
- 360x800 không có horizontal overflow; mọi button nhìn thấy đạt tối thiểu 44px.
- Safe-area padding được áp dụng cho dock bằng `env(safe-area-inset-bottom)`.

## Orientation và bàn phím

- 844x390 landscape chuyển sang map + panel hai cột, không overflow sau khi dùng chiều cao thực còn lại.
- Viewport 390x500 mô phỏng bàn phím ảo: sheet mở rộng nằm từ y=110 tới y=500, dock kết thúc đúng tại đáy viewport và panel cuộn độc lập.

## Ảnh kiểm chứng

- [Khởi tạo 390x844](./phase-04-game-setup-390x844.png)
- [Chiến dịch thu gọn 390x844](./phase-04-game-campaign-collapsed-390x844.png)
- [Chiến dịch 360x800](./phase-04-game-campaign-360x800.png)
- [HUD mở rộng](./phase-04-game-resources-expanded-390x844.png)
- [Sheet mở rộng](./phase-04-game-sheet-expanded-390x844.png)
- [Landscape 844x390](./phase-04-game-landscape-844x390.png)
- [Viewport bàn phím 390x500](./phase-04-game-keyboard-390x500.png)

## Kết luận

Phase 04 đạt map-first, bottom sheet, resource disclosure, safe area và orientation requirements.
