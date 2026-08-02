# Review A — HCM202 Chương 1 và Chương 4

## Phạm vi và trạng thái

- Reviewer: Reviewer A độc lập; không phải tác giả `chapter-01.json` hoặc `chapter-04.json`.
- Phạm vi: 45/45 câu Chương 1 và 95/95 câu Chương 4; tổng cộng 140 câu, 560 phương án.
- Nguồn duy nhất: `Giáo trình tư tưởng Hồ Chí Minh.md`, SHA-256 `2DF4AE100168AFAE7BD7830705DB466FB1C1A36474576F3CF8E0F2741C1CEEC4`, 444.353 byte.
- Vùng nguồn đã đọc toàn bộ: Chương 1 dòng 19–732; Chương 4 dòng 3973–5652. Không dùng metadata Studocu hoặc mục lục lặp từ dòng 8919.
- Artifact vòng 1 đã review:
  - Chương 1: SHA-256 `E4601BCB996F483870D009A3C98B725CF2E71F780069EEA761B209B93AEAE3D3`, 77.168 byte.
  - Chương 4: SHA-256 `281D4959C9E3ECF2EF746F15D2F5CAB669F45353DCE8DFFB13BADC953D72F729`, 135.691 byte.
- Artifact remediation được tái duyệt độc lập:
  - Chương 1: SHA-256 `FEB9920628D8A4821962D5A31A32E41849BC8A940B53FC93B8BDE9974F5D6C9F`, 79.727 byte.
  - Chương 4: SHA-256 `71E2C19B3E12A70B13F4DFB845A014172C8A32BC5216618D7B6A16469E7BF7FA`, 138.381 byte.
- Artifact cue-remediation được khóa để sign-off cuối:
  - Chương 1: SHA-256 `CF7B207A358F3E9EC95685890A5C0A9E627E998D751B41E9FDCDB936B4D58C84`, 79.815 byte.
  - Chương 4: SHA-256 `AFA8536773EA53EE149A8B730EBC7F25312CF5A51A4AEE8D291055D2FD7A16B6`, 138.601 byte.
- Trạng thái vòng 3: **APPROVED / SIGNED OFF** trên đúng hai hash cue-remediation nêu trên. M-03 đã được đóng và bảy finding cũ không hồi quy.

## Phương pháp

1. Đọc toàn bộ `AUTHORING.md`, `ERRATA.md`, Phase 04 và thân hai chương nguồn trước khi đánh giá câu hỏi.
2. Kiểm tuần tự từng câu, không lấy mẫu: learning objective; difficulty/kind; stem; bốn phương án; đáp án; explanation; `source.section`; `source.text`.
3. Với từng distractor, thử diễn giải theo hướng làm nó đúng; đồng thời red-team các tín hiệu hình thức như từ tuyệt đối, khác phạm trù, độ dài và mức chi tiết.
4. Đối chiếu proper name, mốc lịch sử, lỗi OCR và các mục `ambiguous-do-not-use`; kiểm riêng phần vận dụng để không biến nội dung năm 2021 thành tuyên bố cập nhật đến năm 2026.
5. Chạy scan schema/quota, answer run, chu kỳ ngắn, độ dài toàn chương, theo blueprint và rolling window 20; kiểm NFC, unsafe token, trùng chính xác và similarity chéo đủ 480 câu.
6. Sau scan máy, tiếp tục so sánh learning objective bằng ngữ nghĩa; bước này phát hiện một cặp trùng mà các chỉ số câu chữ không bắt được.

## Checklist vòng 1 kiểm 100%

