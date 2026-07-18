---
date: 2026-07-18
type: brainstorm-report
status: approved
project: mln222-quiz
owner: user
---

# Thiết kế làm mới UI Sử Việt hiện đại

## Summary

Làm mới toàn bộ website theo phương án hệ thống thiết kế chung và tái cấu trúc UI vừa phải. Giữ nguyên engine game, ngân hàng 504 câu hỏi, save schema, hành vi deterministic và pipeline tạo một `index.html` chạy offline. Thay đổi tập trung vào app shell, phân cấp thông tin, bố cục chế độ học, workspace Công thành, responsive, accessibility và phản hồi trạng thái.

Hướng thị giác đã được người dùng duyệt: Sử Việt hiện đại. Không giả cổ, không dùng texture nặng hoặc palette nâu đơn điệu. Bản đồ là tín hiệu thị giác chính của game; nội dung học vẫn ưu tiên khả năng đọc lâu.

## Problem statement

UI hiện tại đủ chức năng nhưng chưa phản ánh chất lượng của engine và nội dung:

- Nhận diện MLN222 yếu; bốn chế độ chưa có ngôn ngữ thị giác thống nhất.
- Phân cấp giữa điều hướng, bộ lọc, thống kê và nội dung chính còn phẳng.
- Game giống bảng quản trị; nhiều nút chữ, ít tín hiệu trạng thái.
- SVG dùng `viewBox="0 0 3129.7 4901.01"`, chứa vùng trống và nội dung phụ nên lãnh thổ hiển thị nhỏ.
- Desktop để nhiều khoảng trống quanh bản đồ trong khi panel phải chứa lượng thông tin lớn.
- Mobile xếp bản đồ và panel thành hai vùng cao cố định; hành động cuối lượt dễ rời khỏi vùng chú ý.
- Giao diện chưa trực quan hóa tốt cảnh báo tấn công, mặt trận, lệnh chờ và biến động tài nguyên.

## Requirements

### Functional

- Đồng bộ Luyện thi, Flashcard, Tìm kiếm và Công thành trong một app shell.
- Giữ toàn bộ ID/contract DOM cần thiết hoặc cập nhật test đồng thời khi buộc phải đổi.
- Bản đồ dễ quan sát, chọn tỉnh bằng chuột, cảm ứng và bàn phím.
- Hành động chính luôn rõ ràng; trạng thái disabled có nguyên nhân đọc được.
- Desktop và mobile có bố cục riêng phù hợp, không chỉ co nhỏ cùng một layout.
- Quiz cuối lượt giữ đủ focus trap, resume và review từng câu.

### Non-functional

- Chạy trực tiếp bằng `file://`; không request mạng, CDN, font hoặc icon bên ngoài.
- Không đổi `mln222.v2.*`, `mln222.campaign.v1`, `mln222.campaign.ui.v1`.
- Không đổi engine, RNG, cân bằng, data schema hoặc thứ tự game loop.
- Không chỉnh tay `index.html`; chỉ sinh từ `template.html` và manifest.
- Không có cuộn ngang hoặc chồng nội dung tại 360x800 trở lên.
- Tương phản WCAG AA; vùng bấm tối thiểu 44x44 CSS px.
- Tôn trọng `prefers-reduced-motion`.

## Evaluated approaches

### Approach A: CSS facelift

Đổi token màu, font, khoảng cách và shadow; không đổi markup hoặc luồng.

Ưu điểm:

- Phạm vi nhỏ, ít test hồi quy.
- Nhanh tạo khác biệt bề mặt.

Nhược điểm:

- Không giải quyết bản đồ nhỏ, panel dày và mobile thiếu trọng tâm.
- Tiếp tục duy trì hai hệ UI gần như tách rời.

Kết luận: không đủ cho mục tiêu.

### Approach B: Design system và tái cấu trúc vừa

Tạo token chung, app shell và pattern component; tổ chức lại markup UI nhưng giữ engine/controller/save.

Ưu điểm:

- Giải quyết cả thẩm mỹ và usability.
- Tận dụng module UI hiện có, không cần framework mới.
- Giữ offline build và phạm vi kiểm thử có thể kiểm soát.

Nhược điểm:

- Cần cập nhật nhiều selector và test UI.
- Responsive game phải được kiểm thử như một luồng riêng.

Kết luận: chọn theo phê duyệt người dùng.

### Approach C: Viết lại frontend bằng framework

