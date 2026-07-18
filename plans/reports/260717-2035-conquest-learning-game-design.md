---
date: 2026-07-17
type: brainstorm-report
status: approved
project: mln222-quiz
owner: user
---

# Thiết kế chế độ Công thành học tập

## Summary

Thiết kế đã được người dùng chốt theo mô hình chiến thuật lai: tài nguyên dùng chung toàn thế lực, dân số và quân đồn trú quản lý theo tỉnh, chiến tranh diễn ra qua nhiều lượt chiến lược, và mỗi lượt kết thúc bằng 10 câu hỏi MLN222. Mục tiêu là một chiến dịch 45-60 lượt có thể lưu và tiếp tục qua nhiều phiên.

Bản thiết kế ưu tiên khả năng học, quyết định chiến thuật rõ ràng và cân bằng có thể kiểm thử. Các hệ số trong tài liệu là điểm khởi đầu cho mô phỏng, không phải giá trị cuối cùng trước khi chạy thử hàng nghìn chiến dịch.

## Problem statement

Website hiện có ba chế độ Luyện thi, Flashcard và Tìm kiếm với ngân hàng 504 câu hỏi. Chế độ mới phải biến việc ôn tập thành một game công thành chiếm đất, trong đó người chơi:

- Chọn một tỉnh làm căn cứ ban đầu.
- Quản lý lương thực, tiền tệ, dân thường và quân đội.
- Tuyển quân, mở khóa binh chủng và duy trì lực lượng.
- Ngoại giao, thiết lập thương mại, liên minh hoặc khai chiến.
- Đối đầu 33 thế lực NPC trên bản đồ 34 tỉnh/thành.
- Trả lời 10 câu hỏi cuối mỗi lượt để nhận thưởng hoặc chịu phạt.
- Phát triển lãnh thổ trong một chiến dịch dài nhưng không có trận đánh kết thúc tức thời.

## Confirmed decisions

| Quyết định | Nội dung đã chốt |
|---|---|
| Độ dài chiến dịch | 45-60 lượt, chuẩn cân bằng tại 60 lượt |
| Nhịp chiến đấu | Một trận kéo dài qua nhiều lượt chiến lược |
| Nhịp quiz | 10 câu một lần ở cuối mỗi lượt chiến lược |
| Bản đồ | Tái sử dụng SVG từ `https://fptlichsuviet.io.vn/map/index.html` |
| Quyền sử dụng | Người dùng sở hữu website bản đồ nguồn |
| Kiến trúc gameplay | Mô hình lai thay vì toàn cục đơn giản hoặc mô phỏng từng tỉnh hoàn toàn |
| Bối cảnh mặc định | Binh chủng trung tính, không gắn với một triều đại cụ thể |

## Existing-system findings

- Ứng dụng hiện tại là HTML tĩnh và mở trực tiếp bằng `file://`.
- `template.html` là nguồn giao diện; `build_html.py` nhúng 504 câu để tạo `index.html` độc lập.
- Tiến độ học hiện được lưu bằng `localStorage`.
- SVG nguồn có 44 nhóm `g.province[data-p]`: 34 tỉnh/thành và 10 nhóm đảo.
- Các đảo phải dùng chung chủ quyền, trạng thái và màu với tỉnh quản lý; không tạo lãnh thổ độc lập.
- Dữ liệu thật về diện tích và dân số chỉ nên dùng làm thông tin nền. Dùng trực tiếp để cân bằng sẽ khiến một số tỉnh vượt trội ngay từ đầu.

## Evaluated approaches

### Approach A: Mô phỏng nhẹ toàn cục

Toàn thế lực chỉ có một dân số và một quân đội; tỉnh chỉ là điểm sở hữu trên bản đồ.

Ưu điểm:

- Ít trạng thái, dễ triển khai và kiểm thử.
- AI và lưu game đơn giản.

Nhược điểm:

- Tỉnh không có ý nghĩa kinh tế hoặc quân sự riêng.
- Không biểu diễn được quân đồn trú, tiếp viện hay nhiều mặt trận.
- Độ sâu không đủ cho chiến dịch 45-60 lượt.

### Approach B: Mô hình lai

