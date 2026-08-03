# Independent review — VNR202 Chương 1

## Phạm vi, artifact và kết luận

- Reviewer: reviewer độc lập, không phải tác giả `chapter-01.json`.
- Ngày review: 2026-08-03.
- Phạm vi câu hỏi: `VNR202-C01-Q001`–`VNR202-C01-Q063`, đã review ngữ nghĩa `63/63` (`100%`).
- Reviewer đã đọc đủ `63` stem, `252` options, `63` answer, difficulty/kind, explanation và citation; cả `189/189` distractor đều được thử bảo vệ riêng trước source và learning objective.
- Source đã đọc trực tiếp: logical lines `1–586` của `gt-lich-su-dang-csvn-ban-tuyen-giao-tw.md`, gồm vùng nội dung `105–451` và toàn bộ context/seam đầu, cuối phạm vi.
- SHA-256 source snapshot: `a686d4395752bf70302dff62cbf1502187f19ebcd1e9406a9a402e97b76799bc` (`831134` byte, `9916` logical lines).
- SHA-256 artifact được re-review và khóa: `e533c48d7b62de678bc02e8aaa96713c34553b1e18cb5c992253eea9e4a82461` (`98355` byte).
- Artifact review ban đầu để truy vết: `d35aeee1f150be2c8314de1b71ba297602115ddd0b00ec981e98e705747fe58f` (`96191` byte).
- SHA-256 blueprint fragment được đối chiếu: `48d31892e3ca9a5fe58f04130f844d07497b00ac38c388ecd395e8980a3fb755`.
- Phạm vi re-review: đọc lại `28/28` câu đã sửa (`Q004`, `Q011`, `Q013`, `Q018`, `Q021`, `Q022`, `Q024`, `Q025`, `Q027`–`Q029`, `Q032`, `Q034`, `Q036`, `Q037`, `Q042`, `Q044`, `Q046`, `Q049`, `Q050`, `Q052`, `Q053`, `Q055`–`Q058`, `Q060`, `Q062`), toàn bộ cửa sổ bị tác động và chạy lại gate trên `63/63` câu.
- Kết luận review độc lập cấp chương: `APPROVED`; `0` finding Critical/High/Medium còn mở trên đúng artifact hash đã khóa. Đây chưa phải sign-off toàn bank.

Tài liệu điều khiển đã đọc: `AUTHORING.md`, `ERRATA.md`, `subject.json`, `bank-config.json`, merged `blueprint.json`, fragment `blueprint-intro-conclusion.json`, cùng các hợp đồng `authoring-contract`, `output-contract` và `review-signoff` của skill.

## Tổng findings

| Severity | Tổng | Open | Resolved |
|---|---:|---:|---:|
| Critical | 0 | 0 | 0 |
| High | 1 | 0 | 1 |
| Medium | 1 | 0 | 1 |
| Low | 0 | 0 | 0 |
| **Tổng** | **2** | **0** | **2** |

## Critical

Không phát hiện finding Critical: đáp án được source bảo vệ, không có câu nhiều đáp án đúng, claim nguy hiểm hoặc lỗi làm mất độ tin cậy toàn bộ chương.

## High

### H-01 — 26/63 câu — correct answer là phương án cân bằng duy nhất, distractor tự loại bằng phủ định/cắt bỏ

