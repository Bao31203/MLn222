# Phase 06: Release verification và tài liệu

## Context links

- [Kế hoạch tổng](./plan.md)
- [Phase 05](./phase-05-states-accessibility-polish.md)
- [Build pipeline](../../build_html.py)
- [Python regression](../../test_pipeline.py)
- [Game test suite](../../tests/game)
- [README](../../README.md)

## Overview

| Field | Value |
|---|---|
| Priority | P1 |
| Status | Completed |
| Effort | 6h |
| Depends on | Phase 05 |

Đóng gói và kiểm định toàn bộ redesign. Phase này không chứa feature work. Defect quay lại phase sở hữu; chỉ cập nhật test/report/docs và generated artifact sau khi source pass.

## Key insights

- Baseline production trước redesign: 1,379,258 bytes, SHA-256 `5EC1EC5FF9F68AF9FD9EAD0C63CD89B400234F7CFFC23985764BFC1F7CF0FD34`.
- Baseline test: 130 Node và 33 Python tests pass; validator có 504 câu, 0 lỗi/cảnh báo.
- Campaign balance/combat đã được kiểm định; UI redesign không cần retune nhưng simulation vẫn là regression guard.
- `test_pipeline.py` kiểm tra isolated build byte-identical với production.
- Browser QA phải dùng artifact `index.html` qua `file://`, không chỉ `template.html`.

## Requirements

### Automated

- Question validator, game-data validator, Node tests, Python tests pass.
- Economy/combat/campaign simulations giữ invariant và production gates.
- Build isolated byte-equivalent với checked production artifact.
- No-network/inline-safety assertions pass.
- Source diff không có thay đổi behavior ngoài UI/test/build/docs đã duyệt.

### Browser

- Kiểm đủ 1440x900, 1024x768, 390x844, 360x800 và landscape mobile smoke.
- Mỗi viewport có study, game setup, campaign, bottom sheet/panel và turn quiz states.
- Console không error; network không external request; offline reload hoạt động.
- Không blank canvas, clipped map, overlap, horizontal overflow hoặc text outside controls.
- Keyboard, touch emulation, save/resume/corrupt-save/no-storage paths pass.

### Documentation

- README mô tả UI mới, cách build/test và giữ offline contract.
- Báo cáo cuối ghi test counts, artifact size/hash, screenshot paths và residual risks.
- Plan/phase status chỉ đổi completed sau khi evidence tồn tại.

## Architecture

```text
validated source
  -> question/game-data validators
  -> Node + Python regression
  -> economy/combat/campaign simulations
  -> deterministic build_html.py
  -> file:// browser viewport/state matrix
  -> artifact hash + final report
```

- Source files are authoritative; `index.html` is generated only after upstream gates pass.
- Browser checks run against final production artifact, never a partial template preview.
- A failed gate routes back to the owning phase and reruns downstream gates after correction.
- Release evidence stays under this plan's `reports/`; no screenshots are added to source asset folders.
- No feature or balance tuning is accepted inside release verification.

## Related code files

| Action | Absolute path | Change |
|---|---|---|
| Modify | `C:\Users\pgb31\mln222-quiz\test_pipeline.py` | Chỉ bổ sung release assertions còn thiếu |
| Modify | `C:\Users\pgb31\mln222-quiz\tests\game\build-assets.test.cjs` | Final inline/offline/UI asset contract if missing |
| Modify | `C:\Users\pgb31\mln222-quiz\README.md` | Updated UI, build and test documentation |
| Generate | `C:\Users\pgb31\mln222-quiz\index.html` | Final deterministic production artifact |
| Create | `C:\Users\pgb31\mln222-quiz\plans\260718-1223-modern-vietnamese-ui-redesign\reports\end-to-end-testing.md` | Final release evidence |
| Create | `C:\Users\pgb31\mln222-quiz\plans\260718-1223-modern-vietnamese-ui-redesign\reports\ui-*.png` | Required viewport/state screenshots |

## Implementation steps

1. Review `git diff --stat` and detailed diff; confirm no accidental engine/data/save changes.
2. Run question and game-data validators.
3. Run full Node and Python test suites; record counts and timing.
4. Run economy 100,000 transitions, combat 10,000 runs and campaign 1,000 runs as regression gates.
5. Build production twice from unchanged source; verify deterministic bytes/hash.
6. Record artifact bytes, hash and compare against approximately 2 MB budget.
7. Open final `index.html` via `file://` with agent-browser; enable offline mode.
8. Execute study workflow: filters, answer/review, flashcard reveal, search, reload/storage.
9. Execute campaign workflow: setup, map selection, recruit/diplomacy, warning, battle, report, end-turn quiz, save/resume.
10. Repeat representative states at every required viewport; inspect console/network and capture screenshots.
11. Run keyboard-only and reduced-motion smoke; inspect accessibility snapshot.
12. Test corrupt campaign save, corrupt UI sidecar and unavailable storage fallback.
13. Fix failures in owning phase, rerun affected plus full suites.
14. Update README and final report; mark plan completed only after all gates pass.

## Todo list

- [x] Audit final source diff and ownership boundaries.
- [x] Run validators and automated suites.
- [x] Run economy/combat/campaign simulations.
- [x] Verify deterministic production build.
- [x] Record artifact size and SHA-256.
- [x] Run full study browser workflow.
- [x] Run full campaign browser workflow.
- [x] Complete viewport screenshot matrix.
- [x] Verify offline, console, network and storage failure paths.
- [x] Complete keyboard/reduced-motion/accessibility smoke.
- [x] Update README and final report.
- [x] Mark phase/plan complete only with evidence.

## Success criteria

- Question validator: 504 questions, 0 errors, 0 warnings.
- All Node and Python tests pass; final counts documented.
- Economy/combat/campaign regression commands pass without invariant failure.
- Final build is deterministic and opens via `file://` with zero external requests.
- Artifact meets approximately 2 MB budget or has a documented, approved exception.
- Required viewport/state screenshots show no blank, clipping, overlap or horizontal overflow.
- Save/resume and quiz review are state-identical across reload.
- No high-severity accessibility issue or console error remains.
- README and report match actual commands/results.

## Verification commands

```powershell
python validate_questions.py
node scripts/validate-game-data.js
node --test tests/game/*.test.cjs
python -m unittest -v test_pipeline.py
node scripts/simulate-economy.js --runs 100000 --assert
node scripts/simulate-combat.js --runs 10000 --assert --config game/data/balance.json
node scripts/simulate-campaign.js --runs 1000 --turns 60 --assert
python build_html.py
Get-FileHash .\index.html -Algorithm SHA256
```

## Risk assessment

| Risk | Mitigation |
|---|---|
| Visual test passes one state only | Fixed viewport x state matrix and longest-content cases |
| Generated artifact masks dirty source | Build twice, inspect source diff, byte-equivalence test |
| UI change appears to affect balance | Compare simulation metrics; investigate before retuning anything |
| Browser automation leaves Chrome windows/processes | Headless named session; always close session after evidence capture |
| Release phase accumulates feature fixes | Route each failure to owning phase and rerun full gates |

## Security considerations

- Verify no external URL/request, active SVG element, unsafe inline closing sequence or new storage key.
- Exercise malformed/corrupt storage and no-storage fallback.
- Confirm dynamic question/search/game text still uses escaped text or safe DOM construction.

## Next steps

All evidence passed. Phase and plan status are `completed`; the final `index.html`, release report and implementation journal are ready for handoff.