Tiền, lương thực, mở khóa và ngoại giao dùng chung toàn thế lực. Sức chứa, dân thường, đặc tính đất và quân đồn trú thuộc từng tỉnh. Quân tham chiến được gắn với mặt trận.

Ưu điểm:

- Lãnh thổ có giá trị khác nhau nhưng không tạo vi mô quá mức.
- Hỗ trợ chiến tranh nhiều lượt, tiếp viện và chiếm đóng.
- Phù hợp với UI bản đồ và kiến trúc HTML tĩnh.

Nhược điểm:

- Cần engine thuần dữ liệu và kiểm thử bất biến chặt chẽ.
- Cân bằng phức tạp hơn Approach A.

Kết luận: chọn Approach B.

### Approach C: Đại chiến lược đầy đủ

Mỗi tỉnh có kho, thuế, công trình, tuyến tiếp tế và nhiều đạo quân độc lập.

Ưu điểm:

- Chiều sâu chiến thuật lớn nhất.

Nhược điểm:

- Quá nhiều thao tác trên 34 tỉnh và 33 NPC.
- Lệch khỏi mục tiêu học qua chơi.
- Chi phí cân bằng, UI và kiểm thử tăng mạnh.

Kết luận: loại khỏi phạm vi hiện tại.

## Recommended game loop

Một lượt chiến lược diễn ra theo thứ tự cố định:

1. Áp dụng phần thưởng hoặc hình phạt quiz của lượt trước.
2. Tính tăng dân số từng tỉnh.
3. Tính sản xuất, thương mại và các hiệu ứng đang hoạt động.
4. Trả phí duy trì quân đội; xử lý thiếu lương thực hoặc tiền.
5. Cấp 2 điểm hành động chiến lược cho người chơi.
6. Người chơi tuyển quân, mở khóa, ngoại giao, di chuyển hoặc khai chiến.
7. Người chơi chọn một chiến thuật miễn phí cho mỗi mặt trận đang hoạt động.
8. NPC ra quyết định và các trận đánh được giải quyết đồng thời.
9. Hiển thị báo cáo lượt, sau đó mở phiên quiz 10 câu.
10. Lưu seed, trạng thái game, bộ câu hỏi và từng đáp án ngay khi phát sinh.

Hai điểm hành động giới hạn số quyết định mới nhưng không khóa người chơi khỏi các trận đang diễn ra. Mỗi mặt trận luôn được chọn chiến thuật mà không tiêu điểm hành động.

## Campaign and victory

- Người chơi chọn một trong 34 tỉnh làm thủ phủ ban đầu.
- Mỗi tỉnh còn lại do một NPC riêng kiểm soát khi bắt đầu.
- Không NPC nào được khai chiến trong ba lượt đầu.
- Chiến thắng tiêu chuẩn: kiểm soát ít nhất 60% tổng điểm lãnh thổ và có hiện diện chi phối tại ít nhất 4 trong 6 vùng.
- Sau chiến thắng tiêu chuẩn, người chơi có thể tiếp tục đến khi thống nhất 34 tỉnh.
- Thất bại khi mất toàn bộ lãnh thổ hoặc không còn tỉnh nào có thể duy trì chính quyền và quân đội.

Điểm lãnh thổ dùng trọng số sức chứa thay vì chỉ đếm tỉnh, tránh việc chiếm nhiều tỉnh nhỏ luôn tốt hơn kiểm soát các trung tâm lớn.

## Province model

Mỗi tỉnh có tối thiểu các thuộc tính:

| Nhóm | Thuộc tính |
|---|---|
| Nhận diện | `id`, tên, slug SVG, vùng, tỉnh kề |
| Sở hữu | thế lực, thủ phủ hay không, trạng thái chiếm đóng |
| Dân số | sức chứa `K`, dân thường `C`, quân đồn trú `A` |
| Kinh tế | hệ số nông nghiệp, thương mại, ổn định |
| Quân sự | địa hình, công sự, mặt trận đang hoạt động |
| Hiển thị | màu sở hữu, thông tin nền, nhóm đảo trực thuộc |

Sức chứa khởi đầu được chuẩn hóa theo các nhóm nhỏ, vừa và lớn. Mỗi tỉnh có một ưu điểm và một điểm yếu, nhưng tổng lợi thế ban đầu không chênh quá 20%.

