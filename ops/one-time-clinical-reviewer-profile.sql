-- One named reviewer per signed-in DentPrep learner account.
-- This is a self-reported, reusable identity profile; never a verified clinical credential.
-- No publication or review-status updates occur through this table.
BEGIN;

CREATE TABLE IF NOT EXISTS public.clinical_reviewer_profiles (
  owner_user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  claimed_name text NOT NULL CHECK (length(btrim(claimed_name)) BETWEEN 2 AND 160),
  claimed_qualification text NOT NULL CHECK (length(btrim(claimed_qualification)) BETWEEN 3 AND 160),
  claimed_registration text NOT NULL CHECK (length(btrim(claimed_registration)) BETWEEN 3 AND 160),
  consent_confirmed boolean NOT NULL CHECK (consent_confirmed = true),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.clinical_reviewer_profiles IS
'Reusable single clinician self-reported details and sharing consent; cannot verify registration, approve content or sign releases.';
ALTER TABLE public.clinical_reviewer_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.clinical_reviewer_profiles FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.clinical_reviewer_profiles TO authenticated;
GRANT INSERT (owner_user_id,claimed_name,claimed_qualification,claimed_registration,consent_confirmed)
 ON TABLE public.clinical_reviewer_profiles TO authenticated;
GRANT UPDATE (claimed_name,claimed_qualification,claimed_registration,consent_confirmed)
 ON TABLE public.clinical_reviewer_profiles TO authenticated;

DROP POLICY IF EXISTS "Read own claimed reviewer profile" ON public.clinical_reviewer_profiles;
CREATE POLICY "Read own claimed reviewer profile"
 ON public.clinical_reviewer_profiles FOR SELECT TO authenticated
 USING (owner_user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Create own claimed reviewer profile" ON public.clinical_reviewer_profiles;
CREATE POLICY "Create own claimed reviewer profile"
 ON public.clinical_reviewer_profiles FOR INSERT TO authenticated
 WITH CHECK (owner_user_id = (SELECT auth.uid()) AND consent_confirmed = true);

DROP POLICY IF EXISTS "Update own claimed reviewer profile" ON public.clinical_reviewer_profiles;
CREATE POLICY "Update own claimed reviewer profile"
 ON public.clinical_reviewer_profiles FOR UPDATE TO authenticated
 USING (owner_user_id = (SELECT auth.uid()))
 WITH CHECK (owner_user_id = (SELECT auth.uid()) AND consent_confirmed = true);

COMMIT;
