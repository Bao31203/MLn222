# Independent review — VNR202 Chương 5

## Phạm vi, artifact và kết luận

- Reviewer: reviewer độc lập, không phải tác giả `chapter-05.json`.
- Ngày review: 2026-08-03.
- Phạm vi câu hỏi: `VNR202-C05-Q001`–`VNR202-C05-Q047`, đã review ngữ nghĩa `47/47` (`100%`).
- Reviewer đã đọc đủ `47` stem, `188` options, `47` answer, difficulty/kind, explanation và citation; cả `141/141` distractor đều được thử bảo vệ riêng trước source và learning objective.
- Source đã đọc trực tiếp: logical lines `9086–9916` của `gt-lich-su-dang-csvn-ban-tuyen-giao-tw.md`, gồm các mục covered, context, duplicate và bibliography cuối file.
- SHA-256 source snapshot: `a686d4395752bf70302dff62cbf1502187f19ebcd1e9406a9a402e97b76799bc` (`831134` byte, `9916` logical lines).
- SHA-256 artifact được delta re-review và khóa: `1775b3753aee54713b7f26fad803397b8d483c0ccba322b8c9a7e4a2babd4152` (`80586` byte).
- Artifact re-review trước delta để truy vết: `6e6ad907248cde5a0df5c900461c610d6e34301a474bcc84c4db3f2104fd9674` (`80406` byte).
- Artifact review ban đầu để truy vết: `bdaed1332522c06123e200949a616bd1398c3fbe217e6e2f076371f58ce37cd8` (`79068` byte).
- SHA-256 blueprint fragment được đối chiếu: `48d31892e3ca9a5fe58f04130f844d07497b00ac38c388ecd395e8980a3fb755`.
- Phạm vi re-review: đọc lại `19/19` câu đã sửa (`Q002`, `Q006`–`Q008`, `Q011`, `Q015`, `Q017`, `Q019`, `Q024`, `Q025`, `Q030`–`Q032`, `Q034`, `Q039`, `Q042`, `Q044`, `Q045`, `Q047`), toàn bộ cửa sổ bị tác động và chạy lại gate trên `47/47` câu.
- Phạm vi delta re-review cuối: đọc lại Q025, cửa sổ Q024–Q026, source tại logical lines `9399–9424`, rồi chạy lại safety, cue, length, answer pattern, duplicate, blueprint và full-bank validator.
- Kết luận review độc lập cấp chương: `APPROVED`; cả `6/6` findings đã đóng, `0` finding Critical/High/Medium còn mở trên đúng artifact hash đã khóa.

Tài liệu điều khiển đã đọc: `AUTHORING.md`, `ERRATA.md`, `subject.json`, `bank-config.json`, merged `blueprint.json`, fragment `blueprint-intro-conclusion.json`, cùng các hợp đồng `authoring-contract`, `output-contract` và `review-signoff` của skill.

## Tổng findings

| Severity | Tổng | Open | Resolved |
|---|---:|---:|---:|
| Critical | 1 | 0 | 1 |
| High | 1 | 0 | 1 |
| Medium | 1 | 0 | 1 |
| Low | 3 | 0 | 3 |
| **Tổng** | **6** | **0** | **6** |

## Critical

### C-01 — VNR202-C05-Q025 — biến mô tả xung đột lịch sử thành chỉ dẫn hành động chung