Ví dụ đặc tính:

- Nông nghiệp: tăng sản lượng lương thực.
- Thương mại: tăng tiền và giá trị tuyến buôn bán.
- Đông dân: tăng sức chứa.
- Miền núi hoặc phòng thủ: tăng lợi thế cho quân giữ thành.

## Population model

Quy ước:

- `K`: sức chứa dân số của tỉnh, bao gồm dân thường và quân đội.
- `C`: dân thường.
- `A`: toàn bộ quân nhân xuất thân từ tỉnh hoặc đang chiếm sức chứa của tỉnh.
- Bất biến bắt buộc: `C >= 0`, `A >= 0`, `C + A <= K`.

```text
u = C / K
m = A / (C + A)

populationCurve =
  u / 0.4           when u <= 0.4
  (1 - u) / 0.6     when u > 0.4

militaryFactor = max(0.25, 1 - 1.25 * m)

deltaC = floor(
  K * 0.025
  * populationCurve
  * militaryFactor
  * stabilityModifier
  * quizModifier
)

deltaC = min(deltaC, K - C - A)
```

Đường cong tăng dân số đạt đỉnh khi dân thường bằng 40% sức chứa và giảm dần về 0 khi tỉnh đầy. Tuyển quân làm giảm `C`, tăng `A` và tiếp tục giảm tăng trưởng qua `militaryFactor`.

## Economy model

```text
mobilization = A / (C + A)
productivity = max(0.35, 1 - 0.75 * mobilization)

foodGross = floor(
  C * 0.08
  * agricultureModifier
  * productivity
  * stabilityModifier
  * quizModifier
)

coinGross = floor(
  C * 0.035
  * commerceModifier
  * productivity
  * stabilityModifier
  * quizModifier
)
```

Thiết lập ban đầu chuẩn cho một tỉnh cỡ vừa:

| Chỉ số | Giá trị |
|---|---:|
| Sức chứa `K` | 1.000 |
| Dân thường `C` | 360 |
| Quân đội `A` | 40 |
| Lương thực | 0 |
| Tiền | 0 |

Lượt đầu tính sản xuất trước duy trì để trạng thái lương thực và tiền bằng 0 không làm game bế tắc.

Quân dã chiến trả 150% phí duy trì. Khi thiếu tài nguyên:

- Thiếu lương thực làm giảm tiếp tế và sức chiến đấu ngay trong lượt.
- Thiếu tiền làm giảm sĩ khí và ổn định.
- Chỉ phát sinh đào ngũ sau hai lượt thiếu liên tiếp.
- Tài nguyên không bao giờ âm; phần thiếu được lưu thành mức khủng hoảng thay vì nợ vô hạn.

## Recruitment and unit unlocks

Tuyển một quân nhân chuyển một dân thường thành quân nhân theo tỷ lệ 1:1. Tuyển quân cần lương thực, tiền và một lượt huấn luyện. Người chơi tuyển theo lô để giao diện không yêu cầu thao tác từng đơn vị.

| Binh chủng | Sức mạnh cơ sở | Lương thực/lượt | Tiền/lượt | Vai trò |
|---|---:|---:|---:|---|
| Dân binh | 1,00 | 0,18 | 0,05 | Rẻ, giữ đất |
| Bộ binh | 1,35 | 0,22 | 0,09 | Cân bằng |
| Xạ binh | 1,25 | 0,20 | 0,12 | Hỗ trợ phòng thủ |
| Kỵ binh | 1,70 | 0,32 | 0,20 | Giao chiến ngoài thành |
| Công binh | 0,80 | 0,25 | 0,18 | Tăng tốc phá công sự |

Dân binh có sẵn. Các binh chủng còn lại được mở khóa toàn thế lực bằng khoản tiền lớn và điều kiện lượt hoặc số lãnh thổ. Chi phí nháp lần lượt khoảng 100, 180, 320 và 300 tiền; giá cuối cùng phải được xác nhận bằng mô phỏng kinh tế.

## Diplomacy and trade

Quan hệ giữa hai thế lực nằm trong `[-100, 100]`.

