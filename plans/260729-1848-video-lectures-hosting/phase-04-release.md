# Phase 04: QA, Git và Vercel release

## Overview

- Priority: P1
- Status: In progress
- Effort: 1h
- Mục tiêu: release an toàn, có rollback và bằng chứng playback production.

## Related files

- Modify: `C:\Users\pgb31\mln222-quiz\README.md`
- Modify: `C:\Users\pgb31\mln222-quiz\test_pipeline.py`
- Generated: `C:\Users\pgb31\mln222-quiz\index.html`
- Preserve: `C:\Users\pgb31\mln222-quiz\docs\screenshots\` untracked files hiện có

## Validation

1. Chạy:

```powershell
python build_html.py
python -m unittest -v test_pipeline.py
node --test --test-concurrency=1 tests/game/*.test.cjs
git diff --check
```

2. Browser QA:
   - 360x800, 390x844, 844x390, 1440x900;
   - Chrome/Edge desktop và một thiết bị mobile;
   - mở từng chương, seek, captions, fullscreen, PiP nếu hỗ trợ;
   - đổi lecture -> quiz/search/game, xác nhận audio dừng;
   - test mạng chậm/offline/error.
3. Xác nhận Git diff không có MP4, token, secret hoặc local absolute path trong production files.
4. Commit feature files; chỉ push/deploy khi chủ dự án duyệt.
5. Sau Vercel deploy:
   - HTTP 200;
   - đúng 5 nav modes;
   - 6/6 player load từ production origin;
   - kiểm tra player privacy-enhanced có playback.

## Todo

- [x] Update README và tests
- [x] Chạy full build/test suite
- [x] Browser QA desktop/mobile
- [x] Security/large-file diff audit
- [ ] Commit, push và verify Vercel

## Success criteria

- [x] Tất cả automated tests pass: 41/41 Python, 141/141 Node.
- [ ] 6/6 video + captions phát trên production.
- [x] Không regression ở 4 mode cũ.
- [x] Build artifact không chứa MP4; media dùng YouTube thay vì đi qua Vercel.

## Validation evidence

- Local HTTP browser QA: 6/6 YouTube embeds hoạt động.
- HTTP(S) là điều kiện bắt buộc cho player Bài giảng; không nghiệm thu bằng
  `file://`.
- `git diff --check` đạt; không phát hiện MP4, credential hay local absolute
  path trong production files.
- Chưa commit/push.
- Chưa deploy hoặc xác minh HTTP 200, 5 nav modes và 6/6 playback trên Vercel
  production; các bước này cần chủ dự án yêu cầu/duyệt.

## Rollback

- Rollback Vercel về deployment trước.
- Revert feature commit nếu cần.
- Playlist YouTube giữ nguyên; video IDs không ảnh hưởng app cũ.
