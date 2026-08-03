# Independent review — VNR202 Chương 3

## Phạm vi, artifact và kết luận

- Reviewer: reviewer độc lập, không phải tác giả `chapter-03.json`; reviewer không sửa file câu hỏi.
- Ngày review: 2026-08-03.
- Phạm vi câu hỏi: `VNR202-C03-Q001`–`VNR202-C03-Q220`, đã review ngữ nghĩa `220/220` (`100%`).
- Reviewer đã đọc đủ `220` stem, `880` options, `220` answer, difficulty/kind, explanation và citation; cả `660/660` distractor đều được thử bảo vệ riêng trước source và learning objective.
- Source đã đọc trực tiếp: logical lines `2774–5217` của `gt-lich-su-dang-csvn-ban-tuyen-giao-tw.md`, gồm toàn bộ 19 mục covered và phần tiếp nối ở seam cuối.
- SHA-256 source snapshot: `a686d4395752bf70302dff62cbf1502187f19ebcd1e9406a9a402e97b76799bc` (`831134` byte, `9916` logical lines).
- SHA-256 artifact được review: `9972373bc8cf775076b0a8fbf52405dbc2cf032ae5c304289c18dad1d8b4c3c2` (`336979` byte).
- SHA-256 blueprint fragment được đối chiếu: `120febf68a591a15b49301380beef2eef7a1d9bfb4339f09a3f8ed024ff7bfd4`.
- SHA-256 merged blueprint tại cả `plans` và `content`: `087979a68cfdc2ebe66a7837623c2948b6415172d11c546c68e864793a58e56a`.
- Kết luận: `CHANGES_REQUESTED`; không phê duyệt và không sign-off khi finding High/Medium còn mở.

Tài liệu điều khiển đã đọc: `AUTHORING.md`, `ERRATA.md`, `subject.json`, `bank-config.json`, merged `blueprint.json`, fragment `blueprint-ch2-ch3b.json`, cùng các hợp đồng `authoring-contract`, `output-contract` và `review-signoff` của skill.

## Tổng findings

| Severity | Tổng | Open | Resolved |
|---|---:|---:|---:|
| Critical | 0 | 0 | 0 |
| High | 3 | 3 | 0 |
| Medium | 4 | 4 | 0 |
| Low | 0 | 0 | 0 |
| **Tổng** | **7** | **7** | **0** |

## Critical

Không phát hiện finding Critical làm mất độ tin cậy của toàn bộ artifact. Tuy vậy, ba finding High bên dưới đủ để chặn phê duyệt.

## High

### H-01 — 114/220 câu — correct answer là phương án cân bằng duy nhất, distractor tự loại bằng phủ định/cắt bỏ

- Severity: High
- Lý do: exact absolute-cue gate hẹp vẫn pass, nhưng red-team không cần kiến thức phát hiện `114/220 = 51,82%` câu mà answer không dùng tín hiệu phủ định/cắt bỏ, trong khi ít nhất hai distractor dùng trực tiếp `không`, `chỉ`, `bỏ`, `tách`, `thay`, `giới hạn`, `dừng` hoặc `lược`. Sau khi thử bảo vệ từng distractor, nhiều phương án sai tự loại vì phủ nhận một điều kiện hiển nhiên, thu hẹp cực đoan hoặc tách rời các mặt vốn phải kết hợp; answer trở thành lựa chọn duy nhất đầy đủ và có giọng học thuật.
- IDs: `Q003`–`Q004`, `Q006`, `Q010`–`Q012`, `Q017`–`Q019`, `Q024`, `Q030`–`Q031`, `Q035`–`Q036`, `Q038`–`Q041`, `Q043`–`Q044`, `Q055`, `Q057`–`Q058`, `Q062`–`Q063`, `Q065`–`Q068`, `Q070`, `Q072`, `Q074`–`Q075`, `Q077`–`Q078`, `Q082`, `Q084`–`Q085`, `Q088`–`Q089`, `Q091`–`Q092`, `Q095`, `Q098`–`Q100`, `Q104`–`Q105`, `Q107`–`Q108`, `Q110`, `Q113`, `Q116`–`Q117`, `Q119`–`Q120`, `Q124`–`Q132`, `Q137`–`Q140`, `Q148`–`Q153`, `Q155`–`Q157`, `Q159`–`Q161`, `Q167`, `Q169`–`Q172`, `Q175`–`Q177`, `Q179`, `Q182`, `Q184`, `Q186`–`Q189`, `Q193`, `Q196`–`Q200`, `Q202`, `Q204`, `Q207`–`Q211`, `Q213`–`Q214`, `Q217`–`Q218`, `Q220`.
- Bằng chứng artifact: Q004 để hai distractor nói tác động “chỉ” ở phạm vi hẹp và “không” ảnh hưởng nền tảng; Q031 để ba distractor lần lượt thu hẹp chủ thể, loại tầng lớp hoặc đồng nhất hình thức tham gia; Q057 để ba distractor tách rời, xóa vai trò hoặc đồng nhất trọng tâm; Q169 và Q207 để ba distractor đều phủ định một thành tố rõ ràng; Q220 để ba distractor đều công khai bỏ hoặc trì hoãn chuẩn bị hậu cần/phối hợp.
- Đề xuất: viết lại distractor thành near-miss cùng phạm trù, cùng cấu trúc ngữ pháp và chỉ sai một quan hệ, chủ thể, thời điểm, phạm vi hoặc điều kiện có thể nhầm thật. Không khắc phục máy móc bằng cách chỉ xóa từ phủ định; sau sửa phải che answer và thử chọn chỉ dựa vào văn phong.
- Status: `open`
- Re-review: chưa có artifact mới.

