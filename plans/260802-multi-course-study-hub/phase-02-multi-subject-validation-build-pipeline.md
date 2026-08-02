---
title: "Phase 02 - Multi-subject validation and build pipeline"
description: "Generalize the Python composer, validator, and static builder around subject profiles and safe embedded catalogs."
status: completed
priority: P1
effort: 8h
issue: null
branch: main
tags: [refactor, backend, infra]
created: 2026-08-02
---

# Phase 02: Multi-subject Validation and Build Pipeline

## Context links

- [Plan](./plan.md)
- [Phase 01 content contract](./phase-01-subject-registry-content-contract.md)
- [Codebase audit](./research/codebase-audit.md)
- `C:\Users\pgb31\mln222-quiz\compose_questions.py`
- `C:\Users\pgb31\mln222-quiz\validate_questions.py`
- `C:\Users\pgb31\mln222-quiz\build_html.py`

## Overview

- Priority: P1
- Status: Completed
- Owner: pipeline worker
- Depends on: Phase 1 registry/schema freeze.
- May run in parallel with Phase 3 because ownership is limited to Python implementation files.

## Key insights

- Current composer and validator hard-code one directory, six counts, labels, source root, and MLN112 distribution.
- Current builder already uses safe inline JSON serialization and atomic output replacement; preserve both properties.
- Production needs three sanitized read models: public subject catalog, public question banks keyed by subject, and lecture catalogs keyed by subject. Raw authoring objects are never deployable.
- `chapterId` should be compiler-derived, avoiding a mass edit to 884 existing authored questions.

## Requirements

### Functional

- Load and exact-validate `content/subjects/registry.json` plus each `subject.json`.
- Compose each ready/draft subject independently; `num` restarts at 1 per subject.
- Inject `chapterId` from the profile’s `chapterNum` mapping; reject mismatched display labels or course IDs.
- Validate common question schema once, then enforce subject-specific targets/source rules from metadata.
- Enforce ready-state totals, per-chapter difficulty quotas, answer-position quotas, unique IDs/stems/options, allowed kinds, and valid source evidence.
- Validate `comingSoon` entries without attempting to open a question bank.
- Validate lecture manifests only when `features.lectures` is true; use stable `chapterId` and allowlisted YouTube IDs.
- Build deterministic `SUBJECT_CATALOG`, `QUESTION_BANKS`, and `LECTURE_CATALOGS` placeholders.
- Project each authored question into an exact public schema. Retain only learning fields and a sanitized citation label/section; omit source excerpts, local/raw filenames, validation policy, and authoring paths.
- Publish catalogs internally as null-prototype objects and expose only `hasSubject(id)`, `getSubject(id)`, `getQuestionBank(id)`, and `getLectures(id)` own-property-safe accessors. Consumers never index a catalog global directly.
- The public search document for each question is exactly `stem`, four options, explanation, topic, difficulty, chapter title, and sanitized citation label/section; raw source excerpts are not searchable.
- Preserve legacy CLI defaults sufficiently for maintainers and game fixtures.
- Provide `validate_questions.py --all --check` for read-only validation and `--report <path>` for an explicit report write; parallel/test phases must not touch the production report.

### Non-functional

- Python standard library only; no framework/package change.
- Registry/profile paths resolve beneath `content/subjects`; explicitly declared chapter/lecture sources resolve beneath `content/`. Reject traversal, symlinks escaping `content/`, absolute paths, aliases, and duplicates.
- Enforce Phase 1's ID grammar/reserved-name policy, NFC/control/bidi rules, and exact input/field size caps before catalog construction.
- Serialize `<`, U+2028, and U+2029 safely for inline script context.
- Snapshot validated bytes before render and atomically replace output only after complete success.
- Build output must be byte-deterministic for identical inputs.
- Emit a deterministic release manifest containing artifact SHA-256 values and CSP SHA-256 hashes for every inline script/style; Phase 6 consumes this exact manifest when generating deployment headers.
- Report raw and gzip sizes and fail the production gate above 3.0 MiB raw or 700 KiB gzip.
- Over-budget output is a hard failure in this release; do not introduce lazy fetching, service workers, or a second loading/error state machine.

