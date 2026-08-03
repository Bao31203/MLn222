# Independent review — VNR202 Chương 2

## Phạm vi, artifact và kết luận hiện tại

- Reviewer: reviewer độc lập, không phải tác giả `chapter-02.json`.
- Ngày review ban đầu và tái duyệt: 2026-08-03.
- Phạm vi: `VNR202-C02-Q001`–`VNR202-C02-Q120`; đã đọc lại ngữ nghĩa `120/120` câu trên artifact mới. Với từng câu, reviewer kiểm `stem`, bốn `options`, `answer`, `difficulty`, `kind`, `explanation`, `source.section`, `source.text` và thử bảo vệ riêng cả ba distractor.
- Artifact review ban đầu: SHA-256 `344fc309d51173380db8da50d92646ea04e93589f2c5162a7e825ca09ed76646` (`193361` byte).
- Artifact tái duyệt vòng một: SHA-256 `0049548ec31ff2bcf6aa96b589acfd383d3fe1fbccc678659a5b307199f6ba1a` (`199283` byte).
- Artifact đang được tái duyệt bổ sung (từng được phê duyệt ở vòng trước): SHA-256 `e701284dbe2c03014f686764dff14f1ed777c4f1b196e7283a5f81fbf39f83cd` (`199605` byte).
- Source snapshot: SHA-256 `a686d4395752bf70302dff62cbf1502187f19ebcd1e9406a9a402e97b76799bc` (`831134` byte), không đổi so với review ban đầu.
- Phạm vi remediation vòng một do tác giả khai báo là 52 ID; reviewer không dựa vào self-check đó để đóng finding mà đọc lại toàn bộ 120 câu, kiểm riêng 52 câu bị tác động và đối chiếu lại các đoạn nguồn liên quan. Delta cuối chỉ đổi Q021 và Q052; reviewer tái duyệt độc lập hai câu, các câu cùng mục lá, quota, cue, độ dài, pattern, duplicate và blueprint trên toàn Chương 2.
- Tái duyệt bổ sung trên đúng hash `e701284d…f83cd`: reviewer red-team thủ công 18 option set có tín hiệu cue rộng và quét historical-safety toàn bộ `24/24` câu Vận dụng; không sửa file câu hỏi.
- Kết luận hiện tại: `CHANGES_REQUESTED` cho artifact Chương 2 SHA-256 `e701284d…f83cd`. Phê duyệt vòng trước bị thay thế vì H-04 và M-04 còn mở; không sign-off khi finding High/Medium chưa đóng.

Tài liệu điều khiển đã dùng: `AUTHORING.md`, `ERRATA.md`, `subject.json`, `bank-config.json`, merged `blueprint.json`, fragment `blueprint-ch1-ch3a.json`, cùng ba hợp đồng `authoring-contract`, `output-contract`, `review-signoff` của skill.

## Tổng findings sau tái duyệt bổ sung

| Severity | Tổng | Open | Resolved |
|---|---:|---:|---:|
| Critical | 0 | 0 | 0 |
| High | 4 | 1 | 3 |
| Medium | 4 | 1 | 3 |
| Low | 1 | 0 | 1 |
| **Tổng** | **9** | **2** | **7** |

## Critical

Không phát hiện finding Critical: không có đáp án sai, câu có nhiều đáp án đúng, claim ngoài corpus nghiêm trọng hoặc lỗi làm mất độ tin cậy toàn bộ chương.

## High

### H-01 — 41/120 câu — cue tuyệt đối ở distractor tạo quy tắc loại đáp án