### H-02 — logical lines 5131–5217 — khoảng trống bao phủ ở phần kết Chương 2 của source

- Severity: High
- Lý do: group `c03-seam-ho-chi-minh-campaign` chỉ đánh dấu logical lines `5126–5130` là `excluded`, với lý do phần tiếp nối thuộc lát cắt kế tiếp. Tuy nhiên source từ `5131–5217` còn bốn khối kiến thức hoàn chỉnh: diễn biến và kết thúc Chiến dịch Hồ Chí Minh (`5131–5144`), ý nghĩa thắng lợi (`5146–5179`), nguyên nhân thắng lợi (`5181–5195`) và kinh nghiệm lãnh đạo (`5197–5217`). Không fragment nào khác lập group cho các dòng này; nhóm covered tiếp theo của Chương 4 bắt đầu tại logical line `5281`.
- Tác động: mapping hiện tại vẫn đạt `220/220` ID và quota của các group đã khai báo, nhưng đó chỉ là tính đầy đủ nội bộ của blueprint. Blueprint bỏ sót một phần nội dung cốt lõi, nên gate semantic coverage không đạt. Các câu Q216–Q220 chỉ chạm quyết định thành lập bộ chỉ huy, chuẩn bị và một vài bài học; chúng không thay thế việc bao phủ diễn biến kết thúc chiến dịch, ý nghĩa, nguyên nhân và hệ thống kinh nghiệm trong phần bị bỏ.
- Đề xuất: mở rộng blueprint bằng các group covered cho `5131–5217`, xác lập learning objective/quota có chủ đích và biên soạn câu hỏi tương ứng; nếu điều chỉnh tổng target thì phải cập nhật đồng bộ fragment, merged blueprint, bank config và validator. Không được giữ lý do “thuộc lát cắt kế tiếp” khi không có lát cắt nào thực sự nhận phần này.
- Status: `open`
- Re-review: chưa có blueprint/artifact mới.

### H-03 — Q034, Q149, Q215 — answer hoặc quan hệ thời gian không được source bảo vệ

- Severity: High
- Q034: stem hỏi “Dựa vào sức mình là chính **không đồng nghĩa với điều gì?**”. Phương án A (“Từ chối mọi sự ủng hộ quốc tế...”) đã là một nội dung mà nguyên tắc này không đồng nghĩa; phương án C được đánh dấu lại bắt đầu bằng “Không đồng nghĩa với...”, tạo cấu trúc phủ định kép và làm A/C cùng bảo vệ được theo cách đọc tự nhiên. Đây là lỗi stem–option/answer ambiguity, không chỉ là câu chữ.
- Q149: stem quy nội dung “kết hợp đấu tranh chính trị với đấu tranh vũ trang, tiến công trên cả ba vùng” cho Nghị quyết Trung ương 9. Source logical lines `4411–4418` gắn tổ hợp này với chủ trương Bộ Chính trị giai đoạn `1961–1962`, còn logical lines `4466–4469` nêu điểm nhấn của Nghị quyết Trung ương 9 là đấu tranh vũ trang giữ vai trò quyết định trực tiếp. Answer hiện tại sai attribution.
- Q215: explanation nói thắng lợi Huế–Đà Nẵng thúc đẩy quyết định giải phóng trước mùa mưa, trong khi source tại logical lines `5120–5123` đặt quyết định vào ngày `25-3-1975`, trước mốc Huế được giải phóng `26-3` và Đà Nẵng `29-3`. Quan hệ nhân quả được nêu không thể đứng theo chính trình tự của source.
- Đề xuất: viết lại Q034 để stem và bốn option chỉ còn một mệnh đề đúng; sửa Q149 theo đúng nội dung Nghị quyết Trung ương 9 hoặc đổi chủ thể/mốc của stem; sửa Q215 thành một quan hệ thời gian được source bảo vệ, đồng thời cập nhật explanation và citation.
- Status: `open`
- Re-review: chưa có artifact mới.

