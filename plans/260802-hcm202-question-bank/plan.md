---
title: "Ngân hàng câu hỏi HCM202"
description: "Biên soạn, kiểm duyệt và tích hợp 480 câu Tư tưởng Hồ Chí Minh vào Study Hub năm môn."
status: completed
priority: P1
effort: 62h
issue: null
branch: main
tags: [content, hcm202, frontend, validation, release]
created: 2026-08-02
---

# Ngân hàng câu hỏi HCM202

## Tiến độ nghiệm thu

- 6/6 phase hoàn tất; tài liệu, journal và ảnh nghiệm thu đã được kiểm tra.
- Bank HCM202 có 480 câu, đã review độc lập, fact-check và sign-off ở trạng
  thái `ready`.
- Catalog/runtime/storage đã tích hợp; Python 70/70 và Node 165/165 pass.
- Hai build liên tiếp byte-identical với SHA-256
  `b2faf6a295176cd136b7619d82630d0af1636378fc99728215b499eb70d3442d`.
- Browser QA desktop 1440×900 và mobile 390×844 đã pass trên exact artifact.
- Commit, push và deploy nằm ngoài phạm vi kế hoạch, chưa được thực hiện.

## Kết quả cần đạt

Đưa `HCM202` vào vị trí placeholder `HCM201` trong Study Hub, vẫn giữ đúng năm môn. HCM202 có 480 câu bám sát toàn bộ sáu chương của giáo trình, dùng được ở Quiz, Flashcard và Tìm kiếm; Bài giảng và Game tiếp tục tắt. MLN111, MLN112, MLN131 và VNR201 không đổi hành vi.

## Quyết định đã khóa

- Nguồn chính duy nhất: `F:\Kỳ 9\Tư tưởng Hồ Chí Minh - HCM202\Giáo trình tư tưởng Hồ Chí Minh.md`.
- Snapshot nguồn đã khảo sát: 9.272 dòng, khoảng 69.330 từ, SHA-256 `2df4ae100168afae7bd7830705db466fb1c1a36474576f3cf8e0f2741c1ceec4`.
- ID/code canonical: `hcm202` / `HCM202`; không khai báo alias `hcm201` và không di chuyển dữ liệu storage giữa hai mã.
- Registry vẫn có đúng năm mục theo thứ tự: `mln111`, `mln112`, `mln131`, `hcm202`, `vnr201`.
- Ngân hàng có đúng 480 câu, phân bố chương `45/75/100/95/75/90`.
- Từng chương và toàn bank giữ tỷ lệ độ khó 40% Nhận biết, 40% Thông hiểu, 20% Vận dụng.
- Vị trí đáp án được khóa theo ma trận dưới đây và toàn bank cân bằng tuyệt đối `A/B/C/D = 120/120/120/120`.
- Schema câu hỏi, phép canonicalize và cơ chế sign-off kế thừa MLN111; mọi sửa nội dung làm mất hiệu lực sign-off.
- Nội dung tác giả không được publish nguyên văn: browser chỉ nhận projection an toàn với nhãn và mục nguồn.
- Không commit, push, tạo PR hoặc deploy trong kế hoạch này.

## Ma trận số lượng bắt buộc

| Chương | Tổng | Nhận biết | Thông hiểu | Vận dụng | A/B/C/D |
|---|---:|---:|---:|---:|---:|
| 1 | 45 | 18 | 18 | 9 | 12/11/11/11 |
| 2 | 75 | 30 | 30 | 15 | 18/19/19/19 |
| 3 | 100 | 40 | 40 | 20 | 25/25/25/25 |
| 4 | 95 | 38 | 38 | 19 | 24/24/24/23 |
| 5 | 75 | 30 | 30 | 15 | 19/19/18/19 |
| 6 | 90 | 36 | 36 | 18 | 22/22/23/23 |
| **Tổng** | **480** | **192** | **192** | **96** | **120/120/120/120** |

## Phases và phụ thuộc

