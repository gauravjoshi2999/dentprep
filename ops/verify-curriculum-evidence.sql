-- Synthetic nonclinical drafts and transaction-local roles. Nothing is published.
BEGIN;
INSERT INTO auth.users(id,email,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
VALUES('a6000000-0000-4000-8000-000000000001','dentprep-evidence-a@example.test',now(),now(),'{}','{}'),
      ('a6000000-0000-4000-8000-000000000002','dentprep-evidence-b@example.test',now(),now(),'{}','{}'),
      ('a6000000-0000-4000-8000-000000000003','dentprep-evidence-candidate@example.test',now(),now(),'{}','{}');
INSERT INTO public.user_roles(user_id,role) VALUES('a6000000-0000-4000-8000-000000000001','admin'),('a6000000-0000-4000-8000-000000000002','admin');
INSERT INTO public.subjects(id,slug,name,short_name,status) VALUES('b6000000-0000-4000-8000-000000000001','qa-curriculum-routines','QA learning routines','QA','published');
INSERT INTO public.lessons(id,subject_id,slug,title,notes_md,status) VALUES('c6000000-0000-4000-8000-000000000001','b6000000-0000-4000-8000-000000000001','qa-curriculum-lesson','QA communication routine','Nonclinical fixture version one','draft');
INSERT INTO public.questions(id,subject_id,stem,explanation,status) VALUES('c6000000-0000-4000-8000-000000000002','b6000000-0000-4000-8000-000000000001','QA learning routine','Nonclinical explanation','draft');
INSERT INTO public.clinical_cases(id,subject_id,slug,title,presentation,status) VALUES('c6000000-0000-4000-8000-000000000003','b6000000-0000-4000-8000-000000000001','qa-curriculum-case','QA workflow fixture','Nonclinical workflow text','draft');
INSERT INTO public.answer_options(question_id,label,body,is_correct,sort_order)
SELECT 'c6000000-0000-4000-8000-000000000002',chr(64+i),'QA option '||i,i=1,i-1 FROM generate_series(1,4)i;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims','{}',true);
SELECT set_config('request.jwt.claim.sub','',true);
DO $$ DECLARE denied boolean:=false; BEGIN
  BEGIN PERFORM public.admin_content_evidence('lesson','c6000000-0000-4000-8000-000000000001'); EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Anonymous preparation RPC allowed'; END IF;
  denied:=false; BEGIN PERFORM * FROM public.content_curriculum_evidence; EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Anonymous preparation table readable'; END IF;
  denied:=false; BEGIN PERFORM public.admin_save_content_evidence(gen_random_uuid(),'lesson','c6000000-0000-4000-8000-000000000001',repeat('a',64),0,'{}'); EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Anonymous preparation save allowed'; END IF;
END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"a6000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
SELECT set_config('request.jwt.claim.sub','a6000000-0000-4000-8000-000000000001',true);
DO $$ DECLARE d jsonb; e jsonb:='{"unit":"Study routines","topic":"Communication practice","outcomes":["Describe a repeatable practice routine"],"sources":[{"citation":"Synthetic QA reference","edition":"QA version 1","section":"Section A","url":null,"checked_on":null}],"note":"Preparation only, no medical review"}';
 fp text; denied boolean; item record; saved uuid; kind text; BEGIN
  d:=public.admin_content_evidence('lesson','c6000000-0000-4000-8000-000000000001'); fp:=d->>'current_fingerprint';
  IF d->>'mapping_state'<>'missing' OR (d->>'current_version')::int<>0 OR NOT (d->>'publication_locked')::boolean OR d->>'independent_review'<>'not_recorded' THEN RAISE EXCEPTION 'Empty registry state incorrect'; END IF;
  PERFORM set_config('dentprep.qa.evidence_fp',fp,true);
  PERFORM public.admin_save_content_evidence('d6000000-0000-4000-8000-000000000001','lesson','c6000000-0000-4000-8000-000000000001',fp,0,e);
  d:=public.admin_content_evidence('lesson','c6000000-0000-4000-8000-000000000001');
  IF d->>'mapping_state'<>'matches_draft' OR (d->>'current_version')::int<>1 OR jsonb_array_length(d->'history')<>1 THEN RAISE EXCEPTION 'Preparation not saved'; END IF;
  PERFORM public.admin_save_content_evidence('d6000000-0000-4000-8000-000000000001','lesson','c6000000-0000-4000-8000-000000000001',fp,0,e);
  IF (SELECT count(*) FROM public.content_curriculum_evidence WHERE entity_type='lesson' AND entity_id='c6000000-0000-4000-8000-000000000001')<>1 THEN RAISE EXCEPTION 'Lost-response retry duplicated history'; END IF;
  denied:=false; BEGIN PERFORM public.admin_save_content_evidence('d6000000-0000-4000-8000-000000000001','lesson','c6000000-0000-4000-8000-000000000001',fp,0,e||'{"note":"Different request"}'); EXCEPTION WHEN raise_exception THEN denied:=SQLERRM LIKE '%different preparation request%'; END;
  IF NOT denied THEN RAISE EXCEPTION 'Same record id accepted different intent'; END IF;
  denied:=false; BEGIN PERFORM public.admin_save_content_evidence(gen_random_uuid(),'lesson','c6000000-0000-4000-8000-000000000001',fp,1,e||'{"clinical_approved":true}'); EXCEPTION WHEN raise_exception THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Fabricated clinical approval field recorded'; END IF;
  denied:=false; BEGIN PERFORM public.admin_save_content_evidence(gen_random_uuid(),'lesson','c6000000-0000-4000-8000-000000000001',fp,1,jsonb_set(e,'{sources,0,url}','"javascript:alert(1)"')); EXCEPTION WHEN raise_exception THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Unsafe source URL recorded'; END IF;
  denied:=false; BEGIN PERFORM public.admin_save_content_evidence(gen_random_uuid(),'lesson','c6000000-0000-4000-8000-000000000001',fp,1,jsonb_set(e,'{sources,0,checked_on}','"2100-01-01"')); EXCEPTION WHEN raise_exception THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Future source check recorded'; END IF;
  denied:=false; BEGIN PERFORM public.admin_save_content_evidence(gen_random_uuid(),'lesson','c6000000-0000-4000-8000-000000000001',fp,1,jsonb_set(e,'{outcomes}','["Explain routines","explain routines"]')); EXCEPTION WHEN raise_exception THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Duplicate outcomes recorded'; END IF;
  denied:=false; BEGIN PERFORM public.admin_save_content_evidence(gen_random_uuid(),'lesson','c6000000-0000-4000-8000-000000000001',fp,1,jsonb_set(e,'{unit}','123')); EXCEPTION WHEN raise_exception THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Non-text unit accepted'; END IF;
  denied:=false; BEGIN UPDATE public.content_curriculum_evidence SET evidence=e||'{"clinical_approved":true}' WHERE entity_id IN ('c6000000-0000-4000-8000-000000000001','c6000000-0000-4000-8000-000000000002','c6000000-0000-4000-8000-000000000003'); EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Admin bypassed append-only API'; END IF;
  IF has_table_privilege('authenticated','public.content_curriculum_evidence','INSERT') THEN RAISE EXCEPTION 'Direct insert grant bypass remains'; END IF;
  denied:=false; BEGIN DELETE FROM public.content_curriculum_evidence WHERE entity_id IN ('c6000000-0000-4000-8000-000000000001','c6000000-0000-4000-8000-000000000002','c6000000-0000-4000-8000-000000000003'); EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'History deletion allowed'; END IF;
  denied:=false; BEGIN PERFORM public._content_curriculum_snapshot('lesson','c6000000-0000-4000-8000-000000000001'); EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Internal raw snapshot directly executable'; END IF;
  FOR item IN SELECT * FROM (VALUES('question'::text,'c6000000-0000-4000-8000-000000000002'::uuid,'d6000000-0000-4000-8000-000000000002'::uuid),('case','c6000000-0000-4000-8000-000000000003','d6000000-0000-4000-8000-000000000003')) AS t(kind,id,record_id) LOOP
    d:=public.admin_content_evidence(item.kind,item.id);
    PERFORM public.admin_save_content_evidence(item.record_id,item.kind,item.id,d->>'current_fingerprint',0,e);
  END LOOP;
  UPDATE public.lessons SET status='in_review' WHERE id='c6000000-0000-4000-8000-000000000001';
  IF public.admin_content_evidence('lesson','c6000000-0000-4000-8000-000000000001')->>'mapping_state'<>'matches_draft' THEN RAISE EXCEPTION 'Operational workflow status invalidated unchanged teaching text'; END IF;
END $$;
RESET ROLE;
UPDATE public.lessons SET notes_md='Nonclinical fixture version two' WHERE id='c6000000-0000-4000-8000-000000000001';
-- Option-only changes must invalidate evidence even without touching the question row.
UPDATE public.answer_options SET body='QA changed option' WHERE question_id='c6000000-0000-4000-8000-000000000002' AND label='B';
DO $$ BEGIN
  IF (SELECT content_fingerprint FROM public.content_curriculum_evidence WHERE entity_type='question' AND entity_id='c6000000-0000-4000-8000-000000000002')=encode(sha256(convert_to((public._content_curriculum_snapshot('question','c6000000-0000-4000-8000-000000000002')->'payload')::text,'UTF8')),'hex') THEN RAISE EXCEPTION 'Option text change did not invalidate fingerprint'; END IF;
END $$;
UPDATE public.answer_options SET body='QA option 2' WHERE question_id='c6000000-0000-4000-8000-000000000002' AND label='B';
DO $$ BEGIN
  IF (SELECT content_fingerprint FROM public.content_curriculum_evidence WHERE entity_type='question' AND entity_id='c6000000-0000-4000-8000-000000000002')<>encode(sha256(convert_to((public._content_curriculum_snapshot('question','c6000000-0000-4000-8000-000000000002')->'payload')::text,'UTF8')),'hex') THEN RAISE EXCEPTION 'Restored option text did not restore original fingerprint'; END IF;
END $$;
UPDATE public.answer_options SET is_correct=(label='B') WHERE question_id='c6000000-0000-4000-8000-000000000002';

UPDATE public.clinical_cases SET presentation='Nonclinical workflow revision' WHERE id='c6000000-0000-4000-8000-000000000003';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"a6000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
SELECT set_config('request.jwt.claim.sub','a6000000-0000-4000-8000-000000000002',true);
DO $$ DECLARE d jsonb; e jsonb; denied boolean; kind text; item record; blocked integer:=0; BEGIN
  FOR item IN SELECT * FROM (VALUES('lesson'::text,'c6000000-0000-4000-8000-000000000001'::uuid),('question','c6000000-0000-4000-8000-000000000002'),('case','c6000000-0000-4000-8000-000000000003')) AS t(kind,id) LOOP
    IF public.admin_content_evidence(item.kind,item.id)->>'mapping_state'<>'stale' THEN RAISE EXCEPTION 'Changed content/options not marked stale'; END IF;
  END LOOP;
  d:=public.admin_content_evidence('lesson','c6000000-0000-4000-8000-000000000001');e:=d->'latest'->'evidence';
  denied:=false; BEGIN PERFORM public.admin_save_content_evidence(gen_random_uuid(),'lesson','c6000000-0000-4000-8000-000000000001',current_setting('dentprep.qa.evidence_fp'),1,e); EXCEPTION WHEN raise_exception THEN denied:=SQLERRM LIKE '%Content changed%'; END;
  IF NOT denied THEN RAISE EXCEPTION 'Stale content fingerprint accepted'; END IF;
  denied:=false; BEGIN PERFORM public.admin_save_content_evidence(gen_random_uuid(),'lesson','c6000000-0000-4000-8000-000000000001',d->>'current_fingerprint',0,e); EXCEPTION WHEN raise_exception THEN denied:=SQLERRM LIKE '%version changed%'; END;
  IF NOT denied THEN RAISE EXCEPTION 'Stale metadata version overwrote history'; END IF;
  PERFORM public.admin_save_content_evidence('d6000000-0000-4000-8000-000000000004','lesson','c6000000-0000-4000-8000-000000000001',d->>'current_fingerprint',1,e||'{"note":"Checked mapping against new draft; independent review still pending"}');
  d:=public.admin_content_evidence('lesson','c6000000-0000-4000-8000-000000000001');
  IF (d->>'current_version')::int<>2 OR d->>'mapping_state'<>'matches_draft' OR jsonb_array_length(d->'history')<>2 OR NOT EXISTS(SELECT 1 FROM public.content_curriculum_evidence WHERE version=1 AND entity_type='lesson' AND evidence->>'note'='Preparation only, no medical review' AND created_by='a6000000-0000-4000-8000-000000000001') THEN RAISE EXCEPTION 'New revision lost original preparation/author record'; END IF;
  FOREACH kind IN ARRAY ARRAY['lessons','questions','clinical_cases'] LOOP
    BEGIN EXECUTE format('UPDATE public.%I SET status=''published'' WHERE id::text LIKE ''c6000000-%%''',kind); EXCEPTION WHEN check_violation THEN blocked:=blocked+1; END;
  END LOOP;
  IF blocked<>3 THEN RAISE EXCEPTION 'Preparation metadata bypassed publication lock'; END IF;
  UPDATE public.clinical_cases SET status='archived' WHERE id='c6000000-0000-4000-8000-000000000003';
  d:=public.admin_content_evidence('case','c6000000-0000-4000-8000-000000000003');
  denied:=false; BEGIN PERFORM public.admin_save_content_evidence(gen_random_uuid(),'case','c6000000-0000-4000-8000-000000000003',d->>'current_fingerprint',1,e); EXCEPTION WHEN raise_exception THEN denied:=SQLERRM LIKE '%Restore%'; END;
  IF NOT denied THEN RAISE EXCEPTION 'Archived content accepted editable preparation'; END IF;
END $$;
SELECT set_config('request.jwt.claims','{"sub":"a6000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
SELECT set_config('request.jwt.claim.sub','a6000000-0000-4000-8000-000000000003',true);
DO $$ DECLARE denied boolean:=false; BEGIN
  IF EXISTS(SELECT 1 FROM public.content_curriculum_evidence) THEN RAISE EXCEPTION 'Candidate can read private preparation history'; END IF;
  BEGIN PERFORM public.admin_content_evidence('lesson','c6000000-0000-4000-8000-000000000001'); EXCEPTION WHEN raise_exception THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Candidate can call preparation read RPC'; END IF;
  denied:=false; BEGIN PERFORM public.admin_save_content_evidence(gen_random_uuid(),'lesson','c6000000-0000-4000-8000-000000000001',repeat('a',64),0,'{}'); EXCEPTION WHEN raise_exception THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Candidate can call preparation write RPC'; END IF;
END $$;
ROLLBACK;
SELECT jsonb_build_object('verification','PASS: role isolation; immutable versions; retry idempotency; strict source/outcome validation; stale content, option-only and metadata versions; archive refusal; unchanged publication lock. All nonclinical fixtures rolled back. No real admin assigned.','users',(SELECT count(*) FROM auth.users),'real_admins',(SELECT count(DISTINCT user_id) FROM public.user_roles WHERE role='admin'),'lesson_drafts',(SELECT count(*) FROM public.lessons WHERE status='draft'),'question_drafts',(SELECT count(*) FROM public.questions WHERE status='draft'),'case_drafts',(SELECT count(*) FROM public.clinical_cases WHERE status='draft'),'guards_enabled',(SELECT count(*) FROM pg_trigger WHERE tgname='guard_clinical_publication' AND tgenabled='O'),'qa_absent',NOT EXISTS(SELECT 1 FROM auth.users WHERE id='a6000000-0000-4000-8000-000000000001')) AS result;
