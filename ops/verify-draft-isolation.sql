-- Run as the existing DB owner. Synthetic workflow text only; every row rolls back.
-- No published clinical fixture, disabled trigger, real user edit or credential is needed.
BEGIN;
INSERT INTO auth.users(id,email,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
VALUES('a5000000-0000-4000-8000-000000000001','dentprep-draft-a@example.test',now(),now(),'{}','{}'),
      ('a5000000-0000-4000-8000-000000000002','dentprep-draft-admin@example.test',now(),now(),'{}','{}');
INSERT INTO public.user_roles(user_id,role) VALUES('a5000000-0000-4000-8000-000000000002','admin');
INSERT INTO public.subjects(id,slug,name,short_name,status) VALUES('b5000000-0000-4000-8000-000000000001','qa-draft-isolation','QA study workflow','QA','published');
INSERT INTO public.lessons(id,subject_id,slug,title,notes_md,status) VALUES('c5000000-0000-4000-8000-000000000001','b5000000-0000-4000-8000-000000000001','qa-draft-routine','QA routine','Synthetic nonclinical draft marker','draft');
INSERT INTO public.questions(id,subject_id,stem,explanation,status) VALUES('c5000000-0000-4000-8000-000000000002','b5000000-0000-4000-8000-000000000001','QA routine','Synthetic nonclinical draft marker','draft');
INSERT INTO public.clinical_cases(id,subject_id,slug,title,presentation,status) VALUES('c5000000-0000-4000-8000-000000000003','b5000000-0000-4000-8000-000000000001','qa-draft-case','QA workflow','Synthetic nonclinical draft marker','draft');
INSERT INTO public.answer_options(question_id,label,body,is_correct,sort_order)
SELECT 'c5000000-0000-4000-8000-000000000002',chr(64+i),'QA draft option '||i,i=1,i-1 FROM generate_series(1,4)i;
INSERT INTO public.content_sources(entity_type,entity_id,citation,url)
VALUES('lesson','c5000000-0000-4000-8000-000000000001','QA draft source marker',NULL),
      ('question','c5000000-0000-4000-8000-000000000002','QA draft source marker',NULL),
      ('case','c5000000-0000-4000-8000-000000000003','QA draft source marker',NULL);
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims','{}',true);
SELECT set_config('request.jwt.claim.sub','',true);
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.subjects WHERE id='b5000000-0000-4000-8000-000000000001') THEN RAISE EXCEPTION 'Public outline unavailable'; END IF;
  IF EXISTS(SELECT 1 FROM public.lessons WHERE id='c5000000-0000-4000-8000-000000000001')
     OR EXISTS(SELECT id FROM public.questions WHERE id='c5000000-0000-4000-8000-000000000002')
     OR EXISTS(SELECT 1 FROM public.clinical_cases WHERE id='c5000000-0000-4000-8000-000000000003')
     OR EXISTS(SELECT id FROM public.answer_options WHERE question_id='c5000000-0000-4000-8000-000000000002')
     OR EXISTS(SELECT 1 FROM public.content_sources WHERE citation='QA draft source marker') THEN RAISE EXCEPTION 'Anonymous draft/option/source visible'; END IF;
END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"a5000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
SELECT set_config('request.jwt.claim.sub','a5000000-0000-4000-8000-000000000001',true);
DO $$ DECLARE changed int; denied boolean:=false; BEGIN
  IF EXISTS(SELECT 1 FROM public.lessons WHERE id='c5000000-0000-4000-8000-000000000001')
     OR EXISTS(SELECT id FROM public.questions WHERE id='c5000000-0000-4000-8000-000000000002')
     OR EXISTS(SELECT 1 FROM public.clinical_cases WHERE id='c5000000-0000-4000-8000-000000000003')
     OR EXISTS(SELECT id FROM public.answer_options WHERE question_id='c5000000-0000-4000-8000-000000000002')
     OR EXISTS(SELECT 1 FROM public.content_sources WHERE citation='QA draft source marker') THEN RAISE EXCEPTION 'Candidate draft/option/source visible'; END IF;
  BEGIN PERFORM public.admin_questions(); EXCEPTION WHEN raise_exception THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Candidate admin read allowed'; END IF;
  UPDATE public.lessons SET title='QA unauthorized edit' WHERE id='c5000000-0000-4000-8000-000000000001';
  GET DIAGNOSTICS changed=ROW_COUNT;
  IF changed<>0 THEN RAISE EXCEPTION 'Candidate edited hidden draft'; END IF;
END $$;
SELECT set_config('request.jwt.claims','{"sub":"a5000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
SELECT set_config('request.jwt.claim.sub','a5000000-0000-4000-8000-000000000002',true);
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.lessons WHERE id='c5000000-0000-4000-8000-000000000001') OR NOT EXISTS(SELECT 1 FROM public.admin_questions() WHERE id='c5000000-0000-4000-8000-000000000002') OR NOT EXISTS(SELECT 1 FROM public.clinical_cases WHERE id='c5000000-0000-4000-8000-000000000003') THEN RAISE EXCEPTION 'Admin draft workflow read failed'; END IF;
  UPDATE public.lessons SET status='in_review' WHERE id='c5000000-0000-4000-8000-000000000001';
  UPDATE public.questions SET status='in_review' WHERE id='c5000000-0000-4000-8000-000000000002';
  UPDATE public.clinical_cases SET status='in_review' WHERE id='c5000000-0000-4000-8000-000000000003';
END $$;
SELECT set_config('request.jwt.claims','{"sub":"a5000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
SELECT set_config('request.jwt.claim.sub','a5000000-0000-4000-8000-000000000001',true);
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM public.lessons WHERE id='c5000000-0000-4000-8000-000000000001') OR EXISTS(SELECT id FROM public.questions WHERE id='c5000000-0000-4000-8000-000000000002') OR EXISTS(SELECT 1 FROM public.clinical_cases WHERE id='c5000000-0000-4000-8000-000000000003') OR EXISTS(SELECT id FROM public.answer_options WHERE question_id='c5000000-0000-4000-8000-000000000002') OR EXISTS(SELECT 1 FROM public.content_sources WHERE citation='QA draft source marker') THEN RAISE EXCEPTION 'In-review content escaped isolation'; END IF;
END $$;
ROLLBACK;
SELECT jsonb_build_object('verification','PASS: anonymous/candidate draft and in-review lesson/question/case isolation, option/source isolation, candidate mutation denial and trusted admin reads; all synthetic rows rolled back','users',(SELECT count(*) FROM auth.users),'draft_counts',jsonb_build_object('lessons',(SELECT count(*) FROM public.lessons WHERE status='draft'),'questions',(SELECT count(*) FROM public.questions WHERE status='draft'),'cases',(SELECT count(*) FROM public.clinical_cases WHERE status='draft')),'qa_absent',NOT EXISTS(SELECT 1 FROM auth.users WHERE id='a5000000-0000-4000-8000-000000000001'),'enabled_publication_guards',(SELECT count(*) FROM pg_trigger WHERE tgname='guard_clinical_publication' AND tgenabled='O')) AS result;
