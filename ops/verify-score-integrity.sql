-- Owner-only, rollback-only native SQL regression. Fixtures contain no medical teaching.
-- The guard is disabled ONLY in this uncommitted transaction to set up synthetic questions,
-- and is re-enabled before any candidate tests. No publication bypass persists or is exposed.
BEGIN;
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.questions'::regclass AND tgname='guard_clinical_publication' AND tgenabled='O') THEN RAISE EXCEPTION 'Expected publication guard is not enabled'; END IF;
END $$;
INSERT INTO auth.users(id,email,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
VALUES('a4000000-0000-4000-8000-000000000001','dentprep-score-a@example.test',now(),now(),'{}','{}'),
      ('a4000000-0000-4000-8000-000000000002','dentprep-score-b@example.test',now(),now(),'{}','{}');
INSERT INTO public.subjects(id,slug,name,short_name,status) VALUES('b4000000-0000-4000-8000-000000000001','qa-score-routines','QA nonclinical routines','QA','published');
ALTER TABLE public.questions DISABLE TRIGGER guard_clinical_publication;
INSERT INTO public.questions(id,subject_id,stem,explanation,source_note,status)
SELECT ('c4000000-0000-4000-8000-00000000000'||i)::uuid,'b4000000-0000-4000-8000-000000000001','QA study routine '||i,'QA nonclinical explanation','Synthetic regression only','published' FROM generate_series(1,3)i;
ALTER TABLE public.questions ENABLE TRIGGER guard_clinical_publication;
INSERT INTO public.answer_options(id,question_id,label,body,is_correct,sort_order)
SELECT ('d4000000-0000-4000-8000-0000000000'||q||i)::uuid,('c4000000-0000-4000-8000-00000000000'||q)::uuid,chr(64+i),'QA option '||i,i=1,i-1 FROM generate_series(1,3)q CROSS JOIN generate_series(1,4)i;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"a4000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
SELECT set_config('request.jwt.claim.sub','a4000000-0000-4000-8000-000000000001',true);
DO $$ DECLARE ids uuid[]:=ARRAY['c4000000-0000-4000-8000-000000000001','c4000000-0000-4000-8000-000000000002','c4000000-0000-4000-8000-000000000003']::uuid[];
  a uuid; prior uuid; r jsonb; first_result jsonb; denied boolean; rev_before jsonb; BEGIN
  denied:=false;
  BEGIN PERFORM public.start_attempt('custom','QA empty',NULL,ARRAY[]::uuid[],0); EXCEPTION WHEN raise_exception THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Empty denominator attempt accepted'; END IF;
  denied:=false;
  BEGIN PERFORM public.start_attempt('custom','QA duplicate',NULL,ARRAY[ids[1],ids[1]],0); EXCEPTION WHEN raise_exception THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Repeated question ids accepted'; END IF;
  -- No answers: 0/3, never NaN or division by zero.
  a:=public.start_attempt('custom','QA all skipped',NULL,ids,0); r:=public.submit_attempt(a);
  IF (r->>'total')::int<>3 OR (r->>'answered')::int<>0 OR (r->>'correct')::int<>0 OR (r->>'score_pct')::numeric<>0 THEN RAISE EXCEPTION 'All-skipped arithmetic failed'; END IF;
  -- One correct, one wrong, one skipped; an exam answer may change before final submit.
  a:=public.start_attempt('custom','QA mixed',NULL,ids,0);
  PERFORM public.record_answer(a,ids[1],'d4000000-0000-4000-8000-000000000012');
  PERFORM public.record_answer(a,ids[1],'d4000000-0000-4000-8000-000000000011');
  PERFORM public.record_answer(a,ids[2],'d4000000-0000-4000-8000-000000000022');
  IF jsonb_array_length(public.candidate_attempt_details(a)->'answers')<>2 THEN RAISE EXCEPTION 'Changed answer duplicated'; END IF;
  r:=public.submit_attempt(a); first_result:=r; prior:=a;
  IF (r->>'total')::int<>3 OR (r->>'answered')::int<>2 OR (r->>'correct')::int<>1 OR (r->>'score_pct')::numeric<>33.33 THEN RAISE EXCEPTION 'Mixed/skipped denominator failed'; END IF;
  SELECT to_jsonb(s) INTO rev_before FROM public.revision_schedule s WHERE question_id=ids[2];
  IF rev_before IS NULL OR rev_before->>'last_result'<>'false' OR (rev_before->>'lapses')::int<>1 OR (rev_before->>'due_date')::date<>(now() AT TIME ZONE 'Asia/Kolkata')::date+1 THEN RAISE EXCEPTION 'Wrong-answer due schedule failed'; END IF;
  IF public.submit_attempt(a)<>r OR NOT EXISTS(SELECT 1 FROM public.revision_schedule s WHERE to_jsonb(s)=rev_before) THEN RAISE EXCEPTION 'Repeat submit changed score or revision'; END IF;
  denied:=false;
  BEGIN PERFORM public.record_answer(a,ids[2],'d4000000-0000-4000-8000-000000000021'); EXCEPTION WHEN raise_exception THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Submitted answer changed'; END IF;
  denied:=false;
  BEGIN UPDATE public.attempts SET score_pct=100,correct=3,total=3 WHERE id=a; EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Direct score patch allowed'; END IF;
  denied:=false;
  BEGIN UPDATE public.test_answers SET is_correct=true WHERE attempt_id=a; EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Direct correctness patch allowed'; END IF;
  denied:=false;
  BEGIN UPDATE public.revision_schedule SET last_result=true WHERE question_id=ids[2]; EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Direct revision-result patch allowed'; END IF;
  -- A fresh correct revision advances its queue without rewriting the earlier result.
  a:=public.start_attempt('revision','QA revision',NULL,ARRAY[ids[2]],0);
  PERFORM public.record_answer(a,ids[2],'d4000000-0000-4000-8000-000000000021');
  denied:=false;
  BEGIN PERFORM public.record_answer(a,ids[2],'d4000000-0000-4000-8000-000000000022'); EXCEPTION WHEN raise_exception THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Practice rewrite allowed after feedback'; END IF;
  r:=public.submit_attempt(a);
  IF (r->>'score_pct')::numeric<>100 OR NOT EXISTS(SELECT 1 FROM public.revision_schedule WHERE question_id=ids[2] AND last_result AND repetitions=1 AND interval_days=3 AND lapses=1 AND due_date=(now() AT TIME ZONE 'Asia/Kolkata')::date+3) THEN RAISE EXCEPTION 'Correct revision did not advance'; END IF;
  IF public.submit_attempt(prior)<>first_result THEN RAISE EXCEPTION 'Revision rewrote original attempt result'; END IF;
  a:=public.start_attempt('custom','QA all wrong',NULL,ids,0);
  PERFORM public.record_answer(a,ids[1],'d4000000-0000-4000-8000-000000000012');
  PERFORM public.record_answer(a,ids[2],'d4000000-0000-4000-8000-000000000022');
  PERFORM public.record_answer(a,ids[3],'d4000000-0000-4000-8000-000000000032');
  r:=public.submit_attempt(a);
  IF (r->>'correct')::int<>0 OR (r->>'answered')::int<>3 OR (r->>'score_pct')::numeric<>0 THEN RAISE EXCEPTION 'All-wrong score failed'; END IF;
  a:=public.start_attempt('custom','QA all correct',NULL,ids,0);
  PERFORM public.record_answer(a,ids[1],'d4000000-0000-4000-8000-000000000011');
  PERFORM public.record_answer(a,ids[2],'d4000000-0000-4000-8000-000000000021');
  PERFORM public.record_answer(a,ids[3],'d4000000-0000-4000-8000-000000000031');
  r:=public.submit_attempt(a);
  IF (r->>'correct')::int<>3 OR (r->>'answered')::int<>3 OR (r->>'score_pct')::numeric<>100 THEN RAISE EXCEPTION 'All-correct score failed'; END IF;
  PERFORM set_config('dentprep.qa.score_attempt',a::text,true);
END $$;
SELECT set_config('request.jwt.claims','{"sub":"a4000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
SELECT set_config('request.jwt.claim.sub','a4000000-0000-4000-8000-000000000002',true);
DO $$ DECLARE denied boolean:=false; BEGIN
  IF EXISTS(SELECT 1 FROM public.attempts) OR EXISTS(SELECT 1 FROM public.revision_schedule) OR jsonb_array_length(public.candidate_answer_history())<>0 THEN RAISE EXCEPTION 'Cross-user score/history visible'; END IF;
  BEGIN PERFORM public.submit_attempt(current_setting('dentprep.qa.score_attempt')::uuid); EXCEPTION WHEN raise_exception THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Cross-user submission allowed'; END IF;
END $$;
ROLLBACK;
SELECT 'PASS: all-correct/wrong/skipped, mixed 33.33 denominator, duplicate/empty rejection, changed exam answer, submitted immutability, idempotent submit and revision, wrong/correct revision due dates, direct-write grants, cross-user isolation. All nonclinical fixtures rolled back; clinical publication guard stays enabled.' AS verification;
