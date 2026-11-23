-- Existing RLS already denies candidate score/answer inserts/updates. Narrow grants too.
-- Preserve owned SELECT and existing owned attempt deletion; scoring stays in trusted RPCs.
BEGIN;
REVOKE INSERT,UPDATE,TRUNCATE,REFERENCES,TRIGGER ON public.attempts,public.test_answers FROM PUBLIC,anon,authenticated;
REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON public.revision_schedule FROM PUBLIC,anon,authenticated;
DO $$ DECLARE t text; cols text; BEGIN
  FOREACH t IN ARRAY ARRAY['attempts','test_answers','revision_schedule'] LOOP
    SELECT string_agg(format('%I',a.attname),',') INTO cols FROM pg_attribute a
    WHERE a.attrelid=format('public.%I',t)::regclass AND a.attnum>0 AND NOT a.attisdropped;
    EXECUTE format('REVOKE INSERT(%s),UPDATE(%s) ON public.%I FROM PUBLIC,anon,authenticated',cols,cols,t);
  END LOOP;
END $$;
ALTER FUNCTION public.submit_attempt(uuid) SET search_path=pg_catalog,public;
NOTIFY pgrst,'reload schema';
COMMIT;
