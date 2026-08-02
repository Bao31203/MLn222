# Review C — HCM202 Chương 3 và Chương 5

## Phạm vi và trạng thái

- Reviewer: Reviewer C độc lập; không phải tác giả `chapter-03.json` hoặc `chapter-05.json`.
- Phạm vi: 100/100 câu Chương 3 và 75/75 câu Chương 5; tổng cộng 175 câu, 700 phương án.
- Nguồn duy nhất: `Giáo trình tư tưởng Hồ Chí Minh.md`, SHA-256 `2DF4AE100168AFAE7BD7830705DB466FB1C1A36474576F3CF8E0F2741C1CEEC4`.
- Vùng nguồn đã đọc toàn bộ: Chương 3 dòng 2195–3972; Chương 5 dòng 5653–6902. Không dùng metadata Studocu hoặc mục lục lặp từ dòng 8919.
- Bản phê duyệt cuối:
  - Chương 3: SHA-256 `961F03D52EDC347A67A115F3872F1AEBB2BCE17E0B479C503DD454D9A0A93A1C`.
  - Chương 5: SHA-256 `A454C46AB6BCD87315D08A6AC4D2ADF1232AE8B4E8638E285BEA2F25F3762C23`.
- Bản re-review trước remediation cuối:
  - Chương 3: SHA-256 `542CAF9822586FB47B6A653E3DAB85AEA0640128B39292E7B8E8847E15BA2B59`.
  - Chương 5: SHA-256 `490D599FEA3C828CD91071844740A53797585EBD2248078DA6D5A55EDAF85947`.
- Bản review ban đầu:
  - Chương 3: SHA-256 `54DC19A807EA79455FBA2140916643778C573ACB5612CD3460B0A198F6AF3B9A`.
  - Chương 5: SHA-256 `2846AECFFE7FD994390868CA5BD8794B1EE1C8BD3DA3782F361D024B154EB974`.
- Trạng thái: **APPROVED / Reviewer C signed off**. Cả tám finding group đã được xử lý và kiểm lại trên đúng hai hash phê duyệt cuối; không còn finding mở trong phạm vi Reviewer C.

## Mapping remediation cuối

| Finding | Chương | Trạng thái | Bằng chứng chốt |
|---|---:|---|---|
| H-01 | 3, 5 | `resolved` | Pattern dài/ngắn đảo pha đã được phá; mọi blueprint và rolling window đều qua gate |
| M-01 | 3 | `resolved` | Mười câu vận dụng đã được đóng khung theo giáo trình xuất bản năm 2021 |
| M-02 | 3, 5 | `resolved` | Q019, Q064 và Q014 dùng bốn lựa chọn song song, không còn cue độ dài |
| M-03 | 3, 5 | `resolved` | 66 bộ lựa chọn đã dùng near-miss có nghĩa; exact extended-cue gate còn 0 câu vi phạm |
| L-01 | 3, 5 | `resolved` | Bảy câu lệch độ dài đã được cân lại bằng nội dung cùng phạm trù |
| L-02 | 3, 5 | `resolved` | Mẫu ba distractor cùng tuyệt đối hóa đã được thay bằng sai khác về phạm vi, điều kiện hoặc quan hệ |
| L-03 | 3 | `resolved` | Q025 trỏ tới đúng mục II.2.b và evidence chứa trực tiếp hình ảnh người cầm lái |
| L-04 | 3, 5 | `resolved` | Q069 và Q013 không còn đáp án đúng là outlier ngắn |

## Phương pháp

1. Đọc `AUTHORING.md`, `ERRATA.md`, Phase 04 và toàn văn hai chương nguồn.
2. Kiểm tuần tự từng câu, không lấy mẫu: learning objective; độ khó/kind; stem; bốn phương án; đáp án; explanation; `source.section`; `source.text`.
3. Với từng distractor, thử diễn giải theo hướng làm nó đúng; nếu có thể bảo vệ như một đáp án thứ hai hoặc quá vô lý để làm nhiễu, ghi finding.
4. Đối chiếu citation với mục lá và nội dung nguồn; kiểm riêng lỗi OCR/errata, thuật ngữ “chủ nghĩa quốc tế vô sản”, các phần “hiện nay” và tình huống có nguy cơ đòi kiến thức thời sự.
5. Chạy scan schema/quota, vị trí đáp án, chuỗi lặp, độ dài, Unicode, unsafe token, trùng chính xác và similarity. Scan similarity được chạy giữa hai chương và chéo cả 480 câu hiện có với ngưỡng `0.82`.

