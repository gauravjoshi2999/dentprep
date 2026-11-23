# DentPrep 50-scenario acceptance matrix

SOURCE: Q&A test protocol, PDF physical pages 16–19. Audit baseline `4b92b5e75f12f7b7254784c8a865fad305e8bf1f`, 2026-11-23 UTC. Guest technical release verified; no authenticated or physical-device pass is inferred from CI.

For every execution append timestamp, SHA, fixture/account label (no credentials), steps, expected/actual, device, log/screenshot, bug/PR and retest. NOT RUN and BLOCKED are not failures, and partial coverage is never a full PASS.

## T01 — Homepage loads

- Priority: P1; status: **NOT RUN**.
- Expected / steps: Guest opens / on normal and slow mobile network; expected complete branded page, no browser console errors; capture mobile screenshot and network log.
- Actual / evidence: Existing CI has partial coverage; full scenario has not been executed to this specification.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T02 — Five bottom tabs

- Priority: P1; status: **NOT RUN**.
- Expected / steps: On 360px Android emulation each tab navigates to correct route; Profile panel works; keyboard/focus and screenshot evidence.
- Actual / evidence: Existing CI has partial coverage; full scenario has not been executed to this specification.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T03 — Responsive layouts

- Priority: P1; status: **NOT RUN**.
- Expected / steps: Test 320,360,390,768,1024,1440 widths; no clipped controls, overflow, tap or zoom failures; visual evidence.
- Actual / evidence: Existing CI has partial coverage; full scenario has not been executed to this specification.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T04 — Reference fidelity

- Priority: P1; status: **BLOCKED**.
- Expected / steps: Compare four screens with embedded images; actual real data, not sample scores; record visible diffs and sign-off.
- Actual / evidence: Cloud Browser URL-policy authority blocked the login-page observation. Human account/device or reviewed-content/provider gate still needed.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T05 — Offline/PWA return

- Priority: P1; status: **NOT RUN**.
- Expected / steps: Install PWA, load/offline/online, update service worker; verify stale assets cannot crash home, no silent data loss.
- Actual / evidence: Existing CI has partial coverage; full scenario has not been executed to this specification.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T06 — New registration

- Priority: P0; status: **BLOCKED**.
- Expected / steps: Real test user signs up with allowed auth method; confirmation/profile state validated; no duplicate profile.
- Actual / evidence: Cloud Browser URL-policy authority blocked the login-page observation. Human account/device or reviewed-content/provider gate still needed.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T07 — Bad credentials

- Priority: P0; status: **NOT RUN**.
- Expected / steps: Wrong login and malformed input handled safely with field errors; no auth or token leakage.
- Actual / evidence: Existing CI has partial coverage; full scenario has not been executed to this specification.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T08 — Session persistence

- Priority: P0; status: **BLOCKED**.
- Expected / steps: Correct login survives app relaunch/refresh; expired session reauth states are explicit.
- Actual / evidence: Cloud Browser URL-policy authority blocked the login-page observation. Human account/device or reviewed-content/provider gate still needed.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T09 — Reset/OAuth redirects

- Priority: P0; status: **BLOCKED**.
- Expected / steps: Reset email and configured Google OAuth callback work on actual Cloudflare domain; require provider config evidence.
- Actual / evidence: Cloud Browser URL-policy authority blocked the login-page observation. Human account/device or reviewed-content/provider gate still needed.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T10 — Cross-account isolation

- Priority: P0; status: **BLOCKED**.
- Expected / steps: A logs out, B logs in; cached progress, answers, interviews and profile A must not appear for B.
- Actual / evidence: Cloud Browser URL-policy authority blocked the login-page observation. Human account/device or reviewed-content/provider gate still needed.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T11 — 15 subject groups

- Priority: P1; status: **NOT RUN**.
- Expected / steps: Show actual published subjects and truthful counts; review subject mapping vs curriculum registry.
- Actual / evidence: Existing CI has partial coverage; full scenario has not been executed to this specification.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T12 — Study search/filters

- Priority: P1; status: **NOT RUN**.
- Expected / steps: Search subject, topic, typo, empty result and category; index accuracy and keyboard UX evidence.
- Actual / evidence: Existing CI has partial coverage; full scenario has not been executed to this specification.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T13 — Draft visibility

