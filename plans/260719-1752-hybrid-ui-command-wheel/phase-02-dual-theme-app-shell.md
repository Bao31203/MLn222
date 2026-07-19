# Phase 02: App shell và dual theme

## Context links

- [Plan](./plan.md)
- [Phase 01](./phase-01-baseline-design-contract.md)

## Overview

- Priority: P1
- Status: Complete
- Effort: 9h
- Mục tiêu: xây shell mới, theme study sáng/game tối và navigation responsive ổn định.

## Key insights

- Bốn mode dùng `data-mode`; giữ contract này giảm rủi ro state regression.
- Header + tabs hiện chiếm nhiều chiều cao và tab Công thành xuống dòng trên mobile.
- Game cần full-width trong khi study cần readable container.

## Requirements

- Desktop dùng compact navigation rail hoặc rail-expanded pattern; mobile dùng bottom navigation bốn mục.
- Header/top bar thấp, hiển thị MLN222 và trạng thái cần thiết, không lặp thông tin.
- Study light tokens và game dark tokens cùng semantic role.
- Chuyển mode không flash theme, không mất focus hoặc scroll bất thường.
- Giữ skip link, heading hierarchy, `aria-pressed` và keyboard navigation.

## Architecture

- Theme state derive từ mode hiện tại bằng body class/data attribute.
- Semantic tokens: canvas, surface, text, muted, border, primary, success, warning, danger, focus.
- Component CSS chỉ đọc semantic token; không hardcode palette theo từng button.
- Navigation markup dùng cùng bốn button ở mọi breakpoint; CSS đổi presentation.

## Related files

- Modify: `C:\Users\pgb31\mln222-quiz\template.html`
- Modify: `C:\Users\pgb31\mln222-quiz\test_pipeline.py`
- Modify: `C:\Users\pgb31\mln222-quiz\tests\game\build-assets.test.cjs` khi contract source thay đổi
- Generate: `C:\Users\pgb31\mln222-quiz\index.html`

## Implementation steps

1. Tách token primitive và semantic role cho light/dark mode.
2. Tái cấu trúc app shell nhưng giữ IDs/data attributes cần thiết.
3. Xây desktop nav rail và compact top bar; dành full viewport cho game.
4. Xây mobile bottom nav có safe-area inset; reserve content padding.
5. Cập nhật mode switch để set theme synchronously.
6. Chuẩn hóa icon size, control height, focus, hover, pressed và disabled.
7. Thêm contract tests cho navigation labels, mode state và theme hooks.
8. Browser QA P2 tại 1440x900, 1024x768, 390x844, 360x800.

## Todo

- [x] Semantic token set hoàn chỉnh cho hai theme.
- [x] Desktop shell không làm giảm map workspace bất hợp lý.
- [x] Mobile bottom navigation không che nội dung.
- [x] Mode switch giữ nguyên state study/campaign.
- [x] Keyboard/focus và reduced-motion pass.

## Success criteria

- Navigation không xuống dòng hoặc overflow ở 360px.
- Study và game có hai không gian rõ nhưng cùng nhận diện.
- Main content không bị fixed navigation che tại mọi viewport.
- Existing mode-switch tests và build pipeline pass.

## Risk assessment

- CSS global có thể rò vào game SVG/panel. Dùng token scope và component class cụ thể.
- Fixed bottom nav có thể che sticky question controls. Reserve một safe-area token dùng chung.

## Security considerations

- Không thêm external font/CDN/script.
- Dynamic mode chỉ đổi class/attribute; không inject HTML từ state.

## Next steps

Visual checkpoint app shell trước khi triển khai P3.