| Hạng mục | Đã kiểm | Kết quả |
|---|---:|---|
| Stem, learning objective, difficulty và kind | 140/140 | Đã kiểm; L-01 ghi một câu có thao tác cao hơn nhãn |
| Bốn options, một đáp án và khả năng bảo vệ từng distractor | 560/560 | Không phát hiện đáp án đúng thứ hai; H-01, L-02 và L-03 ghi các cue làm giảm sức phân hóa |
| Explanation | 140/140 | Không phát hiện explanation đảo đáp án; một số diễn giải vượt quá evidence mục lá nằm trong L-04 |
| Citation section và evidence | 140/140 | Nội dung nhìn chung bám đúng chương; L-04 yêu cầu làm citation/evidence kiểm chứng trực tiếp hơn |
| OCR, ERRATA, proper name và dữ kiện ngoài phạm vi | 140/140 | Không dùng chuỗi cấm, mốc sắc lệnh chưa xác minh hoặc metadata; không phát hiện proper name sai cần mở ledger mới |
| Phần vận dụng năm 2021 | 13/13 | 9 câu chưa có khung năm 2021 trong stem–explanation–evidence, xem M-01 |
| Tình huống và dữ kiện thời sự | 28/28 | Không biến luận điểm lịch sử thành chỉ dẫn bạo lực; M-01 xử lý nguy cơ hiểu là tuyên bố hiện hành |
| Trùng, na ná, pattern và độ dài | 140/140 | Scan chữ không có cặp ≥0,82; kiểm ngữ nghĩa phát hiện M-02; H-01 là pattern độ dài nghiêm trọng theo cửa sổ |

## Kết quả scan trên artifact sign-off cuối

| Gate | Chương 1 | Chương 4 |
|---|---:|---:|
| Số câu | 45 | 95 |
| Difficulty | 18/18/9 | 38/38/19 |
| A/B/C/D | 12/11/11/11 | 24/24/24/23 |
| Blueprint | 9/5/15/6/10 | 8/35/20/12/7/13 |
| Max answer run | 2 | 3 |
| Chu kỳ độ dài 2–4 lặp ba lần | 0 | 0 |
| Đáp án đúng dài duy nhất | 12/45 = 26,7% | 20/95 = 21,1% |
| Đáp án đúng ngắn duy nhất | 7/45 = 15,6% | 27/95 = 28,4% |
| Độ dài TB đúng/nhiễu | 88,20/86,78 = 1,0164 | 71,08/74,72 = 0,9514 |
| Câu có bốn độ dài khác nhau | 35 | 79 |
| Hạng đúng dài nhất/nhì/ba/ngắn nhất | 11/9/10/5 | 14/13/27/25 |
| Rolling window 20: max dài/ngắn duy nhất | 7/20 và 6/20 | 7/20 và 9/20 |
| Stem exact/fuzzy ≥0,82 nội bộ và chéo 480 câu | 0 | 0 |
| Unsafe/OCR token đã liệt kê trong ERRATA | 0 | 0 |

Hai chương đạt gate thống kê cấp chương, theo blueprint và theo cửa sổ. Không nhóm blueprint nào có ít nhất 8 câu vượt 60% đáp án đúng dài duy nhất hoặc ngắn duy nhất; Chương 4 không còn sự đảo pha dài/ngắn từng xuất hiện ở artifact vòng 1.

## Tái duyệt remediation và red-team vòng 2

Reviewer A đọc lại toàn bộ câu bị finding tác động và mọi phương án đã sửa, đối chiếu trực tiếp các đoạn nguồn liên quan; sau đó thử làm sai từng gate theo các hướng: đoán đáp án bằng độ dài, chọn phương án duy nhất không cực đoan, bảo vệ distractor như một đáp án thứ hai, đọc nội dung vận dụng như tuyên bố cập nhật đến 2026, và tìm objective tương đương bằng cách đổi bối cảnh.

