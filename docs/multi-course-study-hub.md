# Kiến trúc Study Hub đa môn

## Tổng quan

Study Hub là SPA tĩnh, không backend, tổng hợp năm học phần lý luận chính trị. Nội dung authored được tách khỏi read model public: Python đọc registry/profile, hợp nhất và kiểm định ngân hàng, chiếu sang schema an toàn rồi nhúng catalog vào `index.html`. UI chỉ truy cập catalog qua accessor và chỉ mở mode được feature flag cho phép.

## Danh mục môn học

Thứ tự registry là một phần của hợp đồng giao diện:

| ID chuẩn | Code công khai | Tiêu đề | Trạng thái | Câu/chương | Feature bật |
|---|---|---|---|---:|---|
| `mln111` | `MLN111` | Triết học Mác – Lênin | `ready`, `studyReady` | 380/3 | quiz, flashcards, search |
| `mln112` | `MLN112` | Kinh tế chính trị Mác – Lênin | `ready`, `studyReady` | 504/6 | quiz, flashcards, search, lectures, game |
| `mln131` | `MLN131` | Chủ nghĩa xã hội khoa học | `draft` | 280/7 | chưa publish mode học |
| `hcm202` | `HCM202` | Tư tưởng Hồ Chí Minh | `ready`, `studyReady` | 480/6 | quiz, flashcards, search |
| `vnr202` | `VNR202` | Lịch sử Đảng Cộng sản Việt Nam | `ready`, `studyReady` | 850/5 | quiz, flashcards, search |

`mln112` là ID chuẩn bất biến. `mln122` và `mln222` chỉ là legacy alias để đọc đầu vào/duy trì tương thích; nhãn public là `MLN112`. `vnr202` là ID chuẩn của môn Lịch sử Đảng; alias `vnr201` được canonicalize sang `vnr202`.

Phân bổ ngân hàng:

- MLN111: `70/150/160`, tổng 380 câu; 152 Nhận biết, 152 Thông hiểu, 76 Vận dụng.
- MLN112: `64/89/99/84/84/84`, tổng 504 câu; 204 Nhận biết, 204 Thông hiểu, 96 Vận dụng.
- HCM202: `45/75/100/95/75/90`, tổng 480 câu; 192 Nhận biết, 192 Thông hiểu, 96 Vận dụng; vị trí đáp án A/B/C/D cùng 120 câu.
- VNR202: `63/120/220/400/47`, tổng 850 câu; 340 Nhận biết, 340 Thông hiểu, 170 Vận dụng; vị trí A/B/C/D là `213/213/212/212`.
- MLN112 có sáu lecture YouTube, mỗi lecture ánh xạ một `chapterId`, và game Công thành dùng nguyên bank 504 câu.

Catalog public có năm môn, bốn môn sẵn sàng và tổng **2.214 câu** trong các bank được publish. MLN131 có 280 câu đã authored nhưng vẫn là `draft`, vì vậy chỉ hiển thị tiến độ và chưa đưa bank vào runtime.

## Luồng dữ liệu

```text
content/subjects/registry.json
  -> subject_catalog.load_registry()
  -> từng subject.json / SubjectProfile
  -> compose_questions.compose_subject()
  -> validate_questions.validate_subject()
  -> public subject/question/lecture projections
  -> build_html.build_catalogs()
  -> ba catalog nhúng an toàn vào template.html
  -> index.html
  -> internal same-volume staging transaction
  -> root index.html + dist/{index.html,release-manifest.json} + root vercel.json
  -> Vercel preview/production (cần người dùng duyệt)
```

Ba placeholder build phải xuất hiện đúng một lần:

```text
/*__SUBJECT_CATALOG__*/[]
/*__QUESTION_BANKS__*/{}
/*__LECTURE_CATALOGS__*/{}
```

Game data, CSS, JavaScript, SVG và texture tiếp tục được lấy từ `game/build-manifest.json`, kiểm định rồi nhúng vào cùng HTML.

