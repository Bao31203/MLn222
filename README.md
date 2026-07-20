# MLN122 Quiz

Ứng dụng học tập MLN122 dạng HTML tĩnh, đóng gói 504 câu hỏi theo 6 chương và một game chiến lược theo lượt trên bản đồ 34 tỉnh/thành.

## Trạng thái kiểm định

- Đợt mở rộng bổ sung 204 câu mới, chia đều 34 câu cho mỗi chương, nâng tổng ngân hàng từ 300 lên 504 câu.
- Số câu theo chương: `64/89/99/84/84/84`.
- Validator ngân hàng câu hỏi: 0 lỗi, 0 cảnh báo.
- Engine game deterministic, không dùng mạng ở runtime; dữ liệu bản đồ, CSS và JavaScript đều được nhúng vào `index.html`.
- Kiểm thử trình duyệt bao phủ desktop/mobile, save/resume giữa quiz, save hỏng và trình duyệt không cung cấp bộ nhớ.
- Nội dung: [báo cáo mở rộng](plans/260717-expand-theory-bank/reports/expansion-validation.md) và [kiểm thử ngân hàng câu hỏi](plans/260717-expand-theory-bank/reports/end-to-end-testing.md).
- Game: [báo cáo cân bằng](plans/260717-2056-conquest-learning-game/reports/balance-validation.md) và [kiểm thử đầu cuối](plans/260717-2056-conquest-learning-game/reports/end-to-end-testing.md).

## Mở ứng dụng

Mở trực tiếp `index.html` bằng trình duyệt, không cần chạy web server. Trên PowerShell tại thư mục dự án:

```powershell
Start-Process .\index.html
```

`index.html` cung cấp bốn chế độ: Luyện thi, Flashcard, Tìm kiếm và Công thành. File chạy trực tiếp bằng `file://`; game không tải bản đồ hoặc tài nguyên từ mạng.

## Giao diện và khả năng truy cập

- App shell tách hai không gian: giao diện học sáng, dễ đọc và workspace Công thành tối kiểu bản đồ chiến thuật; desktop dùng thanh điều hướng trái, mobile dùng thanh điều hướng đáy.
- Luyện thi có bộ lọc gọn, thống kê phiên ổn định và review đáp án; Flashcard tách thao tác lật thẻ khỏi điểm số; Tìm kiếm highlight kết quả bằng DOM an toàn.
- Công thành dùng bản đồ Việt Nam map-first với 34 tỉnh thao tác được bằng bàn phím; đất liền và các đảo giữ nguyên vị trí địa lý trong toàn bộ `viewBox`, dùng đường biên đồng mảnh và nền trống đồng nhúng offline. Bản đồ mở ở 110%, hỗ trợ nút zoom, con lăn, phím `+/-/0`, kéo và pinch trên màn hình cảm ứng.
- Nhấp chuột phải vào tỉnh của thế lực khác mở vòng lệnh Thông tin/Ngoại giao/Thương mại/Quân sự. Bàn phím dùng `Context Menu` hoặc `Shift+F10`; màn hình cảm ứng có nút `Hành động` và long press.
- Lệnh đã chọn xuất hiện trong khay lệnh và trên tuyến bản đồ; từng lệnh có thể hủy riêng trước khi kết thúc lượt. Mọi lựa chọn khả dụng lấy trực tiếp từ `controller.legalActions()` rồi được xếp bằng `controller.stageAction()`.
- Trên màn hình nhỏ, tài nguyên có thể thu gọn/mở rộng và bảng chiến dịch chuyển thành bottom sheet; trạng thái sheet chỉ thuộc UI, không đi vào campaign save.
- Control tương tác có kích thước tối thiểu 44px, trạng thái đúng/sai/cảnh báo không chỉ dựa vào màu, quiz cuối lượt giữ focus trong modal và hỗ trợ `prefers-reduced-motion`.

Bằng chứng thiết kế và kiểm thử nằm tại [báo cáo đại tu UI và vòng lệnh](plans/260719-1752-hybrid-ui-command-wheel/reports/end-to-end-testing.md).

## Chế độ Công thành

