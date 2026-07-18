# Phase 05 - Trạng thái và accessibility

Ngày kiểm thử: 2026-07-18

## Quiz cuối lượt

- Nút tiếp tục được ẩn hoàn toàn trước khi chọn đáp án.
- Escape không đóng modal bắt buộc; các node nền nhận `inert` và focus được khôi phục sau khi hoàn tất.
- Tab từ lựa chọn cuối quay về lựa chọn đầu; review có icon, nhãn `Đáp án đúng`/`Bạn đã chọn`, `aria-label` và feedback bằng chữ.
- Save/reload khôi phục byte-identical tại review câu 10; kết quả thưởng/phạt hiển thị trước nút Hoàn tất lượt.
- Chạy đủ 10 câu qua UI tạo lượt 2, banner `Kết quả 3/10 · -3 lương thực · 1 hiệu ứng mới` và timeline hai sự kiện.
- Kết quả 3/10 dùng warning tone ở cả banner và timeline; kết quả trên 5 mới dùng success tone.

## Accessibility

- `prefers-reduced-motion: reduce` trả transition duration 0s cho map, sheet và resource toggle.
- Kiểm thử reflow tương đương 200% tại 720 CSS px không có horizontal overflow và không có control dưới 44px.
- Không có duplicate ID theo regression test; 34 target bản đồ có tên truy cập và inset có 0 focus target.
- Contrast đo từ token production:

| Cặp màu | Tỷ lệ |
|---|---:|
| Ink / canvas | 16.61:1 |
| Muted / surface | 8.64:1 |
| Success / success surface | 5.15:1 |
| Danger / danger surface | 4.78:1 |
| Ink / jade primary | 6.68:1 |
| Focus / canvas | 11.98:1 |

## Battle state

- Một battle thật được tạo qua chuỗi cảnh báo hợp lệ của engine ở lượt 4-6.
- Panel hiển thị quân ta/quân địch/tổn thất; ba `role="progressbar"` công bố Tinh thần 93%, Tiếp tế 96% và Phá vỡ công sự 50%.
- `Tổng công kích` bị khóa có tooltip và `aria-label` nêu rõ lý do; các tactic còn lại và lệnh viện binh vẫn thao tác được.
- Banner thưởng không còn đẩy workspace/dock ra ngoài viewport desktop.

## Failure paths

- Corrupt campaign JSON: app không crash, setup còn dùng được và hiện `Bản lưu bị hỏng và không thể đọc.`
- `localStorage.setItem` ném `QuotaExceededError`: chiến dịch vẫn chơi được và hiện `Không thể lưu chiến dịch trên trình duyệt này.`
- Offline mode: 504 câu, 32 symbol, 34 target và 2 inset tải từ một file; 0 request HTTP(S).
- Console và page error rỗng trên các session desktop, mobile, corrupt-storage và offline.

## Ảnh kiểm chứng

- [Quiz mobile](./phase-05-game-quiz-390x844.png)
- [Review đáp án](./phase-05-game-quiz-review-390x844.png)
- [Kết quả cuối quiz](./phase-05-game-quiz-result-bottom-390x844.png)
- [Báo cáo lượt mobile](./phase-05-game-report-mobile-390x844.png)
- [Mặt trận đang hoạt động](./phase-05-battle-active-1440x900.png)
- [Reflow tương đương 200%](./phase-05-study-200-percent-equivalent.png)

## Kết luận

Không còn lỗi accessibility mức nghiêm trọng được phát hiện trong phạm vi kiểm thử tự động và browser smoke.