- Severity: Critical
- Lý do: Bản sửa đã tạo được dữ kiện đủ cho thao tác Vận dụng, nhưng stem bỏ chủ thể lịch sử cụ thể và đặt một địa bàn chung ở hiện tại với “lực lượng cách mạng”, “chính quyền đối phương đang rệu rã”, lực lượng bên ngoài sắp kéo vào, rồi hỏi “nên chỉ đạo thế nào?”. Answer tiếp tục đưa ra chỉ dẫn chớp thời cơ, đẩy lùi nguy cơ và xử lý quan hệ quốc tế. Cách đóng khung này chuyển bài học về Cách mạng Tháng Tám thành lời khuyên vận hành cho một tình huống lật đổ/xung đột không còn được khóa trong phân tích lịch sử, vi phạm trực tiếp authoring-contract §7: không biến mô tả lịch sử về bạo lực, xung đột hoặc hành vi nguy hiểm thành chỉ dẫn hành động hiện đại.
- Bằng chứng nguồn: logical lines `9399–9424` mô tả và lý giải một thắng lợi lịch sử của Cách mạng Tháng Tám; nguồn không đưa ra khuyến nghị cho một địa bàn chung ở hiện tại.
- Đề xuất: Khóa tình huống rõ vào một quyết định lịch sử năm 1945, chẳng hạn một nhóm nghiên cứu đang tái dựng nhận định của cơ quan lãnh đạo trước thời cơ lịch sử, rồi hỏi cách giải thích nào phù hợp nhất. Không dùng ngôi chỉ đạo, không hỏi người học nên tổ chức hành động gì, và không thêm chi tiết tác nghiệp.
- Status: `resolved`
- Re-review: trên artifact `1775…4152`, Q025 được neo rõ vào “một bản tổng kết về Cách mạng Tháng Tám năm 1945”, hỏi cách giải thích phù hợp cho “quyết định khởi nghĩa ở thời điểm đó”. Cả bốn options mô tả cách giải thích những quyết định lịch sử đã diễn ra; explanation cũng giới hạn rõ bối cảnh năm 1945. Không còn ngôi chỉ đạo, khuyến nghị hiện tại hay chi tiết tác nghiệp. Answer và ba distractor vẫn được logical lines `9399–9424` bảo vệ/phân biệt, difficulty Vận dụng và mapping `KT-10` không đổi.

## High

### H-01 — 18/47 câu — correct answer là phương án cân bằng duy nhất, distractor tự loại bằng phủ định/cắt bỏ

- Severity: High
- Lý do: Exact absolute-cue gate của contract vẫn pass, nhưng red-team ngữ nghĩa phát hiện `18/47` câu mà đáp án đúng không mang tín hiệu phủ định/cắt bỏ, trong khi ít nhất hai distractor dùng trực tiếp `không`, `chỉ`, `bỏ`, `tách`, `thay`, `giới hạn`, `dừng` hoặc `lược`. Sau khi thử bảo vệ từng distractor, nhiều phương án sai tự loại bằng việc phủ nhận một điều kiện hiển nhiên hoặc tuyệt đối hóa một vế; đáp án đúng trở thành lựa chọn duy nhất đầy đủ, cân bằng và học thuật. Đây là pattern đoán đáp án có hệ thống dù không vi phạm lexicon tuyệt đối hẹp.
- IDs: `Q002`, `Q006`–`Q008`, `Q011`, `Q017`, `Q019`, `Q024`, `Q025`, `Q030`–`Q032`, `Q034`, `Q039`, `Q042`, `Q044`, `Q045`, `Q047`.
- Bằng chứng artifact: Q007 để ba distractor lần lượt “chỉ... không”, “chủ yếu... không” và “không còn cần thiết”; Q019 dùng “chủ yếu”, “chỉ... không cần” và “tách”; Q025 phủ nhận lần lượt thực lực, thời cơ hoặc vai trò lãnh đạo trong ba distractor; Q030 đặt cả ba distractor ở dạng quan hệ bị phủ định; Q039 làm ba distractor đều tuyệt đối hóa nguồn lực bên ngoài/nội lực hoặc tách hội nhập, còn answer là tổ hợp cân bằng duy nhất.
- Đối chiếu source: các đáp án đúng tương ứng đều có căn cứ trong logical lines `9133–9844`; finding không phải lỗi answer mà là chất lượng và tính song song của option set.
- Đề xuất: Viết lại distractor thành near-miss cùng phạm trù và cùng cấu trúc ngữ pháp, sai đúng một điều kiện, quan hệ, phạm vi, chủ thể hoặc chặng lịch sử có thể nhầm thật. Không chỉ xóa từ phủ định; sau sửa phải che answer và thử chọn chỉ theo văn phong, đồng thời chạy lại cue/length toàn chương.
- Status: `resolved`
- Re-review: trên artifact `6e6a…9674`, reviewer đã che answer và thử lại từng option set của toàn bộ `18` ID. Các distractor nay là near-miss cùng trục; heuristic phủ định/cắt bỏ rộng giảm từ `18/47` xuống `0/47`. Exact-cue gate có cue ở `2/47` đáp án và `12/141` distractor, không có câu vi phạm quy tắc hai distractor.

