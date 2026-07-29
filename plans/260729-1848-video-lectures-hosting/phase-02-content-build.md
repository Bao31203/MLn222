# Phase 02: Manifest và build pipeline

## Overview

- Priority: P1
- Status: Completed
- Effort: 1.5h
- Mục tiêu: quản lý lecture metadata có schema và nhúng an toàn vào HTML build.

## Related files

- Create: `C:\Users\pgb31\mln222-quiz\content\lectures.json`
- Modify: `C:\Users\pgb31\mln222-quiz\build_html.py`
- Modify: `C:\Users\pgb31\mln222-quiz\test_pipeline.py`
- Modify: `C:\Users\pgb31\mln222-quiz\template.html`
- Generated: `C:\Users\pgb31\mln222-quiz\index.html`
- Optional create: `C:\Users\pgb31\mln222-quiz\content\lectures\captions\*.srt`

## Manifest contract

```json
{
  "version": 1,
  "provider": "youtube",
  "playlistId": "PLAN8e5g76wQs",
  "lectures": [{
    "id": "chapter-01",
    "chapterNum": 1,
    "title": "Chương 1 — Khái quát môn học",
    "durationSeconds": 1183,
    "videoId": "YOUTUBE_VIDEO_ID",
    "chapterValue": "Chương 1 · Slot 1: Khái quát môn học",
    "summary": "Nội dung trọng tâm của chương."
  }]
}
```

## Implementation steps

1. Tạo đủ 6 entries, map đúng title chương và duration thực tế.
2. Thêm `LECTURES_PLACEHOLDER = "/*__LECTURES__*/[]"`.
3. Load JSON bằng UTF-8; validate:
   - version/provider hợp lệ;
   - đúng 6 chương, unique `id`/`chapterNum`;
   - `chapterNum` là 1..6;
   - title/duration/videoId/chapterValue không rỗng;
   - playlist ID và video ID chỉ chứa ký tự hợp lệ;
   - không có URL tùy ý, local path hoặc credential.
4. Serialize bằng cùng cơ chế chống đóng thẻ script như question data.
5. Thêm replacement vào `render_html`.
6. Test invalid/missing/duplicate manifest và deterministic build.
7. Sinh lại `index.html`; không hand-edit artifact.

## Todo

- [x] Tạo và validate lecture manifest
- [x] Thêm builder placeholder/replacement
- [x] Thêm unit/build parity tests
- [x] Generate deterministic `index.html`

## Success criteria

- Build fail rõ ràng nếu thiếu/sai một chương.
- Output chứa playlist ID + 6 video IDs nhưng không chứa MP4/base64 media/secret/local path.
- Hai lần build cho output byte-equivalent.

## Verification evidence

- Build hoàn tất với manifest playlist `PLAN8e5g76wQs`.
- Python suite pass 41/41.
- Node suite pass 141/141.

## Security

- Player URL phải được tạo từ provider adapter + validated ID.
- Không nhận arbitrary HTML/URL từ manifest.
- YouTube playlist/video IDs là dữ liệu công khai; cookie/credential không bao giờ xuất hiện trong output.
