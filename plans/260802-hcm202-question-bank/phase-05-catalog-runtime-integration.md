---
title: "Phase 05 - Tích hợp catalog, storage và runtime HCM202"
description: "Đưa môn đã sign-off vào workspace data-driven, thêm persistence riêng và cập nhật regression tests."
status: completed
priority: P1
effort: 6h
issue: null
branch: main
tags: [frontend, runtime, storage, tests]
created: 2026-08-02
---

# Phase 05: Tích hợp catalog, storage và runtime HCM202

## Mục tiêu

Làm HCM202 xuất hiện như môn sẵn sàng thứ ba trong Study Hub năm môn. UI tiếp tục lấy card, chapter, filter và mode từ catalog; chỉ thêm phần runtime thật sự còn hardcode là namespace storage và cập nhật các contract tests.

## Conformance trước khi sửa

- Không có `docs/code-standards.md`; dùng `docs/multi-course-study-hub.md`, `content/subjects/mln111/AUTHORING.md` và code lân cận làm chuẩn.
- Đọc lại helper catalog/router/storage hiện tại; không tạo luồng song song hoặc framework mới.
- Bảo toàn tuyệt đối `globalThis.MLN222_QUESTIONS` và toàn bộ key/save MLN112.

## Runtime

- [x] Thêm đúng ba key HCM202 trong `template.html`:
  - `mln-study-hub.v1.hcm202.marked`
  - `mln-study-hub.v1.hcm202.stats`
  - `mln-study-hub.v1.hcm202.studyProgress`
- [x] Reset HCM202 chỉ xóa ba key này; storage failure vẫn dùng memory fallback cùng tab.
- [x] `#/hcm202`, `/quiz`, `/flash`, `/search` canonical và hỗ trợ back/forward/deep-link.
- [x] Lecture/Game không xuất hiện; route bị yêu cầu cưỡng bức phải trở về overview HCM202.
- [x] Home và subject switcher vẫn đúng năm môn, HCM202 thay nhãn HCM201.
- [x] Quiz/filter/search/flashcard dùng đủ 480 câu và sáu chapter; không tạo state cho placeholder.

## Tests Python

Cập nhật `test_pipeline.py` theo contract dữ liệu, không chỉ thay chuỗi:

- [x] Registry đúng thứ tự năm môn và ready set `mln111/mln112/hcm202`.
- [x] Placeholder chỉ còn `mln131/vnr201`.
- [x] HCM202 đúng profile, 480 câu, 6 chapter, distribution, source policy và sign-off hashes.
- [x] Public projection bỏ `courseId`, raw `source.text`, filename/path máy; chỉ còn label/section.
- [x] Snapshot input chứa profile/sign-off/sáu chapter.
- [x] MLN112 legacy snapshot, lecture và game alias không đổi.
- [x] Negative tests cho alias/path traversal/status/sign-off stale vẫn fail closed.

## Tests Node

- [x] Fixture routing đổi HCM201 placeholder thành HCM202 ready.
- [x] Route/mode HCM202 round-trip; lecture/game bị chặn.
- [x] Storage isolation chứng minh MLN111, MLN112 và HCM202 không đọc/ghi chéo.
- [x] Search/flashcard/chapter filter dùng bank của subject hiện tại.
- [x] Coming-soon vẫn tạo zero pool và zero storage writes.

## Bằng chứng hoàn thành

- Runtime và ba namespace storage HCM202 đã tích hợp.
- Python pass 70/70; Node pass 165/165.
- Regression coverage xác nhận MLN111/MLN112 và placeholder không bị thay đổi
  ngoài contract đã định.

## Lệnh gate

```powershell
python compose_questions.py --all --check
python validate_questions.py --all --check
python -m unittest -v test_pipeline.py
node --test --test-concurrency=1 tests/game/*.test.cjs tests/study-hub/*.test.cjs
node scripts/validate-game-data.js
git diff --check
```

Mọi suite phải đạt 100%. Nếu test fail, xác định root cause; không nới assertion, bỏ test hoặc thay đổi behavior MLN112 để “làm xanh”.

## File sở hữu

- `template.html`
- `test_pipeline.py`
- `tests/study-hub/catalog-routing.test.cjs`
- `tests/study-hub/storage-workspace.test.cjs`
- Test liên quan khác chỉ khi có bằng chứng cần thiết.

Không sửa `index.html`, `dist/**`, `vercel.json`, chapter JSON hoặc game implementation trong phase này.

## Gate hoàn thành

Source app và toàn bộ regression tests nhận HCM202 đúng feature/storage contract; MLN111/MLN112 không regress; chưa tái tạo production artifact.
