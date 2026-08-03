# Independent review — VNR202 Chương 4

## Phạm vi, artifact và kết luận

- Reviewer: reviewer độc lập, không phải tác giả `chapter-04.json`; reviewer không sửa file câu hỏi.
- Ngày review: 2026-08-03.
- Phạm vi: `VNR202-C04-Q001`–`VNR202-C04-Q400`; đã review ngữ nghĩa `400/400` câu (`100%`).
- Reviewer đã đọc đủ `400` stem, `1.600` options, `400` answer, difficulty/kind, explanation và citation; cả `1.200/1.200` distractor đều được thử bảo vệ riêng trước source và learning objective.
- Source đã đọc trực tiếp: toàn bộ logical lines `5281–9085`, gồm 62 nhóm covered và các đoạn context-only, duplicate, excluded ở seam.
- SHA-256 source snapshot: `a686d4395752bf70302dff62cbf1502187f19ebcd1e9406a9a402e97b76799bc` (`831134` byte, `9916` logical lines).
- SHA-256 artifact được review: `ee58cf82768089fd3c25357ad822050480e8989620e82497b3df289e78e5f28e` (`670092` byte).
- SHA-256 merged blueprint được đối chiếu: `087979a68cfdc2ebe66a7837623c2948b6415172d11c546c68e864793a58e56a`.
- Kết luận: `CHANGES_REQUESTED`; không phê duyệt và không sign-off khi finding High/Medium còn mở.

Tài liệu điều khiển đã đọc: `AUTHORING.md`, `ERRATA.md`, `subject.json`, `bank-config.json`, merged `blueprint.json`, cùng các hợp đồng `authoring-contract`, `output-contract` và `review-signoff` của skill.

## Tổng findings

| Severity | Tổng | Open | Resolved |
|---|---:|---:|---:|
| Critical | 0 | 0 | 0 |
| High | 2 | 2 | 0 |
| Medium | 4 | 4 | 0 |
| Low | 0 | 0 | 0 |
| **Tổng** | **6** | **6** | **0** |

## Critical

Không phát hiện finding Critical làm mất độ tin cậy của toàn bộ artifact. Hai finding High bên dưới vẫn đủ để chặn phê duyệt.

## High

### H-01 — Q062, Q070, Q281 — keyed answer sai hoặc không được mục nguồn bảo vệ

- Severity: High
- Q062: key hiện là B (`answer: 1`), tức “Thu hồi toàn bộ quyền canh tác của hộ...”. Source logical lines `5946–5949` và chính `source.text` của câu bảo vệ A: Khoán 10 khoán sản phẩm cuối cùng đến nhóm hộ, hộ xã viên và giao diện tích canh tác ổn định. Explanation cũng diễn giải A. Key B đảo ngược chính sách.
- Q070: key hiện là C (`answer: 2`), tức các nước giữ quan hệ Đảng–nhân dân mật thiết và phân cấp hợp lý. Source logical lines `6029–6040` và `source.text` bảo vệ B: khuyết tật kéo dài của mô hình gồm cải tạo nóng vội, bao cấp, coi nhẹ kinh tế hàng hóa và làm suy yếu dân chủ, quan hệ với nhân dân. Key C là mệnh đề đối nghịch.
- Q281: key D ghi “đội ngũ lãnh đạo cấp chiến lược”. Source logical lines `8088–8090` ghi “đội ngũ cán bộ lãnh đạo, quản lý các cấp, nhất là cấp trung ương”. `Cấp chiến lược` là thuật ngữ xuất hiện ở giai đoạn sau, không tương đương tự động với `cấp trung ương` trong nghị quyết đang hỏi; không option nào hiện trả đúng nguyên văn yêu cầu của mục lá.
- Đề xuất: sửa key Q062 thành A và Q070 thành B, rồi đọc lại toàn bộ option set/explanation; viết lại Q281 để đáp án nói đúng “các cấp, nhất là cấp trung ương”, không thay thuật ngữ lịch sử bằng khái niệm ở văn kiện sau.
- Status: `open`
- Re-review: chưa có artifact mới.

