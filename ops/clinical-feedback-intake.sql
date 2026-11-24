-- DentPrep-only review intake. Never upgrades a lesson, question, case or source to approved.
-- Applied to the EXISTING DentPrep Lovable Cloud database, not the Bite Supabase project.
BEGIN;

CREATE TABLE IF NOT EXISTS public.clinical_feedback_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by uuid NOT NULL REFERENCES auth.users(id),
  client_submission_id uuid NOT NULL,
  source_id text NOT NULL CHECK (source_id ~ '^[a-z0-9][a-z0-9-]{2,79}$'),
  subject_slug text NOT NULL CHECK (subject_slug ~ '^[a-z0-9][a-z0-9-]{2,79}$'),
  source_title text NOT NULL CHECK (length(btrim(source_title)) BETWEEN 3 AND 240),
  source_edition text NOT NULL CHECK (length(btrim(source_edition)) BETWEEN 3 AND 200),
  source_url text NOT NULL CHECK (length(source_url) BETWEEN 12 AND 2048 AND left(source_url, 8) = 'https://'),
  claimed_reviewer_name text NOT NULL CHECK (length(btrim(claimed_reviewer_name)) BETWEEN 2 AND 160),
  claimed_qualification text NOT NULL CHECK (length(btrim(claimed_qualification)) BETWEEN 3 AND 160),
  claimed_registration text NOT NULL CHECK (length(btrim(claimed_registration)) BETWEEN 3 AND 160),
  recommendation text NOT NULL CHECK (recommendation IN ('changes_requested','needs_more_evidence','suitable_for_formal_review')),
  feedback text NOT NULL CHECK (length(btrim(feedback)) BETWEEN 20 AND 5000),
  status text NOT NULL DEFAULT 'pending_verification' CHECK (status = 'pending_verification'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT one_clinical_feedback_submission_per_request UNIQUE (submitted_by, client_submission_id)
);

COMMENT ON TABLE public.clinical_feedback_submissions IS
'Private, append-only claimed clinical feedback intake. A submission is NEVER a credential-verification, clinical sign-off or approval and NEVER triggers publication.';

CREATE INDEX IF NOT EXISTS clinical_feedback_submissions_author_date_idx
 ON public.clinical_feedback_submissions (submitted_by, created_at DESC);

ALTER TABLE public.clinical_feedback_submissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.clinical_feedback_submissions FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.clinical_feedback_submissions TO authenticated;
GRANT INSERT (
  submitted_by, client_submission_id, source_id, subject_slug, source_title,
  source_edition, source_url, claimed_reviewer_name, claimed_qualification,
  claimed_registration, recommendation, feedback
) ON TABLE public.clinical_feedback_submissions TO authenticated;

DROP POLICY IF EXISTS "Submitter can send unverified clinical feedback" ON public.clinical_feedback_submissions;
CREATE POLICY "Submitter can send unverified clinical feedback"
 ON public.clinical_feedback_submissions FOR INSERT TO authenticated
 WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND submitted_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Submitter or verified admin may read feedback" ON public.clinical_feedback_submissions;
CREATE POLICY "Submitter or verified admin may read feedback"
 ON public.clinical_feedback_submissions FOR SELECT TO authenticated
 USING (
   (SELECT auth.uid()) IS NOT NULL
   AND (
     submitted_by = (SELECT auth.uid())
     OR public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
   )
 );

COMMIT;
