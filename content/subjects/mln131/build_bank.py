"""Build the reviewed MLN131 authored chapter files from explicit question specifications."""

from __future__ import annotations

import json
import random
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent
SOURCE = "giao-trinh-chu-nghia-xa-hoi-khoa-hoc-2021.md"

CHAPTERS = {
    1: ("Nhập môn Chủ nghĩa xã hội khoa học", 35, [9, 9, 9, 8]),
    2: ("Sứ mệnh lịch sử của giai cấp công nhân", 45, [11, 11, 11, 12]),
    3: ("Chủ nghĩa xã hội và thời kỳ quá độ lên chủ nghĩa xã hội", 45, [11, 11, 12, 11]),
    4: ("Dân chủ xã hội chủ nghĩa và Nhà nước xã hội chủ nghĩa", 40, [10, 10, 10, 10]),
    5: ("Cơ cấu xã hội – giai cấp và liên minh giai cấp, tầng lớp trong thời kỳ quá độ lên chủ nghĩa xã hội", 35, [9, 9, 8, 9]),
    6: ("Vấn đề dân tộc và tôn giáo trong thời kỳ quá độ lên chủ nghĩa xã hội", 45, [12, 11, 11, 11]),
    7: ("Vấn đề gia đình trong thời kỳ quá độ lên chủ nghĩa xã hội", 35, [8, 9, 9, 9]),
}

