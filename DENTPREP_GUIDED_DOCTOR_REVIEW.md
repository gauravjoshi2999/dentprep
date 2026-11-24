# DentPrep — One Doctor, One-Time Profile, Guided Feedback

Date: 24 November 2026

## Intended user flow

1. First visit to any official publisher reference in the Study Library: click **Doctor guided feedback**.
2. The page states exactly which **subject, official document, edition and source URL** is being reviewed. **This is a review of the primary-source reading, not of a clinical lesson, MCQ, case, treatment plan or textbook chapter that is not displayed.**
3. For the first review only: with the doctor's consent, enter the **claimed** name, MDS specialty and dental council registration, and save the reviewer profile. This profile is private to the signed-in DentPrep account and automatically reused on all other reference cards.
4. Answer each of **10 common + 2 source-specific** guided questions: choose **ठीक है / सुधार जरूरी / प्रमाण स्पष्ट नहीं / लागू नहीं**. If any answer is not ठीक है, enter at least an eight-character explanation. Record exact source page/section. No question can remain unanswered.
5. Confirm that this specific source has been reviewed and submit. A receipt is shown only when the backend returns `pending_verification`. Editing the one-time profile does not overwrite historical reviewer details captured on already-submitted feedback.
6. Repeating the workflow for the next reference shows the same saved doctor profile and new source-specific questions. Reviewer registration is never asked again until the user explicitly edits that profile.

## Never infer clinical certification

- This is self-reported feedback submitted using the learner's authenticated session and the claimed doctor's permission. It is **not** independently authenticated reviewer authorship, registered specialty verification or a signature.
- A source-reading review does not verify a specific DentPrep draft item. Before any lesson/MCQ/case release, the relevant qualified reviewer must inspect the **exact immutable content version**, its claim-level evidence, questions, options, rationales, learning validity and all 20 academic gates, and make a verified decision.
- Legacy content publish locks are unchanged. No answer, even all `ठीक है`, promotes content from draft to published.
- The single profile can be updated if a different doctor is used; reviewers are **not globally shared across students**.

## Security and audit

`ops/one-time-clinical-reviewer-profile.sql` adds an RLS-protected table scoped to the current signed-in user. Only that user can read/insert/update their one profile; no anon access, no delete rights for authenticated users, and no publication privileges.

The existing `clinical_feedback_submissions` table retains its immutable status `pending_verification`, source ID, edition and a historical copy of claimed reviewer details. Complete 12-question responses with source locators are serialized to the existing private feedback column (max 5,000 chars), preserving original DB and admin report compatibility.

**Live database evidence:** SQL applied to the original DentPrep Lovable database on 24 Nov 2026. RLS flags for reviewer and submissions both true; anon cannot select or insert reviewer profile; authenticated roles cannot update/delete submissions or delete reviewer profile. No live user profile or review was created by the test query. Remaining: verify authenticated insert/read and cross-account policy through accepted tests, CI and latest production release receipt; do not call browser mocks production proof.

No patient identifiers, registration numbers or signed credentials should appear in public GitHub discussion or tickets.