- Severity: High
- Lý do: Exact absolute-cue gate của contract vẫn pass, nhưng red-team ngữ nghĩa cho thấy một pattern rộng hơn. Có `26/63` câu mà đáp án đúng không mang tín hiệu phủ định/cắt bỏ, trong khi ít nhất hai distractor dùng trực tiếp các cấu trúc `không`, `chỉ`, `bỏ`, `tách`, `thay`, `giới hạn`, `dừng` hoặc `lược`. Sau khi thử bảo vệ từng distractor, nhiều phương án sai không còn là near-miss cùng mức khái quát mà tự tuyên bố bỏ một yêu cầu hiển nhiên; đáp án đúng trở thành lựa chọn duy nhất có giọng cân bằng, đầy đủ và học thuật. Đây là pattern đoán đáp án có hệ thống dù không vi phạm lexicon tuyệt đối hẹp.
- IDs: `Q004`, `Q011`, `Q021`, `Q022`, `Q024`, `Q025`, `Q027`–`Q029`, `Q032`, `Q034`, `Q036`, `Q037`, `Q042`, `Q044`, `Q046`, `Q049`, `Q050`, `Q052`, `Q053`, `Q055`–`Q058`, `Q060`, `Q062`.
- Bằng chứng artifact: Q024 đặt ba distractor lần lượt ở dạng “chỉ... không”, “thay... riêng” và “tách...”; Q036 dùng “lược bỏ”, “không cần” và “dừng... không”; Q053 dùng “bỏ”, “không xét” và “chỉ... không”; Q055 dùng “không khái quát”, “bỏ qua” và “tách”; Q062 dùng “thay”, “tách” và “chỉ... không”. Ở các câu nhận biết khác như Q007, Q010, Q023, Q026, Q039, Q045 và Q051, distractor còn xa phạm trù hoặc thiên về metadata/kỹ thuật không liên quan, làm giảm thêm khả năng bảo vệ.
- Đối chiếu source: các đáp án đúng tương ứng đều có căn cứ trong logical lines `111–451`; finding không phải lỗi answer mà là chất lượng và tính song song của option set.
- Đề xuất: Viết lại distractor thành các near-miss cùng phạm trù, cùng cấu trúc ngữ pháp và chỉ sai một quan hệ, chủ thể, phạm vi, điều kiện hoặc trình tự có thể nhầm thật. Không sửa cơ học bằng cách xóa từ phủ định hoặc thêm chữ đệm; sau sửa phải red-team lại bằng cách che answer và thử chọn chỉ theo văn phong.
- Status: `resolved`
- Re-review: trên artifact `e533…2461`, reviewer đã che answer và thử lại từng option set của toàn bộ `26` ID. Các distractor nay là near-miss cùng phạm trù/cấu trúc; heuristic phủ định/cắt bỏ rộng giảm từ `26/63` xuống `0/63`. Exact-cue gate có cue ở `3/63` đáp án và `13/189` distractor, không có câu nào vi phạm quy tắc hai distractor. Không phát hiện answer lộ bằng văn phong ở các cửa sổ lân cận.

## Medium

### M-01 — VNR202-C01-Q013, Q018 — tình huống chỉ là wrapper cho Nhận biết/Thông hiểu

- Severity: Medium
- Lý do: Q013 chỉ yêu cầu nhận ra đúng danh sách bốn truyền thống được nguồn liệt kê trực tiếp; cụm “một chuyên đề muốn hệ thống” không tạo dữ kiện mới hay buộc suy ra cách xử lý. Q018 chỉ phân loại một nhóm giải pháp vào một trong bốn mặt xây dựng Đảng; cụm “một báo cáo đề xuất” cũng không thay thao tác phân biệt trực tiếp. Hai câu không đạt contract của `Vận dụng/van_dung_tinh_huong`, theo đó tình huống phải cung cấp đủ dữ kiện để người học chọn cách áp dụng nguyên tắc.
- Bằng chứng nguồn: Q013 — logical lines `168–177`; Q018 — logical lines `179–192`.
- Đề xuất: Viết lại Q013 thành tình huống buộc suy ra truyền thống phù hợp từ hành vi/quan hệ cụ thể; viết lại Q018 thành tình huống có biểu hiện và ràng buộc để chọn biện pháp đạo đức phù hợp. Nếu chỉ hạ nhãn difficulty/kind thì phải bù lại quota `13` câu Vận dụng của chương và quota nhóm blueprint.
- Status: `resolved`
- Re-review: Q013 hiện cung cấp ba hoạt động tương ứng ba truyền thống và buộc suy ra truyền thống quốc tế trong sáng còn thiếu; Q018 cung cấp biểu hiện vụ lợi, sa sút lối sống và buộc chọn đúng biện pháp xây dựng Đảng về đạo đức. Cả hai đạt thao tác `Vận dụng/van_dung_tinh_huong`, được source tại lines `168–192` bảo vệ và không tạo đáp án đúng thứ hai.

## Low

Không ghi finding Low riêng. Các điểm câu chữ nhỏ không làm sai answer đã được phản ánh trong H-01 và sẽ được đọc lại cùng option set sau remediation.

## Checklist review 63/63

Với từng range dưới đây, reviewer đã đối chiếu trực tiếp source, kiểm stem/objective, difficulty-kind, bốn options, thử bảo vệ ba distractor, answer, explanation, citation, cue, length, errata và trùng objective.

| Nhóm blueprint | Source logical lines | Question IDs | Đã kiểm |
|---|---:|---|---:|
| `IM-02` | 105–109 | Q001 | 1/1 |
| `IM-03` | 111–129 | Q002–Q005 | 4/4 |
| `IM-04` | 131–154 | Q006–Q009 | 4/4 |
| `IM-05` | 156–177 | Q010–Q013 | 4/4 |
| `IM-06` | 179–192 | Q014–Q018 | 5/5 |
| `IM-07` | 194–223 | Q019–Q022 | 4/4 |
| `IM-08` | 225–242 | Q023–Q025 | 3/3 |
| `IM-09` | 244–253 | Q026–Q028 | 3/3 |
| `IM-10` | 255–268 | Q029–Q030 | 2/2 |
| `IM-11` | 270–280 | Q031–Q033 | 3/3 |
| `IM-12` | 282–306 | Q034–Q036 | 3/3 |
| `IM-13` | 308–316 | Q037–Q038 | 2/2 |
| `IM-14` | 327–357 | Q039–Q044 | 6/6 |
| `IM-15` | 359–387 | Q045–Q049 | 5/5 |
| `IM-16` | 389–403 | Q050–Q053 | 4/4 |
| `IM-17` | 405–411 | Q054–Q055 | 2/2 |
| `IM-18` | 413–422 | Q056–Q057 | 2/2 |
| `IM-19` | 424–431 | Q058 | 1/1 |
| `IM-20` | 433–438 | Q059–Q060 | 2/2 |
| `IM-21` | 440–451 | Q061–Q063 | 3/3 |
| **Tổng** | **105–451** | **Q001–Q063** | **63/63** |