## Architecture and data flow

```text
registry.json -> load_registry()
  -> subject.json -> compose_subject() -> validate_subject()
  -> public metadata + normalized question bank + normalized lectures
  -> build_catalogs()
  -> template placeholders -> atomic index.html
```

Recommended helper API:

```python
load_registry(root) -> Registry
load_subject_profile(root, registry_item) -> SubjectProfile
compose_subject(root, profile) -> list[dict]
validate_subject(profile, questions) -> ValidationResult
build_catalogs(root) -> tuple[public_catalog, question_banks, lecture_catalogs]
```

Public metadata excludes local source-policy fields. The public question projection exposes only an allowlisted citation label and section needed by the UI; authoring `source.text`, raw paths/filenames, and internal evidence never cross the build boundary.

## Exclusive file ownership

| Action | Absolute path | Purpose |
|---|---|---|
| Modify | `C:\Users\pgb31\mln222-quiz\compose_questions.py` | Profile-driven subject composition and compatible CLI |
| Modify | `C:\Users\pgb31\mln222-quiz\validate_questions.py` | Shared schema validator plus per-subject profiles |
| Modify | `C:\Users\pgb31\mln222-quiz\build_html.py` | Build and safely embed multi-subject catalogs |
| Create | `C:\Users\pgb31\mln222-quiz\subject_catalog.py` | Central registry/profile/path/normalization helpers |

Do not edit content, `template.html`, game JS, tests, `index.html`, `questions.json`, reports, README, or docs. Use temporary directories for all phase-local builds.

## Implementation steps

1. Capture current CLI/import behavior, then run a 30-minute preflight using the actual sanitized 884-question public projection. Record raw/gzip estimates and lock embedded-only packaging before Phase 4; stop this plan if it already misses budget.
2. Implement strict dataless registry/profile loaders in `subject_catalog.py`. Use resolved-path containment checks for every metadata, chapter, and lecture path.
3. Move reusable schema constants and normalization into the helper without creating circular imports.
4. Refactor composer to accept `--subject <id>`, `--all`, `--check`, and optional `--output`. Keep no-argument behavior producing the legacy MLN112 snapshot expected by existing workflows; never write production artifacts during `--check`.
5. Compose ordered chapter files using `(subjectId, chapterNum)` only. During one-time onboarding, compare legacy repeated chapter labels with an explicit normalization table; emit public `chapter` and `chapterId` solely from profile metadata, plus per-subject `num`.
6. Refactor validator into common and profile layers. Add `--all`, `--subject`, `--check`, and explicit `--report`; keep the no-argument legacy MLN112 report behavior. Retain existing checks for exact fields, four options, one bounded answer, safe text, truncation, repeated stems/options, answer patterns, source evidence, and correct-answer length leakage.
7. Make profile validation generic: target totals, per-chapter difficulty/answer distributions, answer-sequence patterns, allowed kinds, allowed sources, lecture requirements, and review-signoff hash. Do not hard-code MLN111 or MLN112 constants in Python.
8. Replace the single question/lecture load in builder with `build_catalogs()`. Public catalog contains only UI-safe metadata and feature flags; hydrate null-prototype dictionaries keyed by strictly validated subject ID and expose only the four accessor functions above.
9. Change template placeholder contracts to `/*__SUBJECT_CATALOG__*/[]`, `/*__QUESTION_BANKS__*/{}`, and `/*__LECTURE_CATALOGS__*/{}`. Phase 4 will place each placeholder exactly once; during parallel work use a fixture template in a temporary directory rather than edit `template.html`.
10. Retain `globalThis.MLN222_QUESTIONS` for this release as a permanently fixed alias to `getQuestionBank("mln112")`; it never follows the active subject. Do not rename question IDs.
11. Normalize MLN112 lectures and validate one lecture per declared chapter where configured. Reject arbitrary provider URLs, duplicate video IDs, invalid duration, and unknown chapter IDs.
12. Extend builder diagnostics with subject counts and deterministic raw/gzip estimates. If the budget fails, stop with measured evidence and leave the previous output untouched; deferred lazy loading requires a separate approved plan. Never copy or serve raw `content/**`.
13. Build every deployable artifact into a fresh staging directory from one immutable input-snapshot manifest. Validate serialization, hashes, size, and the complete release manifest before promotion; a failure discards staging and leaves the previous release directory untouched.
14. Exercise imports and CLIs only against temporary outputs. Hand exact catalog shapes, public projection, placeholder names, and release-manifest contract to Phase 4 and test expectations to Phase 5.

