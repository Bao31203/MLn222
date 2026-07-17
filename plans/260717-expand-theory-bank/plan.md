---
title: "Mo rong ngan hang ly thuyet MLN222 len 504 cau"
description: "Bo sung 204 cau moi, chia deu 34 cau cho moi chuong, uu tien ly thuyet chua duoc bao phu."
status: completed
priority: P1
created: 2026-07-17
---

# Ke hoach mo rong ngan hang ly thuyet MLN222

## Pham vi

- Bo sung 204 cau moi, 34 cau cho moi chuong; tong sau hop nhat la 504 cau.
- Giu giao trinh PDF trong `F:\MLN222` lam nguon chuan; slide chi la nguon bo tro.
- Moi cau moi co 4 phuong an, mot dap an, giai thich, trang PDF va slide neu phu hop.
- Uu tien khai niem, phan biet, quan he logic, vai tro, bieu hien va he qua ly thuyet chua co hoac dang it cau.
- Khong tao bien the chi thay vai tu cua cau cu; khong dung nhieu ngau nhien ngoai cung pham tru.

## Chi tieu

| Chuong | Hien tai | Them | Sau mo rong | ID moi | NB/TH/VD moi |
|---:|---:|---:|---:|---|---:|
| 1 | 30 | 34 | 64 | C01-Q031..C01-Q064 | 14/14/6 |
| 2 | 55 | 34 | 89 | C02-Q056..C02-Q089 | 14/14/6 |
| 3 | 65 | 34 | 99 | C03-Q066..C03-Q099 | 14/14/6 |
| 4 | 50 | 34 | 84 | C04-Q051..C04-Q084 | 14/14/6 |
| 5 | 50 | 34 | 84 | C05-Q051..C05-Q084 | 14/14/6 |
| 6 | 50 | 34 | 84 | C06-Q051..C06-Q084 | 14/14/6 |

Tong muc do sau mo rong: 204 Nhan biet, 204 Thong hieu, 96 Van dung.

Vi tri dap an moi duoc gan de can lai toan chuong:

- Chuong 1, 4, 5, 6: A/B/C/D = 8/8/9/9.
- Chuong 2: A/B/C/D = 9/8/8/9.
- Chuong 3: A/B/C/D = 8/9/9/8.

Sau khi cong voi bo cu, do lech vi tri dap an trong moi chuong khong qua mot cau.

## Cac buoc

- [x] Phan tich khoang trong ly thuyet cua 6 chuong so voi 300 cau hien tai.
- [x] Bien soan 204 cau moi theo chi tieu va doi chieu nguon.
- [x] Doc phan bien 100% cau moi; sua cau trung y, mo ho va dau hieu doan dap an.
- [x] Cap nhat validator, composer, tai lieu va kiem thu cho tong 504 cau.
- [x] Hop nhat `questions.json`, dung lai `index.html` va kiem thu desktop/mobile.
- [x] Chot bao cao phan bo, kiem dinh va ban giao.

## Tieu chi hoan thanh

- Dung 504 cau; moi chuong tang dung 34 cau.
- 204 cau moi bao ham them ly thuyet thay vi lap lai muc tieu hoc tap cu.
- Validator tra 0 loi, 0 canh bao; vi tri dap an trong tung chuong lech khong qua 2.
- Toan bo regression test va kiem thu trinh duyet thanh cong.

## Ket qua

- Validator: 504 cau, 0 loi, 0 canh bao.
- Regression test: 28/28 PASS.
- Trinh duyet: desktop khong tran ngang; 504/504 trang thai mobile khong co control vuot khung.
- Bao cao noi dung: `reports/expansion-validation.md`.
- Bao cao kiem thu: `reports/end-to-end-testing.md`.
