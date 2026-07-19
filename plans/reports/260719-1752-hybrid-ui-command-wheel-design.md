---
title: "Thiết kế đại tu UI hai không gian và vòng lệnh"
date: 2026-07-19
type: brainstorm-report
status: approved
project: mln222-quiz
owner: user
---

# Thiết kế đại tu UI hai không gian và vòng lệnh

## Tóm tắt

Đại tu website theo mô hình hai không gian: khu học tập sáng, thoáng, ưu tiên đọc; khu Công thành tối, giàu không khí chiến thuật, ưu tiên bản đồ. Thêm vòng lệnh ngữ cảnh lấy cảm hứng từ OpenFront: chuột phải lên tỉnh NPC mở radial menu, sau đó chuyển tới bảng hành động có chi phí, điều kiện và xác nhận rõ ràng.

Giữ nguyên 504 câu hỏi, engine, dữ liệu cân bằng, RNG, save schema và pipeline sinh một `index.html` chạy trực tiếp bằng `file://`. Không sao chép mã hoặc tài sản OpenFront.

## Vấn đề hiện tại

- Toàn bộ ứng dụng dùng nền tối gần cùng cao độ, khiến phần học nặng mắt và game phẳng.
- App shell chiếm nhiều chiều cao; điều hướng mobile dễ xuống dòng.
- Bộ lọc, thống kê và nội dung học có trọng lượng thị giác gần nhau.
- Bản đồ đã liền khối nhưng màu tỉnh còn rời rạc, trạng thái thế lực chưa dễ quét.
- Hành động game nằm sâu trong tab/panel; chọn tỉnh và ra lệnh là hai luồng tách rời.
- Lệnh hợp lệ hiển thị như danh sách dài, khó hình thành cảm giác điều khiển trực tiếp trên bản đồ.
- Mobile phụ thuộc bottom sheet lớn, chưa có một điểm vào hành động đủ rõ.

## Yêu cầu đã duyệt

### Trải nghiệm

- Study dùng theme sáng; game dùng theme tối; cùng nhận diện MLN222.
- Desktop và mobile có cấu trúc riêng, không chỉ co cùng một layout.
- Bản đồ là bề mặt chính của game; HUD và panel phục vụ bản đồ.
- Chuột phải trên tỉnh NPC mở vòng lệnh theo mục tiêu.
- Mọi lệnh phải thể hiện trạng thái khả dụng, chi phí, điểm lệnh và lý do bị khóa.
- Có đường thay thế bằng chuột trái, bàn phím và nút cảm ứng; không dùng gesture-only.

### Ràng buộc