### H-02 — 81/400 câu — distractor lộ cơ chế phủ định/cắt bỏ sau red-team mở rộng

- Severity: High
- Lý do: exact cue gate hẹp của validator vẫn pass, nhưng red-team mở rộng ban đầu tìm `101/400` câu mà answer không có cue trong tập `không/chỉ/bỏ/tách/thay/giới hạn/dừng/lược`, còn ít nhất hai distractor có cue. Reviewer đã loại các false positive ngữ nghĩa như `lược` trong danh từ `chiến lược/sách lược` và `thay` trong cụm trung tính `thay đổi`; tập còn lại có `81/400 = 20,25%` câu high-confidence. Trong các câu này, phương án đúng thường là lựa chọn cân bằng/học thuật duy nhất, còn distractor tự thú nhận việc phủ định, cắt bỏ, tách rời hoặc thay thế một thành tố.
- IDs high-confidence: `Q001`–`Q002`, `Q008`, `Q011`–`Q012`, `Q015`, `Q031`–`Q032`, `Q036`, `Q043`–`Q045`, `Q054`, `Q062`–`Q063`, `Q078`, `Q081`, `Q083`–`Q084`, `Q092`–`Q093`, `Q099`–`Q100`, `Q105`, `Q116`–`Q118`, `Q121`, `Q123`, `Q126`, `Q129`, `Q136`, `Q143`–`Q144`, `Q161`–`Q162`, `Q164`, `Q174`, `Q177`–`Q178`, `Q180`, `Q182`–`Q183`, `Q185`, `Q187`, `Q192`–`Q193`, `Q201`, `Q203`, `Q205`, `Q208`–`Q209`, `Q220`, `Q226`, `Q230`, `Q234`, `Q242`, `Q254`, `Q263`, `Q268`, `Q275`, `Q282`, `Q285`, `Q287`, `Q291`, `Q294`, `Q310`–`Q312`, `Q317`, `Q335`, `Q340`, `Q345`, `Q348`, `Q359`, `Q364`, `Q368`, `Q376`, `Q381`, `Q391`, `Q394`.
- Dấu hiệu mạnh nhất: tại `Q011`, `Q044`, `Q045`, `Q123`, `Q174`, `Q177`, `Q220`, `Q242`, `Q310`, `Q317`, cả ba distractor đều có cấu trúc phủ định/cắt bỏ, còn answer là option duy nhất không có. Ví dụ Q011 dùng “Chỉ...”, “Tạm dừng...”, “Tách...”; Q208 dùng “không thay đổi”, “tách khỏi”, “thay... bằng”; Q310 dùng “chỉ”, “không”, “bỏ vai trò”. Người làm có thể tăng xác suất chọn đúng mà chưa cần biết nội dung.
- Tác động: đây không phải lỗi một từ riêng lẻ mà là template tạo phương án nhiễu lặp trên toàn chương; nhiều distractor không còn là near-miss hợp lý theo `AUTHORING.md`.
- Đề xuất: viết lại distractor thành near-miss cùng phạm trù, cùng cấu trúc và chỉ sai một chủ thể, thời điểm, quan hệ, phạm vi hoặc điều kiện có thể nhầm thật. Không sửa máy móc bằng cách xóa từ phủ định; sau sửa phải che answer và thử chọn chỉ dựa vào văn phong.
- Status: `open`
- Re-review: chưa có artifact mới.

## Medium

### M-01 — 9 câu — answer/explanation vượt mục lá hoặc citation trỏ sai đoạn bảo vệ

