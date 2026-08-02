---
title: "Phase 04 - Course home and dynamic study workspace"
description: "Turn the single-course template into an accessible five-card home and a subject-aware quiz, flashcard, lecture, search, and game workspace."
status: completed
priority: P1
effort: 18h
issue: null
branch: main
tags: [feature, frontend, accessibility]
created: 2026-08-02
---

# Phase 04: Course Home and Dynamic Study Workspace

## Context links

- [Plan](./plan.md)
- [Phase 02 pipeline contract](./phase-02-multi-subject-validation-build-pipeline.md)
- [Phase 03 game isolation contract](./phase-03-mln112-game-save-isolation.md)
- [Codebase audit](./research/codebase-audit.md)
- `C:\Users\pgb31\mln222-quiz\template.html`

## Overview

- Priority: P1
- Status: Completed
- Owner: UI worker
- Depends on: Phases 2 and 3 contract completion.
- Scope rule: this phase is the only phase allowed to edit `template.html`.

## Key insights

- Current HTML, CSS, DOM, state, search, lecture player, storage, and routing behavior all live in one template.
- Reusing this architecture is lower risk than introducing a framework, but subject state must be centralized before individual functions are updated.
- Coming-soon courses need a real informational view, not a disabled study workspace with zero questions.
- Hash routing works with Vercel static hosting because fragments are not sent to the server.

## Requirements

### Course home and navigation

- `#/` displays exactly five course cards in registry order.
- Ready cards show code, title, description, question count, and available feature labels.
- Draft MLN111 card shows truthful progress if validation/sign-off is incomplete; study modes open only when catalog has `studyReady: true`.
- `comingSoon` cards route to an informative placeholder, never to quiz setup.
- Workspace header includes a labeled subject switcher plus “Tất cả môn học” return action.
- Public header/footer/title derive from active metadata; no hard-coded 504 or MLN122/MLN222 copy remains.

### Dynamic workspace

- MLN111 modes: quiz, flashcard, search.
- MLN112 modes: quiz, flashcard, lecture, search, game.
- Nav renders from feature flags; unavailable modes are absent, not inert tabs.
- Quiz, flashcard, filters, search, marking, wrong-answer filter, sanitized public-citation rendering, keyboard controls, lecture behavior, and game handoff use only active subject data.
- Subject switch saves the current subject session, tears down subject-specific transient UI, loads the target subject state, and restores a valid route.
- Placeholder selection does not call `buildPool`, create session records, load lectures, initialize game, or alter study statistics.

### Routing

- Canonical routes are only `#/`, `#/<subjectId>`, and `#/<subjectId>/<mode>`. Chapter/difficulty filters remain in subject-scoped local UI state and are not shareable in this MVP.
- Allowlist subject IDs and mode names from catalogs; reject every query string.
- Invalid/stale routes normalize with `history.replaceState` to the closest safe route and announce the change.
- Parse the raw fragment before decoding; cap it at 512 bytes and at most two non-empty path segments. Decode each segment in `try/catch`; reject queries, malformed escapes, decoded `/` or `\\`, NUL/control characters, and dot segments.
- Canonicalization is total and idempotent according to the transition table below; a replace guard prevents `hashchange` loops.
- `hashchange`, browser Back/Forward, reload, and direct deep-link restore the same course/mode/filter.
- Do not serialize answers, marked IDs, scores, video state, or campaign data into URLs.

### Progress and compatibility

- Preserve MLN112 study keys exactly: `mln222.v2.marked`, `mln222.v2.stats`, and `mln222.v3.studyProgress`. Do not migrate, rename, copy, or dual-write them in this release.
- MLN111 uses `mln-study-hub.v1.mln111.marked`, `.stats`, and `.studyProgress`; `mln-study-hub.v1.lastSubject` stores navigation only. Future subjects receive their own explicit namespace when content is authored.
- Logical IDs are `${subjectId}:${questionId}` in in-memory maps; source question IDs remain unchanged.
- Maintain `memoryStudyBySubject` as the first write target. Persistence failure leaves same-tab subject round trips intact and shows a non-blocking “chưa lưu trên thiết bị” status.
- Reset removes only the active subject's declared study keys and in-memory entry. Existing MLN112 behavior remains unchanged; game reset remains a separate game action.

### Accessibility and responsive behavior