- Không đổi `game/core`, hành vi `game/engine`, `game/data`, `game/quiz`, RNG hoặc balance.
- Không đổi các storage key/schema hiện có.
- Không chỉnh tay `index.html`; luôn sinh từ source.
- Không framework, backend, CDN hoặc request runtime.
- Không sao chép mã/tài sản từ [OpenFrontIO](https://github.com/openfrontio/OpenFrontIO).
- Giữ WCAG AA, focus rõ, target tối thiểu 44px và `prefers-reduced-motion`.

## Các phương án đã cân nhắc

### A. Radial menu thuần

Ưu: nhanh, trực tiếp, cảm giác game tốt.

Nhược: không đủ chỗ cho chi phí, nhiều phương án nguồn quân và lý do khóa.

Kết luận: không dùng riêng lẻ.

### B. Context menu dạng danh sách

Ưu: dễ đọc, dễ làm keyboard và disabled reason.

Nhược: giống ứng dụng quản trị, không tạo tương tác bản đồ trực tiếp.

Kết luận: không phù hợp mục tiêu thị giác.

### C. Radial menu và bảng hành động ngữ cảnh

Ưu: vòng lệnh xử lý định hướng nhanh; bảng hành động xử lý chi tiết và xác nhận. Phù hợp game theo lượt.

Nhược: cần quản lý focus, vị trí cạnh viewport và đồng bộ với panel.

Kết luận: **đã duyệt**.

## Hướng thị giác

### Study sáng

- Canvas trắng lạnh/xám rất nhạt, không dùng beige làm màu chi phối.
- Chữ mực xanh đen; jade cho hoàn thành; vermilion cho sai/nguy hiểm; brass cho tiến độ.
- Nội dung đọc có measure khoảng 760-860px; phần công cụ tách bằng band/divider.
- Một frame chính cho câu hỏi; không lồng nhiều card.
- Font UI local/system, hỗ trợ tiếng Việt; số liệu dùng tabular numerals.

### Game tối

- Canvas than lục gần đen, surface phân tầng rõ hơn hiện tại.
- Bản đồ chiếm phần lớn viewport; texture trống đồng chỉ là watermark phụ.
- Màu lãnh thổ theo thế lực, không tô mỗi tỉnh như một màu độc lập trong campaign.
- Biên nội bộ nhẹ; biên giữa hai thế lực rõ; cảnh báo và mặt trận thêm pattern/icon, không chỉ đổi màu.
- Jade: người chơi; river blue: đồng minh; vermilion: chiến sự; brass: lựa chọn/focus.

## Kiến trúc thông tin

### App shell

- Desktop: rail điều hướng gọn bên trái, top bar thấp chứa học phần và tiến độ chính.
- Mobile: bottom navigation bốn mục; không ép nhãn xuống dòng trong top bar.
- Study dùng container đọc; game mở rộng toàn viewport còn lại.
- Theme đổi theo mode bằng class/data attribute, không nhân đôi markup.

### Khu học tập

- Luyện thi: toolbar lọc có progressive disclosure, progress rail, câu hỏi trung tâm, navigation sticky hợp lý.
- Flashcard: ưu tiên nội dung và hành động lật thẻ; metadata giảm trọng lượng.
- Tìm kiếm: ô tìm sticky, bộ lọc gọn, kết quả dạng danh sách phân đoạn.
- Feedback và giải thích xuất hiện trong cùng frame, không tạo card lồng.

### Workspace Công thành

- HUD tài nguyên một hàng ổn định; delta rõ, không làm layout nhảy.
- Map toolbar gọn; zoom/fit/focus/fullscreen-map bằng icon chuẩn.
- Desktop dùng map + context rail khoảng 380-420px.
- Selected province/faction có compact inspector; chi tiết sâu mở trong panel tương ứng.
- Order tray luôn cho thấy số điểm lệnh, lệnh đã xếp và khả năng bỏ từng lệnh.

## Vòng lệnh ngữ cảnh

OpenFront dùng chuột phải hoặc thao tác chạm để mở radial menu, menu đổi theo quan hệ và đóng khi click ra ngoài. Đây là pattern tham khảo, không phải mã nguồn dùng lại. [Hướng dẫn OpenFront](https://openfront.io/)

### Input desktop

1. Chuột trái chọn tỉnh và mở inspector.
2. Chuột phải trên tỉnh NPC chọn tỉnh đó và mở vòng lệnh tại con trỏ.
3. Vòng lệnh được clamp trong map viewport; anchor marker vẫn chỉ đúng tỉnh.
4. `Esc`, chuột phải lần nữa hoặc click ngoài đóng menu.
5. `ContextMenu`/`Shift+F10` mở menu cho tỉnh đang focus; phím mũi tên đổi sector; `Enter` chọn.

### Cấu trúc vòng lệnh

- Tâm: tên thế lực, biểu trưng quan hệ và tỉnh mục tiêu.
- Sector Thông tin: mở faction/province inspector.
- Sector Ngoại giao: hiệp ước, liên minh, phản hồi đề nghị.
- Sector Giao thương: mở thương lộ và lợi tức dự kiến.
- Sector Quân sự: cảnh báo tấn công, mặt trận, viện binh.
- Tối đa bốn sector để giữ hit area lớn và muscle memory ổn định.

### Bảng hành động

- Sector chỉ chọn nhóm, không thực hiện hành động phá hủy ngay.
- Bảng hành động liệt kê exact legal actions: nguồn, mục tiêu, chi phí, AP, ETA/tác động.
- Tấn công cần xác nhận nguồn xuất quân và tương quan lực lượng.
- Lệnh đã xếp hiển thị ngay trên map/order tray và có thể bỏ trước quiz cuối lượt.
- Hành động bị khóa vẫn hiện khi hữu ích cho discoverability, kèm lý do ưu tiên.

### Ma trận quan hệ

| Quan hệ/trạng thái | Nhóm chính |
|---|---|
| Trung lập | Thông tin, giao thương, hiệp ước, quân sự |
| Thân thiện | Giao thương, không xâm phạm, liên minh |
| Đồng minh | Thông tin, thương mại, trạng thái hiệp ước |
| Chiến tranh | Thông tin, mặt trận, tấn công/viện binh |
| Không giáp ranh | Quân sự hiện nhưng khóa |
| Hết AP/không ở action phase | Nhóm xem vẫn dùng; lệnh thay đổi state bị khóa |

### Quy tắc tính hợp lệ

- `controller.legalActions()` là nguồn chân lý duy nhất cho enabled state và payload.
- Context model chỉ nhóm, mô tả và sắp xếp legal action.
- Disabled reason là presentation-only, derive từ snapshot/config theo thứ tự ưu tiên; không được bật một action không có trong legal set.
- Action được stage qua `controller.stageAction()` như UI hiện tại.

### Mobile

- Tap tỉnh để chọn; nút `Hành động` luôn thấy trong sheet.
- Nút mở action palette 2x2 hoặc nửa vòng có cùng bốn nhóm.
- Long press chỉ là lối tắt, có ngưỡng thời gian và khoảng di chuyển để không xung đột pan/zoom.
- Focus order, screen reader label và nút đóng rõ; không yêu cầu gesture bí mật.

## Thành phần dự kiến

- `game/ui/context-action-model.js`: chuyển snapshot + legal actions thành view model.
- `game/ui/context-command-menu.js`: radial/palette state, focus, vị trí, input.
- `game/ui/game-controller.js`: API bỏ một pending action và query presentation nếu cần; không đổi engine.
- `game/ui/map-view.js`: phát sự kiện target context, anchor và pending route overlay.
- `game/ui/game-app.js`: điều phối menu, panel, sheet và order tray.
- `template.html`: shell, markup, icon sprite và placeholder module.
- `game/styles/game.css`: tactical workspace, radial menu, action sheet và responsive.

## Rủi ro và giảm thiểu

| Rủi ro | Mức | Giảm thiểu |
|---|---:|---|
| Chuột phải xung đột native menu/pan | Cao | Chặn `contextmenu` chỉ trong map target; test mouse/pointer riêng |
| UI tự tính luật khác engine | Cao | Enabled chỉ từ exact legal action; test parity |
| Menu tràn cạnh viewport | Cao | Clamp theo bounding box; test bốn góc và browser zoom |
| Long press xung đột kéo bản đồ | Cao | Delay + movement threshold + nút hữu hình thay thế |
| DOM restructure phá controller | Cao | Giữ ID hoặc cập nhật contract test cùng phase |
| Theme sáng/tối làm CSS rò rỉ | Trung bình | Semantic token + scope theo mode/component |
| Build offline phình lớn | Trung bình | Không dùng asset OpenFront; đo artifact sau mỗi phase |
| Worktree đang có thay đổi map | Trung bình | Baseline diff; làm việc trên source hiện có; không revert |

## Chỉ số thành công

- Từ chuột phải tới màn xác nhận một lệnh NPC: tối đa hai lựa chọn sau khi menu mở.
- Vòng lệnh mở trong 100ms và không làm pan/zoom giật.
- Map dùng tối thiểu khoảng 70% workspace desktop; CTA cuối lượt luôn thấy.
- Không overflow tại 360x800, 390x844, 768x1024, 1024x768 và 1440x900.
- Tất cả thao tác radial có đường keyboard và mobile hữu hình.
- Không action nào được enable nếu không có trong `legalActions()`.
- Không request HTTP(S) khi chạy production bằng `file://`.
- 504 câu, save/resume, deterministic build và toàn bộ regression tiếp tục pass.

## Bước tiếp theo

Triển khai theo kế hoạch tại `plans/260719-1752-hybrid-ui-command-wheel/plan.md`, có visual checkpoint sau app shell, study workspace, tactical map và context wheel.
