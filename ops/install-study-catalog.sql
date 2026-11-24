-- Additive source-checked academic study registry. Does not publish legacy clinical drafts.
-- Run install-exam-quest-progress.sql first on a fresh database. Keep its public RPC signatures.
BEGIN;
CREATE TABLE IF NOT EXISTS public.exam_study_catalog (
 course_id text NOT NULL CHECK(course_id ~ '^[a-z0-9][a-z0-9-]{1,63}$'),
 content_version integer NOT NULL CHECK(content_version>0),
 subject_slug text NOT NULL,
 content_sha256 text NOT NULL CHECK(content_sha256 ~ '^[a-f0-9]{64}$'),
 unit_ids text[] NOT NULL,
 answer_key integer[] NOT NULL CHECK(cardinality(answer_key) BETWEEN 1 AND 100 AND 0<=ALL(answer_key) AND 2>=ALL(answer_key)),
 required_course_id text,
 delay_hours integer NOT NULL DEFAULT 0 CHECK(delay_hours IN(0,24)),
 active boolean NOT NULL DEFAULT true,
 PRIMARY KEY(course_id,content_version),
 CHECK(cardinality(unit_ids)=cardinality(answer_key)),
 CHECK((required_course_id IS NULL AND delay_hours=0) OR (required_course_id IS NOT NULL AND delay_hours=24))
);
ALTER TABLE public.exam_study_catalog ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.exam_study_catalog FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.protect_exam_study_version() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Withdraw a study version; preserve its history'; END IF;
 IF (to_jsonb(NEW)-'active') IS DISTINCT FROM (to_jsonb(OLD)-'active') THEN
  RAISE EXCEPTION 'Published study versions are immutable; register a new version';
 END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS protect_exam_study_version ON public.exam_study_catalog;
CREATE TRIGGER protect_exam_study_version BEFORE UPDATE OR DELETE ON public.exam_study_catalog FOR EACH ROW EXECUTE FUNCTION public.protect_exam_study_version();
REVOKE ALL ON FUNCTION public.protect_exam_study_version() FROM PUBLIC,anon,authenticated;