- Priority: P0; status: **NOT RUN**.
- Expected / steps: Unapproved lessons/MCQs/cases remain inaccessible by direct URL/API; include RLS negative test. DentPrep | Independent education | Verified-source work handoff
- Actual / evidence: Existing CI has partial coverage; full scenario has not been executed to this specification.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T14 — Lesson progress

- Priority: P1; status: **BLOCKED**.
- Expected / steps: Read, objective quiz, completion, logout/login and cross-device progress check; version stable.
- Actual / evidence: Cloud Browser URL-policy authority blocked the login-page observation. Human account/device or reviewed-content/provider gate still needed.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T15 — Bookmarks

- Priority: P1; status: **NOT RUN**.
- Expected / steps: Add/remove bookmark from lesson and test; account-scoped; refresh persists.
- Actual / evidence: Existing CI has partial coverage; full scenario has not been executed to this specification.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T16 — Evidence and diagrams

- Priority: P1; status: **BLOCKED**.
- Expected / steps: Check citations/edition/update dates and anatomical figure labels, alt text and license; expert sign-off.
- Actual / evidence: Cloud Browser URL-policy authority blocked the login-page observation. Human account/device or reviewed-content/provider gate still needed.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T17 — Baseline diagnostic

- Priority: P1; status: **BLOCKED**.
- Expected / steps: Approved unseen questions across available subjects; valid score, partial content coverage disclosure.
- Actual / evidence: Cloud Browser URL-policy authority blocked the login-page observation. Human account/device or reviewed-content/provider gate still needed.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T18 — Weak topic detection

- Priority: P1; status: **NOT RUN**.
- Expected / steps: Seed errors in known topics; verify tags and formula-based recommendation with explanation.
- Actual / evidence: Existing CI has partial coverage; full scenario has not been executed to this specification.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T19 — Study plan renew

- Priority: P1; status: **NOT RUN**.
- Expected / steps: 7/15/30 day plan cycles complete and renew indefinitely without study deadline or duplicate tasks.
- Actual / evidence: Existing CI has partial coverage; full scenario has not been executed to this specification.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T20 — Carry-forward

- Priority: P1; status: **NOT RUN**.
- Expected / steps: Missed/overdue tasks reschedule, revision queue updates, no loss of historic completion.
- Actual / evidence: Existing CI has partial coverage; full scenario has not been executed to this specification.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T21 — Subject session config

- Priority: P1; status: **NOT RUN**.
- Expected / steps: Allowed topic/difficulty/approved count/mode combinations create matching attempts; shortage honest.
- Actual / evidence: Existing CI has partial coverage; full scenario has not been executed to this specification.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T22 — Timed countdown

- Priority: P0; status: **NOT RUN**.
- Expected / steps: Server anchored clock, background tab, reload, expiry handling and idempotent final submit.
- Actual / evidence: Existing CI has partial coverage; full scenario has not been executed to this specification.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T23 — MCQ answer save

- Priority: P1; status: **NOT RUN**.
- Expected / steps: Choose, save, confirm durable persistence; practice explanation after save only.
- Actual / evidence: Existing CI has partial coverage; full scenario has not been executed to this specification.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T24 — Skip/back/resume

- Priority: P1; status: **NOT RUN**.
- Expected / steps: Skip and revisit without answer corruption; unsaved warning; refresh/connection fail behavior.
- Actual / evidence: Existing CI has partial coverage; full scenario has not been executed to this specification.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T25 — Exam-mode confidentiality

- Priority: P0; status: **PASS** for the technical confidentiality gate.
- Expected: no answer review before exam submission; practice review only after a saved answer; inspect API and candidate payloads.
- Actual: PR #18, head `d72d9266b8801fbee1725e91994ec68fd451b8bf`, merge/live `98bf0db3f477c066adda862f31b8257ddf4c2937`. Real DB rollback tests deny direct explanation/correctness, keep exam feedback null/empty across answer changes, permit owner-only submitted review and practice resume. All fixtures rolled back.
- Browser fixture: exam save/reload/submit passed on desktop/mobile within 19 passing acceptance tests. This is isolated non-clinical mocked data, not real candidate/medical QA.
- Live REST after contract: safe question projection HTTP 200 (0 public questions); explanation and correctness columns HTTP 401 / 42501; anonymous private RPC HTTP 401. Source projection and saved bookmarks cannot bypass the gate.
- Release: https://github.com/gauravjoshi2999/dentprep/actions/runs/45241181580 — SUCCESS; exact deployed SHA, SSR/assets/PWA and guest mobile/desktop suite passed.
- Retest: PASS, 2026-11-23 UTC. Reviewed clinical question-bank publication remains BLOCKED separately.

