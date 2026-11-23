-- Additive cycle lineage and transactional save. Existing plans/tasks are preserved.
BEGIN;
CREATE TABLE IF NOT EXISTS public.study_task_carryovers (
  source_task_id uuid PRIMARY KEY REFERENCES public.study_tasks(id) ON DELETE CASCADE,
  target_task_id uuid NOT NULL UNIQUE REFERENCES public.study_tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK(source_task_id<>target_task_id)
);
CREATE INDEX IF NOT EXISTS study_task_carryovers_user_idx ON public.study_task_carryovers(user_id);
ALTER TABLE public.study_task_carryovers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.study_task_carryovers FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.study_task_carryovers TO authenticated;
DROP POLICY IF EXISTS "Own carryover lineage" ON public.study_task_carryovers;
CREATE POLICY "Own carryover lineage" ON public.study_task_carryovers FOR SELECT TO authenticated USING(user_id=auth.uid());

CREATE OR REPLACE FUNCTION public.pending_study_tasks()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  RETURN jsonb_build_object(
    'total_pending',(SELECT count(*) FROM public.study_tasks t WHERE t.user_id=auth.uid() AND NOT t.done AND NOT EXISTS(SELECT 1 FROM public.study_task_carryovers c WHERE c.source_task_id=t.id)),
    'tasks',(SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.task_date,t.id),'[]'::jsonb) FROM (
      SELECT t.id,t.plan_id,t.day_index,t.task_date,t.task_type,t.subject_id,t.lesson_id,t.title,t.minutes,t.done
      FROM public.study_tasks t WHERE t.user_id=auth.uid() AND NOT t.done
        AND t.task_type IN ('lesson','practice','revision','interview','case','test')
        AND NOT EXISTS(SELECT 1 FROM public.study_task_carryovers c WHERE c.source_task_id=t.id)
      ORDER BY t.task_date,t.id LIMIT 1000
    ) t)
  );
END; $$;

