# Phase 04 - Kiem dinh hoc thuat va du lieu

## Tong quan

- Uu tien: P1
- Trang thai: Completed
- Muc tieu: loai cau mo ho, sai nguon va loi schema truoc khi dua len website.
- Phu thuoc: Phase 02 va 03.

## Tep lien quan

- Tao: `C:\Users\pgb31\mln222-quiz\validate_questions.py`
- Sua: `C:\Users\pgb31\mln222-quiz\parse_report.txt`
- Kiem tra: `C:\Users\pgb31\mln222-quiz\questions.json`

## Kiem tra tu dong

1. Schema day du; ID duy nhat; 4 lua chon khac nhau; `answer` nam trong 0-3.
2. Khong co chuoi bi cat `...`, HTML rac, ky tu dieu khien hoac khoang trang bat thuong.
3. Khong trung than cau sau khi chuan hoa dau/chu hoa; canh bao cau co do giong cao.
4. Canh bao lua chon qua ngan, qua dai hoac chenh lech do dai bat thuong.
5. Kiem tra trang nguon nam trong pham vi chuong va tep nguon ton tai.
6. Thong ke chuong, chu de, do kho, dang cau va vi tri dap an; moi vi tri dap an muc tieu 20-30%.

## Kiem dinh thu cong 100%

- Vong 1: doi chieu cau, dap an va giai thich voi trang nguon.
- Vong 2: doc nhu nguoi lam bai; kiem tra do mo ho, hai dap an dung, dau moi ngu phap va meo doan.
- Cac cau bi tranh luan phai duoc viet lai hoac loai, khong giu chi de du so luong.
- Kiem tra thuat ngu nhat quan: gia tri/gia ca, tu ban/tien, doc quyen/doc quyen nha nuoc, CNH/HDH/hoi nhap.

## Tieu chi thanh cong

- Validator tra ma 0 va `parse_report.txt` khong co loi nghiem trong.
- 100% cau duoc danh dau da doi chieu nguon trong bao cao kiem dinh.
- Khong co cau mang mau van de da ghi nhan trong bo 996 cau cu.

## Bao mat va an toan du lieu

- Validator chi doc tai lieu nguon va ghi bao cao trong du an.
- Van ban se duoc escape khi hien thi; JSON khong chua ma HTML thuc thi.

## Todo

- [x] Viet validator va thong ke chat luong
- [x] Chay kiem tra tu dong, sua tat ca loi
- [x] Doi chieu hoc thuat vong 1
- [x] Doc phan bien vong 2
- [x] Chot bao cao kiem dinh
