-- Install first, or run its DDL and this fixture inside one outer rollback transaction.
BEGIN;
INSERT INTO auth.users(id,email,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
VALUES('ac100000-0000-4000-8000-000000000001','dentprep-quest-a@example.test',now(),now(),'{}','{}'),
      ('ac100000-0000-4000-8000-000000000002','dentprep-quest-b@example.test',now(),now(),'{}','{}');
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub','',true);
DO $$ DECLARE denied boolean:=false; BEGIN
 BEGIN PERFORM public.exam_quest_state('ph-frequency',1); EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Anonymous progress read allowed'; END IF;
 denied:=false; BEGIN PERFORM * FROM public.exam_quest_progress; EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Anonymous table read allowed'; END IF;
END; $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','ac100000-0000-4000-8000-000000000001',true);
DO $$ DECLARE s jsonb; t jsonb; denied boolean; keys integer[]:=ARRAY[1,0,2,1,0,2,0,2]; i integer; BEGIN
 s:=public.exam_quest_state('ph-frequency',1);
 IF s->>'next_step'<>'0' OR s->>'revision'<>'0' THEN RAISE EXCEPTION 'Initial checkpoint invalid'; END IF;
 s:=public.exam_quest_answer('ph-frequency',1,0,0,0,'ac200000-0000-4000-8000-000000000001');
 IF s->>'next_step'<>'0' OR s->>'first_correct'<>'0' OR s->>'revision'<>'1' THEN RAISE EXCEPTION 'Wrong answer advanced or scored'; END IF;
 t:=public.exam_quest_answer('ph-frequency',1,0,0,0,'ac200000-0000-4000-8000-000000000001');
 IF t IS DISTINCT FROM s THEN RAISE EXCEPTION 'Lost-response retry mutated the attempt'; END IF;
 BEGIN PERFORM public.exam_quest_answer('ph-frequency',1,0,2,0,'ac200000-0000-4000-8000-000000000001'); RAISE EXCEPTION 'Retry collision accepted';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'Retry id belongs to a different answer' THEN RAISE; END IF; END;
 BEGIN PERFORM public.exam_quest_answer('ph-frequency',1,0,1,0,gen_random_uuid()); RAISE EXCEPTION 'Stale progress accepted';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'Study progress changed. Reload to continue' THEN RAISE; END IF; END;
 BEGIN PERFORM public.exam_quest_answer('ph-frequency',1,1,0,1,gen_random_uuid()); RAISE EXCEPTION 'Out-of-order progress accepted';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'Answer the current challenge before moving ahead' THEN RAISE; END IF; END;
 s:=public.exam_quest_answer('ph-frequency',1,0,1,1,gen_random_uuid());
 IF s->>'next_step'<>'1' OR s->>'first_correct'<>'0' OR s->'attempt_counts'->>0<>'2' OR s->'first_choices'->>0<>'0' THEN RAISE EXCEPTION 'Correction inflated first-attempt score'; END IF;
 FOR i IN 1..7 LOOP s:=public.exam_quest_answer('ph-frequency',1,i,keys[i+1],(s->>'revision')::integer,gen_random_uuid()); END LOOP;
 IF s->>'next_step'<>'8' OR s->>'first_correct'<>'7' OR s->>'completed_at' IS NULL THEN RAISE EXCEPTION 'Completion or scoring invalid'; END IF;
 t:=public.exam_quest_state('ph-frequency',1);
 IF t IS DISTINCT FROM s THEN RAISE EXCEPTION 'Reload did not resume exact saved progress'; END IF;
 BEGIN PERFORM public.exam_quest_state('ph-frequency',2); RAISE EXCEPTION 'Unknown content version accepted';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'Unsupported course version' THEN RAISE; END IF; END;
 denied:=false; BEGIN UPDATE public.exam_quest_progress SET first_correct=8 WHERE user_id='ac100000-0000-4000-8000-000000000001'; EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Direct score editing allowed'; END IF;
END; $$;
SELECT set_config('request.jwt.claim.sub','ac100000-0000-4000-8000-000000000002',true);
DO $$ DECLARE s jsonb; BEGIN
 IF EXISTS(SELECT 1 FROM public.exam_quest_progress) THEN RAISE EXCEPTION 'Another learner can read private progress'; END IF;
 s:=public.exam_quest_state('ph-frequency',1);
 IF s->>'next_step'<>'0' OR s->>'first_correct'<>'0' THEN RAISE EXCEPTION 'Another learner inherited progress'; END IF;
END; $$;
RESET ROLE;
ROLLBACK;
SELECT jsonb_build_object('test','PASS: owner isolation, anonymous denial, exact server grading, corrected retry, idempotency, stale revision and out-of-order rejection, version binding, reload and immutable first answers; fixtures rolled back',
 'checked_at',now(),'qa_users_absent',NOT EXISTS(SELECT 1 FROM auth.users WHERE id IN ('ac100000-0000-4000-8000-000000000001','ac100000-0000-4000-8000-000000000002')),
 'clinical_guards',(SELECT count(*) FROM pg_trigger WHERE tgname='guard_clinical_publication' AND tgenabled='O'),
 'published_clinical',(SELECT count(*) FROM public.lessons WHERE status='published')+(SELECT count(*) FROM public.questions WHERE status='published')+(SELECT count(*) FROM public.clinical_cases WHERE status='published')) AS result;
