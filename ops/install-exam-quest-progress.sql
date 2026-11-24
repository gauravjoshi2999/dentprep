-- Nonclinical exam-foundation practice. No clinical content, review, role or publication changes.
BEGIN;
CREATE TABLE IF NOT EXISTS public.exam_quest_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id text NOT NULL CHECK(course_id ~ '^[a-z0-9][a-z0-9-]{1,63}$'),
  content_version integer NOT NULL CHECK(content_version>0),
  next_step integer NOT NULL DEFAULT 0 CHECK(next_step BETWEEN 0 AND 100),
  first_correct integer NOT NULL DEFAULT 0 CHECK(first_correct BETWEEN 0 AND next_step),
  first_choices integer[] NOT NULL DEFAULT '{}',
  attempt_counts integer[] NOT NULL DEFAULT '{}',
  revision integer NOT NULL DEFAULT 0 CHECK(revision>=0),
  last_request_id uuid,
  last_step integer,
  last_choice integer,
  last_correct boolean,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,course_id,content_version)
);
ALTER TABLE public.exam_quest_progress ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.exam_quest_progress FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.exam_quest_progress TO authenticated;
DROP POLICY IF EXISTS "Learner reads own exam quest" ON public.exam_quest_progress;
CREATE POLICY "Learner reads own exam quest" ON public.exam_quest_progress FOR SELECT TO authenticated
  USING(user_id=(SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.exam_quest_state(p_course_id text,p_version integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.exam_quest_progress;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to save your study progress'; END IF;
 IF p_course_id IS DISTINCT FROM 'ph-frequency' OR p_version IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'Unsupported course version'; END IF;
 SELECT * INTO r FROM public.exam_quest_progress WHERE user_id=auth.uid() AND course_id=p_course_id AND content_version=p_version;
 IF NOT FOUND THEN RETURN jsonb_build_object('next_step',0,'first_correct',0,'first_choices','[]'::jsonb,'attempt_counts','[]'::jsonb,'revision',0,'completed_at',NULL,'last_result',NULL); END IF;
 RETURN jsonb_build_object('next_step',r.next_step,'first_correct',r.first_correct,'first_choices',to_jsonb(r.first_choices),
   'attempt_counts',to_jsonb(r.attempt_counts),'revision',r.revision,'completed_at',r.completed_at,
   'last_result',CASE WHEN r.last_request_id IS NULL THEN NULL ELSE jsonb_build_object('step',r.last_step,'choice',r.last_choice,'correct',r.last_correct) END);
END; $$;

CREATE OR REPLACE FUNCTION public.exam_quest_answer(p_course_id text,p_version integer,p_step integer,p_choice integer,p_expected_revision integer,p_request_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.exam_quest_progress; right_keys integer[]:=ARRAY[1,0,2,1,0,2,0,2]; is_first boolean; is_right boolean;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to save your study progress'; END IF;
 IF p_course_id IS DISTINCT FROM 'ph-frequency' OR p_version IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'Unsupported course version'; END IF;
 IF p_step IS NULL OR p_step NOT BETWEEN 0 AND 7 OR p_choice IS NULL OR p_choice NOT BETWEEN 0 AND 2 OR p_expected_revision IS NULL OR p_expected_revision<0 OR p_request_id IS NULL THEN RAISE EXCEPTION 'Invalid study answer'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text||':'||p_course_id||':'||p_version::text,0));
 SELECT * INTO r FROM public.exam_quest_progress WHERE user_id=auth.uid() AND course_id=p_course_id AND content_version=p_version FOR UPDATE;
 IF NOT FOUND THEN
  INSERT INTO public.exam_quest_progress(user_id,course_id,content_version) VALUES(auth.uid(),p_course_id,p_version) RETURNING * INTO r;
 END IF;
 IF r.last_request_id=p_request_id THEN
  IF r.last_step IS DISTINCT FROM p_step OR r.last_choice IS DISTINCT FROM p_choice THEN RAISE EXCEPTION 'Retry id belongs to a different answer'; END IF;
  RETURN public.exam_quest_state(p_course_id,p_version);
 END IF;
 IF r.revision<>p_expected_revision THEN RAISE EXCEPTION 'Study progress changed. Reload to continue'; END IF;
 IF r.next_step<>p_step THEN RAISE EXCEPTION 'Answer the current challenge before moving ahead'; END IF;
 IF coalesce(r.attempt_counts[p_step+1],0)>=100 THEN RAISE EXCEPTION 'Attempt limit reached for this challenge'; END IF;
 is_first:=coalesce(array_length(r.first_choices,1),0)=p_step;
 is_right:=p_choice=right_keys[p_step+1];
 IF is_first THEN
  r.first_choices:=array_append(r.first_choices,p_choice);
  r.attempt_counts:=array_append(r.attempt_counts,1);
 ELSE r.attempt_counts[p_step+1]:=r.attempt_counts[p_step+1]+1;
 END IF;
 IF is_right THEN
  r.next_step:=r.next_step+1;
  IF is_first THEN r.first_correct:=r.first_correct+1; END IF;
 END IF;
 UPDATE public.exam_quest_progress SET next_step=r.next_step,first_correct=r.first_correct,first_choices=r.first_choices,
  attempt_counts=r.attempt_counts,revision=r.revision+1,last_request_id=p_request_id,last_step=p_step,last_choice=p_choice,last_correct=is_right,
  completed_at=CASE WHEN r.next_step=8 THEN now() ELSE NULL END,updated_at=now()
 WHERE user_id=auth.uid() AND course_id=p_course_id AND content_version=p_version;
 IF r.next_step=8 THEN PERFORM public.log_activity(); END IF;
 RETURN public.exam_quest_state(p_course_id,p_version);
END; $$;
REVOKE ALL ON FUNCTION public.exam_quest_state(text,integer),public.exam_quest_answer(text,integer,integer,integer,integer,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.exam_quest_state(text,integer),public.exam_quest_answer(text,integer,integer,integer,integer,uuid) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
