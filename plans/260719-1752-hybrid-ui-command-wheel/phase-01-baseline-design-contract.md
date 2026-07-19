# Phase 01: Baseline và design contract

## Context links

- [Plan](./plan.md)
- [Thiết kế đã duyệt](../reports/260719-1752-hybrid-ui-command-wheel-design.md)
- [Kiểm thử release trước](../260718-1223-modern-vietnamese-ui-redesign/reports/end-to-end-testing.md)

## Overview

- Priority: P1
- Status: Complete
- Effort: 6h
- Mục tiêu: khóa baseline kỹ thuật/thị giác trên worktree hiện tại trước khi tái cấu trúc.

## Key insights

- `template.html` vừa chứa markup, study CSS và study state; thay app shell có blast radius lớn.
- `index.html` là generated artifact, tuyệt đối không chỉnh tay.
- Worktree đang có thay đổi bản đồ liền khối và texture trống đồng; baseline phải lấy trạng thái hiện có làm nguồn.
- Game action hiện lấy từ `npc-ai.queryLegalActions()` qua `controller.legalActions()`.

## Requirements

- Chạy đầy đủ baseline test và ghi kết quả.
- Lưu screenshot tối thiểu cho quiz, flashcard, search, game setup/campaign/battle trên desktop và mobile.
- Kiểm kê DOM ID, storage key, module order, map targets và public controller methods.
- Chốt token light-study/dark-game, spacing/type/elevation/motion và viewport matrix.
- Freeze map contract hiện có: full source viewBox, 44 SVG groups, 34 keyboard targets, islands inline và normal border 3 SVG units.
- Không sửa hành vi sản phẩm trong phase này.

## Architecture

Baseline report là contract đầu vào cho P2-P9. Mọi thay đổi DOM/module sau đó phải cập nhật test cùng phase, không dựa vào screenshot cũ.

## Related files

- Create: `C:\Users\pgb31\mln222-quiz\plans\260719-1752-hybrid-ui-command-wheel\reports\phase-01-baseline.md`
- Create: `C:\Users\pgb31\mln222-quiz\plans\260719-1752-hybrid-ui-command-wheel\reports\baseline-*.png`
- Read: `C:\Users\pgb31\mln222-quiz\template.html`
- Read: `C:\Users\pgb31\mln222-quiz\game\ui\*.js`
- Read: `C:\Users\pgb31\mln222-quiz\game\styles\game.css`
- Read: `C:\Users\pgb31\mln222-quiz\tests\game\*.test.cjs`
- Read: `C:\Users\pgb31\mln222-quiz\test_pipeline.py`

## Implementation steps

1. Ghi `git status`, diff stat và hash artifact; không cleanup thay đổi người dùng.
2. Chạy validators, Node tests, Python pipeline và deterministic build.
3. Chụp browser matrix trên `file://`; ghi console/network/overflow và control sizes.
4. Lập DOM/storage/module contract table.
5. Lập action taxonomy: province, diplomacy, battle, report; map payload về target faction/province.
6. Chốt semantic tokens và visual acceptance checklist cho hai theme.
7. Thêm browser geometry assertions cho overflow, map/control bounds và minimum target size.
8. Ghi residual risks trước khi mở P2.

## Todo

- [x] Baseline automated tests pass và được ghi log.
- [x] Baseline screenshot matrix hoàn chỉnh.
- [x] DOM/storage/module contracts được kiểm kê.
- [x] Action taxonomy và viewport matrix được chốt.
- [x] Design tokens có contrast target và asset budget.
- [x] Map geometry contract hiện có được freeze bằng test/report.

## Success criteria

- Có thể so sánh trước/sau bằng cùng state, seed và viewport.
- Không có file ứng dụng bị sửa trong phase baseline.
- Mọi contract quan trọng có test hoặc checklist kiểm chứng.

## Risk assessment

- Baseline screenshot không deterministic nếu campaign state khác. Dùng fixed seed và fixture/storage state.
- PowerShell encoding có thể hiển thị mojibake. Đọc/ghi UTF-8 và kiểm tra trong browser.

## Security considerations

- Xác nhận production không phát sinh HTTP(S) request.
- Không ghi localStorage/campaign save nhạy cảm vào report ngoài fixture đã kiểm soát.

## Next steps

Mở P2 sau khi baseline report được duyệt và source tests xanh.