## T26 — Score arithmetic

- Priority: P0; status: **NOT RUN**.
- Expected / steps: Validate correct/attempted/skipped/total, duplicate answer, empty denominator, result versioning.
- Actual / evidence: Existing CI has partial coverage; full scenario has not been executed to this specification.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T27 — Wrong-answer revision

- Priority: P1; status: **NOT RUN**.
- Expected / steps: Wrong questions enter private queue, fix on retry, original attempt unchanged, due dates accurate.
- Actual / evidence: Existing CI has partial coverage; full scenario has not been executed to this specification.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T28 — Question dispute

- Priority: P1; status: **NOT RUN**.
- Expected / steps: Report ambiguous item, log reviewer action, withdrawal/regrading provenance and user notice.
- Actual / evidence: Existing CI has partial coverage; full scenario has not been executed to this specification.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T29 — Clinical case stages

- Priority: P1; status: **BLOCKED**.
- Expected / steps: Approved case with history, differential, investigations and completion; per-stage authored data.
- Actual / evidence: Cloud Browser URL-policy authority blocked the login-page observation. Human account/device or reviewed-content/provider gate still needed.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T30 — Clinical red flags

- Priority: P1; status: **BLOCKED**.
- Expected / steps: Airway/sepsis/bleeding safety fixture triggers escalation, not unsafe autonomous treatment. DentPrep | Independent education | Verified-source work handoff
- Actual / evidence: Cloud Browser URL-policy authority blocked the login-page observation. Human account/device or reviewed-content/provider gate still needed.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T31 — Clinical hidden content

- Priority: P0; status: **NOT RUN**.
- Expected / steps: Draft or unreviewed case cannot appear in library or direct API; rule test with both roles.
- Actual / evidence: Existing CI has partial coverage; full scenario has not been executed to this specification.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T32 — General interview

- Priority: P2; status: **BLOCKED**.
- Expected / steps: Start/save/finish/reload text rehearsal; no invented marks.
- Actual / evidence: Cloud Browser URL-policy authority blocked the login-page observation. Human account/device or reviewed-content/provider gate still needed.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T33 — Consent for voice

- Priority: P2; status: **BLOCKED**.
- Expected / steps: No mic before opt-in; browser disclosure; disable and cleanup on screen change.
- Actual / evidence: Cloud Browser URL-policy authority blocked the login-page observation. Human account/device or reviewed-content/provider gate still needed.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T34 — Voice fallback

- Priority: P2; status: **BLOCKED**.
- Expected / steps: Denied permission, unsupported engine, recognition error and manual text editing.
- Actual / evidence: Cloud Browser URL-policy authority blocked the login-page observation. Human account/device or reviewed-content/provider gate still needed.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T35 — Provider AI follow-ups

- Priority: P2; status: **BLOCKED**.
- Expected / steps: When explicitly configured: server-proxied, context-aware follow-up and authenticated rate limit, otherwise blocked.
- Actual / evidence: Cloud Browser URL-policy authority blocked the login-page observation. Human account/device or reviewed-content/provider gate still needed.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T36 — Clinical AI feedback

- Priority: P2; status: **BLOCKED**.
- Expected / steps: Grounded rubric/safety regression set; expert check, no pseudo-quantitative official scores.
- Actual / evidence: Cloud Browser URL-policy authority blocked the login-page observation. Human account/device or reviewed-content/provider gate still needed.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T37 — Interview privacy

- Priority: P2; status: **BLOCKED**.
- Expected / steps: A and B transcripts isolated and deletable/exportable as supported; no raw mic capture stored.
- Actual / evidence: Cloud Browser URL-policy authority blocked the login-page observation. Human account/device or reviewed-content/provider gate still needed.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T38 — UPSC notice centre

- Priority: P2; status: **NOT RUN**.
- Expected / steps: Verified notice PDF/source, timestamp, archive/corrigendum and accuracy compared with official site.
- Actual / evidence: Existing CI has partial coverage; full scenario has not been executed to this specification.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T39 — Official eligibility