| Finding vòng 1 | Kết quả tái duyệt trên hash mới | Verdict |
|---|---|---|
| H-01 | Q009–Q063 hiện có 14 đáp án dài duy nhất và 16 ngắn duy nhất; Q064–Q095 là 8/9; riêng Q069–Q095 là 7/7. Các nhóm Q064–Q075, Q076–Q082, Q083–Q095 lần lượt có 2/12, 2/7, 4/13 đáp án dài duy nhất. Rolling 20 toàn Chương 4 tối đa 7 dài và 9 ngắn, không còn chuỗi 27 đáp án dài duy nhất. | `resolved` |
| M-01 | Đủ 9/9 ID đã thêm khung “theo phần vận dụng của giáo trình xuất bản năm 2021” ở stem; cả 13 câu Q083–Q095 đều có dấu vết 2021 trong stem hoặc evidence và không tự nhận cập nhật đến 2026. | `resolved` |
| M-02 | C04-Q001 nay hỏi hai chức năng trong/ngoài của Đảng theo *Đường Kách mệnh*; C03-Q025 vẫn hỏi hình ảnh “người cầm lái”. Hai câu khác thao tác và tri thức đích; scan toàn bộ 480 câu không có stem/option-set trùng hoặc stem Jaccard ≥0,82. | `resolved` |
| L-01 | C01-Q017 đã bỏ tình huống mới, chuyển thành yêu cầu phân biệt hai mặt lập trường và khách quan khoa học; nhãn `Thông hiểu/thong_hieu_phan_biet` nay phù hợp mà quota 18/18/9 không đổi. | `resolved` |
| L-02 | Tái kiểm đủ 36 câu đã nêu và 144 lựa chọn: distractor được chuyển sang sai phạm vi, đảo quan hệ, thiếu điều kiện hoặc dùng đúng nguyên tắc sai hoàn cảnh; không còn câu trong danh sách dựa vào ba phương án cực đoan cùng kiểu để lộ đáp án. | `resolved` |
| L-03 | Độ dài A/B/C/D mới: C01-Q002 `72/78/81/83`; Q003 `96/102/99/103`; Q005 `107/104/94/96`; Q013 `110/101/109/109`; Q023 `81/91/100/97`; Q034 `103/104/107/102`; C04-Q008 `74/76/76/81`. Không câu nào còn mức lệch 31–51% đã nêu; Q001–Q009 Chương 1 còn 3/9 đáp án dài duy nhất. | `resolved` |
| L-04 | C01-Q041 nay hỏi trực tiếp yêu cầu đứng ngay trước phương châm trong mục IV.3; C04-Q043 bỏ “tư túng” khỏi evidence và giữ đúng dùng người/chống cục bộ; C04-Q063 rút đáp án về lợi ích toàn cục, lâu dài, không còn ba thủ tục ngoài mục lá. | `resolved` |

Red-team vòng 2 không phát hiện Critical/High mới, nhưng gate extended-cue chuẩn hóa phát hiện M-03 trên 22 câu ngoài danh sách L-02 vòng 1.

## Tái duyệt cue-remediation và red-team vòng 3

Reviewer A khóa lại hai artifact cuối theo SHA-256, đọc thủ công đủ 22/22 câu M-03 và 88/88 phương án, rồi chạy lại toàn bộ gate thay vì chỉ kiểm từ khóa. Các distractor đã sửa đều là near-miss có nghĩa theo sai phạm vi, thiếu điều kiện, đảo quan hệ hoặc sai thứ tự ưu tiên; không phát hiện đáp án đúng thứ hai và không có phương án được kéo dài bằng mệnh đề rỗng.

