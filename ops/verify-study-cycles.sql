-- Synthetic, nonclinical fixtures only. All accounts, plans and tasks roll back.
BEGIN;
INSERT INTO auth.users(id,email,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
VALUES('a3000000-0000-4000-8000-000000000001','dentprep-cycle-a@example.test',now(),now(),'{}','{}'),
      ('a3000000-0000-4000-8000-000000000002','dentprep-cycle-b@example.test',now(),now(),'{}','{}');
SET LOCAL ROLE anon;
DO $$ DECLARE denied boolean:=false; BEGIN
  BEGIN PERFORM public.pending_study_tasks(); EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Anonymous pending-task RPC allowed'; END IF;
  denied:=false;
  BEGIN PERFORM public.save_study_cycle(gen_random_uuid(),NULL,'{}','[]'); EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Anonymous cycle save allowed'; END IF;
END $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"a3000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
SELECT set_config('request.jwt.claim.sub','a3000000-0000-4000-8000-000000000001',true);
DO $$ DECLARE first_id uuid:='b3000000-0000-4000-8000-000000000001'; next_id uuid:='b3000000-0000-4000-8000-000000000002';
  third_id uuid:='b3000000-0000-4000-8000-000000000003'; settings jsonb; task_list jsonb; completed_id uuid; source_id uuid; d jsonb; denied boolean; BEGIN
  settings:='{"length_days":7,"daily_hours":0.5,"start_date":"2026-01-01","goals":["interview"],"weak_subject_ids":[]}'::jsonb;
  SELECT jsonb_agg(jsonb_build_object('day_index',i,'task_date',date '2026-01-01'+i,'task_type','interview','title','QA communication routine','minutes',15)) INTO task_list FROM generate_series(0,6)i;
  IF public.save_study_cycle(first_id,NULL,settings,task_list)<>first_id THEN RAISE EXCEPTION 'Initial cycle not saved'; END IF;
  SELECT id INTO completed_id FROM public.study_tasks WHERE plan_id=first_id AND day_index=0;
  UPDATE public.study_tasks SET done=true,done_at='2026-01-01T09:00:00Z' WHERE id=completed_id;
  PERFORM set_config('dentprep.qa.completed',completed_id::text,true);
  d:=public.pending_study_tasks();
  IF (d->>'total_pending')::int<>6 OR jsonb_array_length(d->'tasks')<>6 THEN RAISE EXCEPTION 'Completed task present in queue'; END IF;
  SELECT id INTO source_id FROM public.study_tasks WHERE plan_id=first_id AND day_index=1;
  PERFORM set_config('dentprep.qa.source',source_id::text,true);
  settings:=jsonb_set(jsonb_set(settings,'{length_days}','15'),'{start_date}','"2026-06-01"');
  SELECT jsonb_agg(jsonb_build_object('day_index',(t->>'day_index')::int-1,'task_date',date '2026-06-01'+(t->>'day_index')::int-1,'task_type',t->>'task_type','title',t->>'title','minutes',(t->>'minutes')::int,'source_task_id',t->>'id')) INTO task_list FROM jsonb_array_elements(d->'tasks')t;
  SELECT task_list||jsonb_agg(jsonb_build_object('day_index',i,'task_date',date '2026-06-01'+i,'task_type','interview','title','QA fresh communication','minutes',15)) INTO task_list FROM generate_series(6,14)i;
  PERFORM public.save_study_cycle(next_id,first_id,settings,task_list);
  IF (SELECT count(*) FROM public.study_task_carryovers)<>6 THEN RAISE EXCEPTION 'Missing carryover lineage'; END IF;
  IF (SELECT count(*) FROM public.study_tasks WHERE plan_id=first_id)<>7 OR NOT EXISTS(SELECT 1 FROM public.study_tasks WHERE id=completed_id AND done AND done_at='2026-01-01T09:00:00Z') THEN RAISE EXCEPTION 'Original completion history changed'; END IF;
  IF EXISTS(SELECT 1 FROM public.study_tasks WHERE plan_id=next_id AND done) THEN RAISE EXCEPTION 'Copied task marked complete'; END IF;
  IF EXISTS(SELECT 1 FROM public.study_plans WHERE id=first_id AND active) OR NOT EXISTS(SELECT 1 FROM public.study_plans WHERE id=next_id AND active) THEN RAISE EXCEPTION 'Cycle activation not atomic'; END IF;
  IF (public.pending_study_tasks()->>'total_pending')::int<>15 THEN RAISE EXCEPTION 'Source tasks duplicated in unresolved queue'; END IF;
  -- A lost HTTP response must not create extra plans, tasks or lineage on retry.
  PERFORM public.save_study_cycle(next_id,first_id,settings,task_list);
  IF (SELECT count(*) FROM public.study_plans)<>2 OR (SELECT count(*) FROM public.study_tasks)<>22 OR (SELECT count(*) FROM public.study_task_carryovers)<>6 THEN RAISE EXCEPTION 'Retry duplicated history'; END IF;
  denied:=false;
  BEGIN PERFORM public.save_study_cycle(gen_random_uuid(),first_id,settings,task_list); EXCEPTION WHEN raise_exception THEN denied:=SQLERRM LIKE '%cycle changed%'; END;
  IF NOT denied THEN RAISE EXCEPTION 'Stale browser replaced current cycle'; END IF;
  denied:=false;
  BEGIN PERFORM public.save_study_cycle(gen_random_uuid(),next_id,settings,task_list); EXCEPTION WHEN raise_exception THEN denied:=SQLERRM LIKE '%unfinished task changed%'; END;
  IF NOT denied THEN RAISE EXCEPTION 'Source continued twice'; END IF;
  denied:=false;
  BEGIN PERFORM public.save_study_cycle(gen_random_uuid(),next_id,settings,'[{"day_index":0,"task_date":"2026-06-01","task_type":"interview","title":"QA budget A","minutes":20},{"day_index":0,"task_date":"2026-06-01","task_type":"interview","title":"QA budget B","minutes":20}]'); EXCEPTION WHEN raise_exception THEN denied:=SQLERRM LIKE '%daily study time%'; END;
  IF NOT denied THEN RAISE EXCEPTION 'Daily workload overflow accepted'; END IF;
  denied:=false;
  BEGIN PERFORM public.save_study_cycle(gen_random_uuid(),next_id,settings,'[{"day_index":0,"task_date":"2026-06-01","task_type":"lesson","title":"QA missing material","minutes":15}]'); EXCEPTION WHEN raise_exception THEN denied:=SQLERRM LIKE '%published lesson%'; END;
  IF NOT denied THEN RAISE EXCEPTION 'Unavailable lesson scheduled'; END IF;
  IF (SELECT count(*) FROM public.study_plans)<>2 OR (SELECT count(*) FROM public.study_tasks)<>22 OR NOT EXISTS(SELECT 1 FROM public.study_plans WHERE id=next_id AND active) THEN RAISE EXCEPTION 'Failed save left partial plan or deactivated current plan'; END IF;
  settings:=jsonb_set(jsonb_set(settings,'{length_days}','30'),'{start_date}','"2026-07-01"');
  SELECT jsonb_agg(jsonb_build_object('day_index',i,'task_date',date '2026-07-01'+i,'task_type','interview','title','QA later cycle','minutes',15)) INTO task_list FROM generate_series(0,29)i;
  PERFORM public.save_study_cycle(third_id,next_id,settings,task_list);
  IF (SELECT count(*) FROM public.study_plans WHERE active)<>1 OR NOT EXISTS(SELECT 1 FROM public.study_plans WHERE id=third_id AND length_days=30 AND active) THEN RAISE EXCEPTION '30-day continuation unavailable'; END IF;
  denied:=false;
  BEGIN INSERT INTO public.study_plans(user_id,length_days,start_date) VALUES(auth.uid(),7,current_date); EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Direct plan insert bypass allowed'; END IF;
  denied:=false;
  BEGIN UPDATE public.study_tasks SET minutes=999 WHERE id=completed_id; EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Task scheduling changed outside validated RPC'; END IF;
  -- Completion checkboxes remain writable after scheduling privileges are narrowed.
  UPDATE public.study_tasks SET done=true,done_at=now() WHERE plan_id=third_id AND day_index=0;
  IF NOT EXISTS(SELECT 1 FROM public.study_tasks WHERE plan_id=third_id AND day_index=0 AND done) THEN RAISE EXCEPTION 'Completion update broken'; END IF;
END $$;
SELECT set_config('request.jwt.claims','{"sub":"a3000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
SELECT set_config('request.jwt.claim.sub','a3000000-0000-4000-8000-000000000002',true);
DO $$ DECLARE denied boolean; settings jsonb:='{"length_days":7,"daily_hours":0.5,"start_date":"2026-07-01","goals":["interview"],"weak_subject_ids":[]}'; BEGIN
  IF EXISTS(SELECT 1 FROM public.study_plans) OR EXISTS(SELECT 1 FROM public.study_tasks) OR EXISTS(SELECT 1 FROM public.study_task_carryovers) OR (public.pending_study_tasks()->>'total_pending')::int<>0 THEN RAISE EXCEPTION 'Other user history visible'; END IF;
  denied:=false;
  BEGIN PERFORM public.save_study_cycle('b3000000-0000-4000-8000-000000000003',NULL,settings,'[]'); EXCEPTION WHEN raise_exception THEN denied:=SQLERRM LIKE '%unavailable%'; END;
  IF NOT denied THEN RAISE EXCEPTION 'Other user cycle id accepted'; END IF;
  denied:=false;
  BEGIN PERFORM public.save_study_cycle(gen_random_uuid(),NULL,settings,jsonb_build_array(jsonb_build_object('day_index',0,'task_date','2026-07-01','task_type','interview','title','QA stolen task','minutes',15,'source_task_id',current_setting('dentprep.qa.source')))); EXCEPTION WHEN raise_exception THEN denied:=SQLERRM LIKE '%unfinished task changed%'; END;
  IF NOT denied OR EXISTS(SELECT 1 FROM public.study_plans) THEN RAISE EXCEPTION 'Other user carryover accepted or partial plan left'; END IF;
END $$;
ROLLBACK;
SELECT 'PASS: anonymous/cross-user isolation; 7/15/30-day saves; completion history; carry once; retry idempotency; stale browser rejection; daily budget; missing lessons; atomic failure; scheduling grants; checkbox updates. All fixtures rolled back. Advisory lock present; no concurrent load test claimed.' AS verification;