- Priority: P2; status: **BLOCKED**.
- Expected / steps: Education/registration/duties are cited; app does not auto-guarantee eligibility.
- Actual / evidence: Cloud Browser URL-policy authority blocked the login-page observation. Human account/device or reviewed-content/provider gate still needed.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T40 — Application checklist

- Priority: P2; status: **NOT RUN**.
- Expected / steps: Optional document checklist, local reminder/mark-ready and privacy-safe sync; no forced sensitive uploads.
- Actual / evidence: Existing CI has partial coverage; full scenario has not been executed to this specification.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T41 — Admin RBAC

- Priority: P0; status: **NOT RUN**.
- Expected / steps: Admin role requires server/RLS check; candidates cannot access draft editor or publish.
- Actual / evidence: Existing CI has partial coverage; full scenario has not been executed to this specification.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T42 — Clinical review gate

- Priority: P0; status: **BLOCKED**.
- Expected / steps: Draft -> reviewed -> approved -> published sign-off and audit; cannot self-approve if policy disallows.
- Actual / evidence: Cloud Browser URL-policy authority blocked the login-page observation. Human account/device or reviewed-content/provider gate still needed.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T43 — RLS private data

- Priority: P0; status: **NOT RUN**.
- Expected / steps: Cross-user SQL/API attempts for plans, answers, progress, interviews denied.
- Actual / evidence: Existing CI has partial coverage; full scenario has not been executed to this specification.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T44 — Secrets/exposure

- Priority: P0; status: **PASS** for the automated source/build exposure checks.
- Expected: inspect Git history, client assets and release handling for private env, service-role/provider secret exposure.
- Actual: source-security check passed at PR #18. All fetched Git refs / 251 unique text blobs scanned: no private env paths, private keys, Supabase secret/service-role JWT or GitHub token patterns. Public build text assets also scanned without secret-pattern findings. Production deploy token is scoped to its deploy step; release artifact contains no environment dump.
- Evidence: CI/release logs for `98bf0db3f477c066adda862f31b8257ddf4c2937`; backup and ledger files contain metadata only. No secret values printed or copied into this report.
- Retest: PASS for those checks. This is pattern-based engineering evidence, not a claim that every possible future secret format is detectable.

## T45 — Network recovery

- Priority: P0; status: **NOT RUN**.
- Expected / steps: Backend error, 401, 429, timeout, offline retry, save idempotency and clear user recovery.
- Actual / evidence: Existing CI has partial coverage; full scenario has not been executed to this specification.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T46 — Accessibility

- Priority: P2; status: **NOT RUN**.
- Expected / steps: WCAG 2.2 AA targeted audit: focus, screen reader, contrast, 200% zoom, reduced motion, keyboard.
- Actual / evidence: Existing CI has partial coverage; full scenario has not been executed to this specification.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T47 — CI gate

- Priority: P0; status: **NOT RUN**.
- Expected / steps: Typecheck, tests, security, dependency review, browser QA and build pass at exact commit. DentPrep | Independent education | Verified-source work handoff
- Actual / evidence: Existing CI has partial coverage; full scenario has not been executed to this specification.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T48 — Cloudflare live revision

- Priority: P0; status: **PASS**.
- Expected / steps: Expected SHA matches /api/health, SSR, CSS/JS hashes, PWA/routes; rollback on unrecovered 404.
- Actual / evidence: Live CLI verified exact health revision, SSR, CSS/JS, routes and PWA against baseline; release run 45231986266 SUCCESS.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T49 — Real Android + desktop

- Priority: P2; status: **BLOCKED**.
- Expected / steps: Real user login, saved data, voice consent, navigation, PWA and Android signing on physical device.
- Actual / evidence: Cloud Browser URL-policy authority blocked the login-page observation. Human account/device or reviewed-content/provider gate still needed.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.

## T50 — End-to-end learner

- Priority: P2; status: **BLOCKED**.
- Expected / steps: Register -> onboarding -> baseline -> plan -> lesson -> MCQ -> review -> case -> interview -> logout/login -> resume; trace artifacts.
- Actual / evidence: Cloud Browser URL-policy authority blocked the login-page observation. Human account/device or reviewed-content/provider gate still needed.
- Fixture/environment: isolated mocked CI or rollback SQL only unless explicitly recorded otherwise.
- Retest / fix PR: pending.
