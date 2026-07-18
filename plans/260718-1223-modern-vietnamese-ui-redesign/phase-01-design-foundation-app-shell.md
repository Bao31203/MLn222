# Phase 01: Design foundation, baseline và app shell

## Context links

- [Kế hoạch tổng](./plan.md)
- [Thiết kế đã duyệt](../reports/260718-1223-modern-vietnamese-ui-design.md)
- [Template hiện tại](../../template.html)
- [CSS game hiện tại](../../game/styles/game.css)
- [Báo cáo E2E trước redesign](../260717-2056-conquest-learning-game/reports/end-to-end-testing.md)

## Overview

| Field | Value |
|---|---|
| Priority | P1 |
| Status | Completed |
| Effort | 8h |
| Depends on | None |

Khóa baseline và xây nền tảng thị giác dùng chung trước khi đổi từng màn hình. Phase này chỉ thay app shell và primitives; không tái bố trí sâu question card hoặc game workspace.

## Key insights

- Base CSS nằm trực tiếp trong `template.html`; game CSS được nhúng từ manifest.
- `.hidden`, focus style và form controls hiện được dùng chung, nên token migration phải giữ behavior.
- Game module tạo DOM động bằng `ui-utils.element`; icon động cần helper dùng cùng SVG sprite với markup tĩnh.
- Build cấm `@import`, `url()` và external reference trong game stylesheet/SVG.
- Worktree đang chứa thay đổi game chưa commit; implementation phải làm việc trên trạng thái hiện tại, không reset.

## Requirements

### Functional

- App shell có brand MLN222, tên học phần, tổng câu và primary navigation bốn chế độ.
- Navigation giữ `data-mode`, `aria-pressed` và behavior `setMode()` hiện tại.
- Icon có label truy cập được; nút icon quen thuộc có tooltip.
- Chuyển mode không làm mất study session hoặc campaign state.
- Game vẫn mở full-width; study modes vẫn có chiều rộng đọc kiểm soát.

### Non-functional

- Token màu/spacing/type là nguồn duy nhất cho study và được map vào game token.
- Không thêm network dependency.
- Không có layout shift khi active tab hoặc số liệu thay đổi.
- Focus visible và reduced motion tồn tại từ phase đầu.

## Architecture

### Token layers

1. Global semantic tokens tại `:root`: canvas, surface, elevated surface, border, text, muted, cinnabar, jade, brass, river, success, danger, focus.
2. Component tokens chỉ khi cần: control height, app shell height, panel width, radius.
3. `.game-root` alias về global token; không duy trì palette song song.

### Icon strategy

- Nhúng một SVG sprite ẩn trong `template.html` với subset Lucide cần thiết.
- Static controls dùng `<svg><use href="#icon-name"></use></svg>`.
- `ui-utils.icon(name, options)` tạo cùng cấu trúc cho component động.
- Mỗi icon decorative có `aria-hidden="true"`; accessible name nằm trên button/control.
- Chỉ thêm icon thực sự dùng; không đóng gói cả thư viện.

### Font strategy

- Phase mặc định dùng system stack tối ưu tiếng Việt và tabular numerals cho số liệu.
- Chỉ nhúng font local nếu visual checkpoint chứng minh cần thiết, font có license rõ, bản WOFF2 subset không làm artifact vượt budget.
- Không dùng font qua CDN hoặc CSS `@import`.

## Related code files

| Action | Absolute path | Change |
|---|---|---|
| Modify | `C:\Users\pgb31\mln222-quiz\template.html` | Token, app shell, nav markup, icon sprite, base primitives |
| Modify | `C:\Users\pgb31\mln222-quiz\game\styles\game.css` | Alias game palette về token chung, shell compatibility |
| Modify | `C:\Users\pgb31\mln222-quiz\game\ui\ui-utils.js` | Helper icon và presentation utility nhỏ |
| Modify | `C:\Users\pgb31\mln222-quiz\test_pipeline.py` | Assert placeholder/build/app shell contract |
| Modify | `C:\Users\pgb31\mln222-quiz\tests\game\build-assets.test.cjs` | Assert sprite/icon inline safety và no-network |
| Generate | `C:\Users\pgb31\mln222-quiz\index.html` | Rebuild only after source tests pass |
| Create | `C:\Users\pgb31\mln222-quiz\plans\260718-1223-modern-vietnamese-ui-redesign\reports\phase-01-baseline.md` | Baseline metrics, screenshots và checkpoint result |

## Implementation steps

1. Capture current 1440x900, 1024x768, 390x844 và 360x800 screenshots for study/game setup/campaign.
2. Record current artifact bytes/hash, console errors, network requests and known visual defects.
3. Define semantic tokens without changing component layout; run contrast calculation for every foreground/background pair.
4. Replace duplicate game palette values with semantic aliases while preserving current states.
5. Add compact app shell structure and retain all required IDs/data attributes.
6. Verify Lucide package license/attribution requirements, then add only the allowlisted sprite subset and icon helper; document icon names near sprite/helper.
7. Convert primary nav to icon + label with stable dimensions and active indicator.
8. Verify mode switch, keyboard focus, storage persistence and game activation.
9. Add source/build tests before generating production HTML.
10. Capture checkpoint screenshots and request visual approval before Phase 02.

## Todo list

- [x] Capture baseline screenshots and metrics.
- [x] Add semantic design tokens.
- [x] Unify study/game color aliases.
- [x] Add minimal Lucide sprite and icon helper.
- [x] Record icon license/attribution decision.
- [x] Rebuild compact app shell/navigation.
- [x] Add inline-safety and DOM-contract tests.
- [x] Run Node/Python regression.
- [x] Save phase report.
- [x] Obtain visual checkpoint approval.

## Success criteria

- Four mode buttons still switch correct panels and preserve `aria-pressed`.
- App shell has no overflow at all target viewports.
- Contrast pairs meet WCAG AA; focus ring visible on dark and light surfaces.
- No external request or forbidden inline sequence.
- Existing test totals pass unchanged before new assertions are counted.
- Generated HTML remains below interim budget 1.7 MB unless an approved font asset explains the increase.
- User approves palette, typography, icon language and overall density.

## Risk assessment

| Risk | Mitigation |
|---|---|
| Global token rename silently breaks game state color | Visual state matrix plus selector search before/after |
| SVG sprite IDs collide with map IDs | Prefix every symbol `ui-icon-`; test uniqueness |
| Header height reduces game viewport | Fixed compact constraints; check 768px and 800px heights |
| Font experiment bloats file | System font default; asset budget gate before inclusion |

## Security considerations

- Keep SVG sprite static and allowlisted; no user-supplied markup.
- Verify the source and license of copied icon paths; retain required notice in repository documentation.
- Preserve builder validation against external URLs and active SVG/script content.
- Continue writing all dynamic text through `textContent`/safe DOM helpers.

## Next steps

Proceed to [Phase 02](./phase-02-study-modes-redesign.md) only after visual checkpoint approval and full regression pass.