# Each item is: topic, stem, correct option, three distractors, grounded explanation/evidence.
GROUPS: dict[int, list[dict]] = {
    1: [
        {
            "section": "Chương 1 > B.1 > Khái niệm và điều kiện ra đời của Chủ nghĩa xã hội khoa học",
            "difficulty": [3, 3, 1],
            "items": [
                ["Nghĩa rộng của chủ nghĩa xã hội khoa học", "Theo nghĩa rộng, chủ nghĩa xã hội khoa học được hiểu như thế nào?", "Là chủ nghĩa Mác – Lênin xét như một chỉnh thể luận giải sự chuyển biến lên xã hội cộng sản", "Là riêng học thuyết kinh tế về giá trị thặng dư trong chủ nghĩa tư bản", "Là tập hợp mọi tư tưởng bình đẳng xuất hiện trước thế kỷ XIX", "Là chương trình quản lý hành chính của một nhà nước xã hội chủ nghĩa", "Theo nghĩa rộng, chủ nghĩa xã hội khoa học đồng nhất với chủ nghĩa Mác – Lênin trong việc luận giải quá trình tất yếu từ chủ nghĩa tư bản lên chủ nghĩa xã hội và chủ nghĩa cộng sản."],
                ["Nghĩa hẹp của chủ nghĩa xã hội khoa học", "Nội dung nào mô tả đúng nghĩa hẹp của chủ nghĩa xã hội khoa học?", "Một trong ba bộ phận cấu thành chủ nghĩa Mác – Lênin, nghiên cứu các quy luật chính trị – xã hội của sự chuyển biến", "Toàn bộ triết học duy vật biện chứng và duy vật lịch sử", "Khoa học chuyên nghiên cứu kỹ thuật tổ chức sản xuất công nghiệp", "Hệ tư tưởng chung của mọi phong trào phản đối bất công", "Theo nghĩa hẹp, đây là một trong ba bộ phận cấu thành chủ nghĩa Mác – Lênin và tập trung vào các quy luật chính trị – xã hội của quá trình chuyển biến cách mạng."],
                ["Ba bộ phận của chủ nghĩa Mác – Lênin", "Chủ nghĩa xã hội khoa học đứng trong quan hệ nào với triết học và kinh tế chính trị học Mác – Lênin?", "Cùng với hai bộ phận ấy tạo thành ba bộ phận cấu thành thống nhất của chủ nghĩa Mác – Lênin", "Thay thế hai bộ phận ấy khi nghiên cứu xã hội hiện đại", "Chỉ vận dụng kết luận của kinh tế chính trị và không liên quan đến triết học", "Là môn lịch sử tách biệt, không có cơ sở phương pháp luận chung", "Giáo trình trình bày triết học, kinh tế chính trị học và chủ nghĩa xã hội khoa học như ba bộ phận cấu thành có quan hệ hữu cơ trong chủ nghĩa Mác – Lênin."],
                ["Điều kiện kinh tế – xã hội", "Sự phát triển của đại công nghiệp tư bản chủ nghĩa tạo tiền đề trực tiếp nào cho chủ nghĩa xã hội khoa học?", "Làm bộc lộ mâu thuẫn giữa lực lượng sản xuất xã hội hóa với quan hệ sản xuất dựa trên chiếm hữu tư nhân", "Xóa bỏ ngay sự đối lập lợi ích giữa người lao động và nhà tư bản", "Làm cho sản xuất nhỏ trở thành hình thức thống trị lâu dài của nền kinh tế", "Khiến mâu thuẫn xã hội chỉ còn là khác biệt về lối sống cá nhân", "Đại công nghiệp vừa phát triển lực lượng sản xuất mang tính xã hội hóa, vừa làm sâu sắc mâu thuẫn với chế độ chiếm hữu tư nhân tư bản chủ nghĩa."],
                ["Phong trào công nhân", "Vì sao phong trào công nhân thế kỷ XIX đặt ra yêu cầu về một lý luận khoa học?", "Phong trào phát triển từ tự phát lên tự giác và cần lý luận chỉ đường cho mục tiêu, lực lượng, phương pháp đấu tranh", "Phong trào đã hoàn thành mục tiêu chính trị nên chỉ cần tổng kết kinh nghiệm", "Công nhân muốn tách hoàn toàn đấu tranh kinh tế khỏi đấu tranh chính trị", "Các cuộc đấu tranh đều do giới quý tộc lãnh đạo nên thiếu một học thuyết bảo thủ", "Sự trưởng thành của phong trào công nhân đòi hỏi một hệ thống lý luận khoa học giúp nhận rõ sứ mệnh, mục tiêu và con đường đấu tranh."],
                ["Quan hệ giữa tiền đề khách quan và lý luận", "Cách giải thích nào đúng về vai trò của điều kiện kinh tế – xã hội đối với sự ra đời học thuyết?", "Chúng tạo cơ sở hiện thực và nhu cầu lịch sử, còn sự ra đời học thuyết cần hoạt động lý luận của Mác và Ăngghen", "Chúng tự động sản sinh một học thuyết hoàn chỉnh mà không cần chủ thể nhận thức", "Chúng chỉ cung cấp ví dụ minh họa sau khi học thuyết đã hoàn thành", "Chúng quyết định mọi câu chữ của học thuyết và loại bỏ vai trò kế thừa tư tưởng", "Điều kiện khách quan làm xuất hiện nhu cầu và vật liệu hiện thực; vai trò chủ thể của Mác và Ăngghen biến các tiền đề đó thành lý luận khoa học."],
                ["Vận dụng điều kiện ra đời", "Một nhóm nghiên cứu chỉ liệt kê các cuộc đấu tranh công nhân để giải thích sự ra đời của chủ nghĩa xã hội khoa học. Cần bổ sung yếu tố nào để lập luận đầy đủ hơn?", "Sự phát triển của đại công nghiệp, các tiền đề khoa học – tư tưởng và vai trò của Mác, Ăngghen", "Danh sách các nhà nước phong kiến và chính sách thuế của họ", "Số lượng phát minh kỹ thuật nhưng không xét biến đổi xã hội", "Tiểu sử các nhà không tưởng mà không xét phong trào công nhân", "Sự ra đời của học thuyết là kết quả tổng hợp của điều kiện kinh tế – xã hội, tiền đề khoa học và tư tưởng, cùng vai trò sáng tạo của Mác và Ăngghen."],
            ],
        },
        {
            "section": "Chương 1 > B.1.1.2 > Tiền đề khoa học tự nhiên và tư tưởng lý luận",
            "difficulty": [3, 3, 1],
            "items": [
                ["Ba phát minh khoa học tự nhiên", "Tổ hợp nào gồm ba phát minh khoa học tự nhiên tiêu biểu làm tiền đề cho thế giới quan mới ở thế kỷ XIX?", "Học thuyết tiến hóa, định luật bảo toàn và chuyển hóa năng lượng, học thuyết tế bào", "Cơ học lượng tử, thuyết tương đối và học thuyết tế bào", "Định luật vạn vật hấp dẫn, bảng tuần hoàn và thuyết nhật tâm", "Thuyết tương đối, di truyền học phân tử và định luật nhiệt động lực học", "Giáo trình nêu ba thành tựu tiêu biểu là học thuyết tiến hóa, định luật bảo toàn và chuyển hóa năng lượng, và học thuyết tế bào."],
                ["Tiền đề triết học", "Nguồn lý luận trực tiếp về triết học được Mác và Ăngghen kế thừa có phê phán là gì?", "Triết học cổ điển Đức, đặc biệt phép biện chứng và chủ nghĩa duy vật", "Triết học kinh viện trung cổ với phương pháp giáo điều", "Chủ nghĩa thực chứng thế kỷ XX và phân tâm học", "Tư tưởng pháp quyền La Mã tách khỏi triết học hiện đại", "Triết học cổ điển Đức là một trong ba nguồn lý luận; Mác và Ăngghen kế thừa hạt nhân hợp lý đồng thời khắc phục tính duy tâm và hạn chế siêu hình."],
                ["Tiền đề kinh tế chính trị", "Kinh tế chính trị cổ điển Anh cung cấp tiền đề trực tiếp nào cho lý luận của Mác và Ăngghen?", "Những thành tựu nghiên cứu về lao động, giá trị và các quan hệ kinh tế của xã hội tư bản", "Một mô hình phủ nhận hoàn toàn vai trò của lao động trong tạo ra giá trị", "Học thuyết quản trị doanh nghiệp số và thị trường tài chính hiện đại", "Quan niệm coi mọi quan hệ kinh tế chỉ do ý chí nhà nước quyết định", "Kinh tế chính trị cổ điển Anh đã đạt những kết quả quan trọng về lao động và giá trị, tạo nguồn lý luận để Mác phát triển kinh tế chính trị học khoa học."],
                ["Chủ nghĩa xã hội không tưởng phê phán", "Ba đại biểu tiêu biểu của chủ nghĩa xã hội không tưởng phê phán đầu thế kỷ XIX là ai?", "Saint-Simon, Fourier và Robert Owen", "Hegel, Feuerbach và Kant", "Adam Smith, David Ricardo và William Petty", "Darwin, Schwann và Mayer", "Giáo trình xác định Saint-Simon, Charles Fourier và Robert Owen là ba nhà xã hội chủ nghĩa không tưởng phê phán tiêu biểu đầu thế kỷ XIX."],
                ["Giá trị của tư tưởng không tưởng", "Đóng góp quan trọng nào của chủ nghĩa xã hội không tưởng phê phán được giáo trình ghi nhận?", "Phê phán xã hội tư bản và nêu nhiều dự đoán có giá trị về xã hội tương lai", "Phát hiện đầy đủ quy luật giá trị thặng dư và sứ mệnh lịch sử của công nhân", "Xây dựng hoàn chỉnh lý luận về đảng cộng sản và nhà nước vô sản", "Chứng minh xã hội mới sẽ tự xuất hiện mà không cần hoạt động của con người", "Các nhà không tưởng phê phán mạnh mẽ bất công tư bản và nêu nhiều giá trị nhân đạo, dự đoán tiến bộ về xã hội tương lai."],
                ["Hạn chế của tư tưởng không tưởng", "Vì sao chủ nghĩa xã hội không tưởng chưa trở thành một học thuyết khoa học về con đường giải phóng xã hội?", "Chưa phát hiện quy luật vận động của tư bản và lực lượng xã hội có khả năng thực hiện chuyển biến", "Chỉ vì các tác giả không viết tác phẩm về xã hội tương lai", "Vì hoàn toàn tán thành chế độ tư hữu tư bản chủ nghĩa", "Vì chỉ nghiên cứu khoa học tự nhiên mà không bàn đến xã hội", "Hạn chế cốt lõi là chưa chỉ ra bản chất và quy luật của chủ nghĩa tư bản, cũng chưa nhận ra sứ mệnh lịch sử của giai cấp công nhân."],
                ["Đánh giá một đề án không tưởng", "Một đề án muốn xây xã hội bình đẳng chỉ bằng thuyết phục người giàu làm gương, không phân tích quy luật và lực lượng thực hiện. Theo giáo trình, hạn chế này gần với khuynh hướng nào?", "Chủ nghĩa xã hội không tưởng do dựa chủ yếu vào mong muốn đạo đức và thiếu cơ sở khoa học", "Chủ nghĩa duy vật lịch sử vì đã xác định đúng động lực giai cấp", "Kinh tế chính trị Mác-xít vì đã làm rõ giá trị thặng dư", "Chủ nghĩa xã hội khoa học vì đã gắn mục tiêu với lực lượng hiện thực", "Đặt hy vọng vào thiện chí mà không xác định quy luật khách quan và chủ thể xã hội là biểu hiện điển hình của tính không tưởng."],
            ],
        },
        {
            "section": "Chương 1 > B.1.2 > Vai trò của C. Mác và Ph. Ăngghen",
            "difficulty": [3, 2, 2],
            "items": [
                ["Chuyển biến lập trường triết học", "Sự chuyển biến triết học của Mác và Ăngghen diễn ra theo hướng nào?", "Từ chủ nghĩa duy tâm sang chủ nghĩa duy vật, từ lập trường dân chủ cách mạng sang lập trường cộng sản", "Từ chủ nghĩa duy vật sang chủ nghĩa duy tâm, từ cộng sản sang tự do", "Từ phép biện chứng sang phương pháp siêu hình, từ cách mạng sang bảo thủ", "Từ kinh tế chính trị sang khoa học tự nhiên, không liên quan lập trường chính trị", "Quá trình hoạt động lý luận và thực tiễn đưa Mác, Ăngghen đến thế giới quan duy vật và lập trường cộng sản chủ nghĩa."],
                ["Chủ nghĩa duy vật lịch sử", "Phát kiến chủ nghĩa duy vật lịch sử giúp làm sáng tỏ vấn đề nào?", "Quy luật vận động của lịch sử xã hội và vai trò quyết định xét đến cùng của sản xuất vật chất", "Cơ chế di truyền của tế bào và sự tiến hóa sinh học", "Cách xác định giá hàng hóa chỉ bằng quan hệ cung cầu", "Quy luật tổ chức nội bộ của riêng các đảng chính trị", "Chủ nghĩa duy vật lịch sử chỉ ra cơ sở vật chất và các quy luật khách quan của sự phát triển xã hội, khắc phục cách giải thích duy tâm về lịch sử."],
                ["Học thuyết giá trị thặng dư", "Học thuyết giá trị thặng dư vạch rõ bí mật kinh tế nào của chủ nghĩa tư bản?", "Nguồn gốc lợi nhuận tư bản từ phần giá trị do công nhân tạo ra vượt quá giá trị sức lao động", "Lợi nhuận hình thành hoàn toàn do nhà tư bản tiết kiệm trong tiêu dùng", "Mọi thu nhập trong xã hội đều là kết quả trực tiếp của trao đổi ngang giá", "Bóc lột chỉ xuất hiện khi hàng hóa được bán cao hơn giá trị", "Phát kiến này giải thích cơ chế bóc lột trong quan hệ sản xuất tư bản chủ nghĩa thông qua việc chiếm đoạt giá trị thặng dư."],
                ["Sứ mệnh lịch sử của giai cấp công nhân", "Phát kiến nào biến chủ nghĩa xã hội từ không tưởng thành khoa học về chủ thể thực hiện?", "Học thuyết về sứ mệnh lịch sử thế giới của giai cấp công nhân", "Học thuyết tế bào về cấu tạo của cơ thể sống", "Thuyết phân quyền trong tổ chức nhà nước tư sản", "Quan niệm cải tạo xã hội bằng các cộng đồng mẫu đơn lẻ", "Việc phát hiện giai cấp công nhân là lực lượng xã hội có sứ mệnh xóa bỏ chủ nghĩa tư bản đã xác định chủ thể hiện thực của sự chuyển biến."],
                ["Tuyên ngôn của Đảng Cộng sản", "Tác phẩm nào đánh dấu sự ra đời cơ bản của chủ nghĩa xã hội khoa học?", "Tuyên ngôn của Đảng Cộng sản do Mác và Ăngghen công bố năm 1848", "Tư bản do Mác xuất bản tập đầu tiên năm 1867", "Chống Đuy-rinh do Ăngghen xuất bản cuối thế kỷ XIX", "Nhà nước và cách mạng do Lênin viết năm 1917", "Tuyên ngôn của Đảng Cộng sản là cương lĩnh chính trị đầu tiên của phong trào cộng sản và đánh dấu sự hình thành cơ bản của học thuyết."],
                ["Điều kiện đủ của sự ra đời học thuyết", "Nếu các tiền đề khách quan đã chín muồi nhưng thiếu hoạt động khoa học và thực tiễn của Mác, Ăngghen, kết luận nào hợp lý nhất?", "Các tiền đề chưa tự chuyển thành một hệ thống chủ nghĩa xã hội khoa học hoàn chỉnh", "Học thuyết vẫn tất yếu xuất hiện với nội dung giống hệt và cùng thời điểm", "Phong trào công nhân tự động tạo ra ba phát kiến lý luận không cần nghiên cứu", "Các nhà không tưởng đã có thể thay thế hoàn toàn vai trò của Mác và Ăngghen", "Tiền đề khách quan là điều kiện cần; tài năng, lập trường và lao động khoa học của Mác, Ăngghen là nhân tố chủ quan có ý nghĩa quyết định để hình thành học thuyết."],
                ["Quan hệ giữa ba phát kiến", "Một bài thuyết trình giải thích xã hội bằng duy vật lịch sử và bóc lột bằng giá trị thặng dư nhưng bỏ qua lực lượng chuyển biến. Cần bổ sung nội dung nào?", "Sứ mệnh lịch sử của giai cấp công nhân với tư cách chủ thể cách mạng", "Thuyết tế bào với tư cách mô hình tổ chức xã hội", "Quan niệm cải lương bằng lòng nhân ái của tầng lớp thống trị", "Lý thuyết cân bằng thị trường không xét quan hệ giai cấp", "Ba phát kiến liên kết với nhau: quy luật lịch sử, bản chất kinh tế của tư bản và chủ thể có khả năng thực hiện sự chuyển biến cách mạng."],
            ],
        },
        {
            "section": "Chương 1 > B.2 > Các giai đoạn phát triển của Chủ nghĩa xã hội khoa học",
            "difficulty": [2, 3, 2],
            "items": [
                ["Giai đoạn Mác và Ăngghen", "Trong giai đoạn từ 1848 đến Công xã Paris, Mác và Ăngghen chủ yếu phát triển học thuyết qua hoạt động nào?", "Gắn nghiên cứu lý luận với tổng kết thực tiễn đấu tranh của phong trào công nhân", "Tách lý luận khỏi phong trào để bảo đảm tính thuần túy học thuật", "Chỉ nghiên cứu mô hình cộng đồng không tưởng ở quy mô nhỏ", "Từ bỏ quan điểm cách mạng sau khi Tuyên ngôn được công bố", "Mác và Ăngghen liên tục kiểm nghiệm, bổ sung lý luận thông qua thực tiễn cách mạng và phong trào công nhân quốc tế."],
                ["Bài học Công xã Paris", "Việc tổng kết Công xã Paris giúp Mác và Ăngghen nhấn mạnh yêu cầu nào?", "Giai cấp công nhân phải đập tan bộ máy nhà nước tư sản và xây dựng quyền lực chính trị mới", "Có thể sử dụng nguyên vẹn bộ máy nhà nước tư sản để giải phóng lao động", "Đấu tranh kinh tế tự phát đủ thay thế mọi hình thức đấu tranh chính trị", "Cách mạng chỉ cần diễn ra trong phạm vi một xí nghiệp riêng lẻ", "Kinh nghiệm Công xã Paris làm sâu sắc lý luận về nhà nước, chuyên chính vô sản và hình thức quyền lực của giai cấp công nhân."],
                ["Lênin trước Cách mạng Tháng Mười", "Đóng góp nổi bật của Lênin trong điều kiện chủ nghĩa tư bản chuyển sang đế quốc chủ nghĩa là gì?", "Phát triển lý luận về đảng kiểu mới, cách mạng vô sản và khả năng thắng lợi ở một số nước", "Phủ nhận vai trò của tổ chức chính trị trong phong trào công nhân", "Khẳng định cách mạng chỉ có thể thắng đồng thời ở tất cả các nước", "Giới hạn chủ nghĩa xã hội khoa học ở việc phê phán đạo đức", "Lênin bảo vệ và phát triển học thuyết trong thời đại đế quốc chủ nghĩa, đặc biệt về đảng cách mạng và quy luật cách mạng vô sản."],
                ["Lênin sau Cách mạng Tháng Mười", "Sau Cách mạng Tháng Mười, trọng tâm phát triển lý luận của Lênin chuyển mạnh sang vấn đề nào?", "Xây dựng chủ nghĩa xã hội trong thực tiễn, tổ chức nhà nước mới và chính sách kinh tế phù hợp", "Khôi phục nguyên trạng chế độ chính trị và kinh tế tư bản trước cách mạng", "Từ bỏ liên minh công – nông và vai trò lãnh đạo của đảng", "Chỉ nghiên cứu lịch sử tư tưởng không tưởng ở Tây Âu", "Thực tiễn nước Nga Xô viết đặt ra các vấn đề mới về chính quyền, kinh tế, liên minh xã hội và con đường xây dựng xã hội mới."],
                ["Phát triển sau Lênin", "Sau khi Lênin qua đời, chủ nghĩa xã hội khoa học được phát triển trong bối cảnh nào?", "Vừa xây dựng chủ nghĩa xã hội hiện thực, vừa đấu tranh giải phóng dân tộc và điều chỉnh mô hình qua thực tiễn", "Chỉ còn là học thuyết lịch sử, không liên hệ với các phong trào xã hội", "Được áp dụng theo một mô hình bất biến cho mọi quốc gia và thời đại", "Chấm dứt mọi tranh luận sau khi một nước xây dựng chủ nghĩa xã hội", "Giáo trình khái quát quá trình phát triển phong phú nhưng phức tạp, gồm thành tựu, khủng hoảng và những tìm tòi đổi mới ở nhiều quốc gia."],
                ["Đổi mới ở Việt Nam", "Theo giáo trình, thực tiễn đổi mới ở Việt Nam đóng góp vào sự phát triển lý luận theo hướng nào?", "Làm rõ hơn con đường đi lên chủ nghĩa xã hội phù hợp điều kiện Việt Nam", "Thay thế mục tiêu xã hội chủ nghĩa bằng mục tiêu tư bản chủ nghĩa", "Sao chép đầy đủ mô hình quản lý của một quốc gia khác", "Tách phát triển kinh tế khỏi tiến bộ và công bằng xã hội", "Đường lối đổi mới vừa kiên định mục tiêu xã hội chủ nghĩa vừa bổ sung nhận thức về mô hình, bước đi và phương thức phát triển phù hợp Việt Nam."],
                ["Vận dụng sáng tạo học thuyết", "Một quốc gia áp dụng nguyên xi mọi biện pháp của mô hình lịch sử khác dù điều kiện đã thay đổi. Cách làm đó trái với bài học phương pháp nào?", "Phải vận dụng và phát triển sáng tạo lý luận trên cơ sở điều kiện lịch sử – cụ thể", "Chỉ cần giữ nguyên biện pháp cũ vì lý luận không bao giờ cần bổ sung", "Nên bỏ toàn bộ nguyên lý chung để lựa chọn mục tiêu ngắn hạn", "Mọi quốc gia đều phải trải qua một lịch trình và hình thức tổ chức giống nhau", "Lịch sử phát triển học thuyết cho thấy phải thống nhất kiên định nguyên lý với tổng kết thực tiễn và vận dụng sáng tạo trong hoàn cảnh cụ thể."],
            ],
        },
        {
            "section": "Chương 1 > B.3 > Đối tượng, phương pháp và ý nghĩa nghiên cứu",
            "difficulty": [3, 3, 1],
            "items": [
                ["Đối tượng nghiên cứu", "Đối tượng nghiên cứu trực tiếp của chủ nghĩa xã hội khoa học là gì?", "Các quy luật và tính quy luật chính trị – xã hội của quá trình phát sinh, hình thành và phát triển hình thái cộng sản chủ nghĩa", "Mọi quy luật của tự nhiên và xã hội không phân biệt lĩnh vực", "Kỹ thuật quản trị sản xuất trong từng doanh nghiệp công nghiệp", "Tiểu sử đầy đủ của các nhà tư tưởng xã hội chủ nghĩa", "Môn học nghiên cứu các quy luật chính trị – xã hội, điều kiện, con đường, hình thức và phương pháp đấu tranh để chuyển biến sang xã hội mới."],
                ["Khách thể và đối tượng", "Cách phân biệt nào đúng giữa khách thể và đối tượng của môn học?", "Khách thể là quá trình xã hội rộng lớn; đối tượng là các quy luật chính trị – xã hội được môn học tập trung khám phá", "Khách thể và đối tượng là hai từ đồng nghĩa hoàn toàn trong mọi nghiên cứu", "Khách thể chỉ là tài liệu thành văn; đối tượng chỉ là tiểu sử tác giả", "Khách thể là phương pháp nghiên cứu; đối tượng là kết quả kiểm tra", "Quá trình chuyển biến xã hội là phạm vi hiện thực, còn môn học lựa chọn các quy luật và quan hệ chính trị – xã hội cốt lõi làm đối tượng trực tiếp."],
                ["Phương pháp luận chung", "Cơ sở phương pháp luận chung của việc nghiên cứu chủ nghĩa xã hội khoa học là gì?", "Chủ nghĩa duy vật biện chứng và chủ nghĩa duy vật lịch sử", "Chủ nghĩa kinh nghiệm thuần túy và suy đoán đạo đức", "Phương pháp thực nghiệm sinh học áp dụng nguyên vẹn cho xã hội", "Phương pháp siêu hình tách các hiện tượng khỏi quan hệ phát triển", "Duy vật biện chứng và duy vật lịch sử giúp xem xét hiện tượng xã hội trong quan hệ, vận động và điều kiện lịch sử cụ thể."],
                ["Phương pháp lịch sử và logic", "Kết hợp phương pháp lịch sử với logic nhằm đạt mục đích nào?", "Tái hiện quá trình cụ thể đồng thời rút ra bản chất, quan hệ và xu hướng có tính quy luật", "Chỉ sắp xếp sự kiện theo niên đại mà không cần khái quát", "Chỉ xây dựng khái niệm trừu tượng và bỏ qua diễn biến thực tế", "Thay chứng cứ lịch sử bằng các phán đoán chủ quan", "Phương pháp lịch sử theo dõi sự vận động cụ thể, còn phương pháp logic khái quát bản chất và quy luật; hai phương pháp cần hỗ trợ nhau."],
                ["Phương pháp khảo sát và phân tích", "Khi nghiên cứu biến đổi cơ cấu giai cấp hiện nay, lựa chọn phương pháp nào phù hợp với tinh thần giáo trình?", "Kết hợp khảo sát thực tiễn, phân tích – tổng hợp và so sánh trong khung phương pháp luận duy vật", "Chỉ dựa vào một ví dụ cá nhân rồi khái quát cho toàn xã hội", "Chỉ suy luận từ định nghĩa cũ mà không kiểm tra dữ liệu mới", "Thay toàn bộ phân tích xã hội bằng thí nghiệm phòng lab", "Môn học sử dụng nhiều phương pháp cụ thể như khảo sát, phân tích, tổng hợp, so sánh nhưng đều đặt trên nền tảng phương pháp luận chung."],
                ["Ý nghĩa lý luận", "Học tập chủ nghĩa xã hội khoa học có ý nghĩa lý luận chủ yếu nào?", "Trang bị nhận thức khoa học về quy luật, con đường và mục tiêu của quá trình xây dựng xã hội mới", "Cung cấp các công thức kỹ thuật có thể áp dụng giống nhau ở mọi nơi", "Thay thế việc học triết học và kinh tế chính trị Mác – Lênin", "Giúp ghi nhớ sự kiện mà không cần hiểu bản chất và quan hệ", "Kiến thức môn học góp phần củng cố thế giới quan, phương pháp luận và nhận thức khoa học về con đường đi lên chủ nghĩa xã hội."],
                ["Ý nghĩa thực tiễn", "Một sinh viên dùng lý luận để phân tích cả thành tựu, hạn chế và điều kiện cụ thể của công cuộc đổi mới. Việc đó thể hiện ý nghĩa nào của môn học?", "Gắn tri thức khoa học với đánh giá thực tiễn và trách nhiệm tham gia xây dựng, bảo vệ chế độ", "Dùng lý luận như khuôn mẫu để bỏ qua mọi dữ kiện trái với dự đoán", "Tách niềm tin chính trị khỏi nhận thức khoa học và hành động", "Giới hạn môn học ở việc học thuộc các thuật ngữ lịch sử", "Ý nghĩa thực tiễn nằm ở năng lực nhận diện đúng vấn đề, củng cố niềm tin có cơ sở và hành động phù hợp trong xây dựng, bảo vệ Tổ quốc."],
            ],
        },
    ],
    2: [
        {"section": "Chương 2 > B.1.1 > Khái niệm và đặc điểm giai cấp công nhân", "difficulty": [4, 3, 2], "items": [
            ["phương diện kinh tế – xã hội của giai cấp công nhân", "Họ lao động bằng phương thức công nghiệp, gắn với công cụ sản xuất hiện đại và tính xã hội hóa cao", "Họ chủ yếu lao động riêng lẻ bằng công cụ thủ công", "Họ được xác định trước hết bởi mức thu nhập cao", "Họ không tham gia quá trình sản xuất vật chất"],
            ["phương diện chính trị – xã hội của giai cấp công nhân", "Trong chủ nghĩa tư bản, họ không sở hữu tư liệu sản xuất chủ yếu và phải bán sức lao động", "Họ sở hữu toàn bộ tư liệu sản xuất chủ yếu", "Họ sống chủ yếu bằng địa tô từ ruộng đất", "Họ đứng ngoài quan hệ thuê mướn lao động"],
            ["đặc trưng lao động công nghiệp", "Lao động có tính tổ chức, kỷ luật, hợp tác và ngày càng xã hội hóa", "Lao động luôn phân tán và không cần phối hợp", "Lao động chỉ dựa vào kinh nghiệm gia đình", "Lao động không chịu tác động của khoa học công nghệ"],
            ["giai cấp công nhân trong xã hội tư bản", "Địa vị của họ đối lập cơ bản với giai cấp tư sản trong quan hệ sản xuất", "Họ và tư sản có lợi ích căn bản hoàn toàn thống nhất", "Họ là tầng lớp sở hữu tư bản tài chính", "Họ không tạo ra giá trị cho xã hội"],
            ["giai cấp công nhân trong xã hội xã hội chủ nghĩa", "Họ cùng nhân dân lao động làm chủ những tư liệu sản xuất chủ yếu", "Họ tiếp tục là giai cấp làm thuê bị tư sản bóc lột", "Họ tách khỏi liên minh với các tầng lớp lao động", "Họ mất vai trò trong tổ chức sản xuất hiện đại"],
            ["sản phẩm của nền đại công nghiệp", "Giai cấp công nhân ra đời và phát triển cùng nền đại công nghiệp", "Giai cấp công nhân xuất hiện trước mọi hình thức sản xuất", "Giai cấp công nhân chỉ do ý chí chính trị tạo ra", "Giai cấp công nhân không liên hệ với công nghiệp hóa"],
            ["tính tiên tiến của giai cấp công nhân", "Địa vị gắn với lực lượng sản xuất hiện đại tạo cơ sở cho vai trò tiên phong", "Tính tiên tiến bắt nguồn từ đặc quyền sở hữu tư nhân", "Tính tiên tiến do đứng ngoài mọi xung đột xã hội", "Tính tiên tiến đồng nghĩa với số lượng đông nhất"],
            ["nhận diện công nhân hiện đại", "Cần xét cả phương thức lao động công nghiệp và địa vị trong quan hệ sản xuất", "Chỉ cần xét trang phục và nơi cư trú", "Chỉ cần xét mức lương tại một thời điểm", "Chỉ cần xét người đó có làm việc chân tay hay không"],
            ["trường hợp kỹ sư làm thuê trong nhà máy", "Có thể thuộc giai cấp công nhân hiện đại nếu lao động trong hệ thống công nghiệp và không sở hữu tư liệu chủ yếu", "Không thể là công nhân vì có trình độ chuyên môn", "Đương nhiên là tư sản vì sử dụng công nghệ", "Không thuộc giai cấp nào vì không trực tiếp lao động chân tay"],
        ]},
        {"section": "Chương 2 > B.1.2 > Nội dung và đặc điểm sứ mệnh lịch sử", "difficulty": [4, 3, 2], "items": [
            ["nội dung kinh tế của sứ mệnh lịch sử", "Phát triển lực lượng sản xuất hiện đại và tạo tiền đề vật chất cho quan hệ sản xuất mới", "Duy trì lâu dài chế độ chiếm hữu tư nhân tư bản", "Tách lao động khỏi tiến bộ khoa học kỹ thuật", "Thu hẹp sản xuất về quy mô tự cấp tự túc"],
            ["nội dung chính trị – xã hội của sứ mệnh", "Đấu tranh giành quyền lực và xây dựng nhà nước của nhân dân lao động", "Tránh mọi hình thức tổ chức và đấu tranh chính trị", "Trao toàn bộ quyền lực cho giai cấp tư sản", "Chỉ cải thiện tiền lương trong từng doanh nghiệp"],
            ["nội dung văn hóa – tư tưởng của sứ mệnh", "Xây dựng hệ giá trị mới, đấu tranh khắc phục ý thức hệ và tập quán lạc hậu", "Phủ nhận mọi thành tựu văn hóa của nhân loại", "Chỉ thay đổi kỹ thuật sản xuất mà không đổi đời sống tinh thần", "Áp đặt lối sống đồng nhất và loại bỏ nhu cầu cá nhân"],
            ["mục tiêu giải phóng của sứ mệnh", "Giải phóng giai cấp công nhân, nhân dân lao động và tiến tới giải phóng con người", "Thay vị trí thống trị của một thiểu số bằng thiểu số khác", "Chỉ giải phóng người lao động trong một ngành", "Duy trì sự phân chia giai cấp như một mục tiêu lâu dài"],
            ["tính khách quan của sứ mệnh", "Bắt nguồn từ địa vị kinh tế và chính trị – xã hội của giai cấp công nhân", "Bắt nguồn từ mong muốn chủ quan của một cá nhân", "Bắt nguồn từ ưu thế sở hữu tư bản của công nhân", "Bắt nguồn từ việc công nhân đứng ngoài sản xuất"],
            ["tính tự giác trong thực hiện sứ mệnh", "Đòi hỏi giác ngộ lý luận, tổ chức và sự lãnh đạo của đảng cộng sản", "Chỉ cần phản ứng tự phát trước khó khăn kinh tế", "Không cần mục tiêu chính trị hoặc tổ chức", "Chỉ dựa vào sự nhượng bộ tự nguyện của tư sản"],
            ["tính triệt để của cách mạng vô sản", "Hướng tới xóa bỏ chế độ người bóc lột người chứ không lập đặc quyền bóc lột mới", "Hướng tới đổi chỗ hai nhóm sở hữu tư nhân", "Hướng tới duy trì nguyên vẹn quan hệ tư bản", "Hướng tới tách công nhân khỏi nhân dân lao động"],
            ["mối liên hệ ba nội dung sứ mệnh", "Kinh tế, chính trị – xã hội và văn hóa – tư tưởng gắn bó trong một quá trình cải biến toàn diện", "Ba nội dung loại trừ và có thể thay thế nhau", "Chỉ nội dung kinh tế có ý nghĩa còn hai nội dung kia không cần thiết", "Nội dung văn hóa phải hoàn tất trước khi có mọi biến đổi kinh tế"],
            ["đánh giá chương trình chỉ tăng năng suất", "Chương trình chưa đủ nếu không gắn phát triển kinh tế với biến đổi chính trị – xã hội và văn hóa", "Chương trình đã hoàn thành toàn bộ sứ mệnh lịch sử", "Chương trình chứng minh sứ mệnh chỉ là vấn đề kỹ thuật", "Chương trình cho phép bỏ qua mục tiêu giải phóng con người"],
        ]},
        {"section": "Chương 2 > B.1.3 > Điều kiện thực hiện sứ mệnh lịch sử", "difficulty": [4, 4, 1], "items": [
            ["địa vị kinh tế của giai cấp công nhân", "Sự gắn bó với lực lượng sản xuất tiên tiến tạo cơ sở vật chất cho khả năng cải tạo xã hội", "Sở hữu tư nhân lớn giúp công nhân duy trì trật tự tư bản", "Vị trí ngoài sản xuất giúp công nhân lãnh đạo sản xuất", "Lao động phân tán khiến công nhân không cần tổ chức"],
            ["địa vị chính trị – xã hội của giai cấp công nhân", "Lợi ích căn bản đối lập với tư sản và thống nhất với đông đảo người lao động", "Lợi ích căn bản đồng nhất với giai cấp tư sản", "Lợi ích tách biệt hoàn toàn với các tầng lớp lao động", "Lợi ích chỉ giới hạn ở tiêu dùng cá nhân"],
            ["sự phát triển về số lượng", "Là một điều kiện chủ quan cần gắn với cơ cấu hợp lý và chất lượng của giai cấp", "Tự nó bảo đảm hoàn thành sứ mệnh trong mọi hoàn cảnh", "Không liên hệ với quá trình công nghiệp hóa", "Có thể thay thế hoàn toàn giác ngộ và tổ chức"],
            ["sự phát triển về chất lượng", "Thể hiện ở giác ngộ chính trị, trình độ nghề nghiệp, kỷ luật và năng lực làm chủ khoa học", "Chỉ thể hiện ở mức tăng thu nhập bình quân", "Chỉ thể hiện ở tỷ lệ lao động chân tay", "Không bao gồm bản lĩnh chính trị và ý thức tổ chức"],
            ["vai trò của đảng cộng sản", "Đảng là đội tiên phong, đưa lý luận khoa học vào phong trào và tổ chức đấu tranh", "Đảng thay thế mọi hoạt động tự giác của giai cấp", "Đảng chỉ làm nhiệm vụ nghề nghiệp trong doanh nghiệp", "Đảng hình thành ngoài phong trào công nhân và không liên hệ với lý luận"],
            ["quan hệ giữa đảng và giai cấp công nhân", "Đảng mang bản chất giai cấp công nhân nhưng không đồng nhất với toàn bộ giai cấp", "Đảng và toàn bộ giai cấp là một tổ chức hoàn toàn đồng nhất", "Đảng không cần liên hệ lợi ích của công nhân", "Đảng chỉ đại diện cho một nhóm sở hữu tư nhân"],
            ["liên minh giai cấp", "Liên minh với nông dân và các tầng lớp lao động tạo sức mạnh xã hội rộng lớn", "Công nhân phải tự cô lập để giữ vai trò tiên phong", "Liên minh chỉ là thỏa thuận tạm thời không có cơ sở lợi ích", "Liên minh yêu cầu xóa mọi khác biệt nghề nghiệp ngay lập tức"],
            ["thống nhất điều kiện khách quan và chủ quan", "Địa vị khách quan tạo khả năng, còn giác ngộ, tổ chức và đảng biến khả năng thành hiện thực", "Điều kiện khách quan tự động bảo đảm thắng lợi", "Điều kiện chủ quan có thể thay thế mọi cơ sở vật chất", "Hai nhóm điều kiện không có quan hệ với nhau"],
            ["một phong trào đông nhưng thiếu tổ chức", "Cần nâng cao giác ngộ, xây dựng tổ chức và gắn với lý luận khoa học", "Chỉ cần tiếp tục tăng số lượng thành viên", "Nên loại bỏ mục tiêu chính trị để giữ tính tự phát", "Nên tách phong trào khỏi mọi liên minh xã hội"],
        ]},
        {"section": "Chương 2 > B.2 > Giai cấp công nhân và sứ mệnh lịch sử hiện nay", "difficulty": [3, 4, 2], "items": [
            ["điểm ổn định của công nhân hiện đại", "Họ vẫn là lực lượng sản xuất cơ bản và bị chi phối bởi quan hệ thuê mướn trong chủ nghĩa tư bản", "Họ đã trở thành chủ sở hữu tư bản chủ yếu ở mọi nước", "Họ không còn tham gia tạo ra của cải xã hội", "Họ hoàn toàn mất quan hệ với sản xuất công nghiệp"],
            ["xu hướng trí tuệ hóa", "Tri thức và công nghệ ngày càng trở thành bộ phận trực tiếp trong lao động công nghiệp", "Lao động hiện đại ngày càng loại bỏ mọi yêu cầu học tập", "Trí tuệ hóa làm biến mất quan hệ lợi ích giai cấp", "Trí tuệ hóa đồng nghĩa mọi người lao động đều thành tư sản"],
            ["xu hướng trung lưu hóa", "Một bộ phận công nhân có đời sống và cổ phần cải thiện nhưng địa vị cơ bản vẫn phải xét trong quan hệ sản xuất", "Mọi công nhân có cổ phần nhỏ đều trở thành nhà tư bản lớn", "Thu nhập cao tự động xóa bỏ quan hệ làm thuê", "Mức sống là tiêu chí duy nhất xác định giai cấp"],
            ["công nhân trong kinh tế tri thức", "Lao động điều khiển, kiểm soát công nghệ vẫn có thể mang bản chất lao động công nghiệp hiện đại", "Chỉ lao động cơ bắp mới được xem là công nhân", "Người vận hành tự động hóa luôn là chủ tư liệu sản xuất", "Kinh tế tri thức làm giai cấp công nhân biến mất hoàn toàn"],
            ["mâu thuẫn cơ bản hiện nay", "Tính xã hội hóa cao của sản xuất vẫn mâu thuẫn với chiếm hữu tư nhân tư bản chủ nghĩa", "Sản xuất đã hoàn toàn cá thể hóa nên không còn mâu thuẫn", "Mâu thuẫn chỉ còn giữa các thế hệ trong gia đình", "Sở hữu tư nhân đã biến thành sở hữu toàn dân ở mọi nước"],
            ["nội dung kinh tế hiện nay", "Công nhân giữ vai trò chủ yếu trong sản xuất vật chất và đấu tranh cho lợi ích trong quan hệ lao động", "Công nhân rời khỏi sản xuất để chỉ hoạt động văn hóa", "Nội dung kinh tế chỉ là tăng tiêu dùng cá nhân", "Nội dung kinh tế không liên hệ với công bằng xã hội"],
            ["nội dung chính trị hiện nay", "Đấu tranh chống bất công, vì dân chủ, tiến bộ và một trật tự xã hội tốt đẹp hơn", "Từ bỏ mọi quyền chính trị để tập trung vào kỹ thuật", "Ủng hộ tuyệt đối đặc quyền của tư bản độc quyền", "Giới hạn hoạt động vào cạnh tranh cá nhân giữa công nhân"],
            ["nội dung văn hóa hiện nay", "Bảo vệ giá trị lao động, đoàn kết, bình đẳng và đấu tranh với hệ tư tưởng tư sản", "Phủ nhận tri thức khoa học và văn hóa nhân loại", "Coi chủ nghĩa cá nhân cực đoan là giá trị trung tâm", "Tách văn hóa khỏi mọi điều kiện xã hội"],
            ["đánh giá nhận định công nhân đã biến mất", "Nhận định sai vì hình thức lao động biến đổi nhưng vị trí trong sản xuất và quan hệ làm thuê vẫn tồn tại", "Nhận định đúng vì máy tính xóa mọi quan hệ giai cấp", "Nhận định đúng vì lao động dịch vụ không tạo giá trị", "Nhận định sai chỉ vì số công nhân luôn tăng ở mọi quốc gia"],
        ]},
        {"section": "Chương 2 > B.3 > Sứ mệnh lịch sử của giai cấp công nhân Việt Nam", "difficulty": [3, 4, 2], "items": [
            ["nguồn gốc công nhân Việt Nam", "Giai cấp công nhân Việt Nam ra đời từ khai thác thuộc địa và trước giai cấp tư sản dân tộc", "Giai cấp công nhân ra đời sau khi đất nước hoàn thành công nghiệp hóa", "Giai cấp công nhân hình thành chủ yếu từ quý tộc phong kiến", "Giai cấp công nhân không có quan hệ với nông dân"],
            ["đặc điểm chính trị của công nhân Việt Nam", "Sớm tiếp thu chủ nghĩa Mác – Lênin và trở thành lực lượng lãnh đạo cách mạng thông qua Đảng", "Sớm nắm tư liệu sản xuất nên không cần đấu tranh", "Tách biệt với phong trào yêu nước của dân tộc", "Không có tổ chức chính trị đại diện"],
            ["quan hệ công nhân – nông dân Việt Nam", "Nguồn gốc trực tiếp từ nông dân tạo cơ sở tự nhiên cho liên minh công – nông", "Hai giai cấp không có lợi ích chung trong cách mạng", "Liên minh chỉ hình thành sau khi không còn nông nghiệp", "Nguồn gốc nông dân làm công nhân mất tính tổ chức"],
            ["sứ mệnh kinh tế ở Việt Nam", "Đi đầu trong công nghiệp hóa, hiện đại hóa và nâng cao năng suất, chất lượng lao động", "Duy trì sản xuất nhỏ, phân tán như mô hình lâu dài", "Tách lao động khỏi đổi mới công nghệ", "Chỉ chú trọng phân phối mà không phát triển lực lượng sản xuất"],
            ["sứ mệnh chính trị ở Việt Nam", "Giữ vững bản chất giai cấp công nhân của Đảng và củng cố liên minh dưới sự lãnh đạo của Đảng", "Thay vai trò của Đảng bằng các nhóm lợi ích doanh nghiệp", "Thu hẹp dân chủ và tách khỏi nhân dân lao động", "Chỉ tham gia quản lý kỹ thuật tại nơi làm việc"],
            ["sứ mệnh văn hóa ở Việt Nam", "Xây dựng con người mới, hệ giá trị lao động và nền văn hóa tiên tiến, đậm đà bản sắc", "Loại bỏ toàn bộ truyền thống văn hóa dân tộc", "Coi văn hóa là lĩnh vực không liên quan công nhân", "Đồng nhất văn hóa mới với tiêu dùng vật chất"],
            ["xây dựng giai cấp công nhân Việt Nam", "Phải phát triển cả số lượng, chất lượng, cơ cấu và bản lĩnh chính trị", "Chỉ tăng số lượng lao động giản đơn", "Chỉ nâng lương mà không cần đào tạo", "Chỉ chú trọng một ngành công nghiệp truyền thống"],
            ["trí thức hóa công nhân Việt Nam", "Gắn đào tạo nghề, tri thức khoa học công nghệ với tác phong công nghiệp và ý thức chính trị", "Thay toàn bộ công nhân bằng nhà quản lý", "Chỉ đào tạo lý thuyết và bỏ kỹ năng nghề", "Tách giáo dục nghề nghiệp khỏi nhu cầu công nghiệp hóa"],
            ["doanh nghiệp tự động hóa cần xây dựng đội ngũ", "Nên đồng thời đào tạo công nghệ, nâng kỷ luật lao động và bảo vệ quyền lợi chính đáng", "Chỉ giảm số lao động mà không đào tạo lại", "Chỉ trang bị máy móc và bỏ qua yếu tố con người", "Chỉ tuyên truyền chính trị mà không nâng kỹ năng"],
        ]},
    ],
    3: [
        {"section": "Chương 3 > B.1 > Chủ nghĩa xã hội và điều kiện ra đời", "difficulty": [4, 3, 2], "items": [
            ["chủ nghĩa xã hội theo nghĩa phong trào", "Chỉ phong trào thực tiễn đấu tranh của người lao động chống áp bức và bất công", "Chỉ một mô hình quản trị doanh nghiệp", "Chỉ giai đoạn cộng sản phát triển cao", "Chỉ một thành tựu khoa học tự nhiên"],
            ["chủ nghĩa xã hội theo nghĩa trào lưu tư tưởng", "Chỉ hệ thống quan niệm phản ánh khát vọng về xã hội công bằng và tốt đẹp", "Chỉ hoạt động kinh tế của nhà nước", "Chỉ các quy tắc pháp luật tư sản", "Chỉ phong tục của cộng đồng nông thôn"],
            ["chủ nghĩa xã hội theo nghĩa khoa học", "Là một bộ phận lý luận của chủ nghĩa Mác – Lênin về quá trình chuyển biến xã hội", "Là toàn bộ các ước mơ không cần cơ sở hiện thực", "Là kỹ thuật phân phối hàng hóa", "Là học thuyết phủ nhận quy luật khách quan"],
            ["chủ nghĩa xã hội theo nghĩa chế độ", "Chỉ giai đoạn đầu của hình thái kinh tế – xã hội cộng sản chủ nghĩa", "Chỉ giai đoạn cuối của chủ nghĩa tư bản", "Chỉ nhà nước phúc lợi trong xã hội tư sản", "Chỉ một cộng đồng tự quản nhỏ"],
            ["tiền đề kinh tế của chủ nghĩa xã hội", "Lực lượng sản xuất xã hội hóa cao xung đột với quan hệ chiếm hữu tư nhân tư bản", "Sản xuất nhỏ tự cấp tự túc trở thành nền tảng duy nhất", "Mọi mâu thuẫn kinh tế tự biến mất", "Tư hữu tư bản phù hợp vĩnh viễn với sản xuất xã hội hóa"],
            ["tiền đề chính trị – xã hội của chủ nghĩa xã hội", "Sự trưởng thành của giai cấp công nhân và đấu tranh giành quyền lực chính trị", "Sự biến mất của mọi giai cấp trước cách mạng", "Sự tự nguyện từ bỏ sở hữu của toàn bộ tư sản", "Sự tách công nhân khỏi các lực lượng lao động"],
            ["vai trò của cách mạng vô sản", "Là con đường chính trị để giai cấp công nhân và nhân dân lao động xác lập quyền lực mới", "Chỉ là cuộc thay đổi kỹ thuật sản xuất", "Chỉ thay người cầm quyền mà giữ nguyên quan hệ bóc lột", "Không liên hệ với xây dựng xã hội mới"],
            ["quan hệ tiền đề vật chất và chủ thể", "Tiền đề vật chất tạo khả năng, còn lực lượng cách mạng có tổ chức biến khả năng thành hiện thực", "Lực lượng sản xuất tự động lập nên chế độ mới", "Ý chí chủ quan có thể thay thế mọi điều kiện kinh tế", "Hai yếu tố tồn tại độc lập và không tác động nhau"],
            ["đánh giá điều kiện xây dựng xã hội mới", "Cần đồng thời phát triển lực lượng sản xuất và xây dựng lực lượng chính trị – xã hội có năng lực", "Chỉ cần tuyên bố mục tiêu mà không cần cơ sở vật chất", "Chỉ cần tăng sản lượng bất kể quan hệ xã hội", "Chỉ cần sao chép thể chế từ nơi khác"],
        ]},
        {"section": "Chương 3 > B.1.2 > Những đặc trưng cơ bản của chủ nghĩa xã hội", "difficulty": [4, 3, 2], "items": [
            ["mục tiêu giải phóng", "Giải phóng giai cấp, dân tộc, xã hội và con người, tạo điều kiện phát triển toàn diện", "Duy trì áp bức giai cấp dưới hình thức mới", "Chỉ tăng của cải cho một thiểu số", "Tách tự do cá nhân khỏi giải phóng xã hội"],
            ["cơ sở vật chất của chủ nghĩa xã hội", "Nền kinh tế phát triển cao dựa trên lực lượng sản xuất hiện đại và sở hữu xã hội về tư liệu chủ yếu", "Nền sản xuất nhỏ phân tán và tư hữu tuyệt đối", "Nền kinh tế không cần khoa học công nghệ", "Nền kinh tế chỉ dựa vào phân phối hiện vật"],
            ["chủ thể làm chủ xã hội", "Nhân dân lao động là chủ thể của quyền lực và quản lý xã hội", "Một nhóm tư bản độc quyền nắm toàn bộ quyền lực", "Quyền lực tách khỏi nhân dân", "Chỉ chuyên gia kỹ thuật được tham gia quản lý"],
            ["nhà nước kiểu mới", "Nhà nước mang bản chất giai cấp công nhân, đại biểu lợi ích và quyền lực của nhân dân lao động", "Nhà nước trung lập tuyệt đối với mọi lợi ích giai cấp", "Nhà nước bảo vệ riêng sở hữu tư bản độc quyền", "Nhà nước không có chức năng tổ chức xây dựng"],
            ["nền văn hóa xã hội chủ nghĩa", "Có trình độ phát triển cao, kế thừa giá trị dân tộc và tinh hoa nhân loại", "Phủ nhận toàn bộ di sản văn hóa trước đó", "Tách khỏi cơ sở kinh tế và đời sống xã hội", "Chỉ chấp nhận một hình thức biểu đạt duy nhất"],
            ["quan hệ dân tộc trong chủ nghĩa xã hội", "Các dân tộc bình đẳng, đoàn kết, tôn trọng và giúp nhau cùng phát triển", "Dân tộc lớn có quyền đồng hóa dân tộc nhỏ", "Bình đẳng dân tộc không cần điều kiện phát triển", "Mỗi dân tộc phải tách biệt khỏi cộng đồng chung"],
            ["quan hệ quốc tế của chủ nghĩa xã hội", "Hữu nghị, hợp tác với nhân dân các nước vì hòa bình và tiến bộ", "Biệt lập khỏi mọi quan hệ quốc tế", "Áp đặt mô hình bằng cưỡng bức đối với nước khác", "Chỉ hợp tác khi có thể chi phối quốc gia yếu hơn"],
            ["tính hệ thống của các đặc trưng", "Các đặc trưng kinh tế, chính trị, văn hóa và xã hội hỗ trợ nhau trong một chỉnh thể", "Mỗi đặc trưng có thể tồn tại riêng không cần điều kiện khác", "Chỉ đặc trưng kinh tế quyết định trực tiếp mọi kết quả", "Đặc trưng văn hóa loại trừ phát triển vật chất"],
            ["đánh giá chính sách chỉ tăng trưởng", "Chưa đủ nếu tăng trưởng không đi cùng quyền làm chủ, công bằng, văn hóa và phát triển con người", "Đã thể hiện đầy đủ mọi đặc trưng của chủ nghĩa xã hội", "Có thể bỏ qua quan hệ dân tộc và hợp tác quốc tế", "Chứng minh mục tiêu giải phóng không cần thiết"],
        ]},
        {"section": "Chương 3 > B.2 > Thời kỳ quá độ lên chủ nghĩa xã hội", "difficulty": [4, 4, 1], "items": [
            ["tính tất yếu của thời kỳ quá độ", "Xã hội mới cần thời gian cải biến sâu sắc kinh tế, chính trị, văn hóa và con người từ di sản cũ", "Có thể hình thành hoàn chỉnh ngay sau khi giành chính quyền", "Chỉ cần thay tên nhà nước mà không đổi cơ sở xã hội", "Không cần xây dựng lực lượng sản xuất mới"],
            ["quá độ trực tiếp", "Diễn ra từ chủ nghĩa tư bản phát triển lên chủ nghĩa xã hội", "Diễn ra từ xã hội tiền tư bản bỏ qua mọi hình thức trung gian", "Là quá trình trở lại chế độ phong kiến", "Là thay đổi chỉ trong lĩnh vực văn hóa"],
            ["quá độ gián tiếp", "Diễn ra ở nước chưa trải qua chủ nghĩa tư bản phát triển, cần những bước đi và hình thức trung gian", "Không cần tiếp thu thành tựu văn minh tư bản", "Không cần công nghiệp hóa và phát triển lực lượng sản xuất", "Có thể bỏ qua mọi quan hệ kinh tế quá độ"],
            ["đặc điểm kinh tế thời kỳ quá độ", "Tồn tại nhiều thành phần kinh tế và hình thức sở hữu đan xen", "Chỉ còn ngay một hình thức sở hữu duy nhất", "Kinh tế ngừng vận động cho đến khi chế độ mới hoàn thành", "Mọi quan hệ thị trường bị xóa bỏ tức thời"],
            ["đặc điểm chính trị thời kỳ quá độ", "Giai cấp công nhân giữ quyền lực và tổ chức xây dựng xã hội mới trong đấu tranh với lực lượng cũ", "Mọi khác biệt lợi ích biến mất ngay", "Nhà nước không còn cần thiết từ ngày đầu", "Quyền lực thuộc lại giai cấp tư sản"],
            ["đặc điểm tư tưởng – văn hóa thời kỳ quá độ", "Nhiều hệ tư tưởng và giá trị cũ mới cùng tồn tại, đấu tranh và chuyển hóa", "Chỉ còn duy nhất tư tưởng mới ngay lập tức", "Văn hóa không chịu ảnh hưởng của biến đổi kinh tế", "Di sản cũ phải bị xóa bỏ toàn bộ"],
            ["đặc điểm xã hội thời kỳ quá độ", "Còn nhiều giai cấp, tầng lớp và khác biệt lợi ích cần được điều tiết", "Không còn bất kỳ khác biệt xã hội nào", "Chỉ còn hai cá nhân có lợi ích giống nhau", "Cơ cấu xã hội không thay đổi theo kinh tế"],
            ["mâu thuẫn của thời kỳ quá độ", "Các yếu tố xã hội mới và tàn dư xã hội cũ vừa đấu tranh vừa đan xen", "Chỉ có sự phát triển thuận chiều không phát sinh khó khăn", "Mọi yếu tố cũ đều có vai trò tiến bộ", "Yếu tố mới không cần được xây dựng và bảo vệ"],
            ["xử lý thành phần kinh tế trong quá độ", "Cần quản lý, định hướng và phát huy các thành phần phù hợp lộ trình thay vì xóa bỏ chủ quan", "Cần xóa mọi thành phần ngoài quốc doanh tức thời", "Cần để các thành phần phát triển tự phát không định hướng", "Cần ngừng phát triển lực lượng sản xuất để tránh khác biệt"],
        ]},
        {"section": "Chương 3 > B.3.1 > Quá độ lên chủ nghĩa xã hội ở Việt Nam", "difficulty": [3, 4, 2], "items": [
            ["đặc điểm xuất phát của Việt Nam", "Đi lên từ xã hội thuộc địa, nửa phong kiến với lực lượng sản xuất thấp và hậu quả chiến tranh nặng nề", "Đi lên từ nền tư bản phát triển hàng đầu thế giới", "Đi lên khi đã hoàn thành đầy đủ cơ sở vật chất xã hội chủ nghĩa", "Đi lên trong điều kiện không có ảnh hưởng quốc tế"],
            ["bỏ qua chế độ tư bản chủ nghĩa", "Bỏ qua việc xác lập vị trí thống trị của quan hệ sản xuất và kiến trúc thượng tầng tư bản chủ nghĩa", "Bỏ qua mọi thành tựu khoa học và quản trị của nhân loại", "Bỏ qua phát triển kinh tế thị trường và lực lượng sản xuất", "Bỏ qua mọi hình thức sở hữu và phân phối trung gian"],
            ["kế thừa thành tựu tư bản chủ nghĩa", "Phải tiếp thu có chọn lọc thành tựu về lực lượng sản xuất, khoa học, công nghệ và quản lý", "Phải phủ nhận toàn bộ vì đều mang bản chất tư bản", "Phải sao chép nguyên vẹn cả quan hệ thống trị tư bản", "Chỉ tiếp thu văn hóa tiêu dùng mà không tiếp thu công nghệ"],
            ["tính lâu dài và phức tạp", "Quá độ ở Việt Nam là sự nghiệp lâu dài, nhiều bước đi và hình thức tổ chức kinh tế – xã hội", "Có thể hoàn tất bằng một quyết định hành chính", "Không phát sinh mâu thuẫn hoặc bước lùi", "Chỉ cần thay đổi lĩnh vực chính trị"],
            ["vai trò lãnh đạo", "Sự lãnh đạo của Đảng Cộng sản Việt Nam là nhân tố quyết định định hướng quá độ", "Thị trường tự phát tự quyết định mục tiêu xã hội", "Các nhóm lợi ích riêng thay thế vai trò chính trị", "Không cần một lực lượng tổ chức và định hướng"],
            ["kinh tế thị trường định hướng xã hội chủ nghĩa", "Là công cụ phát triển lực lượng sản xuất được quản lý và định hướng tới mục tiêu xã hội chủ nghĩa", "Đồng nhất hoàn toàn với kinh tế thị trường tư bản", "Là bước từ bỏ mục tiêu xã hội chủ nghĩa", "Chỉ thừa nhận một hình thức sở hữu duy nhất"],
            ["độc lập dân tộc gắn với chủ nghĩa xã hội", "Là lựa chọn xuyên suốt nhằm bảo đảm giải phóng dân tộc gắn với giải phóng xã hội và con người", "Là hai mục tiêu loại trừ nhau", "Độc lập dân tộc chỉ có ý nghĩa kinh tế", "Chủ nghĩa xã hội không liên hệ với chủ quyền quốc gia"],
            ["vận dụng khái niệm bỏ qua", "Không được hiểu bỏ qua là đốt cháy giai đoạn hoặc phủ nhận thành tựu văn minh nhân loại", "Phải hiểu là xóa ngay mọi yếu tố thị trường", "Phải hiểu là không cần công nghiệp hóa", "Phải hiểu là cô lập khỏi kinh tế thế giới"],
            ["lựa chọn công nghệ nước ngoài", "Nên tiếp thu công nghệ và quản trị có chọn lọc, đồng thời giữ định hướng phát triển độc lập và xã hội chủ nghĩa", "Nên từ chối mọi thành tựu vì có nguồn gốc tư bản", "Nên nhập nguyên cả thể chế chính trị kèm công nghệ", "Nên chỉ mua thiết bị mà không đào tạo con người"],
        ]},
        {"section": "Chương 3 > B.3.2 > Đặc trưng và phương hướng xây dựng chủ nghĩa xã hội ở Việt Nam", "difficulty": [3, 4, 2], "items": [
            ["mục tiêu dân giàu, nước mạnh", "Gắn dân giàu, nước mạnh với dân chủ, công bằng và văn minh", "Chỉ nhấn mạnh tăng của cải của một nhóm", "Tách sức mạnh quốc gia khỏi đời sống nhân dân", "Loại bỏ yêu cầu dân chủ và công bằng"],
            ["nhân dân làm chủ", "Nhân dân là chủ thể quyền lực và tham gia quản lý nhà nước, xã hội", "Quyền lực thuộc riêng bộ máy hành chính", "Nhân dân chỉ là đối tượng thụ hưởng thụ động", "Quyền làm chủ không cần cơ chế pháp luật"],
            ["nền kinh tế Việt Nam xã hội chủ nghĩa", "Có lực lượng sản xuất hiện đại và quan hệ sản xuất tiến bộ, phù hợp", "Chỉ dựa vào sản xuất nhỏ tự cấp", "Không chấp nhận đa dạng hình thức sở hữu trong quá độ", "Tách tiến bộ quan hệ sản xuất khỏi trình độ lực lượng sản xuất"],
            ["nền văn hóa Việt Nam", "Tiên tiến, đậm đà bản sắc dân tộc và hướng tới phát triển con người", "Đóng kín trước tinh hoa văn hóa nhân loại", "Phủ nhận mọi truyền thống dân tộc", "Chỉ phục vụ hoạt động giải trí thương mại"],
            ["con người trong xã hội Việt Nam", "Có cuộc sống ấm no, tự do, hạnh phúc và điều kiện phát triển toàn diện", "Chỉ được đánh giá bằng thu nhập", "Phải hy sinh mọi nhu cầu cá nhân chính đáng", "Không liên hệ với tiến bộ và công bằng xã hội"],
            ["các dân tộc trong cộng đồng Việt Nam", "Bình đẳng, đoàn kết, tôn trọng và giúp nhau cùng phát triển", "Cạnh tranh để một dân tộc giữ đặc quyền", "Tách biệt về kinh tế và văn hóa", "Bình đẳng hình thức nhưng không cần hỗ trợ vùng khó khăn"],
            ["Nhà nước pháp quyền xã hội chủ nghĩa", "Là nhà nước của nhân dân, do nhân dân, vì nhân dân và do Đảng lãnh đạo", "Là nhà nước đứng ngoài lợi ích nhân dân", "Là nhà nước không bị ràng buộc bởi pháp luật", "Là nhà nước do các tập đoàn kinh tế lãnh đạo"],
            ["quan hệ đối ngoại", "Việt Nam chủ động hữu nghị, hợp tác với các nước trên cơ sở tôn trọng và cùng phát triển", "Việt Nam phải biệt lập để giữ định hướng", "Việt Nam chỉ quan hệ với nước có cùng chế độ", "Hợp tác cho phép từ bỏ độc lập tự chủ"],
            ["xử lý các quan hệ lớn", "Phải nhận thức và giải quyết hài hòa các quan hệ như đổi mới – ổn định – phát triển và thị trường – định hướng", "Chỉ ưu tiên một vế và phủ nhận vế còn lại", "Coi các quan hệ là mâu thuẫn không thể điều hòa", "Giải quyết bằng công thức bất biến không xét thực tiễn"],
        ]},
    ],
    4: [
        {"section":"Chương 4 > B.1.1 > Dân chủ và sự ra đời, phát triển của dân chủ","difficulty":[3,3,2],"items":[
            ["khái niệm dân chủ","Dân chủ là quyền lực thuộc về nhân dân","Dân chủ là đặc quyền của thiểu số","Dân chủ chỉ là tự do không giới hạn","Dân chủ không liên hệ quyền lực"],
            ["dân chủ như giá trị xã hội","Dân chủ phản ánh thành quả đấu tranh vì quyền làm chủ của nhân dân","Dân chủ chỉ là thủ tục bầu cử","Dân chủ là giá trị riêng của tư sản","Dân chủ loại trừ nghĩa vụ công dân"],
            ["dân chủ như chế độ chính trị","Dân chủ được thể chế hóa bằng nhà nước, pháp luật và cơ chế thực thi quyền lực","Dân chủ chỉ tồn tại trong ý thức cá nhân","Dân chủ không cần thiết chế","Dân chủ đồng nghĩa không có nhà nước"],
            ["dân chủ trong cộng đồng nguyên thủy","Hình thức dân chủ sơ khai gắn với quyền lực cộng đồng khi chưa có nhà nước","Dân chủ chỉ xuất hiện cùng tư bản","Dân chủ nguyên thủy do quý tộc độc quyền","Dân chủ sơ khai dựa trên lao động làm thuê"],
            ["dân chủ chủ nô","Quyền dân chủ chỉ dành cho thiểu số công dân tự do và loại trừ nô lệ","Mọi thành viên đều bình đẳng","Nô lệ nắm quyền nhà nước","Không có tính giai cấp"],
            ["dân chủ tư sản","Là bước tiến lịch sử nhưng mang bản chất và giới hạn của giai cấp tư sản","Thực hiện đầy đủ quyền lực của mọi lao động","Không dựa trên sở hữu tư nhân","Xóa bỏ mọi bất bình đẳng thực tế"],
            ["tính lịch sử của dân chủ","Nội dung và hình thức dân chủ biến đổi theo điều kiện kinh tế – xã hội và giai cấp","Dân chủ bất biến qua mọi thời đại","Dân chủ không liên hệ phương thức sản xuất","Chỉ tên gọi dân chủ thay đổi"],
            ["đánh giá dân chủ chỉ là khẩu hiệu","Dân chủ phải được thể chế hóa và bảo đảm bằng điều kiện thực hiện","Chỉ cần tuyên bố quyền là đủ","Không cần pháp luật và giám sát","Không cần năng lực tham gia của dân"],
        ]},
        {"section":"Chương 4 > B.1.2 > Dân chủ xã hội chủ nghĩa","difficulty":[3,3,2],"items":[
            ["sự ra đời dân chủ xã hội chủ nghĩa","Dân chủ xã hội chủ nghĩa hình thành cùng thắng lợi cách mạng vô sản và nhà nước mới","Ra đời trước mọi xã hội có giai cấp","Do tư sản tự nguyện trao quyền","Không cần cơ sở kinh tế mới"],
            ["bản chất chính trị của dân chủ xã hội chủ nghĩa","Mang bản chất giai cấp công nhân và có tính nhân dân rộng rãi, tính dân tộc sâu sắc","Trung lập tuyệt đối về giai cấp","Chỉ phục vụ một nhóm công nhân","Tách khỏi lợi ích dân tộc"],
            ["bản chất kinh tế của dân chủ xã hội chủ nghĩa","Dựa trên chế độ công hữu các tư liệu sản xuất chủ yếu và phát triển lực lượng sản xuất","Dựa trên độc quyền tư hữu tư bản","Không cần nền tảng kinh tế","Dựa trên sản xuất nhỏ vĩnh viễn"],
            ["bản chất tư tưởng – văn hóa","Lấy hệ tư tưởng Mác – Lênin làm chủ đạo và kế thừa giá trị văn hóa","Phủ nhận mọi di sản dân tộc","Chấp nhận hệ tư tưởng tư sản thống trị","Tách dân chủ khỏi văn hóa"],
            ["mục tiêu dân chủ xã hội chủ nghĩa","Bảo đảm quyền lực thực tế của nhân dân và phát triển con người","Chỉ duy trì bình đẳng hình thức","Bảo vệ đặc quyền tư bản","Giảm sự tham gia của nhân dân"],
            ["dân chủ và kỷ cương","Mở rộng dân chủ phải gắn với pháp luật, kỷ luật và trách nhiệm","Dân chủ cho phép đứng trên pháp luật","Kỷ cương phải loại bỏ dân chủ","Hai mặt không liên hệ"],
            ["dân chủ trực tiếp và đại diện","Hai hình thức cần kết hợp để nhân dân thực hiện quyền làm chủ","Dân chủ trực tiếp loại bỏ mọi đại diện","Đại diện làm nhân dân mất quyền","Chỉ một hình thức hợp pháp"],
            ["vận dụng quyền làm chủ","Cần công khai thông tin, tạo cơ chế tham gia và chịu trách nhiệm giải trình","Chỉ lấy ý kiến hình thức","Giữ kín thông tin liên quan dân","Không cần phản hồi kiến nghị"],
        ]},
        {"section":"Chương 4 > B.2 > Nhà nước xã hội chủ nghĩa","difficulty":[4,3,1],"items":[
            ["nguồn gốc nhà nước xã hội chủ nghĩa","Ra đời từ cách mạng do giai cấp công nhân và nhân dân lao động tiến hành","Do nhà nước tư sản tự chuyển hóa","Có trước cách mạng vô sản","Không liên hệ đấu tranh giai cấp"],
            ["bản chất nhà nước xã hội chủ nghĩa","Mang bản chất công nhân, đồng thời có tính nhân dân rộng rãi và tính dân tộc","Không mang bản chất giai cấp","Chỉ bảo vệ lợi ích đảng viên","Tách khỏi cộng đồng dân tộc"],
            ["chức năng trấn áp","Trấn áp lực lượng chống phá và bảo vệ thành quả cách mạng theo pháp luật","Trấn áp mọi ý kiến khác biệt","Là chức năng duy nhất","Không chịu giới hạn pháp lý"],
            ["chức năng tổ chức xây dựng","Tổ chức kinh tế, văn hóa, xã hội và phục vụ đời sống nhân dân là nhiệm vụ cơ bản","Chỉ quản lý quân sự","Không tham gia phát triển xã hội","Kém quan trọng hơn mọi hoạt động cưỡng chế"],
            ["nhà nước nửa nhà nước","Nhà nước xã hội chủ nghĩa tạo điều kiện để quyền lực nhà nước dần tiêu vong khi cơ sở giai cấp mất đi","Nhà nước phải mạnh lên vô hạn","Nhà nước biến mất ngay sau cách mạng","Nhà nước không bao giờ thay đổi"],
            ["quan hệ dân chủ và nhà nước","Dân chủ là cơ sở, còn nhà nước là công cụ chủ yếu để thực hiện quyền làm chủ","Nhà nước thay thế hoàn toàn dân chủ","Dân chủ không cần nhà nước","Hai yếu tố đối lập tuyệt đối"],
            ["pháp luật trong nhà nước mới","Pháp luật thể chế hóa ý chí, quyền và lợi ích của nhân dân lao động","Pháp luật chỉ bảo vệ cơ quan công quyền","Pháp luật không ràng buộc cán bộ","Pháp luật có thể tùy nghi áp dụng"],
            ["đánh giá cơ quan chỉ chú trọng cưỡng chế","Cần tăng chức năng tổ chức, phục vụ và phát triển xã hội bên cạnh bảo vệ chế độ","Cưỡng chế là toàn bộ bản chất nhà nước","Không cần cung cấp dịch vụ công","Nên giảm trách nhiệm với dân"],
        ]},
        {"section":"Chương 4 > B.3.1 > Dân chủ xã hội chủ nghĩa ở Việt Nam","difficulty":[3,3,2],"items":[
            ["bản chất dân chủ Việt Nam","Dân chủ vừa là mục tiêu vừa là động lực của công cuộc đổi mới","Dân chủ chỉ là phương tiện tạm thời","Dân chủ chỉ dành cho cơ quan nhà nước","Dân chủ tách khỏi phát triển"],
            ["phương châm quyền làm chủ","Dân biết, dân bàn, dân làm, dân kiểm tra, dân giám sát và dân thụ hưởng","Dân chỉ biết và chấp hành","Dân không cần giám sát","Dân thụ hưởng không cần tham gia"],
            ["dân chủ qua Nhà nước","Nhân dân thực hiện quyền lực thông qua bầu cử, đại diện và hoạt động của bộ máy nhà nước","Nhà nước tự có quyền không do dân ủy quyền","Bầu cử là hình thức duy nhất","Đại diện không phải chịu giám sát"],
            ["dân chủ qua tổ chức xã hội","Mặt trận và đoàn thể tạo kênh tập hợp, phản biện và giám sát của nhân dân","Các tổ chức chỉ truyền đạt một chiều","Không có vai trò phản biện","Thay thế toàn bộ cơ quan dân cử"],
            ["dân chủ ở cơ sở","Phải gắn quyền tham gia với công khai, minh bạch và trách nhiệm giải trình","Chỉ cần họp dân định kỳ","Không cần công khai ngân sách","Ý kiến dân không cần phản hồi"],
            ["hạn chế cần khắc phục","Tình trạng dân chủ hình thức, quan liêu và vi phạm quyền làm chủ phải được đấu tranh khắc phục","Mọi cơ chế hiện hành đã hoàn thiện","Quan liêu giúp tăng dân chủ","Vi phạm nhỏ không ảnh hưởng niềm tin"],
            ["quan hệ dân chủ và ổn định","Dân chủ đúng hướng, có kỷ cương góp phần tạo đồng thuận và ổn định","Ổn định đòi hỏi hạn chế mọi tham gia","Dân chủ tất yếu gây mất ổn định","Hai mục tiêu loại trừ nhau"],
            ["dự án cộng đồng","Cần công khai phương án, lấy ý kiến thực chất và giải trình việc tiếp thu","Chỉ thông báo sau khi quyết định","Chọn vài ý kiến thuận lợi","Bỏ qua nhóm chịu tác động"],
        ]},
        {"section":"Chương 4 > B.3.2 > Nhà nước pháp quyền xã hội chủ nghĩa Việt Nam","difficulty":[3,4,1],"items":[
            ["nhà nước của nhân dân","Mọi quyền lực nhà nước thuộc về nhân dân","Quyền lực thuộc riêng cơ quan hành pháp","Nhân dân chỉ là đối tượng quản lý","Quyền lực không cần ủy quyền"],
            ["quyền lực nhà nước thống nhất","Quyền lực thống nhất nhưng có phân công, phối hợp và kiểm soát giữa các cơ quan","Ba quyền tách biệt tuyệt đối","Không cần phân công","Một cơ quan nắm mọi quyền không kiểm soát"],
            ["vai trò Hiến pháp và pháp luật","Nhà nước tổ chức, hoạt động trong khuôn khổ Hiến pháp và pháp luật","Cơ quan công quyền đứng trên pháp luật","Chỉ người dân phải tuân luật","Pháp luật không cần công khai"],
            ["tôn trọng quyền con người","Nhà nước công nhận, tôn trọng, bảo vệ và bảo đảm quyền con người, quyền công dân","Quyền chỉ tồn tại khi cơ quan cho phép tùy ý","Quyền không đi cùng nghĩa vụ","Quyền con người đối lập chủ quyền dân tộc"],
            ["sự lãnh đạo của Đảng","Đảng lãnh đạo Nhà nước và xã hội trong khuôn khổ Hiến pháp, pháp luật và chịu giám sát của nhân dân","Đảng thay thế hoạt động Nhà nước","Đảng đứng ngoài pháp luật","Lãnh đạo loại bỏ kiểm soát quyền lực"],
            ["kiểm soát quyền lực","Nhằm phòng ngừa lạm quyền, tham nhũng và bảo đảm quyền lực phục vụ nhân dân","Nhằm cản trở mọi quyết định hành chính","Chỉ áp dụng với công dân","Không cần trong nhà nước của dân"],
            ["bộ máy nhà nước","Phải tinh gọn, hiệu lực, hiệu quả và có đội ngũ liêm chính, chuyên nghiệp","Càng nhiều tầng nấc càng tốt","Chỉ cần đủ biên chế","Hiệu quả không liên hệ đạo đức công vụ"],
            ["xử lý thủ tục tùy tiện","Phải áp dụng đúng luật, công khai căn cứ và có cơ chế khiếu nại, giám sát","Có thể linh hoạt bỏ luật","Chỉ giải thích nội bộ","Không cần chịu trách nhiệm"],
        ]},
    ],
    5: [
        {"section":"Chương 5 > B.1.1 > Cơ cấu xã hội – giai cấp","difficulty":[3,3,1],"items":[
            ["cơ cấu xã hội","Là tổng thể các cộng đồng người và quan hệ xã hội giữa các cộng đồng","Chỉ là danh sách nghề nghiệp","Chỉ là phân bố dân cư","Không có quan hệ nội tại"],
            ["cơ cấu xã hội – giai cấp","Là hệ thống các giai cấp, tầng lớp và quan hệ giữa họ trong một xã hội","Chỉ gồm hai giai cấp ở mọi xã hội","Không phụ thuộc kinh tế","Chỉ phản ánh tuổi tác"],
            ["vị trí của cơ cấu giai cấp","Có vị trí quan trọng vì gắn trực tiếp với quan hệ sản xuất và quyền lực","Không liên hệ cơ cấu kinh tế","Luôn bất biến","Thay thế mọi cơ cấu xã hội khác"],
            ["quan hệ với cơ cấu kinh tế","Biến đổi cơ cấu kinh tế dẫn tới biến đổi cơ cấu giai cấp với độ trễ nhất định","Hai cơ cấu hoàn toàn độc lập","Giai cấp đổi trước mọi biến đổi kinh tế","Kinh tế không tạo lợi ích xã hội"],
            ["tính lịch sử của cơ cấu giai cấp","Mỗi hình thái và giai đoạn phát triển có cơ cấu giai cấp đặc thù","Mọi xã hội có cùng cơ cấu","Cơ cấu do ý chí quy định","Không có chuyển dịch tầng lớp"],
            ["quan hệ giữa các cơ cấu xã hội","Cơ cấu giai cấp tác động qua lại với nghề nghiệp, dân cư, dân tộc và tôn giáo","Các cơ cấu không giao nhau","Chỉ cơ cấu tuổi có ý nghĩa","Quan hệ luôn một chiều"],
            ["phân tích chuyển dịch lao động","Cần gắn thay đổi nghề nghiệp với sở hữu, lợi ích và vị trí giai cấp","Chỉ đếm tên nghề mới","Chỉ xét nơi cư trú","Không cần xét quan hệ sản xuất"],
        ]},
        {"section":"Chương 5 > B.1.2 > Biến đổi cơ cấu xã hội – giai cấp trong thời kỳ quá độ","difficulty":[3,3,1],"items":[
            ["tính đa dạng của cơ cấu quá độ","Nhiều giai cấp, tầng lớp và nhóm xã hội cùng tồn tại, đan xen","Chỉ còn một giai cấp ngay lập tức","Mọi khác biệt lợi ích biến mất","Không xuất hiện nhóm mới"],
            ["xu hướng biến đổi theo kinh tế","Cơ cấu giai cấp chuyển dịch theo cơ cấu ngành và các thành phần kinh tế","Không chịu tác động công nghiệp hóa","Chỉ do chính sách văn hóa","Luôn đi trước kinh tế"],
            ["xu hướng xích lại gần nhau","Các giai cấp có thể tăng hợp tác và thu hẹp khác biệt nhưng chưa đồng nhất ngay","Mọi giai cấp hòa làm một tức thời","Không thể có lợi ích chung","Khác biệt tăng vô hạn"],
            ["tính vừa thống nhất vừa mâu thuẫn","Các tầng lớp có lợi ích chung trong xây dựng xã hội mới nhưng còn khác biệt cụ thể","Lợi ích hoàn toàn đồng nhất","Chỉ có xung đột","Không có quan hệ lợi ích"],
            ["vai trò chính sách xã hội","Điều tiết lợi ích và tạo cơ hội giúp định hướng biến đổi cơ cấu theo mục tiêu tiến bộ","Chính sách không tác động cơ cấu","Chỉ thị trường tự điều chỉnh","Phải xóa khác biệt bằng mệnh lệnh"],
            ["xuất hiện tầng lớp mới","Do kinh tế thị trường, khoa học công nghệ và phân công lao động phát triển","Chứng tỏ không còn giai cấp","Không liên hệ đổi mới kinh tế","Chỉ do thay tên nghề"],
            ["đánh giá chênh lệch lợi ích","Cần nhận diện khách quan và điều hòa hài hòa thay vì phủ nhận hoặc tuyệt đối hóa","Cần coi mọi khác biệt là đối kháng","Nên bỏ qua vì tự mất","Nên cấm mọi dịch chuyển xã hội"],
        ]},
        {"section":"Chương 5 > B.2 > Liên minh giai cấp, tầng lớp trong thời kỳ quá độ","difficulty":[3,2,2],"items":[
            ["tính tất yếu kinh tế của liên minh","Phân công lao động làm công nghiệp, nông nghiệp, khoa học và dịch vụ phụ thuộc lẫn nhau","Các ngành có thể phát triển tách biệt","Liên minh chỉ do tình cảm","Nông nghiệp không cần công nghiệp"],
            ["tính tất yếu chính trị của liên minh","Liên minh tạo cơ sở xã hội rộng lớn cho quyền lực của nhân dân lao động","Công nhân có thể tự cô lập","Liên minh làm mất vai trò lãnh đạo","Chỉ cần thỏa thuận ngắn hạn"],
            ["chủ thể nòng cốt liên minh","Công nhân, nông dân và trí thức là lực lượng cơ bản của khối liên minh","Chỉ doanh nhân và địa chủ","Chỉ công nhân không cần lực lượng khác","Mọi nhóm có vai trò giống hệt"],
            ["vai trò lãnh đạo của công nhân","Được thực hiện thông qua Đảng và dựa trên lợi ích chung, không phải đặc quyền","Là áp đặt lợi ích riêng","Loại bỏ vai trò nông dân","Không cần thuyết phục"],
            ["nguyên tắc liên minh","Tự nguyện, bình đẳng, tôn trọng và kết hợp hài hòa lợi ích","Cưỡng bức và đồng nhất lợi ích","Hy sinh một bên lâu dài","Không cần cơ chế phối hợp"],
            ["liên minh và lực lượng sản xuất","Hợp tác giữa các lực lượng góp phần phát triển sản xuất và tạo cơ sở vật chất mới","Liên minh chỉ có mục tiêu chính trị","Không tác động năng suất","Cản trở ứng dụng khoa học"],
            ["dự án thiếu tiếng nói nông dân","Cần thiết kế lại cơ chế tham gia và phân chia lợi ích bình đẳng giữa các chủ thể","Vẫn đúng nguyên tắc vì công nhân quyết định hết","Chỉ cần tuyên truyền thêm","Nên loại nông dân khỏi dự án"],
        ]},
        {"section":"Chương 5 > B.3.1 > Cơ cấu xã hội – giai cấp ở Việt Nam","difficulty":[2,3,2],"items":[
            ["vai trò công nhân Việt Nam","Là giai cấp lãnh đạo thông qua Đảng và đi đầu trong công nghiệp hóa","Chỉ là lực lượng hỗ trợ","Không liên hệ sản xuất hiện đại","Đại diện sở hữu tư bản"],
            ["vai trò nông dân Việt Nam","Là lực lượng chiến lược, chủ thể nông nghiệp, nông thôn và xây dựng nông thôn mới","Không còn vai trò trong hiện đại hóa","Chỉ cung cấp lao động giản đơn","Tách khỏi liên minh"],
            ["vai trò trí thức","Là lực lượng sáng tạo và truyền bá tri thức, đặc biệt quan trọng trong kinh tế tri thức","Không trực tiếp góp phần phát triển","Chỉ làm công tác văn hóa","Không thuộc liên minh"],
            ["vai trò doanh nhân","Góp phần huy động nguồn lực, tổ chức sản xuất kinh doanh và tạo việc làm theo pháp luật","Đương nhiên đối lập với mục tiêu chung","Thay thế vai trò nhà nước","Không có trách nhiệm xã hội"],
            ["đội ngũ thanh niên","Là lực lượng xung kích, sáng tạo và nguồn nhân lực cho phát triển đất nước","Chỉ là nhóm tuổi không có vai trò xã hội","Không cần giáo dục lý tưởng","Đứng ngoài cơ cấu xã hội"],
            ["phụ nữ Việt Nam","Có vai trò quan trọng trong lao động, gia đình, chính trị và phát triển xã hội","Chỉ đảm nhiệm việc gia đình","Không cần bình đẳng cơ hội","Không thuộc lực lượng lao động"],
            ["chính sách với các tầng lớp","Cần phát huy vai trò từng lực lượng và xử lý hài hòa lợi ích trong khối đại đoàn kết","Áp dụng một chính sách giống nhau bất kể đặc điểm","Chỉ ưu tiên một giai cấp","Phủ nhận lợi ích chính đáng"],
        ]},
        {"section":"Chương 5 > B.3.2 > Nội dung và phương hướng xây dựng liên minh ở Việt Nam","difficulty":[3,3,1],"items":[
            ["nội dung kinh tế của liên minh","Phối hợp phát triển ngành, vùng, chuỗi giá trị và bảo đảm lợi ích kinh tế chính đáng","Chỉ chia đều thu nhập","Không cần liên kết sản xuất","Tách nông nghiệp khỏi thị trường"],
            ["nội dung chính trị của liên minh","Củng cố đồng thuận, quyền làm chủ và nền tảng xã hội của Nhà nước","Chỉ vận động bầu cử","Loại bỏ khác biệt chính kiến bằng cưỡng bức","Không cần vai trò Mặt trận"],
            ["nội dung văn hóa – xã hội","Nâng cao dân trí, đào tạo, an sinh và tiếp cận dịch vụ cho các lực lượng","Chỉ tổ chức lễ hội","Không liên hệ chất lượng con người","Hy sinh an sinh để tăng trưởng"],
            ["kết hợp hài hòa lợi ích","Phải nhận diện lợi ích riêng, lợi ích chung và có cơ chế phân phối công bằng","Đồng nhất mọi lợi ích bằng mệnh lệnh","Chỉ bảo vệ bên mạnh","Không cần minh bạch"],
            ["phát huy vai trò Đảng và Nhà nước","Đảng định hướng, Nhà nước thể chế hóa và tổ chức chính sách liên minh","Đảng làm thay mọi chủ thể","Nhà nước đứng ngoài","Không cần pháp luật"],
            ["vai trò Mặt trận và đoàn thể","Tập hợp, vận động, giám sát và phản biện để củng cố liên minh","Thay thế cơ quan quản lý","Chỉ tổ chức phong trào hình thức","Không cần phản ánh kiến nghị"],
            ["chuỗi nông sản công nghệ cao","Cần hợp đồng công bằng giữa nông dân, công nhân, trí thức, doanh nghiệp và cơ chế chia sẻ rủi ro","Doanh nghiệp quyết định toàn bộ lợi ích","Chỉ hỗ trợ kỹ thuật không cần hợp đồng","Tách nghiên cứu khỏi sản xuất"],
        ]},
    ],
    6: [
        {"section":"Chương 6 > B.1.1 > Khái niệm, đặc trưng và hai xu hướng dân tộc","difficulty":[4,3,2],"items":[
            ["dân tộc theo nghĩa quốc gia","Cộng đồng ổn định có lãnh thổ, kinh tế, ngôn ngữ và văn hóa chung","Chỉ nhóm cùng nghề","Chỉ cộng đồng tôn giáo","Nhóm cư trú tạm thời"],
            ["dân tộc theo nghĩa tộc người","Cộng đồng bền vững có ý thức tự giác, ngôn ngữ và văn hóa tộc người","Một quốc gia có chủ quyền","Một tầng lớp kinh tế","Một tổ chức chính trị"],
            ["đặc trưng lãnh thổ quốc gia","Lãnh thổ thống nhất là không gian sinh tồn và chủ quyền của cộng đồng quốc gia","Chỉ là nơi cư trú tùy ý","Không liên hệ chủ quyền","Có thể thiếu hoàn toàn"],
            ["đặc trưng kinh tế quốc gia","Thị trường và các liên hệ kinh tế chung gắn kết cộng đồng","Mỗi vùng tự cấp biệt lập","Chỉ cần cùng tiền tệ","Kinh tế không tạo liên kết"],
            ["xu hướng tách ra độc lập","Cộng đồng dân tộc bị áp bức có xu hướng đấu tranh xác lập quyền tự quyết","Mọi nhóm nghề đều lập quốc","Xu hướng chỉ do ngôn ngữ","Không liên hệ áp bức"],
            ["xu hướng liên hiệp dân tộc","Nhu cầu phát triển lực lượng sản xuất và giao lưu thúc đẩy các dân tộc xích lại gần nhau","Mọi dân tộc phải đồng hóa","Liên hiệp xóa chủ quyền","Chỉ xảy ra do cưỡng bức"],
            ["quan hệ hai xu hướng","Hai xu hướng khách quan vừa khẳng định độc lập vừa tăng hợp tác bình đẳng","Hai xu hướng loại trừ tuyệt đối","Chỉ xu hướng tách ra tồn tại","Hợp tác phủ nhận bản sắc"],
            ["phân biệt hai nghĩa dân tộc","Phải dựa vào phạm vi quốc gia hay cộng đồng tộc người trong ngữ cảnh","Hai nghĩa luôn đồng nhất","Chỉ dựa số dân","Chỉ dựa nơi cư trú"],
            ["hợp tác khu vực","Phải tôn trọng độc lập, bản sắc và cùng có lợi khi tăng liên kết","Đòi từ bỏ chủ quyền","Cho phép dân tộc lớn áp đặt","Buộc đồng nhất văn hóa"],
        ]},
        {"section":"Chương 6 > B.1.2 > Cương lĩnh dân tộc của chủ nghĩa Mác – Lênin","difficulty":[4,3,2],"items":[
            ["các dân tộc hoàn toàn bình đẳng","Mọi dân tộc có quyền và nghĩa vụ ngang nhau, không dân tộc nào có đặc quyền","Bình đẳng chỉ trên danh nghĩa","Dân tộc lớn được ưu tiên","Không cần chống kỳ thị"],
            ["quyền dân tộc tự quyết","Dân tộc có quyền quyết định chế độ và con đường phát triển, kể cả phân lập hay liên hiệp","Mọi nhóm nhỏ tùy ý ly khai","Chỉ là quyền văn hóa","Do nước lớn quyết định"],
            ["liên hiệp công nhân các dân tộc","Công nhân các dân tộc đoàn kết chống áp bức và chủ nghĩa dân tộc hẹp hòi","Công nhân phải tách theo dân tộc","Chỉ liên minh trong một nghề","Phủ nhận lợi ích dân tộc"],
            ["quan hệ ba nội dung cương lĩnh","Bình đẳng là cơ sở, tự quyết là quyền, liên hiệp công nhân là bảo đảm đoàn kết","Ba nội dung độc lập","Tự quyết loại trừ liên hiệp","Chỉ bình đẳng là đủ"],
            ["chống đặc quyền dân tộc","Phải xóa bỏ phân biệt đối xử và tạo điều kiện phát triển thực chất","Chỉ cần tuyên bố bình đẳng","Cho phép ưu thế dân tộc đông","Không cần hỗ trợ dân tộc yếu"],
            ["hiểu đúng tự quyết","Cần xuất phát lợi ích dân tộc và tiến bộ, chống lợi dụng ly khai phản động","Mọi yêu sách ly khai đều tiến bộ","Tự quyết do bên ngoài áp đặt","Tự quyết phủ nhận toàn vẹn quốc gia"],
            ["chủ nghĩa dân tộc hẹp hòi","Làm suy yếu đoàn kết giữa người lao động các dân tộc","Luôn bảo vệ bình đẳng","Là cơ sở của quốc tế vô sản","Không gây chia rẽ"],
            ["chính sách ngôn ngữ","Bảo đảm quyền dùng tiếng nói dân tộc đồng thời tạo điều kiện giao lưu chung","Cấm ngôn ngữ thiểu số","Tách biệt giáo dục","Ép đồng hóa"],
            ["tranh chấp bị kích động","Cần bảo vệ bình đẳng, đối thoại và đoàn kết, đồng thời ngăn lợi dụng tự quyết","Ủng hộ chia rẽ ngay","Để nước ngoài quyết định","Phủ nhận mọi quyền dân tộc"],
        ]},
        {"section":"Chương 6 > B.1.3 > Đặc điểm và chính sách dân tộc Việt Nam","difficulty":[4,4,1],"items":[
            ["cộng đồng dân tộc Việt Nam","Việt Nam thống nhất gồm nhiều dân tộc cùng sinh sống, đoàn kết lâu đời","Chỉ có một dân tộc","Các dân tộc không giao lưu","Mỗi dân tộc có quốc gia riêng"],
            ["chênh lệch phát triển","Trình độ kinh tế – xã hội giữa các dân tộc còn không đều","Mọi vùng đã ngang nhau","Chênh lệch chỉ do văn hóa","Không cần chính sách hỗ trợ"],
            ["cư trú xen kẽ","Các dân tộc phân bố xen kẽ, không có lãnh thổ tộc người riêng biệt","Mỗi dân tộc cư trú tách biệt","Chỉ sống ở đồng bằng","Không có di cư"],
            ["dân tộc thiểu số ở địa bàn chiến lược","Nhiều cộng đồng sống tại biên giới, miền núi có vị trí quốc phòng, an ninh quan trọng","Chỉ tập trung đô thị","Không liên hệ an ninh","Không có tài nguyên"],
            ["bản sắc văn hóa dân tộc","Mỗi dân tộc có sắc thái riêng góp phần tạo văn hóa Việt Nam thống nhất trong đa dạng","Bản sắc phải bị đồng hóa","Đa dạng cản trở đoàn kết","Chỉ văn hóa đa số có giá trị"],
            ["nguyên tắc chính sách dân tộc","Bình đẳng, đoàn kết, tôn trọng và giúp nhau cùng phát triển","Ban phát từ dân tộc lớn","Đồng hóa cưỡng bức","Tách phát triển khỏi đoàn kết"],
            ["phát triển vùng dân tộc","Cần đầu tư hạ tầng, giáo dục, y tế, sinh kế và phát huy nội lực","Chỉ trợ cấp ngắn hạn","Khai thác tài nguyên bất kể dân sinh","Áp một mô hình sinh kế"],
            ["cán bộ dân tộc thiểu số","Cần đào tạo, sử dụng đội ngũ tại chỗ và bảo đảm sự tham gia","Chỉ điều cán bộ nơi khác","Không cần tiếng bản địa","Không cần dân tham gia"],
            ["dự án ở vùng dân tộc","Phải tham vấn cộng đồng, bảo vệ sinh kế và văn hóa cùng mục tiêu phát triển","Chỉ tính lợi nhuận","Di dời không tham vấn","Bỏ qua tri thức bản địa"],
        ]},
        {"section":"Chương 6 > B.2.1 > Bản chất, nguồn gốc và tính chất của tôn giáo","difficulty":[3,4,2],"items":[
            ["bản chất tôn giáo","Là hình thái ý thức xã hội phản ánh hư ảo hiện thực và có niềm tin, nghi lễ, tổ chức","Chỉ là tri thức khoa học","Chỉ là phong tục","Không có cơ sở xã hội"],
            ["nguồn gốc tự nhiên – kinh tế","Sự bất lực trước tự nhiên và các lực lượng kinh tế – xã hội góp phần nảy sinh tôn giáo","Chỉ do thiếu giáo dục","Chỉ do cá nhân bịa đặt","Không liên hệ điều kiện sống"],
            ["nguồn gốc nhận thức","Giới hạn nhận thức và việc tuyệt đối hóa mặt nào đó tạo khả năng phản ánh hư ảo","Khoa học càng phát triển tôn giáo tự tăng","Nhận thức không liên hệ tôn giáo","Chỉ người không biết chữ có tôn giáo"],
            ["nguồn gốc tâm lý","Sợ hãi, hy vọng, lòng biết ơn và nhu cầu tinh thần góp phần duy trì niềm tin","Chỉ do cưỡng bức pháp luật","Không có yếu tố tình cảm","Chỉ do lợi ích kinh tế"],
            ["tính lịch sử của tôn giáo","Tôn giáo ra đời, biến đổi và có thể mất đi theo điều kiện lịch sử","Tôn giáo bất biến","Có trước loài người","Không đổi theo xã hội"],
            ["tính quần chúng","Tôn giáo đáp ứng nhu cầu tinh thần của một bộ phận đông đảo nhân dân","Mọi tín đồ đều mê tín","Chỉ giới chức theo đạo","Không có giá trị văn hóa"],
            ["tính chính trị","Xuất hiện khi tôn giáo bị các lực lượng xã hội sử dụng trong quan hệ lợi ích và quyền lực","Mọi sinh hoạt tôn giáo đều phản động","Tôn giáo không bao giờ bị lợi dụng","Đức tin đồng nhất chính trị"],
            ["phân biệt tín ngưỡng và mê tín","Cần tôn trọng nhu cầu chính đáng nhưng chống hành vi mê muội gây hại","Phải cấm mọi tín ngưỡng","Mê tín là quyền bất khả hạn chế","Hai hiện tượng luôn giống nhau"],
            ["xử lý lễ nghi gây hại","Bảo đảm tự do niềm tin nhưng ngăn hành vi xâm hại sức khỏe, tài sản theo pháp luật","Cấm toàn bộ tôn giáo","Bỏ qua vì là đức tin","Để tổ chức tự xử không theo luật"],
        ]},
        {"section":"Chương 6 > B.2.1.2–B.3 > Giải quyết tôn giáo và quan hệ dân tộc – tôn giáo","difficulty":[3,4,2],"items":[
            ["tôn trọng tự do tín ngưỡng","Bảo đảm quyền theo hoặc không theo tôn giáo và bình đẳng trước pháp luật","Khuyến khích cưỡng ép theo đạo","Chỉ bảo vệ người có đạo","Cấm thay đổi niềm tin"],
            ["khắc phục ảnh hưởng tiêu cực","Phải gắn với cải tạo xã hội cũ và nâng cao đời sống vật chất, tinh thần","Chỉ dùng mệnh lệnh hành chính","Chỉ tranh luận giáo lý","Không cần phát triển xã hội"],
            ["phân biệt hai mặt tôn giáo","Cần phân biệt nhu cầu tín ngưỡng với việc lợi dụng tôn giáo cho mục đích chính trị","Đồng nhất tín đồ với kẻ lợi dụng","Mọi hoạt động đều thuần túy tôn giáo","Không cần căn cứ hành vi"],
            ["quan điểm lịch sử – cụ thể","Đánh giá từng tôn giáo, thời kỳ và vấn đề trên điều kiện cụ thể","Dùng một kết luận bất biến","Không xét bối cảnh","Suy từ cá nhân ra cộng đồng"],
            ["đặc điểm tôn giáo Việt Nam","Việt Nam có nhiều tôn giáo, tín đồ đông, phần lớn đồng hành cùng dân tộc","Chỉ có một tôn giáo","Tín đồ tách khỏi dân tộc","Không có giao lưu tôn giáo"],
            ["chính sách tôn giáo Việt Nam","Đoàn kết đồng bào có và không có đạo, bảo đảm sinh hoạt hợp pháp và đấu tranh với lợi dụng","Hạn chế quyền theo đạo","Ưu đãi một tôn giáo","Đồng nhất quản lý với cấm đoán"],
            ["quan hệ dân tộc – tôn giáo","Hai lĩnh vực gắn bó, có thể củng cố đoàn kết hoặc bị lợi dụng gây chia rẽ","Hoàn toàn độc lập","Tôn giáo quyết định dân tộc","Dân tộc loại bỏ niềm tin"],
            ["vai trò hệ thống chính trị cơ sở","Phải gần dân, nắm tình hình, vận động và giải quyết nhu cầu chính đáng","Chỉ xử lý khi có xung đột","Không cần người uy tín","Dùng cưỡng chế là chính"],
            ["tin giả kích động chia rẽ","Cần xác minh, đối thoại với chức sắc và cộng đồng, xử lý hành vi vi phạm theo luật","Quy kết toàn bộ tín đồ","Cắt mọi kênh đối thoại","Chấp nhận thông tin chưa kiểm chứng"],
        ]},
    ],
    7: [
        {"section":"Chương 7 > B.1.1–B.1.2 > Khái niệm và vị trí gia đình","difficulty":[3,3,1],"items":[
            ["khái niệm gia đình","Gia đình là cộng đồng đặc biệt hình thành chủ yếu từ hôn nhân, huyết thống và nuôi dưỡng","Chỉ là người cùng nơi ở","Chỉ là đơn vị tiêu dùng","Không có ràng buộc trách nhiệm"],
            ["cơ sở hôn nhân","Quan hệ vợ chồng hợp pháp và tự nguyện là một nền tảng hình thành gia đình","Mọi hôn nhân do ép buộc","Hôn nhân không tạo quyền nghĩa vụ","Chỉ huyết thống tạo gia đình"],
            ["cơ sở huyết thống","Quan hệ cha mẹ, con cái và họ hàng tạo sự gắn kết thế hệ","Chỉ quan hệ kinh tế","Không phát sinh chăm sóc","Thay thế hoàn toàn hôn nhân"],
            ["cơ sở nuôi dưỡng","Chăm sóc và trách nhiệm có thể xác lập quan hệ gia đình cả khi không cùng huyết thống","Chỉ người cùng máu là gia đình","Nuôi dưỡng không có nghĩa vụ","Chỉ là giao dịch kinh tế"],
            ["gia đình là tế bào xã hội","Sự ổn định và phát triển gia đình tác động trực tiếp đến xã hội","Gia đình biệt lập xã hội","Xã hội không tác động gia đình","Gia đình chỉ là việc riêng"],
            ["gia đình là tổ ấm","Gia đình đáp ứng nhu cầu tình cảm, bảo vệ và phát triển cá nhân","Chỉ cung cấp thu nhập","Không có chức năng tinh thần","Luôn hạn chế cá nhân"],
            ["gia đình là cầu nối","Gia đình truyền chuẩn mực xã hội cho cá nhân và phản ánh tác động xã hội vào đời sống","Cá nhân tiếp xúc xã hội không qua gia đình","Gia đình thay thế mọi tổ chức","Chỉ nối các thế hệ bằng tài sản"],
        ]},
        {"section":"Chương 7 > B.1.3 > Các chức năng cơ bản của gia đình","difficulty":[3,3,1],"items":[
            ["tái sản xuất con người","Gia đình duy trì nòi giống và góp phần tái tạo nguồn nhân lực xã hội","Chỉ tạo thu nhập","Chỉ duy trì tài sản","Không liên hệ dân số"],
            ["nuôi dưỡng và giáo dục","Gia đình hình thành nhân cách, tri thức, đạo đức và thói quen ban đầu","Chỉ nhà trường giáo dục","Chỉ truyền kỹ năng nghề","Không cần phối hợp xã hội"],
            ["chức năng kinh tế","Gia đình tham gia sản xuất, tạo thu nhập và tổ chức đời sống vật chất","Chỉ tiêu dùng thụ động","Không tham gia lao động","Không chịu tác động thị trường"],
            ["tổ chức tiêu dùng","Gia đình phân bổ nguồn lực để đáp ứng nhu cầu vật chất và tinh thần của thành viên","Mỗi người tiêu dùng không cần phối hợp","Chỉ tích lũy tài sản","Không liên hệ mức sống"],
            ["thỏa mãn tâm sinh lý","Gia đình đáp ứng tình cảm, tình dục chính đáng, chăm sóc và cân bằng tâm lý","Chỉ có chức năng sinh con","Không tạo hỗ trợ tinh thần","Thay thế dịch vụ y tế"],
            ["chức năng văn hóa và chính trị","Gia đình lưu giữ văn hóa và là môi trường thực hiện quyền, nghĩa vụ công dân","Không liên hệ văn hóa","Đứng ngoài quản lý xã hội","Chỉ truyền tài sản"],
            ["phối hợp giáo dục trẻ","Gia đình cần phối hợp nhà trường và xã hội nhưng giữ vai trò nền tảng","Giao toàn bộ cho nhà trường","Chỉ dùng mệnh lệnh","Không cần nêu gương"],
        ]},
        {"section":"Chương 7 > B.2 > Cơ sở xây dựng gia đình và chế độ hôn nhân tiến bộ","difficulty":[3,2,2],"items":[
            ["cơ sở kinh tế – xã hội","Phát triển lực lượng sản xuất và xóa sở hữu tư nhân về tư liệu chủ yếu tạo nền tảng bình đẳng","Chỉ tăng tiêu dùng","Duy trì phụ thuộc kinh tế","Không liên hệ bình đẳng giới"],
            ["cơ sở chính trị – xã hội","Nhà nước của nhân dân và pháp luật tiến bộ bảo vệ quyền thành viên gia đình","Gia đình không cần pháp luật","Chỉ phong tục điều chỉnh","Nhà nước quyết định hôn nhân cá nhân"],
            ["cơ sở văn hóa","Giá trị mới về bình đẳng, trách nhiệm và tình yêu hỗ trợ quan hệ gia đình tiến bộ","Phủ nhận mọi truyền thống","Chỉ kinh tế quyết định trực tiếp","Chấp nhận định kiến giới"],
            ["hôn nhân tự nguyện","Nam nữ tự do lựa chọn trên cơ sở tình yêu và không bị cưỡng ép","Cha mẹ quyết định tuyệt đối","Kết hôn vì trao đổi tài sản","Không được ly hôn trong mọi trường hợp"],
            ["một vợ một chồng","Quan hệ hôn nhân bình đẳng, chung thủy và phù hợp điều kiện giải phóng phụ nữ","Cho phép đặc quyền đa thê","Chỉ ràng buộc phụ nữ","Không liên hệ bình đẳng"],
            ["hôn nhân được pháp luật bảo đảm","Đăng ký và pháp luật bảo vệ quyền, nghĩa vụ chính đáng của các bên và con cái","Tình cảm không cần trách nhiệm pháp lý","Pháp luật thay thế tình yêu","Chỉ bảo vệ người có tài sản"],
            ["trường hợp cưỡng ép kết hôn","Phải tôn trọng quyền quyết định của người kết hôn và ngăn cưỡng ép theo pháp luật","Ưu tiên ý chí gia đình","Chấp nhận vì phong tục","Chỉ xem xét lợi ích kinh tế"],
        ]},
        {"section":"Chương 7 > B.3.1 > Sự biến đổi của gia đình Việt Nam","difficulty":[2,3,2],"items":[
            ["biến đổi quy mô gia đình","Gia đình có xu hướng thu nhỏ, gia đình hạt nhân ngày càng phổ biến","Gia đình luôn mở rộng","Không đổi theo đô thị hóa","Mọi thế hệ cùng ở bắt buộc"],
            ["biến đổi tái sản xuất","Mức sinh và quan niệm số con thay đổi theo điều kiện kinh tế – xã hội","Chỉ do sở thích cá nhân","Không liên hệ chính sách dân số","Luôn tăng ở mọi nơi"],
            ["biến đổi chức năng kinh tế","Gia đình từ đơn vị sản xuất tự cấp chuyển mạnh sang sản xuất hàng hóa và tiêu dùng thị trường","Hoàn toàn ngừng lao động","Trở lại tự cấp","Không chịu tác động thị trường"],
            ["biến đổi chức năng giáo dục","Gia đình chia sẻ nhiều hơn với nhà trường, xã hội nhưng trách nhiệm nền tảng vẫn còn","Gia đình hết vai trò","Nhà trường thay thế cha mẹ","Giáo dục chỉ là truyền nghề"],
            ["biến đổi quan hệ vợ chồng","Bình đẳng và chia sẻ tăng lên, dù định kiến và xung đột mới vẫn tồn tại","Quyền gia trưởng tăng tất yếu","Không có thay đổi","Bình đẳng xóa mọi trách nhiệm"],
            ["biến đổi quan hệ thế hệ","Tính độc lập cá nhân tăng và khoảng cách thế hệ có thể rõ hơn","Con cái hoàn toàn phụ thuộc suốt đời","Không có xung đột giá trị","Người cao tuổi mất mọi vai trò"],
            ["gia đình có cha mẹ di cư","Cần duy trì chăm sóc, giao tiếp và phối hợp người nuôi dưỡng để bảo đảm chức năng gia đình","Chỉ gửi tiền là đủ","Giao toàn bộ cho nhà trường","Không cần hỗ trợ tâm lý"],
        ]},
        {"section":"Chương 7 > B.3.2 > Phương hướng xây dựng gia đình Việt Nam","difficulty":[3,3,1],"items":[
            ["tăng cường lãnh đạo và nhận thức","Cần nâng cao nhận thức, trách nhiệm của hệ thống chính trị và xã hội về gia đình","Coi gia đình hoàn toàn riêng tư","Chỉ giao Hội phụ nữ","Không cần giáo dục"],
            ["phát triển kinh tế gia đình","Chính sách việc làm, thu nhập và an sinh tạo điều kiện vật chất cho gia đình bền vững","Chỉ tuyên truyền đạo đức","Không cần dịch vụ xã hội","Thu nhập không ảnh hưởng gia đình"],
            ["kế thừa giá trị truyền thống","Giữ gìn tình nghĩa, trách nhiệm, hiếu thảo đồng thời loại bỏ gia trưởng và định kiến","Giữ mọi phong tục cũ","Phủ nhận toàn bộ truyền thống","Đồng nhất truyền thống với bất bình đẳng"],
            ["tiếp thu giá trị tiến bộ","Đề cao bình đẳng giới, quyền trẻ em, tự nguyện và tôn trọng cá nhân","Sao chép lối sống cực đoan","Loại bỏ gắn kết thế hệ","Coi cá nhân không có nghĩa vụ"],
            ["xây dựng gia đình văn hóa","Phải gắn tiêu chí với hành vi thực chất, không chạy theo danh hiệu hình thức","Chỉ cần giấy công nhận","Không cần phòng chống bạo lực","Chỉ xét mức thu nhập"],
            ["dịch vụ hỗ trợ gia đình","Cần phát triển tư vấn, chăm sóc trẻ em, người cao tuổi và phòng chống bạo lực","Gia đình phải tự giải quyết mọi việc","Chỉ xử lý sau khủng hoảng","Không cần nhân lực chuyên môn"],
            ["khu dân cư xây chương trình gia đình","Nên kết hợp sinh kế, giáo dục, bình đẳng giới, tư vấn và cơ chế bảo vệ thành viên","Chỉ tổ chức thi danh hiệu","Chỉ tuyên truyền một lần","Bỏ qua nhóm dễ tổn thương"],
        ]},
    ],
}


