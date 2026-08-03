# Study Hub — Ôn tập các môn lý luận chính trị

Web tĩnh dùng để ôn tập năm học phần lý luận chính trị. Toàn bộ catalog và ngân hàng câu hỏi đã công khai được kiểm định rồi nhúng vào một SPA độc lập; không cần backend hay tài khoản. Catalog có **2.214 câu** trên bốn môn sẵn sàng học: MLN111 380 câu, MLN112 504 câu, HCM202 480 câu và VNR202 850 câu. MLN131 có 280 câu đang ở trạng thái bản thảo và chưa được publish để học.

## Trạng thái nội dung

| Môn | Nội dung | Trạng thái | Tính năng |
|---|---|---|---|
| `MLN111` | Triết học Mác – Lênin, 380 câu/3 chương | Sẵn sàng | Luyện thi, Flashcard, Tìm kiếm |
| `MLN112` | Kinh tế chính trị Mác – Lênin, 504 câu/6 chương | Sẵn sàng | Luyện thi, Flashcard, Tìm kiếm, 6 bài giảng YouTube, Công thành |
| `MLN131` | Chủ nghĩa xã hội khoa học, 280 câu/7 chương | Bản thảo | Chưa mở chế độ học |
| `HCM202` | Tư tưởng Hồ Chí Minh, 480 câu/6 chương | Sẵn sàng | Luyện thi, Flashcard, Tìm kiếm |
| `VNR202` | Lịch sử Đảng Cộng sản Việt Nam, 850 câu/5 đơn vị học | Sẵn sàng | Luyện thi, Flashcard, Tìm kiếm |

Mã công khai của học phần Kinh tế chính trị là `MLN112`; `mln122` và `mln222` là alias tương thích. Mã chuẩn của môn Lịch sử Đảng là `VNR202`; route cũ `vnr201` được chuyển về `vnr202`.

## Chạy trên máy

Yêu cầu Python 3 và trình duyệt hiện đại. Để chạy đúng artifact production đã kiểm định, từ thư mục gốc dự án:

```powershell
python -m http.server 8000 --directory dist
```

Mở `http://localhost:8000/`. Chỉ dùng `python -m http.server 8000` không có `--directory dist` khi đang phát triển trực tiếp từ source tree. Nên dùng HTTP thay vì `file://`; trình phát YouTube cần HTTP(S), Internet và quyền nhúng video.

Các route dạng hash nên có thể mở trực tiếp, tải lại và dùng Back/Forward:

```text
#/                         Trang chọn môn
#/mln111                   Tổng quan MLN111
#/mln111/quiz              Luyện thi MLN111
#/mln111/flash             Flashcard MLN111
#/mln111/search            Tìm kiếm MLN111
#/mln112/lecture           Sáu bài giảng MLN112
#/mln112/game              Công thành MLN112
#/hcm202                   Tổng quan HCM202
#/hcm202/quiz              Luyện thi HCM202
#/hcm202/flash             Flashcard HCM202
#/hcm202/search            Tìm kiếm HCM202
#/vnr202                   Tổng quan VNR202
#/vnr202/quiz              Luyện thi VNR202
#/vnr202/flash             Flashcard VNR202
#/vnr202/search            Tìm kiếm VNR202
#/mln131                   Trang bản thảo, chưa mở chế độ học
```

Mode hợp lệ là `quiz`, `flash`, `lecture`, `search`, `game` và phải được feature flag của môn cho phép. Route sai, quá dài, chứa query hoặc segment không an toàn được đưa về trang hợp lệ gần nhất. Bộ lọc chương/độ khó thuộc trạng thái học, không nằm trong URL.

## Biên soạn nội dung

Registry và profile nằm trong `content/subjects/`:

- `content/subjects/registry.json`: thứ tự, ID chuẩn, code, alias và trạng thái năm môn.
- `content/subjects/<subject>/subject.json`: chương, target, feature flag, file câu hỏi, nguồn được phép và profile kiểm định.
- `content/subjects/mln111/chapters/`: ba file nguồn của 380 câu MLN111.
- `content/chapters/`: sáu file nguồn tương thích của 504 câu MLN112.
- `content/subjects/hcm202/chapters/`: sáu file nguồn của 480 câu HCM202 đã sign-off.
- `content/subjects/vnr202/chapters/`: năm file nguồn của 850 câu VNR202 đã sign-off.
- `content/lectures.json`: manifest sáu video YouTube của MLN112.
- [Chuẩn biên soạn MLN111](content/subjects/mln111/AUTHORING.md), [MLN112](content/AUTHORING.md), [HCM202](content/subjects/hcm202/AUTHORING.md) và [VNR202](content/subjects/vnr202/AUTHORING.md).

