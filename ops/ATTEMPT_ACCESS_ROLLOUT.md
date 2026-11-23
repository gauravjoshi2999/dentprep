# Exam confidentiality rollout

SOURCE: CODE + verified DB grants; Q034/T25 in the master specification.

The previous safe option projection hid `answer_options.is_correct`, but published `questions.explanation`/`source_note` and own `test_answers.is_correct` were still directly selectable. The saved-question screen also read explanations without an answered attempt. No clinical questions were published at audit time, but this would compromise exam confidentiality when the bank is released.

## Data-safe expand / contract

1. Review the pre-change metadata backup in `backups/2026-11-23-attempt-access.json`. It contains function/grant definitions only, no users, credentials or clinical content export. No table or data migration is required.
2. Dry-run `install-attempt-access.sql` + `enforce-attempt-access.sql` + `verify-attempt-access.sql` inside one outer transaction ending in ROLLBACK. Remove their standalone transaction wrappers for that combined dry run. The verification creates synthetic non-clinical fixtures only.
3. Once PR/CI is accepted, apply **install** only. It adds three self/admin-checked RPCs, revokes default anonymous/PUBLIC execute and leaves existing column permissions untouched. Older clients remain compatible.
4. Merge/deploy the compatible client. Verify exact live SHA, required tests, Worker package and live route/asset checks. The client uses explicit safe question fields, private phase-aware review, submitted-only analytics and trusted admin reads.
5. Apply **enforce** only after that compatible release is live. It revokes direct explanation/source-note/correctness access and grants only safe columns. Run the verification again and confirm clinical draft counts and auth-user count are unchanged.

`candidate_attempt_details` is owner-only, including against admin cross-user reads. Practice feedback survives reload only for the answered question; exam review remains empty and correctness null before submission. Withdrawn content's explanations are withheld. `candidate_answer_history` includes only the caller's submitted attempts (current historical limit 1,000 answers remains documented; this is not a validated mastery estimate). `admin_questions` is separately role-checked. Scoring, timers and submit idempotency stay in existing trusted RPCs.

## Recovery

Before contract, an application rollback can use the previous client because old grants remain. After contract, prefer a forward client fix using the new RPCs. Do not automatically restore broad answer-key grants for an older client. Any deliberate permission rollback must be reviewed against the captured metadata and this known exposure. None of these scripts deletes or rewrites learner records. Fixtures must end in ROLLBACK; never publish them as learning material.

The publication-signoff gap is a separate P0 task; this change does not certify clinical material or implement qualified review.