- Course cards and switcher are keyboard operable with visible focus and minimum 44 px targets.
- Use semantic heading order, `nav`, `main`, buttons/links, `aria-current`, `aria-pressed`, and `aria-live` status.
- Focus moves predictably: home → course heading; subject switch → workspace heading; mode change → mode heading/current question.
- Coming-soon status is conveyed in text/icon, not color alone.
- Existing focus trap, reduced motion, contrast, desktop rail, mobile bottom nav, and map interactions remain intact.

## State architecture

```js
const app = {
  route: { subjectId: null, mode: null, chapterId: "all", difficulty: "all" },
  subject: null,
  questions: [],
  lectures: [],
  study: createEmptyStudyState(),
  memoryStudyBySubject: new Map(),
};
```

Use selectors `getSubject(id)`, `getQuestions(id)`, `availableModes(subject)`, and `questionKey(subjectId, id)`. Rebuild `QUESTION_IDS`, `QUESTION_BY_ID`, chapter/difficulty sets, and controls whenever the subject changes. Never mutate embedded catalogs.

## Canonical route transition table

| Input | Canonical result | Session side effect |
|---|---|---|
| `#/` or unknown subject | `#/` course home | None |
| `#/<readySubject>` | Course overview for that subject | Set last ready subject; do not start quiz |
| `#/<readySubject>/<enabledMode>` | Requested workspace mode | Restore that subject/mode only |
| `#/<readySubject>/<disabledOrUnknownMode>` | `#/<readySubject>` overview | Announce correction; do not start a session |
| `#/<draftOrComingSoon>` or any child mode | Subject information/coming-soon view | Do not change last ready subject or write study state |
| Any query, malformed encoding, extra segment | Closest safe subject overview if the first subject is valid; otherwise `#/` | No mode/session initialization |

Back/Forward and reload use the same table. Default mode order affects rendered navigation only; it is never an automatic redirect.

## Session lifecycle contract

| Mode/state | Persisted | Transient/teardown | Commit rule |
|---|---|---|---|
| Quiz | Seed/order, current question, submitted answers, filters | Open feedback/animation | Stats change only on explicit answer submission; switching never fabricates an answer |
| Flashcard | Deck/order, current card, filters | Reveal face and animation | Card navigation persists; reveal alone does not change score |
| Search | Active subject and safe query/filter state | Result focus/highlight | No score/stat change |
| Lecture | Active chapter/video progress already supported by MLN112 | Destroy iframe/player on exit | Never starts outside MLN112 lecture route |
| Game | Existing campaign/UI keys only | Hide/deactivate via current mode lifecycle | Subject navigation never dispatches a game action |
| Draft/coming soon | Nothing | Informational focus state | Does not update `lastSubject` |

## Exclusive file ownership

| Action | Absolute path | Purpose |
|---|---|---|
| Modify | `C:\Users\pgb31\mln222-quiz\template.html` | Home, routing, styles, dynamic workspace, storage compatibility, and game visibility/mode gating |

Do not edit content, Python, game files, tests, generated `index.html`, README, docs, or screenshots.

## Implementation steps

1. Replace single-bank globals with Phase 2 placeholders/catalog constants. Freeze or treat embedded values as read-only. Publish the exact scoped globals required by Phase 3.
2. Add route parser/serializer before app initialization. Validate fragments and query parameters against catalogs; define a single `navigate(route, {replace})` entry point.
3. Add course-home DOM/CSS with five metadata-driven cards. Separate card action from status text; use `aria-describedby` for availability.
4. Add workspace subject switcher populated from registry. Make coming-soon selection open its placeholder route instead of a study mode.
5. Refactor the hard-coded `QUESTIONS` constants/maps into `activateSubject(subjectId)`. Rebuild derived indexes and reset transient DOM/player state before render.
6. Replace every hard-coded total (`504`), MLN122 label, footer source, chapter list, search copy, and lecture count with active metadata/catalog values.
7. Derive mode tabs from `features`. Default display order: quiz → flash → lecture → search → game. Apply the canonical route table exactly; unavailable modes return to course overview and never auto-start the first mode.
8. Replace chapter string filters with `chapterId`; display `question.chapter`. Lecture “Luyện chương này” writes its `chapterId` into route/filter state.
9. Refactor quiz/flash/search functions to read `app.questions`. Guard every pool/session operation with `subject.status` and question availability.
10. Build explicit per-subject storage adapters. The MLN112 adapter reuses current keys/schema byte-for-byte; the MLN111 adapter uses its own keys. Validate stored IDs against the active bank, preserve current multi-session behavior, and reject cross-subject records.
11. Update `memoryStudyBySubject` before every persistence attempt. Subject switches restore memory first, then valid storage; storage errors never discard the current same-tab session and are announced non-blockingly.
12. Update reset confirmation and counters to active course. Reset only the active adapter plus its memory entry; subject switches save only the prior subject and restore only the destination subject.
13. Keep lecture lazy-load, privacy-enhanced YouTube URL, retry, timeout, and iframe destruction. Only create lecture DOM/network work for MLN112 lecture route.
14. Keep the existing `mln222:mode-change` lifecycle for game presentation. Publish it only after a valid route render; the fixed question alias remains independent of active subject.
15. Wire `hashchange` without render loops. Use a suppression/compare guard so programmatic hash changes do not duplicate save/render/player/game actions.
16. Add focus management and live announcements for route correction, persistence failure, subject change, empty filters, offline lecture errors, and coming-soon status.
17. Verify layouts at 360×800, 390×844, 844×390, 1024×768, and 1440×900; retain current game workspace behavior.
18. Hand DOM IDs, route grammar, storage keys, event details, and manual scenarios to Phase 5.

