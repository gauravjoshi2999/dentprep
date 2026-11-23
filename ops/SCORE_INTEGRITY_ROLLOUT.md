# Native scoring integrity and least privilege

Existing candidate RLS already has no INSERT/UPDATE policy for attempts or answers. The audit did **not** establish a direct score-forgery bypass. This task narrows redundant table/column grants as defense in depth, removes direct revision-result mutation, and pins the existing `submit_attempt` search path to `pg_catalog,public`. Scoring arithmetic and function bodies are unchanged. Owned SELECT and existing owned attempt deletion are preserved.

The application already uses `start_attempt`, `record_answer` and `submit_attempt`; these owned security-definer RPCs continue writing the protected tables. The plan and progress views only read revision records. Never replace them with browser-computed authoritative scores or official UPSC marks.

## Rollout

1. Preserve the read-only grant/policy/count snapshot `backups/2026-11-23-score-integrity.json`. Existing before-state has 0 attempts, 0 answers and 0 revision rows; no learner row is exported.
2. Dry run `enforce-score-integrity.sql` followed by `verify-score-integrity.sql` in one outer ROLLBACK transaction (strip file-level transaction delimiters). Require native PASS, all synthetic accounts absent afterwards and publication guard still enabled.
3. Commit/PR/type/security/build/CI/review. Apply the narrow grants only after a tested compatible release; rerun native rollback verification and record real counts/live SHA in the ledger.
4. Never mark T26/T27 full real-user/cross-device acceptance from this SQL regression. Record the technical arithmetic/revision gate separately. Clinical/item validity and score-version/regrading provenance remain separate missing work.

## Synthetic fixture controls

The scoring function accepts published questions only. The verification file therefore takes an owner-only uncommitted transaction lock, temporarily disables the question publication trigger for three **nonclinical synthetic** setup rows, immediately re-enables it, and only then switches to candidate roles. The entire transaction ends with ROLLBACK. These rows cannot become visible to another transaction, no medical instruction is created, and no durable guard bypass is introduced. Never commit the fixture transaction, apply it as a migration, change real content status or expose a QA bypass RPC. Failures must roll back and stop the rollout.

The native checks cover all correct/wrong/skipped, mixed denominator 33.33%, empty/duplicate rejection, changed exam answer, immutable submitted answers, repeat-submit idempotency, next-day wrong-answer queue, successful revision interval advance, original result preservation and cross-user score/history isolation. No concurrent stress, official scoring equivalence, medical approval or physical-device test is claimed.

## Recovery

Leave RLS enabled and answer-column confidentiality/publication guards intact. Prefer a forward fix. If an operational rollback of these grants is authorized, use the snapshot and restore only required authenticated permissions, never anonymous writes/TRUNCATE/REFERENCES/TRIGGER. An application rollback is already compatible with these restrictions because the supported client uses RPCs. No data reset or score rewrite is required.