- Severity: High
- Finding ban đầu: 41 câu có ít nhất hai distractor mang cue tuyệt đối trong khi đáp án đúng không có cue; người học có thể loại phương án theo văn phong.
- IDs ban đầu: `Q025`, `Q029`, `Q038`, `Q043`, `Q048`, `Q050`, `Q051`, `Q053`, `Q057`, `Q062`, `Q064`, `Q066`–`Q071`, `Q075`–`Q078`, `Q081`, `Q083`–`Q086`, `Q088`, `Q090`–`Q092`, `Q097`, `Q106`, `Q108`, `Q109`, `Q111`–`Q113`, `Q115`–`Q117`, `Q120`.
- Re-review: exact scan theo lexicon contract cho kết quả `0` câu vi phạm quy tắc “đáp án không cue nhưng từ hai distractor trở lên có cue”. Reviewer đọc lại cả 41 câu, kiểm các từ bị sửa nằm trong near-miss có nghĩa và không phát hiện distractor bị hỏng do chỉ xóa từ máy móc.
- Status: `resolved`; exact cue gate được xác nhận lại trên artifact SHA-256 `e701284d…f83cd`.

### H-02 — 14 rolling windows — vượt gate độ dài cục bộ

- Severity: High
- Finding ban đầu: 14 cửa sổ 20 câu vượt ngưỡng `14/20`, cực đại `16/20` đáp án đúng ở vị trí dài/ngắn duy nhất.
- Re-review cuối: đáp án đúng dài duy nhất `33/120`, ngắn duy nhất `30/120`; không có cửa sổ nào vượt ngưỡng, cực đại hiện là đúng `14/20`. Độ dài trung bình đáp án đúng/distractor là `82,517/83,117`, chênh `0,72%`.
- Status: `resolved` trên artifact SHA-256 `e701284d…f83cd`.

### H-03 — Blueprint Chương 2 — thiếu toàn bộ `questionIds`

- Severity: High
- Finding ban đầu: 24 nhóm Chương 2 ở trạng thái `covered` có target tổng `120` nhưng không có `questionIds`.
- Re-review: cả merged `content/subjects/vnr202/blueprint.json` và fragment `plans/260802-vnr202-question-bank/blueprint-ch1-ch3a.json` hiện ánh xạ đủ `120` ID, `120` ID duy nhất, không thiếu, không thừa, không trùng. Cả 24 nhóm đạt `target` và `difficultyTargets`; mapping Chương 2 của hai blueprint giống hệt nhau. Q077 thuộc đúng `c02-b04-democratic-policy-1936-1939`.
- Status: `resolved` trên blueprint hiện tại và artifact SHA-256 `e701284d…f83cd`.

### H-04 — 18/120 câu — đáp án cân bằng duy nhất, distractor tự loại bằng phủ định/cắt bỏ

- Severity: High
- IDs: `Q002`, `Q023`, `Q033`, `Q046`, `Q049`, `Q061`, `Q074`, `Q078`, `Q079`, `Q082`, `Q083`, `Q088`, `Q094`, `Q100`, `Q101`, `Q112`, `Q118`, `Q119`.
- Lý do: exact cue gate hẹp vẫn pass, nhưng red-team không cần kiến thức cho thấy cả `18/18` tập ứng viên là lỗi near-miss thực, `0/18` false positive sau khi reviewer đọc đủ bốn option, che answer, thử bảo vệ từng distractor và đối chiếu source. Correct answer luôn là lựa chọn đầy đủ/cân bằng duy nhất; ít nhất hai distractor tự loại bằng phủ định, chỉ dựa vào một mặt, gác bỏ, tách rời, thay thế hoặc mở rộng/thu hẹp cực đoan một thành tố.
- Bằng chứng: Q023 dùng ba distractor “Tách…”, “Thay…” và “Chỉ…”; Q046 dùng “bỏ qua”, “Chỉ…” và “dừng lại”; Q082 để ba distractor lần lượt thu hẹp, phủ định và tách lực lượng; Q094 dùng “Thay…”, “Chỉ… không…” và “loại… khỏi”; Q118 để cả ba distractor dùng `chỉ/không`; Q119 dùng các trình tự công khai bỏ chuẩn bị, từ chối phối hợp hoặc cô lập nông thôn. Q088 và Q100 vẫn là lỗi thật dù mỗi câu có một distractor tương đối khả tín, vì hai distractor còn lại tự loại bằng phủ định/cực đoan và answer giữ giọng cân bằng duy nhất.
- Kiểm false positive: cụm trung tính “thay đổi” ở Q078 không được tính như cue `thay thế`; Q078 vẫn thuộc finding vì C gác cả hai nhiệm vụ và D giao quyền quyết định cho chính quyền thực dân, khiến A nổi bật theo văn phong. Source logical lines `635–2720` bảo vệ các answer; finding nằm ở chất lượng và tính song song của option set, không phải answer correctness.
- Tác động: pattern lặp ở `15%` chương cho phép tăng xác suất chọn đúng mà chưa cần nắm nội dung, trái yêu cầu distractor phải là near-miss có thể bảo vệ.
- Đề xuất: viết lại distractor thành near-miss cùng phạm trù và cấu trúc, chỉ sai một chủ thể, mốc, quan hệ, phạm vi hoặc điều kiện có thể nhầm thật; không sửa cơ học bằng cách chỉ xóa từ phủ định. Sau sửa phải che answer và red-team lại cả 18 option set cùng các cửa sổ lân cận.
- Status: `open`; chưa có artifact mới để re-review.

