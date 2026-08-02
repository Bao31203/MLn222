# Reviewer B — Chương 2 và Chương 6

## Phạm vi và trạng thái

| Chương | Phạm vi | Tiến độ | Kết luận hiện tại |
|---|---:|---:|---|
| Chương 2 | `HCM202-C02-Q001`–`HCM202-C02-Q075` | 75/75 (100%) | `APPROVED` tại đúng artifact lượt 4 |
| Chương 6 | `HCM202-C06-Q001`–`HCM202-C06-Q090` | 90/90 (100%) | `APPROVED` tại đúng artifact lượt 3 |

Reviewer B không phải tác giả Chương 2 hoặc Chương 6. Lượt 3 đã đối chiếu độc lập toàn bộ remediation của cả hai chương, kiểm lại từng finding cũ, thử bảo vệ từng distractor đã sửa và chạy lại các gate toàn chương, theo đoạn và theo cửa sổ. Lượt 4 re-review đúng phần sửa M-06 của Chương 2, đọc lại đủ 17 bộ lựa chọn bị gắn cờ, chạy exact cue gate và kiểm tra hồi quy trên toàn bộ Chương 2/6.

Artifact đã đọc và đối chiếu:

- Contract: `content/subjects/hcm202/AUTHORING.md`.
- Errata: `content/subjects/hcm202/ERRATA.md`.
- Quy trình: `plans/260802-hcm202-question-bank/phase-04-cross-review-fact-check-signoff.md`.
- Toàn bộ thân Chương 2 trong giáo trình Markdown, dòng 733–2194; không dùng mục lục lặp ở cuối file.
- Toàn bộ thân Chương 6 trong giáo trình Markdown, dòng 6903–8917; không dùng mục lục lặp từ dòng 8919.
- Snapshot giáo trình: SHA-256 `2DF4AE100168AFAE7BD7830705DB466FB1C1A36474576F3CF8E0F2741C1CEEC4`, 444.353 byte.
- Artifact Chương 2 được review ở lượt 1: SHA-256 `3BE805F79F911BD3310B875084501E2E0C16ADD46029D01D7FE09A1A75A72B0A`, 106.893 byte.
- Artifact Chương 6 được review ở lượt 2: SHA-256 `893E10FADEB01F20F8408EFCD47C764533BDA92381DFEC208030EF520CD19D4B`, 136.871 byte.
- Artifact Chương 2 được re-review ở lượt 3: SHA-256 `B5E4CD6499F7CE8FBED9271D42182BCCE9F41FF74FBE17EE705C0B62261377B9`, 110.542 byte.
- Artifact Chương 6 được re-review và approve ở lượt 3: SHA-256 `688402286E9CC5F0420B94A47E12EC314C81B682A815877C22D26BD596180790`, 140.397 byte.
- Artifact Chương 2 được re-review và approve ở lượt 4: SHA-256 `1C083E5453D35D6874DB8034B9C97AB44BF0D2EF71E664965CF61A6151561295`, 110.693 byte.

## Mapping remediation lượt 3–4

| Finding | Chương | Trạng thái | Bằng chứng chốt |
|---|---:|---|---|
| H-01 | 2 | `resolved` | Pattern dài/ngắn ở hai đoạn và mọi rolling window đã được phá vỡ |
| M-01 | 2 | `resolved` | Tên chuẩn đã có mục `verified-correction` trong ERRATA |
| M-02 | 2 | `resolved` | Q049 dùng bốn chuỗi hiện vật/sự kiện cùng loại |
| M-03 | 2 | `resolved` | Q056 và Q061 đo hai objective khác nhau |
| M-04 | 2 | `resolved` | Q064 bỏ thuật ngữ `hệ tư tưởng`, bám đúng câu nguồn |
| L-01 | 2 | `resolved` | Q011 bổ sung nhiệm vụ lựa chọn theo quan hệ tác động |
| L-02 | 2 | `resolved` | Q042/Q045/Q058 đã cân lại độ dài và cấu trúc |
| L-03 | 2 | `resolved` | Q047 dùng các quan hệ gần chủ đề Cương lĩnh |
| L-04 | 2 | `resolved` | Q068 trỏ tới đúng mục lá III.2.b |
| H-02 | 6 | `resolved` | Không còn câu nào có ít nhất hai distractor mang cue của finding |
| H-03 | 6 | `resolved` | Pattern Q025–Q039 và Q057–Q064 đã được phân tán |
| M-05 | 6 | `resolved` | Q082/Q086/Q089 chuyển sang ba objective riêng có căn cứ nguồn |
| L-05 | 6 | `resolved` | Q021 yêu cầu giải thích quan hệ giữa ba tính chất |
| M-06 | 2 | `resolved` | 17 bộ lựa chọn đã được thay bằng near-miss có nghĩa; exact cue gate còn 0 câu vi phạm |

