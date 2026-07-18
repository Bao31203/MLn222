# Phase 08 - Full map UI and production build

## Context links

- [Plan overview](./plan.md)
- [Campaign API contract phase](./phase-06-headless-vertical-slice.md)
- Existing template: `C:\Users\pgb31\mln222-quiz\template.html`
- Existing builder: `C:\Users\pgb31\mln222-quiz\build_html.py`

## Overview

- Priority: P1
- Status: Completed
- Effort: 18h
- Dependencies: Phase 07
- Goal: xây UI game đầy đủ trên SVG và mở rộng build an toàn mà không làm hỏng ba chế độ học hiện tại.

## Key insights

- `template.html` là source of truth; `index.html` chỉ được tạo bởi builder.
- Game cần vùng rộng hơn `.wrap` 880 px hiện tại và layout riêng theo mode.
- UI chỉ dispatch command và render query/view model; không đọc/sửa state nội bộ.
- Dữ liệu, SVG, CSS và JS phải được nhúng để `file://` hoạt động không mạng.

## Requirements

- Tab Công thành dùng ordinary button/`aria-pressed` theo pattern hiện tại.
- Chọn tỉnh khởi đầu trên map; 34 tỉnh click/focus được; đảo đồng bộ owner color.
- Resource bar, action points, province panel, diplomacy, recruitment, battle tactics, turn report and end-turn quiz.
- Desktop: map chính và context panel cạnh; mobile: map với bottom sheet có chiều cao giới hạn.
- Save after every accepted action, quiz answer and battle resolution.
- Build manifest xác định thứ tự CSS/JS; builder validate tất cả input và atomic replace.
- Dynamic text dùng `textContent`; chỗ buộc dùng HTML phải qua safe template/escaping.
- Reduced motion, keyboard focus, live status and touch target tối thiểu 44 px.

## Architecture

```text
template placeholders
  <- questions JSON
  <- game JSON + SVG serialized safely
  <- ordered CSS/JS from manifest
  <- Python atomic builder

UI event -> controller -> campaign command -> next state/events -> view model -> focused renderer
```

Browser storage adapter wraps `localStorage` but save codec/validation stays ở Phase 05.

## Related code files

Create:

- `C:\Users\pgb31\mln222-quiz\game\build-manifest.json`
- `C:\Users\pgb31\mln222-quiz\game\ui\browser-storage.js`
- `C:\Users\pgb31\mln222-quiz\game\ui\game-controller.js`
- `C:\Users\pgb31\mln222-quiz\game\ui\map-view.js`
- `C:\Users\pgb31\mln222-quiz\game\ui\resource-bar.js`
- `C:\Users\pgb31\mln222-quiz\game\ui\province-panel.js`
- `C:\Users\pgb31\mln222-quiz\game\ui\diplomacy-panel.js`
- `C:\Users\pgb31\mln222-quiz\game\ui\battle-panel.js`
- `C:\Users\pgb31\mln222-quiz\game\ui\game-quiz-view.js`
- `C:\Users\pgb31\mln222-quiz\game\ui\turn-report.js`
- `C:\Users\pgb31\mln222-quiz\game\styles\game.css`
- `C:\Users\pgb31\mln222-quiz\tests\game\build-assets.test.cjs`

Modify:

- `C:\Users\pgb31\mln222-quiz\template.html`
- `C:\Users\pgb31\mln222-quiz\build_html.py`
- `C:\Users\pgb31\mln222-quiz\test_pipeline.py`

Generated only:

- `C:\Users\pgb31\mln222-quiz\index.html`

## Implementation steps

1. Define build manifest sections for data, SVG, styles and ordered scripts.
2. Extend builder with pure render function, exact-one placeholder checks and safe inline JSON/SVG serialization.
3. Reject `</script` in source modules, `</style` in CSS, unsafe SVG constructs and manifest paths resolving outside `game/`.
4. Add game mode container and mode switching without changing existing quiz/flash/search behavior.
5. Implement controller, browser save adapter and create/resume/reset campaign flows.
6. Render map ownership, selected province, active fronts, warning, alliance and occupation states.
7. Add pan/zoom/reset that does not break keyboard focus or province click.
8. Implement resource bar and context panels using stable dimensions.
9. Implement recruitment/unlock/diplomacy/tactic controls with disabled reasons available to assistive text/tooltips.
10. Implement full-screen end-turn quiz with 10-step progress, explanation and persisted answer state.
11. Implement turn report and event prioritization.
12. Add responsive layout at 1440x900, 1024x768, 390x844 and 360x800.
13. Update Python regression to use the same pure render function, copy `game/` in isolated builds and preserve byte-equality checks.
14. Add build asset tests for manifest order, no missing files, safe embedding and no runtime network URL.
15. Build `index.html` and conduct initial desktop/mobile smoke test before Phase 09.

## Todo

- [x] Extend deterministic standalone build
- [x] Add game mode shell and controller
- [x] Implement interactive SVG map
- [x] Implement resource/province/diplomacy/battle panels
- [x] Implement persisted 10-question turn quiz
- [x] Implement responsive/mobile layouts
- [x] Add asset/build contract tests
- [x] Update existing Python regression and isolated build fixture
- [x] Generate initial production HTML

## Success criteria

- 34 provinces are mouse, touch and keyboard selectable.
- Islands always share owner color/state with managing province.
- Create, play, quiz, save and resume work from the built `file://` HTML.
- No runtime request to map source or other network resource.
- Existing three modes retain current behavior and study storage.
- Existing and new Python/Node regression tests all pass at phase completion.
- No horizontal overflow, clipped controls or incoherent overlap at target viewports.
- No console/page error in initial smoke campaign.

## Risk assessment

- Risk: inline production HTML becomes unmaintainable. Mitigation: source modules/assets plus manifest; never edit generated file.
- Risk: map redraw is expensive. Mitigation: update changed province classes/labels, not rebuild SVG each event.
- Risk: game CSS leaks into study UI. Mitigation: scope all selectors under game root/body mode class.
- Risk: localStorage unavailable/full. Mitigation: visible non-blocking warning and in-memory continuation.

## Security considerations

- Sanitize SVG and serialize it as data before insertion.
- Use `textContent` for question, save and event-derived strings.
- Do not inject save fields into HTML templates without escaping.
- Preserve existing inline JSON hardening for `<`, U+2028 and U+2029.

## Next steps

Phase 09 runs full simulations, regression, browser verification and release documentation.
