---
date: 2026-08-02
session: hcm202-question-bank
status: complete
---

# Journal: 2026-08-02 — Ngân hàng câu hỏi HCM202

## Context

Study Hub cần thay placeholder HCM201 bằng học phần HCM202 sẵn sàng học, với ngân hàng đủ sáu chương, truy xuất được nguồn và chỉ được đưa vào runtime sau phản biện độc lập cùng sign-off theo hash.

## What happened

- Biên soạn đủ **480 câu**, phân bố sáu chương **45/75/100/95/75/90**, độ khó **192 Nhận biết / 192 Thông hiểu / 96 Vận dụng** và vị trí đáp án **A/B/C/D = 120/120/120/120**.
- Khóa nguồn duy nhất là `Giáo trình tư tưởng Hồ Chí Minh.md`, snapshot SHA-256 `2df4ae100168afae7bd7830705db466fb1c1a36474576f3cf8e0f2741c1ceec4`; nội dung public chỉ giữ nhãn và mục nguồn, không phát hành đường dẫn máy hay evidence thô.
- Ba vòng review độc lập phát hiện tổng cộng **5 High, 12 Medium và 13 Low**, chủ yếu là cue theo độ dài, distractor tuyệt đối hóa, learning objective gần trùng, nhãn difficulty/kind, citation chưa đủ sát và thiếu đóng khung nội dung năm 2021. Tất cả finding đã được sửa và tái duyệt; không còn open Critical/High/Medium.
- Review delta cuối bổ sung dấu vết “giáo trình xuất bản năm 2021” cho bốn stem thuộc Chương 4 và 6 mà không đổi đáp án, explanation hay quota. Bank canonical sau delta được ký tại SHA-256 `c0c9a0ec983de0e48da565f8cb08625261836487b3b3d2a72c3b5d0502350255`.
- Profile và registry hiện đánh dấu HCM202 `ready`; Quiz, Flashcard và Search bật, còn Lecture và Game tắt theo scope.

## Reflection

Schema và quota chỉ chứng minh cấu trúc, không tự phát hiện được câu hỏi dễ đoán hoặc diễn giải vượt nguồn. Review adversarial theo từng cặp chương đã bắt đúng các lỗi chất lượng này, còn sign-off theo canonical hash tạo ranh giới rõ: bất kỳ thay đổi byte nào sau duyệt đều phải review lại. Chuỗi hash cũ của Chương 4/6 trong báo cáo A/B không phải artifact cuối; review D ghi rõ delta và ký lại đúng hash hiện hành.

## Decisions

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Khóa quota chương, độ khó và vị trí đáp án | Bảo đảm độ phủ cùng phân bố kiểm soát được | Validator có thể fail closed khi bank lệch hợp đồng |
| Chỉ dùng snapshot giáo trình đã băm | Tránh trộn kiến thức ngoài phạm vi hoặc OCR chưa xác minh | Mọi câu có provenance ổn định và có thể tái kiểm |
| Review độc lập 100% và tái duyệt theo finding | Kiểm tra tính duy nhất của đáp án, distractor và citation ngoài schema | Đóng toàn bộ 30 finding High/Medium/Low trước khi ready |
| Ký canonical bank và từng chapter bằng SHA-256 | Ngăn nội dung thay đổi âm thầm sau phê duyệt | Sửa bank buộc tạo sign-off mới |
| Ghi rõ ngữ cảnh ấn bản 2021 cho phần “hiện nay” | Không biến nội dung giáo trình thành tuyên bố cập nhật đến 2026 | Câu hỏi public giữ đúng phạm vi thời gian của nguồn |

## Verification

- Compose/validate HCM202: **480 câu, 0 errors, 0 warnings**; phân bố khớp sign-off.
- Test pipeline Python: **70/70 pass**.
- Test Node: **165/165 pass**.
- Hash sáu chapter hiện tại khớp `review-signoff.json`; source hash và canonical bank hash cũng khớp.
- Hai production build liên tiếp byte-identical: `dist/index.html` SHA-256 `b2faf6a295176cd136b7619d82630d0af1636378fc99728215b499eb70d3442d`, raw **2.827.553 byte**, gzip **704.131 byte**; input snapshot `ee30d33c369227206966fd6e63adc8b0c25f5cbdb00033f20b20cef90a2c7254`.
- Catalog production có **5 môn / 1.364 câu**: MLN111 380, MLN112 504, HCM202 480; Home hiển thị đúng 5 card với 3 môn sẵn sàng, overview HCM202 hiển thị 480 câu/6 chương.
- Browser QA pass tại desktop **1440×900** và mobile **390×844**: Quiz/Flashcard dùng được bằng bàn phím, Search không phân biệt dấu, Back/Forward, deep link và feature gate chặn Lecture/Game HCM202 đều đúng; **0 page/console error** và **0 horizontal overflow**.
- Local HTTP trả **200** cho root và **404** cho đường dẫn không tồn tại. Request 404 duy nhất do browser tự phát là favicon tùy chọn.
- Ảnh kiểm chứng: [HCM202 trên Home](../screenshots/08-hcm202-course-home.png), [overview](../screenshots/09-hcm202-overview.png), [Flashcard](../screenshots/10-hcm202-flashcard.png), [Search](../screenshots/11-hcm202-search.png) và [Quiz mobile](../screenshots/12-hcm202-mobile-quiz.png).
- Chưa commit, push hoặc deploy.
- Kế hoạch HCM202 đã được đồng bộ sau QA: `plan.md` và cả sáu phase đều `completed`, không còn checklist mở; commit, push và deploy vẫn nằm ngoài phạm vi phiên này.

## Handoff

- Feature HCM202 đã hoàn tất ở mức local release candidate: nội dung được sign-off, catalog/runtime sẵn sàng, test/build/browser gate đều xanh và tài liệu người dùng đã phản ánh số liệu hiện hành.
- Không còn bước triển khai kỹ thuật pending trong phạm vi phiên này. Việc đồng bộ trạng thái plan, commit, push, tạo Vercel preview hoặc deploy production là thay đổi riêng và cần đúng thẩm quyền/phê duyệt.
- Worktree vẫn chưa commit; người tiếp nhận cần bảo toàn các thay đổi hiện có và đối chiếu hash release ở trên trước mọi thao tác phát hành.
