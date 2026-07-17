---
title: "Bien soan lai ngan hang cau hoi MLN222"
description: "Thay bo cau hoi sinh tu dong bang 300 cau trac nghiem duoc doi chieu giao trinh, sau do tich hop vao website tinh hien tai."
status: completed
priority: P1
effort: 14h
issue: null
branch: null
tags: [feature, content, frontend]
created: 2026-07-17
---

# Ke hoach bien soan lai ngan hang cau hoi MLN222

## Tong quan

Doc tron 6 bai giang va giao trinh PDF; lap ma tran noi dung; bien soan khoang 300 cau trac nghiem 4 lua chon co giai thich va dan nguon; kiem dinh 100% cau; thay du lieu cu va kiem thu website.

Bao cao hien trang: [source-audit.md](./reports/source-audit.md).

Bao cao xac minh: [quality-validation.md](./reports/quality-validation.md) va [end-to-end-testing.md](./reports/end-to-end-testing.md).

## Pham vi va nguyen tac

- Nguon chuan: giao trinh PDF trang 8-259; slide la nguon bo tro va chi bao trong tam.
- Dinh dang: trac nghiem mot dap an dung, tieng Viet, 4 lua chon.
- San pham noi dung chinh: `C:\Users\pgb31\mln222-quiz\questions.json`.
- Muc tieu: 300 cau; uu tien chat luong, cho phep lech toi da 10 cau neu khong co du noi dung doc lap.
- Giu ba che do Luyen thi, Flashcard, Tim kiem va mo rong phan giai thich/nguon.
- Khong dung lai phuong an nhieu ngau nhien giua cac chuong.

## Cac giai doan

| # | Giai doan | Trang thai | Uoc tinh | Tai lieu |
|---|---|---|---:|---|
| 1 | Doc nguon va lap ma tran noi dung | Completed | 2h | [phase-01](./phase-01-source-blueprint.md) |
| 2 | Bien soan Chuong 1-3 | Completed | 4h | [phase-02](./phase-02-author-chapters-1-3.md) |
| 3 | Bien soan Chuong 4-6 | Completed | 3.5h | [phase-03](./phase-03-author-chapters-4-6.md) |
| 4 | Kiem dinh hoc thuat va du lieu | Completed | 2h | [phase-04](./phase-04-quality-validation.md) |
| 5 | Tich hop vao website | Completed | 1.5h | [phase-05](./phase-05-website-integration.md) |
| 6 | Kiem thu va ban giao | Completed | 1h | [phase-06](./phase-06-end-to-end-testing.md) |

## Hop dong du lieu de xuat

Moi cau co: `id`, `chapter`, `chapterNum`, `topic`, `difficulty`, `kind`, `stem`, `options[4]`, `answer`, `explanation`, `source`. `source` ghi tep PDF, trang in, trich yeu ngan va slide bo tro neu co. ID on dinh theo dang `C02-Q001` de khong thay doi tien do khi sap xep lai cau.

## Luong xu ly

`F:\MLN222` -> ma tran noi dung -> bien soan `questions.json` -> kiem tra tu dong + doi chieu thu cong -> `build_html.py` -> `index.html`.

## Tieu chi hoan thanh

- 100% cau co mot dap an ro rang, giai thich va nguon kiem chung duoc.
- Khong con cau bi cat, tieu de rac, lua chon lech pham tru hoac trung lap.
- Phan bo cau hoi dat muc tieu theo chuong va muc do; vi tri dap an dung khong bi lech.
- Script sinh nhap khong the ghi de ngan hang chinh.
- Website chay truc tiep tu `index.html`; luyen thi, flashcard, tim kiem, danh dau va reset deu hoat dong tren desktop/mobile.

## Rui ro chinh

- Slide co loi danh may/noi dung rut gon: uu tien giao trinh va ghi nhan ngoai le.
- Cau hoi co the dung theo cau chu nhung mo ho: bat buoc kiem tra nguoc tung lua chon va doc nguon lan hai.
- Du lieu tien do cu khong con tuong ung: tang phien ban khoa `localStorage` khi tich hop.
- Noi dung moi duoc hien thi trong HTML: escape toan bo truong van ban truoc khi chen vao DOM.
