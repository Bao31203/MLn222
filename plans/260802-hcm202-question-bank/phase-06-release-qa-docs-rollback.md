---
title: "Phase 06 - Kiểm thử, build, QA, tài liệu và rollback"
description: "Tạo artifact deterministic, kiểm thử trình duyệt và ghi lại bàn giao HCM202 mà không commit/push/deploy."
status: completed
priority: P1
effort: 4h
issue: null
branch: main
tags: [test, release, qa, docs]
created: 2026-08-02
---

# Phase 06: Kiểm thử, build, QA, tài liệu và rollback

## Mục tiêu

Chạy full gate trên source đã sign-off, tạo lại release allowlist bằng builder hiện có, xác nhận byte-deterministic và kiểm tra trải nghiệm HCM202 trên desktop/mobile. Không commit, push hoặc deploy.

## Full automated gate

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

- [x] Không error/warning nội dung mở; mọi test pass 100%.
- [x] `questions.json` legacy MLN112 không đổi byte/hash.
- [x] `dist` đúng allowlist hiện hành, không lộ Markdown nguồn, local path, evidence thô, plan hoặc authored JSON.
- [x] `release-manifest.json` ghi HCM202=480 và tổng câu đúng.
- [x] CSP trong manifest khớp `vercel.json` và inline script/style hiện tại.

## Determinism và budget

- [x] Ghi SHA-256/raw/gzip của build thứ nhất.
- [x] Chạy `python build_html.py` lần hai khi source không đổi; artifact và manifest phải byte-identical.
- [x] `index.html` không vượt 3 MiB raw hoặc 700 KiB gzip.
- [x] Không áp dụng gate vượt budget: artifact nằm dưới cả hai ngưỡng; không thay đổi quota hoặc ngưỡng.
- [x] Không còn staging/rollback directory hay process builder/server sót lại.

## HTTP và browser QA

Serve đúng artifact:

```powershell
python -m http.server 8000 --directory dist
```

Kiểm ở 1440×900 và 390×844:

- [x] Home có đúng 5 card; HCM202 hiển thị “Sẵn sàng”, 480 câu, 6 chương.
- [x] Overview, Quiz, Flashcard và Search hoạt động với deep-link/back/forward.
- [x] Lọc từng chương trả đúng pool; hoàn thành/đánh dấu/thống kê còn sau reload.
- [x] Reset HCM202 không chạm MLN111/MLN112; game MLN112 vẫn dùng đúng bank cũ.
- [x] Không có Lecture/Game HCM202, overflow ngang, lỗi console hoặc request lỗi.
- [x] `/`, `/release-manifest.json` trả 200; source/plan/docs/Python/authored question path trả 404.
- [x] Dừng HTTP server sau kiểm thử.

## Tài liệu và bằng chứng

- [x] Cập nhật `README.md`: HCM202 ready, modes, count và lệnh authoring/validation.
- [x] Cập nhật `docs/multi-course-study-hub.md`: registry/status/storage/source/sign-off contract.
- [x] Tạo journal HCM202 và ảnh desktop/mobile cuối; không sửa hồi tố completion record cũ ngoài chỗ trạng thái sản phẩm hiện tại cần cập nhật.
- [x] Ghi test counts, artifact hashes/sizes và browser observations bằng số thật.

## Bằng chứng đã xác nhận

- Python: 70/70 pass; Node: 165/165 pass.
- Hai build liên tiếp byte-identical; `dist/index.html` SHA-256:
  `b2faf6a295176cd136b7619d82630d0af1636378fc99728215b499eb70d3442d`.
- Kích thước: 2.827.553 byte raw và 704.131 byte gzip, dưới budget
  3 MiB/700 KiB.
- Browser QA pass ở desktop 1440×900 và mobile 390×844.
- README, tài liệu Study Hub, journal và năm ảnh HCM202 đã hoàn tất; kiểm tra
  liên kết và `git diff --check` đạt.

## Ngoài phạm vi phát hành

Commit, push và deploy không thuộc scope kế hoạch này và chưa được thực hiện.

## Rollback

- Chỉ dùng bản sao tác vụ đã resolve của các file sở hữu; không `git reset`, `checkout`, `restore` hay `clean` trên worktree bẩn.
- Nếu build/promotion fail, transaction builder phải giữ artifact trước; xác minh hash trước/sau.
- Nếu cần hủy HCM202, phục hồi chính xác registry HCM201 placeholder, template/tests/docs/artifact từ baseline tác vụ; không động vào MLN111/MLN112.

## Final workflow gates

- Tester độc lập chạy full suite và browser smoke; debugger chỉ được gọi khi có failure thật.
- Code reviewer kiểm security, correctness, KISS/DRY và nội dung public projection.
- Project manager đồng bộ checkbox/status toàn bộ sáu phase; docs manager rà tài liệu; git manager chỉ audit/read-only và hỏi người dùng trước khi commit.

## Gate hoàn thành

480 câu HCM202 dùng được trên exact release artifact, mọi automated/browser/budget/determinism gate đạt, docs và rollback đầy đủ; không có commit, push hoặc deployment.
