-- Run in a transaction and roll back every synthetic QA row. No real users or content are changed.
BEGIN;
INSERT INTO auth.users(id,email,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
VALUES('a0000000-0000-4000-8000-000000000001','dentprep-qa-a@example.test',now(),now(),'{}','{}'),
      ('a0000000-0000-4000-8000-000000000002','dentprep-qa-b@example.test',now(),now(),'{}','{}');
INSERT INTO public.user_roles(user_id,role) VALUES('a0000000-0000-4000-8000-000000000002','admin');
INSERT INTO public.subjects(id,slug,name,short_name,status) VALUES('b0000000-0000-4000-8000-000000000001','qa-non-clinical-fixture','QA study routine','QA','published');
INSERT INTO public.questions(id,subject_id,stem,explanation,status) VALUES('c0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','QA: choose the regular study slot','QA explanation','published');
INSERT INTO public.answer_options(id,question_id,label,body,is_correct,sort_order)
SELECT ('d0000000-0000-4000-8000-00000000000'||i)::uuid,'c0000000-0000-4000-8000-000000000001',chr(64+i),'QA option '||i,i=1,i-1 FROM generate_series(1,4)i;
INSERT INTO public.attempts(id,user_id,mode,title,question_ids,total,timed,time_limit_sec,started_at)
VALUES('e0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','custom','QA expired',ARRAY['c0000000-0000-4000-8000-000000000001']::uuid[],1,true,1,now()-interval '1 minute');
DO $$ BEGIN
  IF has_function_privilege('anon','public.start_attempt(text,text,uuid,uuid[],integer)','EXECUTE') THEN RAISE EXCEPTION 'Anonymous RPC execute is still allowed'; END IF;
  IF has_column_privilege('authenticated','public.answer_options','is_correct','SELECT') THEN RAISE EXCEPTION 'Answer keys remain public'; END IF;
END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
SELECT set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000001',true);
DO $$
DECLARE v_id uuid; v_wrong uuid; v_result jsonb; blocked boolean; rows_changed int;
BEGIN
  IF (SELECT count(*) FROM public.profiles) <> 1 THEN RAISE EXCEPTION 'Cross-user profiles visible'; END IF;
  IF public.has_role('a0000000-0000-4000-8000-000000000002','admin') THEN RAISE EXCEPTION 'Role enumeration allowed'; END IF;
  blocked := false;
  BEGIN INSERT INTO public.bookmarks(user_id,item_type,item_id) VALUES('a0000000-0000-4000-8000-000000000002','question','c0000000-0000-4000-8000-000000000001'); EXCEPTION WHEN insufficient_privilege THEN blocked := true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Cross-user bookmark write allowed'; END IF;
  UPDATE public.profiles SET full_name='QA prohibited edit' WHERE id='a0000000-0000-4000-8000-000000000002';
  GET DIAGNOSTICS rows_changed = ROW_COUNT;
  IF rows_changed <> 0 THEN RAISE EXCEPTION 'Cross-user profile update allowed'; END IF;
  blocked := false;
  BEGIN PERFORM is_correct FROM public.answer_options; EXCEPTION WHEN insufficient_privilege THEN blocked := true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Candidate can read answer keys'; END IF;
  IF (SELECT count(*) FROM public.answer_options WHERE question_id='c0000000-0000-4000-8000-000000000001') <> 4 THEN RAISE EXCEPTION 'Public option text unavailable'; END IF;
  blocked := false;
  BEGIN PERFORM public.admin_question_options('c0000000-0000-4000-8000-000000000001'); EXCEPTION WHEN raise_exception THEN blocked := true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Candidate can call admin API'; END IF;
  v_id := public.start_attempt('practice','QA practice',NULL,ARRAY['c0000000-0000-4000-8000-000000000001']::uuid[],0);
  v_result := public.record_answer(v_id,'c0000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000001');
  IF (v_result->>'is_correct')::boolean IS DISTINCT FROM true THEN RAISE EXCEPTION 'Correct answer not recognized'; END IF;
  blocked := false;
  BEGIN PERFORM public.record_answer(v_id,'c0000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000002'); EXCEPTION WHEN raise_exception THEN blocked := true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Practice answer can be rewritten'; END IF;
  v_result := public.submit_attempt(v_id);
  IF (v_result->>'score_pct')::numeric <> 100 THEN RAISE EXCEPTION 'Incorrect submitted score'; END IF;
  IF public.submit_attempt(v_id) <> v_result THEN RAISE EXCEPTION 'Submit is not idempotent'; END IF;
  blocked := false;
  BEGIN PERFORM public.record_answer(v_id,'c0000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000002'); EXCEPTION WHEN raise_exception THEN blocked := true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Submitted answer can be changed'; END IF;
  blocked := false;
  BEGIN DELETE FROM public.test_answers WHERE attempt_id=v_id; EXCEPTION WHEN insufficient_privilege THEN blocked := true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Scored answers can be deleted'; END IF;
  blocked := false;
  BEGIN PERFORM public.record_answer('e0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000001'); EXCEPTION WHEN raise_exception THEN blocked := true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Expired timed answer accepted'; END IF;
  v_wrong := public.start_attempt('practice','QA wrong',NULL,ARRAY['c0000000-0000-4000-8000-000000000001']::uuid[],0);
  PERFORM public.record_answer(v_wrong,'c0000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000002');
  v_result := public.submit_attempt(v_wrong);
  IF (v_result->>'score_pct')::numeric <> 0 OR NOT EXISTS(SELECT 1 FROM public.revision_schedule WHERE question_id='c0000000-0000-4000-8000-000000000001' AND last_result=false AND interval_days=1) THEN RAISE EXCEPTION 'Wrong-answer revision not scheduled'; END IF;
END $$;
SELECT set_config('request.jwt.claims','{"sub":"a0000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
SELECT set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000002',true);
DO $$
DECLARE v_new uuid; blocked boolean;
BEGIN
  IF (SELECT count(*) FROM public.attempts) <> 0 THEN RAISE EXCEPTION 'Another user can read attempts'; END IF;
  IF (SELECT count(*) FROM public.admin_question_options('c0000000-0000-4000-8000-000000000001')) <> 4 THEN RAISE EXCEPTION 'Admin option review failed'; END IF;
  v_new := public.admin_save_question('{"subject_id":"b0000000-0000-4000-8000-000000000001","stem":"QA draft","explanation":"QA explanation","status":"draft"}', '[{"body":"QA A","is_correct":true},{"body":"QA B","is_correct":false},{"body":"QA C","is_correct":false},{"body":"QA D","is_correct":false}]');
  IF NOT EXISTS(SELECT 1 FROM public.questions WHERE id=v_new AND status='draft') THEN RAISE EXCEPTION 'Admin draft not saved'; END IF;
  blocked := false;
  BEGIN PERFORM public.admin_save_question('{"subject_id":"b0000000-0000-4000-8000-000000000001","stem":"QA blocked","explanation":"QA","status":"published"}', '[{"body":"A","is_correct":true},{"body":"B","is_correct":false},{"body":"C","is_correct":false},{"body":"D","is_correct":false}]'); EXCEPTION WHEN raise_exception THEN blocked := true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Editor can publish clinical questions'; END IF;
END $$;
ROLLBACK;
SELECT 'PASS: ownership, RPC grants, answer-key access, scoring, repeat submission, timer expiry, revision and admin draft controls; all QA rows rolled back' AS verification;