| Thỏa thuận | Điều kiện nháp | Tác dụng |
|---|---:|---|
| Thương mại | Quan hệ từ 20 | Tạo tiền mỗi lượt cho hai bên |
| Không xâm phạm | Quan hệ từ 40 | Khóa khai chiến trực tiếp trong thời hạn |
| Đồng minh | Quan hệ từ 60 | Hỗ trợ phòng thủ và tăng thương mại |

Giới hạn đề xuất:

- Tối đa hai đồng minh chính thức.
- Số tuyến thương mại bằng `1 + floor(số tỉnh / 4)`.
- Phá hiệp ước tạo hình phạt quan hệ toàn cục và giảm ổn định.
- Thương mại chỉ tạo tiền khi tuyến không bị chiến tranh hoặc bao vây cắt đứt.

## NPC model

Mỗi NPC có một tính cách nhẹ: thận trọng, thương mại, bành trướng hoặc phòng thủ. AI dùng hàm utility để chọn một hành động thay vì kịch bản cố định.

Các yếu tố quyết định tấn công:

- Có biên giới trực tiếp.
- Quan hệ và hiệp ước hiện tại.
- Tỷ lệ sức mạnh và mức tiếp tế.
- Mức đe dọa do người chơi mở rộng.
- Số cuộc chiến đang diễn ra.
- Tính cách và seed ngẫu nhiên đã lưu.

NPC không được tấn công hoàn toàn bất ngờ. Một lượt trước khi khai chiến, game hiển thị dấu hiệu tập trung quân ở biên giới. AI của cả 33 thế lực vẫn được mô phỏng, nhưng nhật ký chỉ ưu tiên láng giềng, đồng minh, đối thủ và thay đổi lãnh thổ lớn.

## Combat state

Mỗi mặt trận lưu:

- Bên tấn công, bên phòng thủ, tỉnh nguồn và tỉnh mục tiêu.
- Quân theo từng binh chủng và quân ban đầu của hai bên.
- Sĩ khí, tiếp tế, công sự, tiến độ phá thành và số lượt chiến đấu.
- Chiến thuật hiện tại, tiếp viện đang đến và hàng đợi thương binh.

Người chơi có thể duy trì nhiều mặt trận khi lãnh thổ lớn hơn, nhưng số mặt trận chủ động phải bị giới hạn để tránh vi mô và chiến thuật mở chiến tranh miễn phí.

## Effective combat power

```text
E = sum(unitCount * unitPower)
    * moraleFactor
    * supplyFactor
    * terrainFactor
    * fortificationFactor
    * tacticFactor
```

Các hệ số sĩ khí và tiếp tế phải có sàn để lực lượng yếu vẫn gây tổn thất, nhưng sĩ khí bằng 0 luôn kết thúc khả năng chiến đấu.

## Combat tactics

| Chiến thuật | Sát thương | Phơi bày | Hiệu ứng chính |
|---|---:|---:|---|
| Bao vây | 0,65 | 0,45 | Phá 12-20 công sự, ép tiếp tế, tổn thất thấp |
| Giao chiến | 1,00 | 1,00 | Nhịp cân bằng, phá 4-8 công sự |
| Tổng công kích | 1,55 | 1,35 | Phá 20-30 công sự, chỉ dùng khi phá thành từ 60 |
| Củng cố | 0,25 | 0,35 | Hồi sĩ khí, nhận tiếp viện, nhường thế chủ động |
| Rút quân | 0 | Theo truy kích | Kết thúc tấn công và chịu tổn thất truy kích có giới hạn |

## Attrition formula

Tỷ lệ quân của bên `X` bị loại khỏi chiến đấu trong một lượt:

```text
lossRateX = clamp(
  0.065
  * sqrt(E_enemy / E_self)
  * exposureX
  * damageEnemy
  * defenseModifiers,
  tacticMin,
  tacticMax
)
```

Khoảng tổn thất theo nhịp chiến đấu:

- Bao vây: 2-6% quân hiện tại.
- Giao chiến: 4-10% quân hiện tại.
- Tổng công kích: 7-15% quân hiện tại.
- Mọi trường hợp gây ít nhất một tổn thất khi hai bên còn quân, tránh bế tắc do làm tròn.
- Không lượt nào được loại quá 15% một lực lượng lớn chỉ bằng sát thương trực tiếp.

