---
title: "Phase 06 - Production build, release, and rollback"
description: "Generate the deterministic static artifact, document the new hub, verify Vercel behavior, and preserve a fast rollback path."
status: completed
priority: P2
effort: 8h
issue: null
branch: main
tags: [infra, docs, release]
created: 2026-08-02
---

# Phase 06: Production Build, Release, and Rollback

## Context links

- [Plan](./plan.md)
- [Phase 05 release gate](./phase-05-automated-validation-regression.md)
- [Video hosting plan](../260729-1848-video-lectures-hosting/plan.md)
- [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json)
- `C:\Users\pgb31\mln222-quiz\README.md`
- Production target: `https://mln122-one.vercel.app/`

## Overview

- Priority: P2
- Status: Completed for the authorized local release artifact. Vercel preview/production remains pending explicit user authorization.
- Owner: release worker
- Depends on: Phase 5 complete with clean full test matrix.
- Scope: generated artifacts, human documentation, screenshots, release verification, and rollback only.

## Release checkpoints

1. Public identity is already locked to `MLN112`; automated output scans must show no accidental public MLN122/MLN222 copy. Historical names remain only in compatibility keys/docs.
2. MLN111 is `ready` only when its review-signoff SHA matches the canonical bank and all findings are closed; otherwise release metadata-only `draft`.
3. Owner approves commit/push/Vercel deployment. A cook run does not infer authorization to push or promote production.

## Requirements

### Build

- Compose/validate both content-ready subjects and three placeholders.
- Preserve MLN112 504 IDs/order, six YouTube videos, game assets, and legacy save keys.
- Generate `questions.json` only as the documented MLN112 compatibility snapshot.
- Generate all deployable files in a fresh `dist.staging-*` directory from one hashed input manifest; verify a clean rebuild is byte-equivalent before promoting the complete directory.
- `dist/` is an explicit deploy allowlist. It contains only the embedded runtime HTML and required local game assets; it never contains `content/`, `plans/`, `docs/`, Python, raw banks, or reports.
- Commit the validated `dist/` artifact for this static release. Configure Vercel Framework Preset “Other” with `outputDirectory: "dist"`; remote deployment packages the approved artifact and does not re-run content compilation.
- Record subject counts, test counts, raw size, gzip size, and SHA-256.
- Enforce ≤ 3.0 MiB raw and ≤ 700 KiB gzip. If exceeded, stop release and open a separate asset-loading/offline design; do not waive or add a fallback path silently.

### Documentation

- README describes five courses, statuses/features, local HTTP launch, authoring/validation/build/test commands, YouTube dependency, Vercel static deployment, and storage compatibility.
- Architecture doc records registry/catalog data flow, routes, feature flags, storage namespaces/compatibility, fixed game alias, security boundaries, and performance budget.
- Journal records implementation decisions, verification evidence, label decision, residual risks, and next content sessions.
- Screenshots cover course home, MLN111 workspace, MLN112 lecture/game availability, and one coming-soon view at desktop/mobile where useful.

### Deployment verification

- Serve locally through HTTP; do not validate YouTube from `file://`.
- Verify hash deep links and refresh behavior locally and on Vercel.
- YouTube player remains `youtube-nocookie.com`, lazy, 16:9, non-autoplay, and can play each of six unlisted videos.
- Vercel serves only the configured `dist/` output with HTTP 200 and no server/API dependency. Requests for `/content/**`, `/plans/**`, `/docs/**`, `/*.py`, `/parse_report.txt`, raw banks, and source JSON return 404.
- Preview/production return a verified CSP plus `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`; HTML is `no-cache` and local static assets follow the release manifest's cache policy.
- Production promotion occurs only after preview smoke and user approval.

## Exclusive file ownership

