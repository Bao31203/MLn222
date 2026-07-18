# Phase 02 - Map and province data

## Context links

- [Plan overview](./plan.md)
- [Approved design](../reports/260717-2035-conquest-learning-game-design.md)
- Source map: `https://fptlichsuviet.io.vn/map/index.html`

## Overview

- Priority: P1
- Status: Completed
- Effort: 8h
- Dependencies: Phase 01
- Parallel group: A
- Goal: tạo dữ liệu 34 lãnh thổ và SVG cục bộ đã được kiểm định, độc lập với engine và UI.

## Key insights

- SVG có 44 `data-p`: 34 tỉnh/thành và 10 nhóm đảo.
- Đảo dùng chung owner/state/màu với tỉnh chủ quản, không tham gia adjacency riêng.
- Dữ liệu dân số thật chỉ dùng làm lore; gameplay dùng tier chuẩn hóa để mọi tỉnh khởi đầu có giá trị hợp lý.
- Adjacency là dữ liệu gameplay thủ công, không suy luận từ khoảng cách tâm tỉnh.

## Requirements

- Đúng 34 province record, sáu vùng và 44 SVG mappings.
- Mỗi mainland province có một entry `neighbors` trong `adjacency.json`, cùng trait, capacity tier, terrain và display metadata trong `provinces.json`.
- Adjacency đối xứng, liên thông, không self-edge và chỉ tham chiếu ID tồn tại.
- Mỗi nhóm đảo ánh xạ đúng một province owner.
- SVG không chứa script, event handler, `foreignObject` hoặc resource ngoài.
- Chênh lệch tổng modifier khởi đầu giữa tỉnh thấp nhất/cao nhất không quá 20% trước chiến thuật.

## Architecture

```text
provinces.json  <- stable province IDs and SVG group list
adjacency.json  <- province ID graph
units.json      <- unit definitions independent from balance numbers
vietnam-map.svg <- sanitized geometry only
validator       <- schema + graph + SVG mapping checks
```

Engine nhận data qua dependency injection; không fetch JSON ở runtime.

## Related code files

Create:

- `C:\Users\pgb31\mln222-quiz\game\data\provinces.json`
- `C:\Users\pgb31\mln222-quiz\game\data\adjacency.json`
- `C:\Users\pgb31\mln222-quiz\game\data\units.json`
- `C:\Users\pgb31\mln222-quiz\game\assets\vietnam-map.svg`
- `C:\Users\pgb31\mln222-quiz\scripts\validate-game-data.js`
- `C:\Users\pgb31\mln222-quiz\tests\game\map-data.test.cjs`

No Phase 01 or existing production file modified.

## Implementation steps

1. Export SVG source and retain `viewBox`, `g.province[data-p]` and path geometry needed for zoom/click.
2. Strip style/script/external-reference content not needed by game.
3. Assign stable ASCII province IDs; keep Vietnamese display names separately.
4. Map all island slugs to their managing province.
5. Hand-author adjacency from current 34-province boundaries; review every edge in both directions.
6. Assign six regions and one balanced trait package per province.
7. Define unit IDs and semantic roles; leave tunable coefficients for Phase 07 balance data.
8. Implement validator for counts, uniqueness, referential integrity, graph connectivity, symmetry and SVG coverage.
9. Add negative mutation tests: missing island, asymmetric edge, duplicate slug, external SVG href and invalid trait.
10. Produce a short validation report during implementation.

## Todo

- [x] Sanitize and store local SVG
- [x] Author 34 province records
- [x] Map all 44 SVG groups
- [x] Author and review adjacency graph
- [x] Define semantic unit records
- [x] Implement validator and mutation tests

## Success criteria

- Validator reports 34 playable territories, 44 mapped SVG groups and zero errors.
- Graph is connected, symmetric and has no self-edge.
- All islands inherit province ownership through data, not duplicated state.
- SVG renders without network request in a simple offline fixture.
- Starting modifier spread is at most 20%.

## Risk assessment

- Risk: incorrect merged-province adjacency. Mitigation: visual review plus symmetric graph tests.
- Risk: hidden external SVG dependencies. Mitigation: deny external href/style URL and verify offline.
- Risk: real-world statistics dominate balance. Mitigation: separate lore fields from normalized gameplay tiers.

## Security considerations

- Treat imported SVG as untrusted at build time even though user owns the source.
- Deny scripts, inline event handlers, `foreignObject`, external URLs and unsafe XML declarations.

## Next steps

Data becomes an input to Phase 06 vertical slice and Phase 08 map UI.