- Severity: Medium
- IDs: `Q171`, `Q198`, `Q224`, `Q227`, `Q260`, `Q262`, `Q264`, `Q370`, `Q397`.
- Bằng chứng chính:
  - Q171 gọi nông dân “chủ thể sản xuất” và “lực lượng trung tâm của phát triển nông thôn”. Logical lines `7157–7195` nói ba vấn đề có vị trí chiến lược, là cơ sở/lực lượng quan trọng và phải khơi dậy tự lực của nông dân, nhưng không phát biểu tổ hợp mà answer/source.text đang khẳng định.
  - Q198 dẫn logical lines `7282–7338`, nơi nêu tình trạng bao biện làm thay, nguyên tắc tập trung dân chủ, phân cấp và trách nhiệm cá nhân. Tổ hợp “định hướng, tổ chức, kiểm tra” trong answer thuộc diễn đạt phương thức lãnh đạo ở logical lines `7888–7897`, không nằm trong mục lá đang gắn.
  - Q224: logical lines `7616–7622` chỉ liệt kê bài học kết hợp sức mạnh dân tộc với sức mạnh thời đại; phần “nội lực tạo chủ động, quốc tế bổ sung nguồn lực và thế” là diễn giải thêm chưa được mục lá bảo vệ trực tiếp.
  - Q227: mục lá `7601–7629` có “của nhân dân, do nhân dân và vì nhân dân” cùng cảnh báo xa dân; cụm “dựa vào nhân dân, chịu sự giám sát của nhân dân” nằm ở logical lines `7905–7907`, ngoài citation hiện tại.
  - Q260: mục lá `7923–7943` liệt kê ba đột phá nhưng không nói hạ tầng “tháo gỡ điểm nghẽn kết nối”; bằng chứng trực tiếp nằm ở `7976–7983`.
  - Q262: mục lá chỉ yêu cầu giải quyết đúng quan hệ Nhà nước–thị trường; answer/source.text thêm phân công “thị trường phân bổ nguồn lực theo thể chế minh bạch” mà đoạn dẫn không phát biểu.
  - Q264: nội dung huy động mọi nguồn lực xã hội và bảo đảm lợi ích hợp lý nằm ở `7983–7996`, trong khi câu đang thuộc/cite group `7923–7943`.
  - Q370: `8802–8848` bảo vệ trách nhiệm chung về chăm sóc sức khỏe, nhưng không nêu `y tế dự phòng`; nội dung này xuất hiện tại `8945–8947`.
  - Q397: “phân công, phối hợp và kiểm soát quyền lực” được nêu tại `7859–7862`; mục lá `9012–9069` hiện dẫn chỉ khái quát nhận thức về Nhà nước pháp quyền, không bảo vệ trọn tổ hợp answer/source.text.
- Tác động: các câu phần lớn vẫn có một option hợp lý nếu đọc toàn chương hoặc dùng kiến thức ngoài mục lá, nhưng contract yêu cầu citation nhỏ nhất được khai báo phải trực tiếp bảo vệ answer và explanation. `source.text` do artifact tự ghi không thay thế source gốc.
- Đề xuất: thu hẹp claim theo đúng mục lá hoặc đổi citation/blueprint ownership tới đoạn thực sự có bằng chứng. Với Q264, cần xử lý cả mapping group chứ không chỉ đổi chuỗi `source.section`.
- Status: `open`
- Re-review: chưa có artifact mới.

### M-02 — 6 câu Vận dụng — thao tác thực tế vẫn là nhớ/giải thích trực tiếp

- Severity: Medium
- IDs: `Q008`, `Q028`, `Q045`, `Q050`, `Q254`, `Q334`.
- Lý do:
  - Q008 chỉ chọn lại chuỗi sự kiện thống nhất nhà nước; Q028 chọn lại chủ trương bảo vệ biên giới đi cùng hòa bình; Q045 hỏi trực tiếp nguyên nhân của điều chỉnh giá–lương–tiền; Q050 rút lại bài học đã nêu từ ba bước đột phá.
  - Q254 hỏi thẳng ý nghĩa Cương lĩnh năm 2011; Q334 hỏi thẳng lợi ích được Đại hội XII đặt cao nhất. Hai stem này thậm chí không có mini-case hay dữ kiện mới.
  - Cả sáu không buộc người học chọn nguyên tắc phù hợp trong một tình huống đủ dữ kiện theo `authoring-contract`; chúng phù hợp hơn với `Thông hiểu`/trình tự hoặc cần được viết lại thực chất.
- Đề xuất: viết lại thành mini-case có dữ kiện gần nhau, ràng buộc hoặc xung đột mục tiêu để buộc áp dụng nguyên tắc. Nếu hạ difficulty/kind, phải bù quota `80` câu Vận dụng và quota của từng group blueprint.
- Status: `open`
- Re-review: chưa có artifact mới.