Tổn thất được phân bổ theo tỷ lệ binh chủng đang tham chiến. Hệ số căn bậc hai làm lợi thế quân số có ý nghĩa nhưng không tăng sát thương tuyến tính đến mức xóa sổ đối phương trong một lượt.

## Morale and battle duration

```text
moraleLoss =
  5
  + 60 * lossRate
  + supplyPressure
  + strengthPressure
  + max(0, battleTurn - 3) * 2
  + tacticShock
  - fortificationShield
```

Điều kiện kết thúc:

- Quân hoạt động về 0; hoặc
- Sĩ khí về 0, khi đó toàn bộ quân còn lại đầu hàng, tan rã hoặc bị bắt và được tính là đã bị đánh bại; hoặc
- Bên tấn công chủ động rút quân.

Mục tiêu cân bằng:

| Tình huống | Thời lượng mục tiêu |
|---|---:|
| Hai bên cân sức | 5-7 lượt chiến đấu |
| Bên tấn công mạnh khoảng gấp đôi | 3-5 lượt |
| Bên tấn công yếu dưới 60% | Thường rút hoặc thua trong 3-6 lượt |

Từ lượt chiến đấu thứ 8, chi phí tiếp tế tăng 50% và áp lực sĩ khí tăng. Cơ chế này buộc tổng công kích hoặc rút lui mà không dùng giới hạn kết thúc cứng thiếu tự nhiên.

Tiếp viện:

- Đến sau một lượt.
- Tiêu một điểm hành động chiến lược.
- Không vượt quá 25% quân ban đầu của mặt trận mỗi lượt.
- Không đặt lại số lượt chiến đấu hoặc sĩ khí về 100.

## Casualty outcomes

Quân bị loại khỏi chiến đấu không đồng nghĩa toàn bộ tử trận:

| Kết quả | Tỷ lệ nháp | Xử lý |
|---|---:|---|
| Tử trận | 35% | Loại khỏi tổng dân số |
| Bị thương | 40% | Trở lại sau 2-3 lượt theo hàng đợi hồi phục |
| Tan rã hoặc bị bắt | 25% | Không còn chiến đấu; xử lý khi chiến tranh kết thúc |

Tỷ lệ này giảm mức hủy diệt dân số nhưng vẫn khiến chiến tranh kéo dài có giá thực tế.

## Capture and occupation

Khi quân phòng thủ bị đánh bại:

- Quyền sở hữu tỉnh chuyển cho bên thắng.
- Tỉnh chịu chiếm đóng trong ba lượt.
- Sản xuất lần lượt bị giới hạn theo các mức 50%, 70% và 85%.
- Không tuyển quân trong thời gian chiếm đóng.
- Tăng dân số tạm dừng ở lượt đầu và phục hồi dần.
- Ổn định thấp có thể tạo sự kiện nổi loạn, nhưng không sinh quân vô hạn.

Chiếm đóng làm chậm hiệu ứng lăn cầu tuyết và tạo cơ hội phản công.

## Quiz composition

Mỗi lượt tạo một bộ 10 câu:

- Khoảng 4 câu Nhận biết.
- Khoảng 4 câu Thông hiểu.
- Khoảng 2 câu Vận dụng.
- Cân bằng chương theo chu kỳ nhiều lượt.
- Không lặp câu trước khi dùng hết 504 câu.
- Bộ câu hỏi của lượt được tạo và lưu trước khi hiển thị để tải lại trang không đổi câu.
- Mỗi đáp án được lưu ngay, giữ được tiến độ nếu đóng trình duyệt.

Với 50 lượt, người chơi gặp khoảng 500 câu, gần một vòng đầy đủ của ngân hàng hiện tại.

## Quiz rewards and penalties

| Số câu đúng | Kết quả đề xuất |
|---:|---|
| 0-2 | Mất tối đa 10% kho của một tài nguyên, không quá 50% sản lượng một lượt; sản lượng lượt sau giảm 10% |
| 3-4 | Mất tối đa 5% kho, không quá 25% sản lượng một lượt |
| 5 | Trung lập |
| 6-7 | Chọn 25% sản lượng một lượt hoặc dân di cư bằng khoảng 0,5% sức chứa trống |
| 8-9 | Chọn 50% sản lượng một lượt và tăng 10% lĩnh vực đó trong hai lượt |
| 10 | Nhận tối đa một lượt sản lượng và một hiệu ứng mạnh có thời hạn hoặc giảm giá mở khóa |

