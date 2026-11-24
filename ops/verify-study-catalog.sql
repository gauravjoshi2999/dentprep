-- Synthetic QA only: every DDL/data/answer below is rolled back. Never seeds a learner result.
BEGIN;
CREATE TEMP TABLE study_expected ON COMMIT DROP AS SELECT * FROM public.exam_study_catalog;
GRANT SELECT ON study_expected TO authenticated;
INSERT INTO auth.users(id,email,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
VALUES('ac300000-0000-4000-8000-000000000001','dentprep-all-subject-a@example.test',now(),now(),'{}','{}'),
 ('ac300000-0000-4000-8000-000000000002','dentprep-all-subject-b@example.test',now(),now(),'{}','{}');
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub','',true);
DO $$ BEGIN
 IF jsonb_array_length(public.exam_study_availability())<>30 THEN RAISE EXCEPTION 'Public availability metadata incorrect';END IF;
 BEGIN PERFORM public.exam_quest_overview(); RAISE EXCEPTION 'Anonymous overview allowed';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.exam_quest_state('ph-frequency',1);RAISE EXCEPTION 'Anonymous state allowed';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM * FROM public.exam_study_catalog;RAISE EXCEPTION 'Anonymous catalog allowed';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.exam_study_bookmark('ph-frequency',1,true);RAISE EXCEPTION 'Anonymous bookmark allowed';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END;$$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','ac300000-0000-4000-8000-000000000001',true);
DO $$ DECLARE c record;s jsonb;t jsonb;i integer;request uuid; BEGIN
 IF jsonb_array_length(public.exam_quest_overview())<>30 THEN RAISE EXCEPTION 'Expected 15 chapters and 15 recall packages';END IF;
 BEGIN PERFORM * FROM public.exam_study_catalog;RAISE EXCEPTION 'Raw registry leaked';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.exam_study_access('ph-frequency',1);RAISE EXCEPTION 'Internal guard callable';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 FOR c IN SELECT * FROM study_expected WHERE required_course_id IS NULL ORDER BY course_id LOOP
  s:=public.exam_quest_state(c.course_id,c.content_version);
  IF s->>'next_step'<>'0' OR s->>'content_sha256'<>c.content_sha256 THEN RAISE EXCEPTION 'Wrong initial state for %',c.course_id;END IF;
  IF (s->>'total_steps')::integer<>8 THEN RAISE EXCEPTION 'Chapter length mismatch';END IF;
  BEGIN PERFORM public.exam_quest_state(c.course_id||'-recall',1);RAISE EXCEPTION 'Unfinished chapter recall allowed';EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE 'Complete and save%' THEN RAISE;END IF;END;
  request:=gen_random_uuid();
  s:=public.exam_quest_answer(c.course_id,1,0,(c.answer_key[1]+1)%3,0,request);
  t:=public.exam_quest_answer(c.course_id,1,0,(c.answer_key[1]+1)%3,0,request);
  IF s IS DISTINCT FROM t OR s->>'next_step'<>'0' OR s->>'first_correct'<>'0' THEN RAISE EXCEPTION 'Wrong-answer/idempotency failure';END IF;
  BEGIN PERFORM public.exam_quest_answer(c.course_id,1,0,c.answer_key[1],0,request);RAISE EXCEPTION 'Request collision allowed';EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'Retry id belongs to a different answer' THEN RAISE;END IF;END;
  BEGIN PERFORM public.exam_quest_answer(c.course_id,1,0,c.answer_key[1],0,gen_random_uuid());RAISE EXCEPTION 'Stale revision allowed';EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'Study progress changed. Reload to continue' THEN RAISE;END IF;END;
  BEGIN PERFORM public.exam_quest_answer(c.course_id,1,1,c.answer_key[2],1,gen_random_uuid());RAISE EXCEPTION 'Skipped step allowed';EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'Answer the current challenge before moving ahead' THEN RAISE;END IF;END;
  FOR i IN 0..7 LOOP s:=public.exam_quest_answer(c.course_id,1,i,c.answer_key[i+1],(s->>'revision')::integer,gen_random_uuid());END LOOP;
  IF s->>'next_step'<>'8' OR s->>'first_correct'<>'7' OR s->>'completed_at' IS NULL OR s->'attempt_counts'->>0<>'2' THEN RAISE EXCEPTION 'Grade/first-choice preservation failure for %',c.course_id;END IF;
  t:=public.exam_quest_state(c.course_id,1);IF t IS DISTINCT FROM s THEN RAISE EXCEPTION 'Reload mismatch';END IF;
  BEGIN PERFORM public.exam_quest_state(c.course_id||'-recall',1);RAISE EXCEPTION 'Early recall allowed';EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE 'Next-day recall unlocks at%' THEN RAISE;END IF;END;
  PERFORM public.exam_study_bookmark(c.course_id,1,true);PERFORM public.exam_study_bookmark(c.course_id,1,true);
  IF (SELECT count(*) FROM public.exam_study_bookmarks WHERE course_id=c.course_id)<>1 THEN RAISE EXCEPTION 'Bookmark retry duplicated record';END IF;
 END LOOP;
 IF (SELECT count(*) FROM public.exam_quest_progress WHERE completed_at IS NOT NULL)<>15 THEN RAISE EXCEPTION 'Chapter results not separate';END IF;
 BEGIN PERFORM public.exam_quest_state('ph-frequency',2);RAISE EXCEPTION 'Unknown version allowed';EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'Unsupported or withdrawn course version' THEN RAISE;END IF;END;
 BEGIN UPDATE public.exam_quest_progress SET first_correct=8;RAISE EXCEPTION 'Direct score editing allowed';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN DELETE FROM public.exam_study_bookmarks;RAISE EXCEPTION 'Direct bookmark deletion allowed';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END;$$;
SELECT set_config('request.jwt.claim.sub','ac300000-0000-4000-8000-000000000002',true);
DO $$ DECLARE x jsonb;BEGIN
 IF EXISTS(SELECT 1 FROM public.exam_quest_progress) OR EXISTS(SELECT 1 FROM public.exam_study_bookmarks) THEN RAISE EXCEPTION 'Learner isolation failed';END IF;
 FOR x IN SELECT value FROM jsonb_array_elements(public.exam_quest_overview()) LOOP
  IF x->>'next_step'<>'0' OR x->>'first_correct'<>'0' OR (x->>'bookmarked')::boolean THEN RAISE EXCEPTION 'Other learner inherited a result';END IF;
 END LOOP;
 BEGIN PERFORM public.exam_quest_state('ph-frequency-recall',1);RAISE EXCEPTION 'Another learner inherited recall unlock';EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE 'Complete and save%' THEN RAISE;END IF;END;
END;$$;
RESET ROLE;
-- Simulate elapsed SERVER time for the synthetic first learner only. Never touch a real learner.
UPDATE public.exam_quest_progress SET completed_at=now()-interval '25 hours' WHERE user_id='ac300000-0000-4000-8000-000000000001' AND course_id IN(SELECT course_id FROM public.exam_study_catalog WHERE required_course_id IS NULL);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','ac300000-0000-4000-8000-000000000001',true);
DO $$ DECLARE c record;s jsonb;i integer;BEGIN
 FOR c IN SELECT * FROM study_expected WHERE required_course_id IS NOT NULL LOOP
  s:=public.exam_quest_state(c.course_id,1);
  IF s->>'total_steps'<>'2' THEN RAISE EXCEPTION 'Recall length is not independent';END IF;
  s:=public.exam_quest_answer(c.course_id,1,0,(c.answer_key[1]+1)%3,0,gen_random_uuid());
  FOR i IN 0..1 LOOP s:=public.exam_quest_answer(c.course_id,1,i,c.answer_key[i+1],(s->>'revision')::integer,gen_random_uuid());END LOOP;
  IF s->>'first_correct'<>'1' OR s->>'completed_at' IS NULL THEN RAISE EXCEPTION 'Recall grading failure';END IF;
  IF (SELECT first_correct FROM public.exam_quest_progress WHERE course_id=c.required_course_id)<>7 THEN RAISE EXCEPTION 'Recall rewrote original result';END IF;
 END LOOP;
 PERFORM public.exam_study_bookmark('ph-frequency',1,false);
 IF EXISTS(SELECT 1 FROM public.exam_study_bookmarks WHERE course_id='ph-frequency') THEN RAISE EXCEPTION 'Bookmark did not clear';END IF;
END;$$;
RESET ROLE;
DO $$ BEGIN
 BEGIN UPDATE public.exam_study_catalog SET answer_key=ARRAY[0] WHERE course_id='ph-frequency';RAISE EXCEPTION 'Published key rewritten';EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'Published study versions are immutable; register a new version' THEN RAISE;END IF;END;
 IF (SELECT answer_key FROM public.exam_study_catalog WHERE course_id='ph-frequency')<>ARRAY[1,0,2,1,0,2,0,2] THEN RAISE EXCEPTION 'Published PH v1 keys changed';END IF;
END;$$;
UPDATE public.exam_study_catalog SET active=false WHERE course_id='ph-frequency';
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 IF jsonb_array_length(public.exam_study_availability())<>28 THEN RAISE EXCEPTION 'Withdrawal did not propagate to public metadata';END IF;
 BEGIN PERFORM public.exam_quest_state('ph-frequency',1);RAISE EXCEPTION 'Withdrawn chapter available';EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'Unsupported or withdrawn course version' THEN RAISE;END IF;END;
 BEGIN PERFORM public.exam_quest_state('ph-frequency-recall',1);RAISE EXCEPTION 'Withdrawn parent recall available';EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'The source chapter has been withdrawn' THEN RAISE;END IF;END;
 IF (SELECT count(*) FROM public.exam_quest_progress)<>30 THEN RAISE EXCEPTION 'Withdrawal deleted owned history';END IF;
END;$$;
RESET ROLE;
ROLLBACK;
SELECT jsonb_build_object('test','PASS: all 15 chapters and 15 delayed recall packages; exact grading, first-answer correction, retry idempotency, request collision, stale revision, ordering, server-time lock, independent recall scores, bookmarks, owner isolation, anonymous/direct-write denial, immutable keys, withdrawal and retained history; fixtures rolled back',
 'checked_at',now(),'qa_users_absent',NOT EXISTS(SELECT 1 FROM auth.users WHERE id IN('ac300000-0000-4000-8000-000000000001','ac300000-0000-4000-8000-000000000002')),
 'clinical_guards',(SELECT count(*) FROM pg_trigger WHERE tgname='guard_clinical_publication' AND tgenabled='O'),
 'legacy_clinical_publications',(SELECT count(*) FROM public.lessons WHERE status='published')+(SELECT count(*) FROM public.questions WHERE status='published')+(SELECT count(*) FROM public.clinical_cases WHERE status='published')) AS result;