## Checklist 100%

| Hạng mục | Đã kiểm | Kết quả |
|---|---:|---|
| Stem, learning objective, difficulty và kind | 175/175 | M-01 đã đóng; các câu vận dụng được định khung theo giáo trình năm 2021 |
| Bốn options, một đáp án và khả năng bảo vệ từng distractor | 700/700 | M-02, L-01, L-02, M-03 và L-04 đã đóng; không còn câu có từ hai distractor mang extended cue khi đáp án đúng không có cue |
| Explanation | 175/175 | Không phát hiện explanation đảo đáp án hoặc mâu thuẫn nguồn |
| Citation section và evidence | 175/175 | L-03 đã đóng: Q025 trỏ trực tiếp tới mục II.2.b có đầy đủ hình ảnh người cầm lái |
| OCR, ERRATA, metadata và dữ kiện ngoài phạm vi | 175/175 | Không dùng chuỗi cấm; “chủ nghĩa quốc tế vô sản” đã được sửa đúng |
| Phần vận dụng “hiện nay” | 25/25 | Đều được đóng khung là nội dung của giáo trình xuất bản năm 2021 |
| Tình huống vận dụng và an toàn bạo lực lịch sử | 35/35 | Không đòi dữ kiện thời sự; Q034–Q037 Chương 3 giữ đúng bối cảnh lịch sử và không biến thành chỉ dẫn đương đại |
| Trùng, na ná, pattern và độ dài | 175/175 | Không có stem similarity ≥0.82; H-01 và L-04 đã đóng sau khi cân lại theo chương, blueprint và rolling window |

## Kết quả scan hỗ trợ

| Gate | Chương 3 | Chương 5 |
|---|---:|---:|
| Số câu | 100 | 75 |
| Difficulty | 40/40/20 | 30/30/15 |
| A/B/C/D | 25/25/25/25 | 19/19/18/19 |
| Max answer run | 2 | 2 |
| Chu kỳ độ dài 2–4 lặp ba lần | 0 | 0 |
| Đáp án đúng dài duy nhất | 30/100 = 30% | 13/75 = 17,3% |
| Đáp án đúng ngắn duy nhất | 25/100 = 25% | 22/75 = 29,3% |
| Tỷ lệ độ dài TB đúng/nhiễu | 1,0320 | 0,9857 |
| Câu có bốn độ dài khác nhau | 61 | 53 |
| Hạng đúng dài nhất/nhì/ba/ngắn nhất trên câu có bốn độ dài khác nhau | 17/17/10/17 | 6/19/12/16 |
| Rolling window 20: max dài/ngắn duy nhất | 9/20 và 9/20 | 5/20 và 10/20 |
| Extended-cue: đáp án/distractor/câu vi phạm | 7/41/0 | 1/41/0 |
| Stem exact/fuzzy ≥0.82 nội bộ và chéo 480 câu | 0 | 0 |
| Unsafe/OCR token đã liệt kê trong ERRATA | 0 | 0 |

Hai chương đạt toàn bộ ngưỡng số học cấp chương, cửa sổ `≤14/20` và gate blueprint `≤60%`. Chương 3 có tỷ lệ dài/ngắn duy nhất cao nhất theo blueprint là `42,9%/41,2%`; Chương 5 là `25%/42,9%`, không còn quy luật đảo pha có thể dùng để dự đoán đáp án.

## Critical — 0

Không phát hiện finding Critical.

## High — 1 finding group

### H-01 — C03-Q075–Q100 và C05-Q025–Q075 — pattern độ dài đảo pha theo blueprint, rolling-window sát biên