## Bằng chứng review 100% Chương 2

| Nhóm blueprint | ID | Đã kiểm |
|---|---|---:|
| Thực tiễn Việt Nam và thế giới | Q001–Q011 | 11/11 |
| Truyền thống dân tộc, tinh hoa nhân loại, chủ nghĩa Mác – Lênin | Q012–Q026 | 15/15 |
| Nhân tố chủ quan Hồ Chí Minh | Q027–Q030 | 4/4 |
| Năm thời kỳ hình thành và phát triển | Q031–Q060 | 30/30 (`5/6/8/5/6`) |
| Giá trị đối với Việt Nam và nhân loại | Q061–Q075 | 15/15 |
| **Tổng** | **Q001–Q075** | **75/75** |

Với từng câu, reviewer đã kiểm stem/learning objective, difficulty-kind, bốn lựa chọn, thử bảo vệ từng distractor, đáp án, explanation, `source.section`, `source.text`, mốc lịch sử và quy tắc ERRATA.

Gate cấu trúc tại artifact lượt 4:

- 75 câu; difficulty `30/30/15`; vị trí A/B/C/D `18/19/19/19`.
- Blueprint `11/15/4/30/15`, trong đó năm thời kỳ `5/6/8/5/6`.
- Max answer run `3`; không có chu kỳ độ dài 2–4 lặp ba lần.
- Không có lỗi schema/ID/NFC/unsafe text/ERRATA đã cấm; không có stem trùng chuẩn hóa hoặc cặp Jaccard từ `0,65` trở lên.
- Gate độ dài đạt với `17/75 = 22,67%` đáp án đúng dài duy nhất; phân bố hạng trên 54 câu không hòa là `12/12/10/20`; độ dài trung bình đúng/nhiễu `75,12/78,45`; max tỷ lệ dài/ngắn trong một bộ lựa chọn là `2,00`.
- Rolling window 20 có cực đại dài/ngắn duy nhất `8/20` và `9/20`. Đoạn Q001–Q030 có `7/30` dài, `10/30` ngắn; đoạn Q053–Q075 có `9/23` dài, `3/23` ngắn, không còn đảo pha H-01.
- Scan chéo đủ 480 câu không có stem exact, similarity chữ từ `0,82` hoặc Jaccard từ `0,65` trở lên liên quan Chương 2/6.
- Exact cue scan theo lexicon contract còn `20/225` distractor chứa cue, `1/75` đáp án đúng chứa cue và `0/75` câu có ít nhất hai distractor mang cue khi đáp án đúng không mang cue. Rà thủ công 17 câu M-06 xác nhận các phương án mới là nhầm lẫn gần về quan hệ, phạm vi, điều kiện hoặc thứ tự ưu tiên, không phải thao tác xóa từ khóa.

## Tổng finding Chương 2

| Mức | Tổng | Open | Resolved |
|---|---:|---:|---:|
| Critical | 0 | 0 | 0 |
| High | 1 | 0 | 1 |
| Medium | 5 | 0 | 5 |
| Low | 4 | 0 | 4 |
| **Tổng** | **10** | **0** | **10** |

## Critical

Không có finding Critical.

## High

### H-01 — Q001–Q030 và Q053–Q075 — lộ quy luật đáp án theo độ dài ở từng đoạn

