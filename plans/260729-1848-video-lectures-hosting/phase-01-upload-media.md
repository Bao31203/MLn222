# Phase 01: Xác minh playlist và media

## Overview

- Priority: P1
- Status: Completed
- Effort: 1.5h
- Mục tiêu: xác minh playlist YouTube có đúng 6 chương, đúng thứ tự và phát nhúng được.

## Context

- [Hosting research](./research/hosting-options.md)
- [Codebase audit](./reports/codebase-audit.md)
- Nguồn media: `F:\AI-auto-generate-video\output\lectures\mln222-chapter-0N-full\`

## Requirements

- Dùng playlist Không công khai `PLAN8e5g76wQs`.
- Đúng 6 video, theo thứ tự Chương 1 đến Chương 6.
- Tất cả video bật cho phép nhúng.
- Dùng YouTube privacy-enhanced embed domain.
- Không ghi cookie hay credential YouTube vào repo.

## Implementation steps

1. Đọc playlist công khai bằng playlist ID, không dùng cookie đăng nhập.
2. Đối chiếu 6 video ID, title, duration và thứ tự.
3. Xác nhận badge Không công khai và tùy chọn nhúng đã được chủ dự án bật.
4. Test `youtube-nocookie.com/embed/{videoId}` với HTTP Referer production.
5. Ghi playlist/video metadata vào manifest; không lưu URL chia sẻ có tracking parameter.

## Todo

- [x] Đọc playlist Không công khai
- [x] Đối chiếu 6 video ID/title/duration
- [x] Xác nhận thứ tự Chương 1 → 6
- [x] Xác nhận playback nhúng trong browser production-like
- [x] Ghi manifest đã validate

## Success criteria

- 6/6 video phát được từ YouTube privacy-enhanced player qua local HTTP.
- Seek đầu/giữa/cuối hoạt động.
- Không lộ cookie/credential.

## Verification evidence

- Playlist đã chọn: YouTube Không công khai `PLAN8e5g76wQs`.
- Player cần HTTP(S); không dùng `file://` để nghiệm thu video nhúng.
- Browser QA local HTTP xác nhận 6/6 video nhúng hoạt động.

## Risks

- Video bị đổi sang Riêng tư hoặc tắt nhúng sẽ ngừng phát trên website.
- Video có giới hạn độ tuổi có thể bị chặn trong iframe.
- YouTube có thể hiển thị thương hiệu/quảng cáo hoặc gợi ý video cùng kênh.