| Hạng mục | Bằng chứng trên hash sign-off | Verdict |
|---|---|---|
| M-03 | Exact Unicode token scan cho điều kiện “correct không cue nhưng có từ hai distractor cue trở lên” trả về `0/45` ở Chương 1 và `0/95` ở Chương 4. Cả 22 ID finding đều qua kiểm thủ công nội dung. | `resolved` |
| H-01 | Chương 4: Q009–Q063 còn 13 đáp án dài duy nhất và 16 ngắn duy nhất; Q064–Q095 là 6/9; Q069–Q095 là 5/8. Các nhóm Q064–Q075, Q076–Q082, Q083–Q095 lần lượt có 2/3, 1/3, 3/3 đáp án dài/ngắn duy nhất. Rolling 20 tối đa 7 dài và 9 ngắn. | không hồi quy |
| M-01 | Đủ 9/9 stem finding vẫn ghi rõ giáo trình xuất bản năm 2021; cả 13/13 câu Q083–Q095 có dấu vết 2021 trong stem hoặc evidence. | không hồi quy |
| M-02 | C04-Q001 vẫn đo hai chức năng trong/ngoài của Đảng; C03-Q025 vẫn đo hình ảnh người cầm lái. Toàn bộ 480 câu có `0` stem trùng chính xác, `0` option-set trùng và `0` cặp stem Jaccard ≥0,82. | không hồi quy |
| L-01 | C01-Q017 vẫn là câu phân biệt khái niệm với nhãn `Thông hiểu/thong_hieu_phan_biet`; quota Chương 1 giữ 18/18/9. | không hồi quy |
| L-02 | Gate extended-cue nghiêm hơn chạy trên toàn bộ hai chương trả về `0`; tái đọc các câu M-03 giao với vùng remediation cũ không phát hiện phương án cực đoan hóa mới. | không hồi quy |
| L-03 | Bảy bộ độ dài vẫn là C01-Q002 `72/78/81/83`, Q003 `96/102/99/103`, Q005 `107/104/94/96`, Q013 `110/101/109/109`, Q023 `81/91/100/97`, Q034 `103/104/107/102`, C04-Q008 `74/76/76/81`; Q001–Q009 Chương 1 có 3/9 đáp án dài duy nhất. | không hồi quy |
| L-04 | C01-Q041 vẫn hỏi yêu cầu trực tiếp trước phương châm; C04-Q043 giữ evidence dùng người/chống cục bộ; C04-Q063 giữ nguyên tắc lợi ích toàn cục, lâu dài. | không hồi quy |

Adversarial vòng 3 thử loại phương án bằng văn phong ngoài danh sách cue, bảo vệ distractor như đáp án thứ hai, đoán theo hạng độ dài từng blueprint và đọc các câu vận dụng như tuyên bố cập nhật đến năm 2026. Không phát hiện finding mới. Max answer run giữ ở 2/3, không có chu kỳ vị trí đáp án độ dài 2–4 lặp ba lần; schema, source, NFC, unsafe token và duplicate option đều sạch.

## Critical — 0

Không phát hiện finding Critical.

## High — 1 finding group

### H-01 — HCM202-C04-Q009–Q095 — đảo pha độ dài làm lộ đáp án theo từng đoạn

- **Lý do:** Gate toàn Chương 4 đạt `38/95 = 40%` đáp án đúng dài duy nhất, nhưng phân tích theo blueprint và cửa sổ cho thấy quy luật đoán được. Trong Q009–Q063, đáp án đúng là phương án ngắn duy nhất ở `34/55` câu; riêng rolling window Q039–Q058 đạt `16/20`. Từ Q064–Q095, đáp án đúng dài duy nhất ở `29/32` câu. Nghiêm trọng nhất, toàn bộ 27 câu liên tiếp Q069–Q095 đều có đáp án đúng dài duy nhất; vì vậy mọi rolling window 20 từ Q069–Q088 đến Q076–Q095 đều đạt `20/20`. Theo blueprint, tỷ lệ dài duy nhất là Q064–Q075 `9/12`, Q076–Q082 `7/7` và Q083–Q095 `13/13`. Người học có thể chọn phương án ngắn trong phần giữa rồi chuyển sang phương án dài từ cuối mục pháp quyền mà không cần nắm kiến thức.
- **Ví dụ:** Q026 `92/53/97/84` (đáp án B ngắn); Q045 `100/99/54/93` (C ngắn); Q055 `99/102/59/105` (C ngắn); sau điểm đảo chiều, Q072 `45/67/41/47` (B dài), Q082 `54/58/88/62` (C dài), Q084 `53/45/47/73` (D dài), Q087 `65/102/81/65` (B dài).
- **Đề xuất:** Viết lại các lựa chọn theo cùng phạm trù và cùng mức chi tiết, phân tán hạng độ dài trong từng nhóm blueprint và cửa sổ liên tiếp. Không kéo dài distractor bằng mệnh đề rỗng; ưu tiên near-miss ngắn gọn nhưng có sức thuyết phục. Chạy lại cả gate toàn chương, theo blueprint và rolling window 20.
- **Status:** `resolved` trên Chương 4 SHA-256 `71E2C19B…`; bằng chứng vòng 2 ở bảng tái duyệt phía trên.

