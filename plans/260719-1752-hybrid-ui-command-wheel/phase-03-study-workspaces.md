# Phase 03: Study workspaces

## Context links

- [Plan](./plan.md)
- [Phase 02](./phase-02-dual-theme-app-shell.md)

## Overview

- Priority: P1
- Status: Complete
- Effort: 10h
- Mục tiêu: làm mới Luyện thi, Flashcard và Tìm kiếm theo theme sáng, dễ đọc và thao tác nhanh.

## Key insights

- Study markup/CSS/logic nằm trong `template.html`; thay đổi phải chia thành các patch nhỏ và test từng mode.
- Bộ lọc hiện chiếm hai hàng mobile trước khi người học thấy câu hỏi.
- Question frame đã có feedback/review contract tốt, nên giữ logic và đổi hierarchy.

## Requirements

- Reading measure khoảng 760-860px, typography rõ, body mobile tối thiểu 16px.
- Bộ lọc desktop gọn; mobile dùng disclosure/drawer thay vì luôn mở toàn bộ.
- Progress và session stats dễ quét nhưng không tranh với câu hỏi.
- Answer option có selected/correct/wrong/disabled/focus rõ, không dựa màu đơn độc.
- Question navigation không che option/review; sticky chỉ khi đủ không gian.
- Flashcard và search dùng cùng token/component nhưng bố cục theo mục đích.

## Architecture

- Giữ question state và storage logic hiện có.
- Tách presentation classes theo `data-study-mode`.
- Một question frame; feedback/review là full-width band trong frame.
- Search result là row/list, không card grid.

## Related files

- Modify: `C:\Users\pgb31\mln222-quiz\template.html`
- Modify: `C:\Users\pgb31\mln222-quiz\test_pipeline.py`
- Generate: `C:\Users\pgb31\mln222-quiz\index.html`
- Create: `C:\Users\pgb31\mln222-quiz\plans\260719-1752-hybrid-ui-command-wheel\reports\phase-03-study-ui.md`

## Implementation steps

1. Tái cấu trúc toolbar/filter và session summary; giữ form labels/IDs.
2. Làm question frame với metadata thứ cấp, stem nổi bật và option rhythm ổn định.
3. Thiết kế feedback, explanation, source và review navigation.
4. Xây flashcard presentation/reveal states, giữ keyboard behavior.
5. Xây search toolbar sticky, result grouping và safe highlight.
6. Thiết kế mobile filter disclosure và navigation cùng safe area của P2.
7. Test long Vietnamese text, 200% equivalent zoom, empty/filter-zero states.
8. Chụp visual checkpoint cho ba mode desktop/mobile.

## Todo

- [x] Quiz default/answered/review states hoàn chỉnh.
- [x] Flashcard hidden/revealed states hoàn chỉnh.
- [x] Search empty/query/results states hoàn chỉnh.
- [x] Mobile filters không đẩy nội dung chính quá sâu.
- [x] Storage, bookmark, wrong-only và reset workflows pass.

## Success criteria

- Câu hỏi hoặc nội dung flashcard xuất hiện trong viewport đầu trên mobile phổ biến.
- Không text clipping/overlap với câu dài nhất trong bank.
- 200% equivalent zoom vẫn thao tác được, không cuộn ngang.
- 504 câu và thống kê không thay đổi semantics.

## Risk assessment

- Sticky controls có thể che review dài. Chỉ sticky navigation khi viewport đủ cao và reserve inset.
- Disclosure có thể làm bộ lọc khó phát hiện. Hiển thị active-filter summary và count.

## Security considerations

- Search highlight tiếp tục dùng text node/safe DOM, không `innerHTML` từ câu hỏi.
- Không thay đổi localStorage validation.

## Next steps

Chốt study visual checkpoint rồi mở P4.
