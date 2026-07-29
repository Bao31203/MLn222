# Research: hosting video bài giảng MLN122

Ngày kiểm tra: 2026-07-29.

## Dữ liệu đầu vào

- 6 video master, H.264/AAC, 1920x1080, 30 fps.
- Tổng dung lượng: 833.876.164 bytes (795,2 MiB).
- Tổng thời lượng: 13.217 giây (3 giờ 40 phút 17 giây).
- Từng video: 90,6-177,6 MiB; 19:43-52:04.
- Có sẵn 6 phụ đề tiếng Việt dạng SRT.

## So sánh

| Phương án | Chi phí/giới hạn hiện tại | Trải nghiệm | Kết luận |
|---|---|---|---|
| Mux Free | 10 video lưu trữ, 100.000 phút phát/tháng, không cần thẻ | Player sạch, adaptive streaming, poster/thumbnail, captions, analytics | Khuyến nghị |
| YouTube Unlisted | Không có hóa đơn lưu trữ/băng thông trực tiếp | Adaptive streaming, captions; có thương hiệu/khả năng quảng cáo YouTube | Phương án dự phòng nhanh |
| Cloudflare R2 | 10 GB-tháng, 1M Class A, 10M Class B miễn phí; egress miễn phí | Chỉ phát MP4 một rendition; phải tự quản player, cache, caption | Rẻ nhưng nhiều vận hành hơn; custom domain cần domain thuộc Cloudflare |
| Cloudflare Stream | 5 USD/1.000 phút lưu; 1 USD/1.000 phút phát | Dịch vụ video hoàn chỉnh | Tốt nhưng Mux Free phù hợp hơn quy mô hiện tại |
| Vercel Blob Hobby | 1 GB-tháng lưu, 10 GB transfer | Phát MP4 trực tiếp, không có adaptive bitrate | Sát trần lưu trữ; khoảng 12 lượt xem trọn khóa có thể hết transfer |
| Commit MP4 vào Git/Vercel | GitHub chặn file >100 MiB; Vercel Hobby giới hạn source upload 100 MB | Không có lợi ích streaming | Loại |

## Quyết định đề xuất

Chọn **Mux Free**:

- 6 video dùng 6/10 asset slots.
- 100.000 / 220,29 = khoảng 454 lượt xem trọn cả khóa mỗi tháng.
- Website chỉ lưu `playbackId` công khai và metadata; không lưu MP4 hay API secret.
- Dùng một Mux Player duy nhất, chỉ tải khi người học mở chế độ Bài giảng.
- Dùng các SRT hiện có làm caption tiếng Việt chuẩn thay vì phụ thuộc hoàn toàn vào ASR.

Phương án dự phòng là YouTube Unlisted. Cùng một `content/lectures.json` và lớp provider adapter cho phép đổi provider mà không thiết kế lại giao diện.

## Nguồn chính thức

- Mux pricing/free plan: https://www.mux.com/pricing
- Mux Free announcement: https://www.mux.com/docs/changelog/video-free-plan
- Mux Player HTML/embed: https://www.mux.com/docs/guides/mux-player-web
- Mux SRT/WebVTT captions: https://www.mux.com/docs/guides/add-subtitles-to-your-videos
- YouTube Unlisted: https://support.google.com/youtube/answer/157177
- YouTube embed/privacy-enhanced mode: https://support.google.com/youtube/answer/171780
- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
- Cloudflare R2 public buckets: https://developers.cloudflare.com/r2/buckets/public-buckets/
- Cloudflare Stream pricing: https://developers.cloudflare.com/stream/pricing/
- Vercel Blob pricing: https://vercel.com/docs/vercel-blob/usage-and-pricing
- Vercel limits: https://vercel.com/docs/limits
- GitHub large file limits: https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github