## Medium

### M-01 — VNR202-C02-Q077 — citation trỏ sai mục lá

- Severity: Medium
- Finding ban đầu: claim cũ của Q077 nằm ngoài `source.section` đã khai báo.
- Re-review: Q077 đã được viết lại để hỏi cách xử lý quan hệ phản đế–điền địa năm 1936. Đáp án C, explanation và `source.text` đều được bảo vệ trực tiếp trong logical lines `1701–1791`: không gắn hai nhiệm vụ một cách máy móc; khi xung đột phải xác định kẻ thù chính để tập trung lực lượng dân tộc. Citation và ownership `c02-b04` hiện thống nhất.
- Status: `resolved` trên artifact SHA-256 `e701284d…f83cd`.

### M-02 — VNR202-C02-Q095 — dùng proper noun thuộc `ambiguous-do-not-use`

- Severity: Medium
- Finding ban đầu: distractor chứa biến thể `Võ Nhai`/`Vũ Nhai` bị `ERRATA.md` cấm dùng.
- Re-review: Q095 không còn hai biến thể này. Câu hiện phân biệt chuẩn bị lực lượng chính trị với lực lượng vũ trang; đáp án C ghép đúng đoàn thể cứu quốc trong Việt Minh với Cứu quốc quân, đội tự vệ và du kích. Bốn lựa chọn cùng phạm trù và chỉ có một đáp án được nguồn bảo vệ.
- Status: `resolved` trên artifact SHA-256 `e701284d…f83cd`.

### M-03 — 24/24 câu gắn `Vận dụng` đạt semantic difficulty

