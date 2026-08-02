---
title: "Phase 01 - Subject registry and content contract"
description: "Create the canonical five-course registry and normalize source content without changing legacy MLN112 question IDs."
status: completed
priority: P1
effort: 4h
issue: null
branch: main
tags: [feature, content, architecture]
created: 2026-08-02
---

# Phase 01: Subject Registry and Content Contract

## Context links

- [Plan](./plan.md)
- [MLN111 source audit](./research/mln111-source-audit.md)
- [MLN111 bank validation](./research/mln111-bank-validation.md)
- [Codebase audit](./research/codebase-audit.md)
- [MLN111 authoring contract](../../content/subjects/mln111/AUTHORING.md)
- [MLN111 metadata](../../content/subjects/mln111/subject.json)

## Overview

- Priority: P1
- Status: Completed
- Owner: content-contract worker
- Goal: one canonical registry and one predictable content layout for five courses.
- Locked identity: immutable internal ID `mln112`, public code `MLN112`, and internal-only aliases `mln122`/`mln222`, as stated by the user. Never rewrite question IDs or localStorage/game keys; an automated scan catches unintended public legacy labels.

## Key insights

- Existing production content is six chapters/504 questions plus six YouTube lectures and a game.
- MLN111 target is 380 questions across 70/150/160 chapter files; its current metadata already defines stable chapter IDs.
- `comingSoon` courses must have metadata only. They must not declare question or lecture sources.
- Eliminate display-string joins: `(subjectId, chapterNum)` is the only authoring join and public `chapterId`/title come from metadata. Legacy repeated `chapter` strings are checked once during onboarding, not used as runtime keys.
- Moving the existing MLN112 authoring tree has no MVP value. Its metadata may reference current paths under `content/`; directory normalization is deferred.

## Requirements

### Functional

- Registry order: `mln111`, `mln112`, `mln131`, `hcm201`, `vnr201`.
- Status enum: `ready`, `draft`, `comingSoon`.
- Feature keys exactly: `quiz`, `flashcards`, `search`, `lectures`, `game`.
- MLN111: quiz/flashcards/search true; lectures/game false.
- MLN112: all five true and current question/video/game content preserved.
- Three placeholders: all features false and no bank/lecture paths.
- A `draft` subject compiles metadata only with `studyReady: false`; it never publishes a partial runtime bank or opens study modes.
- A `ready` subject requires `studyReady: true` derived by the compiler from full validation plus a review sign-off whose SHA-256 matches the canonical bank bytes.
- Each ready/draft course chapter has stable `{id, number, title, questionTarget}`.
- MLN112 source question IDs remain `C01-Q001` style. MLN111 IDs remain `MLN111-Cxx-Qxxx`.

### Non-functional

- UTF-8 JSON; deterministic registry ordering; no absolute machine paths in public metadata.
- Subject/chapter IDs use lowercase ASCII `^[a-z][a-z0-9-]{1,31}$`; reject `__proto__`, `prototype`, and `constructor`, including collisions after normalization.
- Exact-field schemas. Unknown keys fail later pipeline validation.
- No duplicate subject IDs, codes, chapter IDs, chapter numbers, or paths.
- Source citations stay in authoring questions; no HTML markup or remote executable content.
- Normalize authored text to NFC and reject NUL, C0/C1 controls other than tab/newline, and bidi override/isolate characters. Cap registry/metadata JSON at 256 KiB, each chapter JSON at 4 MiB, and each subject bank at 12 MiB before full parsing.
- Field caps: code/ID 32 code points, title 160, description 400, stem 600, option 400, explanation 1,600, and source file/section/text 320/320/1,200.

## Proposed contract

```json
{
  "schemaVersion": 1,
  "subjects": [{
    "id": "mln112",
    "code": "MLN112",
    "legacyAliases": ["mln122", "mln222"],
    "status": "ready",
    "metadataPath": "subjects/mln112/subject.json"
  }]
}
```

Each ready/draft `subject.json` owns title, description, feature flags, question target, chapter metadata, validation targets, and optional lecture manifest path. Authoring questions keep their current schema; the compiler derives `chapterId` by matching `chapterNum` to `subject.json`.

## Exclusive file ownership

| Action | Absolute path | Purpose |
|---|---|---|
| Create | `C:\Users\pgb31\mln222-quiz\content\subjects\registry.json` | Ordered five-course registry |
| Modify | `C:\Users\pgb31\mln222-quiz\content\subjects\mln111\subject.json` | Add validation targets/readiness fields |
| Preserve/verify | `C:\Users\pgb31\mln222-quiz\content\subjects\mln111\review-signoff.json` | Content-review result bound to canonical bank SHA-256 |
| Preserve/verify | `C:\Users\pgb31\mln222-quiz\content\subjects\mln111\AUTHORING.md` | Keep source and schema contract |
| Preserve/verify | `C:\Users\pgb31\mln222-quiz\content\subjects\mln111\chapters\chapter-01.json` through `chapter-03.json` | Confirm 380 reviewed questions; do not rewrite signed content during registry work |
| Create | `C:\Users\pgb31\mln222-quiz\content\subjects\mln112\subject.json` | Current-course metadata/profile referencing existing legacy content paths |
| Preserve/verify | `C:\Users\pgb31\mln222-quiz\content\chapters\chapter-01.json` through `chapter-06.json` | Existing MLN112 authoring sources remain in place and byte-identical |
| Preserve/verify | `C:\Users\pgb31\mln222-quiz\content\lectures.json` | Existing six-video manifest remains in place; compiler derives stable chapter IDs |
| Preserve/verify | `C:\Users\pgb31\mln222-quiz\content\AUTHORING.md` | Existing MLN112 authoring rules remain in place |
| Create | `C:\Users\pgb31\mln222-quiz\content\subjects\mln131\subject.json` | Placeholder metadata |
| Create | `C:\Users\pgb31\mln222-quiz\content\subjects\hcm201\subject.json` | Placeholder metadata |
| Create | `C:\Users\pgb31\mln222-quiz\content\subjects\vnr201\subject.json` | Placeholder metadata |

