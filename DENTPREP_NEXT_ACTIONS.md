# DentPrep — next actions

Read the completion ledger first; recheck main and live SHA before writing. Last accepted application checkpoint: `98bf0db3f477c066adda862f31b8257ddf4c2937` (PR #18; production 45241181580 SUCCESS). P0-01 is complete; do not redo it.

## Next three tasks

1. **P0-02: enforce clinical publication gate.** Files: `ops/` publication guard and admin review boundary. Current status-change log is not a qualified review. Acceptance: candidate and admin API cannot publish unreviewed content or modify a published version without review; archive remains available; no existing drafts/data lost. Qualified reviewer identity and accountable sign-off remain BLOCKED until supplied. Normal chat can implement technical enforcement; it cannot provide medical approval.
2. **P1-01: continuous study cycles.** Files: planner, `/plan`, study plan/task persistence. Preserve completed history, carry overdue tasks once, keep budget realistic, make unknown exam date the default, and separate lesson completion from mastery. Acceptance: 7/15/30 renewal, concurrent/idempotent save, long gap restart, empty approved pool, immutable history. Normal chat can implement/test; actual cross-device QA still needs permitted browser/hardware access.

3. **P1-02: curriculum and review evidence.** Map subject/unit/topic/outcome to drafts, sources and independent reviewer evidence. Do not publish or claim clinical accuracy. Normal chat can build source/coverage/review tools; only qualified accountable humans can approve content.

## Access truth

GitHub read/write, existing Lovable DB and the already configured GitHub Cloudflare release pipeline are available; do not ask for their credentials again. Use only scoped existing secrets inside the production deploy step.

Cloud Browser could not load the live login page and the URL policy denied observation of the resulting page. Record real-account browser work as BLOCKED. Do not bypass this through alternate browser surfaces or put credentials in chat. Human account/device QA, authorized reviewer evidence and any paid provider approval cannot be manufactured in code.

## Continuation message

Continue DentPrep from the latest verified main, GitHub issues and DENTPREP_NEXT_ACTIONS.md. Take the highest-priority safe task supported by the currently connected tools. Audit → implement → test → PR → QA → safe merge → verify live revision. Do not redo completed work or mark unverified work done. Save the result, exact next command and remaining Work-only steps back in the repository. No background continuation is implied.