Chuyển toàn bộ UI sang React/Vue hoặc build tool mới.

Ưu điểm:

- Component hóa và state rendering thuận tiện hơn.

Nhược điểm:

- Tăng dependency, bundle, migration và rủi ro save/resume.
- Không tạo đủ giá trị so với JavaScript module hiện có.
- Trái YAGNI với ứng dụng offline một trang.

Kết luận: loại khỏi phạm vi.

## Approved visual direction

### Palette

| Role | Direction | Usage |
|---|---|---|
| Ink | than gần đen | nền chính, canvas bản đồ |
| Paper | trắng ngà lạnh | chữ chính, vùng nội dung sáng tương phản |
| Cinnabar | đỏ son/đỏ gạch | chiến sự, nguy hiểm, hành động phá hủy |
| Jade | xanh ngọc trầm | lãnh thổ người chơi, thành công |
| Brass | vàng đồng | focus, tiến độ, điểm nhấn quan trọng |
| River | xanh lam xám | đồng minh, ngoại giao, dữ liệu phụ |

Không dùng gradient trang trí. Không dùng beige/nâu làm màu chi phối. Shadow chỉ dành cho overlay, bottom sheet và lớp nổi thực sự.

### Typography and icons

- Một font sans hỗ trợ tiếng Việt tốt, nhúng local nếu tổng kích thước cho phép; fallback về system UI.
- Không dùng font cỡ hero trong panel tác vụ.
- Letter spacing bằng `0`.
- Dùng sprite icon Lucide inline/offline. Nút icon quen thuộc có tooltip và `aria-label`.
- Số liệu dùng tabular numerals để thanh tài nguyên không nhảy chiều rộng.

### Geometry

- Border radius 4-6px cho control; tối đa 8px cho modal/card thực sự.
- Không lồng card trong card.
- Dùng đường phân cách, band toàn chiều rộng và spacing để nhóm nội dung.
- Kích thước toolbar, resource cell, tab và action dock cố định để tránh layout shift.

## Information architecture

### Shared app shell

- Header compact chứa MLN222, tên học phần và tổng số câu.
- Primary navigation gồm icon + nhãn cho bốn chế độ.
- Study modes dùng container đọc tối đa khoảng 1040px.
- Game mode mở rộng đến toàn viewport dưới shell.
- Footer chỉ xuất hiện trong study modes; game dành chiều cao cho workspace.

### Study modes

- Bộ lọc chia thành chọn chương, mức độ và nhóm thao tác nhanh.
- Shuffle, đánh dấu, hay sai và reset dùng icon phù hợp, nhãn/tooltip rõ.
- Session status tách câu hiện tại, điểm, độ phủ và số đánh dấu thành các cụm dễ quét.
- Question card là một frame duy nhất; metadata gọn, câu hỏi nổi bật, đáp án có chiều cao ổn định.
- Feedback và giải thích xuất hiện thành band sau câu trả lời, không tạo card lồng.
- Điều hướng câu cố định ở đáy viewport trên mobile khi card dài.
- Flashcard nhấn mạnh hành động lật/hiện đáp án; giữ cùng dữ liệu và keyboard contract.
- Search dùng toolbar tìm kiếm sticky và danh sách kết quả phân cách theo hàng, không tạo lưới card trang trí.

### Game desktop

- Workspace dùng grid `minmax(0, 1fr) + 400px`; bản đồ chiếm 65-70% chiều ngang thực tế.
- Resource HUD đặt dưới app nav; hiển thị icon, label, value và delta nếu UI có dữ liệu báo cáo tương ứng.
- Map toolbar dùng icon zoom, fit và legend; tên tỉnh đang chọn hiển thị rõ.
- Chuẩn hóa SVG viewBox theo bounding box lãnh thổ, giữ các nhóm đảo dưới dạng inset hoặc cùng viewport.
- Panel phải có header tỉnh/thế lực, tab Tỉnh/Ngoại giao/Mặt trận/Báo cáo và vùng nội dung cuộn độc lập.
- Tab có count badge cho cảnh báo hoặc mặt trận đang hoạt động.
- Turn action dock luôn nhìn thấy; ưu tiên thưởng, hủy lệnh và kết thúc lượt không bị panel content đẩy khỏi viewport.
- Tooltip map chỉ bổ trợ; mọi thông tin cần thiết vẫn truy cập được bằng panel và bàn phím.

### Game mobile

