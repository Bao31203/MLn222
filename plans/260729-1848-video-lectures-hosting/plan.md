---
title: "Tích hợp 6 video YouTube vào website MLN122"
description: "Nhúng playlist YouTube Không công khai và thêm không gian Bài giảng 16:9 vào SPA hiện tại."
status: in-progress
priority: P1
effort: 6h
branch: main
tags: [feature, frontend, video, infra]
created: 2026-07-29
---

# Tích hợp video bài giảng

## Tiến độ hiện tại

- 3/4 phase hoàn tất; Phase 04 đang chờ các thao tác phát hành.
- Đã chọn playlist YouTube Không công khai `PLAN8e5g76wQs`.
- Website phải được phục vụ qua HTTP(S) để YouTube cho phép phát video nhúng;
  `file://` không phải môi trường nghiệm thu Bài giảng.
- Automated QA: 41/41 Python và 141/141 Node pass.
- Browser QA local HTTP: 6/6 video nhúng hoạt động.
- Chưa commit/push và chưa xác minh deployment Vercel production vì chưa được
  chủ dự án yêu cầu/duyệt.

## Tổng quan

Giữ Vercel làm host giao diện tĩnh. Dùng playlist YouTube Không công khai `PLAN8e5g76wQs` đã có đủ 6 chương. Repo chỉ chứa metadata, playlist ID và video ID. Thêm mode thứ năm “Bài giảng” với một player 16:9 và playlist 6 chương.

## Quyết định

**Đã chọn: YouTube Không công khai.** Chủ dự án đã upload đủ 6 video, bật cho phép nhúng và cung cấp playlist theo đúng thứ tự Chương 1 → 6. Dùng `youtube-nocookie.com` để bật chế độ tăng cường quyền riêng tư cho player nhúng.

**Dự phòng tương lai: Mux.** Manifest tách khỏi giao diện để có thể đổi provider nếu cần player không thương hiệu.

Không commit MP4, không dùng Git LFS, không proxy media qua Vercel Function.

## Kiến trúc

```text
GitHub -> Vercel -> index.html + lecture metadata
                         |
                         +-> YouTube privacy-enhanced iframe
                                  |
                                  +-> YouTube adaptive streaming/CDN
```

## Phases

| # | Phase | Trạng thái | Effort | Chi tiết |
|---|---|---|---:|---|
| 1 | Xác minh playlist/media | Completed | 1.5h | [phase-01](./phase-01-upload-media.md) |
| 2 | Manifest và build pipeline | Completed | 1.5h | [phase-02](./phase-02-content-build.md) |
| 3 | Giao diện Bài giảng | Completed | 2h | [phase-03](./phase-03-lecture-ui.md) |
| 4 | QA, Git và Vercel release | In progress | 1h | [phase-04](./phase-04-release.md) |

## Phụ thuộc

- Playlist YouTube `PLAN8e5g76wQs` ở chế độ Không công khai.
- Sáu video phải bật cho phép nhúng.
- Chỉ video IDs và playlist ID đi vào code; không có credential.

## Definition of done

- [ ] Production có mode “Bài giảng” hoạt động trên desktop/mobile.
- [x] Đủ 6 chương, đúng title/duration/caption.
- [x] Video không autoplay, player giữ đúng 16:9 và phát adaptive qua YouTube
  trong local HTTP QA.
- [x] Quiz/flash/search/game không regression.
- [x] Repo không chứa MP4 hoặc secret.
- [x] Build/test pass: 41/41 Python và 141/141 Node.
- [ ] Vercel deployment playback thành công.

## Tài liệu nền

- [Hosting research](./research/hosting-options.md)
- [Codebase audit](./reports/codebase-audit.md)
