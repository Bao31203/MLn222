# Kiểm thử đầu cuối - Modern Vietnamese UI redesign

Ngày: 2026-07-18  
Trạng thái: **Hoàn tất - tất cả release gate đều PASS**

## Phạm vi

Kiểm thử production artifact `index.html` được sinh từ `template.html`, ngân hàng 504 câu và toàn bộ asset game nội tuyến. Browser QA chạy bằng Chromium qua `file://`, không dùng dev server.

## Automated gates

| Gate | Kết quả |
|---|---|
| `python validate_questions.py` | PASS - 504 câu, 0 lỗi, 0 cảnh báo |
| `node scripts/validate-game-data.js` | PASS - 34 tỉnh, 6 vùng, 44 nhóm SVG, 58 cạnh |
| `node --test --test-concurrency=1 tests/game/*.test.cjs` | PASS - 133/133, 31.91s |
| `python -m unittest -v test_pipeline.py` | PASS - 35/35, 53.35s |
| Economy `--runs 100000 --assert` | PASS - 100.000 transitions, 0 invariant failure, 11.02s |
| Combat `--runs 10000 --assert` | PASS - median 4, p95 6, conservation failure 0, 8.64s |
| Campaign `--runs 1000 --turns 60 --assert` | PASS - 1.000 campaign, standard win rate 83,83%, median thắng lượt 52, p95 turn 66,20ms |

Campaign assertion được chạy lại trực tiếp trên [log đầy đủ](./campaign-simulation-1000.stdout.json): 0 invalid action, 0 invariant failure, 0 trận trước lượt 4 và 0 battle thiếu cảnh báo. Mô phỏng hoàn tất trong 2.264,91 giây; stderr rỗng.

## Deterministic artifact

- Build 1 SHA-256: `ACF286E8A367E96D650BFE5E45655B230E1F09D8E5F023603CAC142F878F8EC4`
- Build 2 SHA-256: `ACF286E8A367E96D650BFE5E45655B230E1F09D8E5F023603CAC142F878F8EC4`
- Kích thước: `1.452.674` bytes, dưới budget xấp xỉ 2 MB.
- Hai lần build liên tiếp cho byte-identical output; isolated pipeline test xác nhận artifact khớp source hiện tại.

## Browser matrix

| Viewport/state | Kết quả | Evidence |
|---|---|---|
| Study 1440x900 | PASS | [quiz](./phase-02-quiz-1440x900.png), [search](./phase-02-search-1440x900.png) |
| Game setup/campaign 1440x900 | PASS | [setup](./phase-03-game-setup-1440x900.png), [campaign](./phase-03-game-campaign-1440x900.png) |
| Game campaign 1024x768 | PASS | [ảnh](./phase-03-game-campaign-1024x768.png) |
| Study/game 390x844 | PASS | [study](./phase-02-quiz-390x844-viewport.png), [game](./phase-04-game-campaign-collapsed-390x844.png) |
| Game 360x800 | PASS | [ảnh](./phase-04-game-campaign-360x800.png) |
| Landscape 844x390 | PASS | [ảnh](./phase-04-game-landscape-844x390.png) |
| Keyboard-height 390x500 | PASS | [ảnh](./phase-04-game-keyboard-390x500.png) |
| End-turn quiz/review/result | PASS | [quiz](./phase-05-game-quiz-390x844.png), [result](./phase-05-game-quiz-result-bottom-390x844.png) |
| Active battle 1440x900 | PASS | [ảnh](./phase-05-battle-active-1440x900.png) |
| Map zoom 1440x900 / 390x844 | PASS | [desktop](./map-zoom-default-1440x900.png), [mobile](./map-zoom-default-390x844.png) |

Các viewport trên không có horizontal overflow, blank map/canvas, text thoát control hoặc button nhìn thấy dưới 44px. Desktop 1440 có map viewport 1000x567px; mobile 390 có map 390x405px và sheet thu gọn 390x159px.

## Workflow evidence

- Study: filter, answer/review, flashcard reveal không cộng điểm, search cố định và safe highlight.
- Map: 34 keyboard target, 44 source groups, 2 inset, 0 inset focus target; mặc định 110%, zoom 100-300%, Fit/Focus, nút, con lăn theo con trỏ, phím `+/-/0`, kéo, pinch, tooltip và Enter selection pass.
- Campaign: setup, province/diplomacy/battle/report tabs, resource disclosure, sheet collapsed/expanded và responsive dock pass; battle thật hiển thị morale/supply/breach và disabled tactic reason.
- Quiz: Escape bị chặn, focus trap pass, save/reload tại câu 10 pass, hoàn tất 10 câu tạo lượt 2 và report timeline.
- Storage: normal resume, corrupt JSON và `QuotaExceededError` đều có thông báo tiếng Việt và không làm mất khả năng chơi.
- Offline: 0 HTTP(S) resource, 504 câu, 32 icon symbol, 34 target và 2 inset vẫn hoạt động.
- Reduced motion: transition duration bằng 0s cho map/sheet/resource toggle.
- Contrast thấp nhất trong các cặp production đã đo là danger/danger-surface `4.78:1`.
- Console/page errors: rỗng trên desktop, mobile, storage-failure và offline session.
- Final artifact smoke: offline reload pass với 504 câu, 32 icon, 44 nhóm SVG, 34 keyboard target, 2 inset, 0 inset focusable và 0 horizontal overflow.

## Source review

- Không thay đổi `game/core`, `game/engine`, `game/data`, balance hoặc save schema trong redesign UI.
- UI state sheet/resource được giữ trong `game-app.js`, không serialize vào campaign save.
- Resource delta chỉ đọc `QUIZ_REWARD_APPLIED` từ report event; UI không tính lại công thức engine.
- Dynamic study/game content mới dùng `textContent`, `createTextNode` hoặc helper DOM; inline/network validators pass.
- Lucide/Feather attribution nằm trong `docs/third-party-notices.md` và comment nội tuyến production.

## Residual risk

- Browser QA là screenshot/smoke, chưa có pixel-diff CI tự động.
- Native page zoom được kiểm bằng viewport 720 CSS px tương đương 1440 ở 200%; không có automation điều khiển menu zoom Chrome.
- Simulation chiến dịch 1.000 run mất khoảng 37 phút 45 giây trên máy hiện tại, phù hợp làm release gate nhưng chưa phù hợp chạy sau từng thay đổi nhỏ.