- **Chương 3:** trong nhóm quan hệ độc lập dân tộc – chủ nghĩa xã hội, đáp án đúng dài duy nhất ở `9/14` câu Q075–Q088; trong nhóm vận dụng hiện nay, tỷ lệ này là `8/12` câu Q089–Q100. Ba cửa sổ Q077–Q096, Q078–Q097 và Q079–Q098 đều đạt đúng biên `14/20` đáp án đúng dài duy nhất. Ví dụ Q078 có độ dài `103/80/84/79` và Q094 có `101/85/76/79`.
- **Chương 5:** pattern đảo chiều rõ hơn. Đáp án đúng ngắn duy nhất ở `8/14` câu Q025–Q038 và `6/8` câu Q039–Q046, rồi chuyển thành dài duy nhất ở `10/13` câu Q063–Q075. Rolling window đạt `13/20` ngắn duy nhất ở đoạn Q023–Q046 và `13/20` dài duy nhất ở các cửa sổ kết thúc tại Q071–Q075. Ví dụ Q030 có `80/97/96/91`, Q043 có `52/70/63/66`, còn Q063 có `82/84/82/104` và Q069 có `112/96/92/90`.
- **Đánh giá:** từng cửa sổ chưa vượt ngưỡng cứng `14/20`, nhưng cách phân bố vi phạm yêu cầu “không để các nhóm blueprint dùng quy luật độ dài đảo chiều nhau”. Người học có thể đổi chiến thuật từ chọn ngắn sang chọn dài theo đoạn nội dung.
- **Yêu cầu sửa:** cân lại phương án bằng near-miss cùng phạm trù và mức chi tiết; phân tán hạng đúng trong từng nhóm blueprint, không chỉ giảm chỉ số gộp và không thêm mệnh đề rỗng.
- **Kết quả re-review cuối:** Chương 3 giảm dài duy nhất ở Q075–Q088 xuống `6/14`, ở Q089–Q100 xuống `4/12`; rolling dài/ngắn duy nhất cao nhất đều là `9/20`. Chương 5 giảm ngắn duy nhất ở Q025–Q038 xuống `6/14`, ở Q039–Q046 xuống `3/8`, và dài duy nhất ở Q063–Q075 xuống `2/13`; rolling dài/ngắn duy nhất cao nhất là `5/20` và `10/20`. Mọi nhóm blueprint có từ tám câu đều dưới hoặc bằng `42,9%` cho tín hiệu nổi trội; các phương án được cân bằng bằng near-miss có nội dung, không dùng padding rỗng.
- **Trạng thái:** `resolved`.

## Medium — 3 finding groups

### M-01 — Chưa đóng khung năm 2021 cho phần vận dụng “hiện nay” của Chương 3

- IDs: `HCM202-C03-Q090`, `Q091`, `Q092`, `Q093`, `Q094`, `Q095`, `Q096`, `Q097`, `Q099`, `Q100`.
- Lý do: Các câu lấy learning objective từ mục IV “giai đoạn hiện nay” nhưng stem/explanation/evidence chưa nói rõ đây là cách trình bày của giáo trình xuất bản năm 2021. Một số stem dùng phát biểu hiện tại như đặc điểm hệ thống chính trị hoặc nhiệm vụ xây dựng Đảng, dễ bị hiểu là tuyên bố đã cập nhật đến thời điểm sử dụng ngân hàng. `Q089` và `Q098` đã có khung năm 2021 nên không thuộc finding.
- Đối chiếu nguồn: Chương 3, dòng 3803–3955.
- Đề xuất: Ghi rõ ngay trong stem hoặc cụm stem–explanation: “Theo phần vận dụng của giáo trình xuất bản năm 2021…”. Riêng `Q091` nên định danh rõ Cương lĩnh được giáo trình nhắc tới thay vì chỉ viết “Cương lĩnh của Đảng”. Không thêm dữ kiện sau năm 2021.
- Kết quả re-review: cả 10 stem đều ghi rõ “Theo phần vận dụng của giáo trình xuất bản năm 2021”; Q091 định danh `Cương lĩnh xây dựng đất nước trong thời kỳ quá độ lên chủ nghĩa xã hội` và việc bổ sung, phát triển tại Đại hội XI. Không có dữ kiện sau năm 2021.
- Trạng thái: `resolved`.