- **Lý do:** Chỉ số gộp toàn chương che giấu một đảo chiều rất dễ khai thác. Trong Q001–Q030, đáp án đúng là phương án ngắn duy nhất ở 21/30 câu và không câu nào có đáp án đúng dài duy nhất. Ngược lại, trong Q053–Q075, đáp án đúng dài duy nhất ở 19/23 câu (82,6%); trên 20 câu không hòa hạng độ dài của đoạn này, đáp án đúng đứng hạng dài nhất 18 lần. Các ví dụ rõ gồm Q056 (`39/46/47/89`), Q066 (`59/59/127/65`), Q068 (`93/60/49/40`), Q071 (`54/130/70/83`) và Q075 (`47/54/96/66`). Người học có thể đoán theo “chọn ngắn ở đầu, chọn dài ở cuối” dù tỷ lệ gộp 26,67% vẫn qua gate.
- **Đề xuất:** Viết lại lựa chọn theo cùng phạm trù và độ chi tiết, phân tán thứ hạng độ dài trong từng nhóm blueprint và cửa sổ liên tiếp; không kéo dài distractor máy móc. Chạy lại cả chỉ số toàn chương lẫn thống kê theo nhóm/cửa sổ sau sửa.
- **Bằng chứng re-review:** Trên artifact lượt 4, Q001–Q030 có `7/30` đáp án đúng dài duy nhất và `10/30` ngắn duy nhất; Q053–Q075 có `9/23` dài và `3/23` ngắn. Phân bố hạng toàn chương là `12/12/10/20` trên 54 câu không hòa; rolling window 20 đạt tối đa `8/20` dài và `9/20` ngắn. Các lựa chọn sửa dùng nội dung cùng phạm trù, không có dấu hiệu padding rỗng.
- **Status:** `resolved`.

## Medium

### M-01 — HCM202-C02-Q046 — chuẩn hóa tên tổ chức chưa có dấu vết ERRATA

- **Lý do:** Thân giáo trình tại dòng 1555 ghi `Hội Việt Nam thanh niên Cách mạng`, còn stem, explanation và citation đổi thành `Hội Việt Nam Cách mạng Thanh niên`. Cách gọi trong câu hỏi là cách gọi chuẩn và được nguồn chính thức xác nhận, nhưng đây vẫn là một sửa lỗi/chuẩn hóa proper noun chưa được ghi trong `ERRATA.md`, trái quy tắc audit “mọi lỗi chuyển đổi phải xử lý qua ERRATA”. Căn cứ đối chiếu: Bảo tàng Hồ Chí Minh, “Nguyễn Ái Quốc sáng lập Hội Việt Nam Cách mạng Thanh niên”: https://baotanghochiminh.vn/nguyen-ai-quoc-sang-lap-hoi-viet-nam-cach-mang-thanh-nien.htm.
- **Đề xuất:** Contract owner thêm mục `verified-correction` kèm căn cứ chính thức vào ERRATA; giữ tên chuẩn trong câu hỏi sau khi ledger được cập nhật.
- **Bằng chứng re-review:** `ERRATA.md` hiện có mục dòng 1555, chuẩn hóa sang `Hội Việt Nam Cách mạng Thanh niên` với trạng thái `verified-correction` và căn cứ Bảo tàng Hồ Chí Minh. Q046 dùng đúng dạng đã được ledger cho phép.
- **Status:** `resolved`.

### M-02 — HCM202-C02-Q049 — stem hỏi “chuỗi hiện vật” nhưng đáp án đúng không phải chuỗi hiện vật cụ thể

- **Lý do:** A–C liệt kê tên tác phẩm/tổ chức/sự kiện, còn D chỉ là ba nhãn giai đoạn khái quát (`Báo chí, liên kết thuộc địa → tổ chức quá độ, lý luận → ...`). D vì thế khác phạm trù, tự lộ là đáp án và không thực hiện đúng yêu cầu chọn “chuỗi hiện vật”.
- **Đề xuất:** Viết lại bốn lựa chọn thành các chuỗi cùng loại, cùng mức cụ thể; đáp án đúng nên nêu tuần tự các hiện vật/sự kiện tiêu biểu từ `Le Paria`/Hội Liên hiệp thuộc địa, qua Hội Việt Nam Cách mạng Thanh niên/Đường Kách mệnh, đến Hội nghị hợp nhất và Cương lĩnh đầu tiên.
- **Bằng chứng re-review:** Cả bốn phương án Q049 nay đều là chuỗi hiện vật/sự kiện cụ thể. Đáp án D giữ đúng trình tự Hội Liên hiệp thuộc địa/`Le Paria` → Hội Việt Nam Cách mạng Thanh niên/Thanh Niên/Đường Kách mệnh → Hội nghị hợp nhất/Cương lĩnh; ba distractor đảo đúng một hoặc hai chặng.
- **Status:** `resolved`.

### M-03 — HCM202-C02-Q056 và HCM202-C02-Q061 — gần trùng learning objective

