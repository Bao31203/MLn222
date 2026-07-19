---
title: "Plan validation - Hybrid UI command wheel"
date: 2026-07-19
type: plan-validation
status: passed
---

# Plan validation - Hybrid UI command wheel

## Decisions confirmed

| Decision | Resolution | Source |
|---|---|---|
| Visual direction | Study sáng + game tối | User approved option 1 |
| Restructure depth | Đại tu layout/interaction, giữ engine | User request + approved design |
| Foreign faction interaction | Right-click radial + contextual action sheet | User approved recommendation |
| Platform | Desktop và mobile có renderer riêng | Approved recommended direction |
| Runtime | Single-file offline, no CDN/backend | Existing product contract |
| OpenFront usage | Interaction inspiration only; no source/assets copied | Approved recommendation |
| Rules source | Exact enabled actions from `controller.legalActions()` | Architecture guardrail |

## Assumptions validated by codebase

- `map-view.js` đã có pointer/keyboard/zoom state và là đúng integration point.
- `game-controller.js` đã có `legalActions()`, `stageAction()` và pending action validation.
- `game-app.js` là coordinator cho panel/sheet/resource/quiz.
- Manifest/build pipeline có thể nhúng module JS mới và test module order.
- Context menu state không cần campaign save schema mới.

## Required gates

- P2, P3, P4, P5 và P7 có visual checkpoint.
- P5 phải có action parity tests và list-menu fallback trước khi mở P6.
- P9 phải test production artifact bằng mouse, keyboard và touch path.
- Không phase nào được đổi engine/data/save schema mà không dừng và lập plan bổ sung.

## Result

PASS. Kế hoạch có thể triển khai tuần tự. Không còn quyết định người dùng bắt buộc chưa chốt.