### M-02 — Ba câu bị mớm đáp án mạnh bởi độ dài không cân bằng

- IDs và độ dài A/B/C/D:
  - `HCM202-C03-Q019`: `52/55/42/26`, đáp án D.
  - `HCM202-C03-Q064`: `59/22/30/53`, đáp án B.
  - `HCM202-C05-Q014`: `71/75/39/60`, đáp án C.
- Lý do: Đáp án đúng ngắn hơn trung bình distractor lần lượt khoảng 48%, 54% và 43%. Người học có thể chọn bằng hình thức mà không cần nắm kiến thức; các distractor cũng không song song về mức khái quát.
- Đề xuất: Viết lại cả bốn phương án cùng một phạm trù và cấp độ. `Q019` nên dùng bốn tên con đường ngắn, song song; `Q064` dùng bốn tên tổ chức có cấu trúc tương đương; `Q014` dùng các tổ hợp lực lượng ngắn, tương đương. Không kéo dài đáp án đúng bằng padding máy móc.
- Kết quả re-review: Q019 có độ dài `29/26/26/26`, Q064 `25/22/21/18`, Q014 `33/34/39/39`; cả ba dùng bốn lựa chọn cùng phạm trù, song song và không còn cue ban đầu.
- Trạng thái: `resolved`.

### M-03 — Nhiều câu còn ít nhất hai distractor mang extended cue trong khi đáp án đúng không có cue

- Chuẩn scan: biểu thức độc lập từ của `AUTHORING.md`/`test_pipeline.py` với danh sách `chỉ`, `mọi`, `toàn bộ`, `hoàn toàn`, `không cần`, `tự động`, `duy nhất`, `bất kỳ`, `thay thế`, `đứng ngoài`, `khép kín`, `loại bỏ`, `phủ nhận`, `tuyệt đối`, `không bao giờ`; chỉ ghi lỗi khi đáp án đúng không chứa cue nhưng có từ hai distractor chứa cue trở lên.
- IDs Chương 3 (37): `HCM202-C03-Q006`, `Q011`, `Q013`, `Q020`, `Q025`, `Q026`, `Q031`, `Q033`, `Q035`, `Q038`, `Q040`, `Q041`, `Q048`, `Q049`, `Q051`, `Q052`, `Q053`, `Q054`, `Q056`, `Q057`, `Q066`, `Q067`, `Q070`, `Q072`, `Q073`, `Q074`, `Q075`, `Q080`, `Q082`, `Q086`, `Q087`, `Q090`, `Q092`, `Q093`, `Q097`, `Q099`, `Q100`.
- IDs Chương 5 (29): `HCM202-C05-Q001`, `Q003`, `Q004`, `Q006`, `Q009`, `Q015`, `Q018`, `Q025`, `Q027`, `Q028`, `Q031`, `Q032`, `Q033`, `Q035`, `Q037`, `Q038`, `Q041`, `Q044`, `Q046`, `Q049`, `Q050`, `Q052`, `Q053`, `Q059`, `Q061`, `Q067`, `Q068`, `Q070`, `Q073`.
- Lý do: dù L-02 cũ đã được xử lý đúng theo tập ID và tiêu chí review lúc đó, gate chuẩn hóa mở rộng vẫn phát hiện 66 câu có thể bị loại trừ phương án bằng tín hiệu văn phong thay vì kiến thức. Finding mới này được tách riêng, không mở lại L-02.
- Yêu cầu sửa: thay các distractor được gắn cue bằng near-miss có nghĩa, cùng phạm trù và mức chi tiết; mỗi câu phải còn nhiều nhất một distractor có extended cue khi đáp án đúng không có cue. Không chỉ xóa từ khóa hoặc làm câu sai trở nên mơ hồ.
- Kết quả re-review cuối: scan chuẩn hóa trên toàn bộ 175 câu ghi nhận Chương 3 có 7 đáp án và 41 distractor mang cue, Chương 5 có 1 đáp án và 41 distractor mang cue, nhưng cả hai chương đều có `0` câu vi phạm điều kiện từ hai distractor trở lên khi đáp án đúng không có cue. Kiểm thủ công 66 ID xác nhận các phương án được thay bằng near-miss sai phạm vi, điều kiện, thứ tự ưu tiên hoặc quan hệ; không có đáp án đúng thứ hai và không có thao tác chỉ xóa từ khóa.
- Trạng thái: `resolved`.