- Chọn một trong 34 tỉnh/thành làm cứ điểm; 33 tỉnh còn lại do NPC kiểm soát.
- Mỗi lượt quản lý lương thực, tiền, dân thường, quân đội, thương mại, ngoại giao, tuyển quân và mở khóa binh chủng.
- Tiến công cần cảnh báo trước một lượt; giao chiến diễn ra qua nhiều hiệp, hỗ trợ chiến thuật và viện binh.
- Kết thúc lượt phải hoàn thành đủ 10 câu hỏi. Điểm quiz quyết định tài nguyên, dân số hoặc hiệu ứng sản xuất của lượt sau.
- Điều kiện thắng yêu cầu đồng thời đạt tỷ lệ kiểm soát toàn quốc và số vùng kiểm soát tối thiểu.

Chiến dịch production lưu tại `mln222.campaign.v1`; trạng thái giao diện lưu tại `mln222.campaign.ui.v1`. Hai khóa này tách biệt với tiến độ học `mln222.v2.*`.

Độ khó phụ thuộc tỉnh khởi đầu. Benchmark 45-60 lượt dùng Đà Nẵng làm tỉnh tham chiếu; chiến dịch thực tế không bị giới hạn cứng ở lượt 60.

## Các file chính

- `content/chapters/chapter-01.json` đến `chapter-06.json`: dữ liệu biên soạn theo từng chương.
- `content/AUTHORING.md`: schema và tiêu chuẩn biên soạn câu hỏi.
- `questions.json`: ngân hàng 504 câu được hợp nhất từ các file chương.
- `template.html`: mẫu ứng dụng; `index.html`: bản HTML độc lập đã đóng gói.
- `game/data`, `game/engine`, `game/quiz`, `game/storage`, `game/ui`: dữ liệu và mã nguồn game theo module.
- `game/build-manifest.json`: thứ tự dữ liệu, SVG, CSS và JavaScript được builder nhúng.
- `scripts/simulate-*.js`: mô phỏng kinh tế, chiến đấu và chiến dịch để kiểm tra invariant/cân bằng.
- `parse_report.txt`: báo cáo kiểm định gần nhất.
- `compose_questions.py`, `validate_questions.py`, `build_html.py`, `test_pipeline.py`: pipeline hợp nhất, kiểm định, đóng gói và kiểm thử.

## Nguồn nội dung

Nguồn nằm tại `F:\MLN222`:

- Giáo trình chuẩn: `GIAO-TRINH-KINH-TE-CHINH-TRI-MAC-LENIN-BO-GIAO-DUC-VA-DAO-TAO.pdf`.
- Bài giảng bổ trợ: các file `*.pptx.txt` tương ứng với từng slot.

PDF là nguồn chuẩn để xác định đáp án. Khi PDF và slide khác nhau, ưu tiên PDF; slide chỉ dùng để xác định trọng tâm và ví dụ bổ trợ.

Hình học bản đồ 34 tỉnh/thành và họa tiết trống đồng lấy từ website do chủ dự án cung cấp: `https://fptlichsuviet.io.vn/map/index.html`. Builder nén và nhúng các tài nguyên cần thiết vào `index.html`; ứng dụng không phụ thuộc website nguồn ở runtime.

## Compose, validate, build và test

Chạy từ thư mục gốc dự án:

```powershell
python compose_questions.py
python validate_questions.py
node scripts/validate-game-data.js
python build_html.py
python -m unittest -v test_pipeline.py
node --test --test-concurrency=1 tests/game/*.test.cjs
node scripts/simulate-economy.js --runs 100000 --assert
node scripts/simulate-combat.js --runs 10000 --assert --config game/data/balance.json
node scripts/simulate-campaign.js --runs 1000 --turns 60 --assert
```

- `compose_questions.py` kiểm tra đủ 6 file chương, thêm số thứ tự `num`, hợp nhất và kiểm định trước khi thay `questions.json`.
- `validate_questions.py` kiểm định `questions.json` theo mặc định và ghi kết quả vào `parse_report.txt`; có thể truyền một đường dẫn JSON khác làm đối số.
- `build_html.py` kiểm định ngân hàng, manifest, SVG và tài sản game; sau đó thay atomically `index.html` bằng bản độc lập mới.
- `test_pipeline.py` kiểm tra validator, tính đồng nhất dữ liệu, build cô lập và byte-equivalence của HTML production.
- Bộ test Node kiểm tra engine, AI, save/resume, controller trình duyệt và hợp đồng tài sản build.

`parse_questions.py` là trình trích xuất cũ phục vụ khảo sát nguồn; đầu ra `questions.generated-draft.json` không được website production sử dụng.