## Registry và profile

`content/subjects/registry.json` chỉ cho phép đúng các trường `schemaVersion` và `subjects`. Mỗi item khai báo `id`, `code`, `legacyAliases`, `status`, `metadataPath`.

Profile `subject.json` là nguồn chuẩn cho:

- Metadata public: ID, code, tiêu đề, mô tả, trạng thái, readiness và feature flags.
- Chapter ID ổn định, thứ tự, tiêu đề và question target.
- Danh sách file câu hỏi/lecture đã khai báo.
- ID pattern, `courseId` policy, `kind` hợp lệ, quota difficulty/answer.
- Source policy và review sign-off.

`comingSoon` là profile dataless: target 0, không chapter/file/validation và mọi feature đều tắt. `draft` có thể chứa chapter/file/validation để báo tiến độ nhưng không được publish question bank hoặc mở workspace. `ready` chỉ được publish khi target đầy đủ, validation không lỗi và mọi review sign-off đã khai báo khớp SHA-256; MLN111, HCM202 và VNR202 dùng hợp đồng sign-off này.

## Catalog public

Builder không đưa object authored trực tiếp vào browser.

### Subject

```text
id, code, legacyAliases, title, description, status, studyReady, copyReviewRequired,
features, questionTarget, questionCount,
chapters[{id, number, title, questionTarget, questionCount}]
```

### Question

```text
id, num, chapterId, chapterNum, chapter, topic, difficulty, kind,
stem, options, answer, explanation, source{label, section}
```

`chapterId`, `chapter` và `num` do compiler tạo từ profile. Không publish `courseId`, `source.file`, `source.text`, số slide, path nội bộ hoặc validation policy. Với nguồn Markdown, `section` là section đã kiểm định; với nguồn PDF legacy, builder chuyển trang sang nhãn như `Trang 35`.

Tài liệu tìm kiếm của một câu chỉ gồm stem, bốn options, explanation, topic, difficulty, chapter title và citation label/section. Raw evidence không được tìm kiếm hoặc render.

### Lecture

```text
schemaVersion, provider, playlistId,
lectures[{id, chapterId, chapterNum, title, durationSeconds, videoId, summary}]
```

Chỉ provider YouTube và ID allowlisted về định dạng được chấp nhận. `chapterValue` authored được đối chiếu profile nhưng không publish. MLN112 phải có đúng một lecture cho mỗi chương.

Catalog bank/lecture dùng object null-prototype. Runtime chỉ cung cấp bốn accessor own-property-safe:

```text
hasSubject(id)
getSubject(id)
getQuestionBank(id)
getLectures(id)
```

## Route và feature gate

Route canonical dùng fragment để Vercel/static host luôn phục vụ cùng `index.html`:

| Dạng | Ý nghĩa |
|---|---|
| `#/` | Trang chọn môn |
| `#/<subjectId>` | Tổng quan hoặc trạng thái môn |
| `#/<subjectId>/<mode>` | Workspace của một mode được bật |

Mode runtime: `quiz`, `flash`, `lecture`, `search`, `game`. `availableModes(subject)` lấy trực tiếp từ feature flags nhưng chỉ trả mode khi subject thực sự `ready` và `studyReady`. Vì vậy `#/mln111/game`, `#/hcm202/game` và `#/vnr202/game` đều được đưa về overview; `#/mln131/quiz` chỉ mở trang bản thảo và không tạo pool/storage/iframe/game. `#/vnr201/quiz` được canonicalize thành `#/vnr202/quiz`.

Parser giới hạn fragment 512 byte, chỉ nhận tối đa hai segment, decode có guard, từ chối control character, `.`/`..`, slash/backslash mã hóa và query. Route không canonical được thay bằng `history.replaceState`; điều hướng hợp lệ dùng hash nên refresh và Back/Forward hoạt động.

