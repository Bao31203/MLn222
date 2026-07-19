# Phase 08: Quiz, states và accessibility

## Context links

- [Plan](./plan.md)
- [Phase 03](./phase-03-study-workspaces.md)
- [Phase 07](./phase-07-mobile-game-interactions.md)

## Overview

- Priority: P1
- Status: Complete
- Effort: 7h
- Mục tiêu: hoàn thiện quiz cuối lượt, feedback toàn hệ thống, motion và accessibility parity.

## Key insights

- Quiz cuối lượt đã có focus trap/resume/review; redesign không được phá lifecycle 10 câu.
- Game theme tối nhưng nội dung học cần reading surface sáng hoặc tương phản cao.
- Context wheel thêm một lớp focus/overlay mới cần được audit cùng modal/sheet.

## Requirements

- Quiz cuối lượt là focused learning sheet/dialog, hierarchy tương đồng Luyện thi.
- Progress, answer, review, result và reward delta rõ trên desktop/mobile.
- Escape bị chặn khi quiz bắt buộc nhưng hoạt động đúng với radial/action sheet thường.
- Toast/status/error gần hành động và có live region hợp lý, không spam screen reader.
- Focus visible, heading order, dialog labels, selected/disabled/expanded states đầy đủ.
- Motion 150-250ms và chỉ transform/opacity; reduced-motion tắt motion không cần thiết.
- Contrast AA; color không là tín hiệu duy nhất.

## Architecture

- Quiz logic và storage giữ nguyên; chỉ đổi markup/style/rendering.
- Overlay stack có z-index contract: map < HUD < sheet < radial < action sheet < quiz modal.
- Focus manager xác định owner overlay và restore target khi đóng.
- Status message severity dùng shared component/token.

## Related files

- Modify: `C:\Users\pgb31\mln222-quiz\game\ui\game-quiz-view.js`
- Modify: `C:\Users\pgb31\mln222-quiz\game\ui\game-app.js`
- Modify: `C:\Users\pgb31\mln222-quiz\game\ui\context-command-menu.js`
- Modify: `C:\Users\pgb31\mln222-quiz\game\ui\ui-utils.js`
- Modify: `C:\Users\pgb31\mln222-quiz\game\styles\game.css`
- Modify: `C:\Users\pgb31\mln222-quiz\template.html`
- Modify: `C:\Users\pgb31\mln222-quiz\tests\game\quiz-save.test.cjs`
- Modify: `C:\Users\pgb31\mln222-quiz\test_pipeline.py`
- Generate: `C:\Users\pgb31\mln222-quiz\index.html`

## Implementation steps

1. Xác lập overlay/z-index/focus ownership contract.
2. Làm mới game quiz question, review, result và reward states.
3. Chuẩn hóa success/warning/error/disabled/loading/empty states toàn app.
4. Audit radial/action sheet/dialog ARIA, roving focus và Escape behavior.
5. Audit contrast bằng token pairs; sửa pairs dưới 4.5:1.
6. Thêm/revise reduced-motion và high zoom behavior.
7. Browser test keyboard-only, screen-reader semantics cơ bản và 200% equivalent zoom.

## Todo

- [x] Quiz 10 câu, review, result và reward visuals hoàn chỉnh.
- [x] Focus trap/restore pass cho mọi overlay.
- [x] Contrast và color-not-only pass.
- [x] Reduced-motion pass.
- [x] Storage failure/corrupt save states vẫn rõ và thao tác được.

## Success criteria

- Quiz resume đúng câu và hoàn tất tạo lượt mới như baseline.
- Không focus rơi sau khi đóng radial/action sheet/quiz.
- Không text clipping ở 200% equivalent zoom.
- Live region truyền lỗi/thành công đúng một lần.

## Risk assessment

- Nhiều overlay có thể tạo focus trap lồng. Chỉ một overlay owner active; đóng lớp con trả focus cho lớp cha.
- Light quiz surface trên dark game có thể quá chói. Dùng cool-white surface và scrim đúng contrast.

## Security considerations

- Explanation/source tiếp tục render safe text.
- Storage error không lộ raw serialized save trong UI.

## Next steps

Mở P9 sau accessibility report pass.
