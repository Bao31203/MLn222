---
date: 2026-08-02
session: multi-course-study-hub
---

# Journal: 2026-08-02 — Chuyển MLN112 Quiz thành Study Hub đa môn

## Bối cảnh

Website ban đầu là ứng dụng một môn với 504 câu Kinh tế chính trị, sáu video và game Công thành. Mục tiêu phiên này là tạo nền tảng ôn tập năm môn, giữ nguyên toàn bộ dữ liệu/save MLN112, đồng thời biên soạn và đưa MLN111 vào trạng thái học được. Nội dung MLN131, HCM201 và VNR201 được chủ động để lại cho các phiên sau.

## Những việc đã thực hiện

- Khóa registry theo thứ tự `mln111`, `mln112`, `mln131`, `hcm201`, `vnr201` và tách profile từng môn.
- Biên soạn/kiểm định MLN111 thành 380 câu theo ba chương `70/150/160`, có source evidence và review sign-off gắn với hash ngân hàng.
- Giữ MLN112 đúng 504 câu, sáu chapter, sáu video YouTube, game assets, question ID/order và storage namespace cũ.
- Tổng quát hóa composer/validator theo profile: quota, course identity, chapter mapping, source policy, answer pattern, Unicode/path/size limits và readiness.
- Tạo ba public catalog cho subject, question bank và lecture. Public projection bỏ raw evidence, local filename/path và validation policy.
- Đổi UI sang course home + subject overview + dynamic workspace, route hash canonical và feature gate theo môn.
- Tách study state MLN111/MLN112, thêm memory fallback khi localStorage lỗi và giữ game bank cố định vào MLN112.
- Mở rộng regression coverage cho content contract, registry mutation, validator, catalog/render, route và game subject isolation.
- Cập nhật README và tài liệu kiến trúc cho authoring, build, release, security, budget và rollback.

## Bằng chứng hiện có

- `compose_questions.py --all --check`: MLN111 380 câu và MLN112 504 câu đều `studyReady`, không lỗi/cảnh báo; ba placeholder chỉ kiểm tra metadata và không mở bank.
- `validate_questions.py --all --check`: hai bank ready đạt đúng difficulty/answer targets; ba placeholder không lỗi.
- Python pass 66/66; Node pass 158/158. Compose, validate và game-data validation đều pass.
- Economy 100.000 runs và combat 10.000 runs pass.
- Campaign held-out 1.000×60 thoát mã 0 với `invalidActions=0`, `invariantFailures=0`, `warningViolations=0`; standard `winRate=0.8383233533`, `medianVictoryTurn=52`, `p95TurnMs=28.9419`, `maximumTurnMs=66.2464`.
- Hai clean build deterministic cho cùng output 5 môn/884 câu. `dist/index.html` có SHA-256 `2fc036eed71b324408d7e7c9f0170922424941f3cb3a14147ec99ece1f57732d`, 2.179.994 byte raw, 594.438 byte gzip và input snapshot `ad56bd269eeb60361813925b6f7f33f4b772836d6b8c0b45984676f69b99e9f1`.
- `dist/` là allowlist chỉ gồm `index.html` và `release-manifest.json`; `vercel.json` khóa `outputDirectory: "dist"`, CSP hash và security headers.
- Local HTTP root/manifest trả 200; forbidden source matrix trả 404.
- Template hiện tạo `globalThis.MLN222_QUESTIONS` bằng property không writable/không configurable, cố định vào bank `mln112`.

Vercel preview/production và kiểm tra header trên origin live chưa được thực hiện. Chưa push/deploy vì người dùng chưa cấp quyền; local release evidence không được diễn giải thành production evidence. YouTube network playback, screen reader và zoom 200% vẫn là kiểm tra thủ công còn lại.

## Suy ngẫm

Điểm quan trọng nhất là tách “dữ liệu biên soạn” khỏi “dữ liệu được phép đưa lên trình duyệt”. Việc chỉ thêm MLN111 vào object global cũ sẽ nhanh hơn lúc đầu nhưng để lộ source evidence, làm storage lẫn môn và khiến game có thể lấy nhầm bank. Registry/profile + compiler projection tạo thêm quy trình, đổi lại mỗi môn có hợp đồng rõ, placeholder thực sự vô tác dụng và nội dung sai không thể tự xuất hiện ở runtime.

