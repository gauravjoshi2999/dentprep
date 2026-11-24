# DentPrep — Private clinical feedback submissions

**Scope:** Existing DentPrep Lovable Cloud PostgreSQL backend and its original GitHub application. No changes to Bite, no second project, no reviewer certification by AI.

## What is functional

- On each official source-reading card, a signed-in candidate can open **Submit senior dentist feedback**.
- The candidate enters a consenting reviewer's *claimed* name, qualification, council registration, precise source corrections and a non-approving recommendation.
- Clicking **Submit feedback** writes an append-only record to `public.clinical_feedback_submissions` through the user's own Supabase session. Only the submitter or an existing verified admin role can read it through Data API RLS.
- The server fixes the state to **pending_verification**. The student receives a receipt only after the response confirms that state; errors do not claim success.
- The old copy-to-clipboard worksheet remains available for offline handover.
- Clinical release gates and `content_reviews` remain untouched.

## Why review does not immediately mean approval

This is a reported comment, **not** a signed specialist attestation, correct lesson/item version, source claim audit or completion of the 20 educational gates. Submitted opinions require independent verification of clinician registration, specialty and actual reviewer consent. `suitable_for_formal_review` is only a recommendation, not approval. No database trigger or client code may mutate lessons/cases/questions to published in this workflow.

## Deployment/verification

- SQL definition: `ops/clinical-feedback-intake.sql`. Applied to the actual DentPrep Lovable Cloud DB on 24 November 2026 using the connected project (15 subjects / 15 draft lessons checked immediately beforehand).
- Later database read-after-write verification attempt hit Lovable's free-plan MCP limit; **do not claim complete live RLS or authenticated browser verification** until it can be rechecked. Database action returned success, but repeat audit once limits reset.
- Code: `src/components/app/clinical-review-request.tsx`; synchronized row types in `src/integrations/supabase/types.ts`; source card passes stable source ID, subject slug, edition, URL.
- Required CI must pass TypeScript, clinical publication guards and mocked browser submission. Browser mock is not proof of real production submission.
- For release: verify authenticated INSERT returns a pending receipt, cross-user SELECT is denied, guest INSERT denied, UPDATE and DELETE denied, no publication status change, signout erases editable form.
- Never paste reviewer private identity, registration, patient details or auth tokens into GitHub issues/public PR comments.

## Future formal approval path

An authorized administrator must bind an independently verified specialty-appropriate reviewer to an immutable lesson/question/case version and signed claim-level decision, resolve corrections, run all 20 checks, and publish only through the existing safety-controlled release process. The first human sign-off is NOT obtained by the student clicking Submit.