- **Lý do:** Q056 hỏi ý nghĩa ngày 2-9-1945 và đưa “mở kỷ nguyên độc lập dân tộc gắn với chủ nghĩa xã hội” vào đáp án; Q061 lại hỏi trực tiếp Cách mạng Tháng Tám mở ra kỷ nguyên nào với chính nội dung đó. Hai câu kiểm tra lại cùng một kết luận, dù được đặt ở hai nhóm blueprint khác nhau.
- **Đề xuất:** Giữ Q056 tập trung duy nhất vào việc khai sinh nước Việt Nam Dân chủ Cộng hòa, hoặc thay Q061 bằng một objective riêng về giá trị của tư tưởng đối với thắng lợi và xây dựng xã hội mới.
- **Bằng chứng re-review:** Q056 hiện hỏi kết quả chính trị trực tiếp của ngày 2-9-1945 và đáp án chỉ xác định việc khai sinh nước Việt Nam Dân chủ Cộng hòa. Q061 giữ objective riêng về kỷ nguyên do thắng lợi Cách mạng Tháng Tám mở ra; stem, answer và explanation không còn lặp kết luận.
- **Status:** `resolved`.

### M-04 — HCM202-C02-Q064 — dùng thuật ngữ `hệ tư tưởng` rộng hơn căn cứ nguồn

- **Lý do:** Đáp án A gọi đây là “một hệ tư tưởng của người Việt”, trong khi đoạn được dẫn ở dòng 1967–1975 chỉ nói lần đầu “tư tưởng định hướng, soi đường, chỉ đạo” là của chính người Việt Nam. `Hệ tư tưởng` là một phân loại khái niệm mạnh hơn, không được citation này xác lập.
- **Đề xuất:** Đổi đáp án thành diễn đạt bám nguồn, chẳng hạn “Lần đầu trong lịch sử tư tưởng Việt Nam, tư tưởng của chính người Việt Nam định hướng, soi đường cho cách mạng và dân tộc Việt Nam”.
- **Bằng chứng re-review:** Q064 đã bỏ hoàn toàn thuật ngữ `hệ tư tưởng`; đáp án A và `source.text` diễn đạt đúng ý tại dòng 1967–1971 rằng tư tưởng của chính người Việt Nam định hướng, soi đường cho cách mạng và dân tộc Việt Nam.
- **Status:** `resolved`.

### M-06 — 17/75 câu Chương 2 — distractor tuyệt đối hóa còn tạo quy tắc loại đáp án

- **IDs:** Q004, Q005, Q019, Q023–Q025, Q029, Q030, Q046, Q060, Q063–Q067, Q071, Q075.
- **Lý do:** Red-team lượt 3 dùng đúng lexicon hẹp của H-02 và giữ nguyên dấu để phân biệt `mọi` với `mới`, `chỉ` với tên `Chí` hoặc động từ ghép. Kết quả còn `58/225 = 25,78%` distractor mang cue, trong khi chỉ `1/75` đáp án đúng mang cue; 17 câu có ít nhất hai distractor mang cue và đáp án đúng không có. Kiểm thủ công xác nhận đây không phải nhiễu máy: Q024 đặt `thay thế toàn bộ`/`chỉ bổ sung ... không`/`chỉ xác định` cạnh đáp án cân bằng; Q063 dùng `tùy ý ... không cần`/`chỉ ... không cần`/`chỉ`; Q064 dùng `hoàn toàn không cần ... bất kỳ`/`mọi ... đều không`/`chỉ`; Q066 dùng ba phủ định sạch quan hệ thực tiễn cạnh một đáp án cân bằng. Người học có thể loại phương án bằng văn phong ở một cụm đáng kể mà không cần phân biệt nội dung.
- **Đề xuất:** Viết lại distractor của 17 câu thành near-miss cùng phạm trù, sai một quan hệ, phạm vi hoặc điều kiện; không chỉ xóa từ khóa. Chạy lại cue scan và thử bảo vệ từng distractor như đã làm cho H-02 ở Chương 6.
- **Bằng chứng re-review lượt 4:** Q004, Q005, Q019, Q023–Q025, Q029, Q030, Q046, Q060, Q063–Q067, Q071 và Q075 đều đã được đọc lại đủ stem/options/answer/explanation/source. Mỗi distractor mới có nội dung có thể bảo vệ như một nhầm lẫn gần nhưng sai ở một quan hệ, phạm vi, điều kiện hoặc trình tự; không phát hiện phương án đúng thứ hai. Exact cue scan giảm từ `58/225` xuống `20/225` distractor mang cue, giữ `1/75` đáp án đúng mang cue và đưa số câu vi phạm gate từ `17` về `0`. Các gate độ dài, blueprint, rolling-window, quota và schema tiếp tục đạt.
- **Status:** `resolved`.