CREATE OR REPLACE FUNCTION public.save_study_cycle(p_id uuid,p_previous_plan_id uuid,p_plan jsonb,p_tasks jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE v_user uuid:=auth.uid(); v_current uuid; v_existing uuid; v_length int; v_hours numeric; v_start date;
  v_goals text[]; v_weak uuid[]; t jsonb; v_day int; v_minutes int; v_type text; v_title text;
  v_subject uuid; v_lesson uuid; v_source uuid; v_target uuid; src public.study_tasks;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF p_id IS NULL THEN RAISE EXCEPTION 'A retry-safe cycle id is required'; END IF;
  -- Serialize cycle saves for this account; a stale browser cannot supersede a newer cycle.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_user::text,0));
  SELECT user_id INTO v_existing FROM public.study_plans WHERE id=p_id;
  IF FOUND THEN
    IF v_existing<>v_user THEN RAISE EXCEPTION 'Cycle id unavailable'; END IF;
    RETURN p_id;
  END IF;
  SELECT id INTO v_current FROM public.study_plans WHERE user_id=v_user AND active ORDER BY created_at DESC,id DESC LIMIT 1 FOR UPDATE;
  IF v_current IS DISTINCT FROM p_previous_plan_id THEN RAISE EXCEPTION 'Your cycle changed. Refresh before saving another cycle'; END IF;
  v_length:=(p_plan->>'length_days')::int; v_hours:=(p_plan->>'daily_hours')::numeric; v_start:=(p_plan->>'start_date')::date;
  IF v_length IS NULL OR v_length NOT IN (7,15,30) OR v_hours IS NULL OR v_hours<0.5 OR v_hours>8 OR v_start IS NULL OR NOT (p_plan->>'start_date' ~ '^\d{4}-\d{2}-\d{2}$') THEN RAISE EXCEPTION 'Invalid cycle dates or workload'; END IF;
  IF jsonb_typeof(p_tasks) IS DISTINCT FROM 'array' OR jsonb_array_length(p_tasks) NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'Choose a bounded non-empty cycle'; END IF;
  IF jsonb_typeof(p_plan->'goals') IS DISTINCT FROM 'array' OR jsonb_array_length(p_plan->'goals') NOT BETWEEN 1 AND 4 THEN RAISE EXCEPTION 'Choose preparation goals'; END IF;
  SELECT array_agg(value) INTO v_goals FROM jsonb_array_elements_text(p_plan->'goals');
  IF EXISTS(SELECT 1 FROM unnest(v_goals) g WHERE g NOT IN ('interview','recruitment_test','clinical','english')) THEN RAISE EXCEPTION 'Invalid goal'; END IF;
  SELECT coalesce(array_agg(value::uuid),'{}'::uuid[]) INTO v_weak FROM jsonb_array_elements_text(coalesce(p_plan->'weak_subject_ids','[]'::jsonb));
  IF EXISTS(SELECT 1 FROM unnest(v_weak) w WHERE NOT EXISTS(SELECT 1 FROM public.subjects s WHERE s.id=w AND s.status='published')) THEN RAISE EXCEPTION 'A subject is no longer available'; END IF;
  INSERT INTO public.study_plans(id,user_id,length_days,daily_hours,start_date,goals,weak_subject_ids,active)
  VALUES(p_id,v_user,v_length,v_hours,v_start,v_goals,v_weak,false);
  FOR t IN SELECT value FROM jsonb_array_elements(p_tasks) LOOP
    v_day:=(t->>'day_index')::int; v_minutes:=(t->>'minutes')::int;
    v_type:=t->>'task_type'; v_title:=trim(t->>'title');
    v_subject:=nullif(t->>'subject_id','')::uuid; v_lesson:=nullif(t->>'lesson_id','')::uuid;
    v_source:=nullif(t->>'source_task_id','')::uuid;
    IF v_day IS NULL OR v_day<0 OR v_day>=v_length OR v_minutes IS NULL OR v_minutes<1 OR v_minutes>round(v_hours*60)
       OR (t->>'task_date')::date IS DISTINCT FROM v_start+v_day
       OR v_type IS NULL OR v_type NOT IN ('lesson','practice','revision','interview','case','test')
       OR v_title IS NULL OR char_length(v_title) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'Invalid scheduled task'; END IF;
    IF v_source IS NOT NULL THEN
      SELECT * INTO src FROM public.study_tasks WHERE id=v_source AND user_id=v_user AND NOT done FOR UPDATE;
      IF NOT FOUND OR EXISTS(SELECT 1 FROM public.study_task_carryovers c WHERE c.source_task_id=v_source) THEN RAISE EXCEPTION 'An unfinished task changed. Refresh the carry-forward queue'; END IF;
      IF src.task_type<>v_type OR src.minutes<>v_minutes OR src.lesson_id IS DISTINCT FROM v_lesson OR src.subject_id IS DISTINCT FROM v_subject THEN RAISE EXCEPTION 'Carry-forward task does not match its source'; END IF;
      v_title:='Continue: '||regexp_replace(src.title,'^(Continue: )+','');
    END IF;
    IF v_subject IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.subjects WHERE id=v_subject AND status='published') THEN RAISE EXCEPTION 'Subject unavailable'; END IF;
    IF v_type='lesson' AND v_lesson IS NULL THEN RAISE EXCEPTION 'A lesson task requires a published lesson'; END IF;
    IF v_lesson IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.lessons l JOIN public.subjects s ON s.id=l.subject_id WHERE l.id=v_lesson AND l.status='published' AND s.status='published' AND l.subject_id=v_subject) THEN RAISE EXCEPTION 'Lesson unavailable'; END IF;
    IF v_type IN ('practice','test') AND NOT EXISTS(SELECT 1 FROM public.questions q JOIN public.subjects s ON s.id=q.subject_id WHERE q.status='published' AND s.status='published' AND (v_subject IS NULL OR q.subject_id=v_subject)) THEN RAISE EXCEPTION 'No approved questions available'; END IF;
    IF v_type='case' AND NOT EXISTS(SELECT 1 FROM public.clinical_cases c JOIN public.subjects s ON s.id=c.subject_id WHERE c.status='published' AND s.status='published') THEN RAISE EXCEPTION 'No approved cases available'; END IF;
    INSERT INTO public.study_tasks(plan_id,user_id,day_index,task_date,task_type,subject_id,lesson_id,title,minutes,done)
    VALUES(p_id,v_user,v_day,v_start+v_day,v_type,v_subject,v_lesson,v_title,v_minutes,false) RETURNING id INTO v_target;
    IF v_source IS NOT NULL THEN INSERT INTO public.study_task_carryovers(source_task_id,target_task_id,user_id) VALUES(v_source,v_target,v_user); END IF;
  END LOOP;
  IF EXISTS(SELECT 1 FROM public.study_tasks WHERE plan_id=p_id GROUP BY day_index HAVING sum(minutes)>round(v_hours*60)) THEN RAISE EXCEPTION 'Cycle exceeds your daily study time'; END IF;
  UPDATE public.study_plans SET active=false WHERE user_id=v_user AND active;
  UPDATE public.study_plans SET active=true WHERE id=p_id;
  PERFORM public.log_activity();
  RETURN p_id;
END; $$;
REVOKE ALL ON FUNCTION public.pending_study_tasks(),public.save_study_cycle(uuid,uuid,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.pending_study_tasks(),public.save_study_cycle(uuid,uuid,jsonb,jsonb) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
