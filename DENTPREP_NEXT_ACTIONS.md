# DentPrep — next actions

Read the completion ledger first; recheck main and live SHA before writing. Last accepted application checkpoint: `889cb9bcf6767a31a0ca5bf8460a47bb56aabb6b` (PR #20; production 45246246768 SUCCESS). P0-01 confidentiality and P0-02 publication interlock are complete technical gates; do not redo them.

## Next three tasks

1. **P1-01: finish continuous-cycle rollout.** Files: `src/lib/study-cycles.ts`, `study-cycle-api.ts`, `/plan`, `ops/*study-cycles.sql`. 35 unit + 11 release tests and real rollback-only DB QA pass. Finish PR/CI, apply expand, verify compatible live release, apply contract and rerun native QA. Preserve 1 existing plan/30 tasks. Acceptance: 7/15/30 renewal, idempotent/stale save, carry once, long gap, daily budget, empty approved pool, historical completion/reload and cross-user boundaries. Normal chat can implement/test with these connectors; real account/device acceptance needs permitted browser/hardware.
2. **P0: complete real-account acceptance when permitted.** Files: scenario matrix T06-T10, auth/provider settings, privacy routes. PR #20 already merged/live; do not recreate the identity-scoped subtree. Main CI 45246246939 and production 45246246768 passed. Authorized A/B users must validate signup/login/recovery/logout/account switch and admin boundaries. BLOCKED here by explicit Cloud Browser policy; do not work around or request passwords in chat. Ordinary chat may inspect connected service configuration; actual browser/hardware requires permitted access.

3. **P1-02: curriculum and review evidence.** Map subject/unit/topic/outcome to drafts, sources and independent reviewer evidence. Do not publish or claim clinical accuracy. Normal chat can build source/coverage/review tools; only qualified accountable humans can approve content.

## Access truth

GitHub read/write, existing Lovable DB and the already configured GitHub Cloudflare release pipeline are available; do not ask for their credentials again. Use only scoped existing secrets inside the production deploy step.

Cloud Browser could not load the live login page and the URL policy denied observation of the resulting page. Record real-account browser work as BLOCKED. Do not bypass this through alternate browser surfaces or put credentials in chat. Human account/device QA, authorized reviewer evidence and any paid provider approval cannot be manufactured in code.

## Continuation message

Continue DentPrep from the latest verified main, GitHub issues and DENTPREP_NEXT_ACTIONS.md. Take the highest-priority safe task supported by the currently connected tools. Audit → implement → test → PR → QA → safe merge → verify live revision. Do not redo completed work or mark unverified work done. Save the result, exact next command and remaining Work-only steps back in the repository. No background continuation is implied.

## Exact next operation at this checkpoint

Read the latest PR/CI status for `feat/continuous-study-cycles`; if all gates pass, execute the ordered expand/client/contract steps from `ops/STUDY_CYCLE_ROLLOUT.md`. Never infer DB application from a committed SQL file. Recheck live `/api/health` and preserve rollout evidence before starting the next task.
