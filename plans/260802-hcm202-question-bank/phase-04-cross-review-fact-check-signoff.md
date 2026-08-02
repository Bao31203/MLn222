---
title: "Phase 04 - Phản biện chéo, fact-check và sign-off"
description: "Đăng ký HCM202 ở trạng thái draft, kiểm định 480 câu, xử lý errata và chỉ promote khi review độc lập hoàn tất."
status: completed
priority: P1
effort: 8h
issue: null
branch: main
tags: [content, review, validation, signoff]
created: 2026-08-02
---

# Phase 04: Phản biện chéo, fact-check và sign-off

## Mục tiêu

Ghép sáu file thành một bank có thể kiểm chứng, phản biện từng câu và khóa bản đã duyệt bằng SHA-256. HCM202 phải fail closed: trong lúc review chỉ là `draft`; chỉ chuyển `ready` sau khi mọi gate đạt.

## Hai bước trạng thái

1. Thay item placeholder `hcm201` bằng `hcm202` ở trạng thái `draft`; tạo profile `hcm202` với `studyReady:false`, `copyReviewRequired:true`, `reviewSignoffPath:null`.
2. Sau khi review đạt, tạo `review-signoff.json`, rồi đổi đồng thời registry/profile sang `ready`, `studyReady:true`, `copyReviewRequired:false` và gắn đường dẫn sign-off.

Không build/publish trạng thái trung gian. Xóa đúng file placeholder `content/subjects/hcm201/subject.json` sau khi đã ghi baseline; không dùng lệnh xóa đệ quy hoặc clean worktree.

## Profile khóa

- Sáu chapter ID `hcm202-c01` … `hcm202-c06`, title lấy đúng blueprint.
- `questionTarget:480`; file chương theo thứ tự 1..6.
- Features: quiz/flashcards/search `true`; lectures/game `false`; `lectureManifest:null`.
- ID pattern `^HCM202-C\d{2}-Q\d{3}$`; `courseIdPolicy:"required"`; bốn kind hiện hành.
- Source policy `markdown-section`, basename `Giáo trình tư tưởng Hồ Chí Minh.md`, không slide/page range.
- Difficulty và answer-position targets phải khớp tuyệt đối ma trận trong `plan.md`.

## Vòng phản biện độc lập

| Reviewer | Chương | Điều kiện |
|---|---|---|
| A | 1 và 4 | Không phải tác giả C1/C4 |
| B | 2 và 6 | Không phải tác giả C2/C6 |
| C | 3 và 5 | Không phải tác giả C3/C5 |

Mỗi reviewer kiểm 100% câu, không lấy mẫu:

- [x] Stem đo đúng learning objective và đúng difficulty/kind.
- [x] Chỉ có một đáp án bảo vệ được; thử chứng minh từng distractor là đúng để tìm nhập nhằng.
- [x] Explanation tự đủ, không lặp máy móc option.
- [x] Citation đúng chương/mục lá; evidence diễn giải đúng nguồn.
- [x] Không dùng lỗi OCR, rác Studocu, mục lục lặp hoặc dữ kiện ngoài phạm vi.
- [x] Câu tình huống suy ra trực tiếp từ giáo trình, không biến lịch sử bạo lực thành chỉ dẫn hiện đại.
- [x] Không trùng/na ná câu khác; không lộ pattern đáp án.

Finding dùng mức Critical/High/Medium/Low, ghi question ID, lý do và sửa đề xuất. Author sửa file mình sở hữu; reviewer xác nhận lại. Không được tạo sign-off nếu còn Critical/High/Medium.

## Fact-check bắt buộc

- Đối chiếu mọi mục `ambiguous-do-not-use` trong `ERRATA.md` với PDF gốc hoặc nguồn thẩm quyền.
- Ghi rõ căn cứ cho Đại hội XI năm 2011, mốc Yêu sách 1919, thuật ngữ “chủ nghĩa quốc tế vô sản”, mã nghị quyết UNESCO và các tên/mốc còn nghi vấn.
- Nếu chưa có bằng chứng đủ chắc, xóa câu liên quan thay vì suy đoán.
- Các phần “hiện nay” phải được diễn đạt là nội dung của giáo trình xuất bản năm 2021, không tuyên bố cập nhật đến 2026.

## Kiểm định và sign-off

```powershell
python compose_questions.py --subject hcm202 --check
python validate_questions.py --subject hcm202 --check
python compose_questions.py --all --check
python validate_questions.py --all --check
```

- [x] Đúng 480 câu; chapter/difficulty/answer quota khớp.
- [x] ID/stem/options duy nhất; không warning similarity chưa xử lý.
- [x] Max answer run ≤3 và không có chu kỳ ngắn bị cấm.
- [x] Tính canonical bank hash và từng chapter file hash sau lần sửa cuối.
- [x] Tạo sign-off schema 1 với đúng distribution, source, review counts và 0 open Critical/High/Medium.
- [x] Promote `draft` → `ready` trong một patch và chạy lại bốn lệnh trên.
- [x] Chỉnh một byte thử nghiệm trong bản sao tạm phải làm sign-off validation fail; không sửa file thật cho negative test.

## Bằng chứng hoàn thành

- Bank có đúng 480 câu và profile/registry đã ở trạng thái `ready`.
- Sign-off schema 1 ghi 6 review độc lập, 0 open Critical/High/Medium.
- Canonical bank SHA-256:
  `c0c9a0ec983de0e48da565f8cb08625261836487b3b3d2a72c3b5d0502350255`.

## File sở hữu

- `content/subjects/registry.json`
- `content/subjects/hcm202/subject.json`
- `content/subjects/hcm202/review-signoff.json`
- findings/errata dưới `content/subjects/hcm202/`
- Sáu chapter chỉ được sửa theo finding bởi owner tương ứng.

## Gate hoàn thành

HCM202 ở trạng thái `ready`, 480 câu qua validator và review độc lập, sign-off khớp byte hiện tại, không còn finding Critical/High/Medium; chưa sửa template/generated artifact.
