# Phase 05: Trạng thái, quiz, accessibility và polish

## Context links

- [Kế hoạch tổng](./plan.md)
- [Phase 04](./phase-04-game-mobile-interactions.md)
- [Game quiz view](../../game/ui/game-quiz-view.js)
- [Turn report](../../game/ui/turn-report.js)
- [UI utilities](../../game/ui/ui-utils.js)

## Overview

| Field | Value |
|---|---|
| Priority | P1 |
| Status | Completed |
| Effort | 8h |
| Depends on | Phases 02-04 |

Hoàn thiện state language, quiz cuối lượt, feedback, accessibility và interaction polish trên tất cả mode. Phase này không mở rộng gameplay; chỉ làm rõ những trạng thái engine/controller đã có.

## Key insights

- `game-quiz-view.js` đã có focus trap, restore focus, review resume và live feedback; redesign phải giữ contract này.
- Warning, battle, occupation, alliance, pending action và disabled reason đang tồn tại nhưng chủ yếu thể hiện bằng màu/text dày.
- `turn-report.js` có event priority và mô tả tiếng Việt đủ tốt; cần presentation timeline, không cần đổi event model.
- Nhiều button động có `title`; title không đủ cho touch/screen reader nếu label không rõ.
- Motion chỉ nên hỗ trợ state transition; không làm animation bản đồ/trang trí liên tục.

## Requirements

### State language

- Success, warning, danger, neutral, selected, pending và disabled có icon/text/border, không chỉ màu.
- Battle/warning tab badge và map marker thống nhất ý nghĩa.
- Pending order thể hiện tại action row, command status và action points mà không nhân bản source state.
- Empty, error, corrupt-save fallback và no-storage warning có visual pattern chung.
- Disabled control có lý do đọc được qua visible secondary text hoặc accessible description.

### Turn quiz

- Giữ quy trình đúng 10 câu, review từng câu và reward completion.
- Progress, score, question, answer, explanation và next action dùng cùng visual grammar với Luyện thi.
- Dialog không overflow ở mobile; focus trap và Escape policy không cho bỏ qua quiz.
- Completion view làm rõ resource delta/effect từ controller result, không tự suy diễn.

### Accessibility

- Contrast WCAG AA cho text/control/state.
- Tab order theo visual order; không focus hidden clone/island/panel.
- `aria-live` không lặp spam trên mỗi render.
- Nút icon có accessible name; tooltip không là nguồn thông tin duy nhất.
- Touch target tối thiểu 44px.
- `prefers-reduced-motion` vô hiệu hóa non-essential transitions.

## Architecture

### Status primitives

- Dùng class semantic chung: status tone + icon + label + optional description.
- `ui-utils.js` cung cấp helper nhỏ cho icon/status row; không tạo component framework.
- Panel modules vẫn sở hữu nội dung cụ thể; helper chỉ chuẩn hóa markup lặp.
- CSS animation giới hạn opacity/transform 120-180ms cho overlay/sheet; không animate layout dimensions dài.

### Accessibility validation

1. Static/source assertions: ARIA relationships, unique IDs, hidden state, button names.
2. Keyboard walkthrough: all four modes, map targets, tabs, actions, quiz trap.
3. Browser accessibility snapshot at representative states.
4. Contrast calculation for token pairs and state variants.
5. Reduced-motion and forced zoom/text stress at 200% where practical.

## Related code files