## Medium

### M-01 — 17 câu — citation hoặc mục lá không bảo vệ trọn claim trong answer/explanation

- Severity: Medium
- IDs: `Q036`, `Q046`, `Q069`, `Q070`, `Q074`, `Q075`, `Q081`, `Q101`, `Q105`, `Q138`, `Q139`, `Q145`, `Q170`, `Q178`, `Q181`, `Q200`, `Q207`.
- Bằng chứng chính:
  - Q046 dùng “hữu khuynh”, nhưng nội dung này xuất hiện ở phần kinh nghiệm sau đó chứ không nằm trong mục lá `3292–3472`; Q070 lấy ý sửa sai/khôi phục niềm tin từ đoạn sau, không từ mục lá `3584–3656` đang trích.
  - Q075 thêm quan hệ “điều chỉnh/chuyển sang” phương châm; Q081 thêm kết luận giới tuyến không phải biên giới chính trị; Q170, Q178 và Q181 thêm tổ chức phòng không, phương án sửa/mở tuyến và khẩu hiệu mà các mục lá tương ứng không phát biểu.
  - Q101 gọi cả cải cách ruộng đất, khôi phục kinh tế và cải tạo xã hội chủ nghĩa là “nhiệm vụ trực tiếp sau Genève”, làm gộp các chặng; Q105 thay nguyên tắc thứ ba “quản lý dân chủ” của source bằng “tiến hành từng bước phù hợp”.
  - Q036, Q069, Q074, Q138, Q139, Q145, Q200 và Q207 dùng thuật ngữ, lý do hoặc tổ hợp hành động mạnh/cụ thể hơn phần source được dẫn; đặc biệt source gọi ấp chiến lược là “quốc sách”, không dùng “xương sống” như Q145.
- Tác động: phần lớn câu vẫn có một phương án hợp lý nếu dùng kiến thức lịch sử ngoài corpus, nhưng contract yêu cầu source snapshot và citation được khai báo phải tự bảo vệ answer/explanation. Trường `source.text` do artifact tự ghi không thay thế bằng chứng trong source gốc.
- Đề xuất: thu hẹp claim theo đúng mục lá hoặc dẫn đúng đoạn nguồn có bằng chứng; với Q101/Q105 phải sửa trực tiếp stem/answer/explanation. Nếu không có bằng chứng trong corpus, loại claim thay vì dựa vào kiến thức phổ thông ngoài nguồn.
- Status: `open`
- Re-review: chưa có artifact mới.

### M-02 — 11 câu Vận dụng — tình huống chỉ là wrapper cho thao tác nhớ/giải thích trực tiếp

- Severity: Medium
- IDs: `Q015`, `Q025`, `Q026`, `Q061`–`Q063`, `Q085`, `Q113`, `Q141`, `Q190`, `Q217`.
- Lý do: các stem dùng khung “khi cần”, “nếu một nhận định”, “một đề án”, “khi đánh giá” hoặc “có vai trò gì”, nhưng không cung cấp dữ kiện mới và ràng buộc đủ để người học ra quyết định. Thao tác thực tế vẫn là chọn lại danh sách, ý nghĩa, quan hệ hoặc bài học được source nêu trực tiếp; do đó chưa đạt contract của `Vận dụng/van_dung_tinh_huong`.
- Đề xuất: bổ sung mini-case có dữ kiện gần nhau, xung đột mục tiêu và ràng buộc để buộc áp dụng nguyên tắc. Nếu hạ difficulty/kind, phải bù lại quota `44` câu Vận dụng của chương và quota từng group blueprint.
- Status: `open`
- Re-review: chưa có artifact mới.

### M-03 — 5 câu, 2 cụm — trùng learning objective dù stem không trùng chữ