## Medium

### M-01 — VNR202-C05-Q015, Q025 — tình huống chỉ trang trí cho thao tác nhớ/giải thích trực tiếp

- Severity: Medium
- Lý do: Q015 không cung cấp điều khoản hay xung đột lợi ích cụ thể của một thỏa thuận; người học chỉ chọn lại danh sách nguyên tắc độc lập, chủ quyền, không can thiệp, bình đẳng, cùng có lợi được nguồn nêu trực tiếp. Q025 cũng chỉ yêu cầu chọn tổ hợp đầy đủ “thực lực–thời cơ–nguy cơ–quan hệ quốc tế”; cụm “một nhận định muốn giải thích” không buộc áp dụng nguyên tắc vào dữ kiện mới. Hai câu gần `Nhận biết/Thông hiểu` hơn `Vận dụng/van_dung_tinh_huong`.
- Bằng chứng nguồn: Q015 — logical lines `9219–9226`; Q025 — logical lines `9399–9424`.
- Đề xuất: Q015 cần một mini-case có các điều khoản đủ gần nhau để suy ra phương án giữ đồng thời lợi ích, độc lập và cùng có lợi. Q025 cần dữ kiện về mức chuẩn bị, thời cơ và nguy cơ để người học suy ra cách xử lý, không chỉ chọn danh sách. Nếu hạ nhãn thì phải bù quota `9` câu Vận dụng của chương và quota nhóm.
- Status: `resolved`
- Re-review: Q015 nay là mini-case có điều khoản cụ thể để chọn phương án đồng thời giữ độc lập, bình đẳng và cùng có lợi. Q025 nay có đủ dữ kiện về thực lực, thời cơ, nguy cơ và quan hệ quốc tế để đòi hỏi suy luận Vận dụng; finding difficulty cũ vì thế đã đóng. Việc đóng M-01 chỉ xác nhận thao tác nhận thức, không xóa finding an toàn C-01 mới phát sinh do cách đóng khung Q025.

## Low

### L-01 — VNR202-C05-Q002 — cụm “nhận thức đúng hơn nữa” chưa sát thuật ngữ nguồn

- Severity: Low
- Lý do: Answer A viết “nhận thức đúng hơn nữa”, trong khi source dùng “được nhận thức đúng đắn hơn”. Câu vẫn có một đáp án đúng và explanation diễn giải đúng, nhưng cụm hiện tại gượng và yếu hơn thuật ngữ nguồn.
- Bằng chứng nguồn: logical lines `9145–9151`.
- Đề xuất: Đổi thành “nhận thức đúng đắn hơn và xây dựng chủ nghĩa xã hội hiệu quả hơn”.
- Status: `resolved`
- Re-review: Q002 đã dùng đúng cụm “nhận thức đúng đắn hơn” và giữ một đáp án đúng duy nhất trên source lines `9145–9151`.

### L-02 — VNR202-C05-Q047 — evidence tại mục lá chưa bảo vệ hết “trách nhiệm/động lực giáo dục”

