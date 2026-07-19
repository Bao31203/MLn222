# Kiểm thử đầu cuối - Hybrid UI và vòng lệnh Công thành

Ngày: 2026-07-19  
Trạng thái: **Hoàn tất - tất cả release gate đều PASS**

## Phạm vi

Kiểm thử production `index.html` sinh từ source hiện tại, chạy trực tiếp qua `file://`. Phạm vi bao gồm ba workspace học, setup/campaign, bản đồ 34 tỉnh, vòng lệnh theo ngữ cảnh, khay lệnh, save/resume và quiz 10 câu cuối lượt.

## Automated gates

| Gate | Kết quả |
|---|---|
| `python validate_questions.py` | PASS - 504 câu, 0 lỗi, 0 cảnh báo |
| `node scripts/validate-game-data.js` | PASS - 34 tỉnh, 6 vùng, 44 nhóm SVG, 58 cạnh, 5 binh chủng |
| `node --test --test-concurrency=1 tests/game/*.test.cjs` | PASS - 137/137, 18,31s |
| `python -m unittest -v test_pipeline.py` | PASS - 35/35, 34,52s |
| `git diff --check` | PASS |

Node suite bao gồm 100.000 economy transitions, campaign smoke, combat invariants, save/resume, controller sidecar và ba test action parity mới.

## Deterministic artifact

- Build 1 SHA-256: `A41326FFEC7C113FC06219DBC1867276AC814FDD0D433D28A84F6D6DD02C43E5`
- Build 2 SHA-256: `A41326FFEC7C113FC06219DBC1867276AC814FDD0D433D28A84F6D6DD02C43E5`
- Kích thước: `1.795.979` byte, dưới budget `2.359.296` byte.
- Hai lần build liên tiếp byte-identical; Python test xác nhận `index.html` khớp source, manifest và ngân hàng hiện tại.

## Browser matrix

| Viewport/state | Kết quả | Evidence |
|---|---|---|
| Study shell 1440x900 | PASS | [ảnh](./phase-02-study-shell-1440x900.png) |
| Flashcard/search 1440x900 | PASS | [flashcard](./phase-03-flashcard-revealed-1440x900.png), [search](./phase-03-search-results-1440x900.png) |
| Tactical campaign 1440x900 | PASS | [ảnh](./phase-04-tactical-map-1440x900.png) |
| Command wheel 1440x900 | PASS | [wheel](./phase-05-command-wheel-1440x900.png), [disabled reason](./phase-05-disabled-reason-1440x900.png) |
| Staged route/order tray 1440x900 | PASS | [route](./phase-05-staged-trade-route-1440x900.png), [tray](./phase-06-order-tray-1440x900.png) |
| Game/action palette 390x844 | PASS | [game](./phase-07-mobile-game-390x844.png), [palette](./phase-07-mobile-action-palette-390x844.png) |
| Quiz review desktop/mobile | PASS | [desktop](./phase-08-quiz-review-1440x900.png), [mobile](./phase-08-quiz-review-390x844.png) |
| Full lifecycle tới lượt 2 | PASS | [ảnh](./phase-09-e2e-turn-2-1440x900.png) |
| Landscape 844x390 | PASS | [ảnh](./phase-09-landscape-844x390.png) |

Các viewport 1440x900, 820x900, 390x844, 360x800 và 844x390 không có horizontal overflow. Tại landscape 844x390, game root dừng ở `324px`, map stage dừng ở `323px` và không còn tràn vào bottom navigation.

## Interaction matrix

- Chuột phải trên tỉnh NPC mở wheel bốn nhóm; click trái, kéo map, wheel zoom và nút zoom vẫn hoạt động độc lập.
- `Context Menu`/`Shift+F10` mở menu từ keyboard target; phím mũi tên đổi nhóm, Enter mở sheet, Escape quay lại/đóng và focus trở về tỉnh.
- Mobile có nút `Hành động`; long press 520ms mở cùng model với source `touch` mà không stage lệnh ngoài ý muốn.
- 50 chu kỳ mở/đóng menu liên tiếp pass, không nhân listener, không page/console error.
- Menu đóng khi click ngoài, pan, zoom, resize, đổi mode hoặc bắt đầu quiz.
- Nhóm không khả dụng vẫn mở được phần giải thích; nút xác nhận chỉ bật sau khi người chơi chọn một exact action.

## Action integrity

- Context UI không gọi engine legality riêng; exact options chỉ là clone từ `controller.legalActions()`.
- Trade từ Lai Châu tới thế lực Lào Cai được so sánh byte-for-byte với legal action trước khi stage.
- Stage trade làm AP `2/2 -> 1/2`, tạo chip và route; hủy riêng lệnh trả AP về `2/2` và xóa route.
- `removePendingAction(index)` revalidate phần lệnh còn lại trước khi persist; test controller mới pass.
- Không thay đổi `game/core`, `game/engine`, `game/data`, `game/quiz`, save schema hoặc storage key.

## End-to-end lifecycle

Workflow production đã chạy qua Luyện thi, lật Flashcard, Tìm kiếm, mở Công thành, stage trade, reload offline, tiếp tục campaign với pending order, hủy lệnh, trả lời đúng 10 câu và sang lượt 2. Reload chỉ yêu cầu chính `file:///.../index.html`; không có HTTP(S) request, console error, page error hoặc mất state.

Quiz overlay phủ đúng viewport desktop/mobile, đặt background ở trạng thái inert, chuyển focus tới câu hỏi/feedback và phục hồi focus khi đóng. Trạng thái đúng/sai dùng icon, chữ và màu; reduced motion contract vẫn pass.

## Residual risk

- Browser QA có DOM geometry assertions và screenshot evidence nhưng chưa dùng pixel-diff CI.
- Long press được kiểm bằng Chromium touch emulation; hành vi gesture cấp hệ điều hành vẫn có thể khác nhẹ giữa thiết bị thật.