## Low

### L-01 — HCM202-C02-Q011 — nhãn `Vận dụng` cao hơn thao tác thực tế

- **Lý do:** Tình huống “xây dựng sơ đồ” chỉ yêu cầu nhận ra một danh sách tác nhân được giáo trình liệt kê trực tiếp; chưa buộc người học vận dụng nguyên tắc vào dữ kiện mới. Thao tác gần `Thông hiểu/trình tự-quan hệ` hơn.
- **Đề xuất:** Hoặc đổi difficulty-kind, hoặc bổ sung dữ kiện mới buộc người học suy ra quan hệ tác động thay vì chọn lại danh sách nguyên văn.
- **Bằng chứng re-review:** Q011 nay đặt nhiệm vụ tuyển chọn tư liệu cho triển lãm theo hai điều kiện mới: biến đổi sau Cách mạng Tháng Mười và tác động trực tiếp đến việc Nguyễn Ái Quốc xác lập con đường cách mạng vô sản. Bốn phương án đều là các nhóm biến đổi quốc tế; người học phải dùng quan hệ tác động để chọn chỉnh thể phù hợp, nên `Vận dụng/van_dung_tinh_huong` có thể bảo vệ được.
- **Status:** `resolved`.

### L-02 — HCM202-C02-Q042, HCM202-C02-Q045 và HCM202-C02-Q058 — lựa chọn lệch độ dài rõ

- **Lý do:** Tỷ lệ phương án dài nhất/ngắn nhất lần lượt vượt 2 lần (`23/18/41/16`, `27/20/15/7`, `63/48/54/24`). Dù đáp án đúng không luôn là phương án dài nhất, các lựa chọn rất ngắn như `Di chúc` hoặc `Chỉ đấu tranh ngoại giao` làm bộ distractor thiếu cân bằng.
- **Đề xuất:** Viết các lựa chọn cùng cấu trúc và mức thông tin; tránh bù độ dài bằng mệnh đề rỗng.
- **Bằng chứng re-review:** Độ dài A/B/C/D hiện là Q042 `44/40/65/38`, Q045 `27/15/15/20`, Q058 `78/69/74/78`; tỷ lệ dài nhất/ngắn nhất lần lượt `1,71`, `1,80`, `1,13`. Các phần bổ sung đều là thông tin phân biệt cùng loại, không phải mệnh đề đệm.
- **Status:** `resolved`.

### L-03 — HCM202-C02-Q047 — distractor khác phạm trù và quá dễ loại

- **Lý do:** Stem hỏi quan hệ được Cương lĩnh đầu tiên giải quyết, nhưng ba distractor nói về giáo dục–thương nghiệp, hành chính thành thị–nông thôn và văn học–nghệ thuật. Chúng không phải nhầm lẫn gần trong nội dung Cương lĩnh nên không thể bảo vệ hợp lý.
- **Đề xuất:** Thay bằng các tổ hợp quan hệ gần chủ đề nhưng sai một thành tố hoặc sai cách giải quyết, như dân tộc–giai cấp, độc lập–chủ nghĩa xã hội, Việt Nam–cách mạng thế giới.
- **Bằng chứng re-review:** Q047 nay dùng ba near-miss cùng phạm trù: tách dân tộc khỏi giai cấp, đồng nhất độc lập với xây dựng ngay đầy đủ chủ nghĩa xã hội, hoặc tách cách mạng Việt Nam khỏi cách mạng thế giới. Đáp án D kết hợp quan hệ giai cấp–dân tộc–quốc tế đúng với dòng 1591–1611.
- **Status:** `resolved`.

### L-04 — HCM202-C02-Q068 — citation chưa tới mục lá nhỏ nhất

- **Lý do:** Câu evidence ở cuối phần III.2.b nhưng `source.section` chỉ ghi `Chương 2 > III.2 Giá trị đối với sự phát triển tiến bộ của nhân loại`. Contract yêu cầu chỉ tới mục nhỏ nhất có thể.
- **Đề xuất:** Đổi `source.section` sang `Chương 2 > III.2.b Đấu tranh vì độc lập, dân chủ, hòa bình, hợp tác và phát triển` hoặc một nhãn tiểu mục kết luận tương ứng nếu contract owner chuẩn hóa riêng.
- **Bằng chứng re-review:** `source.section` của Q068 hiện là `Chương 2 > III.2.b Đấu tranh vì độc lập, dân chủ, hòa bình, hợp tác và phát triển`, đúng mục lá chứa kết luận tại dòng 2167–2171.
- **Status:** `resolved`.

