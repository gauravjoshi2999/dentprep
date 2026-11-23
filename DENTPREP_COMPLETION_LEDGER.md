# DentPrep completion ledger

## Verified audit checkpoint — 23 November 2026

- SOURCE: CODE / live service evidence. Repository: `gauravjoshi2999/dentprep` only. Main and live `/api/health`: `4b92b5e75f12f7b7254784c8a865fad305e8bf1f`.
- Live origin: https://dentprep.gauravjoshi2999.workers.dev . `npm run verify:deployment -- ORIGIN SHA` passed SSR, revision, JS/CSS, routes and PWA.
- CI [45231986282](https://github.com/gauravjoshi2999/dentprep/actions/runs/45231986282) and production [45231986266](https://github.com/gauravjoshi2999/dentprep/actions/runs/45231986266): SUCCESS at that SHA.
- Existing Lovable backend `7e700199-451a-4c24-bbea-d410d796df0b`: 21 public tables, all RLS enabled; 15 published subject outlines; 15 draft lessons, 30 draft MCQs, 15 draft cases; 1 auth user. No clinical material published.
- SOURCE: BLUEPRINT / Q&A. Entire supplied 102-page PDF inspected: 100 Q&A, 50 scenarios, 20 academic gates, four reference images and 72 blueprint slides. Fingerprint and page/slide index: `ops/specification-index.json`. Historical diagram statuses are not implementation evidence.
- Preserved existing work: PR #11 visual/navigation changes, #14 asset verifier, #15 opt-in browser dictation, #16 public backend env injection and #17 full live browser propagation checks. Do not rebuild these.

## Current prioritized findings

| ID | Priority | Learner impact / risk | Smallest safe deliverable | Status / evidence |
| --- | --- | --- | --- | --- |
| P0-01 | P0 | Test answers can be inferred from public question explanations or own in-progress correctness columns | Safe question projections, owned phase-aware attempt RPCs, submitted-only history, DB column enforcement and rollback-only negative tests | FAIL confirmed by current DB grants + `queries.ts`, attempt and saved routes; implementation in progress |
| P0-02 | P0 | Content review is a UI workflow, not accountable clinical sign-off | Deny publication until independent qualified, versioned approval can be enforced | Missing technical publication gate; all existing clinical content remains draft |
| P0-03 | P0 | Real-account auth/privacy acceptance lacks evidence | Real registration/login/recovery/account-switch/admin QA with authorized accounts | BLOCKED: Cloud Browser failed opening live login, then URL-policy authority denied observation; no automated workaround attempted |
| P1-01 | P1 | Study plans stop at one cycle; source coverage is incomplete | Renewable cycles with history, carry-forward and honest workload | Missing; existing 7/15/30 planner must be extended, not duplicated |
| P1-02 | P1 | Learners have outlines but no approved clinical lessons/questions/cases | Source/outcome coverage, review queue, independent professional sign-off | BLOCKED for publication: qualified author/reviewer evidence absent |
| P2-01 | P2 | Live AI and real devices cannot be inferred from mock tests | Authorized provider proxy/evaluation and actual hardware acceptance | BLOCKED: provider/consent/cost decision, reviewer and physical devices |

## Completion rules

Implemented, CI passed, deployed, clinically approved and physical-device passed are separate states. A full scenario PASS needs its own evidence in the 50-case matrix. Partial mocked/SQL coverage is never real-account or medical acceptance. No selection guarantee, fabricated scores, automatic administrator assignment or clinical approval.

After each accepted task, append branch/head/PR, test logs, merge/deployed SHA, backend activation, rollback evidence and exact next action. Keep `DENTPREP_NEXT_ACTIONS.md` synchronized. Never include credentials, tokens, personal transcripts or patient data.

## P0-01 pre-merge implementation checkpoint

- Branch: `fix/exam-answer-confidentiality`; exact commit/PR will be linked by the accepted milestone checkpoint. Database rollout: **not activated yet**.
- Safe question/saved projections; owner-only phase-aware attempt review; submitted-only answer history; role-checked admin question reads. Existing scoring and private rows are preserved.
- Local validation: TypeScript, 26 Vitest tests, 11 release tests, SSR build and changed-source lint passed (an inherited effect dependency warning was then corrected).
- Live-backend dry run: additive functions + column enforcement + `ops/verify-attempt-access.sql` passed anonymous/owner/admin boundaries, pre-submit confidentiality, exam answer changes/resume, practice feedback, submitted analytics and score/idempotency. All DDL and synthetic rows were rolled back.
- Before-state function/grant metadata is captured in `ops/backups/2026-11-23-attempt-access.json`; see `ops/ATTEMPT_ACCESS_ROLLOUT.md` for ordered expand/contract and recovery.
- CI adds a desktop/mobile exam save/reload/submission regression using an isolated non-clinical fixture. CI PASS and live enforcement are still pending; T25 remains FAIL until those gates finish.