### M-03 — Q222 và Q288 — trùng learning objective thực chất

- Severity: Medium
- Lý do: Q222 hỏi “Bài học về nhân dân khẳng định điều gì?” và key “Sự nghiệp cách mạng là của nhân dân, do nhân dân và vì nhân dân”; Q288 hỏi “Công tác dân vận xuất phát từ quan điểm nền tảng nào?” và key cùng một mệnh đề, chỉ đổi vị trí C/D. Cả hai đều là `Nhận biết`, cùng thao tác nhận diện trực tiếp, không có khác biệt nhận thức đủ để áp dụng ngoại lệ “một objective có nhiều câu”.
- Bằng chứng scan: không có exact stem hoặc exact option-set, nhưng `source.text` của hai câu trùng nội dung hoàn toàn sau chuẩn hóa. Đọc topic/citation xác nhận đây không chỉ là fuzzy false positive.
- Đề xuất: giữ một câu cho mệnh đề này; viết lại câu còn lại để đo một objective riêng của đúng mục lá, chẳng hạn cơ chế phát huy quyền làm chủ/lợi ích thiết thực hoặc trách nhiệm các chủ thể trong dân vận.
- Status: `open`
- Re-review: chưa có artifact mới.

### M-04 — Q314 — âm thầm khôi phục đoạn nguồn mất từ thuộc diện không được dùng

- Severity: Medium
- Lý do: answer/source.text khẳng định “Giữ vững độc lập, chủ quyền gắn với mục tiêu xã hội chủ nghĩa”. Tuy nhiên source logical line `8341` thực tế bị cắt thành “gắn với chủ nghĩa;”. `ERRATA.md` quy định các đoạn mất từ làm đổi nghĩa không được dùng và không được tự khôi phục bằng trí nhớ hoặc nguồn ngoài nếu chưa có `verified-correction`.
- Tác động: mệnh đề khôi phục có thể đúng về tri thức phổ thông, nhưng artifact hiện không có căn cứ nội bộ đã được ledger cho phép; việc điền `xã hội` làm citation/source.text trông chắc chắn hơn source khóa.
- Đề xuất: viết lại Q314 theo một quan điểm còn nguyên vẹn ở `8341–8345` (kết hợp xây dựng–bảo vệ, nội lực–ngoại lực, chiến lược–sách lược), hoặc bổ sung một `verified-correction` có bằng chứng nội bộ rõ rồi mới dùng lại claim.
- Status: `open`
- Re-review: chưa có artifact mới.

## Low

Không ghi finding Low riêng. Các điểm câu chữ nhỏ được gom vào finding semantic/citation tương ứng và phải được đọc lại cùng toàn bộ option set sau remediation.

## Checklist review 400/400

Với từng range dưới đây, reviewer đã đối chiếu trực tiếp source, kiểm stem/objective, difficulty-kind, bốn options, thử bảo vệ ba distractor, answer, explanation, citation, cue, length, errata và trùng objective.