## Bằng chứng review 100% Chương 6

| Nhóm blueprint | ID | Đã kiểm |
|---|---|---:|
| Quan niệm văn hóa và quan hệ với chính trị, kinh tế, xã hội | Q001–Q009 | 9/9 |
| Vai trò văn hóa và xây dựng nền văn hóa mới | Q010–Q023 | 14/14 |
| Đạo đức là gốc, là nền tảng | Q024–Q029 | 6/6 |
| Bốn chuẩn mực đạo đức cách mạng | Q030–Q046 | 17/17 (`5/5/4/3`) |
| Ba nguyên tắc xây dựng đạo đức | Q047–Q057 | 11/11 (`4/3/4`) |
| Quan niệm, vai trò và xây dựng con người | Q058–Q074 | 17/17 (`5/5/7`) |
| Vận dụng xây dựng văn hóa, con người và đạo đức hiện nay | Q075–Q090 | 16/16 (`9/7`) |
| **Tổng** | **Q001–Q090** | **90/90** |

Với từng câu, reviewer đã kiểm stem/learning objective, difficulty-kind, bốn lựa chọn, thử bảo vệ từng distractor, đáp án, explanation, `source.section`, `source.text`, dữ kiện lịch sử, quy tắc ERRATA và cách đóng khung phần “hiện nay” theo giáo trình xuất bản năm 2021.

Gate cấu trúc tại artifact Chương 6 lượt 3:

- 90 câu; difficulty `36/36/18`; kind `36/14/22/18`; vị trí A/B/C/D `22/22/23/23`.
- Blueprint `9/14/6/17/11/17/16`, với các tiểu quota `4/5 · 4/3/3/4 · 6 · 5/5/4/3 · 4/3/4 · 5/5/7 · 9/7`.
- Max answer run `3`; không có chu kỳ độ dài 2–4 lặp ba lần.
- Không có lỗi schema/ID/NFC/unsafe text/ERRATA đã cấm; không hỏi số thứ tự ở danh sách Chương 6 bị nhảy mục theo `ambiguous-do-not-use`.
- Không có stem trùng chuẩn hóa hoặc cặp stem Jaccard từ `0,65` trở lên; 90 citation đã được đối chiếu về đúng thân Chương 6 và mục lá tương ứng.
- Gate độ dài đạt: `20/90 = 22,22%` đáp án đúng dài duy nhất; trên 64 câu không hòa, phân bố hạng là `16/13/9/26`; độ dài trung bình đúng/nhiễu `74,84/77,30`; tỷ lệ dài nhất/ngắn nhất của mọi bộ lựa chọn không vượt `1,83`.
- Rolling window 20 có cực đại dài/ngắn duy nhất `8/20` và `9/20`; cửa sổ 8/10/12/15 đều đã phân tán. Q025–Q039 còn `6/15` đáp án đúng dài duy nhất; Q057–Q064 còn `1/8`.
- Cue scan cùng lexicon H-02 chỉ còn `2/270` distractor, `0/90` đáp án đúng và không còn câu nào có ít nhất hai distractor mang cue. Kiểm thủ công lại toàn bộ 55 câu cũ xác nhận các phương án sửa là near-miss cùng phạm trù, không chỉ xóa từ khóa.
- Cả 16 câu Q075–Q090 đều có dấu vết `2021` ở stem, explanation hoặc `source.text`; không câu nào tự nhận là dữ liệu đã cập nhật đến năm 2026.

## Tổng finding Chương 6

| Mức | Tổng | Open | Resolved |
|---|---:|---:|---:|
| Critical | 0 | 0 | 0 |
| High | 2 | 0 | 2 |
| Medium | 1 | 0 | 1 |
| Low | 1 | 0 | 1 |
| **Tổng** | **4** | **0** | **4** |

### Critical

Không có finding Critical ở Chương 6.

### High

#### H-02 — 55/90 câu Chương 6 — distractor cực đoan tạo quy tắc loại đáp án không cần kiến thức