- Severity: Medium
- Finding ban đầu: 18/24 câu gắn `Vận dụng` chỉ bọc một thao tác nhớ/nhận diện bằng tình huống.
- Re-review vòng một: 16 câu trong tập ban đầu đã được viết thành tình huống có dữ kiện và buộc chọn cách áp dụng nguyên tắc: `Q010`, `Q025`, `Q030`, `Q034`, `Q044`, `Q053`, `Q058`, `Q064`, `Q069`, `Q073`, `Q097`, `Q102`, `Q109`, `Q113`, `Q116`, `Q120`. Cùng sáu câu đã đạt từ review trước (`Q016`, `Q039`, `Q078`, `Q084`, `Q087`, `Q092`), vòng một đạt `22/24`.
- Re-review cuối Q021: tình huống hiện cung cấp ba dữ kiện chẩn đoán — đã đòi quyền dân tộc nhưng còn dựa vào cải cách chính quốc, chưa xác định lực lượng và chưa có tổ chức cách mạng. Người học phải vận dụng nguyên tắc của bước chuyển lập trường Nguyễn Ái Quốc để chọn đồng thời lý luận cách mạng vô sản về dân tộc/thuộc địa, liên hệ Quốc tế Cộng sản và xây dựng tổ chức cộng sản. Đây không còn là yêu cầu chép lại chuỗi mốc. Ba distractor là các khuynh hướng cải lương, cầu viện dân chủ tư sản và quân chủ; không phương án nào giải quyết đủ ba thiếu hụt.
- Re-review cuối Q052: tình huống hiện nêu hai vấn đề xã hội cụ thể — bất bình đẳng giới và con em công nông khó tiếp cận giáo dục — rồi yêu cầu chọn gói xử lý. Người học phải ánh xạ hai nguyên tắc xã hội của Cương lĩnh vào hai dữ kiện mới; đáp án C giải quyết đúng cả hai bằng nam nữ bình quyền và phổ thông giáo dục theo hướng công nông hóa. Các distractor chỉ giải quyết kinh tế, một phần giáo dục hoặc duy trì bất bình đẳng.
- Source check: Q021 được logical lines `915–970` bảo vệ; Q052 được logical lines `1259–1357` bảo vệ. Citation, explanation và blueprint ownership lần lượt khớp `c02-a05-nguyen-ai-quoc-path` và `c02-a11-first-platform`.
- Status: `resolved` trên artifact SHA-256 `e701284d…f83cd`; semantic difficulty đạt `24/24` câu Vận dụng.

### M-04 — 5/24 câu Vận dụng — bạo lực lịch sử bị chuyển thành chỉ dẫn hành động hiện tại

- Severity: Medium
- IDs: `Q064`, `Q092`, `Q097`, `Q102`, `Q120`.
- Lý do: năm stem dùng tình huống hiện tại, phi định danh rồi hỏi chủ thể “nên” tổ chức hoặc xử lý thế nào. Q064 khuyên một khu công nghiệp phối hợp đấu tranh chính trị với đấu tranh vũ trang; Q092 yêu cầu chọn kế hoạch chuẩn bị khởi nghĩa từng phần để tiến tới tổng khởi nghĩa; Q097 hướng dẫn một đơn vị vũ trang mới kết hợp tác chiến, vũ trang tuyên truyền, gây cơ sở và mở rộng căn cứ; Q102 đề xuất tổ chức quần chúng phá kho lương của quân chiếm đóng để tạo đà giành quyền làm chủ; Q120 khuyên địa phương tự quyết cách thức và thời điểm chớp thời cơ giành chính quyền. Các hành động này có căn cứ lịch sử trong source nhưng cách đóng khung đã biến mô tả quá khứ thành lời khuyên vận hành có thể tách khỏi môn học.
- Historical-safety scan: reviewer đọc đủ `24/24` câu Vận dụng. `19/24` câu còn lại (`Q010`, `Q016`, `Q021`, `Q025`, `Q030`, `Q034`, `Q039`, `Q044`, `Q052`, `Q053`, `Q058`, `Q069`, `Q073`, `Q078`, `Q084`, `Q087`, `Q109`, `Q113`, `Q116`) chỉ yêu cầu nhận diện, phân tích hoặc áp dụng khái niệm/chính sách ở mức không tác chiến; không ghi thêm false positive.
- Đề xuất: neo rõ chủ thể, thời gian và sự kiện quá khứ, rồi hỏi phân tích quyết định đã diễn ra hoặc quan hệ lịch sử; tránh cấu trúc phi định danh “một kế hoạch/đơn vị/địa phương nên làm gì” đối với khởi nghĩa, tác chiến, phá kho hoặc giành chính quyền.
- Status: `open`; chưa có artifact mới để re-review.

## Low

### L-01 — VNR202-C02-Q017 — stem hỏi “ý nghĩa” nhưng đáp án trả lời “quyết định gì”

