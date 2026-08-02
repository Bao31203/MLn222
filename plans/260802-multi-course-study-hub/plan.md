---
title: "Multi-course philosophy study hub"
description: "Convert the current static MLN112 study app into a five-course hub while preserving its offline study flow, game saves, and Vercel deployment model."
status: completed
priority: P1
effort: 49h
issue: null
branch: main
tags: [feature, frontend, refactor, infra]
created: 2026-08-02
---

# Multi-course Philosophy Study Hub

## Overview

Keep the Python-built static SPA. Add a five-course home, subject-scoped catalogs, dynamic workspaces, isolated progress, and safe placeholders. MLN111 ships with 380 curated questions; MLN112 retains all current quiz, flashcard, lecture, search, and game behavior; MLN131, HCM201, and VNR201 remain `comingSoon`.

## Decisions and gates

- Canonical tuple is locked from the user's requirement: immutable internal `subjectId: "mln112"`, public code `MLN112`, title from reviewed metadata, and internal-only legacy aliases `mln122`/`mln222`. Do not rename existing question IDs or study/game save keys.
- Use `(subjectId, questionId)` as logical identity. Compiler injects stable `chapterId`; display labels never act as keys.
- Embed sanitized public projections of both ready banks. Budget: `index.html` ≤ 3.0 MiB raw and ≤ 700 KiB gzip; the current size estimate leaves sufficient headroom. If the hard gate fails, stop this release and open a separately scoped asset-loading plan rather than adding a second runtime path here.
- Build and deploy only an allowlisted `dist/` release directory. Authoring content, plans, reports, Python sources, and raw JSON are never part of the Vercel output.
- MLN111 becomes `ready` only after exactly 70/150/160 questions pass profile validation and a review sign-off tied to the canonical bank SHA-256 has no open Critical/High/Medium findings. Any content edit invalidates the sign-off; otherwise expose the course as metadata-only `draft`.

## Validated product scope

- The hub contains exactly five course entries in this release: MLN111, MLN112, MLN131, HCM201, and VNR201.
- MLN112 is the existing website and retains its current 504-question, six-lecture, and game behavior. The public `MLN112` label comes directly from the user's requirement; the final checkpoint exists only to reconcile contradictory repository history before publishing.
- This session delivers MLN111 content only. MLN131, HCM201, and VNR201 are truthful `comingSoon` cards with no fabricated questions or empty study state.
- MLN111's default examinable scope is the current three-chapter structure. Older textbook sections on pre-Marx history and modern Western currents are excluded from the ready bank and may return later as a separate, off-by-default enrichment module.
- No framework migration, authentication, backend, analytics, or database is introduced. The static Python-built SPA and Vercel hosting model remain the implementation boundary.

## Phases

| # | Phase | Priority | Status | Effort | Depends on |
|---|---|---|---|---:|---|
| 1 | [Subject registry and content contract](./phase-01-subject-registry-content-contract.md) | P1 | Completed | 4h | — |
| 2 | [Multi-subject validation and build pipeline](./phase-02-multi-subject-validation-build-pipeline.md) | P1 | Completed | 8h | 1 |
| 3 | [MLN112 game compatibility gate](./phase-03-mln112-game-save-isolation.md) | P1 | Completed | 1h | 2 |
| 4 | [Course home and dynamic study workspace](./phase-04-course-home-dynamic-workspace.md) | P1 | Completed | 18h | 2, 3 |
| 5 | [Automated validation and regression coverage](./phase-05-automated-validation-regression.md) | P1 | Completed | 10h | 2, 3, 4 |
| 6 | [Production build, release, and rollback](./phase-06-production-build-release-rollback.md) | P2 | Completed | 8h | 5 |

## Completion record

The six implementation phases are complete for the authorized local scope. This means the validated source, deterministic deploy artifact, local verification, documentation, and rollback contract are ready; it does **not** mean a Vercel preview or production deployment has occurred.

| Final gate | Result |
|---|---|
| Python regression suite | 66/66 passed |
| Node regression suite | 158/158 passed |
| Campaign simulation | 1,000 runs × 60 turns passed; 0 invalid actions, 0 invariant failures, 0 warning violations |
| Production artifact | SHA-256 `2fc036eed71b324408d7e7c9f0170922424941f3cb3a14147ec99ece1f57732d` |
| Local HTTP deploy allowlist | Passed; deployable files served and repository/source paths rejected |

Remote boundary: commit, push, Vercel preview creation, production promotion, and live-origin header/deep-link/source-404 verification remain pending explicit user authorization. They are intentionally excluded from the completed local implementation claim.

## Execution strategy

| Wave | Parallel work | Exit gate |
|---|---|---|
| A | Phase 1 | Registry/schema and content readiness agreed |
| B | Phase 2, then Phase 3 gate | Catalog build passes and the fixed legacy game alias is proven unchanged |
| C | Phase 4 | UI consumes final catalog/event contracts |
| D | Phase 5 | Full Python/Node regression green |
| E | Phase 6 | Deterministic artifact, local/Vercel smoke, rollback ready |