- Severity: Medium
- Cụm 1: Q038, Q099 và Q168 đều đặt cùng một tình huống “phụ thuộc/có viện trợ bên ngoài” và cùng yêu cầu chọn nguyên tắc “lấy sức mình làm chính đồng thời tranh thủ ủng hộ quốc tế”. Khác giai đoạn lịch sử nhưng không tạo thao tác nhận thức mới.
- Cụm 2: Q084 và Q192 đều hỏi cách chuyển ưu thế chiến trường thành hoạt động/sức ép ngoại giao. Cả dữ kiện, quyết định cần chọn và rationale đều tương đương.
- Bằng chứng scan: không có exact duplicate, nhưng có `14` cặp stem similarity từ `0,72`; top pair Q035/Q093 đạt `0,807`. Sau đọc thủ công toàn bộ các ứng viên, hai cụm trên là duplicate objective thực chất.
- Đề xuất: giữ một câu trong mỗi objective hoặc viết lại các câu còn lại để kiểm một quan hệ, điều kiện, mốc hoặc hệ quả riêng của đúng giai đoạn được gắn topic.
- Status: `open`
- Re-review: chưa có artifact mới.

### M-04 — 7 câu — mô tả bạo lực lịch sử bị chuyển thành lời khuyên tác chiến hiện tại

- Severity: Medium
- IDs: `Q049`, `Q050`, `Q100`, `Q126`, `Q155`, `Q178`, `Q220`.
- Lý do: các stem dùng dạng hiện tại, phi định danh như “nếu địch tập trung”, “một chiến dịch cần...”, “một địa bàn...”, “một địa phương bị đàn áp”, “nếu tuyến vận tải bị đánh” rồi yêu cầu chọn cách bao vây, chia cắt, tiến công, tổ chức lực lượng hoặc bảo đảm hậu cần. Cách viết này làm kiến thức lịch sử thành chỉ dẫn tác chiến chung, trái yêu cầu authoring về việc không biến mô tả bạo lực lịch sử thành hướng dẫn hiện đại.
- Đề xuất: neo rõ chủ thể, thời gian và sự kiện quá khứ, rồi hỏi phân tích quyết định đã diễn ra hoặc quan hệ lịch sử; tránh imperative/present-tense operational advice có thể tách khỏi bối cảnh môn học.
- Status: `open`
- Re-review: chưa có artifact mới.

## Low

Không ghi finding Low riêng. Các điểm câu chữ nhỏ đã được gom vào finding có tác động ngữ nghĩa/citation tương ứng và sẽ được đọc lại cùng option set sau remediation.

## Checklist review 220/220

Với từng range dưới đây, reviewer đã đối chiếu trực tiếp source, kiểm stem/objective, difficulty-kind, bốn options, thử bảo vệ ba distractor, answer, explanation, citation, cue, length, errata và trùng objective.

| Nhóm blueprint | Source logical lines | Question IDs | Đã kiểm |
|---|---:|---|---:|
| `c03-i01a-situation-1945` | 2774–2842 | Q001–Q006 | 6/6 |
| `c03-i01b-build-new-regime` | 2844–2947 | Q007–Q015 | 9/9 |
| `c03-i01c-south-resistance-government` | 2949–3144 | Q016–Q026 | 11/11 |
| `c03-i02a-national-resistance-line` | 3150–3290 | Q027–Q039 | 13/13 |
| `c03-i02b-resistance-1947-1950` | 3292–3472 | Q040–Q050 | 11/11 |
| `c03-i03a-congress-ii-platform` | 3476–3582 | Q051–Q063 | 13/13 |
| `c03-i03b-develop-all-fronts` | 3584–3656 | Q064–Q071 | 8/8 |
| `c03-i03c-military-diplomacy` | 3658–3802 | Q072–Q085 | 14/14 |
| `c03-i04a-french-resistance-significance` | 3808–3831 | Q086–Q090 | 5/5 |
| `c03-i04b-french-resistance-experience` | 3833–3907 | Q091–Q100 | 10/10 |
| `c03-ii01a-north-1954-1960` | 3919–4068 | Q101–Q113 | 13/13 |
| `c03-ii01a-south-1954-1960` | 4070–4208 | Q114–Q128 | 15/15 |
| `c03-ii01b-north-1961-1965` | 4210–4389 | Q129–Q143 | 15/15 |
| `c03-ii01b-south-1961-1965` | 4391–4513 | Q144–Q156 | 13/13 |
| `c03-ii02a-us-resistance-line` | 4517–4609 | Q157–Q168 | 12/12 |
| `c03-ii02b-north-1965-1968` | 4611–4699 | Q169–Q178 | 10/10 |
| `c03-ii02b-south-1965-1968` | 4701–4835 | Q179–Q192 | 14/14 |
| `c03-ii02c-north-1969-1975` | 4837–4927 | Q193–Q202 | 10/10 |
| `c03-ii02c-south-1969-1975-complete` | 4929–5124 | Q203–Q220 | 18/18 |
| **Tổng** | **2774–5124** | **Q001–Q220** | **220/220** |