Không sửa trực tiếp catalog public trong HTML. `chapterId` và `num` được compiler tạo từ profile; câu hỏi authored phải giữ đúng schema, `courseId`, nguồn, quota và ID của môn. Các bank đã review chỉ được `studyReady` khi hash ngân hàng khớp sign-off tương ứng: [MLN111](content/subjects/mln111/review-signoff.json), [HCM202](content/subjects/hcm202/review-signoff.json), [VNR202](content/subjects/vnr202/review-signoff.json).

## Compose và validate

Kiểm tra toàn bộ năm profile mà không ghi artifact:

```powershell
python compose_questions.py --all --check
python validate_questions.py --all --check
```

Kiểm tra riêng một môn:

```powershell
python compose_questions.py --subject mln111 --check
python validate_questions.py --subject mln111 --check
python compose_questions.py --subject hcm202 --check
python validate_questions.py --subject hcm202 --check
python compose_questions.py --subject vnr202 --check
python validate_questions.py --subject vnr202 --check
```

Ghi output/report chỉ khi chỉ định đích rõ ràng:

```powershell
python compose_questions.py --subject mln111 --output .\tmp\mln111.questions.json
python compose_questions.py --all --output .\tmp\banks
python validate_questions.py --all --report .\tmp\validation-report.txt
```

Hai lệnh không tham số vẫn là workflow tương thích MLN112: `compose_questions.py` tạo `questions.json`; `validate_questions.py` kiểm tra snapshot đó và ghi `parse_report.txt`.

## Build và kiểm thử

Quy trình kiểm định trước build:

```powershell
python compose_questions.py --all --check
python validate_questions.py --all --check
node scripts/validate-game-data.js
python -m unittest -v test_pipeline.py
node --test --test-concurrency=1 tests/game/*.test.cjs tests/study-hub/*.test.cjs
node scripts/simulate-economy.js --runs 100000 --assert
node scripts/simulate-combat.js --runs 10000 --assert --config game/data/balance.json
node scripts/simulate-campaign.js --runs 1000 --turns 60 --assert
```

Sau khi toàn bộ gate xanh:

```powershell
python compose_questions.py
python validate_questions.py --all --report parse_report.txt
python build_html.py
git diff --check
```

Builder nạp registry, kiểm định từng profile, chỉ publish bank `studyReady` và làm sạch public projection. Một lần chạy `python build_html.py` tạo release từ cùng validated input snapshot rồi promote theo transaction: root `index.html`, đúng hai file `dist/index.html` + `dist/release-manifest.json`, và root `vercel.json`. Nếu staging/promotion lỗi, bản `dist/` trước được giữ hoặc phục hồi; build bị chặn nếu vượt 5 MiB raw hoặc 1 MiB gzip.

Kết quả release gate hiện tại:

- Python: 70/70 test pass; Node: 165/165 test pass.
- Compose/validate HCM202: 480 câu, 0 lỗi, 0 cảnh báo; compose/validate toàn catalog và game-data validation đều pass.
- Economy 100.000 runs và combat 10.000 runs pass.
- Campaign held-out 1.000×60 thoát mã 0: `invalidActions=0`, `invariantFailures=0`, `warningViolations=0`; standard `winRate=0.8383233533`, `medianVictoryTurn=52`, `p95TurnMs=28.9419`, `maximumTurnMs=66.2464`.
- Hai clean build cho output giống nhau, gồm 5 môn/1.364 câu. `dist/index.html`: SHA-256 `b2faf6a295176cd136b7619d82630d0af1636378fc99728215b499eb70d3442d`, 2.827.553 byte raw, 704.131 byte gzip; input snapshot `ee30d33c369227206966fd6e63adc8b0c25f5cbdb00033f20b20cef90a2c7254`.
- Browser QA pass ở desktop 1440×900 và mobile 390×844: Home có 5 môn/3 môn sẵn sàng; overview HCM202 có 480 câu/6 chương; Quiz và Flashcard dùng được bằng bàn phím; Search không phân biệt dấu; Back, deep link và feature gate chặn Lecture/Game HCM202 đều đúng. Có 0 page/console error và 0 horizontal overflow.
- Local HTTP trả 200 cho root và 404 cho đường dẫn không tồn tại. Request 404 duy nhất trong phiên browser là favicon tùy chọn do trình duyệt tự yêu cầu.
- Cập nhật VNR202: build mới có 5 môn/2.494 câu, trong đó VNR202 có 850 câu; `dist/index.html` raw 4.527.482 byte, dưới ngưỡng 5 MiB raw và 1 MiB gzip.