No Python, HTML, game, test, generated artifact, README, or docs files belong to this phase.

## Implementation steps

1. Check `git status`; preserve concurrent MLN111 authoring changes. Do not start moves until chapter 2/3 writers finish.
2. Record the locked identity tuple (`mln112`, `MLN112`, reviewed title, legacy aliases) and add an automated public-copy scan; do not reopen the public-code decision during implementation.
3. Define `registry.json` exact fields, display order, statuses, and metadata paths relative to `content/`.
4. Apply the normative ID grammar/reserved-name denylist, NFC/control policy, exact byte/field caps, and explicit `draft` metadata-only semantics before accepting any profile or question file.
5. Extend MLN111 metadata with validation targets, allowed kinds, source policy, and sign-off path. Derive `studyReady` only when all 380 questions validate and the sign-off hash matches; otherwise retain metadata-only `draft`.
6. Create MLN112 metadata: reference current `content/chapters` and `content/lectures.json`, declare six stable IDs `mln112-c01`…`mln112-c06`, targets 64/89/99/84/84/84, all feature flags true, and legacy aliases. Do not move existing sources.
7. Define the compiler-only normalization from each legacy lecture `chapterValue` to stable `chapterId`; retain playlist/video identity and leave the source manifest byte-identical.
8. Create three metadata-only placeholders. Use course code as reliable card label; mark unverified long-form titles as copy requiring owner review.
9. Parse every JSON file and check uniqueness, path existence, target sums, sign-off hash, and ready/draft invariants with read-only one-liners.
10. Record the content contract for Phase 2 in the phase handoff; do not add compatibility logic inside content files.

## Validation and tests

- Parse all `content/subjects/**/*.json` as UTF-8 JSON.
- Reject oversized inputs before parsing where possible; then assert NFC, field caps, control/bidi policy, reserved IDs, and normalization-collision safety.
- Assert registry has exactly five ordered unique IDs.
- Assert every metadata path resolves inside `content/subjects/`; reject `..` and absolute paths.
- Assert MLN111 counts `70/150/160`, total 380, difficulty `152/152/76`, answer positions `96/96/94/94` before setting ready.
- Assert MLN112 chapter files remain byte-equivalent to their pre-move blobs and total 504 IDs remain unchanged.
- Assert six lecture video IDs and playlist ID are unchanged and every lecture `chapterId` exists.
- Assert placeholders contain no chapters requiring questions and no enabled feature.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| MLN111 authoring/review incomplete at integration | Preserve metadata-only `draft`; readiness requires validator plus matching sign-off hash |
| Historical MLN122/MLN222 labels leak publicly | Lock MLN112 from the user requirement; retain aliases internally and scan rendered copy |
| Directory normalization breaks the current builder | Defer moves; reference current paths beneath `content/` and normalize only in compiler output |
| Lecture-to-chapter mapping changes silently | Compare six old `chapterValue` meanings to new stable chapter IDs |
| Placeholder title assumption is wrong | Display code first; mark long title as editable metadata |

## Security considerations

- Treat authored JSON as untrusted build input despite repository ownership.
- No HTML, script, URL, or path traversal fields in registry/subject metadata.
- Build keyed catalogs with `Map` or null-prototype objects; every object lookup must use an own-property check.
- Lecture provider and IDs remain allowlisted; no arbitrary iframe URL.
- Do not copy local source paths such as `F:\MLN111` into production catalogs.

## Success criteria

- Five-course registry and five subject metadata files parse and satisfy exact schemas.
- MLN111 has a truthful readiness state and complete profile targets.
- MLN112 content/video identity is preserved; only location and stable chapter linkage change.
- Three placeholders cannot advertise or point to nonexistent learning content.
- No owned path overlaps Phases 2–6.

## Completion record

- Completed: exact five-subject registry order and metadata contracts are in place.
- Completed: MLN111 is ready with 380 signed and validated questions; MLN112 retains 504 questions and six lecture identities.
- Completed: MLN131, HCM201, and VNR201 remain truthful dataless `comingSoon` subjects.

## Next steps

- Contract was frozen and consumed by [Phase 02](./phase-02-multi-subject-validation-build-pipeline.md) and [Phase 03](./phase-03-mln112-game-save-isolation.md).