## Medium — 3 finding groups

### M-01 — Chín câu phần vận dụng Chương 4 chưa đóng khung giáo trình năm 2021

- **IDs:** `HCM202-C04-Q084`, `Q085`, `Q087`, `Q089`, `Q091`, `Q092`, `Q093`, `Q094`, `Q095`.
- **Lý do:** Các câu lấy learning objective từ mục III về vận dụng xây dựng Đảng và Nhà nước, dùng cách nói hiện tại như “giai đoạn mới”, “cần”, “phải” nhưng cả stem, explanation và evidence đều không nói đây là cách trình bày của giáo trình xuất bản năm 2021. Người học có thể hiểu nhầm chúng là mô tả đã được cập nhật tới thời điểm sử dụng ngân hàng. Q083, Q086, Q088 và Q090 đã có khung năm 2021 nên không thuộc finding.
- **Đề xuất:** Ghi rõ trong stem hoặc cụm stem–explanation–evidence: “Theo phần vận dụng của giáo trình xuất bản năm 2021…”. Không thêm dữ kiện hoặc đánh giá sau năm 2021.
- **Status:** `resolved` trên Chương 4 SHA-256 `71E2C19B…`.

### M-02 — HCM202-C04-Q001 gần trùng hoàn toàn learning objective với HCM202-C03-Q025

- **Lý do:** Q001 hỏi hình ảnh Hồ Chí Minh dùng để ví vai trò của Đảng và đáp án là “người cầm lái điều khiển con thuyền”. C03-Q025 cũng hỏi vai trò của Đảng vững mạnh được so sánh thế nào và đáp án là “Đảng như người cầm lái; người cầm lái có vững thì thuyền mới chạy”. Citation khác chương nhưng thao tác nhớ, tri thức đích và kết luận đều giống nhau. Scan fuzzy câu chữ không bắt được cặp này, nhưng người học thực tế trả lời cùng một câu hai lần.
- **Đề xuất:** Chỉ giữ một objective “người cầm lái”. Thay Q001 hoặc phối hợp với owner Chương 3 để thay một câu bằng objective riêng, chẳng hạn hai chức năng “trong thì vận động, tổ chức dân chúng; ngoài thì liên lạc” hoặc tính tất yếu lãnh đạo xuyên suốt, đồng thời giữ quota hiện hành.
- **Status:** `resolved` trên Chương 4 SHA-256 `71E2C19B…`.

### M-03 — 22 câu còn ít nhất hai distractor mang extended cue trong khi đáp án đúng không có cue