| Nhóm blueprint | Source logical lines | Question IDs | Đã kiểm |
|---|---:|---|---:|
| `c04a-a01-postwar-context` | 5281–5289 | Q001–Q002 | 2/2 |
| `c04a-a02-state-unification` | 5291–5370 | Q003–Q008 | 6/6 |
| `c04a-a03-congress-iv` | 5372–5455 | Q009–Q015 | 7/7 |
| `c04a-a04-congress-iv-limitations` | 5457–5475 | Q016–Q019 | 4/4 |
| `c04a-a05-first-economic-breakthrough` | 5477–5513 | Q020–Q024 | 5/5 |
| `c04a-a06-national-defense-1975-1981` | 5515–5574 | Q025–Q028 | 4/4 |
| `c04a-a07-assessment-1975-1981` | 5576–5592 | Q029–Q032 | 4/4 |
| `c04a-b01-congress-v` | 5597–5676 | Q033–Q039 | 7/7 |
| `c04a-b02-economic-breakthroughs` | 5678–5768 | Q040–Q046 | 7/7 |
| `c04a-b03-decade-assessment` | 5770–5801 | Q047–Q050 | 4/4 |
| `c04a-c01-congress-vi` | 5811–5906 | Q051–Q058 | 8/8 |
| `c04a-c02-implementation-context` | 5913–5932 | Q059–Q060 | 2/2 |
| `c04a-c03-early-economic-renewal` | 5934–5985 | Q061–Q065 | 5/5 |
| `c04a-c04-six-renewal-principles` | 5987–6022 | Q066–Q069 | 4/4 |
| `c04a-c05-socialist-crisis-response` | 6024–6056 | Q070–Q072 | 3/3 |
| `c04a-c06-foreign-policy-party-building` | 6058–6081 | Q073–Q075 | 3/3 |
| `c04a-c07-congress-vii-platform` | 6083–6167 | Q076–Q084 | 9/9 |
| `c04a-c08-strategy-2000-lessons` | 6169–6210 | Q085–Q089 | 5/5 |
| `c04a-c09-agriculture-industry` | 6212–6264 | Q090–Q093 | 4/4 |
| `c04a-c10-defense-foreign-party` | 6266–6328 | Q094–Q098 | 5/5 |
| `c04a-c11-midterm-state-human` | 6330–6388 | Q099–Q105 | 7/7 |
| `c04a-d01-congress-viii` | 6394–6462 | Q106–Q112 | 7/7 |
| `c04a-d02-economic-state-implementation` | 6464–6512 | Q113–Q117 | 5/5 |
| `c04a-d03-cadres-party-democracy` | 6514–6559 | Q118–Q121 | 4/4 |
| `c04a-d04-education-science` | 6561–6583 | Q122–Q125 | 4/4 |
| `c04a-d05-culture` | 6585–6643 | Q126–Q130 | 5/5 |
| `c04a-d06-congress-ix` | 6645–6767 | Q131–Q138 | 8/8 |
| `c04a-d07-economic-sectors-land` | 6769–6828 | Q139–Q143 | 5/5 |
| `c04a-d08-ideology-ho-chi-minh` | 6830–6852 | Q144–Q146 | 3/3 |
| `c04a-d09-unity-ethnic-religion-diaspora` | 6854–6933 | Q147–Q151 | 5/5 |
| `c04a-d10-defense-strategy-2003` | 6935–6978 | Q152–Q155 | 4/4 |
| `c04a-d11-congress-x` | 6980–7082 | Q156–Q160 | 5/5 |
| `c04b-a01-sea-strategy-tail` | 7101–7121 | Q161–Q163 | 3/3 |
| `c04b-a02-market-institutions` | 7123–7155 | Q164–Q168 | 5/5 |
| `c04b-a03-agriculture-farmers-rural` | 7157–7195 | Q169–Q173 | 5/5 |
| `c04b-a05-anticorruption-waste` | 7205–7230 | Q174–Q179 | 6/6 |
| `c04b-a06-party-inspection-supervision` | 7231–7254 | Q180–Q186 | 7/7 |
| `c04b-a07-apparatus-grassroots-party` | 7256–7280 | Q187–Q190 | 4/4 |
| `c04b-a08-leadership-administrative-reform` | 7282–7338 | Q191–Q199 | 9/9 |
| `c04b-a09-workers-youth-intellectuals` | 7340–7425 | Q200–Q207 | 8/8 |
| `c04b-a10-ideology-culture-integration` | 7427–7565 | Q208–Q215 | 8/8 |
| `c04b-b01-congress-xi` | 7567–7599 | Q216–Q219 | 4/4 |
| `c04b-b02-platform-2011-lessons` | 7601–7629 | Q220–Q228 | 9/9 |
| `c04b-b03-platform-2011-model-directions` | 7631–7740 | Q229–Q240 | 12/12 |
| `c04b-b04-platform-2011-sector-directions` | 7742–7921 | Q241–Q256 | 16/16 |
| `c04b-b05-strategy-2011-2020` | 7923–7943 | Q257–Q264 | 8/8 |
| `c04b-b06-congress-xi-review` | 7949–7970 | Q265–Q270 | 6/6 |
| `c04b-c01-infrastructure-land-soe` | 7972–8052 | Q271–Q277 | 7/7 |
| `c04b-c02-party-building-anticorruption` | 8054–8104, 8115–8137 | Q278–Q287 | 10/10 |
| `c04b-c03-political-system-mass-mobilization` | 8139–8180 | Q288–Q293 | 6/6 |
| `c04b-c04-science-education-reform` | 8182–8252 | Q294–Q303 | 10/10 |
| `c04b-c05-culture-social-environment` | 8254–8320, 8328–8333 | Q304–Q313 | 10/10 |
| `c04b-c06-defense-foreign-affairs` | 8335–8380 | Q314–Q322 | 9/9 |
| `c04b-d01-congress-xii` | 8382–8501 | Q323–Q336 | 14/14 |
| `c04b-d02-economic-renewal-integration` | 8503–8688 | Q337–Q352 | 16/16 |
| `c04b-d03-sea-party-cadres` | 8690–8793 | Q353–Q364 | 12/12 |
| `c04b-d04-health-population-social-security` | 8802–8848 | Q365–Q370 | 6/6 |
| `c04b-e01-renewal-economic-achievements` | 8850–8903 | Q371–Q378 | 8/8 |
| `c04b-e02-renewal-cultural-social-achievements` | 8905–8951 | Q379–Q385 | 7/7 |
| `c04b-e03-renewal-defense-foreign-achievements` | 8953–9010 | Q386–Q395 | 10/10 |
| `c04b-e04-renewal-political-system-significance` | 9012–9069 | Q396–Q398 | 3/3 |
| `c04b-e05-renewal-limitations-complete` | 9071–9082 | Q399–Q400 | 2/2 |
| **Tổng** | **5281–9082** | **Q001–Q400** | **400/400** |

