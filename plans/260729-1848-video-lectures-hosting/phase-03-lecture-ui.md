# Phase 03: Giao diện Bài giảng

## Overview

- Priority: P1
- Status: Completed
- Effort: 2h
- Mục tiêu: thêm trải nghiệm xem 6 bài giảng thống nhất với app shell hiện tại.

## Related files

- Modify: `C:\Users\pgb31\mln222-quiz\template.html`
- Modify: `C:\Users\pgb31\mln222-quiz\test_pipeline.py`
- Generated: `C:\Users\pgb31\mln222-quiz\index.html`

## UX

- Nav thứ năm: icon video/book hiện có + label “Bài giảng”.
- Desktop: player chính 16:9 bên trái/trên, playlist 6 chương bên phải/dưới.
- Mobile: player 16:9, playlist một cột; nav đáy chia 5 mục.
- Chọn chương mới thay source của một player duy nhất.
- Không autoplay; lazy-load khi mode `lecture` được mở.
- Hiển thị chương, tiêu đề, thời lượng, mô tả ngắn và trạng thái caption.
- Có CTA “Luyện câu hỏi chương này” để chuyển sang quiz + filter đúng chương.
- Khi offline/player lỗi: thông báo rõ và nút thử lại, không làm hỏng 4 mode cũ.

## Implementation steps

1. Thêm tab `data-mode="lecture"` và `#lecturePanel`.
2. Thêm CSS responsive, `aspect-ratio: 16 / 9`, focus states, loading/error states.
3. Dùng YouTube privacy-enhanced iframe:
   - `https://www.youtube-nocookie.com/embed/{validatedVideoId}`;
   - `loading="lazy"`;
   - `allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"`;
   - `allowfullscreen`;
   - title theo chương; không gắn playlist/index để nút chuyển video của YouTube không làm lệch trạng thái danh sách trong app;
   - `referrerpolicy="strict-origin-when-cross-origin"`.
4. Render playlist bằng DOM APIs và `textContent`; không `innerHTML` từ manifest.
5. Mở mặc định chương 1; chỉ set iframe `src` khi mode lecture active.
6. Cập nhật `setMode`: hide/show study/search/game/lecture đúng trạng thái.
7. Cập nhật keyboard guard để phím quiz không chạy trong lecture.
8. Cập nhật mobile nav 4 -> 5 items và test 360/390/844/1440 px.
9. Dừng playback khi rời mode bằng cách clear/reset iframe source; không để audio chạy nền.
10. P2 sau MVP: hash deep link `#bai-giang/chuong-3` và progress localStorage.

## Todo

- [x] Thêm nav/workspace Bài giảng
- [x] Render player 16:9 + playlist
- [x] Thêm lecture mode switching/keyboard behavior
- [x] Thêm chapter-to-quiz CTA
- [x] Hoàn thiện responsive/accessibility/error states

## Success criteria

- Player không tải trước khi cần và không autoplay.
- Chuyển 6 chương không reload trang.
- Không còn audio khi đổi mode.
- Keyboard/focus/mobile nav hoạt động.
- Playlist và từng video mở đúng chương.

## Verification evidence

- Browser QA desktop/mobile hoàn tất qua local HTTP.
- 6/6 video nhúng mở đúng từ YouTube privacy-enhanced player.
- HTTP(S) là yêu cầu vận hành cho mode Bài giảng; bốn mode cũ vẫn hỗ trợ
  `file://`.

## Risks

- CDN/player bị chặn: hiển thị link mở player trực tiếp.
- Iframe cross-origin không cho lưu chính xác playback position ở MVP; không giả lập progress.
- 5 tab có thể chật ở màn 360 px; dùng label ngắn, font/spacing có test.