| Action | Absolute path | Purpose |
|---|---|---|
| Regenerate | `C:\Users\pgb31\mln222-quiz\index.html` | Production static SPA |
| Regenerate | `C:\Users\pgb31\mln222-quiz\questions.json` | MLN112 compatibility bank |
| Regenerate | `C:\Users\pgb31\mln222-quiz\parse_report.txt` | Final validation summary |
| Create/replace | `C:\Users\pgb31\mln222-quiz\dist\` | Clean, validated deploy allowlist promoted from staging |
| Create/modify | `C:\Users\pgb31\mln222-quiz\vercel.json` | Pin output directory, cache policy, and browser security headers |
| Modify | `C:\Users\pgb31\mln222-quiz\README.md` | Operator/contributor guide |
| Create | `C:\Users\pgb31\mln222-quiz\docs\multi-course-study-hub.md` | Evergreen architecture and data contract |
| Create | `C:\Users\pgb31\mln222-quiz\docs\journals\260802-multi-course-study-hub.md` | Implementation/release journal |
| Create | `C:\Users\pgb31\mln222-quiz\docs\screenshots\05-course-home.png` | Desktop home evidence |
| Create | `C:\Users\pgb31\mln222-quiz\docs\screenshots\06-mln111-study.png` | MLN111 learning evidence |
| Create | `C:\Users\pgb31\mln222-quiz\docs\screenshots\07-coming-soon-mobile.png` | Placeholder/mobile evidence |

Do not edit content, Python, `template.html`, game implementation, or tests. If release discovers a defect, return it to the owning phase instead of hot-fixing here.

## Implementation steps

1. Inspect branch/worktree. Separate expected feature files from unrelated user work; stage only after explicit approval.
2. Record the locked MLN112 identity and scan source/generated/docs for unintended public legacy labels; retain legacy names only in compatibility explanations and internal globals/keys.
3. Run Phase 5’s full command matrix. Stop on failure, skipped test, new cache, unexpected generated diff, or incomplete MLN111 profile.
4. Run production composition/validation using documented CLIs. Confirm MLN111 380 and MLN112 504 before build.
5. Generate compatibility artifacts and the deployable app into a fresh staging directory from one immutable hashed input manifest. Build again separately and compare every manifest entry byte-for-byte/SHA-256.
6. Calculate raw and gzip size with standard-library gzip. Record the hard-gate result in the journal; an over-budget artifact stops this release.
7. Scan staging for embedded local paths/secrets and forbidden source trees/extensions. Validate the whole manifest and header config. On the same volume, rename `dist` to `dist.previous`, rename staging to `dist`, verify the manifest, and restore `dist.previous` on any rename/hash failure; also support deploying immutable staging directly.
8. Start `python -m http.server 8000 --directory <validated-dist-path>` in a hidden/background process; verify served `index.html` matches the release manifest hash, run the forbidden-path 404 matrix, record PID, and stop it after smoke testing.
9. Browser smoke at target viewports: five cards; MLN111 quiz/flash/search; MLN112 quiz/flash/lecture/search/game; three placeholders; invalid hash; reload; Back/Forward; scoped reset; legacy progress and game resume.
10. Verify keyboard focus, 200% zoom, reduced motion, screen-reader names/status, no horizontal overflow, and no console errors.
11. Verify all six YouTube videos from HTTP with valid Referer, direct YouTube fallback links, retry/offline state, and iframe teardown.
12. Capture only the three owned screenshots after data/copy is final. Update README, architecture doc, and journal with exact commands/results.
13. Review the Phase 6 scoped diff only. Consume earlier path-scoped handoffs without recomposing their commits; commit/stage only after owner approval and never include unrelated work.
14. On owner approval, push branch and create a Vercel preview. Smoke `#/`, `#/mln111/quiz`, `#/mln112/lecture`, `#/mln112/game`, and a placeholder route.
15. On separate promotion approval, deploy/promote production. Verify HTTP 200, asset size/hash and cache headers, CSP/security headers, source-path 404 matrix, console/network behavior, six embeds, and existing localStorage saves in the real origin.
16. Publish final evidence and commit/deployment identifiers. Stop local server and leave worktree/status explicit.

Local completion boundary: steps 1–13 are complete for the authorized implementation and release artifact. Steps 14–16 are external deployment operations and remain intentionally pending until the user explicitly authorizes commit/push, Vercel preview creation, and production promotion.

## Release command sequence

