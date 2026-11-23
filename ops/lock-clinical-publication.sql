-- Safety interlock, not a clinical approval workflow. No content rows are changed.
-- Apply only after the rollback-only verification and PR/CI review.
BEGIN;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM public.lessons WHERE status='published')
     OR EXISTS(SELECT 1 FROM public.questions WHERE status='published')
     OR EXISTS(SELECT 1 FROM public.clinical_cases WHERE status='published') THEN
    RAISE EXCEPTION 'Published material exists: reconcile its accountable review before applying this interlock';
  END IF;
END $$;
CREATE OR REPLACE FUNCTION public.guard_clinical_publication()
RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
  IF NEW.status='published' THEN
    RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='Clinical publication is locked pending an independently verified, versioned professional review workflow';
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.guard_clinical_publication() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS guard_clinical_publication ON public.lessons;
CREATE TRIGGER guard_clinical_publication BEFORE INSERT OR UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.guard_clinical_publication();
DROP TRIGGER IF EXISTS guard_clinical_publication ON public.questions;
CREATE TRIGGER guard_clinical_publication BEFORE INSERT OR UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.guard_clinical_publication();
DROP TRIGGER IF EXISTS guard_clinical_publication ON public.clinical_cases;
CREATE TRIGGER guard_clinical_publication BEFORE INSERT OR UPDATE ON public.clinical_cases FOR EACH ROW EXECUTE FUNCTION public.guard_clinical_publication();
COMMIT;
