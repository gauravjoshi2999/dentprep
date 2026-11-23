# Clinical publication interlock

SOURCE: Q014/Q066, blueprint S45, E04; existing admin ALL policies do not prove medical approval. All existing clinical items were draft at audit. `content_reviews` is a status audit, not an independently verified professional review record.

The interlock rejects any INSERT or UPDATE whose resulting status is `published` on lessons, questions or clinical cases, including trusted admin/API writes. It does not infer approval from a free-text note, review timestamp or status-change row. Subject outlines, official notices and private learner data are unaffected. Draft, in-review, archive and restore remain available.

This deliberately keeps publication **unavailable** until an accountable author/independent qualified reviewer, source/version/freshness and approval workflow can replace it. It is not that workflow and does not make any academic gate PASS. No professional identity or medical sign-off is invented.

Before applying: inspect the current counts/RLS; stop if any content is already published; review the script; test installation and `verify-clinical-publication.sql` inside a single transaction ending in ROLLBACK. Then apply the installation and run the rollback-only verification again. The scripts change functions/triggers only; no real content, accounts or progress are rewritten. Capture before/after draft/auth counts and trigger names in the ledger.

An application rollback can leave the guard active because existing editors never publish. Keep the guard during recovery. Remove/replace it only as part of an explicitly reviewed, qualified-approval implementation; do not disable it merely to populate the learning library. The older exam-access fixture script creates synthetic published questions, so run it before this interlock, or use an isolated database owner transaction with the guard disabled only for fixture setup and re-enabled before role tests, ending in ROLLBACK. Never add a QA flag/bypass to the production guard.