- Severity: Low
- Finding ban đầu: stem và options không song song về thao tác.
- Re-review: stem hiện hỏi trực tiếp “Năm 1911, Nguyễn Tất Thành quyết định làm gì…?”; đáp án B “Ra đi tìm một con đường cứu nước mới…” trả lời đúng loại thông tin và được logical lines `917–923` bảo vệ.
- Status: `resolved` trên artifact SHA-256 `e701284d…f83cd`.

## Checklist review 120/120

| Nhóm blueprint | Source logical lines | Question IDs | Đã kiểm |
|---|---:|---|---:|
| `c02-a02-world-context` | 635–665 | Q001–Q003 | 3/3 |
| `c02-a03-vietnam-context` | 666–794 | Q004–Q010 | 7/7 |
| `c02-a04-patriotic-movements` | 795–914 | Q011–Q016 | 6/6 |
| `c02-a05-nguyen-ai-quoc-path` | 915–970 | Q017–Q021 | 5/5 |
| `c02-a06-ideological-preparation` | 971–999 | Q022–Q025 | 4/4 |
| `c02-a07-political-preparation` | 1000–1031 | Q026–Q030 | 5/5 |
| `c02-a08-organizational-preparation` | 1032–1108 | Q031–Q034 | 4/4 |
| `c02-a09-communist-organizations` | 1109–1178 | Q035–Q039 | 5/5 |
| `c02-a10-unification-conference` | 1179–1258 | Q040–Q044 | 5/5 |
| `c02-a11-first-platform` | 1259–1357 | Q045–Q053 | 9/9 |
| `c02-a12-party-formation-significance` | 1358–1403 | Q054–Q058 | 5/5 |
| `c02-b01-movement-1930-1931` | 1404–1494 | Q059–Q064 | 6/6 |
| `c02-b02-october-1930-thesis` | 1495–1581 | Q065–Q069 | 5/5 |
| `c02-b03-restoration-1932-1935` | 1582–1700 | Q070–Q073 | 4/4 |
| `c02-b04-democratic-policy-1936-1939` | 1701–1791 | Q074–Q078 | 5/5 |
| `c02-b05-democratic-movement-1936-1939` | 1792–1890 | Q079–Q084 | 6/6 |
| `c02-b06-strategic-shift-1939` | 1891–1946 | Q085–Q087 | 3/3 |
| `c02-b07-completion-shift-1941` | 1947–2040 | Q088–Q092 | 5/5 |
| `c02-b08-force-preparation` | 2042–2190 | Q093–Q097 | 5/5 |
| `c02-b09-anti-japanese-high-tide` | 2191–2309 | Q098–Q102 | 5/5 |
| `c02-b10-august-general-uprising` | 2310–2552 | Q103–Q109 | 7/7 |
| `c02-b11-august-revolution-nature` | 2553–2613 | Q110–Q113 | 4/4 |
| `c02-b12-august-revolution-significance` | 2614–2669 | Q114–Q116 | 3/3 |
| `c02-b13-august-revolution-experience` | 2670–2720 | Q117–Q120 | 4/4 |
| **Tổng** | **635–2720** | **Q001–Q120** | **120/120** |

Các mục `c02-m00-goals`, `c02-a01-section-i` và `c02-m01-review` cũng được kiểm để xác nhận trạng thái `context-only`/`duplicate`; không có câu lấy từ metadata, tiêu đề hoặc câu ôn tập lặp. Ở vòng bổ sung, reviewer còn đọc lại riêng `18/18` option set thuộc H-04 và toàn bộ `24/24` câu Vận dụng thuộc historical-safety scan.

## Gate cấu trúc và red-team sau remediation