## Validation and tests during this phase

- Temporary build served with `python -m http.server 8000`; never edit production `index.html`.
- Home: five cards, correct statuses, keyboard order, no horizontal overflow.
- Deep links: each ready mode, invalid subject/mode/query/extra segment, reload, Back/Forward.
- MLN111: quiz/flash/search work; lecture/game absent; counters total 380 only after readiness.
- MLN112: all five modes, 504 questions, six videos, game resume.
- Placeholder: no pool, storage writes, iframe, or game controller.
- Compatibility fixtures: clean browser, valid/corrupt MLN112 keys, MLN111 keys containing MLN112 IDs, unavailable storage, and repeated subject switches with every storage API throwing.
- Game fixture: fixed legacy alias, direct game deep link, hidden game under every non-MLN112 subject, and unchanged save on exit.
- Security fixture: authored `<img onerror>`, `</script>`, source text, route encoding; all render as text or fail at build.
- Accessibility: keyboard-only course selection, switcher, tabs, filters, quiz, flashcard; 200% zoom; reduced motion; screen-reader names/live regions.

Phase 5 owns committed tests. UI worker records reproducible observations only in handoff, not docs.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Large one-file refactor creates hidden stale globals | Centralize `app` and selectors first; search all `QUESTIONS`/MLN hard-codes |
| Hash and render handlers loop | Canonical route equality guard and one navigation entry point |
| Cross-subject storage collision | Explicit subject→key adapters, logical compound IDs, and isolation regressions |
| Placeholder creates empty persisted session | Route/status guard before workspace initialization |
| Subject switch leaves YouTube/game active | Explicit teardown and context event before destination render |
| MLN112 progress breaks during refactor | Keep all current keys/schemas and adapter behavior unchanged; add byte-compatible fixtures |
| Storage is unavailable during subject switches | Per-subject in-memory cache is authoritative for the current tab and reports persistence failure |

## Security considerations

- Never build selectors or HTML from unvalidated hash values.
- Route parsing follows the bounded raw-split/guarded-decode/canonical-round-trip contract; malformed fragments can only reach the safe home route.
- Render metadata/questions/sources with `textContent`; image/iframe URLs come from validated builders only.
- Treat localStorage as hostile; parse defensively, bound arrays/counters, reject unknown IDs.
- Hash routes contain no sensitive or mutable learning state.
- Preserve `rel="noopener noreferrer"`, strict referrer policy, and privacy-enhanced YouTube domain.

## Success criteria

- Five-course home and subject switcher work across target viewports and keyboard navigation.
- Feature flags produce exactly the required modes for MLN111/MLN112/placeholders.
- No hard-coded current-course label/count drives the UI.
- Course switching and deep links restore correct subject, mode, chapter, and progress without collisions.
- MLN112 legacy study progress survives; game and video stop cleanly when leaving their context.
- Placeholder visits create no study/game/media state.

## Completion record

- Completed: the five-course home, subject overview, feature-derived workspaces, canonical hash routes, and subject-scoped study state are implemented.
- Completed: ready and `comingSoon` copy/state are truthful, legacy MLN112 storage remains compatible, and placeholder routes have no study/game/media side effects.
- Completed: local HTTP/browser verification covered the release artifact; remote-origin verification remains part of the separately authorized deployment step.

## Next steps

- The route/storage/feature matrix and production artifact evidence were completed in Phases 5 and 6.
