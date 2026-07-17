# Bao cao khao sat nguon va ngan hang cau hoi MLN222

## Pham vi da khao sat

- 6 tep bai giang `*.pptx.txt` trong `F:\MLN222`, tu Slot 1 den Slot 9+10.
- Giao trinh `GIAO-TRINH-KINH-TE-CHINH-TRI-MAC-LENIN-BO-GIAO-DUC-VA-DAO-TAO.pdf`, 262 trang.
- Ma nguon website tai `C:\Users\pgb31\mln222-quiz`.
- Ngan hang hien tai `questions.json`, 996 cau.

## Ban do noi dung chinh

| Chuong/slot | Trang giao trinh | Noi dung cot loi |
|---|---:|---|
| Chuong 1 / Slot 1 | 8-28 | Lich su hinh thanh; doi tuong, muc dich, phuong phap; chuc nang cua kinh te chinh tri Mac-Lenin |
| Chuong 2 / Slot 2 | 29-74 | Hang hoa, lao dong, gia tri, tien te; thi truong, quy luat thi truong; vai tro cac chu the |
| Chuong 3 / Slot 3+4 | 75-111 | Gia tri thang du; tu ban va suc lao dong; tich luy; loi nhuan, loi tuc, dia to |
| Chuong 4 / Slot 5+6 | 112-151 | Canh tranh va doc quyen; nam dac diem cua Lenin; doc quyen nha nuoc; bieu hien moi |
| Chuong 5 / Slot 7+8 | 152-200 | KTTT dinh huong XHCN; hoan thien the che; quan he loi ich kinh te o Viet Nam |
| Chuong 6 / Slot 9+10 | 201-259 | Cac cuoc cach mang cong nghiep; CNH-HDH; hoi nhap kinh te quoc te cua Viet Nam |

`Cau hoi on tap` o cuoi moi chuong duoc dung lam danh sach kiem tra do bao phu. Cau trac nghiem se duoc viet lai tu noi dung than bai, khong sao chep may moc cau tu luan.

## Van de cua bo cau hoi hien tai

- 996 cau duoc sinh tu dong bang chi 3 khuon cau lap lai: 376 `topic_fact`, 376 `reverse_topic`, 244 `concept_recall`.
- Phuong an nhieu duoc lay ngau nhien tren toan bo tai lieu, nen thuong khac chuong, khac loai khai niem va qua de loai tru.
- 675/996 cau co than cau hoac lua chon bi cat bang `...`.
- 53 cau co chenh lech do dai giua cac lua chon lon hon 4 lan; 39 cau co lua chon ngan hon 20 ky tu.
- 996/996 cau khong co giai thich dap an.
- Tieu de trich xuat tu PDF/slide co truong hop la ky tu, so muc hoac dong dang do, khong phai chu de hoc tap.
- Script `parse_questions.py` co the ghi de `questions.json`, tao rui ro mat bo cau hoi da bien soan.

## Quyet dinh bien tap

1. Giao trinh PDF la nguon chuan khi noi dung slide va giao trinh khac nhau; slide dung de xac dinh trong tam giang day va vi du.
2. Thay 996 cau sinh tu dong bang khoang 300 cau duoc bien soan va doi chieu tung cau. Khong ep du so luong bang cau yeu.
3. Moi cau chi co mot dap an dung, 4 lua chon cung pham tru, hinh thuc ngu phap song song va do dai tuong doi can bang.
4. Phuong an nhieu den tu nhan thuc sai thuong gap trong cung chu de, khong lay ngau nhien tu chuong khac.
5. Moi cau co giai thich ngan va dan nguon cu the theo trang PDF; them slide neu co gia tri bo tro.
6. Giu ung dung HTML tinh hien tai; chi mo rong hien thi de khai thac giai thich, do kho va nguon.

## Phan bo de xuat

| Chuong | So cau muc tieu |
|---|---:|
| Chuong 1 | 30 |
| Chuong 2 | 55 |
| Chuong 3 | 65 |
| Chuong 4 | 50 |
| Chuong 5 | 50 |
| Chuong 6 | 50 |
| **Tong** | **300** |

Ty le muc do toan bo: 40% nhan biet, 40% thong hieu, 20% van dung. Ty le nay duoc linh hoat theo chuong; cau tinh toan/tinh huong tap trung vao Chuong 2 va Chuong 3.
