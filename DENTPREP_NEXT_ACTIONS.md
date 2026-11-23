# DentPrep — next actions

Read the completion ledger first; recheck main and live SHA before writing. Last accepted application checkpoint: `15a68141d84ee813c3e383cb30ec24d502a549d4` (PR #21; production 45247885359 SUCCESS). P0-01 confidentiality and P0-02 publication interlock are complete technical gates; do not redo them.

## Next three tasks

1. **P0 technical acceptance: finish score/revision integrity regression.** Files: `ops/enforce-score-integrity.sql`, `ops/verify-score-integrity.sql`, rollout doc and `/plan` continued-revision link. Existing RLS blocks candidate score writes; narrow redundant grants and pin submit search path without changing arithmetic. First require rollback-only native PASS for all-correct/wrong/skipped/mixed, duplicate/empty rejection, changed exam answer, immutable submit, repeat-submit/revision idempotency and cross-user boundaries. Free MCP SQL window temporarily rate-limited; rejected queries were not executed. Then PR/CI/merge/live and safe DB enforcement. Normal chat can implement/test with connectors; no paid upgrade required. PR #21 cycles are already deployed/contract-enforced; do not redo them.
2. **P0: complete real-account acceptance when permitted.** Files: scenario matrix T06-T10, auth/provider settings, privacy routes. PR #20 already merged/live; do not recreate the identity-scoped subtree. Main CI 45246246939 and production 45246246768 passed. Authorized A/B users must validate signup/login/recovery/logout/account switch and admin boundaries. BLOCKED here by explicit Cloud Browser policy; do not work around or request passwords in chat. Ordinary chat may inspect connected service configuration; actual browser/hardware requires permitted access.

3. **P1-02: curriculum and review evidence.** Map subject/unit/topic/outcome to drafts, sources and independent reviewer evidence. Do not publish or claim clinical accuracy. Normal chat can build source/coverage/review tools; only qualified accountable humans can approve content.

## Access truth

GitHub read/write, existing Lovable DB and the already configured GitHub Cloudflare release pipeline are available; do not ask for their credentials again. Use only scoped existing secrets inside the production deploy step.

Cloud Browser could not load the live login page and the URL policy denied observation of the resulting page. Record real-account browser work as BLOCKED. Do not bypass this through alternate browser surfaces or put credentials in chat. Human account/device QA, authorized reviewer evidence and any paid provider approval cannot be manufactured in code.

## Continuation message

Continue DentPrep from the latest verified main, GitHub issues and DENTPREP_NEXT_ACTIONS.md. Take the highest-priority safe task supported by the currently connected tools. Audit → implement → test → PR → QA → safe merge → verify live revision. Do not redo completed work or mark unverified work done. Save the result, exact next command and remaining Work-only steps back in the repository. No background continuation is implied.

## Exact next operation at this checkpoint

After the explicit free MCP cooldown, run `enforce-score-integrity.sql` + `verify-score-integrity.sql` in one outer ROLLBACK transaction as documented. Do not merge/apply score changes without native PASS. Existing cycle rollout is complete. Recheck main/live and latest artifact, then continue the highest unblocked task. Lovable editor source is behind; sync configuration is unavailable through the connector and must not be claimed verified.
