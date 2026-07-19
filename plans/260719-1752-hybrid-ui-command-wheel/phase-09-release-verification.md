# Phase 09: Release verification

## Context links

- [Plan](./plan.md)
- [Phase 08](./phase-08-quiz-states-accessibility.md)
- [Release report trước](../260718-1223-modern-vietnamese-ui-redesign/reports/end-to-end-testing.md)

## Overview

- Priority: P1
- Status: Complete
- Effort: 7h
- Mục tiêu: kiểm chứng end-to-end, deterministic offline artifact và tài liệu bàn giao.

## Key insights

- UI overhaul chạm nhiều DOM contracts dù engine không đổi.
- Radial/gesture cần browser evidence, không thể chỉ dựa source tests.
- `index.html` phải byte-equivalent với build cuối cùng.

## Requirements

- Chạy validators, full Node/Python tests và campaign/gameplay smoke.
- Rebuild `index.html` hai lần; hash giống nhau.
- Browser matrix đủ study/game/setup/campaign/battle/context/quiz/report.
- Test mouse, right-click, keyboard context key, touch palette, long press, pan, pinch và zoom.
- Test manifest/module registration order và context list fallback trên production artifact.
- Offline reload, 0 runtime network, console/page errors rỗng.
- Cập nhật README, third-party note nếu cần và release report.

## Architecture

Verification chạy trên production `index.html` bằng `file://`, không chỉ template hoặc dev harness. Screenshot dùng fixed seed/state để dễ so sánh.

## Related files

- Modify: `C:\Users\pgb31\mln222-quiz\README.md`
- Modify: `C:\Users\pgb31\mln222-quiz\docs\third-party-notices.md` chỉ khi asset/library mới được thêm
- Modify: `C:\Users\pgb31\mln222-quiz\test_pipeline.py`
- Modify: `C:\Users\pgb31\mln222-quiz\tests\game\*.test.cjs`
- Generate: `C:\Users\pgb31\mln222-quiz\index.html`
- Create: `C:\Users\pgb31\mln222-quiz\plans\260719-1752-hybrid-ui-command-wheel\reports\end-to-end-testing.md`
- Create: `C:\Users\pgb31\mln222-quiz\plans\260719-1752-hybrid-ui-command-wheel\reports\release-*.png`
- Create: `C:\Users\pgb31\mln222-quiz\docs\journals\260719-hybrid-ui-command-wheel-implementation.md`

## Implementation steps

1. Run question validator, game data validator, full Node và Python suites.
2. Run targeted action parity and campaign save/resume tests.
3. Run campaign/combat smoke; full long simulation chỉ cần nếu engine/data diff xuất hiện.
4. Build hai lần, so SHA-256, size budget và source/artifact parity.
5. Browser QA desktop/tablet/mobile/landscape/200%-equivalent zoom.
6. Kiểm tra 50-cycle context open/close, listener duplication và interaction latency.
7. Chạy browser geometry assertions cho wheel sectors, controls, map bounds, panel/dock và safe areas.
8. Bật offline, reload saved campaign và hoàn tất một turn quiz.
9. Chụp evidence, ghi console/network/overflow/a11y results.
10. Cập nhật README, reports, journal; rà `git diff --check` và source ownership.

## Todo

- [x] Automated test gates pass.
- [x] Deterministic build và artifact budget pass.
- [x] Desktop/mobile browser matrix pass.
- [x] Right-click/keyboard/touch interaction matrix pass.
- [x] Offline/save/resume/quiz lifecycle pass.
- [x] Documentation và screenshots hoàn chỉnh.

## Success criteria

- Không action parity mismatch, console error, network request hoặc horizontal overflow.
- 504 câu hỏi và toàn bộ map targets hiện diện trong artifact.
- Hai build liên tiếp byte-identical.
- User workflows hoàn tất từ study tới campaign turn 2 bằng mouse, keyboard và touch path tương ứng.

## Risk assessment

- Screenshot-only có thể bỏ sót hitbox. Kết hợp box/DOM assertions và real pointer interactions.
- Browser automation không mô phỏng hoàn hảo native long press. Dùng pointer sequence và kiểm tra thêm trên viewport touch emulation.

## Security considerations

- Chạy inline-safety/network validator trên artifact.
- Kiểm tra không có external OpenFront asset/source hoặc accidental source map path.

## Next steps

Đánh dấu plan completed chỉ sau khi release report ghi toàn bộ gate PASS.
