# Source-led study: founder override and first chapter

## Latest instruction — 24 November 2026

The founder explicitly asks to remove the doctor-review step from the student flow and build actual Codédex-style subject learning for **UPSC Dental Surgeon preparation**. This overrides older instructions that left every student screen waiting for a doctor or required the learner to collect a review. Do not restore those forms, repeated pending banners or a blanket block on nonclinical exam fundamentals. Do not portray AI as an MDS, invent specialist approval or mark old clinical drafts approved.

## Delivered scope

The first chapter is **Public Health Dentistry — Disease frequency: prevalence and incidence**, at `/start?course=ph-frequency`. Four short English lessons lead to four distinct application questions (eight checks total). They cover standardized surveys, matching denominators, point prevalence and new cases/incidence proportion. All numbers are original fictional exercises, not Indian population statistics. The source directory retains CDC/WHO organization/author, edition/year, section, URL, content version and check date. The archived methods text is identified as archived; it is not current treatment guidance.

The chapter teaches population measurement and arithmetic. It contains no drug doses, diagnosis, emergency management, operative technique or patient-specific treatment. It is an AI-assisted, primary-source-checked **exam-foundation chapter**, not an independently clinically approved release, an official UPSC question paper or the whole Public Health subject. It uses the existing starter player after refactoring it into `GuidedQuest`; it does not clone the app or introduce a second clinical question-bank engine. Original clinical records and their three publication guards remain unchanged.

Dashboard and Practice lead to the available chapter. The Library shows its real availability and leaves the other 14 subjects as guided topic/source paths, without fake completed-course counts. Doctor-feedback UI is unmounted from reading cards; archived components/private feedback/profile records stay intact. The starter's doctor-waiting question becomes a source/version-check question. Source metadata and honest AI attribution remain visible.

## Saved practice and verification

`exam_quest_progress` is an additive private practice ledger, separate from clinical exam attempts. RLS and owned RPCs isolate accounts. The server grades one current question per request, preserves the first answer and retry count, requires a current revision, rejects skipped steps and unsupported versions, and handles a lost-response retry with the same request id. A corrected answer advances the chapter but does not inflate the first-attempt result. Completion logs only the existing daily activity. Reviewing a completed chapter does not rewrite its first score. Guests can study without an account; guest progress is session-only.

Install/verify through the existing DentPrep Lovable SQL connector using `ops/install-exam-quest-progress.sql` and `ops/verify-exam-quest-progress.sql`. The DDL was first tested inside an outer rollback transaction, then installed and rechecked. Native tests use two synthetic accounts and roll back every fixture. No real student result is seeded. Generated backend types/migrations are not edited; the client uses the existing thin RPC boundary.

`check:content` now also checks foundation provenance/scope, exact source metadata, original single-key questions and all option rationales, calculation results, fresh-stem distinction, server-key agreement and immutable published versions. This is structural/numeric QA plus recorded AI source comparison, not a medical-accuracy certificate. Browser fixtures exercise wrong-answer explanations, cloud checkpoint resume, immutable first scoring and lost-response retries. Production verification additionally completes the full chapter as a public guest in fresh mobile/desktop browsers and requires the expected 7/8 first-attempt result after one deliberate wrong answer. This does not prove actual private-account or physical-phone acceptance.

## Twenty educational checks: honest applicability

| Check | First chapter evidence / limit |
| --- | --- |
| E01 | Four named measurement outcomes only; full subject and 15-group curriculum remain incomplete. |
| E02 | Six institutional references with locators/version/date; no fabricated textbook page or source. |
| E03 | Source pages reopened; dates retained, including the archived 2012 methods text. No claim that old material is a current treatment protocol. |
| E04 | No clinical sign-off claimed. This bounded nonclinical arithmetic/methods chapter does not impersonate a qualified reviewer. |
| E05 | One keyed answer, distinct options and every option rationale; arithmetic and server keys tested. No UPSC-level discrimination claim. |
| E06 | Patient-specific treatment, drugs, operative and emergency instructions are outside this chapter. |
| E07 | No teaching anatomy/clinical illustration is included. |
| E08 | Every checked wrong answer shows the concept explanation and selected-option rationale before retry. |
| E09 | Four distinct application prompts follow the four teaching questions. Saved progress records exposure/order. |
| E10 | Separate 1/7/30-day fresh retention pools are NOT implemented or claimed by this introductory chapter. |
| E11 | Confidence calibration is NOT implemented or claimed. |
| E12 | Statistical difficulty calibration is NOT implemented; introductory examples are labelled accordingly. |
| E13 | Explanations are authored from the listed source concepts; no live unsourced AI feedback service runs. |
| E14 | Short English and hints provided; actual learner comprehension/low-fluency pilot remains pending. |
| E15 | Original fictional dental-survey contexts require transfer to different numbers/measurement circumstances. |
| E16 | Deterministic answer-key scoring only; no AI viva/rubric-based clinical evaluation. |
| E17 | Report a question issue by course/version/unit; preserve original results and publish corrections as a new version. |
| E18 | Independent UPSC Dental Surgeon preparation, not an official syllabus, question paper, scheme or weightage. |
| E19 | Single-student scope; actual learner/physical-device educational acceptance remains pending. Fixtures and public guests are explicitly distinguished. |
| E20 | No graduation, complete subject, exam-readiness or clinical-competence claim. |

This table does not claim all 20 clinical academic gates PASS. Existing clinical-release policy and blocked original inventories are preserved. The chapter is an incremental nonclinical study release under the founder's latest instruction. Retention, calibrated difficulty and broader coverage remain follow-up work, not invented achievement.

## Continuation without repeated permission

1. Check latest main and the exact release receipt before changing code. Do not repeat the source audit, source-reading guides, this first chapter, saved progress or completed /start live gate.
2. Expand the next bounded BDS theory chapter from primary sources, with short notes, original single-best questions, every distractor rationale, fresh transfer, source versions and error correction. Progress subject by subject toward UPSC Dental Surgeon preparation; do not add unrelated portals, paid AI, APK polish or admin work.
3. Extend the active course catalogue, server course/version allowlist and keys together; the first RPC currently admits only PH v1. Preserve old content versions and personal first-attempt history. Add separate fresh 1/7/30-day retrieval and useful progress integration before claiming retained mastery.
4. Keep existing 60 clinical template drafts/private answer keys, backend data, auth/RLS, Issue #27 and medical protections safe. Do not silently relabel high-risk procedural guidance as nonclinical to publish it or fabricate medical approval. No real reviewer availability is assumed and the founder should not be asked to recruit one to use these foundational chapters.

Exact current PR/head/merge, full CI, native evidence, deployment receipt and remaining limits belong in the final acceptance comment on the PR and OPEN Issue #27. Source files cannot predict their own eventual commit SHA. Normal ChatGPT can continue source research/content preparation and available connector work without paid services or background-work promises.