## Low — 4 finding groups

### L-01 — Một số câu còn lệch độ dài đáng chú ý dù chưa làm hỏng gate cấp chương

- IDs: `HCM202-C03-Q007`, `Q008`, `Q027`, `Q057`, `Q068`; `HCM202-C05-Q042`, `Q043`.
- Độ dài A/B/C/D tương ứng:
  - C03-Q007 `60/55/82/58`; C03-Q008 `40/59/61/58`; C03-Q027 `44/69/43/49`; C03-Q057 `73/72/113/68`; C03-Q068 `66/93/63/67`.
  - C05-Q042 `87/84/56/94`; C05-Q043 `52/73/71/82`.
- Lý do: Đáp án đúng dài/ngắn hơn trung bình nhiễu khoảng 30–59%, tạo cue phụ và làm phương án kém song song.
- Đề xuất: Rút gọn mệnh đề thừa ở phương án dài hoặc viết distractor gần-miss cùng cấp độ với đáp án; giữ nguyên learning objective và answer index nếu tác giả cần bảo toàn quota.
- Kết quả re-review: bảy câu đã được cân lại bằng nội dung có nghĩa. Độ dài cuối lần lượt là C03-Q007 `63/67/63/70`, Q008 `58/68/66/64`, Q027 `62/61/62/61`, Q057 `78/81/76/68`, Q068 `90/93/84/79`; C05-Q042 `91/93/86/93`, Q043 `66/70/63/66`. Các lựa chọn hiện cùng phạm trù và không còn mức lệch 30–59% đã nêu.
- Trạng thái: `resolved`.

### L-02 — Mẫu distractor tuyệt đối hóa lặp nhiều, làm giảm sức phân hóa

- IDs Chương 3: `HCM202-C03-Q004`, `Q007`, `Q022`, `Q029`, `Q030`, `Q042`, `Q045`, `Q047`, `Q054`, `Q058`, `Q059`, `Q062`, `Q069`, `Q074`, `Q084`, `Q094`, `Q096`.
- IDs Chương 5: `HCM202-C05-Q005`, `Q007`, `Q008`, `Q010`, `Q012`, `Q013`, `Q017`, `Q021`, `Q022`, `Q023`, `Q024`, `Q026`, `Q030`, `Q034`, `Q036`, `Q042`, `Q048`, `Q051`, `Q055`, `Q056`, `Q057`, `Q058`, `Q065`, `Q075`.
- Lý do: Cả ba distractor trong mỗi câu cùng dựa nhiều vào tín hiệu tuyệt đối như “chỉ”, “mọi”, “hoàn toàn”, “không cần”, “tự động”. Không phương án nào trở thành đáp án đúng thứ hai, nhưng người học có thể loại nhanh theo văn phong thay vì phân biệt khái niệm.
- Đề xuất: Với mỗi câu, thay ít nhất một hoặc hai distractor bằng near-miss có thể được người chưa hiểu sâu bảo vệ: đúng nguyên tắc nhưng sai phạm vi, sai thứ tự ưu tiên, thiếu một điều kiện hoặc đánh tráo quan hệ nền tảng–phạm vi. Tránh chỉ xóa từ tuyệt đối mà không cải thiện nội dung.
- Kết quả re-review: toàn bộ ID đã có ít nhất một hoặc hai distractor near-miss theo sai phạm vi, thứ tự ưu tiên hoặc điều kiện; không còn cấu trúc cả ba distractor cùng bị loại chỉ bằng từ tuyệt đối. Khía cạnh độ dài còn lại tại C03-Q069 và C05-Q013 được tách riêng thành L-04.
- Trạng thái: `resolved`.