Bộ lọc chương, difficulty, câu bắt đầu, shuffle, marked/wrong là state của workspace và storage, không nằm trong route ở release này.

## Storage và cách ly môn

| Chủ sở hữu | Namespace chính xác | Nội dung |
|---|---|---|
| Hub | `mln-study-hub.v1.lastSubject` | Môn mở gần nhất |
| MLN111 | `mln-study-hub.v1.mln111.marked` | Compound question keys đã đánh dấu |
| MLN111 | `mln-study-hub.v1.mln111.stats` | Thống kê đúng/sai theo câu |
| MLN111 | `mln-study-hub.v1.mln111.studyProgress` | Phiên quiz/flash |
| MLN112 | `mln222.v2.marked` | Khóa đánh dấu legacy được giữ nguyên |
| MLN112 | `mln222.v2.stats` | Khóa thống kê legacy được giữ nguyên |
| MLN112 | `mln222.v3.studyProgress` | Phiên quiz/flash legacy được giữ nguyên |
| HCM202 | `mln-study-hub.v1.hcm202.marked` | Compound question keys đã đánh dấu |
| HCM202 | `mln-study-hub.v1.hcm202.stats` | Thống kê đúng/sai theo câu |
| HCM202 | `mln-study-hub.v1.hcm202.studyProgress` | Phiên quiz/flash |
| VNR202 | `mln-study-hub.v1.vnr202.marked` | Compound question keys đã đánh dấu |
| VNR202 | `mln-study-hub.v1.vnr202.stats` | Thống kê đúng/sai theo câu |
| VNR202 | `mln-study-hub.v1.vnr202.studyProgress` | Phiên quiz/flash |
| Game | `mln222.campaign.v1` | Campaign save production |
| Game UI | `mln222.campaign.ui.v1` | Trạng thái trình bày campaign |
| Game codec | `mln222.game.v1` | Default key của save codec cấp thấp |

Question key logic trong hub là `<subjectId>:<questionId>`, ngăn ID trùng giữa bốn bank sẵn sàng. Loader coi localStorage là dữ liệu không tin cậy: parse có guard, đối chiếu ID với bank hiện tại, bỏ record sai/cross-subject và giữ fallback trong `memoryStudyBySubject`. Lỗi `getItem`, `setItem` hoặc `removeItem` không được làm mất phiên cùng tab.

Reset chỉ xóa ba key study của môn hiện tại. Rollback không xóa storage: app cũ tiếp tục đọc key MLN112, bỏ qua key MLN111/HCM202/VNR202; khi forward recovery, từng môn đọc lại dữ liệu của mình.

## Hợp đồng game MLN112

Để không làm đổi cân bằng/save hiện tại, game chưa được chuyển thành dependency-injected component. Alias:

```javascript
globalThis.MLN222_QUESTIONS === getQuestionBank("mln112")
```

được tạo bằng property không writable, không configurable và không thay đổi khi active subject đổi. Game chỉ hiển thị ở `#/mln112/game`; HCM202 không khởi tạo game hoặc lecture iframe. Event lifecycle `mln222:mode-change` vẫn được phát sau khi route hợp lệ đã render để activate/deactivate workspace game.

## Quy trình biên soạn

1. Cập nhật file chương theo [chuẩn MLN111](../content/subjects/mln111/AUTHORING.md), [MLN112](../content/AUTHORING.md) hoặc [HCM202](../content/subjects/hcm202/AUTHORING.md); không sửa output public.
2. Cập nhật profile khi chapter/target/source policy thay đổi. ID và legacy storage không được đổi trong phiên nội dung.
3. Chạy read-only:

   ```powershell
   python compose_questions.py --all --check
   python validate_questions.py --all --check
   ```

4. Phản biện nội dung; với môn yêu cầu sign-off, tái tạo/duyệt hash theo quy trình biên tập trước khi đặt `studyReady`.
5. Chỉ ghi output bằng `--output`/`--report` rõ ràng. No-arg composer/validator được giữ cho snapshot MLN112 legacy.

