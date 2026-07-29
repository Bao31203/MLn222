# Codebase audit: tích hợp video bài giảng

## Hiện trạng

- Repo: `C:\Users\pgb31\mln222-quiz`
- Branch: `main`
- HEAD và `origin/main`: `28768aafcd7140b76dd7159100175865876014b4`
- Production: `https://mln122-one.vercel.app/` trả HTTP 200.
- Production có `Content-Length: 1809941`, đúng bằng `index.html` local.
- Worktree chỉ có 4 ảnh untracked có sẵn trong `docs/screenshots/`; phải giữ nguyên.

## Kiến trúc

- SPA HTML tĩnh, không có framework/package manager/backend.
- `template.html` là source of truth.
- `build_html.py` validate và sinh `index.html` atomically.
- `index.html` là artifact; không sửa trực tiếp.
- App có 4 mode: `quiz`, `flash`, `search`, `game`.

## Điểm tích hợp

- `template.html:495-524`: app shell và nav.
- `template.html:526-634`: các study/search workspace.
- `template.html:1300-1326`: `setMode`.
- `template.html:1328+`: init/wiring.
- `template.html:1368-1375`: keyboard guard.
- `template.html:328-333`: mobile nav đang thiết kế cho 4 mục.
- `build_html.py:14-25`: inputs/placeholders.
- `build_html.py:156-170`: render replacements.
- `build_html.py:173-218`: validate/build/write.
- `test_pipeline.py:283-318`: build parity.
- `test_pipeline.py:368-417`: mode/nav/icon contracts.
- `test_pipeline.py:428+`: DOM contracts.

## Video và phụ đề

| Chương | Video | Dung lượng | Thời lượng | Phụ đề |
|---|---|---:|---:|---|
| 1 | `mln222-chapter-01-full/video-chapter-01-master.mp4` | 90,6 MiB | 19:43 | `chapter-01-subtitles.vi.srt` |
| 2 | `mln222-chapter-02-full/video-chapter-02-master.mp4` | 136,4 MiB | 35:10 | `chapter-02-subtitles.vi.srt` |
| 3 | `mln222-chapter-03-full/video-chapter-03-master.mp4` | 135,6 MiB | 38:19 | `chapter-03-subtitles.vi.srt` |
| 4 | `mln222-chapter-04-full/video-chapter-04-master.mp4` | 121,3 MiB | 34:38 | `chapter-04-subtitles.vi.srt` |
| 5 | `mln222-chapter-05-full/video-chapter-05-master.mp4` | 133,7 MiB | 40:23 | `chapter-05-subtitles.vi.srt` |
| 6 | `mln222-chapter-06-full/video-chapter-06-master.mp4` | 177,6 MiB | 52:04 | `chapter-06-subtitles.vi.srt` |

Nguồn tuyệt đối: `F:\AI-auto-generate-video\output\lectures\mln222-chapter-0N-full\`.

## Kết luận tích hợp

- Thêm mode thứ năm `lecture`.
- Thêm manifest nhỏ `content/lectures.json`.
- Builder chỉ nhúng metadata/playback ID; không nhúng media.
- Player 16:9 + playlist 6 chương; chỉ tạo/tải player khi cần.
- Giữ chức năng quiz/game offline; riêng video hiển thị trạng thái cần Internet.