Nguyên tắc chống vòng xoáy thua:

- Trả lời sai không trực tiếp giết dân hoặc quân.
- Hình phạt bị chặn theo sản lượng, không thể xóa toàn bộ kho lớn.
- Tài nguyên không âm.
- Phần thưởng tăng theo quy mô có giới hạn để không khuếch đại thế lực lớn vô hạn.

## Technical architecture recommendation

Giữ ứng dụng là HTML tĩnh, không chuyển sang framework hoặc backend trong phiên bản này.

Định hướng cấu trúc nguồn:

```text
game/
  data/       province, adjacency, units, balance constants
  engine/     economy, population, diplomacy, AI, combat, quiz rewards
  ui/         map, panels, dialogs, turn report
```

Nguyên tắc:

- `template.html` tiếp tục là nguồn chính; không sửa thủ công `index.html` đã build.
- Engine dùng hàm thuần dữ liệu, không phụ thuộc DOM.
- RNG có seed và seed nằm trong save để lượt có thể tái hiện.
- Save dùng khóa phiên bản như `mln222.game.v1` và có bước kiểm tra schema.
- SVG được đóng gói cục bộ vào bản build; không phụ thuộc mạng khi chơi.
- Dữ liệu tỉnh và bảng kề phải tách khỏi hình học SVG.
- Bảng kề phải đối xứng và được kiểm thử tự động.
- Pipeline build tiếp tục tạo một `index.html` mở được bằng `file://`.

## UI direction

- Thêm chế độ Công thành vào thanh chế độ hiện có.
- Bản đồ là vùng tương tác chính, không đặt trong một card trang trí.
- Thanh tài nguyên cố định hiển thị lượt, lương thực, tiền, dân thường, quân đội và điểm hành động.
- Panel theo ngữ cảnh hiển thị tỉnh, ngoại giao, tuyển quân hoặc mặt trận đang chọn.
- Màu lãnh thổ biểu diễn thế lực; viền và ký hiệu biểu diễn chiến tranh, đồng minh, cảnh báo và chiếm đóng.
- Desktop dùng bản đồ và panel cạnh nhau; mobile dùng bản đồ phía trên và bottom sheet.
- Quiz cuối lượt chiếm một màn hình riêng, giữ giải thích đáp án như chế độ luyện hiện tại.

## Explicitly excluded from MVP

- Multiplayer hoặc tài khoản trực tuyến.
- Đồng bộ save qua máy khác.
- Thời gian thực.
- Cây công trình theo từng tỉnh.
- Tướng lĩnh, trang bị, kỹ năng cá nhân.
- Hải chiến và đảo thành lãnh thổ riêng.
- Vận chuyển kho hàng theo từng tuyến đường.
- Thuế suất và chính sách vi mô từng tỉnh.
- Chiến dịch gắn với một triều đại lịch sử cụ thể.

Các nội dung này chỉ được xem xét sau khi vòng chơi cốt lõi chứng minh được tính học tập và cân bằng.

## Risks and mitigations

| Rủi ro | Tác động | Giảm thiểu |
|---|---|---|
| 10 câu mỗi lượt gây mệt | Bỏ dở chiến dịch | Save liên tục, phiên 45-60 lượt chia được nhiều lần chơi |
| 33 NPC tạo quá nhiều thông báo | Khó theo dõi | Chỉ ưu tiên sự kiện có liên quan hoặc thay đổi lãnh thổ lớn |
| Người thắng tiếp tục lăn cầu tuyết | Mất cạnh tranh | Chiếm đóng, giới hạn mặt trận, tiếp tế và thương mại bị gián đoạn |
| Người thua không thể hồi phục | Bỏ game | Chặn hình phạt quiz, thương binh hồi phục, cảnh báo chiến tranh trước một lượt |
| Một tỉnh khởi đầu vượt trội | Lựa chọn giả | Chuẩn hóa chỉ số, giới hạn chênh lệch lợi thế dưới 20% |
| Hệ số chiến đấu tạo trận vô hạn | Bế tắc | Mất sĩ khí tăng dần và áp lực tiếp tế sau lượt 8 |
| Tải lại để đổi kết quả | Phá tiến độ | RNG, bộ câu hỏi, lựa chọn và đáp án đều được lưu ngay |
| Logic game gắn chặt DOM | Khó kiểm thử | Engine thuần dữ liệu và UI chỉ gửi hành động/đọc trạng thái |