## Exclusive ownership

| Phase | Owned paths |
|---|---|
| 1 | `content/**` subject registry, metadata, authoring sources |
| 2 | Root Python pipeline scripts and new Python helpers only |
| 3 | `game/**/*.js` implementation files only |
| 4 | `template.html` only |
| 5 | `test_pipeline.py`, `tests/**` only |
| 6 | `index.html`, `questions.json`, `parse_report.txt`, `dist/**`, `vercel.json`, `README.md`, `docs/**` |

No phase edits another phase’s files. Parallel workers use temporary outputs and never regenerate Phase 6 artifacts. Each phase hands off a path-scoped patch; create commits only with owner approval, and Phase 6 never recomposes implementation commits spanning earlier owners.

## Research

- [MLN111 source audit](./research/mln111-source-audit.md)
- [MLN111 bank validation and editorial sign-off](./research/mln111-bank-validation.md)
- [Current codebase audit](./research/codebase-audit.md)
- [MLN111 authoring contract](../../content/subjects/mln111/AUTHORING.md)

## Red Team Review

Four adversarial lenses reviewed all six phases: Security Adversary, Failure Mode Analyst, Assumption Destroyer, and Scope & Complexity Critic. Findings were deduplicated and adjudicated as follows.

| # | Severity | Accepted change |
|---:|---|---|
| 1 | High | Deploy only a clean `dist/` allowlist; raw content, plans, reports, Python, and source JSON must return 404. |
| 2 | High | Use one embedded-bank architecture selected by an early real-size probe; over-budget output stops the release instead of activating a late lazy-loading fork. |
| 3 | High | Keep MLN112 study/game storage keys unchanged and create only MLN111-scoped keys; defer any MLN112 migration. |
| 4 | High | Keep `MLN222_QUESTIONS` immutably bound to MLN112 and gate game visibility in the workspace; defer controller/view dependency injection. |
| 5 | High | Lock canonical identity to immutable `mln112` / public `MLN112`; legacy labels are internal aliases verified by output scans. |
| 6 | High | Bind MLN111 readiness to structural validation plus a review sign-off SHA; content changes invalidate readiness. |
| 7 | High | Make profile metadata the sole public chapter-title/ID source, joined from authored content only by `(subjectId, chapterNum)`. |
| 8 | High | Choose a binding Vercel contract: committed validated `dist/`, Framework Preset “Other”, `outputDirectory: "dist"`, manifest/hash and forbidden-path verification. |
| 9 | High | Choose deterministic inline CSP hashes at build time; Phase 6 consumes the exact manifest rather than deciding CSP at release time. |
| 10 | Medium | Use strict subject ID grammar, reserved-name denial, null-prototype catalogs/accessors, NFC/control/bidi rules, and exact field/file limits. |
| 11 | Medium | Reduce routing to home/subject/mode and define one canonical status/feature transition table; filters stay in local UI state. |
| 12 | Medium | Define per-mode save/commit/teardown semantics and preserve same-tab sessions in `memoryStudyBySubject` when storage fails. |
| 13 | Medium | Define the exact safe public search fields after source evidence is stripped and retain named MLN112 search regressions. |
| 14 | Medium | Use same-volume staging/promotion with verified restore, serve the exact `dist/` locally, and reconcile top-level file ownership. |
| 15 | Medium | Defer MLN112 directory moves, raise UI/test/release estimates, and reduce permanent test files to the core release matrix. |

Deferred by design: shareable filter queries, MLN112 storage migration, lazy subject assets, physical MLN112 content moves, and game dependency injection. A fully automated real-browser E2E dependency is also deferred; Phase 6 keeps a repeatable local/preview browser smoke and records evidence, while a later hardening plan may add a maintained browser runner. The proposed extra identity approval gate was rejected because the user already explicitly selected MLN112.

## Success criteria

- Five accessible course cards; ready/draft/coming-soon states route safely.
- MLN111 quiz/flashcard/search work with 380 validated questions; MLN112 retains all five current features and existing progress/game saves.
- Subject progress cannot collide; existing MLN112 study/game keys remain byte-compatible and MLN111 uses its own namespace without a risky cross-key migration.
- Hash routes survive refresh/back/forward; no placeholder creates a pool or storage session.
- Full tests, deterministic build, bundle budget, and local HTTP smoke pass for the authorized local release artifact.
- The generated Vercel contract deploys only the `dist/` allowlist and defines the required security headers; live preview/production verification remains a post-authorization deployment gate.

## Context handoff

Local implementation and release preparation are complete. Resume only after explicit user authorization for the remote deployment steps documented in [Phase 06](./phase-06-production-build-release-rollback.md).
