-- Synthetic workflow identity only; no medical approval or content is asserted.
BEGIN;
INSERT INTO auth.users(id,email,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
VALUES('a2000000-0000-4000-8000-000000000001','dentprep-publication-qa@example.test',now(),now(),'{}','{}');
INSERT INTO public.user_roles(user_id,role) VALUES('a2000000-0000-4000-8000-000000000001','admin');
-- A status/audit entry must never be mistaken for independent clinical approval.
INSERT INTO public.content_reviews(entity_type,entity_id,to_status,note,reviewer_id)
SELECT 'lesson',id,'published','Synthetic QA workflow record; NOT a clinical sign-off','a2000000-0000-4000-8000-000000000001' FROM public.lessons ORDER BY id LIMIT 1;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"a2000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
SELECT set_config('request.jwt.claim.sub','a2000000-0000-4000-8000-000000000001',true);
DO $$
DECLARE kind text; denied int:=0; sid uuid; qid uuid; lid uuid; cid uuid;
BEGIN
  SELECT id INTO sid FROM public.subjects WHERE status='published' ORDER BY sort_order LIMIT 1;
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'QA admin role not active'; END IF;
  FOREACH kind IN ARRAY ARRAY['lessons','questions','clinical_cases'] LOOP
    BEGIN
      EXECUTE format('UPDATE public.%I SET status=''published'' WHERE status=''draft''',kind);
    EXCEPTION WHEN check_violation THEN denied:=denied+1;
    END;
  END LOOP;
  IF denied<>3 THEN RAISE EXCEPTION 'Unreviewed UPDATE publication was not blocked for all content types'; END IF;
  denied:=0;
  BEGIN INSERT INTO public.lessons(subject_id,slug,title,status) VALUES(sid,'qa-blocked-lesson','QA only','published');
  EXCEPTION WHEN check_violation THEN denied:=denied+1; END;
  BEGIN INSERT INTO public.questions(subject_id,stem,explanation,status) VALUES(sid,'QA only','QA only','published');
  EXCEPTION WHEN check_violation THEN denied:=denied+1; END;
  BEGIN INSERT INTO public.clinical_cases(subject_id,slug,title,presentation,status) VALUES(sid,'qa-blocked-case','QA only','QA only','published');
  EXCEPTION WHEN check_violation THEN denied:=denied+1; END;
  IF denied<>3 THEN RAISE EXCEPTION 'Unreviewed INSERT publication was not blocked for all content types'; END IF;
  INSERT INTO public.lessons(subject_id,slug,title,status) VALUES(sid,'qa-permitted-draft','QA study routine','draft') RETURNING id INTO lid;
  UPDATE public.lessons SET status='in_review' WHERE id=lid;
  UPDATE public.lessons SET status='archived' WHERE id=lid;
  UPDATE public.lessons SET status='draft' WHERE id=lid;
  INSERT INTO public.clinical_cases(subject_id,slug,title,presentation,status) VALUES(sid,'qa-permitted-case','QA workflow fixture','Synthetic QA only','draft') RETURNING id INTO cid;
  UPDATE public.clinical_cases SET status='in_review' WHERE id=cid;
  qid:=public.admin_save_question(jsonb_build_object('subject_id',sid,'stem','QA routine','explanation','QA non-clinical rationale','status','in_review'),
    '[{"body":"QA A","is_correct":true},{"body":"QA B","is_correct":false},{"body":"QA C","is_correct":false},{"body":"QA D","is_correct":false}]');
  IF NOT EXISTS(SELECT 1 FROM public.questions WHERE id=qid AND status='in_review') THEN RAISE EXCEPTION 'Draft MCQ review workflow broke'; END IF;
END $$;
ROLLBACK;
SELECT 'PASS: admin direct INSERT/UPDATE blocked for lessons, questions, cases despite workflow log; draft/in_review/archive and transactional question editing preserved. All QA rows rolled back.' AS verification;