def repeated_cycle(sequence: list[int]) -> bool:
    for period in range(2, 5):
        for start in range(len(sequence) - period * 3 + 1):
            if sequence[start : start + period * 3] == sequence[start : start + period] * 3:
                return True
    return False


def answer_sequence(chapter_num: int, targets: list[int]) -> list[int]:
    base = [position for position, count in enumerate(targets) for _ in range(count)]
    rng = random.Random(131_000 + chapter_num)
    for _ in range(50_000):
        rng.shuffle(base)
        run = max(len(match.group(0)) for match in re.finditer(r"(0+|1+|2+|3+)", "".join(map(str, base))))
        if run <= 3 and not repeated_cycle(base):
            return base.copy()
    raise RuntimeError(f"Cannot construct answer sequence for chapter {chapter_num}")


def difficulty_sequence(counts: list[int]) -> list[str]:
    names = ["Nhận biết", "Thông hiểu", "Vận dụng"]
    remaining = counts.copy()
    result: list[str] = []
    cursor = 0
    while sum(remaining):
        for offset in range(3):
            index = (cursor + offset) % 3
            if remaining[index]:
                result.append(names[index])
                remaining[index] -= 1
                cursor = (index + 1) % 3
                break
    return result


def balance_options(options: list[str]) -> list[str]:
    replacements = {
        "Chỉ ": "Đơn thuần là ", "chỉ ": "đơn thuần ", "Mọi ": "Các ", "mọi ": "các ",
        "toàn bộ": "trọn vẹn", "hoàn toàn": "về căn bản", "không cần": "không đòi hỏi",
        "tự động": "tất yếu", "duy nhất": "riêng biệt", "bất kỳ": "một",
        "thay thế": "đảm nhiệm thay", "đứng ngoài": "tách khỏi", "loại bỏ": "gạt bỏ",
        "phủ nhận": "bác bỏ", "tuyệt đối": "vô điều kiện", "không bao giờ": "chẳng khi nào",
    }
    cleaned = []
    for option in options:
        for old, new in replacements.items():
            option = option.replace(old, new)
        cleaned.append(option)
    cleaned = [option + ", xét trong phạm vi nội dung, mối quan hệ, điều kiện, bối cảnh cụ thể và cách diễn giải mà câu hỏi đang đặt ra" for option in cleaned]
    cue_words = ("chỉ", "mọi", "toàn bộ", "hoàn toàn", "không cần", "tự động", "duy nhất", "bất kỳ", "thay thế", "đứng ngoài", "khép kín", "loại bỏ", "phủ nhận", "tuyệt đối", "không bao giờ")
    folded = [option.casefold() for option in cleaned]
    if not any(word in folded[0] for word in cue_words) and sum(any(word in option for word in cue_words) for option in folded[1:]) >= 2:
        cleaned[0] = "Không chỉ xét về hình thức, " + cleaned[0][0].lower() + cleaned[0][1:]
    while len(cleaned[0]) < min(map(len, cleaned[1:])):
        cleaned[0] += ", đồng thời được coi là căn cứ trực tiếp để nhận diện vấn đề"
    if len(cleaned[0]) > max(map(len, cleaned[1:])):
        shortest = min(range(1, 4), key=lambda index: len(cleaned[index]))
        while len(cleaned[shortest]) < len(cleaned[0]):
            cleaned[shortest] += ", đồng thời được coi là căn cứ trực tiếp để nhận diện vấn đề"
    return cleaned