| # | Phase | Status | Effort | Depends on |
|---|---|---|---:|---|
| 1 | [Khóa nguồn, blueprint và hợp đồng biên soạn](./phase-01-source-blueprint-authoring-contract.md) | Completed | 8h | — |
| 2 | [Biên soạn Chương 1–3](./phase-02-author-chapters-01-03.md) | Completed | 18h | 1 |
| 3 | [Biên soạn Chương 4–6](./phase-03-author-chapters-04-06.md) | Completed | 18h | 1 |
| 4 | [Phản biện chéo, fact-check và sign-off](./phase-04-cross-review-fact-check-signoff.md) | Completed | 8h | 2, 3 |
| 5 | [Tích hợp catalog, storage và runtime HCM202](./phase-05-catalog-runtime-integration.md) | Completed | 6h | 4 |
| 6 | [Kiểm thử, build, QA, tài liệu và rollback](./phase-06-release-qa-docs-rollback.md) | Completed | 4h | 5 |

## Chiến lược thực thi

| Wave | Công việc | Gate ra |
|---|---|---|
| A | Phase 1 | Blueprint, schema và errata policy được khóa |
| B | Phase 2 và 3 chạy song song; mỗi file chương có một owner | Sáu file parse được, đủ quota cục bộ |
| C | Phase 4 | 480 câu qua review độc lập, không còn Critical/High/Medium, hash sign-off khớp |
| D | Phase 5 | Registry/runtime có HCM202, storage tách biệt, các mode đúng feature flag |
| E | Phase 6 | Test xanh, artifact deterministic, desktop/mobile QA đạt |

## Ownership không chồng lấn

| Owner | Đường dẫn độc quyền trong lúc viết |
|---|---|
| Contract owner | `content/subjects/hcm202/AUTHORING.md`, `ERRATA.md` |
| Author C1 | `content/subjects/hcm202/chapters/chapter-01.json` |
| Author C2 | `content/subjects/hcm202/chapters/chapter-02.json` |
| Author C3 | `content/subjects/hcm202/chapters/chapter-03.json` |
| Author C4 | `content/subjects/hcm202/chapters/chapter-04.json` |
| Author C5 | `content/subjects/hcm202/chapters/chapter-05.json` |
| Author C6 | `content/subjects/hcm202/chapters/chapter-06.json` |
| Review/sign-off owner | Findings/report và `content/subjects/hcm202/review-signoff.json`; tác giả chỉ sửa file mình sở hữu |
| Catalog owner | Registry, profile, compiler/validator/build scripts |
| Runtime owner | `template.html` và study-hub Node tests |
| Release owner | Generated artifacts, docs, screenshots; không sửa authored chapters |

Reviewer không được duyệt chương mình đã viết. Vòng độc lập: reviewer A kiểm C1+C4, B kiểm C2+C6, C kiểm C3+C5; findings chuyển lại đúng author để sửa, sau đó reviewer xác nhận lại.

## Inventory file dự kiến

- Create: `content/subjects/hcm202/{AUTHORING.md,ERRATA.md,subject.json,review-signoff.json}`.
- Create: `content/subjects/hcm202/chapters/chapter-01.json` … `chapter-06.json`.
- Replace/remove: `content/subjects/hcm201/subject.json` sau khi đã lưu baseline; không giữ alias/folder public HCM201.
- Modify: `content/subjects/registry.json`, `template.html`; chỉ sửa pipeline Python nếu test chứng minh contract generic hiện tại chưa đủ.
- Modify/add tests: `test_pipeline.py`, `tests/study-hub/*.test.cjs`; game sources không thuộc scope.
- Regenerate only in Phase 6: `parse_report.txt`, `index.html`, `dist/**`, `vercel.json`; giữ nguyên snapshot legacy `questions.json` của MLN112.
- Update: `README.md`, `docs/multi-course-study-hub.md`; create journal/report/screenshots HCM202.

## Build budget

Giữ nguyên kiến trúc nhúng catalog đã được kiểm thử. Dữ liệu tác giả vẫn được compiler rút còn public projection an toàn trước khi nhúng.