Các nhóm `IM-00`, `IM-01`, `IM-22`–`IM-25` cũng đã được đọc trực tiếp để xác nhận trạng thái `excluded`/`context-only`; không có câu lấy từ bìa, lời dẫn, phần xem trước hay đoạn seam.

## Gate cấu trúc và red-team

| Gate | Kết quả |
|---|---|
| Source snapshot | Pass: SHA-256 `a686…99bc`, `831134` byte, `9916` logical lines |
| JSON, exact schema, IDs | Pass: 63 object, đúng exact fields; ID liên tục Q001–Q063 |
| Course/chapter | Pass: `courseId=vnr202`, `chapterNum=1`, title khớp `subject.json` |
| Options/answer | Pass: mỗi câu có 4 option khác nhau, answer trong 0–3; không phát hiện đáp án đúng thứ hai |
| Difficulty quota danh nghĩa | Pass: `25 Nhận biết / 25 Thông hiểu / 13 Vận dụng`; semantic gate fail theo M-01 |
| Answer positions | Pass: `16/16/16/15` |
| Answer pattern | Pass: max run `3`; không có chu kỳ độ dài 2–4 lặp ba lần |
| Độ dài chương | Pass: đúng dài duy nhất `16/63 = 25,40%`, ngắn duy nhất `17/63 = 26,98%`; rolling max `14/20` |
| Độ dài trung bình | Pass: answer `80,41` ký tự, distractor `77,83`; lệch `3,32%` |
| Exact absolute cue | Pass: `3/63` answer và `13/189` distractor có cue; `0` câu vi phạm quy tắc “từ hai distractor” |
| Qualitative option cue | Pass: `0/63` câu còn pattern phủ định/cắt bỏ hệ thống; H-01 đã đóng bằng red-team thủ công trên các option set bị sửa |
| Explanation | Pass: 0 explanation generic, 0 explanation dưới 24 từ, 0 answer echo đơn thuần |
| Duplicate chữ | Pass: 0 exact stem, 0 exact option-set, 0 cặp stem similarity từ `0,82`, 0 cặp Jaccard từ `0,65` |
| Duplicate objective | Pass sau đọc thủ công: các câu gần chủ đề dùng thao tác khác nhau; không phát hiện objective duplicate độc lập với M-01 |
| Citation/source | Pass: `63/63` section nằm đúng source range của nhóm và answer/explanation được corpus bảo vệ |
| ERRATA/out-of-corpus | Pass: không dùng mục cấm, metadata, câu ôn tập, dữ kiện ngoài corpus hoặc chuỗi OCR mơ hồ làm đáp án |
| Unicode/public strings | Pass: UTF-8 NFC, không BOM, có final LF; không control/bidi/HTML/URL/email/local path |
| Blueprint | Pass: `63/63` ID, không trùng/thiếu; target và difficulty quota của cả 20 nhóm covered đều khớp; fragment khớp phần Chương 1 trong merged blueprint tại thời điểm review |

`python validate_questions.py --subject vnr202 --check` chưa chạy được gate repository vì registry hiện trả `Unknown subject: vnr202`. Các gate trực tiếp ở trên đã chạy trên artifact, source snapshot và blueprint; sau remediation và đăng ký subject vẫn phải chạy validator repository/toàn bank.

## Kết luận re-review

1. H-01 và M-01 đã đóng trên đúng artifact `e533…2461`; reviewer không chỉnh sửa file câu hỏi của tác giả.
2. Toàn bộ gate chapter/group, answer pattern, cue, length, duplicate, citation, source và blueprint đều pass; `63/63` câu vẫn nằm đúng mapping.
3. `python validate_questions.py --subject vnr202 --check` vẫn trả `Unknown subject: vnr202` do registry repository chưa đăng ký subject; đây là blocker của sign-off toàn bank, không phải finding ngữ nghĩa còn mở trong Chương 1.
4. Mọi thay đổi nội dung sau hash đã khóa làm kết luận này mất hiệu lực và cần delta re-review mới.