CREATE TABLE IF NOT EXISTS public.exam_study_bookmarks (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 course_id text NOT NULL,
 content_version integer NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,course_id,content_version),
 FOREIGN KEY(course_id,content_version) REFERENCES public.exam_study_catalog(course_id,content_version)
);
ALTER TABLE public.exam_study_bookmarks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.exam_study_bookmarks FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.exam_study_bookmarks TO authenticated;
DROP POLICY IF EXISTS "Own source-study bookmarks" ON public.exam_study_bookmarks;
CREATE POLICY "Own source-study bookmarks" ON public.exam_study_bookmarks FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));
CREATE OR REPLACE FUNCTION public.exam_study_bookmark(p_course_id text,p_version integer,p_value boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to bookmark chapters';END IF;
 IF p_value IS NULL OR NOT EXISTS(SELECT 1 FROM public.exam_study_catalog WHERE course_id=p_course_id AND content_version=p_version AND active AND required_course_id IS NULL) THEN RAISE EXCEPTION 'Unknown or withdrawn source chapter';END IF;
 IF p_value THEN INSERT INTO public.exam_study_bookmarks(user_id,course_id,content_version) VALUES(auth.uid(),p_course_id,p_version) ON CONFLICT DO NOTHING;
 ELSE DELETE FROM public.exam_study_bookmarks WHERE user_id=auth.uid() AND course_id=p_course_id AND content_version=p_version; END IF;
 RETURN p_value;
END; $$;
REVOKE ALL ON FUNCTION public.exam_study_bookmark(text,integer,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.exam_study_bookmark(text,integer,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.exam_study_access(p_course_id text,p_version integer)
RETURNS public.exam_study_catalog LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.exam_study_catalog; parent_completed timestamptz;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to save your study progress'; END IF;
 SELECT * INTO c FROM public.exam_study_catalog WHERE course_id=p_course_id AND content_version=p_version AND active;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unsupported or withdrawn course version'; END IF;
 IF c.required_course_id IS NOT NULL THEN
  IF NOT EXISTS(SELECT 1 FROM public.exam_study_catalog WHERE course_id=c.required_course_id AND content_version=p_version AND active) THEN
   RAISE EXCEPTION 'The source chapter has been withdrawn';
  END IF;
  SELECT completed_at INTO parent_completed FROM public.exam_quest_progress WHERE user_id=auth.uid() AND course_id=c.required_course_id AND content_version=p_version;
  IF parent_completed IS NULL THEN RAISE EXCEPTION 'Complete and save the source chapter before next-day recall'; END IF;
  IF now()<parent_completed+make_interval(hours=>c.delay_hours) THEN
   RAISE EXCEPTION 'Next-day recall unlocks at %',parent_completed+make_interval(hours=>c.delay_hours);
  END IF;
 END IF;
 RETURN c;
END; $$;
REVOKE ALL ON FUNCTION public.exam_study_access(text,integer) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.exam_quest_state(p_course_id text,p_version integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.exam_quest_progress; c public.exam_study_catalog;
BEGIN
 c:=public.exam_study_access(p_course_id,p_version);
 SELECT * INTO r FROM public.exam_quest_progress WHERE user_id=auth.uid() AND course_id=p_course_id AND content_version=p_version;
 IF NOT FOUND THEN RETURN jsonb_build_object('total_steps',cardinality(c.answer_key),'content_sha256',c.content_sha256,'next_step',0,'first_correct',0,'first_choices','[]'::jsonb,'attempt_counts','[]'::jsonb,'revision',0,'completed_at',NULL,'last_result',NULL); END IF;
 RETURN jsonb_build_object('total_steps',cardinality(c.answer_key),'content_sha256',c.content_sha256,'next_step',r.next_step,'first_correct',r.first_correct,'first_choices',to_jsonb(r.first_choices),
  'attempt_counts',to_jsonb(r.attempt_counts),'revision',r.revision,'completed_at',r.completed_at,
  'last_result',CASE WHEN r.last_request_id IS NULL THEN NULL ELSE jsonb_build_object('step',r.last_step,'choice',r.last_choice,'correct',r.last_correct) END);
END; $$;

CREATE OR REPLACE FUNCTION public.exam_quest_answer(p_course_id text,p_version integer,p_step integer,p_choice integer,p_expected_revision integer,p_request_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.exam_quest_progress; c public.exam_study_catalog; is_first boolean; is_right boolean; total integer;
BEGIN
 c:=public.exam_study_access(p_course_id,p_version); total:=cardinality(c.answer_key);
 IF p_step IS NULL OR p_step NOT BETWEEN 0 AND total-1 OR p_choice IS NULL OR p_choice NOT BETWEEN 0 AND 2 OR p_expected_revision IS NULL OR p_expected_revision<0 OR p_request_id IS NULL THEN RAISE EXCEPTION 'Invalid study answer'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text||':'||p_course_id||':'||p_version::text,0));
 SELECT * INTO r FROM public.exam_quest_progress WHERE user_id=auth.uid() AND course_id=p_course_id AND content_version=p_version FOR UPDATE;
 IF NOT FOUND THEN INSERT INTO public.exam_quest_progress(user_id,course_id,content_version) VALUES(auth.uid(),p_course_id,p_version) RETURNING * INTO r; END IF;
 IF r.last_request_id=p_request_id THEN
  IF r.last_step IS DISTINCT FROM p_step OR r.last_choice IS DISTINCT FROM p_choice THEN RAISE EXCEPTION 'Retry id belongs to a different answer'; END IF;
  RETURN public.exam_quest_state(p_course_id,p_version);
 END IF;
 IF r.revision<>p_expected_revision THEN RAISE EXCEPTION 'Study progress changed. Reload to continue'; END IF;
 IF r.next_step<>p_step THEN RAISE EXCEPTION 'Answer the current challenge before moving ahead'; END IF;
 IF coalesce(r.attempt_counts[p_step+1],0)>=100 THEN RAISE EXCEPTION 'Attempt limit reached for this challenge'; END IF;
 is_first:=coalesce(cardinality(r.first_choices),0)=p_step;
 is_right:=p_choice=c.answer_key[p_step+1];
 IF is_first THEN r.first_choices:=array_append(r.first_choices,p_choice);r.attempt_counts:=array_append(r.attempt_counts,1);
 ELSE r.attempt_counts[p_step+1]:=r.attempt_counts[p_step+1]+1; END IF;
 IF is_right THEN r.next_step:=r.next_step+1;IF is_first THEN r.first_correct:=r.first_correct+1;END IF;END IF;
 UPDATE public.exam_quest_progress SET next_step=r.next_step,first_correct=r.first_correct,first_choices=r.first_choices,attempt_counts=r.attempt_counts,
  revision=r.revision+1,last_request_id=p_request_id,last_step=p_step,last_choice=p_choice,last_correct=is_right,
  completed_at=CASE WHEN r.next_step=total THEN now() ELSE NULL END,updated_at=now()
 WHERE user_id=auth.uid() AND course_id=p_course_id AND content_version=p_version;
 IF r.next_step=total THEN PERFORM public.log_activity(); END IF;
 RETURN public.exam_quest_state(p_course_id,p_version);
END; $$;

-- Public metadata only: allows withdrawal for guests without exposing learner records or keys.
CREATE OR REPLACE FUNCTION public.exam_study_availability()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('course_id',c.course_id,'content_version',c.content_version,'content_sha256',c.content_sha256) ORDER BY c.course_id),'[]'::jsonb)
 FROM public.exam_study_catalog c WHERE c.active AND (c.required_course_id IS NULL OR EXISTS(SELECT 1 FROM public.exam_study_catalog p WHERE p.course_id=c.required_course_id AND p.content_version=c.content_version AND p.active));
$$;
REVOKE ALL ON FUNCTION public.exam_study_availability() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.exam_study_availability() TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.exam_quest_overview()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to see your study progress'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('course_id',c.course_id,'content_version',c.content_version,'content_sha256',c.content_sha256,
  'total_steps',cardinality(c.answer_key),'next_step',coalesce(r.next_step,0),'first_correct',coalesce(r.first_correct,0),
  'first_choices',coalesce(to_jsonb(r.first_choices),'[]'::jsonb),'attempt_counts',coalesce(to_jsonb(r.attempt_counts),'[]'::jsonb),
  'completed_at',r.completed_at,'required_course_id',c.required_course_id,
  'bookmarked',EXISTS(SELECT 1 FROM public.exam_study_bookmarks b WHERE b.user_id=auth.uid() AND b.course_id=c.course_id AND b.content_version=c.content_version),
  'available_at',CASE WHEN c.required_course_id IS NOT NULL AND parent.completed_at IS NOT NULL THEN parent.completed_at+make_interval(hours=>c.delay_hours) ELSE NULL END,
  'available',c.required_course_id IS NULL OR (parent.completed_at IS NOT NULL AND now()>=parent.completed_at+make_interval(hours=>c.delay_hours))
 ) ORDER BY c.course_id),'[]'::jsonb) INTO result
 FROM public.exam_study_catalog c
 LEFT JOIN public.exam_quest_progress r ON r.user_id=auth.uid() AND r.course_id=c.course_id AND r.content_version=c.content_version
 LEFT JOIN public.exam_quest_progress parent ON parent.user_id=auth.uid() AND parent.course_id=c.required_course_id AND parent.content_version=c.content_version
 WHERE c.active AND (c.required_course_id IS NULL OR EXISTS(SELECT 1 FROM public.exam_study_catalog pc WHERE pc.course_id=c.required_course_id AND pc.content_version=c.content_version AND pc.active));
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.exam_quest_state(text,integer),public.exam_quest_answer(text,integer,integer,integer,integer,uuid),public.exam_quest_overview() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.exam_quest_state(text,integer),public.exam_quest_answer(text,integer,integer,integer,integer,uuid),public.exam_quest_overview() TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
