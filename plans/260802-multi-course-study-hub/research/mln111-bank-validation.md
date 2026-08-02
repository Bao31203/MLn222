# MLN111 Bank Validation

## Outcome

The production candidate contains 380 reviewed questions covering the current three-chapter MLN111 scope. All reported Critical, High, and Medium editorial findings were resolved before sign-off. The bank remains authoring content only; it is not wired into the current website until the implementation plan is executed.

Canonical bank SHA-256: `4aaa199ba2ee3bfb9cda2c7dbb0346dfb04a7126ca7834adf0dc8dfb2eeb394c`.

## Coverage and distribution

| Chapter | Questions | Nhận biết | Thông hiểu | Vận dụng | A/B/C/D |
|---|---:|---:|---:|---:|---:|
| 1. Khái luận về triết học và triết học Mác – Lênin | 70 | 28 | 28 | 14 | 18/18/17/17 |
| 2. Chủ nghĩa duy vật biện chứng | 150 | 60 | 60 | 30 | 38/38/37/37 |
| 3. Chủ nghĩa duy vật lịch sử | 160 | 64 | 64 | 32 | 40/40/40/40 |
| **Total** | **380** | **152** | **152** | **76** | **96/96/94/94** |

Production citations use only the official textbook (92 questions) and the current three-chapter summary (288 questions). The 2023 review notes and legacy “350 câu” file informed scope/error discovery but are not cited as sole production evidence.

## Editorial review

- Chapter 1: reviewed all 70 questions; repaired 18 IDs covering French/English utopian-socialist attribution, duplicated objectives, difficulty calibration, distractor quality, and answer-length cues.
- Chapter 2: reviewed all 150 questions; repaired 16 content IDs, added missing forms/roles of practice, contradiction classifications, forms of cognition, and the definition of truth.
- Chapter 3: reviewed all 160 questions; repaired 27 content IDs, added the object/leading class of social revolution and distinctions among religious, scientific, and philosophical consciousness.
- Chapter 2 and Chapter 3 originally had a perfectly repeating A–B–C–D key. Options were deterministically permuted while preserving the correct answer and target totals. All three chapters now have no exact answer period up to 16; maximum same-position runs are 2, 2, and 3.
- Two independent final checks on Chapter 3 verified all changed answer keys after permutation. Source-trace corrections for Q068, Q070, Q100, and Q102 were applied afterward without changing the answer sequence.

## Automated checks

- JSON parses as UTF-8; exact question schema and allowed `kind` values pass.
- IDs are continuous and unique; normalized stems are unique.
- Every question has four distinct options, one bounded answer, a non-empty explanation, and complete source metadata.
- No banned combined-answer phrases, auxiliary production sources, malformed course/chapter identity, or application question with the wrong kind remain.
- Per-chapter question, difficulty, and answer-position matrices match the authoring contract exactly.
- Existing application baseline remains green: 41/41 Python tests and 141/141 Node tests.
- `git diff --check` is a final release/worktree gate; no content or plan file is staged, committed, pushed, or deployed by this session.

## Sign-off invalidation

The companion `content/subjects/mln111/review-signoff.json` binds readiness to the canonical bank hash and the three exact chapter-file hashes. Any content edit invalidates `studyReady` until validation and editorial review are repeated and the sign-off is regenerated.
