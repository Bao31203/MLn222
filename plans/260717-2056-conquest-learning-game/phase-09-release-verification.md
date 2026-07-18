# Phase 09 - Release verification and documentation

## Context links

- [Plan overview](./plan.md)
- [Phase 07 production campaign](./phase-07-full-campaign-ai-balance.md)
- [Phase 08 production UI/build](./phase-08-map-ui-production-build.md)
- Existing test suite: `C:\Users\pgb31\mln222-quiz\test_pipeline.py`

## Overview

- Priority: P1
- Status: Completed
- Effort: 8h
- Dependencies: Phase 08
- Goal: tích hợp cuối, chứng minh mọi gate và bàn giao một `index.html` độc lập có báo cáo kiểm định.

## Key insights

- Đây là verification phase, không phải nơi chỉnh nhanh balance hoặc engine.
- Nếu gate thất bại, sửa tại phase/file owner rồi chạy lại toàn bộ ma trận.
- Phase 08 đã cập nhật build regression; pha này chỉ chạy lại và thu bằng chứng, không đổi test để hợp thức hóa kết quả.
- Browser test phải kiểm tra resume giữa quiz và battle, không chỉ trang mở được.

## Requirements

- Node unit/property tests, combat/campaign simulation, Python regression and isolated build all pass.
- Existing question bank remains exactly 504 and embedded byte-equivalent.
- Build from temporary directory produces byte-identical `index.html`.
- Browser desktop/mobile completes representative campaign flow without console error.
- Save corruption and storage-unavailable states fail safely.
- README documents mode, build, test, save key and offline behavior.
- Reports include exact commands, metrics, failures fixed and screenshots.

## Related code files

Modify:

- `C:\Users\pgb31\mln222-quiz\README.md`

Generate through build only:

- `C:\Users\pgb31\mln222-quiz\index.html`

Create reports/artifacts:

- `C:\Users\pgb31\mln222-quiz\plans\260717-2056-conquest-learning-game\reports\balance-validation.md`
- `C:\Users\pgb31\mln222-quiz\plans\260717-2056-conquest-learning-game\reports\end-to-end-testing.md`
- Desktop/mobile screenshots in the same report directory.

Do not tune `game/data/balance.json` directly in this phase.

## Implementation steps

1. Confirm Phase 08 regression covers full render, isolated `game/` copy, manifest and storage-key separation.
2. Run all Node tests and record count/duration.
3. Run 10.000 combat assertions using production balance; record duration distributions by force ratio.
4. Run 1.000 60-turn campaigns; record win-turn, early wins, stalls, errors and p95 turn time.
5. Run Python validation/build tests and compare isolated output byte-for-byte.
6. Browser-test create campaign, province selection, recruitment, trade, warning, multi-turn battle, quiz and resume.
7. Repeat browser checks at desktop and mobile; inspect horizontal overflow, control bounds, focus and console.
8. Test malformed save, future save version, unavailable localStorage and reload after each quiz answer.
9. Update README with commands and limitations.
10. Write validation reports and only then mark phase/plan completed.

## Todo

- [x] Extend Python regression and isolated build tests
- [x] Run complete Node test suite
- [x] Run production combat/campaign simulations
- [x] Run Python validator/build regression
- [x] Verify desktop and mobile workflows
- [x] Verify save failure/recovery cases
- [x] Update README
- [x] Publish reports and screenshots

## Success criteria

- Every global gate in `plan.md` passes with recorded evidence.
- `python -m unittest -v test_pipeline.py` and `node --test tests/game/*.test.cjs` exit 0.
- Simulators exit 0 in `--assert` mode with production config.
- Browser has zero page/console errors and zero horizontal overflow at target viewports.
- Save/resume restores identical visible and serialized state mid-quiz/mid-battle.
- Built HTML is offline, deterministic and contains all 504 original questions.
- README and two reports match actual commands/results.

## Risk assessment

- Risk: final UI exposes a core gate failure late. Mitigation: vertical slice plus parallel API contract; send defect to owning phase.
- Risk: generated HTML differs by newline/path order. Mitigation: manifest order, normalized UTF-8/newlines and byte comparison.
- Risk: browser automation misses dynamic states. Mitigation: inspect all province/control states and scripted campaign milestones.

## Security considerations

- Confirm no external resource request or executable save content.
- Fuzz JSON save and embedded question/map strings.
- Verify source rendering remains text-safe and SVG contains no active content.

## Next steps

After all evidence passes, update all checklist statuses, mark `plan.md` completed and write the implementation journal.
