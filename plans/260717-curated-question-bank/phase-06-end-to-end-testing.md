# Phase 06 - Kiem thu va ban giao

## Tong quan

- Uu tien: P1
- Trang thai: Completed
- Muc tieu: xac nhan du lieu va website hoat dong hoan chinh tren desktop/mobile.
- Phu thuoc: Phase 05.

## Pham vi kiem thu

1. Chay validator, build va kiem tra cu phap JavaScript.
2. Mo `index.html` trong trinh duyet o kich thuoc desktop va mobile.
3. Thu Luyen thi: chon dap an dung/sai, giai thich, lui/tiep, tron cau, bo loc chuong.
4. Thu Flashcard: lat the, nguon, danh dau, chuyen cau.
5. Thu Tim kiem: tieng Viet co dau, noi dung, chu de, giai thich va ten nguon.
6. Thu luu tien do, reset va phien ban hoa du lieu cu.
7. Kiem tra layout voi cau/lua chon dai nhat, khong tran hay chong lap.
8. Lay mau moi chuong de so sanh `questions.json` voi giao dien da build.

## Lenh xac minh du kien

```powershell
python .\validate_questions.py
python .\build_html.py
node --check <script-trich-tu-template>
```

## Tieu chi thanh cong

- Tat ca kiem tra tu dong thanh cong.
- Khong co loi console, noi dung trong, tran chu hoac sai trang thai.
- 6 chuong deu co cau hoi va co the hoc/luyen/tim kiem.
- Bao cao cuoi cung neu ro tong so cau, phan bo va duong dan mo website.

## Todo

- [x] Chay kiem tra du lieu va build
- [x] Kiem thu chuc nang desktop/mobile
- [x] Kiem tra layout va console
- [x] Doi chieu mau theo 6 chuong
- [x] Ban giao website va bao cao