- **IDs Chương 1:** `HCM202-C01-Q004`, `Q015`, `Q026`, `Q031`, `Q032`, `Q036`, `Q038`, `Q039`, `Q043`, `Q045`.
- **IDs Chương 4:** `HCM202-C04-Q005`, `Q027`, `Q035`, `Q041`, `Q047`, `Q049`, `Q053`, `Q061`, `Q068`, `Q077`, `Q092`, `Q093`.
- **Lý do:** Gate chuẩn hóa mở rộng kiểm các cue như `chỉ`, `mọi`, `toàn bộ`, `hoàn toàn`, `không cần`, `tự động`, `duy nhất`, `bất kỳ`, `thay thế`, `đứng ngoài`, `khép kín`, `loại bỏ`, `phủ nhận`, `tuyệt đối`, `không bao giờ`, sau đó Reviewer A kiểm thủ công theo ngữ cảnh. Trong mỗi ID trên, đáp án đúng không mang cue nhưng ít nhất hai distractor dùng cấu trúc tuyệt đối hóa, phủ định sạch một điều kiện hoặc thu hẹp phạm vi quá lộ. Ví dụ C01-Q015 đặt ba cách làm cực đoan cạnh yêu cầu cân bằng lập trường–khách quan; C04-Q047 đặt ba mô hình một chiều cạnh phương án kết hợp dân chủ–tập trung; C04-Q093 dùng cả “đứng ngoài Hiến pháp” và “chỉ định hướng… không chịu trách nhiệm”. Pattern vẫn cho phép loại phương án theo văn phong trước khi vận dụng kiến thức.
- **Đề xuất:** Với từng ID, giữ đáp án và objective nhưng viết lại distractor thành near-miss cùng phạm trù: sai thứ tự ưu tiên, thiếu đúng một thành tố, đảo quan hệ hoặc áp dụng đúng nguyên tắc trong sai phạm vi. Sau sửa, correct không cue phải còn không quá một distractor cue; không xóa keyword cơ học hoặc thêm padding rỗng. Chạy lại exact row gate, độ dài/rolling, quota và validator.
- **Kết quả sign-off:** Exact gate trả về `0` ở cả hai chương; 22/22 câu và 88/88 phương án đã được tái đọc, không có đáp án đúng thứ hai hoặc padding rỗng. Các chỉ số độ dài, quota và validator đều đạt trên Chương 1 SHA-256 `CF7B207A…` và Chương 4 SHA-256 `AFA85367…`.
- **Status:** `resolved`.

## Low — 4 finding groups

### L-01 — HCM202-C01-Q017 — difficulty/kind thấp hơn thao tác thực tế

- **Lý do:** Câu được gắn `Thông hiểu/thong_hieu_phan_biet`, nhưng đưa một tình huống nghiên cứu mới, yêu cầu người học áp dụng nguyên tắc tính đảng – tính khoa học để chọn quy trình xử lý chứng cứ. Thao tác này tương đương các câu `Vận dụng/van_dung_tinh_huong` khác trong chương, không chỉ phân biệt khái niệm.
- **Đề xuất:** Hoặc viết lại thành câu phân biệt khái quát để giữ quota Thông hiểu, hoặc đổi difficulty/kind và cân đối một câu khác để ma trận 18/18/9 không thay đổi.
- **Status:** `resolved` trên Chương 1 SHA-256 `FEB99206…`.

### L-02 — Distractor tuyệt đối hóa lặp dày, đặc biệt ở Chương 1

- **IDs Chương 1:** `HCM202-C01-Q002`, `Q007`, `Q009`, `Q010`, `Q011`, `Q013`, `Q014`, `Q017`, `Q020`–`Q025`, `Q027`–`Q029`, `Q033`–`Q035`, `Q037`, `Q040`, `Q042`, `Q044`.
- **IDs Chương 4:** `HCM202-C04-Q017`, `Q030`, `Q034`, `Q037`, `Q045`, `Q049`, `Q056`, `Q057`, `Q075`, `Q082`, `Q088`, `Q094`.
- **Lý do:** Trong mỗi câu nêu trên, cả ba distractor hoặc gần như cả ba cùng dựa vào tín hiệu dễ loại như “chỉ”, “mọi”, “toàn bộ”, “hoàn toàn”, “không cần”, “tự động”, hoặc phủ định sạch một điều kiện hiển nhiên. Không có đáp án đúng thứ hai, nhưng người học có thể chọn phương án cân bằng duy nhất theo văn phong thay vì phân biệt nội dung.
- **Đề xuất:** Thay ít nhất một hoặc hai distractor mỗi câu bằng near-miss đúng phạm trù: sai thứ tự ưu tiên, thiếu một điều kiện, đảo quan hệ nền tảng–phạm vi hoặc áp dụng đúng nguyên tắc nhưng sai hoàn cảnh. Không chỉ xóa từ tuyệt đối mà vẫn giữ một phương án vô lý.
- **Status:** `resolved` trên Chương 1 SHA-256 `FEB99206…` và Chương 4 SHA-256 `71E2C19B…`.