Để mở một môn `comingSoon`, cần bổ sung chapter files, source policy, validation target, editorial sign-off nếu có, rồi bật feature theo nội dung thực sự đã sẵn sàng. Không chỉ đổi `status`.

## Validation, build và release

Release gate chuẩn:

```powershell
python compose_questions.py --all --check
python validate_questions.py --all --check
node scripts/validate-game-data.js
python -m unittest -v test_pipeline.py
node --test --test-concurrency=1 tests/game/*.test.cjs tests/study-hub/*.test.cjs
node scripts/simulate-economy.js --runs 100000 --assert
node scripts/simulate-combat.js --runs 10000 --assert --config game/data/balance.json
node scripts/simulate-campaign.js --runs 1000 --turns 60 --assert
python compose_questions.py
python validate_questions.py --all --report parse_report.txt
python build_html.py
git diff --check
```

Builder chụp input manifest (gồm cả bốn compiler source), đọc lại `template.html`, render deterministically, đo raw/gzip, rồi chụp snapshot lần hai. Từ đúng snapshot này, `python build_html.py` dựng staging cùng volume và transactionally promote đồng bộ root `index.html`, exact `dist/{index.html,release-manifest.json}` cùng root `vercel.json`. Trình tự snapshot → reread template → render → snapshot đóng cửa sổ TOCTOU; backup/restore giữ release cũ nếu promotion lỗi. Release manifest chứa SHA-256/size, CSP của từng inline script/style, subject counts và canonical `inputSnapshotSha256`; không chứa test count. Hard gate là tối đa 5 MiB raw và 1 MiB gzip.

Hai clean build đã cho output byte-identical. Serve production artifact local bằng:

```powershell
python -m http.server 8000 --directory dist
```