- **Lý do:** Sau khi đối chiếu thủ công 90/90 câu, reviewer kiểm lại bằng một tập từ khóa hẹp gồm `chỉ`, `mọi`, `hoàn toàn`, `không cần`, `tự động`, `duy nhất`, `bất kỳ`, `thay thế`, `đứng ngoài`, `khép kín`, `loại bỏ`, `phủ nhận`, `tuyệt đối`, `không bao giờ`. Có `163/270 = 60,37%` distractor chứa ít nhất một cue như vậy, trong khi chỉ `1/90` đáp án đúng chứa cue. Có 55 câu mà ít nhất hai distractor mang cue nhưng đáp án đúng không mang cue: Q002; Q006–Q007; Q009–Q016; Q018; Q023–Q028; Q030–Q031; Q034–Q035; Q039; Q041; Q043; Q046; Q048–Q050; Q052–Q053; Q055–Q056; Q058–Q062; Q065–Q067; Q070–Q072; Q074; Q076–Q077; Q079; Q082–Q086; Q088; Q090. Đây không chỉ là kết quả máy dò: trong Q018 cả ba distractor đều thu hẹp vai trò quần chúng bằng `chỉ`; Q070 dùng `chỉ`/`duy nhất`/`không cần` cho cả ba distractor; Q074 cho cả ba distractor cấu trúc `Chỉ ... không cần ...`; Q082 lại đặt ba cực đoan cạnh một đáp án cân bằng. Người học có thể chọn phương án duy nhất không tuyệt đối hóa mà không cần nắm nội dung.
- **Đề xuất:** Viết lại các distractor thành nhầm lẫn gần, cùng phạm trù và có một phần đúng nhưng sai đúng một quan hệ, phạm vi hoặc điều kiện. Không sửa cơ học bằng cách xóa riêng từ tuyệt đối hay chèn mệnh đề rỗng; phải thử bảo vệ từng distractor sau khi viết lại.
- **Bằng chứng re-review:** Cue scan lượt 3 giảm từ `163/270` xuống `2/270` distractor; không đáp án đúng nào mang cue và không còn câu nào có từ hai distractor mang cue. Reviewer đọc lại đủ 55 câu: các bộ lựa chọn hiện dùng quan hệ đảo chiều, thiếu một điều kiện, sai phạm vi hoặc sai thứ tự ưu tiên; không phát hiện phương án vô nghĩa hay đáp án đúng thứ hai.
- **Status:** `resolved`.

#### H-03 — Q025–Q039 và Q057–Q064 — gate độ dài gộp che giấu pattern theo cửa sổ

- **Lý do:** Trong Q025–Q039, đáp án đúng dài duy nhất ở `10/15` câu; trên 11 câu không hòa hạng, đáp án đúng đứng dài nhất 9 lần và dài nhì 2 lần, không lần nào ở nửa ngắn. Trong Q057–Q064, đáp án đúng dài duy nhất ở `6/8` câu; cả sáu câu không hòa hạng đều đặt đáp án đúng trong hai thứ hạng dài nhất (`5/1/0/0`). Toàn chương chỉ vừa tránh ngưỡng cấm: trên 67 câu không hòa hạng, phân bố thứ hạng là `33/8/3/23`, tức đáp án đúng gần như không bao giờ đứng hạng dài thứ ba (`3/67`). Các ví dụ dễ khai thác gồm Q031 (`90/77/88/81`), Q034 (`73/88/77/90`) và Q064 (`75/74/91/83`).
- **Đề xuất:** Cân bằng lại mức chi tiết và độ dài bằng nội dung có nghĩa, phân tán thứ hạng đáp án trong từng nhóm blueprint và các cửa sổ 8/10/12/15 câu. Chạy lại cả gate gộp lẫn thống kê rolling-window; không pad chữ chỉ để đổi hạng.
- **Bằng chứng re-review:** Q025–Q039 hiện còn `6/15` đáp án đúng dài duy nhất, với hạng `4/3/1/1` trên 9 câu không hòa; Q057–Q064 còn `1/8`, với hạng `1/3/1/1` trên 6 câu không hòa. Toàn chương đạt `20/90` dài duy nhất, hạng `16/13/9/26` trên 64 câu; rolling window 8/10/12/15/20 không lộ đoạn áp đảo. Kiểm nội dung không thấy padding rỗng.
- **Status:** `resolved`.

### Medium

#### M-05 — Q009/Q082, Q027/Q086 và Q049/Q089 — lặp lại learning objective giữa phần cơ sở và phần vận dụng hiện nay