- `dist/index.html`: tối đa 3 MiB raw và 700 KiB gzip theo gate hiện tại.
- Đo kích thước ngay sau khi có bank hợp lệ, trước khi chỉnh ngân sách hoặc kiến trúc.
- Nếu vượt gate: dừng release và báo số đo; không cắt câu, không nâng ngưỡng âm thầm và không tự mở thêm runtime tải asset trong scope này.

## Baseline và bảo toàn worktree bẩn

- HEAD hiện tại `8206530adcb2409587ec8ee53ff784ffc684fa11`; nhiều thay đổi Study Hub chưa commit là dữ liệu của người dùng.
- Trước implementation, ghi `git status --porcelain=v1`, hash và bản sao byte-for-byte của mọi file sắp sửa vào thư mục tạm tác vụ đã resolve; không dùng `git restore`, `checkout` hay `reset`.
- Mỗi phase chỉ nhận patch theo ownership; không stage/commit và không chạy builder khi author khác đang ghi file.
- Generated build dùng staging/promotion transaction hiện có; lỗi phải phục hồi artifact trước.

## Lệnh kiểm định bắt buộc

```powershell
python compose_questions.py --subject hcm202 --check
python validate_questions.py --subject hcm202 --check
python compose_questions.py --all --check
python validate_questions.py --all --check
node scripts/validate-game-data.js
python -m unittest -v test_pipeline.py
node --test --test-concurrency=1 tests/game/*.test.cjs tests/study-hub/*.test.cjs
python validate_questions.py --all --report parse_report.txt
python build_html.py
git diff --check
```

Sau build, chạy lại `python build_html.py`, so SHA-256 hai lần; serve đúng `dist` bằng `python -m http.server 8000 --directory dist`, rồi kiểm tra route/404/CSP trên HTTP.

## Rủi ro chính

| Rủi ro | Biện pháp |
|---|---|
| OCR sai ngày, tên, thuật ngữ | Errata ledger + bằng chứng nội bộ/nguồn thẩm quyền; không hỏi từ đoạn chưa xác minh |
| Câu đủ số nhưng bỏ sót tiểu mục | Blueprint có quota lá; validator/report kiểm coverage tag/topic |
| Hai đáp án cùng hợp lý | Review adversarial từng distractor; loại hoặc viết lại |
| Pattern A/B/C/D dễ đoán | Kiểm max-run và chu kỳ 2–4; shuffle vị trí có kiểm soát |
| HCM201 còn lộ ở UI/docs/artifact | Scan case-insensitive toàn source và dist; chỉ cho phép trong tài liệu lịch sử/rollback được chỉ rõ |
| HCM202 làm vượt bundle | Đo public projection thật; hard-stop và xin duyệt plan tách asset nếu vượt gate |
| Storage đụng MLN111/MLN112 | Namespace `mln-study-hub.v1.hcm202.*`; reset chỉ xóa ba key HCM202 |
| Worktree bẩn bị ghi đè | Baseline manifest, ownership path-scoped, rollback bằng bản sao tác vụ |

## Tiêu chí hoàn thành

- Đúng 480 ID duy nhất `HCM202-Cxx-Qxxx`, đúng sáu quota chương, độ khó và đáp án đã khóa.
- Mọi câu có bốn lựa chọn, một đáp án duy nhất, explanation tự đủ và citation định vị đúng mục nguồn.
- Toàn bộ mục trong blueprint có ít nhất quota đặt ra; không dùng dữ kiện OCR chưa qua fact-check.
- Sign-off khớp canonical bank/chapter hashes và có 0 open Critical/High/Medium.
- Website có đúng năm môn, HCM202 thay HCM201; Quiz/Flashcard/Search hoạt động, Lecture/Game không xuất hiện.
- HCM202 có ba storage key riêng; placeholder khác và toàn bộ MLN112 legacy key không đổi.
- Tất cả lệnh kiểm định xanh, build hai lần byte-identical, đạt budget và không rò local path/raw source.
- Browser QA đạt ở 1440×900 và 390×844, không overflow, không console error, back/forward và deep-link hoạt động.
- Không commit, push hay deploy.
