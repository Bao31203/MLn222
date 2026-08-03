# Checkpoint tạm dừng — VNR202

Ngày checkpoint: 2026-08-03 (Asia/Saigon)

## Đã hoàn tất

- Nguồn đã khóa: `gt-lich-su-dang-csvn-ban-tuyen-giao-tw.md`, SHA-256 `a686d4395752bf70302dff62cbf1502187f19ebcd1e9406a9a402e97b76799bc`.
- Đã biên soạn blueprint 850 câu, 5 đơn vị học; mapping hiện có 850/850 ID nội bộ.
- Chương 1 và Chương 5 đã được reviewer độc lập duyệt `APPROVED`.
- Chương 2 đã sửa 23 câu; slice pass validator riêng. Đang chờ reviewer độc lập tái duyệt.
- Chương 4a đã sửa 37 câu; draft pass validator riêng, chưa merge/re-review.
- Template đã hỗ trợ alias `vnr201 → vnr202`, storage VNR202 và ngân sách build 5 MiB raw / 1 MiB gzip.
- Theo yêu cầu bỏ qua review, VNR202 đã được đăng ký `ready` ở registry với cơ chế preview không editorial sign-off.
- Website đã build: 5 môn/2.494 câu, raw 4.527.482 byte, gzip 931.068 byte; VNR202 có 850 câu.

## Artifact hash hiện tại

| Artifact | SHA-256 | Trạng thái |
|---|---|---|
| `content/subjects/vnr202/chapters/chapter-02.json` | `8f88ce6c7c69cd9b1709d687dbb347cdb68ebcb10194f15a6ef03ec170491148` | Chờ re-review |
| `content/subjects/vnr202/chapters/chapter-03.json` | `5b1cb0fd1d6ba3c9d67629384f4fff9811e3f28d65fc95cd444a5e0be940e049` | Đang remediation, chưa review |
| `drafts/chapter-04a.json` | `1d30cd9b40a488456d135863942b2fbe4253125c54894dae89ae41a1e0210ba3` | Pass slice, chờ merge/re-review |
| `drafts/chapter-04b.json` | `2f4c8b63da2544f4c88399f507b09a2d7bea14a39e4dc28d66f4949204fa9222` | Chờ remediation |
| `content/subjects/vnr202/chapters/chapter-04.json` | `ee58cf82768089fd3c25357ad822050480e8989620e82497b3df289e78e5f28e` | Bản merge cũ, không dùng sign-off |
| `content/subjects/vnr202/chapters/chapter-05.json` | `1775b3753aee54713b7f26fad803397b8d483c0ccba322b8c9a7e4a2babd4152` | Reviewer đã duyệt |

## Việc còn lại khi tiếp tục

1. Hoàn tất remediation Chương 3, bổ sung blueprint coverage cho logical lines 5131–5217, merge blueprint và nhờ project_manager re-review.
2. Chờ project_manager re-review Chương 2 trên hash mới.
3. Remediation Chương 4b theo `review-chapter-04.md`; merge Chương 4a + 4b rồi nhờ code_reviewer re-review toàn bộ 400 câu.
4. Chạy lại validator skill toàn bank sau khi các artifact ổn định.
5. Nếu cần phát hành chính thức, tạo sign-off sau khi đủ 5 review độc lập; bản hiện tại là preview theo yêu cầu bỏ qua review.
6. Registry đã thay entry `vnr201` bằng `vnr202` với alias `vnr201`, bảo toàn thay đổi MLN131 hiện có.
7. Đã chạy compose/validate repository, build và test routing; browser QA trực tiếp VNR202 vẫn là bước tùy chọn trước khi public.
8. Dọn các pycache do chạy kiểm tra; không commit/push/deploy trong phiên này.

## Review reports

- Chương 1: `APPROVED` — `reviews/review-chapter-01.md`.
- Chương 2: `CHANGES_REQUESTED` tại checkpoint — 18 cue/near-miss và 5 framing lịch sử; report đã khóa trước remediation.
- Chương 3: `CHANGES_REQUESTED` — 7 finding, gồm khoảng blueprint 5131–5217.
- Chương 4: `CHANGES_REQUESTED` — 2 High, 4 Medium; bản merge cũ không còn hợp lệ sau khi sửa 4a.
- Chương 5: `APPROVED` — `reviews/review-chapter-05.md`.

Không tạo sign-off hoặc bật `status: ready` trong checkpoint này.