- Bản đồ là lớp chính, chiếm khoảng 45-55dvh tùy chiều cao màn hình.
- Resource strip chỉ hiển thị nhóm chính; phần mở rộng cung cấp các chỉ số còn lại.
- Chi tiết tỉnh và các tab chiến dịch nằm trong bottom sheet có trạng thái collapsed/expanded rõ.
- Action dock cố định phía dưới và tính safe-area inset.
- Bottom sheet không che nút chọn tỉnh, không bẫy focus khi chưa mở dạng modal.
- 360px không có cuộn ngang; nhãn dài xuống dòng trong vùng cho phép.

### Turn quiz and reports

- Quiz cuối lượt là dialog tập trung, không thay đổi quy trình 10 câu.
- Progress, câu hỏi, lựa chọn và giải thích có phân cấp giống chế độ Luyện thi.
- Kết quả lượt nhấn mạnh điểm, resource delta và effect nhận được.
- Báo cáo chiến dịch dùng timeline hàng đơn giản với icon trạng thái, không dùng card lồng.

## Implementation boundaries

### May change

- `template.html`: app shell, study markup, game layout wrappers, icon sprite.
- `game/styles/game.css`: toàn bộ layout và state styles, vẫn được scope dưới `.game-root`.
- `game/assets/vietnam-map.svg`: viewBox/asset cleanup có kiểm chứng 44 nhóm.
- `game/ui/*.js`: render markup, tooltip, badge, mobile sheet state và presentation-only derivation.
- `test_pipeline.py`, `tests/game/*.test.cjs`: contract build, DOM/source checks và regression mới.
- `build_html.py`, `game/build-manifest.json`: chỉ khi cần nhúng asset font/icon an toàn.

### Must not change

- `game/core/*`, `game/engine/*`, `game/quiz/*`, `game/storage/*` behavior.
- `game/data/*` balance và schema.
- `questions.json` và `content/chapters/*`.
- Save keys/schema, RNG state hoặc campaign outcome.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Crop SVG làm mất đảo hoặc target | High | Test đủ 34 primary target và 44 nhóm; screenshot desktop/mobile |
| DOM restructure phá controller | High | Giữ ID; thêm contract test trước khi di chuyển markup |
| Bottom sheet che nội dung/focus | High | State machine UI nhỏ; keyboard, touch và focus test riêng |
| Font/icon làm hỏng inline safety | Medium | Nhúng base64/inline có whitelist hoặc dùng system font; không `url()` ngoài |
| CSS global xung đột game/study | Medium | Token global, component selector scoped, không dùng selector mơ hồ |
| UI hiển thị delta sai engine | Medium | Chỉ derive từ snapshot/report event; không tự tính kinh tế lần hai |
| File production vượt kích thước | Low | Budget mục tiêu khoảng 2 MB; đo sau mỗi phase asset |
| Dirty worktree hiện tại | Medium | Không revert thay đổi cũ; mỗi phase đọc diff trước khi sửa |

## Success metrics

- Bản đồ dùng ít nhất 75% chiều cao canvas, không cắt lãnh thổ/đảo.
- Hành động chính desktop luôn thấy không cần cuộn toàn trang.
- Mobile 360x800, 390x844 không overflow/chồng nội dung.
- Tương phản text/control đạt WCAG AA; focus visible và target 44px.
- Luồng quiz, flashcard, search, new/resume campaign, battle và end-turn hoàn tất bằng keyboard/touch.
- Không request mạng khi mở `file://` hoặc khi bật offline.
- 130 Node test, 33 Python test và validator hiện có tiếp tục pass; số test mới được cộng thêm.
- `index.html` build byte-equivalent với artifact production và mục tiêu không vượt khoảng 2 MB.

## Validation matrix

| Viewport | Study | Game setup | Game campaign | Quiz overlay |
|---|---|---|---|---|
| 1440x900 | Required | Required | Required | Required |
| 1024x768 | Required | Required | Required | Required |
| 390x844 | Required | Required | Required | Required |
| 360x800 | Required | Required | Required | Required |

Mỗi trạng thái lưu screenshot, kiểm tra console, overflow, vùng trống bất thường, focus order và network request.

## Next steps

1. Tạo plan sáu phase, khóa file ownership và dependency.
2. Thực hiện baseline screenshot trước thay đổi.
3. Chốt visual checkpoint sau phase design foundation và sau game desktop.
4. Chỉ build `index.html` sau khi source/test của phase tương ứng pass.