## Success metrics

### Gameplay

- Chiến dịch chuẩn có thể đạt điều kiện thắng trong khoảng 45-60 lượt.
- Trận cân sức có trung vị 5-7 lượt; trận 2:1 có trung vị 3-5 lượt.
- Không lực lượng lớn nào bị xóa trong một lượt chỉ bởi sát thương trực tiếp.
- Huy động dưới 15% dân số vẫn cho tăng trưởng dương rõ rệt.
- Huy động 20-30% tạo áp lực kinh tế; trên 40% không thể duy trì lâu dài.
- Không tỉnh khởi đầu nào tạo lợi thế kinh tế lớn hơn 20% so với chuẩn trước hiệu ứng chiến thuật.

### Learning

- Mỗi lượt có đúng 10 câu.
- Phân bố độ khó xấp xỉ 4/4/2.
- Không lặp trước khi dùng hết ngân hàng, trừ khi bộ lọc hợp lệ không đủ câu.
- Giải thích đáp án vẫn được hiển thị.
- Phần thưởng và hình phạt đúng với điểm, có giới hạn và không tạo tài nguyên âm.

### Technical

- Game mở trực tiếp bằng `file://` và không cần mạng.
- Save và resume khôi phục chính xác lượt, RNG, quiz và mặt trận.
- Mọi bảng tỉnh kề đối xứng.
- `C + A <= K`, quân và tài nguyên không âm trong mọi kiểm thử.
- Engine chạy được mô phỏng tự động không cần DOM.
- UI không tràn ngang hoặc che điều khiển ở desktop và mobile.
- Không có lỗi console trong một chiến dịch mô phỏng đầy đủ.

## Validation strategy

Trước khi tinh chỉnh UI, cần mô phỏng engine với nhiều seed:

- 10.000 trận chiến theo các tỷ lệ lực lượng từ 0,5 đến 3,0.
- 1.000 chiến dịch AI-only để đo thời lượng, tốc độ bành trướng và bế tắc.
- Kiểm thử thuộc tính cho dân số, tài nguyên, tổn thất và quyền sở hữu.
- Kiểm thử hồi quy cho save/load ở giữa lượt, giữa quiz và giữa trận chiến.
- Kiểm thử trình duyệt với bản đồ, chọn tỉnh, kết lượt và một chiến dịch rút gọn.

Không tinh chỉnh bằng cảm giác đơn lẻ. Các hệ số chỉ được chốt sau khi phân phối kết quả đạt tiêu chí nêu trên.

## Recommendations

1. Xây engine và mô phỏng cân bằng trước UI hoàn chỉnh.
2. Hoàn thành một vertical slice gồm chọn tỉnh, một NPC láng giềng, kinh tế một lượt, một trận chiến và quiz cuối lượt.
3. Sau khi vertical slice ổn định mới mở rộng đủ 34 tỉnh và 33 NPC.
4. Giữ dữ liệu cân bằng trong cấu hình, không rải số cố định trong logic.
5. Chỉ thêm hệ thống ngoài MVP khi chiến dịch cốt lõi đạt tiêu chí học và thời lượng.

## Unresolved questions

Không còn câu hỏi chặn lập kế hoạch. Các giá trị chi phí mở khóa, hệ số binh chủng, trọng số tỉnh và ngưỡng thắng là tham số nháp cần được khóa bằng mô phỏng trong giai đoạn triển khai.

## Next steps

- Lập kế hoạch triển khai theo pha, bắt đầu bằng engine thuần dữ liệu và vertical slice.
- Xác định schema save và schema dữ liệu tỉnh trước khi chỉnh giao diện.
- Trích SVG nguồn vào tài sản cục bộ và biên soạn bảng tỉnh kề 34 đơn vị.
- Thiết lập bộ mô phỏng cân bằng trước khi mở rộng AI toàn bản đồ.