### L-03 — Bảy câu lệch độ dài đáng chú ý ngoài pattern H-01

- **IDs và độ dài A/B/C/D:** C01-Q002 `57/64/81/62` (C); C01-Q003 `71/107/85/77` (B); C01-Q005 `81/116/89/78` (B); C01-Q013 `89/92/123/92` (C); C01-Q023 `72/78/100/67` (C); C01-Q034 `109/91/83/76` (A); C04-Q008 `48/48/76/55` (C).
- **Lý do:** Đáp án đúng dài hơn trung bình distractor khoảng 31–51%. Ở nhóm đầu Chương 1, sáu trong chín câu Q001–Q009 có đáp án đúng dài duy nhất; trên bảy câu không hòa hạng của nhóm này, đáp án đúng đứng hạng dài nhất sáu lần. Đây là cue cục bộ dù rolling window 20 của Chương 1 không vượt `9/20`.
- **Đề xuất:** Cân bằng mức chi tiết giữa bốn lựa chọn và viết distractor gần-miss cùng cấu trúc; không thêm padding máy móc vào phương án sai.
- **Status:** `resolved` trên Chương 1 SHA-256 `FEB99206…` và Chương 4 SHA-256 `71E2C19B…`.

### L-04 — Ba citation/evidence chưa bám trực tiếp mục lá

- **HCM202-C01-Q041:** Mục IV.3 chỉ nêu phương châm “Dĩ bất biến ứng vạn biến” sau yêu cầu rèn phong cách phù hợp từng lúc, từng nơi; citation hiện tại tự diễn giải “bất biến” thành mục tiêu, nguyên tắc cốt lõi mà đoạn mục lá không nói rõ. Nên hỏi trực tiếp ý nghĩa linh hoạt theo hoàn cảnh trong đúng đoạn, hoặc dẫn đoạn nguồn thực sự giải thích hai vế.
- **HCM202-C04-Q043:** Mục I.2.c trực tiếp nêu dùng người đúng và chống địa phương cục bộ, nhưng `source.text` thêm “tư túng”, thuật ngữ được trình bày ở II.3.b. Nên bỏ phần vượt leaf và giữ objective về cục bộ địa phương, hoặc đổi citation phù hợp với nội dung được hỏi.
- **HCM202-C04-Q063:** Mục II.1.d hỗ trợ lựa chọn lợi ích toàn cục, lâu dài, nhưng đáp án còn yêu cầu “giảm tác động, công khai giải thích và tiếp nhận phản hồi”; ba thủ tục này không được evidence mục lá hiện tại xác lập. Nên rút đáp án về nguyên tắc trực tiếp từ đoạn hoặc trỏ nguồn đủ rõ cho các điều kiện bổ sung.
- **Status:** `resolved` trên Chương 1 SHA-256 `FEB99206…` và Chương 4 SHA-256 `71E2C19B…`.

## Tổng hợp và quyết định sign-off cuối

| Mức | Tổng finding | Open sau vòng 3 | Resolved |
|---|---:|---:|---:|
| Critical | 0 | 0 | 0 |
| High | 1 | 0 | 1 |
| Medium | 3 | 0 | 3 |
| Low | 4 | 0 | 4 |
| **Tổng** | **8** | **0** | **8** |

Kết luận: **APPROVED / SIGNED OFF** cho đúng Chương 1 SHA-256 `CF7B207A358F3E9EC95685890A5C0A9E627E998D751B41E9FDCDB936B4D58C84` và Chương 4 SHA-256 `AFA8536773EA53EE149A8B730EBC7F25312CF5A51A4AEE8D291055D2FD7A16B6`. Cả tám finding đã resolved. Bốn lệnh compose/validate cho riêng HCM202 và toàn catalog đều exit `0`; HCM202 có 480 câu, `0 errors`, `0 warnings`, difficulty `192/192/96`, đáp án `120/120/120/120`. Sign-off mất hiệu lực nếu một trong hai chapter thay đổi hash.
