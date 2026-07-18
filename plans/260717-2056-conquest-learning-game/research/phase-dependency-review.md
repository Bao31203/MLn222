---
date: 2026-07-17
type: research
status: completed
topic: phase-dependencies-and-gates
---

# Review pha, phụ thuộc và acceptance gates

## Summary

Review độc lập xác nhận vertical slice phải nằm sau contract/engine/quiz/save nhưng trước full NPC và production UI. Kế hoạch nên có chín pha và hai nhóm song song có file ownership tách biệt.

## Findings

- Deterministic spine phải khóa seed, RNG streams, action contract và save replay trước mọi module.
- Dữ liệu bản đồ, kinh tế, chiến đấu và quiz/save có thể chạy song song sau contract.
- Combat gate cần 10.000 trận; campaign gate cần 1.000 chiến dịch 60 lượt.
- Full 33 NPC và UI có thể chạy song song sau vertical-slice API.
- `template.html`, `build_html.py` và integration build cần một owner duy nhất.
- `index.html` là generated artifact, không chỉnh tay.
- Tỷ lệ quiz tuyệt đối 4/4/2 mâu thuẫn no-repeat sau 48 lượt vì chỉ có 96 câu Vận dụng.

## Recommendation adopted

Scheduler priority:

1. Đúng 10 câu.
2. Không lặp trước khi hết 504 câu.
3. Tiệm cận quota độ khó theo debt.
4. Cân bằng chương khi inventory cho phép.

Critical path: `P1 -> P4/P5 -> P6 -> P7/P8 -> P9`.

## Unresolved questions

Không có câu hỏi chặn. Constants production chỉ được khóa sau simulation.
