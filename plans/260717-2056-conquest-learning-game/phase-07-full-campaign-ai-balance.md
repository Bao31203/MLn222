# Phase 07 - Diplomacy, full NPC campaign and balance

## Context links

- [Plan overview](./plan.md)
- [Campaign API contract phase](./phase-06-headless-vertical-slice.md)
- [Approved NPC/diplomacy design](../reports/260717-2035-conquest-learning-game-design.md#npc-model)

## Overview

- Priority: P1
- Status: Completed
- Effort: 16h
- Dependencies: Phase 06
- Goal: mở rộng vertical slice thành campaign 34 thế lực, khóa balance production bằng mô phỏng.

## Key insights

- 33 NPC không cần cây quyết định riêng; tất cả dùng action API và utility scorer giống nhau, khác personality/config.
- “Ngẫu nhiên bị tấn công” phải là weighted decision có cảnh báo, không phải coin flip bỏ qua quan hệ/sức mạnh.
- Balance file thuộc duy nhất pha này; các engine trước chỉ nhận config.
- Event filtering là yêu cầu gameplay và performance, không chỉ UI.

## Requirements

- Khởi tạo đúng một faction mỗi tỉnh, player thay owner của tỉnh được chọn.
- Bốn personality: cautious, trader, expansionist, defensive.
- Quan hệ, trade, non-aggression, alliance, betrayal penalties và route limits.
- Không khai chiến ba lượt đầu; chỉ tấn công kề; cảnh báo trước một lượt.
- Occupation ba lượt, wounded recovery, reinforcement, victory và defeat.
- Utility AI chỉ tạo action hợp lệ và giới hạn số active wars/fronts.
- Production balance config đạt combat/economy/campaign gates.
- 1.000 AI-only hoặc benchmark-player campaign 60 lượt chạy tự động.
- Một vùng được kiểm soát khi faction giữ hơn 50% điểm lãnh thổ có trọng số của vùng; thắng chuẩn cần ít nhất 60% điểm toàn quốc và kiểm soát bốn vùng.
- Player thất bại khi sở hữu zero province; các điều kiện phụ chỉ tạo crisis, không kết thúc mơ hồ.

## Architecture

```text
Campaign state -> query legal actions -> score by personality/context/RNG
               -> dispatch action through shared runtime
               -> resolve NPC batch in stable faction-ID order
               -> filter events by player relevance
```

NPC không được gọi engine private function hoặc sửa state trực tiếp.

## Related code files

Create:

- `C:\Users\pgb31\mln222-quiz\game\engine\diplomacy.js`
- `C:\Users\pgb31\mln222-quiz\game\engine\occupation.js`
- `C:\Users\pgb31\mln222-quiz\game\engine\npc-ai.js`
- `C:\Users\pgb31\mln222-quiz\game\engine\campaign.js`
- `C:\Users\pgb31\mln222-quiz\game\data\balance.json`
- `C:\Users\pgb31\mln222-quiz\game\data\npc-personalities.json`
- `C:\Users\pgb31\mln222-quiz\game\data\victory-rules.json`
- `C:\Users\pgb31\mln222-quiz\scripts\simulate-campaign.js`
- `C:\Users\pgb31\mln222-quiz\game\sim\benchmark-policies.js`
- `C:\Users\pgb31\mln222-quiz\tests\game\campaign-ai.test.cjs`

Do not modify engine files owned by Phases 03-05 or UI/build files owned by Phase 08.

## Implementation steps

1. Implement diplomacy relation transitions and treaty state machines.
2. Implement trade route capacity, coin flow and interruption by war/siege.
3. Implement alliance/non-aggression acceptance and betrayal consequences.
4. Implement occupation progression and production/recruitment restrictions.
5. Implement legal-action query from campaign state.
6. Implement utility components: survival, economy, threat, opportunity, treaty and personality.
7. Select NPC actions in stable order with dedicated AI RNG stream.
8. Implement one-turn attack warning as committed intent; cancel only for documented invalidation.
9. Implement active-front limits, victory score, regional control and defeat checks.
10. Create centralized production balance data for units, economy, combat, rewards and AI.
11. Run combat simulator with production balance and reject config outside Phase 04 gates.
12. Define at least three benchmark player policies and quiz-score profiles; keep evaluation seeds separate from tuning seeds.
13. Run 1.000 60-turn campaigns; collect win turn, province concentration, wars, stalls and action errors.
14. Tune only `balance.json`/personality/victory data until targets pass; do not patch engine formulas to chase a seed.
15. Emit machine-readable JSON metrics and a Markdown balance report.

## Todo

- [x] Implement diplomacy and trade state machines
- [x] Implement occupation and victory rules
- [x] Implement legal-action query and utility AI
- [x] Implement warning and front limits
- [x] Create production balance/personality data
- [x] Define benchmark policies and held-out seed partition
- [x] Run 10.000 combat regression with production config
- [x] Run and analyze 1.000 campaigns

## Success criteria

- No NPC war during turns 1-3.
- Every attack has a valid adjacent source and warning from the previous turn.
- No faction exceeds treaty, route or active-front limits.
- 1.000 campaigns contain no invalid action, negative state or uncaught exception.
- p95 simulation time for one 34-faction turn is under 100 ms on the reference machine.
- Benchmark player reaches standard victory at median turn 45-60; fewer than 5% wins occur before turn 30.
- Combat duration gates remain true with production balance.

## Risk assessment

- Risk: 33 NPC produce event noise. Mitigation: retain full audit log but expose prioritized player log.
- Risk: utility weights create deterministic monoculture. Mitigation: personality weights and bounded seeded variation.
- Risk: tuning overfits benchmark bot. Mitigation: use multiple bot policies and seed partitions.
- Risk: simulation is fast but UI stalls. Mitigation: stable batch APIs and Phase 09 browser timing.

## Security considerations

- AI actions pass the same validation as player actions.
- Config JSON validates ranges and rejects unknown IDs before campaign creation.

## Next steps

Phase 09 integrates production campaign metrics with Phase 08 browser build.
