---
date: 2026-07-29
session: youtube-lecture-integration
status: completed
---

# Journal: 2026-07-29 — Tích hợp bài giảng YouTube

## Context

Trang học MLN222 cần bổ sung video bài giảng theo từng chương mà không làm nặng lần tải đầu, không tự phát nội dung và vẫn giữ được trải nghiệm rõ ràng khi mạng hoặc YouTube gặp sự cố.

## What happened

- Tích hợp video YouTube ở chế độ Unlisted qua miền privacy-enhanced `youtube-nocookie.com`.
- Chuẩn hóa manifest cho 6 chương và thêm kiểm tra build để mỗi chương có cấu hình video hợp lệ trước khi tạo trang.
- Chỉ tạo iframe khi người học yêu cầu phát; không autoplay và xóa iframe khi đóng để dừng hoàn toàn video cùng tài nguyên nền.
- Xử lý khác biệt môi trường: YouTube embed cần HTTP Referer hợp lệ, trong khi mở trực tiếp bằng `file://` có thể bị từ chối.
- Bổ sung trạng thái lỗi và thao tác thử lại khi offline hoặc tải video thất bại.
- QA đạt 41/41 kiểm tra pipeline, 141/141 kiểm tra giao diện/trò chơi và 6/6 chương khi chạy qua HTTP cục bộ.

## Reflection

Manifest và build validation biến danh sách video từ dữ liệu rời rạc thành một hợp đồng có thể kiểm tra. Lazy iframe vừa cải thiện hiệu năng vừa tránh âm thanh hoặc kết nối nền ngoài ý muốn. Ranh giới giữa `file://` và HTTP là điểm dễ gây hiểu nhầm nhất: bản dựng đúng vẫn có thể trông như lỗi nếu thử bằng cách mở tệp trực tiếp.

## Decisions

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Dùng YouTube Unlisted với `youtube-nocookie.com` | Giảm theo dõi trước khi người học chủ động phát, đồng thời không công khai video trên kênh | Embed riêng tư hơn nhưng vẫn phụ thuộc YouTube |
| Quản lý 6 chương bằng manifest và build validation | Phát hiện thiếu hoặc sai cấu hình trước khi phát hành | Nội dung giữa các chương nhất quán, dễ bảo trì |
| Lazy-load, không autoplay và xóa iframe khi đóng | Giảm tải mạng, tránh tự phát và bảo đảm video dừng hẳn | Trang khởi động nhẹ hơn, hành vi media dễ kiểm soát |
| Yêu cầu chạy qua HTTP thay vì `file://` | YouTube dùng Referer để xác thực ngữ cảnh embed | Kiểm thử cục bộ phải dùng web server |
| Cho phép retry khi offline hoặc tải lỗi | Lỗi mạng thường chỉ là tạm thời | Người học có đường phục hồi mà không cần tải lại toàn trang |

## Next

- Chưa commit, push hoặc deploy; cần review diff và xác nhận các video Unlisted đúng ID trước khi phát hành.
- Chạy smoke test sau deploy trên miền thật để xác nhận Referer, CSP và chính sách embed.
- Theo dõi lỗi tải video thực tế để cân nhắc thông báo chi tiết hơn hoặc nguồn dự phòng.