Bằng chứng giao diện: [HCM202 trên Home](docs/screenshots/08-hcm202-course-home.png), [overview 480 câu/6 chương](docs/screenshots/09-hcm202-overview.png), [Flashcard](docs/screenshots/10-hcm202-flashcard.png), [Search](docs/screenshots/11-hcm202-search.png) và [Quiz mobile](docs/screenshots/12-hcm202-mobile-quiz.png).

## Lưu tiến độ và tương thích

Các namespace `localStorage` hiện tại:

| Phạm vi | Khóa |
|---|---|
| Môn được mở gần nhất | `mln-study-hub.v1.lastSubject` |
| MLN111 đánh dấu | `mln-study-hub.v1.mln111.marked` |
| MLN111 thống kê | `mln-study-hub.v1.mln111.stats` |
| MLN111 phiên học | `mln-study-hub.v1.mln111.studyProgress` |
| MLN112 đánh dấu | `mln222.v2.marked` |
| MLN112 thống kê | `mln222.v2.stats` |
| MLN112 phiên học | `mln222.v3.studyProgress` |
| HCM202 đánh dấu | `mln-study-hub.v1.hcm202.marked` |
| HCM202 thống kê | `mln-study-hub.v1.hcm202.stats` |
| HCM202 phiên học | `mln-study-hub.v1.hcm202.studyProgress` |
| VNR202 đánh dấu | `mln-study-hub.v1.vnr202.marked` |
| VNR202 thống kê | `mln-study-hub.v1.vnr202.stats` |
| VNR202 phiên học | `mln-study-hub.v1.vnr202.studyProgress` |
| Chiến dịch Công thành | `mln222.campaign.v1` |
| Giao diện chiến dịch | `mln222.campaign.ui.v1` |

`mln222.game.v1` là khóa mặc định của codec save cấp thấp; UI Công thành production dùng hai khóa `campaign` ở trên. Không đổi hoặc xóa các khóa MLN112 khi phát hành/rollback. Nếu storage không khả dụng, phiên học cùng tab được giữ trong bộ nhớ và UI thông báo không lưu được.

Game luôn lấy câu từ alias bất biến `globalThis.MLN222_QUESTIONS`, được cố định vào `getQuestionBank("mln112")`; đổi môn học không đổi bank của game. MLN111, HCM202, VNR202 và môn bản thảo MLN131 không khởi tạo game.

## Vercel và `dist/`

Đích production dự kiến: `https://mln122-one.vercel.app/`. Artifact local đã được dựng theo hợp đồng:

1. `python build_html.py` transactionally đồng bộ root `index.html`, exact `dist/{index.html,release-manifest.json}` và root `vercel.json` từ cùng snapshot.
2. `dist/` không chứa `content/`, `plans/`, `docs/`, Python, raw JSON hay report.
3. `vercel.json` dùng `outputDirectory: "dist"`, CSP hash đúng release manifest và các security header bắt buộc.
4. Khi serve `dist/` qua local HTTP, root/manifest trả 200 và forbidden source matrix trả 404.

Không deploy trực tiếp toàn bộ repository. Vercel preview/production và kiểm tra header trên origin live **chưa được thực hiện** vì người dùng chưa cấp quyền push/deploy. Phát video YouTube qua mạng thật, kiểm tra screen reader và zoom 200% vẫn là bước manual còn lại.

## Bảo mật và rollback

- Public question chỉ chứa trường học tập và citation `{label, section}`; không chứa `source.text`, file nguồn, path nội bộ hay validation policy.
- Catalog dùng ID đã kiểm định, dictionary null-prototype và accessor own-property-safe. JSON inline escape `<`, U+2028 và U+2029.
- YouTube dùng `youtube-nocookie.com`, tải lười, không autoplay; không có backend, analytics hay third-party script mới.
- Release phải có CSP hash đúng với inline script/style cùng các header `nosniff`, `Referrer-Policy` và `Permissions-Policy`.
- Nếu preview/production lỗi, promote lại deployment Vercel tốt gần nhất rồi revert đúng commit release. Không dùng `git reset --hard` và không xóa localStorage của người học.

Kiến trúc và hợp đồng chi tiết: [docs/multi-course-study-hub.md](docs/multi-course-study-hub.md). Nhật ký phiên triển khai: [docs/journals/260802-multi-course-study-hub.md](docs/journals/260802-multi-course-study-hub.md).