Reviewer cũng kiểm sáu group không sinh câu: `c04a-d12-sea-strategy-partial` (`context-only`, `7084–7100`), `c04b-a04-economic-results-context` (`context-only`, `7197–7203`), `c04b-c02-duplicate-three-urgent-issues` (`duplicate`, `8105–8114`), `c04b-c05-excluded-corrupt-dates` (`excluded`, `8321–8327`), `c04b-d03-officeholding-context` (`context-only`, `8794–8800`) và `c04b-e06-renewal-limitations-seam` (`excluded`, `9084–9085`). Không câu nào lấy dữ kiện từ các vùng bị loại/lặp này; ngoại lệ Q314 dùng một đoạn mất từ trong group covered và đã được ghi riêng ở M-04.

## Gate cấu trúc và red-team

| Gate | Kết quả |
|---|---|
| Source snapshot | Pass tính toàn vẹn: SHA-256 `a686…99bc`, `831134` byte, `9916` logical lines |
| JSON, exact schema, IDs | Pass: 400 object, đúng exact fields; ID liên tục Q001–Q400 |
| Course/chapter | Pass: `courseId=vnr202`, `chapterNum=4`, title khớp `subject.json` |
| Options/answer | Pass cấu trúc: mỗi câu có bốn option khác nhau, answer trong 0–3; semantic answer gate fail tại Q062, Q070, Q281 — H-01 |
| Difficulty quota danh nghĩa | Pass: `160 Nhận biết / 160 Thông hiểu / 80 Vận dụng`; semantic gate fail ở 6 câu — M-02 |
| Kind | Pass schema: `160 nhan_biet_khai_niem / 81 thong_hieu_phan_biet / 79 trinh_tu_quan_he / 80 van_dung_tinh_huong`; semantic mismatch ở M-02 |
| Answer positions | Pass: `100/100/100/100` |
| Answer pattern | Pass: max run `3`; không có chu kỳ độ dài 2–4 lặp ba lần |
| Độ dài chương | Pass: đúng dài duy nhất `137/400 = 34,25%`, ngắn duy nhất `58/400 = 14,50%` |
| Độ dài rolling | Pass: max đúng dài duy nhất `13/20` (cửa sổ bắt đầu Q343), max ngắn duy nhất `7/20` (bắt đầu Q088) |
| Độ dài trung bình | Pass: answer `84,403` ký tự, distractor `81,976`; lệch tương đối `2,960%` |
| Exact absolute cue | Pass validator: `0` câu vi phạm quy tắc exact “answer không cue nhưng từ hai distractor có cue contract” |
| Qualitative option cue | **Fail**: raw scan rộng `101/400`; sau loại false positive còn `81/400` high-confidence — H-02 |
| Explanation/citation | **Fail**: H-01, 9 câu M-01 và đoạn ambiguous M-04 |
| Duplicate chữ | Pass: 0 exact stem, 0 exact option-set |
| Duplicate objective | **Fail**: Q222/Q288 — M-03 |
| Unicode/public strings | Pass: UTF-8 NFC, không BOM, có final LF; không control/bidi/HTML/URL/email/local path |
| Blueprint ID/quota | Pass nội bộ: 68 group (`62 covered / 3 context-only / 1 duplicate / 2 excluded`), `400/400` ID duy nhất; target và difficulty của mọi group covered khớp |
| Blueprint semantic coverage | Pass: không phát hiện khoảng trống nội dung hoàn chỉnh ngoài các group đã có lý do; M-01 là lỗi ownership/citation ở cấp câu |