```powershell
python compose_questions.py --all --check
python validate_questions.py --all --check
node scripts/validate-game-data.js
python -m unittest -v test_pipeline.py
node --test --test-concurrency=1 tests/game/*.test.cjs tests/study-hub/*.test.cjs
node scripts/simulate-economy.js --runs 100000 --assert
node scripts/simulate-combat.js --runs 10000 --assert --config game/data/balance.json
node scripts/simulate-campaign.js --runs 1000 --turns 60 --assert
python compose_questions.py
python validate_questions.py --all --report parse_report.txt
python build_html.py
git diff --check
```

## Rollback plan

### Before deployment

- Do not replace a known-good artifact on any failed validation/build.
- Revert only the failed owner phase’s commit; never use `git reset --hard` against user work.
- Because legacy study/game keys remain, rolling back code restores the old reader without data loss.

### Vercel preview/production

- Keep previous successful Vercel deployment ID before promotion.
- On broken routing, content, video, game, or storage compatibility: immediately promote the previous deployment.
- Then revert the scoped release commit, rebuild from the prior source snapshot, and diagnose in the owning phase.
- Do not clear browser storage as rollback. Export/capture a failing payload only with user consent and redact personal browsing data.

### Forward recovery

- MLN112 retains the exact existing study/game keys and schemas, so both the old and new app read the same data across rollback.
- MLN111 keys are ignored by the old app and become readable again after forward recovery; the old app never mutates them.
- Any future MLN112 key migration requires a separate plan with explicit merge/reset semantics and is out of scope here.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Wrong public code ships | Explicit owner checkpoint blocks production |
| MLN111 appears complete while bank is partial | Readiness derives from validated profile counts |
| Vercel preview passes but production origin changes storage/embed behavior | Real-origin post-promotion smoke plus immediate previous-deployment rollback |
| Large artifact harms first load | Hard raw/gzip gate stops release; asset loading is a separately scoped follow-up |
| Generated files hide local path or script payload | Source scan, safe serializer tests, scoped diff review |
| Release commit captures unrelated work | Path-scoped staging and explicit staged diff review |

## Security considerations

- Scan generated HTML for absolute `C:\`/`F:\` paths, secrets, tokens, and unexpected remote origins.
- Confirm only YouTube privacy-enhanced embed/thumbnail hosts are contacted and only after lecture use where designed.
- No authentication, form submission, backend, analytics, or new third-party script is introduced.
- Vercel deploys only `dist/`; no environment secrets are needed.
- Use one chosen CSP strategy: Phase 2 emits deterministic SHA-256 hashes for every inline script/style into the release manifest; Phase 6 writes those exact hashes into `vercel.json`. Enforce `default-src 'self'`, `object-src 'none'`, `base-uri 'none'`, narrowly allowlisted `frame-src`/`img-src`/`connect-src`, plus `X-Content-Type-Options: nosniff`, strict `Referrer-Policy`, and minimal `Permissions-Policy`.

## Success criteria

- Full test/simulation matrix green and worktree changes understood.
- Deterministic production artifact contains five subjects and meets performance budget.
- Clean `dist/` and security-header/source-404 checks prove authoring and repository internals are not deployed.
- Local smoke covers every ready feature, placeholder no-op, deep links, accessibility, storage compatibility, game save, and video integration contracts.
- README/architecture/journal/screenshots reflect actual released behavior.
- The scoped Git/Vercel rollback procedure is documented and ready for use after deployment authorization.

## Completion record

- Completed local artifact: SHA-256 `2fc036eed71b324408d7e7c9f0170922424941f3cb3a14147ec99ece1f57732d`.
- Completed gates: Python 66/66, Node 158/158, campaign 1,000 × 60 with 0 invalid actions/invariant failures/warning violations.
- Completed local HTTP allowlist verification: deployable paths passed and repository/source paths were rejected.
- Completed deterministic release packaging: synchronized root HTML, clean `dist/`, release manifest, and CSP-derived `vercel.json`.
- Pending explicit authorization: commit, push, Vercel preview/production deployment, and live-origin header/deep-link/source-404 verification. No deployment or live production verification is claimed by this completed local phase.

## Context handoff

Local implementation and release preparation are complete. If the user authorizes deployment, continue from:

`/ck:cook --parallel C:\Users\pgb31\mln222-quiz\plans\260802-multi-course-study-hub\plan.md`
