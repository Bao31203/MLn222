---
date: 2026-07-17
type: research
status: completed
topic: existing-build-and-test-integration
---

# Codebase integration review

## Summary

Dự án hiện là HTML tĩnh với pipeline Python nhỏ và có thể mở trực tiếp bằng `file://`. Không cần đổi framework. Node 26.3.0 và npm 11.16.0 có sẵn, đủ dùng `node:test` mà không thêm dependency.

## Relevant files

- `build_html.py:12-17`: khai báo bank, template, output và placeholder duy nhất.
- `build_html.py:20-28`: serializer hiện harden `<`, U+2028 và U+2029 cho JSON inline.
- `build_html.py:31-84`: đọc snapshot, validate, thay placeholder và atomic replace `index.html`.
- `template.html:1-118`: CSS và responsive rules hiện tại, `.wrap` tối đa 880 px.
- `template.html:124-130`: ba mode dùng ordinary buttons và `aria-pressed`.
- `template.html:188-189`: question payload nhúng trong inline script.
- `template.html:198-239`: study storage `mln222.v2.*` và fallback khi localStorage lỗi.
- `template.html:241-510`: state/render/wiring monolithic cho quiz, flashcard và search.
- `test_pipeline.py:221-245`: standalone payload và byte-equality hiện giả định chỉ một question placeholder.
- `test_pipeline.py:247-272`: storage, accessibility và safe source-rendering regressions.
- `test_pipeline.py:283-317`: isolated integration chỉ copy root scripts/template và chapter content.
- `README.md:13-54`: cam kết mở trực tiếp, mô tả source/generated artifacts và build commands.

## Integration recommendation

1. Không chèn game logic vào inline script hiện tại theo cách thủ công.
2. Giữ module JavaScript thuần trong `game/`, chạy Node test độc lập DOM.
3. Tạo `game/build-manifest.json` ở phase UI khi danh sách module đã ổn định.
4. Mở rộng Python builder thành pure render step đọc manifest theo thứ tự.
5. Nhúng structured JSON và SVG bằng serializer; validate JS source không chứa HTML-closing sequence.
6. Giữ `template.html` là source of truth và `index.html` generated-only.
7. Mở rộng isolated build test để copy toàn bộ `game/` và so output byte-for-byte.
8. Dùng storage key `mln222.game.v1` tách hoàn toàn `mln222.v2.*`.

## Risks

- Current `test_built_html_matches_current_template_and_bank` phải chuyển sang gọi cùng render function với builder; tự mô phỏng nhiều placeholder trong test dễ lệch production.
- Manifest/file order phải deterministic trên Windows; không dựa vào thứ tự filesystem.
- Raw SVG/JS inlining có thể đóng thẻ script/style; builder phải reject hoặc serialize đúng ngữ cảnh.
- Game layout cần scope CSS vì mode học hiện dùng `.wrap`, `.card`, `.controls` tên chung.
- Temporary integration test sẽ lỗi nếu bỏ sót asset/manifest khi copy fixture.

## Unresolved questions

Không có blocker. Lựa chọn JavaScript thuần + Node built-in test + Python packaging phù hợp toolchain hiện có.