### L-03 — Citation của Q025 chưa trỏ tới đoạn thể hiện đầy đủ hình ảnh “người cầm lái”

- ID: `HCM202-C03-Q025`.
- Lý do: Stem quy hình ảnh “người cầm lái vững thì thuyền mới chạy” cho *Đường Kách mệnh*. Mục đang cite ở dòng 2593–2601 nêu tác phẩm và câu “Đảng có vững cách mệnh mới thành công…” nhưng bản Markdown dừng bằng dấu lược; hình ảnh đầy đủ lại xuất hiện rõ ở dòng 3383–3391 thuộc `II.2.b Động lực của chủ nghĩa xã hội ở Việt Nam`.
- Đề xuất: Hoặc đổi citation/evidence sang đoạn có câu đầy đủ và điều chỉnh stem để không gán nguồn tác phẩm vượt quá evidence trực tiếp, hoặc ghi citation đủ rõ để nối hai đoạn nguồn kiểm chứng được. Không dùng kiến thức ngoài snapshot để lấp phần bị lược.
- Kết quả re-review: stem đã đổi thành “Theo hình ảnh được giáo trình dẫn”; citation trỏ `Chương 3 > II.2.b Động lực của chủ nghĩa xã hội ở Việt Nam`, và evidence chứa trực tiếp hình ảnh người cầm lái cùng con thuyền.
- Trạng thái: `resolved`.

### L-04 — C03-Q069 và C05-Q013 — cue độ dài còn lại sau khi sửa distractor tuyệt đối hóa

- **Độ dài:** C03-Q069 `57/79/91/85`, đáp án A; C05-Q013 `97/97/100/62`, đáp án D.
- **Lý do:** distractor đã hợp lý hơn về nội dung, nhưng đáp án đúng vẫn ngắn hơn trung bình ba distractor lần lượt khoảng 33% và 37%. Cả hai đáp án là một tổ hợp khái quát ngắn, trong khi ba phương án sai là mệnh đề có thêm điều kiện, nên vẫn tạo cue hình thức dễ khai thác.
- **Yêu cầu sửa:** viết bốn phương án song song về cấu trúc và mức khái quát; giữ learning objective, answer index và quota hiện hành.
- **Kết quả re-review cuối:** C03-Q069 có độ dài `81/82/76/75`, đáp án A; C05-Q013 có `92/89/97/96`, đáp án D. Hai bộ lựa chọn đều song song về cấu trúc và mức khái quát; đáp án đúng không còn là outlier ngắn, learning objective và answer index được giữ nguyên.
- **Trạng thái:** `resolved`.

## Tổng hợp và quyết định vòng re-review

| Mức | Tổng | Open | Resolved |
|---|---:|---:|---:|
| Critical | 0 | 0 | 0 |
| High | 1 | 0 | 1 |
| Medium | 3 | 0 | 3 |
| Low | 4 | 0 | 4 |
| **Tổng** | **8** | **0** | **8** |

Kết luận: **APPROVED / REVIEWER C SIGNED OFF** cho đúng Chương 3 hash `961F03D52EDC347A67A115F3872F1AEBB2BCE17E0B479C503DD454D9A0A93A1C` và Chương 5 hash `A454C46AB6BCD87315D08A6AC4D2ADF1232AE8B4E8638E285BEA2F25F3762C23`. Cả tám finding group đã `resolved`; open Critical/High/Medium/Low đều bằng `0`. Nguồn đối chiếu giữ nguyên SHA-256 `2DF4AE100168AFAE7BD7830705DB466FB1C1A36474576F3CF8E0F2741C1CEEC4`. Các lệnh compose/validate cho HCM202 và toàn catalog đều exit `0`, `0 errors`, `0 warnings`; content contract HCM202 đạt, quota và schema giữ nguyên, extended-cue `0` vi phạm, stem exact/fuzzy ≥0.82 trên 480 câu bằng `0`.