Reviewer cũng đọc phần seam `5126–5217`. Trạng thái `excluded` hiện tại chỉ mô tả `5126–5130`, còn phần hoàn chỉnh `5131–5217` không được group nào nhận; đây là H-02, không phải nội dung đã được bao phủ ngầm.

## Gate cấu trúc và red-team

| Gate | Kết quả |
|---|---|
| Source snapshot | Pass tính toàn vẹn: SHA-256 `a686…99bc`, `831134` byte, `9916` logical lines |
| JSON, exact schema, IDs | Pass: 220 object, đúng exact fields; ID liên tục Q001–Q220 |
| Course/chapter | Pass: `courseId=vnr202`, `chapterNum=3`, title khớp `subject.json` |
| Options/answer | Pass cấu trúc: mỗi câu có 4 option khác nhau, answer trong 0–3; semantic answer gate fail tại Q034/Q149 và chronology fail Q215 — H-03 |
| Difficulty quota danh nghĩa | Pass: `88 Nhận biết / 88 Thông hiểu / 44 Vận dụng`; semantic gate fail đối với 11 câu — M-02 |
| Answer positions | Pass: `55/55/55/55` |
| Answer pattern | Pass: max run `3`; không có chu kỳ độ dài 2–4 lặp ba lần |
| Độ dài chương | Pass: đúng dài duy nhất `74/220 = 33,64%`, ngắn duy nhất `54/220 = 24,55%`; rolling max `14/20`, cửa sổ đầu tại Q003 |
| Độ dài trung bình | Pass: answer `73,105` ký tự, distractor `71,530`; lệch tương đối `2,201%` |
| Exact absolute cue | Pass: `14/220` answer và `213/660` distractor có cue lexicon contract; `0` câu vi phạm quy tắc “answer không cue nhưng từ hai distractor có cue” |
| Qualitative option cue | **Fail**: `114/220` câu có pattern phủ định/cắt bỏ hệ thống — H-01 |
| Explanation/citation | **Fail**: ba lỗi correctness/timeline — H-03; 17 câu thiếu bảo vệ trọn claim tại mục lá — M-01 |
| Duplicate chữ | Pass: 0 exact stem, 0 exact option-set; 14 cặp stem similarity từ `0,72`, không cặp nào đạt `0,82` |
| Duplicate objective | **Fail** sau đọc thủ công: hai cụm, năm câu — M-03 |
| Historical-safety framing | **Fail**: bảy câu biến mô tả bạo lực lịch sử thành lời khuyên tác chiến phi định danh — M-04 |
| Unicode/public strings | Pass: UTF-8 NFC, không BOM, có final LF; không control/bidi/HTML/URL/email/local path |
| Blueprint ID/quota | Pass nội bộ: `220/220` ID, không trùng/thiếu; target và difficulty của 19 group covered đều khớp |
| Blueprint semantic coverage | **Fail**: logical lines `5131–5217` không có group nhận — H-02 |

Kết quả gate ở bảng trên được tính trực tiếp trên artifact Chương 3 có SHA-256 đã khóa. Tại checkpoint cuối của review, `validate_question_bank.py --warnings-as-errors` pass `850` câu, `0 error`, `0 warning`, canonical bank SHA-256 `05c5e70cc484946819ae19b1932fb4ee2f7eff211c73b471c21d6ff256b6f01b`. Kết quả validator cơ học này không đóng các finding semantic H-01–H-03 và M-01–M-04.

## Điều kiện re-review

1. Tác giả sửa `chapter-03.json`; reviewer không sửa file câu hỏi của tác giả.
2. Blueprint owner xử lý H-02 trước khi chốt lại target và quota; merge lại cả bản `plans` và `content` bằng quy trình chuẩn.
3. Sửa ba lỗi H-03, 17 câu M-01, 11 câu M-02, hai cụm M-03 và framing của M-04; đồng thời viết lại option sets thuộc H-01 bằng near-miss thực chất.
4. Chạy lại exact cue, qualitative no-knowledge red-team, length, answer pattern, difficulty semantics, duplicate objective, source traceability, Unicode và blueprint coverage trên toàn chương/toàn bank.
5. Reviewer đọc lại toàn bộ câu bị tác động và các cửa sổ lân cận; chỉ đổi finding sang `resolved` khi ghi hash artifact/blueprint mới và có bằng chứng từng finding.
6. Không dùng trạng thái `approved` khi bất kỳ finding High hoặc Medium nào còn mở.