- Severity: Low
- Lý do: Logical lines `9816–9844` trực tiếp tôn vinh hy sinh, đóng góp và nêu quyền tự hào, nhưng không trực tiếp phát biểu “bồi dưỡng trách nhiệm” hay “vai trò giáo dục, động lực” như answer/explanation. Các ý giáo dục này có căn cứ ở logical lines `225–242` và `308–316` của phần nhập môn, nên claim không ngoài toàn corpus; tuy nhiên citation hiện tại chưa cho reviewer truy vết trọn luận cứ tại mục lá đã khai báo.
- Đề xuất: Hoặc thu hẹp answer/explanation về sự tôn vinh, tự hào và nhận thức truyền thống trong lines `9816–9844`, hoặc ghi citation ghép tới đoạn nguồn trực tiếp nêu vai trò giáo dục/động lực.
- Status: `resolved`
- Re-review: answer, explanation và evidence của Q047 đã được thu hẹp về tôn vinh hy sinh, đóng góp và bồi đắp niềm tự hào; toàn bộ claim hiện được logical lines `9816–9844` bảo vệ trực tiếp.

### L-03 — Chương 5 — tín hiệu độ dài sát ngưỡng và lệch một phía

- Severity: Low
- Lý do: Gate danh nghĩa vẫn pass, nhưng đáp án đúng ngắn duy nhất `21/47 = 44,68%`, chỉ thấp hơn ngưỡng `45%` một câu, trong khi đúng dài duy nhất là `0/47`. Độ dài trung bình answer `83,00` ký tự so với distractor `90,16`, thấp hơn `7,94%`. Pattern “không chọn phương án dài duy nhất; ưu tiên phương án ngắn” chưa vượt gate rolling nhưng là rủi ro red-team, nhất là khi kết hợp H-01.
- Đề xuất: Khi sửa H-01, cân option theo cùng mức chi tiết để phân tán hạng độ dài; không padding chữ rỗng. Sau sửa chạy lại toàn chương vì một thay đổi có thể đẩy unique-shortest vượt `45%`.
- Status: `resolved`
- Re-review: đúng dài duy nhất hiện `8/47 = 17,02%`, ngắn duy nhất `12/47 = 25,53%`, rolling max `11/20`; độ dài trung bình answer `89,21` và distractor `91,31`, lệch `2,30%`. Không còn tín hiệu một phía sát ngưỡng.

## Checklist review 47/47

Với từng range dưới đây, reviewer đã đối chiếu trực tiếp source, kiểm stem/objective, difficulty-kind, bốn options, thử bảo vệ ba distractor, answer, explanation, citation, cue, length, errata và trùng objective.

| Nhóm blueprint | Source logical lines | Question IDs | Đã kiểm |
|---|---:|---|---:|
| `KT-01` | 9133–9162 | Q001–Q004 | 4/4 |
| `KT-02` | 9164–9183 | Q005–Q008 | 4/4 |
| `KT-03` | 9185–9212 | Q009–Q012 | 4/4 |
| `KT-04` | 9214–9226 | Q013–Q015 | 3/3 |
| `KT-05` | 9228–9256 | Q016–Q019 | 4/4 |
| `KT-06` | 9258–9268 | Q020–Q021 | 2/2 |
| `KT-09` | 9374; 9379–9381; 9426–9430; 9475–9477 | Q022 | 1/1 |
| `KT-10` | 9379–9424 | Q023–Q025 | 3/3 |
| `KT-11` | 9426–9473 | Q026–Q028 | 3/3 |
| `KT-13` | 9611–9640 | Q029–Q031 | 3/3 |
| `KT-14` | 9642–9679 | Q032–Q034 | 3/3 |
| `KT-15` | 9681–9714 | Q035–Q037 | 3/3 |
| `KT-16` | 9716–9749 | Q038–Q040 | 3/3 |
| `KT-17` | 9751–9801 | Q041–Q045 | 5/5 |
| `KT-18` | 9803–9844 | Q046–Q047 | 2/2 |
| **Tổng** | **9133–9844** | **Q001–Q047** | **47/47** |

Các nhóm `KT-00`, `KT-07`, `KT-08`, `KT-12` và `KT-19` cũng đã được đọc trực tiếp để xác nhận trạng thái `context-only`/`duplicate`/`excluded`; không có câu lấy từ seam đầu, câu ôn tập, phần tổng kết lặp hoặc bibliography.

