---
title: "Trien khai che do Cong thanh hoc tap"
description: "Xay dung game chien luoc 34 tinh tich hop quiz MLN222, van hanh offline va co mo phong can bang dinh luong."
status: completed
priority: P1
effort: 102h
branch: main
tags: [feature, frontend, game, experimental]
created: 2026-07-17
---

# Kế hoạch triển khai chế độ Công thành học tập

## Overview

Triển khai chế độ game chiến lược theo lượt trên bản đồ 34 tỉnh/thành, dùng ngân hàng 504 câu MLN222 làm cơ chế thưởng/phạt cuối lượt. Giữ website là một `index.html` độc lập, không backend, không framework mới. Engine JavaScript thuần, deterministic, kiểm thử được bằng Node; Python tiếp tục chịu trách nhiệm validate và đóng gói bản production.

Thiết kế nguồn: [báo cáo brainstorm](../reports/260717-2035-conquest-learning-game-design.md).

## Architecture

JavaScript thuần chia `core/data/engine/quiz/storage/ui`; Node chạy unit/simulation không DOM. Python đọc manifest và nhúng JSON, SVG, CSS, JS vào `template.html` để tạo một `index.html` offline.

## Phases

| # | Phase | Status | Effort | Depends on | Link |
|---:|---|---|---:|---|---|
| 1 | Deterministic foundation | Completed | 8h | - | [phase-01](./phase-01-deterministic-foundation.md) |
| 2 | Map and province data | Completed | 8h | 1 | [phase-02](./phase-02-map-province-data.md) |
| 3 | Economy and population engine | Completed | 10h | 1 | [phase-03](./phase-03-economy-population-engine.md) |
| 4 | Multi-turn combat engine | Completed | 14h | 1 | [phase-04](./phase-04-multi-turn-combat-engine.md) |
| 5 | Quiz scheduler and persistence | Completed | 10h | 1 | [phase-05](./phase-05-quiz-persistence.md) |
| 6 | Headless vertical slice | Completed | 10h | 2, 3, 4, 5 | [phase-06](./phase-06-headless-vertical-slice.md) |
| 7 | Diplomacy, full NPC campaign and balance | Completed | 16h | 6 | [phase-07](./phase-07-full-campaign-ai-balance.md) |
| 8 | Full map UI and production build | Completed | 18h | 7 | [phase-08](./phase-08-map-ui-production-build.md) |
| 9 | Release verification and documentation | Completed | 8h | 8 | [phase-09](./phase-09-release-verification.md) |

## Dependency graph

```text
P1 -> [P2 || P3 || P4 || P5] -> P6 -> P7 -> P8 -> P9
```

- Nhóm song song A: pha 2-5, chỉ dùng contract từ pha 1.
- Không mở rộng 33 NPC hoặc UI hoàn chỉnh nếu vertical slice chưa qua gate.
- `index.html` luôn là file sinh tự động, không có owner chỉnh tay.

## File ownership

Mỗi file nguồn chỉ có một phase owner: P1 core/contracts; P2 data/SVG; P3 economy; P4 combat; P5 quiz/storage; P6 scenario/API; P7 diplomacy/AI/campaign/balance; P8 UI/build/template/regression; P9 docs/reports. `index.html` chỉ được sinh tự động.

## Global gates

- Không dùng `Math.random`, DOM, `Date.now` hoặc `localStorage` trong core/engine.
- `C >= 0`, `A >= 0`, `C + A <= K`; tài nguyên và quân số không âm/NaN.
- Trận cân sức trung vị 5-7 lượt; tỷ lệ 2:1 trung vị 3-5 lượt; 95% kết thúc trước lượt 10.
- Scheduler luôn tạo 10 câu và ưu tiên không lặp trước tỷ lệ độ khó.
- 1.000 campaign 60 lượt không có action/state bất hợp lệ; p95 một lượt 34 thế lực dưới 100 ms.
- Save/resume giữ nguyên state, RNG, quiz và battle.
- Production mở bằng `file://`, không request mạng, không lỗi console hoặc hồi quy ba chế độ cũ.

## Verification commands

```powershell
node --test tests/game/*.test.cjs
node scripts/simulate-combat.js --runs 10000 --assert
node scripts/simulate-campaign.js --runs 1000 --turns 60 --assert
python -m unittest -v test_pipeline.py
python build_html.py
```

## Completion evidence

- [Báo cáo cân bằng](./reports/balance-validation.md)
- [Báo cáo kiểm thử đầu cuối](./reports/end-to-end-testing.md)
- [Metrics 1.000 chiến dịch](./reports/campaign-metrics.json)

## Non-goals

Không multiplayer, backend, tài khoản, đồng bộ cloud, công trình từng tỉnh, tướng lĩnh, hải chiến, tuyến vận tải chi tiết hoặc chiến dịch theo một triều đại trong MVP.

## Completion rule

Chỉ chuyển `status: completed` khi toàn bộ 9 phase hoàn tất, mọi gate định lượng đạt và báo cáo browser desktop/mobile đã được lưu. Khi một gate thất bại, quay lại phase sở hữu file liên quan; không vá constants trong phase release.