| Gate | Kết quả |
|---|---|
| JSON, exact schema, IDs | Pass: 120 object, exact fields; ID liên tục Q001–Q120 |
| Course/chapter | Pass: `courseId=vnr202`, `chapterNum=2`, title khớp `subject.json` |
| Options/answer | Pass: mỗi câu có bốn option khác nhau, `answer` trong 0–3; không phát hiện đáp án đúng thứ hai |
| Difficulty quota | Pass: `48 Nhận biết / 48 Thông hiểu / 24 Vận dụng`; semantic difficulty đạt 120/120, gồm 24/24 câu Vận dụng |
| Kind | Pass: `48 nhan_biet_khai_niem / 27 thong_hieu_phan_biet / 21 trinh_tu_quan_he / 24 van_dung_tinh_huong`; mọi cặp difficulty/kind phù hợp cả schema và ngữ nghĩa |
| Answer positions | Pass: `30/30/30/30` |
| Answer pattern | Pass: max run `2`; không có chu kỳ độ dài 2–4 lặp ba lần |
| Độ dài gộp | Pass: dài duy nhất `33/120`, ngắn duy nhất `30/120`, avg đúng/nhiễu `82,517/83,117`, delta `0,72%` |
| Độ dài rolling | Pass: `0` cửa sổ vượt `14/20`; max `14/20` |
| Exact absolute cue | Pass validator: `0` câu có đáp án không cue nhưng ít nhất hai distractor mang cue contract |
| Qualitative option cue | **Fail**: `18/120` option set là lỗi near-miss thực sau no-knowledge red-team; `0/18` false positive — H-04 |
| Duplicate chữ | Pass: 0 exact stem, 0 exact option-set; validator similarity không phát warning ở ngưỡng `0,82` |
| Duplicate objective | Pass sau đọc thủ công 120/120: không phát hiện hai câu đo cùng learning objective cần loại |
| Historical-safety framing | **Fail**: `5/24` câu Vận dụng biến bạo lực lịch sử thành lời khuyên hành động phi định danh — M-04 |
| Citation/source | Pass 120/120; Q077 đã khớp mục lá và blueprint ownership |
| ERRATA/out-of-corpus | Pass: Q095 không còn proper noun bị cấm; không phát hiện answer/explanation ngoài corpus |
| Unicode/public strings | Pass: UTF-8 NFC, không BOM, final LF; không control/bidi/HTML/URL/email/local path |
| Blueprint | Pass: 24 nhóm covered, 120/120 ID duy nhất; target và difficulty quota từng nhóm khớp |

Validator của skill, chạy riêng cho snapshot Chương 2 với `--warnings-as-errors`, đạt:

```text
PASSED · 120 câu · 0 error · 0 warning
Canonical bank SHA-256: c9dd84be61308ba054600d20c2ad20c38b28aaa914a97472a045ccd8245ade78
```

Kết quả validator trên là gate cấu trúc/tĩnh của snapshot và không bao phủ đầy đủ hai gate ngữ nghĩa thủ công H-04, M-04; vì vậy trạng thái `PASSED` của công cụ không thể dùng để giữ phê duyệt khi hai finding này còn mở.

`python validate_questions.py --subject vnr202 --check` vẫn chưa chạy được gate repository vì registry hiện trả `Unknown subject: vnr202`. Đây là giới hạn tích hợp ngoài artifact Chương 2; validator repo phải đạt sau khi subject được đăng ký và trước sign-off toàn bank.

## Trạng thái bàn giao

1. Review độc lập bổ sung Chương 2: `CHANGES_REQUESTED` trên SHA-256 `e701284dbe2c03014f686764dff14f1ed777c4f1b196e7283a5f81fbf39f83cd`.
2. Open findings: `Critical 0 / High 1 / Medium 1 / Low 0`; cần sửa đúng 18 ID H-04 và năm ID M-04 trước khi xin tái duyệt.
3. Reviewer không sửa `chapter-02.json`. Mọi artifact mới phải được khóa hash, chạy lại exact/qualitative cue và historical-safety, rồi đọc lại các câu bị tác động cùng cửa sổ lân cận trước khi đóng finding.
4. Sign-off toàn ngân hàng vẫn phải chờ đủ các chương, registry VNR202 và validator repository đạt; review cấp chương này không tự tạo hoặc thay thế `review-signoff.json`.