## Gate cấu trúc và red-team

| Gate | Kết quả |
|---|---|
| Source snapshot | Pass: SHA-256 `a686…99bc`, `831134` byte, `9916` logical lines |
| JSON, exact schema, IDs | Pass: 47 object, đúng exact fields; ID liên tục Q001–Q047 |
| Course/chapter | Pass: `courseId=vnr202`, `chapterNum=5`, title khớp `subject.json` |
| Options/answer | Pass: mỗi câu có 4 option khác nhau, answer trong 0–3; không phát hiện đáp án đúng thứ hai |
| Difficulty quota danh nghĩa | Pass: `19 Nhận biết / 19 Thông hiểu / 9 Vận dụng`; Q015/Q025 đều đạt thao tác Vận dụng về mặt ngữ nghĩa, M-01 đã đóng |
| Answer positions | Pass: `12/12/11/12` |
| Answer pattern | Pass: max run `3`; không có chu kỳ độ dài 2–4 lặp ba lần |
| Độ dài chương | Pass: đúng dài duy nhất `7/47 = 14,89%`, ngắn duy nhất `12/47 = 25,53%`; rolling max `10/20`; Q025 không còn là đáp án dài/ngắn duy nhất |
| Độ dài trung bình | Pass: answer `89,11` ký tự, distractor `91,43`; lệch `2,54%` |
| Exact absolute cue | Pass: `2/47` answer và `12/141` distractor có cue; `0` câu vi phạm quy tắc “từ hai distractor” |
| Qualitative option cue | Pass: `0/47` câu còn pattern phủ định/cắt bỏ hệ thống; H-01 đã đóng bằng red-team thủ công trên các option set bị sửa |
| Explanation | Pass: 0 explanation generic, 0 explanation dưới 24 từ, 0 answer echo đơn thuần; L-02 đã đóng |
| Duplicate chữ | Pass: 0 exact stem, 0 exact option-set, 0 cặp stem similarity từ `0,82`, 0 cặp Jaccard từ `0,65` |
| Duplicate objective | Pass sau đọc thủ công: các cụm “dân là gốc”, sức mạnh dân tộc–thời đại và xây dựng Đảng được hỏi ở phạm vi/thao tác khác nhau |
| Citation/source | Pass: `47/47` section nằm đúng source range của nhóm; answer/explanation/evidence đều được corpus tại mục lá bảo vệ |
| ERRATA/out-of-corpus | Pass: không dùng mục cấm, số liệu đương thời, câu ôn tập, bibliography hay chuỗi OCR mơ hồ làm đáp án |
| An toàn nội dung | Pass: Q025 chỉ yêu cầu phân tích quyết định lịch sử năm 1945, không còn chỉ dẫn hành động hiện đại; C-01 đã đóng |
| Unicode/public strings | Pass: UTF-8 NFC, không BOM, có final LF; không control/bidi/HTML/URL/email/local path |
| Blueprint | Pass: `47/47` ID, không trùng/thiếu; target và difficulty quota của cả 15 nhóm covered đều khớp; fragment khớp phần Chương 5 trong merged blueprint tại thời điểm review |

Full-bank skill validator đã pass trên artifact delta: `850` câu, `0` error, `0` warning; canonical bank SHA-256 `7d37babd253d69a3c7c018fd47452616b799307c61af4ecad819e682f794f174`.

## Kết luận delta re-review

1. C-01 đã đóng trên đúng artifact `1775…4152`; reviewer không chỉnh sửa file câu hỏi của tác giả.
2. Q025 vẫn có một đáp án đúng, ba near-miss hợp lý, source/citation đúng mục lá và thao tác Vận dụng thực chất; Q024–Q026 không phát sinh tác động ngữ nghĩa.
3. Safety, cue, length, answer pattern, duplicate, blueprint và full-bank validator đều pass; canonical bank hash đã được ghi ở trên.
4. Mọi thay đổi nội dung sau hash đã khóa làm kết luận này mất hiệu lực và cần delta re-review mới.
