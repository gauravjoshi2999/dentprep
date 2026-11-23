-- Synthetic non-clinical fixtures, transaction-local roles, rollback on completion.
BEGIN;
INSERT INTO auth.users(id,email,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
VALUES('a1000000-0000-4000-8000-000000000001','dentprep-access-a@example.test',now(),now(),'{}','{}'),
      ('a1000000-0000-4000-8000-000000000002','dentprep-access-b@example.test',now(),now(),'{}','{}');
INSERT INTO public.user_roles(user_id,role) VALUES('a1000000-0000-4000-8000-000000000002','admin');
INSERT INTO public.subjects(id,slug,name,short_name,status) VALUES('b1000000-0000-4000-8000-000000000001','qa-access-routine','QA study routine','QA','published');
INSERT INTO public.questions(id,subject_id,stem,explanation,source_note,status)
SELECT ('c1000000-0000-4000-8000-00000000000'||i)::uuid,'b1000000-0000-4000-8000-000000000001','QA routine '||i,'QA reviewed-after-answer rationale '||i,'Synthetic non-clinical QA only','published' FROM generate_series(1,2)i;
INSERT INTO public.answer_options(id,question_id,label,body,is_correct,sort_order)
SELECT ('d1000000-0000-4000-8000-0000000000'||q||i)::uuid,('c1000000-0000-4000-8000-00000000000'||q)::uuid,chr(64+i),'QA option '||i,i=1,i-1 FROM generate_series(1,2)q CROSS JOIN generate_series(1,4)i;
SET LOCAL ROLE anon;
DO $$ DECLARE denied boolean; BEGIN
  denied:=false; BEGIN PERFORM explanation FROM public.questions; EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Anonymous explanation access allowed'; END IF;
  denied:=false; BEGIN PERFORM public.candidate_answer_history(); EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Anonymous history RPC allowed'; END IF;
END $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"a1000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
SELECT set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000001',true);
DO $$ DECLARE v_id uuid; d jsonb; denied boolean; BEGIN
  denied:=false; BEGIN PERFORM explanation FROM public.questions; EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Candidate explanation access allowed'; END IF;
  denied:=false; BEGIN PERFORM is_correct FROM public.test_answers; EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Candidate correctness-column access allowed'; END IF;
  denied:=false; BEGIN PERFORM public.admin_questions(); EXCEPTION WHEN raise_exception THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Candidate can read admin question keys'; END IF;
  v_id:=public.start_attempt('custom','QA confidential',NULL,ARRAY['c1000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000002']::uuid[],0);
  PERFORM set_config('dentprep.qa.attempt',v_id::text,true);
  IF public.record_answer(v_id,'c1000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000011') <> '{"saved":true}'::jsonb THEN RAISE EXCEPTION 'Exam write returned feedback'; END IF;
  d:=public.candidate_attempt_details(v_id);
  IF jsonb_array_length(d->'reviews')<>0 OR (d->'answers'->0->>'is_correct') IS NOT NULL THEN RAISE EXCEPTION 'Exam review/correctness exposed early'; END IF;
  IF jsonb_array_length(public.candidate_answer_history())<>0 THEN RAISE EXCEPTION 'Active answers leaked into analytics'; END IF;
END $$;
SELECT set_config('request.jwt.claims','{"sub":"a1000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
SELECT set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000002',true);
DO $$ DECLARE denied boolean; BEGIN
  denied:=false; BEGIN PERFORM public.candidate_attempt_details(current_setting('dentprep.qa.attempt')::uuid); EXCEPTION WHEN raise_exception THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Cross-user attempt RPC allowed, even to admin'; END IF;
  IF jsonb_array_length(public.candidate_answer_history())<>0 THEN RAISE EXCEPTION 'Cross-user history visible'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.admin_questions() WHERE id='c1000000-0000-4000-8000-000000000001' AND explanation='QA reviewed-after-answer rationale 1') THEN RAISE EXCEPTION 'Trusted admin read unavailable'; END IF;
END $$;
SELECT set_config('request.jwt.claims','{"sub":"a1000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
SELECT set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000001',true);
DO $$ DECLARE v_id uuid:=current_setting('dentprep.qa.attempt')::uuid; p_id uuid; d jsonb; score jsonb; BEGIN
  -- An exam answer can change before submit, without acting as a correctness oracle.
  PERFORM public.record_answer(v_id,'c1000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000012');
  d:=public.candidate_attempt_details(v_id);
  IF (d->'answers'->0->>'is_correct') IS NOT NULL OR jsonb_array_length(d->'reviews')<>0 THEN RAISE EXCEPTION 'Changed answer leaked correctness'; END IF;
  score:=public.submit_attempt(v_id);
  IF (score->>'score_pct')::numeric<>0 OR (score->>'total')::int<>2 OR (score->>'answered')::int<>1 THEN RAISE EXCEPTION 'Score arithmetic changed'; END IF;
  IF public.submit_attempt(v_id)<>score THEN RAISE EXCEPTION 'Repeat submit changed history'; END IF;
  d:=public.candidate_attempt_details(v_id);
  IF jsonb_array_length(d->'reviews')<>2 OR (d->'answers'->0->>'is_correct')::boolean IS DISTINCT FROM false THEN RAISE EXCEPTION 'Submitted review unavailable'; END IF;
  IF jsonb_array_length(public.candidate_answer_history())<>1 THEN RAISE EXCEPTION 'Submitted history missing'; END IF;
  p_id:=public.start_attempt('practice','QA immediate',NULL,ARRAY['c1000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000002']::uuid[],0);
  d:=public.candidate_attempt_details(p_id);
  IF jsonb_array_length(d->'reviews')<>0 THEN RAISE EXCEPTION 'Practice answer revealed before answer'; END IF;
  PERFORM public.record_answer(p_id,'c1000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000011');
  d:=public.candidate_attempt_details(p_id);
  IF jsonb_array_length(d->'reviews')<>1 OR (d->'answers'->0->>'is_correct')::boolean IS DISTINCT FROM true THEN RAISE EXCEPTION 'Practice feedback lost on resume'; END IF;
  IF jsonb_array_length(public.candidate_answer_history())<>1 THEN RAISE EXCEPTION 'Unsubmitted practice entered final analytics'; END IF;
END $$;
ROLLBACK;
SELECT 'PASS: forbidden columns; anonymous/admin/owner boundaries; exam save/change/resume; practice post-answer feedback; submitted-only analytics; final score and idempotency. All fixtures rolled back.' AS verification;