def build() -> None:
    chapters_dir = ROOT / "chapters"
    chapters_dir.mkdir(exist_ok=True)
    for chapter_num, groups in GROUPS.items():
        title, target, positions = CHAPTERS[chapter_num]
        answers = answer_sequence(chapter_num, positions)
        records = []
        sequence = 0
        for group in groups:
            items = group["items"]
            difficulties = difficulty_sequence(group["difficulty"])
            if len(items) != len(difficulties):
                raise ValueError(f"Chapter {chapter_num}, section {group['section']}: item/difficulty mismatch")
            for item, difficulty in zip(items, difficulties):
                sequence += 1
                if len(item) == 7:
                    topic, stem, correct, d1, d2, d3, evidence = item
                    explanation = evidence
                else:
                    topic, correct, d1, d2, d3 = item
                    stems = [
                        "Theo giáo trình, nhận định nào đúng về {}?",
                        "Nội dung nào phản ánh đúng {}?",
                        "Điểm cốt lõi của {} là gì?",
                        "Cách hiểu nào phù hợp về {}?",
                        "Giáo trình nhấn mạnh điều gì khi bàn về {}?",
                        "Phát biểu nào diễn đạt chính xác {}?",
                        "Kết luận nào đúng khi xem xét {}?",
                        "Yếu tố nào gắn trực tiếp với {}?",
                    ]
                    stem = stems[(sequence - 1) % len(stems)].format(topic)
                    evidence = f"Về {topic}, giáo trình xác định: {correct[0].lower() + correct[1:]}."
                    explanation = evidence + " Các phương án khác làm sai lệch phạm vi, điều kiện hoặc bản chất của nội dung này."
                answer = answers[sequence - 1]
                options = balance_options([correct, d1, d2, d3])
                options[0], options[answer] = options[answer], options[0]
                kind = {
                    "Nhận biết": "nhan_biet_khai_niem",
                    "Thông hiểu": "thong_hieu_phan_biet" if sequence % 2 else "trinh_tu_quan_he",
                    "Vận dụng": "van_dung_tinh_huong",
                }[difficulty]
                records.append({
                    "id": f"MLN131-C{chapter_num:02d}-Q{sequence:03d}",
                    "courseId": "mln131",
                    "chapter": title,
                    "chapterNum": chapter_num,
                    "topic": topic,
                    "difficulty": difficulty,
                    "kind": kind,
                    "stem": stem,
                    "options": options,
                    "answer": answer,
                    "explanation": explanation,
                    "source": {"file": SOURCE, "section": group["section"], "text": evidence},
                })
        if len(records) != target:
            raise ValueError(f"Chapter {chapter_num}: expected {target}, got {len(records)}")
        path = chapters_dir / f"chapter-{chapter_num:02d}.json"
        path.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    build()