- **Lý do:** Q009 và Q082 đều kiểm đúng một quan hệ “lấy bản sắc dân tộc làm gốc, tiếp thu có chọn lọc tinh hoa nhân loại”. Q027 và Q086 đều dùng tình huống năng lực/thành tích không thể bù cho thiếu đạo đức. Q049 và Q089 đều dùng tình huống phát ngôn/kêu gọi tích cực nhưng hành vi không thực hiện cam kết để kiểm nguyên tắc nói đi đôi với làm. Thay đổi nhân vật hoặc bối cảnh chưa tạo learning objective mới, làm giảm độ bao phủ thực của ngân hàng dù stem không trùng từ vựng ở ngưỡng Jaccard.
- **Đề xuất:** Giữ câu cơ sở và thay các câu ở phần IV bằng objective riêng còn có căn cứ trong cùng mục, chẳng hạn quyền thông tin và tự do sáng tạo, công nghiệp văn hóa, môi trường gia đình, niềm tin và phục vụ nhân dân, ý chí vượt thử thách; vẫn giữ nguyên ID và quota difficulty-kind của nhóm vận dụng.
- **Bằng chứng re-review:** Q082 nay kiểm quan hệ công nghiệp văn hóa–thị trường dịch vụ/sản phẩm tại dòng 8585–8587; Q086 kiểm bình tĩnh, kiên cường, chủ động vượt thử thách và kiên trì mục đích tại dòng 8863–8867; Q089 kiểm xây dựng môi trường văn hóa gắn với gia đình no ấm, tiến bộ, hạnh phúc, văn minh tại dòng 8567–8577. Ba objective đều khác rõ Q009/Q027/Q049 và vẫn giữ quota difficulty-kind.
- **Status:** `resolved`.

### Low

#### L-05 — HCM202-C06-Q021 — nhãn `Thông hiểu/thong_hieu_phan_biet` cao hơn thao tác thực tế

- **Lý do:** Stem chỉ hỏi trực tiếp ba tính chất của nền văn hóa mới trong kháng chiến và đáp án lặp nguyên danh sách `dân tộc, khoa học và đại chúng`. Người học chỉ cần nhận biết dữ kiện, không phải phân biệt bản chất hoặc quan hệ giữa các phương châm.
- **Đề xuất:** Viết lại thành yêu cầu so sánh định hướng qua các giai đoạn hoặc giải thích ý nghĩa của một tính chất; nếu hạ xuống `Nhận biết`, phải cân đối lại một câu khác để giữ quota chương.
- **Bằng chứng re-review:** Q021 nay hỏi cách hiểu mối liên hệ giữa ba tính chất, yêu cầu phân biệt chức năng của dân tộc, khoa học và đại chúng thay vì nhắc lại danh sách. Đáp án D và explanation gắn cốt cách Việt Nam, tính tiến bộ và việc đưa văn hóa đến nhân dân; nhãn `Thông hiểu/thong_hieu_phan_biet` phù hợp.
- **Status:** `resolved`.

## Tổng hợp findings Reviewer B

| Mức | Chương 2 | Chương 6 | Combined | Open combined | Resolved combined |
|---|---:|---:|---:|---:|---:|
| Critical | 0 | 0 | 0 | 0 | 0 |
| High | 1 | 2 | 3 | 0 | 3 |
| Medium | 5 | 1 | 6 | 0 | 6 |
| Low | 4 | 1 | 5 | 0 | 5 |
| **Tổng** | **10** | **4** | **14** | **0** | **14** |

## Kết luận lượt 4

Reviewer B đã re-review độc lập đủ `75/75` câu Chương 2 và `90/90` câu Chương 6; lượt 4 tập trung đúng fix-diff M-06 nhưng vẫn chạy lại gate trên toàn bộ hai chương. Toàn bộ 14 finding đã được đóng. Chương 2 được **APPROVED** tại hash `1C083E5453D35D6874DB8034B9C97AB44BF0D2EF71E664965CF61A6151561295`; Chương 6 tiếp tục **APPROVED** tại hash `688402286E9CC5F0420B94A47E12EC314C81B682A815877C22D26BD596180790`.

Kết quả combined của Reviewer B là **APPROVED**. Bốn lệnh `compose_questions.py`/`validate_questions.py` cho `--subject hcm202` và `--all` đều thoát mã 0 với `Errors: 0`, `Warnings: 0`; test `ContentContractTests.test_hcm202_bank_matches_reviewed_distribution_schema_and_length_gates` cũng đạt trên snapshot được duyệt.
