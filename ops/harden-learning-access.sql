-- Forward-only hardening for the existing DentPrep Lovable database.
-- Applied through Lovable query_database; generated Drizzle migrations remain unchanged.
BEGIN;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
  SELECT _user_id IS NOT NULL AND _user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.start_attempt(p_mode text, p_title text, p_subject_id uuid, p_question_ids uuid[], p_time_limit_sec int)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE v_id uuid; v_ids uuid[]; v_limit int := NULLIF(p_time_limit_sec, 0);
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF p_mode IS NULL OR p_mode NOT IN ('practice','daily','revision','custom','subject','mock') THEN RAISE EXCEPTION 'Invalid practice mode'; END IF;
  IF v_limit IS NOT NULL AND (v_limit < 1 OR v_limit > 10800) THEN RAISE EXCEPTION 'Invalid time limit'; END IF;
  IF p_question_ids IS NULL OR cardinality(p_question_ids) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Choose between 1 and 100 questions'; END IF;
  IF (SELECT count(DISTINCT id) FROM unnest(p_question_ids) id) <> cardinality(p_question_ids) THEN RAISE EXCEPTION 'Question ids must be unique and non-null'; END IF;
  SELECT array_agg(q.id ORDER BY array_position(p_question_ids, q.id)) INTO v_ids
  FROM public.questions q JOIN public.subjects s ON s.id = q.subject_id
  WHERE q.id = ANY(p_question_ids) AND q.status = 'published' AND s.status = 'published'
    AND (p_subject_id IS NULL OR q.subject_id = p_subject_id)
    AND (SELECT count(*) = 4 AND count(*) FILTER (WHERE o.is_correct) = 1 FROM public.answer_options o WHERE o.question_id = q.id);
  IF coalesce(cardinality(v_ids),0) <> cardinality(p_question_ids) THEN RAISE EXCEPTION 'Some questions are unavailable or have incomplete answer options'; END IF;
  INSERT INTO public.attempts(user_id,mode,title,subject_id,question_ids,total,timed,time_limit_sec)
  VALUES(auth.uid(),p_mode,left(coalesce(p_title,'Practice'),120),p_subject_id,v_ids,cardinality(v_ids),v_limit IS NOT NULL,v_limit)
  RETURNING id INTO v_id;
  PERFORM public.log_activity();
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.record_answer(p_attempt_id uuid, p_question_id uuid, p_option_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE a public.attempts; v_correct boolean; v_correct_id uuid; v_expl text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  -- Serialize answer writes with submit_attempt, so a submitted score cannot race a late answer.
  SELECT * INTO a FROM public.attempts WHERE id = p_attempt_id AND user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Attempt not found'; END IF;
  IF a.status <> 'in_progress' THEN RAISE EXCEPTION 'Attempt already submitted'; END IF;
  IF a.timed AND clock_timestamp() >= a.started_at + make_interval(secs => a.time_limit_sec) THEN RAISE EXCEPTION 'Time limit ended; submit this session'; END IF;
  IF p_question_id IS NULL OR NOT (p_question_id = ANY(a.question_ids)) THEN RAISE EXCEPTION 'Question not in this attempt'; END IF;
  IF a.mode IN ('practice','daily','revision') AND EXISTS(SELECT 1 FROM public.test_answers WHERE attempt_id = p_attempt_id AND question_id = p_question_id) THEN RAISE EXCEPTION 'Already answered'; END IF;
  SELECT o.is_correct INTO v_correct FROM public.answer_options o JOIN public.questions q ON q.id = o.question_id
  JOIN public.subjects s ON s.id = q.subject_id
  WHERE o.id = p_option_id AND o.question_id = p_question_id AND q.status = 'published' AND s.status = 'published';
  IF NOT FOUND THEN RAISE EXCEPTION 'Question or option is unavailable'; END IF;
  INSERT INTO public.test_answers(attempt_id,user_id,question_id,selected_option_id,is_correct)
  VALUES(p_attempt_id,auth.uid(),p_question_id,p_option_id,v_correct)
  ON CONFLICT(attempt_id,question_id) DO UPDATE SET selected_option_id = EXCLUDED.selected_option_id, is_correct = EXCLUDED.is_correct, answered_at = now();
  IF a.mode IN ('practice','daily','revision') THEN
    SELECT id INTO v_correct_id FROM public.answer_options WHERE question_id = p_question_id AND is_correct LIMIT 1;
    SELECT explanation INTO v_expl FROM public.questions WHERE id = p_question_id;
    RETURN jsonb_build_object('is_correct',v_correct,'correct_option_id',v_correct_id,'explanation',v_expl);
  END IF;
  RETURN jsonb_build_object('saved',true);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_question_options(p_question_id uuid)
RETURNS SETOF public.answer_options LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN QUERY SELECT * FROM public.answer_options WHERE question_id = p_question_id ORDER BY sort_order;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_save_question(p_question jsonb, p_options jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE v_id uuid; v_status public.content_status; o jsonb; v_index int := 0; v_option_id uuid; v_count int;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  v_id := coalesce((p_question->>'id')::uuid,gen_random_uuid());
  v_status := coalesce(p_question->>'status','draft')::public.content_status;
  IF v_status NOT IN ('draft','in_review') THEN RAISE EXCEPTION 'This editor cannot publish questions'; END IF;
  IF coalesce(length(trim(p_question->>'stem')),0) NOT BETWEEN 1 AND 1000 OR coalesce(length(trim(p_question->>'explanation')),0) NOT BETWEEN 1 AND 100000 THEN RAISE EXCEPTION 'Question and explanation are required'; END IF;
  IF jsonb_typeof(p_options) IS DISTINCT FROM 'array' OR jsonb_array_length(p_options) <> 4 THEN RAISE EXCEPTION 'Provide four options'; END IF;
  IF (SELECT count(*) FROM jsonb_array_elements(p_options) e WHERE (e->>'is_correct')::boolean) <> 1 THEN RAISE EXCEPTION 'Choose one correct option'; END IF;
  INSERT INTO public.questions(id,subject_id,stem,explanation,source_note,difficulty,status)
  VALUES(v_id,(p_question->>'subject_id')::uuid,trim(p_question->>'stem'),p_question->>'explanation',left(coalesce(p_question->>'source_note',''),15000),coalesce(p_question->>'difficulty','medium')::public.difficulty_level,'draft')
  ON CONFLICT(id) DO UPDATE SET subject_id=EXCLUDED.subject_id,stem=EXCLUDED.stem,explanation=EXCLUDED.explanation,source_note=EXCLUDED.source_note,difficulty=EXCLUDED.difficulty,status='draft';
  FOR o IN SELECT value FROM jsonb_array_elements(p_options) LOOP
    IF coalesce(length(trim(o->>'body')),0) NOT BETWEEN 1 AND 3000 THEN RAISE EXCEPTION 'All option texts are required'; END IF;
    v_option_id := coalesce((o->>'id')::uuid,gen_random_uuid());
    INSERT INTO public.answer_options(id,question_id,label,body,is_correct,sort_order)
    VALUES(v_option_id,v_id,chr(65+v_index),trim(o->>'body'),(o->>'is_correct')::boolean,v_index)
    ON CONFLICT(id) DO UPDATE SET label=EXCLUDED.label,body=EXCLUDED.body,is_correct=EXCLUDED.is_correct,sort_order=EXCLUDED.sort_order WHERE public.answer_options.question_id=v_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count <> 1 THEN RAISE EXCEPTION 'An option belongs to another question'; END IF;
    v_index := v_index + 1;
  END LOOP;
  IF (SELECT count(*) FROM public.answer_options WHERE question_id=v_id) <> 4 THEN RAISE EXCEPTION 'Existing question requires an option review'; END IF;
  UPDATE public.questions SET status=v_status WHERE id=v_id;
  RETURN v_id;
END; $$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid,public.app_role),public.start_attempt(text,text,uuid,uuid[],int),public.record_answer(uuid,uuid,uuid),public.submit_attempt(uuid),public.log_activity(),public.admin_usage_stats(),public.admin_question_options(uuid),public.admin_save_question(jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role),public.start_attempt(text,text,uuid,uuid[],int),public.record_answer(uuid,uuid,uuid),public.submit_attempt(uuid),public.log_activity(),public.admin_usage_stats(),public.admin_question_options(uuid),public.admin_save_question(jsonb,jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user(),public.log_status_change() FROM PUBLIC,anon,authenticated;
REVOKE DELETE ON public.test_answers FROM PUBLIC,anon,authenticated;
-- Candidates receive option text, never the correct-answer flag from the public table.
REVOKE SELECT ON public.answer_options FROM PUBLIC,anon,authenticated;
GRANT SELECT(id,question_id,label,body,sort_order) ON public.answer_options TO anon,authenticated;

DROP POLICY IF EXISTS "Sources readable" ON public.content_sources;
CREATE POLICY "Sources of published content" ON public.content_sources FOR SELECT TO anon,authenticated USING (
  (entity_type='subject' AND EXISTS(SELECT 1 FROM public.subjects s WHERE s.id=entity_id AND s.status='published')) OR
  (entity_type='lesson' AND EXISTS(SELECT 1 FROM public.lessons l WHERE l.id=entity_id AND l.status='published')) OR
  (entity_type='question' AND EXISTS(SELECT 1 FROM public.questions q WHERE q.id=entity_id AND q.status='published')) OR
  (entity_type='case' AND EXISTS(SELECT 1 FROM public.clinical_cases c WHERE c.id=entity_id AND c.status='published')) OR
  (entity_type='notice' AND EXISTS(SELECT 1 FROM public.recruitment_notices n WHERE n.id=entity_id AND n.status='published'))
);
NOTIFY pgrst, 'reload schema';
COMMIT;
