-- Expand phase: additive RPCs only. The old client remains compatible until rollout.
-- Existing tables, records, scoring and generated migrations are unchanged.
BEGIN;
CREATE OR REPLACE FUNCTION public.candidate_attempt_details(p_attempt_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE a public.attempts; v_answers jsonb; v_reviews jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO a FROM public.attempts WHERE id=p_attempt_id AND user_id=auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Attempt not found'; END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'question_id',t.question_id,'selected_option_id',t.selected_option_id,
    'is_correct',CASE WHEN a.status='submitted' OR a.mode IN ('practice','daily','revision') THEN t.is_correct ELSE NULL END
  ) ORDER BY array_position(a.question_ids,t.question_id)),'[]'::jsonb) INTO v_answers
  FROM public.test_answers t WHERE t.attempt_id=a.id AND t.user_id=auth.uid();
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'question_id',q.id,'explanation',q.explanation,'source_note',q.source_note,
    'correct_option_id',(SELECT o.id FROM public.answer_options o WHERE o.question_id=q.id AND o.is_correct LIMIT 1)
  ) ORDER BY array_position(a.question_ids,q.id)),'[]'::jsonb) INTO v_reviews
  FROM public.questions q JOIN public.subjects s ON s.id=q.subject_id
  WHERE q.id=ANY(a.question_ids) AND q.status='published' AND s.status='published'
    AND (a.status='submitted' OR (a.mode IN ('practice','daily','revision') AND EXISTS(
      SELECT 1 FROM public.test_answers t WHERE t.attempt_id=a.id AND t.user_id=auth.uid() AND t.question_id=q.id
    )));
  RETURN jsonb_build_object('answers',v_answers,'reviews',v_reviews);
END; $$;

CREATE OR REPLACE FUNCTION public.candidate_answer_history()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  RETURN (SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.answered_at DESC),'[]'::jsonb) FROM (
    SELECT t.question_id,t.is_correct,t.answered_at,t.attempt_id FROM public.test_answers t
    JOIN public.attempts a ON a.id=t.attempt_id AND a.user_id=t.user_id
    WHERE t.user_id=auth.uid() AND a.status='submitted' ORDER BY t.answered_at DESC LIMIT 1000
  ) t);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_questions()
RETURNS SETOF public.questions LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN QUERY SELECT * FROM public.questions ORDER BY created_at DESC;
END; $$;

REVOKE ALL ON FUNCTION public.candidate_attempt_details(uuid),public.candidate_answer_history(),public.admin_questions() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.candidate_attempt_details(uuid),public.candidate_answer_history(),public.admin_questions() TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
