# Clinical review log

SOURCE: verified backend audit, 23 November 2026. Fifteen lessons, thirty original questions and fifteen clinical cases remain draft. Published clinical count: zero.

| Content | Author evidence | Independent qualified reviewer | Sources/version/freshness | Publication |
| --- | --- | --- | --- | --- |
| 15 draft lessons | Not independently verified | Not supplied | Not academically validated | BLOCKED |
| 30 draft MCQs + 120 options | Not independently verified | Not supplied | Single-best-answer/source review pending | BLOCKED |
| 15 draft clinical cases | Not independently verified | Not supplied | Stage/red-flag/rationale review pending | BLOCKED |

Existing `content_reviews` stores status changes with a reviewer ID. It does not capture professional credentials, independent author/reviewer approval, source version or signed clinical validation. Do not call those rows expert approval. The screenshot's OLP/leukoplakia example is a design reference, not a reviewed question to republish.

Future review entries require entity/version, author, independent authorized qualified reviewer, credential verification, source edition/section, reviewed/due dates, ambiguity/safety/rights checks, decision, audit reference and affected-attempt correction. No such approval is asserted by this session.

Technical safety checkpoint: PR #19 / `a6ea77536aade2356a051f0b6c089aa012fcd586` added three DB publication guards. Live regression rejected admin INSERT/UPDATE to published across all content tables, including with a synthetic status log. Draft workflows remain usable. This is a lock pending a future verified review process, not qualified clinical approval. Draft counts remain 15 / 30 / 15 and all test rows rolled back.