Tại checkpoint đầu của review, validator skill toàn bank đạt:

```text
PASSED · 850 câu · 0 error · 0 warning
Canonical bank SHA-256: 05c5e70cc484946819ae19b1932fb4ee2f7eff211c73b471c21d6ff256b6f01b
```

Ở checkpoint cuối khi viết báo cáo, một artifact Chương 3 trong worktree dùng chung đã thay đổi trong lúc review. Chạy lại cùng lệnh không còn sạch và trả lỗi ngoài phạm vi Chương 4:

```text
FAILED · 850 câu · 1 error · 0 warning
Canonical bank SHA-256: c3b26082bcf6d60fc6e18e5e4c0c8be2e9d1938ddf773770701a20869f4b64ea
ERROR: Chương 3, topic 'Xây dựng chế độ mới và chính quyền cách mạng':
       tín hiệu dài/ngắn cực trị 66.7% vượt 60%
```

Thay đổi song song đó không làm đổi artifact Chương 4 đã khóa (`ee58cf…e5f28e`), nhưng full-bank validator hiện tại không được tuyên bố pass. `python validate_questions.py --subject vnr202 --check` cũng chưa chạy được gate repository vì registry trả `Unknown subject: vnr202`.

## Điều kiện re-review

1. Tác giả sửa `chapter-04.json`; reviewer không sửa file câu hỏi của tác giả.
2. Sửa H-01, viết lại option sets thuộc H-02 bằng near-miss thực chất, xử lý 9 citation M-01, 6 câu Vận dụng M-02, duplicate M-03 và errata M-04.
3. Nếu đổi ownership/citation Q264 hoặc target group, cập nhật merged blueprint bằng quy trình chuẩn và giữ đúng quota chương.
4. Chạy lại exact cue, red-team mở rộng, length, answer pattern, semantic difficulty, duplicate objective, source traceability, Unicode và blueprint trên toàn Chương 4/toàn bank.
5. Reviewer đọc lại toàn bộ câu bị tác động và các câu cùng objective/cửa sổ lân cận; chỉ đổi finding sang `resolved` khi ghi hash artifact/blueprint mới và bằng chứng tái duyệt.
6. Full-bank validator và repository validator phải sạch trước sign-off toàn ngân hàng; không dùng trạng thái `approved` khi bất kỳ finding High hoặc Medium nào còn mở.

## Trạng thái bàn giao

1. Review độc lập Chương 4: `CHANGES_REQUESTED` trên SHA-256 `ee58cf82768089fd3c25357ad822050480e8989620e82497b3df289e78e5f28e`.
2. Open findings: `Critical 0 / High 2 / Medium 4 / Low 0`.
3. Bất kỳ thay đổi nào đối với `chapter-04.json` làm review này cần được tái duyệt trên hash mới.
4. Review cấp chương này không tự tạo hoặc thay thế `review-signoff.json` toàn ngân hàng.
