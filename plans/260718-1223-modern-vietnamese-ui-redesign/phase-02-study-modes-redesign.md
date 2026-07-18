# Phase 02: Làm mới ba chế độ học

## Context links

- [Kế hoạch tổng](./plan.md)
- [Phase 01](./phase-01-design-foundation-app-shell.md)
- [Thiết kế đã duyệt](../reports/260718-1223-modern-vietnamese-ui-design.md)
- [Template và study runtime](../../template.html)

## Overview

| Field | Value |
|---|---|
| Priority | P1 |
| Status | Completed |
| Effort | 10h |
| Depends on | Phase 01 checkpoint approved |

Tái cấu trúc Luyện thi, Flashcard và Tìm kiếm trên foundation đã duyệt. Không đổi question schema, scoring, statistics, marked/wrong filters hoặc keyboard behavior.

## Key insights

- Quiz và Flashcard dùng chung `render()`; khác nhau ở reveal/choose behavior.
- Study state và localStorage nằm trong inline script của `template.html`.
- Search dùng cùng `QUESTIONS`, render bằng DOM an toàn; có thể đổi presentation mà không đổi query semantics.
- Mobile hiện xếp mọi control thành một cột, tạo chiều cao lớn trước câu hỏi.
- Question card là một frame hợp lệ; vấn đề chính là hierarchy và điều hướng dài trên mobile.

## Requirements

### Luyện thi

- Bộ lọc chương/mức độ rõ, thao tác shuffle/marked/wrong/reset gọn.
- Thống kê câu, điểm, độ phủ và bookmark quét được trong một glance.
- Câu hỏi và bốn đáp án có nhịp đọc ổn định; lựa chọn không làm layout nhảy.
- Feedback đúng/sai, giải thích và nguồn có hierarchy riêng.
- Previous/next luôn tiếp cận được trên mobile mà không che đáp án.

### Flashcard

- Cùng visual language với quiz nhưng action chính là hiện đáp án.
- Trạng thái chưa lật/đã lật rõ mà không phụ thuộc animation.
- Reduced motion không ảnh hưởng khả năng hiểu trạng thái.

### Search

- Search input nổi bật, sticky trong vùng nội dung khi danh sách dài.
- Status cho biết số kết quả; empty state rõ.
- Kết quả là row phân cách, nhóm theo chương khi không phá thứ tự query.
- Highlight từ khóa vẫn an toàn và tương phản tốt.

## Architecture

- Giữ `state`, `LS`, `buildPool()`, `render()`, `choose()`, `doSearch()` làm nguồn behavior.
- Tách helper presentation nhỏ trong inline script chỉ khi giảm lặp thực sự, ví dụ tạo icon button hoặc stat item.
- Không đưa study state vào `MLN222Game` namespace.
- Dùng CSS grid/flex responsive với kích thước ổn định; không đo DOM bằng JavaScript.
- Mobile action bar dùng CSS sticky trong flow, không dùng fixed nếu che content/safe area.

## Related code files

| Action | Absolute path | Change |
|---|---|---|
| Modify | `C:\Users\pgb31\mln222-quiz\template.html` | Study toolbar, stat strip, question/flash/search markup, responsive CSS, render helpers |
| Modify | `C:\Users\pgb31\mln222-quiz\test_pipeline.py` | Study DOM IDs, safe rendering, generated artifact assertions |
| Generate | `C:\Users\pgb31\mln222-quiz\index.html` | Rebuild after source regression |
| Create | `C:\Users\pgb31\mln222-quiz\plans\260718-1223-modern-vietnamese-ui-redesign\reports\phase-02-study-ui.md` | Browser evidence and findings |

## Implementation steps

1. Preserve a mapping of every current study ID/event binding before markup edits.
2. Rebuild filter toolbar with semantic groups and compact icon actions; retain native select controls.
3. Reformat session stats into stable cells; use tabular numerals and labels that fit 360px.
4. Redesign question frame: metadata header, bookmark icon, stem, answer list, feedback band, explanation/source, navigation.
5. Ensure answer option height/style remains stable before and after correctness classes.
6. Add mode-specific styling hooks for quiz and flashcard without forking render markup.
7. Make mobile question navigation sticky only while question frame is active; add bottom padding equal to toolbar height.
8. Redesign search toolbar/results and preserve safe text highlighting.
9. Exercise all filter combinations, empty pools, marked-only, wrong-only and reset confirmation/current behavior.
10. Verify keyboard shortcuts, focus after navigation, screen-reader live status and reduced motion.
11. Build production and capture all three modes at desktop/mobile.

## Todo list

- [x] Map existing IDs and event handlers.
- [x] Rebuild study filter toolbar.
- [x] Rebuild session statistics strip.
- [x] Redesign quiz question and answer states.
- [x] Redesign Flashcard reveal state.
- [x] Redesign Search input, status and result rows.
- [x] Add mobile sticky navigation without occlusion.
- [x] Add/update study build tests.
- [x] Run browser keyboard/mobile regression.
- [x] Save phase report and screenshots.

## Success criteria

- Quiz scoring and session counts match pre-redesign behavior for the same action sequence.
- Flashcard reveal never increments quiz score or enables answer selection.
- Search returns same result IDs/order for fixed queries; presentation grouping does not alter semantics.
- Filters, reset, bookmark and keyboard shortcuts remain operational.
- 360x800 shows first question content without horizontal overflow; sticky navigation does not cover final answer/source.
- Correct/wrong states remain distinguishable by text/icon/border, not color alone.
- Study storage keys and payloads remain unchanged.
- Node/Python regression and offline build pass.

## Risk assessment

| Risk | Mitigation |
|---|---|
| Markup edit breaks inline selector | ID/event map plus browser smoke after each section |
| Sticky navigation covers long explanation | Reserve flow padding; test longest question/source fixture |
| Grouped search changes ordering | Group only at presentation layer or retain flat order when ambiguous |
| Icon-only controls become unclear | Tooltip, `aria-label`, pressed state and visible label where symbol is unfamiliar |

## Security considerations

- Keep user query and question content out of `innerHTML` except existing escaped/highlight path.
- Review `highlight()` for HTML escaping before changing search result templates.
- Do not interpolate source/question strings into attributes.

## Next steps

Proceed to [Phase 03](./phase-03-game-desktop-map-workspace.md) after study regression and screenshot review pass.