Vercel dùng Framework Preset `Other` và `outputDirectory: "dist"`. `dist/` hiện chỉ chứa `index.html` và `release-manifest.json`; các request local HTTP tới `content/`, `plans/`, `docs/`, file Python, report, raw bank và source JSON đã trả 404. `vercel.json` chứa CSP khớp release manifest, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`; HTML dùng cache revalidation.

### Bằng chứng release gate

| Gate | Kết quả |
|---|---|
| Compose/validate/game-data | Pass |
| Compose/validate HCM202 | 480 câu; 0 errors; 0 warnings |
| Python | 70/70 pass |
| Node | 165/165 pass |
| Economy | 100.000 runs pass |
| Combat | 10.000 runs pass |
| Campaign held-out | 1.000×60, exit 0; invalidActions/invariantFailures/warningViolations đều 0 |
| Campaign standard | winRate `0.8383233533`; medianVictoryTurn `52`; p95TurnMs `28.9419`; maximumTurnMs `66.2464` |
| Determinism | Hai clean build giống nhau |
| Browser QA | Desktop 1440×900 và mobile 390×844 pass; 0 page/console error; 0 horizontal overflow |
| Local HTTP | Root 200; đường dẫn không tồn tại 404 |

Artifact hiện tại:

```text
dist/index.html
SHA-256       b2faf6a295176cd136b7619d82630d0af1636378fc99728215b499eb70d3442d
raw           2.827.553 byte
gzip          704.131 byte
inputSnapshot ee30d33c369227206966fd6e63adc8b0c25f5cbdb00033f20b20cef90a2c7254
catalog       5 môn / 1.364 câu (MLN111 380, MLN112 504, HCM202 480)
```

Artifact nằm dưới cả hai hard gate. Vercel preview/production và live-header verification chưa được thực hiện vì người dùng chưa cấp quyền push/deploy. YouTube network playback, screen reader và zoom 200% vẫn cần kiểm tra thủ công.

### Browser QA HCM202

- Home hiển thị đúng 5 môn, trong đó 3 môn sẵn sàng; overview HCM202 hiển thị 480 câu và 6 chương.
- Quiz/Flashcard hỗ trợ luồng bàn phím; Search không phân biệt dấu; Back/Forward và deep link hoạt động đúng.
- Route cưỡng bức Lecture/Game của HCM202 bị chặn về overview theo feature flags.
- Desktop 1440×900 và mobile 390×844 đều có 0 page/console error và 0 horizontal overflow.
- Local HTTP trả 200 cho root và 404 cho đường dẫn không tồn tại. Request 404 duy nhất do browser tự phát là favicon tùy chọn, không phải request ứng dụng bắt buộc.

Ảnh kiểm chứng: [Home có HCM202](screenshots/08-hcm202-course-home.png), [overview](screenshots/09-hcm202-overview.png), [Flashcard](screenshots/10-hcm202-flashcard.png), [Search](screenshots/11-hcm202-search.png) và [Quiz mobile](screenshots/12-hcm202-mobile-quiz.png).

## Biên an toàn

- Registry/profile dùng exact fields, ID grammar chặt và chặn tên prototype-reserved.
- Path relative được resolve và buộc nằm dưới `content/subjects` hoặc `content/`; traversal, absolute path, symlink escape và alias path bị từ chối.
- Chuỗi phải NFC, không control/bidi nguy hiểm; file/bank/field có size cap.
- Question schema, bốn options, answer range, quota, source evidence, trùng lặp và answer pattern được kiểm định theo từng profile.
- JSON inline escape `<`, U+2028, U+2029; SVG/CSS/script/image game có allowlist và active-content checks riêng.
- Runtime render text bằng DOM an toàn; raw source không qua public boundary.
- YouTube dùng `youtube-nocookie.com`, lazy iframe 16:9, không autoplay và teardown khi rời lecture.

## Rollback

1. `python build_html.py` không promote nếu validation, manifest, budget hoặc final snapshot thất bại; staging được dọn và release cũ giữ nguyên.
2. Khi promotion bắt đầu, transaction backup/restore cả root `index.html`, `dist/` và root `vercel.json`; rollback bình thường phục hồi byte-for-byte, rollback lỗi hiếm giữ recovery directory thay vì xóa backup.
3. Trước production promotion, lưu deployment ID Vercel tốt gần nhất. Nếu lỗi route, nội dung, video, game hoặc storage, promote lại deployment đó.
4. Revert đúng commit release rồi rebuild từ source snapshot trước. Không dùng `git reset --hard` trên worktree có thay đổi người dùng.
5. Không xóa browser storage. Chỉ thu thập payload lỗi khi người dùng đồng ý và phải loại dữ liệu duyệt web cá nhân.

## Review finding đã xử lý

- Builder trước đây đọc template ngoài snapshot window. Flow hiện là snapshot → reread template → render → snapshot, nên bytes được render chính là bytes nằm trong manifest đã kiểm tra.

## Rủi ro còn mở trước deployment

- Vercel preview/production header, deep-link và source-404 smoke chưa chạy; không được coi local HTTP evidence là bằng chứng đã deploy.
- YouTube playback qua mạng thật, screen reader và zoom 200% vẫn là manual verification.
- Playlist/sáu video hiện được khóa bằng regression tests; nếu cần fail-closed độc lập với test runner, nên đưa identity vào metadata/sign-off đã ký ở một phase riêng.

## Tham chiếu

- [Kế hoạch tổng thể](../plans/260802-multi-course-study-hub/plan.md)
- [Phase 2 — validation/build](../plans/260802-multi-course-study-hub/phase-02-multi-subject-validation-build-pipeline.md)
- [Phase 4 — router/workspace](../plans/260802-multi-course-study-hub/phase-04-course-home-dynamic-workspace.md)
- [Phase 5 — regression](../plans/260802-multi-course-study-hub/phase-05-automated-validation-regression.md)
- [Phase 6 — release/rollback](../plans/260802-multi-course-study-hub/phase-06-production-build-release-rollback.md)
