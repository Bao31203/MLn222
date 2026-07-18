# Báo cáo kiểm thử đầu cuối chế độ Công thành

Ngày kiểm định: 2026-07-18

## Pipeline và regression

| Lệnh | Kết quả |
|---|---|
| `python validate_questions.py` | 504 câu, 0 lỗi, 0 cảnh báo |
| `node scripts/validate-game-data.js` | 34 tỉnh, 6 vùng, 44 nhóm SVG, 58 cạnh, 5 binh chủng |
| `node --test tests/game/*.test.cjs` | 130/130 pass, 14,353 giây |
| `python -m unittest -v test_pipeline.py` | 33/33 pass, 41,094 giây |
| `node scripts/simulate-economy.js --runs 100000 --assert` | PASS |
| `node scripts/simulate-combat.js --runs 10000 --assert --config game/data/balance.json` | PASS |
| `node scripts/simulate-campaign.js --runs 1000 --turns 60 --assert` | PASS |

Python regression xác nhận build trong thư mục tạm byte-identical với `index.html` production. Artifact cuối có 1.379.258 byte và SHA-256 `5EC1EC5FF9F68AF9FD9EAD0C63CD89B400234F7CFFC23985764BFC1F7CF0FD34`.

Lần chạy Node đầy đủ đầu tiên có 129/130 pass vì tài liệu contract production đã bỏ tên command tương thích Phase 6. Bảng tương thích được bổ sung vào contract; test đích và toàn bộ 130 test đều pass khi chạy lại.

## Trình duyệt

Bản `file:///C:/Users/pgb31/mln222-quiz/index.html` được kiểm tra bằng Chrome headless qua `agent-browser`.

- 34 tỉnh là target chuột, cảm ứng và bàn phím; click thật đổi từ Hà Nội sang Bắc Ninh. Mười nhóm đảo dùng chung owner/state với tỉnh quản lý.
- Luồng tạo chiến dịch, tuyển quân, giao thương, cảnh báo tấn công trước một lượt, viện binh, ba hiệp chiến đấu và chiếm Bắc Ninh hoạt động qua UI/controller production.
- Quiz buộc đủ 10 câu. Sau reload, câu đang review, feedback, nút tiếp theo và tab đang mở khôi phục giống hệt.
- Bản lưu giữa trận khôi phục byte-identical, giữ tactic `engage`, battle ID, hiệp và hàng đợi viện binh.
- Save JSON hỏng, version tương lai, sidecar UI hỏng và `localStorage` không khả dụng đều fail an toàn với thông báo tiếng Việt; tiến trình học `mln222.v2.*` không bị đụng tới.
- Khi quiz mở, nền có `inert`, accessibility tree chỉ chứa dialog và Tab/Shift+Tab tuần hoàn trong các lựa chọn.
- Các chế độ Luyện thi, Flashcard và Tìm kiếm vẫn hoạt động; tìm `giá trị thặng dư` trả 80 kết quả trên bản cuối.
- Network log chỉ có document `file://`; không có request tài nguyên ngoài.
- Không ghi nhận page error hoặc console error.

## Responsive

| Viewport | Kết quả |
|---|---|
| 1440x900 | map/panel/footer không chồng lấn |
| 1024x768 | `scrollWidth == clientWidth`, 0 nút nhỏ hơn 44 px |
| 390x844 | không tràn ngang, resource bar cuộn ngang, còn thấy đầu context panel |
| 360x800 | không tràn ngang, 0 nút nhỏ hơn 44 px |

Ảnh kiểm tra:

- [Desktop 1440x900](./phase8-1440x900.png)
- [Desktop 1024x768](./phase8-1024x768.png)
- [Mobile 390x844](./phase8-390x844.png)
- [Mobile context panel](./phase8-390x844-panel.png)
- [Báo cáo sau chiến đấu](./phase9-battle-report.png)

## Duyệt độc lập

Vòng review độc lập phát hiện và đã sửa: pointer capture nuốt click tỉnh, lỗi sidecar bị xóa im lặng, SVG `<style>@import` lọt validator, modal quiz chưa khóa focus, và artifact chưa rebuild sau thay đổi nguồn. Test đích, build lại và browser regression đều pass sau sửa.

## Kết luận

`index.html` cuối là artifact độc lập, offline, deterministic, chứa đúng 504 câu và bốn chế độ học. Mọi gate Phase 1-9 có bằng chứng chạy thực tế.