## Validation and tests during this phase

- `python -m py_compile subject_catalog.py compose_questions.py validate_questions.py build_html.py`
- Load/compose MLN111 and assert 380 plus 70/150/160 when bank complete; draft returns an explicit incomplete result before then.
- Load/compose MLN112 and assert 504 plus unchanged IDs/order.
- Confirm all three placeholders are absent from a temporary rendered fixture and no bank is opened.
- Mutation probes: unknown registry field, duplicate subject ID, traversal path, wrong `courseId`, duplicate logical ID, unknown `chapterId`, placeholder with content, lecture on disabled subject, `</script>` in authored text.
- Add reserved/prototype-like IDs, normalization collisions, NUL/C0/C1/bidi controls, field/file/bank limits, and proof that raw source/evidence never enters the public projection.
- Render twice from the same snapshots and compare SHA-256.
- Measure raw/gzip sizes without replacing root `index.html`.

Phase 5 owns committed automated tests; this phase may run ad hoc read-only probes but must not edit test files.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Generic validator weakens existing 504-bank guarantees | Express every old invariant in MLN112 profile and compare old/new validation reports |
| Compatibility CLI overwrites artifacts during parallel work | Require explicit output for non-default subjects; use `--check` and temp roots |
| Authoring and compiled schema diverge on `chapterId` | Treat it as a derived field only and test mapping from `chapterNum` |
| Embedded two-bank artifact exceeds budget | Fail the release with measured evidence; scope lazy/offline loading separately instead of branching this implementation |
| Inline JSON creates script injection | Keep existing escaping and add malicious-payload mutation tests |

## Security considerations

- Resolve then constrain filesystem paths; reject symlink escape and path aliases.
- Exact-field JSON validation prevents hidden configuration behavior.
- Use data serialization, never string interpolation, for all catalogs.
- Do not emit authoring-only absolute source roots or internal validation configuration.
- Enforce the exact Phase 1 size/Unicode limits before expensive composition and again on the public projection.

## Success criteria

- One pipeline handles MLN111, MLN112, and metadata-only placeholders without subject-specific Python constants.
- Existing MLN112 question order/IDs and six YouTube IDs remain unchanged.
- Output catalogs are stable, safe, keyed by subject, and include derived chapter IDs.
- Broken content cannot replace production artifacts.
- Temporary multi-subject build meets the hard budget; otherwise this plan stops before UI/release integration.
- Phase 3 can consume a stable MLN112 bank alias while Phase 4 consumes final catalog contracts.

## Completion record

- Completed: registry/profile-driven composition, validation, public projection, and catalog rendering support two ready subjects and three metadata-only placeholders.
- Completed: the modern build synchronizes root `index.html`, clean `dist/`, release manifest, and `vercel.json` through validated staging and rollback-capable promotion.
- Completed: the final artifact SHA-256 is `2fc036eed71b324408d7e7c9f0170922424941f3cb3a14147ec99ece1f57732d` and the hard artifact budget passed.

## Next steps

- Catalog, CLI, manifest, and release APIs were consumed by Phases 4–6.
