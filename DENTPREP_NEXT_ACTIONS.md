# DentPrep — next actions

Read `DENTPREP_COMPLETION_LEDGER.md`, latest main and current live `/api/health` before changing anything. Last accepted implementation/native checkpoint: `cc140559ff628371d7cc1ca65c044f00369be20a` (PR #24). Main CI 45253304791, production 45253304850 and Android 45253304800 SUCCESS. Live: https://dentprep.gauravjoshi2999.workers.dev . Later handoff-only commit truth comes from the exact-SHA release artifact and verification comment; do not mistake the snapshot for an unresolved live mismatch.

Do not redo PRs #18–24: answer confidentiality, publication safety lock, identity-scoped private editors, atomic renewable cycles/carry history, native score/revision integrity, distinct-question topic evidence and live-target debug APK are technically verified. No backend rollout is pending. Actual-account P0 acceptance is BLOCKED; it takes precedence as soon as permitted access is available.

## Next three tasks

1. **P1 — finish curriculum/source preparation rollout.** Branch `feat/curriculum-preparation-evidence`; files `ops/install-curriculum-evidence.sql`, `ops/verify-curriculum-evidence.sql`, `src/lib/curriculum-evidence.ts`, the admin preparation editor and E2E fixtures. Native rollback QA and 51 unit/type/lint checks pass. Require full CI at the exact head, then additive install through the existing Lovable SQL connector, native post-install QA, safe merge and exact live verification. Keep all publication guards active. This is not full approved curriculum coverage. Normal chat can implement/test with GitHub/Lovable connectors; actual human/browser acceptance is separate.
2. **P0 access — identify the owner-authorized real admin account.** Current native audit has 1 actual user and 0 admins. Before any permanent role grant, the owner must name/authorize the intended verified DentPrep account; do not infer administrator identity from the only user or promote QA accounts. No password/key is needed in chat. Role activation is a separate permission action after the tested feature is concrete. Then perform permitted A/B account/admin/visual QA from matrix T04/T06–T10/T14/T42/T49/T50; the earlier browser policy restriction must not be bypassed.
3. **P1 — canonical curriculum catalog and coverage inventory.** After this preparation registry, reconcile explicit subject/unit/topic/outcome identifiers against primary curriculum/source sections and missing coverage. Build source/author/independent-review evidence and version/freshness gates; no fake denominator or clinical sign-off. Existing `/admin`, `/library`, query layer and additive `ops/` SQL only; generated files preserved. Tests: RLS negative roles, stale/missing source/credential/version rejection, publication stays blocked without verified independent approval. Normal chat can build the software; qualified humans supply review. Android production identity/device and live AI remain external pending gates described below.

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

Finish the current preparation-registry PR/CI and ordered rollout from `ops/CURRICULUM_EVIDENCE_ROLLOUT.md`; do not infer DB installation from committed SQL. Save exact head/merge/run/live and native results after acceptance. The next access step is owner-confirmed real administrator identity; never automatically assign a permanent admin. Then continue the canonical curriculum/coverage task with clinical guards active. Preserve PRs #18–25 and all existing data.

> Continue DentPrep from latest main and DENTPREP_NEXT_ACTIONS.md. Audit → implement → test → PR → QA → safe merge → live verify; do not redo completed work or treat preparation/fixtures as clinical or actual-device approval. Use current connected tools, keep secrets server-side, preserve Bite separation, and save exact continuation evidence back in GitHub.

No background continuation or guaranteed tooling in another mode is implied.
