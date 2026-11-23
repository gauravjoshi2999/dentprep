# DentPrep — next actions

Read `DENTPREP_COMPLETION_LEDGER.md`, latest main and current live `/api/health` before changing anything. Last accepted implementation/native checkpoint: `cc140559ff628371d7cc1ca65c044f00369be20a` (PR #24). Main CI 45253304791, production 45253304850 and Android 45253304800 SUCCESS. Live: https://dentprep.gauravjoshi2999.workers.dev . Later handoff-only commit truth comes from the exact-SHA release artifact and verification comment; do not mistake the snapshot for an unresolved live mismatch.

Do not redo PRs #18–24: answer confidentiality, publication safety lock, identity-scoped private editors, atomic renewable cycles/carry history, native score/revision integrity, distinct-question topic evidence and live-target debug APK are technically verified. No backend rollout is pending. Actual-account P0 acceptance is BLOCKED; it takes precedence as soon as permitted access is available.

## Next three tasks

1. **P1 — Curriculum/outcome and independent-review evidence registry.** Highest unblocked learning task. Files/routes: existing `/admin`, `/library`, `src/lib/queries.ts`, additive SQL under `ops/` (preserve generated files). Tools: GitHub + existing DentPrep Lovable SQL; official primary sources. Map each existing subject to explicit units/topics/outcomes, source edition/section/check date and missing coverage. Keep author/reviewer/version evidence separate from workflow logs; no fake completeness denominator. Acceptance: source and mapping validation, role-negative tests, stale/version-mismatch rejection, missing credentials/sign-off cannot publish, and the current publication lock remains intact until an independently verified replacement is deliberately approved. Normal ChatGPT can implement/test if these connectors are available; only qualified accountable humans can provide clinical approval. See `DENTPREP_SOURCE_VERIFICATION.md` for inspected references and unverified amendment currency.
2. **P0/P2 — Real-account and visual acceptance when browser access is permitted.** Files: matrix T04/T06–T10/T14/T42/T49/T50, auth/provider redirects and private routes. Tools: authorized A/B test accounts, permitted live browser, physical mobile/desktop. Test registration/confirmation, Google/recovery callback on the actual origin, relaunch/refresh, logout and direct account switch, private plan/interview persistence and admin denial. Compare actual screenshots against the four supplied designs. Do not publish clinical fixtures, create unapproved permanent admins, bypass URL policy or request passwords in chat. Native/mock privacy checks already pass, but they do not replace this gate. Work/hardware access is required for actual interaction; normal chat can inspect configuration through permitted connectors.
3. **P2 — Production Android identity and device acceptance.** Files: `android/`, workflow, future verified `/.well-known/assetlinks.json`. The debug APK is available on run 45253304800 / artifact 14856519438 with checksum in the ledger. Before a production build, the owner must choose/secure the stable release signing identity; keep it server-side and never paste/upload it to source/chat. Require actual certificate/package association, Digital Asset Links verification, physical install/login/update tests and account data persistence. Do not use the CI debug certificate as production identity. Normal chat can prepare/configure/review build code; secure identity selection and actual hardware are external gates. No paid store/API action is authorized merely by this checklist.

## Remaining gates

- No qualified independent review exists for the 15 lessons/30 MCQs/15 clinical cases; all stay draft. The 20 academic gates and consenting learning/retention pilots are not automatically passed.
- Live AI interviews need authorized server-side provider credentials, privacy/consent/quota and clinical evaluation. No paid provider/upgrade or Lovable AI-credit generation was used. Current interviews remain self-guided text practice with optional browser dictation, not response-based AI clinical grading.
- Full software matrix still has NOT RUN/BLOCKED cases: native technical passes, mocked browser passes, real accounts, physical devices and medical approval are distinct.
- Current official UPSC/corrigendum facts and regulator amendment currency need independent checking before changing notices or curriculum claims. No exam date, RT pattern, cutoff or selection probability is invented.
- Full disaster-recovery restore and content/score-version regrading provenance remain NOT RUN/missing. Existing permission/function metadata backups are not a full data backup certification.

## Access and source truth

Existing GitHub read/write, DentPrep Lovable SQL and configured free Cloudflare release pipeline work; do not ask for their credentials again. Use protected scoped deployment secrets only inside their intended workflow step. Free MCP SQL calls have rolling cooldowns: rejected queries explicitly did not execute; wait the stated interval, do not pay/upgrade or bypass limits.

Cloud Browser failed opening live login, then URL-policy authority denied observation. Real account/browser work is BLOCKED here; do not attempt alternate-surface/raw-browser workarounds. Signed-in sessions, tooling and connectors must be rechecked in any later chat.

The repository is a manual Lovable source import and its README already records that Git settings were unconnected. The stale editor copy is expected under that workflow; GitHub/Cloudflare is the verified production source, the existing Lovable backend is retained. Connector tools cannot configure synchronization of this existing repo. Do not create a replacement repo/backend or treat the editor preview as current production. Never modify Bite/restaurant-os.

## Exact continuation

Fetch/read latest main and the latest successful production artifact, compare `/api/health` to that exact revision, then implement task 1 with the publication guard still active. Use small PRs, type/security/unit/native role-negative tests, required CI and exact live verification. Save source/PR/head/merge/test/deploy evidence here after each accepted milestone. Complete blocked actual-account tasks first if their permitted access becomes available.

Ready-to-use normal-chat message:

> Continue DentPrep from the latest verified main, GitHub issues and DENTPREP_NEXT_ACTIONS.md. Take the highest-priority safe task supported by the tools currently connected. Audit → implement → test → PR → QA → safe merge → live verify. Do not redo PRs #18–24, fabricate clinical approval or call mocked/device-blocked tests complete. Preserve data, secrets and Bite separation; save the result, exact next command and remaining Work-only steps back in GitHub.

No background continuation or guaranteed access in another mode is implied.