| Action | Absolute path | Change |
|---|---|---|
| Modify | `C:\Users\pgb31\mln222-quiz\template.html` | Study feedback states, tooltips, shared ARIA and quiz visual parity |
| Modify | `C:\Users\pgb31\mln222-quiz\game\styles\game.css` | Status tones, quiz overlay, timelines, focus/reduced motion polish |
| Modify | `C:\Users\pgb31\mln222-quiz\game\ui\ui-utils.js` | Reusable icon/status helpers only where duplication exists |
| Modify | `C:\Users\pgb31\mln222-quiz\game\ui\game-quiz-view.js` | Quiz hierarchy, result state and accessible descriptions |
| Modify | `C:\Users\pgb31\mln222-quiz\game\ui\province-panel.js` | Pending/disabled/occupation status polish |
| Modify | `C:\Users\pgb31\mln222-quiz\game\ui\diplomacy-panel.js` | Relation and treaty status polish |
| Modify | `C:\Users\pgb31\mln222-quiz\game\ui\battle-panel.js` | Battle health/tactic/reinforcement states |
| Modify | `C:\Users\pgb31\mln222-quiz\game\ui\turn-report.js` | Timeline markup and event severity icon |
| Modify | `C:\Users\pgb31\mln222-quiz\tests\game\quiz-save.test.cjs` | Review/resume contract remains intact |
| Modify | `C:\Users\pgb31\mln222-quiz\tests\game\build-assets.test.cjs` | ARIA/icon/inline safety assertions where appropriate |
| Modify | `C:\Users\pgb31\mln222-quiz\test_pipeline.py` | Static accessibility/build contracts |
| Generate | `C:\Users\pgb31\mln222-quiz\index.html` | Build after tests |
| Create | `C:\Users\pgb31\mln222-quiz\plans\260718-1223-modern-vietnamese-ui-redesign\reports\phase-05-accessibility.md` | State matrix and audit evidence |

## Implementation steps

1. Inventory every existing visual state and map each to semantic tone/icon/label.
2. Add status primitives only for markup repeated across at least two modules.
3. Normalize pending/disabled/error/empty presentation in province, diplomacy, battle and report panels.
4. Redesign battle summary with stable stats/progress presentation; keep tactic buttons and reinforcement behavior unchanged.
5. Redesign report events as compact timeline rows ordered by existing priority.
6. Align end-turn quiz with study question grammar while preserving focus trap/review persistence.
7. Add completion summary from existing quiz reward/result payload.
8. Audit accessible names, ARIA relationships, focus order, hidden panels/clones and live regions.
9. Test keyboard-only route through all modes and representative campaign actions.
10. Test reduced motion, 200% zoom and long Vietnamese labels.
11. Resolve only presentation defects; route engine/data issues back to their owner instead of patching UI logic.
12. Save accessibility/state report with pass/fail evidence.

## Todo list

- [x] Build complete visual state inventory.
- [x] Add minimal status primitives.
- [x] Polish pending/disabled/error/empty states.
- [x] Redesign battle and report presentation.
- [x] Align turn quiz and completion summary.
- [x] Audit labels, focus, live regions and hidden content.
- [x] Verify keyboard-only full workflow.
- [x] Verify reduced motion and 200% zoom.
- [x] Run regression and save phase report.

## Success criteria

- Every critical state is understandable without relying on hue alone.
- Disabled actions expose a reason where the UI already knows it.
- Quiz cannot be dismissed/bypassed; reload resumes same review/progress state.
- Keyboard reaches 34 primary provinces, all tabs/actions and returns focus after quiz.
- Hidden panels and island clones are absent from focus order.
- No duplicate IDs or excessive live-region announcements.
- Text/control contrast meets WCAG AA and target size is at least 44px.
- Reduced-motion removes non-essential transitions.
- Existing save/quiz/controller tests and new assertions pass.

## Risk assessment

| Risk | Mitigation |
|---|---|
| Shared helper becomes mini framework | Add only repeated primitives; keep domain rendering local |
| Live region floods announcements | Deduplicate messages as `game-app.js` already does; announce user-relevant changes only |
| Tooltip inaccessible on touch | Visible secondary text/ARIA description remains source of truth |
| Quiz redesign breaks focus trap | Contract test plus keyboard/reload browser walkthrough |
| Polish introduces excessive motion | Strict duration/property list and reduced-motion override |

## Security considerations

- Continue safe DOM construction; no status helper accepts raw HTML.
- Result/reward text derives from validated snapshot payload.
- No new storage or external asset path.

## Next steps

Proceed to [Phase 06](./phase-06-release-verification.md) only after accessibility report has no high-severity finding.
