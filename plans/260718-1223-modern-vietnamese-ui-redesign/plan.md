---
title: "Làm mới UI Sử Việt hiện đại"
description: "Đồng bộ bốn chế độ MLN222 và tái cấu trúc workspace Công thành, giữ nguyên engine và bản build HTML offline."
status: completed
priority: P1
effort: 56h
branch: main
tags: [refactor, frontend, accessibility]
created: 2026-07-18
---

# Kế hoạch làm mới UI Sử Việt hiện đại

## Overview

Triển khai phương án 2 đã duyệt: xây hệ thống thiết kế chung và tái cấu trúc UI vừa phải cho Luyện thi, Flashcard, Tìm kiếm và Công thành. Giữ nguyên 504 câu hỏi, engine, dữ liệu cân bằng, save schema và pipeline sinh một `index.html` chạy trực tiếp bằng `file://`.

Thiết kế nguồn: [báo cáo brainstorm đã duyệt](../reports/260718-1223-modern-vietnamese-ui-design.md).

## Architecture

- `template.html` tiếp tục sở hữu app shell, study markup/CSS và các placeholder build.
- `game/styles/game.css` chỉ style dưới `.game-root`/`body.game-mode`.
- `game/ui/*` chỉ derive presentation từ controller snapshot; không tính lại gameplay.
- `game/assets/vietnam-map.svg` giữ là nguồn bản đồ; `map-view.js` chịu trách nhiệm fit/inset.
- `build_html.py` tiếp tục validate và nhúng toàn bộ asset vào một file production.
- `index.html` là generated artifact; không chỉnh tay.

## Phases

| # | Phase | Status | Effort | Depends on | Link |
|---:|---|---|---:|---|---|
| 1 | Design foundation, baseline và app shell | Completed | 8h | - | [phase-01](./phase-01-design-foundation-app-shell.md) |
| 2 | Làm mới ba chế độ học | Completed | 10h | 1 | [phase-02](./phase-02-study-modes-redesign.md) |
| 3 | Workspace Công thành desktop và map fit | Completed | 14h | 1, 2 | [phase-03](./phase-03-game-desktop-map-workspace.md) |
| 4 | Công thành mobile và bottom sheet | Completed | 10h | 3 | [phase-04](./phase-04-game-mobile-interactions.md) |
| 5 | Trạng thái, quiz, accessibility và polish | Completed | 8h | 2, 3, 4 | [phase-05](./phase-05-states-accessibility-polish.md) |
| 6 | Release verification và tài liệu | Completed | 6h | 5 | [phase-06](./phase-06-release-verification.md) |

## Dependency graph

```text
P1 -> P2 -> P3 -> P4 -> P5 -> P6
```

Tuần tự vì `template.html` và CSS là bề mặt dùng chung. Không chạy song song các phase chạm cùng markup để tránh xung đột và visual drift.

## Global guardrails

- Không đổi hành vi trong `game/core`, `game/engine`, `game/quiz`, `game/storage` hoặc `game/data`.
- Không đổi storage keys/schema; UI-only state mới không đi vào campaign save.
- Không thêm framework, backend, CDN hoặc request mạng.
- Không hiển thị resource delta bằng cách tính lại công thức engine; chỉ dùng snapshot/report event.
- Giữ 34 target tỉnh bàn phím và 44 nhóm SVG đã validate, gồm 10 nhóm đảo.
- Control tối thiểu 44px; contrast WCAG AA; không hover-only; reduced motion hoạt động.
- 360x800, 390x844, 1024x768, 1440x900 không overflow hoặc overlap.
- Mục tiêu `index.html` dưới khoảng 2 MB; mọi asset mới phải qua inline-safety test.

## Visual checkpoints

1. Sau P1: duyệt app shell, palette, typography, icon, study/game density ở desktop và mobile.
2. Sau P3: duyệt map fit, resource HUD, right panel và action dock trước khi làm mobile sâu.

Không tiếp tục phase kế tiếp nếu checkpoint sai hướng thị giác hoặc phá usability cơ bản.

## Verification commands

```powershell
python validate_questions.py
node scripts/validate-game-data.js
node --test --test-concurrency=1 tests/game/*.test.cjs
python -m unittest -v test_pipeline.py
python build_html.py
```

Browser QA mở `file:///C:/Users/pgb31/mln222-quiz/index.html` bằng `agent-browser`, kiểm tra đủ ma trận viewport và offline mode.

## Completion rule

Chỉ chuyển `status: completed` khi sáu phase hoàn tất, hai checkpoint được duyệt, regression hiện có và test mới đều pass, browser report có đủ screenshot/console/network evidence, và generated `index.html` byte-equivalent với build kiểm chứng.
