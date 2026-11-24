# Curriculum/source preparation evidence rollout

This is an admin-only preparation registry, not qualified clinical approval or a publication workflow. Each saved draft item can be mapped to a unit, topic, 1–20 distinct outcomes and 1–10 edition/section references. Editor-recorded citations/dates are unverified declarations. No whole-syllabus coverage or mastery percentage is inferred.

## Ordered release

1. Audit existing main/live and backend. Before-state metadata: `backups/2026-11-24-curriculum-evidence.json`. Registry absent, 22 RLS tables, three publication guards, 1 actual user, 0 actual admins, 15/30/15 clinical drafts and 0 published clinical items at audit. Do not infer administrator identity from the sole account.
2. Run install + verification in one outer transaction ending with ROLLBACK (strip file-level transaction delimiters). `verify-curriculum-evidence.sql` uses only synthetic nonclinical draft records and transaction-local test roles. It never disables a publication guard or publishes clinical fixtures. All test users/evidence/content roll back.
3. Require type/security/unit tests and the exact PR head's complete CI/mobile/desktop fixture checks. Apply `install-curriculum-evidence.sql` through the existing DentPrep Lovable SQL connector before merging compatible UI. Generated migration/schema files are untouched. No legacy data update or grant contract is required.
4. After the additive install, rerun rollback-only verification. Confirm actual counts/guards, no synthetic users, new table RLS and zero actual preparation records. Then safely merge and verify the exact deployed SHA/SSR/assets/routes/PWA, guest gates and anonymous permission denials. Record head/PR/merge/run/artifact and remaining acceptance gates.
5. Real-admin activation is separate: the audit found no admin. The owner must identify/authorize the intended DentPrep account; confirm its identity before any permanent role grant. Never automatically promote the sole user or a QA identity. No password/credential is needed in chat. Actual signed-in UI acceptance remains separate from native role tests and mocked browsers.

## Integrity boundaries

- Table reads require authenticated admin RLS. Anonymous/candidate RPC access is denied, raw fingerprint helper cannot be called directly, and all table writes/deletes are revoked from application roles.
- Saves append immutable revisions; per-item advisory/row locking and expected metadata version prevent stale overwrites. A stable request UUID makes an identical lost-response retry idempotent. Changed intent cannot reuse an old request UUID. No concurrent load test is inferred from sequential regressions.
- SHA-256 fingerprints include actual lesson/case teaching fields and every MCQ option/correct flag. Option-only changes make old metadata stale. Operational status/timestamp changes alone do not claim a new teaching version.
- Archived/unassigned content cannot receive new preparation. In-review status or complete citation fields never bypass the existing publication guards. No reviewer, credential-verification or approval flag can be supplied in preparation JSON.
- The editor shows missing/current-draft/stale state, explicit reload on conflict, and the latest 20 history records. All earlier records remain in the database. Focus refresh is disabled while editing; other content changes require explicitly closing the preparation panel.
- URLs are reference metadata only: the server does not fetch them or certify academic validity. Print citations may omit a URL/check date. No patient content, private credentials or clinical approval is seeded by this feature.

## Recovery and remaining work

An application rollback may leave the additive registry/functions installed. Keep all history, RLS and clinical guards; prefer a forward fix. Do not drop records, reset content, broaden permissions or remove publication protection for rollback. This metadata snapshot is not a full disaster-recovery backup.

Canonical curriculum topic/outcome identifiers, full source/coverage reconciliation, verified author/independent qualified reviewer identity, versioned approval, source freshness and clinical/learning validation remain separate work. The preparation fingerprint is a change detector, not a medical correctness certificate. No clinical item is published by this release.