Giữ nguyên MLN112 gây ra một số tên legacy trong code (`MLN222_QUESTIONS`, `mln222.*`). Đây là chủ ý tương thích, không phải nhãn public. Việc đổi toàn bộ namespace trong cùng release sẽ tạo rủi ro mất tiến độ/game save lớn hơn lợi ích thẩm mỹ.

## Quyết định

| Quyết định | Lý do | Tác động |
|---|---|---|
| Dùng ID chuẩn `mln112`, code public `MLN112` | Đây là lựa chọn đã được người dùng khóa | `mln122`/`mln222` chỉ tồn tại ở alias/compatibility namespace |
| MLN111 `ready` với 380 câu và sign-off hash | Nội dung đã đủ target và qua review | Có quiz, flashcard, search; chưa có lecture/game |
| Ba môn còn lại là `comingSoon` dataless | Chưa có phiên biên soạn nội dung | Không bank, storage, iframe hay game side effect |
| Route hash `#/<subject>/<mode>` | Hoạt động trên static host và hỗ trợ deep link | Query/filter sharing được hoãn |
| Storage adapter rõ theo môn | Không để ID/save giao nhau | Giữ byte/schema của key MLN112, tạo namespace mới cho MLN111 |
| Alias game bất biến trỏ MLN112 | Bảo toàn engine/campaign cũ | Đổi active subject không đổi bank game |
| Chỉ publish public projection allowlist | Source evidence là dữ liệu authoring | Browser chỉ nhận citation `{label, section}` |
| Build một HTML nhúng, gate 3 MiB/700 KiB | Giữ mô hình static/offline hiện có | Vượt budget phải mở plan mới, không tự lazy-load |
| Vercel chỉ deploy `dist/` allowlist | Không phát tán content/raw source/repo internals | Framework `Other`, output directory `dist` |
| Rollback bằng deployment/commit scoped | Bảo toàn worktree và browser save | Không `git reset --hard`, không clear localStorage |
| Một lệnh build tạo toàn bộ release local | Tránh root index/dist/CSP lệch snapshot | `python build_html.py` đồng bộ root index, exact dist và root vercel bằng transaction |

## Review finding đã xử lý

Review phát hiện builder từng đọc `template.html` trước input snapshot và quy trình release từng copy `dist`/manifest/config ngoài builder. Flow cuối là snapshot (gồm compiler) → đọc lại template → render → snapshot → same-volume staging → transactional promotion. Root `index.html`, exact `dist/{index.html,release-manifest.json}` và root `vercel.json` nay luôn xuất phát từ cùng validated snapshot; fault-injection test xác nhận rollback phục hồi release cũ.

## Rủi ro tồn đọng

- Vercel preview/production chưa được tạo; header, deep-link và source-404 matrix mới có bằng chứng local HTTP.
- YouTube playback qua mạng thật, screen reader và zoom 200% chưa được kiểm tra thủ công trong final release evidence.
- Playlist/sáu video hiện được regression test khóa identity; metadata chưa chứa signed expected identity độc lập với test runner.

## Các bước tiếp theo

1. Kiểm tra thủ công YouTube network playback, screen reader và zoom 200%, ghi bằng chứng thực tế.
2. Xin người dùng duyệt riêng trước khi push hoặc tạo Vercel preview; lưu deployment ID tốt gần nhất trước production promotion.
3. Trên preview/production, kiểm tra live headers, deep link, sáu video và forbidden source matrix; rollback nếu khác local artifact/hash.
4. Cân nhắc đưa playlist/sáu video vào signed profile nếu release gate cần fail-closed không phụ thuộc test suite.
5. Ở các phiên nội dung sau, biên soạn lần lượt MLN131, HCM201 và VNR201 theo cùng profile/source/sign-off contract thay vì chỉ bật status.
