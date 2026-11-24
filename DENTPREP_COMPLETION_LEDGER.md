# DentPrep completion ledger

## Verified audit checkpoint — 23 November 2026

- SOURCE: CODE / live service evidence. Repository: `gauravjoshi2999/dentprep` only. Main and live `/api/health`: `4b92b5e75f12f7b7254784c8a865fad305e8bf1f`.
- Live origin: https://dentprep.gauravjoshi2999.workers.dev . `npm run verify:deployment -- ORIGIN SHA` passed SSR, revision, JS/CSS, routes and PWA.
- CI [45231986282](https://github.com/gauravjoshi2999/dentprep/actions/runs/45231986282) and production [45231986266](https://github.com/gauravjoshi2999/dentprep/actions/runs/45231986266): SUCCESS at that SHA.
- Existing Lovable backend `7e700199-451a-4c24-bbea-d410d796df0b`: 21 public tables, all RLS enabled; 15 published subject outlines; 15 draft lessons, 30 draft MCQs, 15 draft cases; 1 auth user. No clinical material published.
- SOURCE: BLUEPRINT / Q&A. Entire supplied 102-page PDF inspected: 100 Q&A, 50 scenarios, 20 academic gates, four reference images and 72 blueprint slides. Fingerprint and page/slide index: `ops/specification-index.json`. Historical diagram statuses are not implementation evidence.
- Preserved existing work: PR #11 visual/navigation changes, #14 asset verifier, #15 opt-in browser dictation, #16 public backend env injection and #17 full live browser propagation checks. Do not rebuild these.

## Current prioritized findings

| ID    | Priority | Learner impact / risk                                                                                 | Smallest safe deliverable                                                                                                                 | Status / evidence                                                                                                                   |
| ----- | -------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| P0-01 | P0       | Test answers can be inferred from public question explanations or own in-progress correctness columns | Safe question projections, owned phase-aware attempt RPCs, submitted-only history, DB column enforcement and rollback-only negative tests | DONE technical gate — PR #18, live `98bf0db…`, enforced columns + rollback/RPC/CI/REST tests; see milestone below                   |
| P0-02 | P0       | Content review is a UI workflow, not accountable clinical sign-off                                    | Deny publication until independent qualified, versioned approval can be enforced                                                          | DONE safety interlock — PR #19; qualified approval workflow remains BLOCKED                                                         |
| P0-03 | P0       | Real-account auth/privacy acceptance lacks evidence                                                   | Real registration/login/recovery/account-switch/admin QA with authorized accounts                                                         | BLOCKED: Cloud Browser failed opening live login, then URL-policy authority denied observation; no automated workaround attempted   |
| P0-04 | P0       | Local private form state could survive a direct account switch                                        | Remount private editor/dictation subtree on identity change; preserve token refresh                                                       | PR #20 merged/live; automated evidence below; real-account acceptance remains BLOCKED                                               |
| P1-01 | P1       | Study plans stop at one cycle; source coverage is incomplete                                          | Renewable cycles with history, carry-forward and honest workload                                                                          | DONE technical cycle gate — PR #21, live `15a6814…`, native regression + contract applied; actual account/device acceptance pending |
| P1-02 | P1       | Learners have outlines but no approved clinical lessons/questions/cases                               | Source/outcome coverage, review queue, independent professional sign-off                                                                  | BLOCKED for publication: qualified author/reviewer evidence absent                                                                  |
| P2-01 | P2       | Live AI and real devices cannot be inferred from mock tests                                           | Authorized provider proxy/evaluation and actual hardware acceptance                                                                       | BLOCKED: provider/consent/cost decision, reviewer and physical devices                                                              |

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

## Accepted milestone: P0-01 exam confidentiality

- Code head `d72d9266b8801fbee1725e91994ec68fd451b8bf`, [PR #18](https://github.com/gauravjoshi2999/dentprep/pull/18), merge and verified live `98bf0db3f477c066adda862f31b8257ddf4c2937`.
- PR CI [45240674091](https://github.com/gauravjoshi2999/dentprep/actions/runs/45240674091) and main CI [45241181695](https://github.com/gauravjoshi2999/dentprep/actions/runs/45241181695): SUCCESS. 26 unit + 11 release tests, 19 passing desktop/mobile fixture browser tests (one desktop-only skip for the intentionally mobile navigation case), type/security/build/Worker checks.
- Production [45241181580](https://github.com/gauravjoshi2999/dentprep/actions/runs/45241181580): SUCCESS, exact SHA/SSR/assets/routes/PWA and full guest mobile/desktop suite. Release artifact ID `14849954993`, name `dentprep-release-98bf0db3f477c066adda862f31b8257ddf4c2937`.
- Backend expand installed before merge; column restrictions activated only after compatible deployment passed. The rollback-only test passed on the real DB; additional publication-guard dry run passed and rolled its DDL/fixtures back. Existing clinical records stay draft; no user/content rows were rewritten by this task.
- Live REST: safe public question text 200/0 rows; hidden explanation/correctness 401/42501; draft questions/cases 200/0 rows; private RPC anonymous 401. Candidate/admin boundaries and score/idempotency verified using transaction-local synthetic roles.
- Source exposure audit: 251 unique historical text blobs and current public build assets scanned; no checked private-key/token patterns. Manual auth/device and clinical approval remain BLOCKED, not inferred from these checks.
- Next safe task: P0-02 publication interlock. Qualified approval workflow remains missing; block direct admin/API publication in the meantime.

## P0-02 pre-merge checkpoint

- Branch `fix/clinical-publication-interlock`: direct INSERT/UPDATE to published lessons/questions/cases is rejected by a DB trigger; existing draft/in_review/archive workflows remain usable.
- Real-backend installation + regression test ran in a single transaction ending in ROLLBACK and passed. It tested a trusted synthetic admin and an audit row that cannot count as clinical sign-off. No guard or fixture rows persisted from the dry run.
- Installation stops if any clinical material is already published. Before-state: zero published clinical items and no publication-approval trigger in the audited metadata. Recovery keeps the interlock through an application rollback; no existing rows need rewriting.
- This is a publication lock, not an approval workflow. E04 and qualified clinical publication remain BLOCKED. Production activation is pending PR/CI.

## Accepted milestone: P0-02 clinical publication safety lock

- [PR #19](https://github.com/gauravjoshi2999/dentprep/pull/19), code `b18a0279e71b16711c41bcf24a00e86879f67bd4`, merge/live `a6ea77536aade2356a051f0b6c089aa012fcd586`.
- PR CI 45242774973, main CI 45243391738 and production 45243391806: SUCCESS, including complete required live guest browser checks. Exact evidence artifact ID `14852357391`.
- Real DB guard install and rollback-only regression passed. Three table trigger objects (six INSERT/UPDATE event rows) deny publication. Direct admin inserts/updates were blocked despite a workflow audit row; draft/in_review/archive/editor flows passed.
- Final DB state: 1 auth user, 15 lesson drafts, 30 question drafts, 15 case drafts, 0 published clinical items; synthetic QA user absent. Explanation/correctness grants remain denied. Existing data was not rewritten.
- Clinical author/reviewer/source/version approval is still missing. This lock does not turn any clinical approval gate into PASS.

## New P0 finding: local state on direct account switch

- Query cache clears, but interview transcript/editor component state previously survived a direct A-to-B auth identity change. Fragment identity scoping now discards private editors and runs unmount cleanup; same-account token refresh preserves drafts.
- Two regression tests verify account-change/logout cleanup and same-account refresh preservation. Local TypeScript and all 28 unit tests pass. CI/production are pending this task's PR.
- Continuous-cycle draft work is paused without any database application while this privacy issue takes priority.

## Accepted release: P0-04 account-local state isolation

- [PR #20](https://github.com/gauravjoshi2999/dentprep/pull/20), head `ce90671c5f9979b2118f1be4f04583ba52d2fb1f`, merge/live `889cb9bcf6767a31a0ca5bf8460a47bb56aabb6b`.
- PR CI 45245114228 SUCCESS (28 unit tests including identity-change/logout cleanup and same-account refresh preservation). Main CI 45246246939 SUCCESS; 19 desktop/mobile fixture browser tests passed, with one intentional desktop skip for mobile-only navigation.
- Production 45246246768 SUCCESS; artifact `14853303268`. Fresh CLI verified exact live SHA, SSR/assets/routes/PWA. No DB change. Actual A/B account/device tests remain BLOCKED by the recorded browser policy restriction.

## P1-01 pre-merge implementation checkpoint

- Branch `feat/continuous-study-cycles`; additive owned lineage and atomic cycle RPC, client retry intent, 7/15/30 renewals, carry queue, original completion history, workload/availability limits. No P1 DB changes applied at this checkpoint.
- Before metadata: `ops/backups/2026-11-23-study-cycles.json`; original production counts 1 user / 1 plan / 30 tasks. `ops/STUDY_CYCLE_ROLLOUT.md` defines expand before client, contract after compatible live release, recovery without deleting history.
- Real backend dry run passed owner/anonymous/cross-user boundaries, retry idempotency, stale saves, carry once, all three cycle lengths, completed timestamps, missing lessons and daily-budget atomic rejection. All synthetic data and DDL rolled back. Advisory locking is implemented; concurrent load testing is not claimed.
- TypeScript, 35 unit tests, 11 release tests, changed-source lint and source checks pass locally. Desktop/mobile fixture renewal/history test added; full CI/release are pending. No private learner content exported and no clinical material published.

## Accepted milestone: P1-01 renewable personal study cycles

- [PR #21](https://github.com/gauravjoshi2999/dentprep/pull/21), head `e25caad72e74c2f508f33a72d518243801b3eca4`, merge/live `15a68141d84ee813c3e383cb30ec24d502a549d4`.
- PR CI 45247389604 and branch CI 45247376463 SUCCESS, then main CI 45247885358 SUCCESS: 35 unit + 11 release tests, 21 desktop/mobile fixture passes and one intentional desktop skip. Renewal, original 1/7 completion history, 6 carried rows, reload and nonduplicated unresolved queue are exercised.
- Production 45247885359 SUCCESS; exact-release artifact `14853939298`. Fresh CLI passed exact SHA/SSR/assets/routes/PWA at the existing live origin.
- Backend expand installed after branch CI; contract installed only after compatible live release. Updated native rollback-only regression passed before final contract. `study_task_carryovers` has RLS; direct scheduling writes denied, completion checkbox writes retained.
- Actual counts after enforcement: 1 user / 1 existing plan / 30 existing tasks, 0 lineage rows, synthetic accounts absent. No learner plan was renewed on their behalf; no existing history or clinical draft rewritten/published.
- Acceptance scope: durable atomic renewal/carry and preserved schedules are technically verified. Real-account/cross-device acceptance, diagnostic baseline, mastery prerequisites, full adaptive curriculum and verified official-date transition remain separate pending work. No concurrent load or clinical readiness claim.

## Lovable editor synchronization audit

- Read-only Lovable project metadata reports internal latest `a770fddd8b9241b4ceba87db38b261dfc2f244a6`, edited 2026-11-23T12:38:08Z, not published. Default `src/lib/auth.tsx` does not include the identity-scoped subtree from PR #20.
- GitHub/Cloudflare is verified ahead of that editor copy. Connector tools do not expose GitHub sync configuration, and no Lovable AI generation/credit action was used. Editor synchronization is **UNVERIFIED / BEHIND**, not PASS. Do not direct learners to its preview as production or overwrite tested GitHub changes from the stale editor.
- Actual account/provider/browser/device access stays BLOCKED under the recorded Cloud Browser policy; no workaround or password request.

## Release-critical scoring verification in progress

- Existing RLS already denies candidate score/answer INSERT/UPDATE; this audit found no confirmed direct score-forgery bypass. Least-privilege grant hardening and a native score/revision regression are prepared, not applied.
- Native execution is temporarily rate-limited by the Lovable free-plan MCP action window; the rejected query was explicitly not executed. No paid upgrade, provider key or data write is inferred. Finish the rollback-only test before merging/applying this task.

## Accepted milestone: release-critical score/revision integrity

- [PR #22](https://github.com/gauravjoshi2999/dentprep/pull/22), head `621cc0834803f9bdbb4a63782eed6c35fcbbe949`, merge/live `137985adfeeaea1114d803b0688f8c2ac063f6e2`.
- PR CI 45248990949, main CI 45249547705 and production 45249547837 SUCCESS; artifact `14855490953`; fresh CLI exact-SHA SSR/assets/routes/PWA PASS. 35 unit + 11 release tests and 21 desktop/mobile fixtures pass (one intentional desktop mobile-navigation skip).
- Native rollback QA before and after grant hardening PASS: all-correct/wrong/skipped, mixed denominator 33.33, duplicate/empty rejection, exam answer change, immutable submit, repeat-submit/revision idempotency, wrong next-day due date, successful 3-day revision and original result preservation, cross-user boundaries and direct-write denials.
- Existing RLS already blocked candidate score/answer writes; no direct score-forgery bypass was established. Narrowed redundant grants and server revision-result writes, pinned `submit_attempt` search path. Scoring arithmetic/function bodies unchanged; owned read and own-attempt deletion retained. Continued due-question tasks retain the practice destination.
- Backend enforcement applied only after compatible deployment; the cooldown-rejected queries were not executed. Final native state: 1 user, 0 attempts/answers/revisions, QA absent; 15 lesson/30 question/15 case drafts, 0 published clinical items, guard enabled. No learner/content rows rewritten.
- Native nonclinical fixture setup temporarily disabled the question guard in its uncommitted transaction, restored it before candidate tests and rolled back. No durable publication bypass or medical material was introduced. Score-version/regrading provenance, medical validity and actual account/device QA remain pending.

## P1-03 practice evidence pre-merge checkpoint

- Branch `feat/topic-practice-evidence`: `/progress` groups the latest submitted result per distinct current published question by subject/topic. Retaking one question fifty times gives one-item evidence; unknown/withdrawn metadata is excluded with counts, and missing topic tags are not called weak concepts.
- Five distinct questions and below 70% are explicitly labelled product triage heuristics. No unseen diagnostic, clinical mastery, official pass mark or selection prediction is claimed. Full session totals/history remain unchanged.
- TypeScript, 44 unit tests (nine evidence regressions), changed-source lint and source security pass locally; desktop/mobile nonclinical report fixture added. PR/CI/live pending. No DB change for this feature.
- Source-reference inspection is logged in `DENTPREP_SOURCE_VERIFICATION.md`; historical BDS regulations were retrieved, amendment currency remains unverified, and UPSC recruitment facts were not reverified in this task. This does not approve any clinical draft.

## Accepted milestone: P1-03 transparent subject/topic practice evidence

- [PR #23](https://github.com/gauravjoshi2999/dentprep/pull/23), head `cdb8029d31911d60288c3e6ffa221d56c9356017`, merge/live `e3b3ee74db3e8357175189a0907a8463ccae24af`.
- PR CI 45250860733, branch CI 45250851887, main CI 45251461255 and production 45251461187 SUCCESS; release artifact `14854928788`. Fresh CLI exact-SHA SSR/assets/routes/PWA PASS.
- 44 unit tests, 11 release tests and 23 desktop/mobile nonclinical browser fixtures PASS (one intentional desktop mobile-navigation skip). Report fixture verifies truthful empty state and a five-item 40% revision suggestion with its heuristic disclosure; unit cases cover retakes, latest outcomes, sparse/missing/withdrawn tags and conservative timestamp ties.
- No DB or content change. Existing session history/totals retained. Full unseen diagnostic, adaptive prerequisites, current curriculum coverage, real-account/device and clinical/longitudinal validation remain pending.

## P0 draft-isolation technical QA

- `ops/verify-draft-isolation.sql` passed on the native existing DB after the free-plan cooldown. Anonymous and candidate roles cannot read draft or in-review lessons/questions/cases, options or source rows; candidate draft mutation is denied; trusted admin draft reads work.
- All synthetic accounts/content/sources/status changes rolled back. Final state: 1 real user, 15/30/15 draft counts, all three publication guards enabled. No trigger was disabled and no clinical fixture was published for this regression.
- This is the RLS/data-access gate. Actual signed-in browser and physical-device scenarios remain separately BLOCKED.

## P2 Android launch-target implementation checkpoint

- Existing wrapper still defaulted to example.invalid despite the verified Cloudflare origin. Default now points to that same app's `/dashboard`; CI runs Gradle debug+lint and verifies the exact prior/current web revision before accepting the artifact, and records APK checksum/debug certificate and explicit acceptance limits.
- Branch `fix/android-live-launch-target`; CI/native build and live acceptance are pending. No production signing identity, Digital Asset Links, private keystore, paid publishing service or second frontend/backend is created. A debug artifact is not a production/physical-device PASS.

## Clarification: manual source import

The repository README already records that this is a manual import and Lovable Git settings were not connected. The current stale editor snapshot is consistent with that workflow, not evidence that a previously working synchronization suddenly broke. Preserve GitHub as production source and the existing Lovable backend; do not create a replacement repository to obtain sync. The connector cannot configure syncing this existing repo, and no editor/live equivalence is claimed.

## Accepted milestone: P2 Android debug target and binary QA

- [PR #24](https://github.com/gauravjoshi2999/dentprep/pull/24), final head `910d20d3ea187474ac8885e842f907089b8f8314` (earlier preserved commit `c838e28dfc5a144bd3487e9e2e85c5d6ea79baf9`), merge/native/web checkpoint `cc140559ff628371d7cc1ca65c044f00369be20a`.
- Latest-head web CI 45252576023 and Android 45252575855 SUCCESS. Main web CI 45253304791, production 45253304850 and Android assemble/lint 45253304800 SUCCESS. Exact main web/SSR/assets/routes/PWA CLI PASS.
- Web artifact `14857143951`; seven-day Android artifact `14856519438` (`dentprep-android-debug-cc140559ff628371d7cc1ca65c044f00369be20a`). The APK is 4,847,544 bytes, SHA-256 `da4f3260f83ea8b260efa794d21c03ff8bc1cce3d55e2c4b793a37f2153a255b`.
- Downloaded and inspected the actual main artifact: checksum matches APK bytes, compiled manifest has the live `/dashboard` and `in.dentprep.app`, no placeholder/no keystore included, parsed JSON matches both native and verified web `cc140559…`. Permanent inspection receipt: `ops/qa/android-debug-pr24.json`.
- Standard debug certificate only. Production signing, Digital Asset Links, physical phone/account installation and Play Store release remain NOT CONFIGURED / NOT RUN. Do not publish the debug certificate as production ownership proof.
- No backend or clinical content change. Existing Cloudflare origin/backend/repository preserved. Web updates use that same origin; native wrapper updates need a new APK.

## Final master-session checkpoint

Seven focused implementation/QA PRs #18–24 were safely merged and verified. The supplied 100 Q&A / 50 software scenarios / 20 academic gates / 72 slides / four reference images are indexed, not certified complete. Accepted implementation checkpoint is `cc140559…`; any subsequent handoff-only commit has its exact live revision/run in the automatically generated SHA-specific release artifact and PR verification comment. A tracked file cannot embed its own eventual commit SHA.

No unfinished backend migration is left pending. Confidential columns, clinical publication guards, atomic study-cycle permissions and server score/revision grants are enforced. Existing data was preserved by additive changes and rollback-only native fixtures. Metadata backups and these dry runs are not a complete disaster-recovery restore exercise; that separate exercise remains NOT RUN.

Full approved curriculum, independent clinical sign-off, unseen diagnostic/adaptive mastery, delayed-retention/student pilots, score-content version/regrading provenance, current UPSC/corrigendum checks, actual account/device/visual acceptance and live AI-provider integration remain pending or BLOCKED. No 100%, official UPSC score, clinical competence, production APK or background continuation is claimed. Next three concrete tasks and normal-chat continuation are in `DENTPREP_NEXT_ACTIONS.md`.

## P1-04 curriculum/source preparation — implementation checkpoint (24 November 2026)

- Baseline main/live `cbc2becdd898bf258e30f426e962cb07f43e9c4a` reverified against current CI 45255282502 and production 45255282524 SUCCESS, with fresh exact live SSR/assets/routes/PWA PASS. No open duplicate PR existed.
- Native audit: 22 RLS-enabled public tables, 1 actual user, **0 actual admins**, 15/30/15 clinical drafts, 0 published clinical items, 1 existing plan/30 tasks, three enabled publication guards. Before metadata: `ops/backups/2026-11-24-curriculum-evidence.json`.
- Branch `feat/curriculum-preparation-evidence`: admin-only unit/topic/outcome and edition/section reference preparation editor for each existing lesson/MCQ/case. Append-only revisions, server SHA-256 (including option text/correct flags), stale content/version checks, identical retry idempotency, explicit reload without silent form overwrite, private history and strict input validation. No clinical approval field or publication path is introduced.
- Installation + native regression ran in one outer ROLLBACK transaction and passed roles, immutable history, source/outcome validation, stale text/option/metadata changes, archive refusal and unchanged publication guards. All synthetic users/records rolled back. No actual admin assigned and no production schema change yet.
- Local typecheck, 51 unit tests, changed-source lint and source checks pass; two mobile/desktop fixture cases added for persistence/history and stale-form reload. PR/complete CI/install/merge/live are pending at this checkpoint.
- This is preparation metadata, not a canonical complete syllabus/coverage denominator, source correctness verification, credential review or qualified approval. Q011/Q013/Q015 are partial, and academic/clinical gates remain blocked.
- A permanent administrator requires the owner to identify/authorize the intended DentPrep account. The sole existing account is not automatically promoted. Real signed-in admin/browser acceptance remains separately blocked/unverified.

## Accepted P1-04 preparation registry and single-learner scope checkpoint

PR #26, head `7a0cb931fe64d57e72c8dba2db6ab1f2cd681c0b`, merge/live `1631f10f9742314c8d40345ab78bb9e9640aaa2a`. Main CI 45298201707 and production 45298201836 SUCCESS; artifact 14877482269 downloaded and exact receipt inspected. Fresh CLI SSR/assets/routes/PWA PASS; real anonymous RPC/table/helper denial checks returned 401/42501. Permanent evidence: `ops/qa/curriculum-preparation-pr26.json`.

Additive registry installed through existing Lovable SQL after exact-head CI; post-install native rollback regression PASS. 23 public RLS tables, three enabled clinical guards, original 1 real user, 0 actual admins/evidence records, clinical drafts preserved, no QA accounts left. 51 unit/11 release/27 desktop-mobile nonclinical fixture passes, one intentional skip. Final QA predicates are scoped to synthetic entity IDs, so future real records remain untouched even if permissions regress.

Issue #27 remains OPEN and now supersedes multi-user/admin product UX: single private learner, reviewed preloaded quests, no daily admin entry. No real admin was assigned. Source preparation is not qualified approval. Medical source/coverage/review and all 20 academic gates take precedence over cosmetic gamification. See scope and updated continuation. Actual-account, hardware, full coverage and qualified review remain pending/BLOCKED.

## Mandatory medical-content system — implementation checkpoint

Scope checkpoint PR #28 merged as `95a940a5a9de973704ddedd251606ea067c339b8`; main CI 45302115850 / production 45302115773 SUCCESS. Issue #27 stays OPEN. New safety branch adds required CI/production `check:content`/`test:content`, strict signed per-claim/source/version/20-check package integrity, independent owner-verified dental roster (empty), MCQ/distractor/ambiguity/verified feedback and illustration contracts, signed corrections/append-only history and fresh/transfer/1-7-30 quest contracts. The validator has no publication capability. All DB guards/data are unchanged.

Native metadata re-audit saved 60 draft teaching fingerprints: zero per-item clinical source rows, zero published items, three enabled guards. All 15 groups have 90 initial candidate outcome tasks; full essentials/amendments/qualified completeness remain unverified. No source correctness, human review, factual AI validity, clinical approval or runtime retention/withdrawal service is claimed. All 20 academic checks remain BLOCKED, with E19 explicitly adapted to single-learner scope. Learner admin navigation removed; legacy route/history/RLS preserved.

43 isolated content-safety regressions, 51 existing unit and 11 release tests pass locally. Final exact-head CI/browser/build/merge/deployed SHA and live QA are recorded by this PR's verification comment plus SHA-specific release receipt, not inferred from committed files. See `content/`, `ops/MEDICAL_CONTENT_RELEASE.md` and the updated exact normal-chat continuation.

Additional P0 safety finding: unreviewed labelled anatomical SVG was displayed by static branding outside DB records. Removed the informative cross-section from public homepage/study headers, retaining the original in Git and reusing the decorative logo. Two mobile/desktop fixture executions now check its absence. GitHub CI at earlier head 4fd41c0 passed, but the superseding head must pass fresh checks. Separate Cloudflare Workers Builds check failed on that earlier feature head without exposing a diagnostic reason; private-dashboard observation was auto-review denied under retained browser authority restrictions. Do not bypass this denial or claim those private logs inspected. Authorized GitHub CI/production and exact live evidence remain the release route.

## Release regression follow-up

PR #29 merge `6c9651f31628464bf10f524b643a770b06148757`, main CI 45304836325 SUCCESS. Production workflow 45304836476 stopped before its deploy step: mobile signout fixture clicked then navigated without awaiting app completion (same failed private-view assertion on retry). Request cancellation is an inference, not observed proof: this failed production workflow did not retain traces. The test now includes a deliberately delayed successful logout response and waits for actual completion. Final PR CI had passed 29 browser fixtures; the release failure is retained, not called a verified release.

Follow-up waits for actual app signout completion (home URL and signout control gone) before reloading a protected page; the protected-view and private-name assertions remain. No auth code, token handling, RLS or acceptance assertion is weakened. Production also preserves failed browser traces for seven days, matching existing CI practice. Require fresh full CI/release/exact-live verification; exact acceptance is in the PR comment/release receipt. Clinical safeguards and all 60 drafts unchanged.
