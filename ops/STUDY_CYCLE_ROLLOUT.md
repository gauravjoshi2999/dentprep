# Renewable study cycle rollout

SOURCE: Q&A Q004/Q051/Q054/Q057 and CODE. This is a personal schedule, not a verified UPSC deadline or evidence of clinical mastery. No exam date is inferred.

1. Snapshot grants/constraints and counts. `backups/2026-11-23-study-cycles.json` contains metadata only: before state 1 user, 1 plan, 30 tasks; no lineage table. Do not export user transcripts or task content for release evidence.
2. Dry run install + contract + verification in one outer transaction ending in ROLLBACK. Remove their individual BEGIN/COMMIT/ROLLBACK statements when composing that single transaction. `verify-study-cycles.sql` creates only synthetic nonclinical accounts/tasks. It does not publish any medical fixture or disable the publication guard.
3. Apply `install-study-cycles.sql` through the existing DentPrep Lovable SQL connector. This expands the current database with an own-read RLS lineage table and two owned RPCs. The old client remains compatible. Do not create another backend or edit generated schema files.
4. Merge the tested UI only after CI, and verify the exact compatible production revision, assets/routes/PWA and required release tests. Until this passes, keep legacy schedule write permissions.
5. Apply `enforce-study-cycles.sql`: remove direct scheduling writes (including column grants) and retain only own RLS-protected SELECT and `UPDATE(done,done_at)` for checkboxes. Run `verify-study-cycles.sql` again; its fixture rows all roll back. Confirm user/plan/task counts are unchanged and lineage is empty before any actual learner renewal.
6. Record PR/head/merge, CI/release run and artifact, live origin/SHA, expand and contract results in the completion ledger/next actions. SQL and mocked browser evidence do not establish real-account or physical-device acceptance.

## Persistence and retry contract

`save_study_cycle` locks per user with a transaction advisory lock, checks the expected active plan, validates dates, goals, published content and daily workload, and inserts tasks plus carry-forward lineage atomically. A stable retry id returns the same owned cycle after a lost response. Reusing another user's id is rejected. A stale browser cannot supersede a newer cycle; a failed task leaves no partial schedule or deactivated current plan. There is no claim of concurrent load testing from sequential SQL fixtures.

The original tasks and `done_at` are preserved. A source is continued once; the unresolved target can continue in a later cycle. The queue considers the oldest 1,000 rows first and reports the total. Deferred, unavailable or over-budget rows remain in the queue/history. Existing history is never deleted by renewal. The UI offers read-only history with incremental older-cycle loading.

Only published learning content is scheduled; with no approved clinical pool the plan uses goal review/general communication. No automatic clinical publication, mastery claim, official cutoff or invented deadline.

## Recovery

Before the permission contract, an application rollback can leave the additive table/functions installed; no existing rows were rewritten. After the contract prefer a forward UI fix. If an authorized operational rollback to the old client is necessary, restore only its required INSERT/UPDATE scheduling grants using the recorded metadata and existing owner RLS; document the temporary reduction in validation. Do not grant anonymous writes, TRUNCATE, REFERENCES or TRIGGER for recovery. Do not drop lineage or historical cycles, reset data, disable the clinical guard or expose server secrets.

Native rollback-only QA covers 7/15/30 save, long-gap restart, carry once, original completion, own-user isolation, idempotent retry, stale request rejection, workload overflow, missing lessons, atomic failure and completion writes. Unit tests cover packing/deduplication/deferred work/withdrawn lessons/unknown pools. CI browser fixtures cover renewal, completion, history and reload on mobile/desktop. Real account/device and full diagnostic/adaptive/prerequisite mastery remain separate pending gates.
