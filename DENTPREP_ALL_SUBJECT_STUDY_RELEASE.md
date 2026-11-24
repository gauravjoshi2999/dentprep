# All-subject academic study release — 24 November 2026

## Concrete problem and scope

The library previously displayed 15 subject checklists but only Public Health had an actual chapter. The replacement is a static, versioned source catalogue with working study and question flows for **all 15 existing subject groups**. It contains **60 short teaching sections, 120 chapter questions and 30 separate next-day recall questions**. This is an introductory pack, not the full BDS curriculum or a verified official UPSC syllabus/weightage map.

The latest founder instruction authorizes source-researched academic education without a student doctor-review recruitment/form gate. No MDS identity, dental professional approval, independent clinical review, official exam status or medical accuracy percentage is claimed. The original 15 lesson/30 MCQ/15 clinical-case templates, private answers, reviewer history, RLS and three native clinical publication triggers are retained. No drug doses, operative techniques, patient-specific instructions or emergency treatment protocols are introduced by these academic chapters.

## Actual study flows

- Every subject opens one chapter: read four concepts, answer their teaching checks, then apply them in four different questions.
- Guest chapters are immediately usable; signed-in learners get server-owned, ordered checkpoints. Guest answers stay in the session.
- Incorrect selections show a source-linked concept explanation and option rationale. The complete set of option rationales is available in the feedback.
- A correction never rewrites the first choice or inflates the first-attempt result. Lost-response retries use the same request ID; stale revisions and skipped steps are rejected.
- All chapters can be bookmarked; saved chapters appear in Saved learning. Their checkpoint, first-correct numerator/attempted denominator, original mistakes and recall due status appear in Progress. Dashboard continues the next incomplete chapter.
- A next-day check has two different questions, with its own content version, score and checkpoint. The database requires the parent chapter’s saved completion plus 24 elapsed hours. Guests and early requests never receive questions through the study UI. One small recall result does not establish mastery.
- Existing 7/15/30-day renewable plans schedule the actual chapter concepts. Old completed/carried task history is preserved. A planning checkmark is not an answered-question result.
- Public availability metadata contains only IDs, versions and hashes. It supports withdrawal for guest and signed-in flows; the app rechecks every 60 seconds. Withdrawn catalogue versions and their dependent recall cannot be opened through the native RPCs. Previous progress stays stored.

## Source work and integrity

Each teaching and practice unit links to named sources with title, author/organization, edition, year or explicit undated disclosure, section, relevant HTTPS URL, source-check date and source-content version. Research inspected publisher/government bodies including OpenStax, NIH/NIDCR/NCI, FDA, CDC, WHO, IDA, SDCEP, ADA, AAE, AAP/EFP, ACP, AAO, AAPD, DGHS and UPSC. Foreign professional guidance is labelled in context and is not represented as Indian law.

Examples of corrections during research: no universal lesion-size cutoff was introduced where systems differ; publication-year-unstated web references retain `year:null`; RCUK dental preparedness is labelled updated May 2020, while first-aid/anaphylaxis vocabulary references the 2025 guidance; periodontal stage/grade also links to Sanz/Tonetti EFP 2019 guidance; primary dentition counts are reference counts, not universal individual findings.

The content checker checks all subjects, source metadata, original stems, keyed options, explanations, arithmetic, first PH v1 hash, immutable versions, registry keys, parent dependencies and browser/server hashes. It cannot certify factual correctness or professional review. **All 20 original educational checks receive an explicit scoped assessment in `content/study-release.v1.json`, including partial/unvalidated items. They are not falsely marked universally passed.**

Published PH v1 is unchanged: canonical SHA-256 `6e815ac3a46cc9e620c3976b7d78bafedd5c9cba1944e453058214b31ecad177`.

## Backend application and QA

Through the existing DentPrep Lovable database connector, with no AI generation credits:

1. `ops/install-study-catalog.sql` adds the private immutable catalogue, owned bookmarks, metadata-only availability, general checkpoint grading and private overview. Existing RPC signatures and PH state remain compatible.
2. `node scripts/generate-study-registry.mjs` regenerates the browser manifest and `ops/seed-study-catalog.sql` from the exact JSON. Seed retries do not overwrite existing or withdrawn versions. A changed hash under an existing identity is rejected.
3. `ops/verify-study-catalog.sql` runs synthetic fixtures in an outer rollback: all 30 packages, grading, corrections, idempotency, collisions, ordering, version binding, cross-owner isolation, direct-write/anonymous denial, server-time lock, independent recall scores, bookmark CRUD, immutable catalogue and withdrawal. It never creates real learner results.
4. Recheck RLS, grants, guard counts, existing draft/source-preparation records, QA-user absence and progress/bookmark aggregate counts after application. Store receipts in `ops/qa/`.

GitHub CI exercises mobile and desktop for all 15 complete guest chapters plus saved checkpoint/retry, bookmark/mistake report, due/early recall and withdrawal fixtures. The protected production diagnostic separately completes every guest chapter in real mobile and desktop Chromium and checks the exact deployed Git revision. Test fixtures are software QA, not a real learner account or a physical phone acceptance/pilot.

## Honest remaining work

- Extend each introductory subject into a detailed curriculum with explicit essential-outcome coverage; the existing 90 candidate outcomes are not an approved UPSC syllabus.
- Author additional difficult, clinically nuanced and quantitatively varied exam questions. Current questions are foundational, not a full recruitment mock-test bank.
- Author fresh 7/30-day retention sets. Planning reminders alone are not scored delayed mastery checks.
- Empirical difficulty/discrimination, confidence calibration, language fairness and a consenting educational learning pilot remain unvalidated. No competence/readiness score is shown.
- Legacy patient-management/dose/procedural material and illustrations remain unpublished under existing safeguards; source research is not qualified clinical approval.
- Actual signed-in production learner testing and physical-device checks have not been performed in this release unless a later acceptance receipt explicitly establishes them. Do not bypass the previous account/hosting authority denial.
- No new paid model calls, APK build, voice platform, marketplace, Bite changes or duplicate backend/project.

Final exact commit, PR, native receipts, CI run IDs and deployment artifact evidence belong in the acceptance comment on this PR and Issue #27; do not invent future SHAs in this document.
