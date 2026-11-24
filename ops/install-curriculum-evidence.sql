-- Additive preparation evidence, NOT professional approval or a publication pathway.
BEGIN;
CREATE TABLE IF NOT EXISTS public.content_curriculum_evidence (
  id uuid PRIMARY KEY,
  entity_type text NOT NULL CHECK(entity_type IN ('lesson','question','case')),
  entity_id uuid NOT NULL,
  version integer NOT NULL CHECK(version>0),
  content_fingerprint text NOT NULL CHECK(content_fingerprint ~ '^[a-f0-9]{64}$'),
  evidence jsonb NOT NULL CHECK(jsonb_typeof(evidence)='object'),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entity_type,entity_id,version)
);
ALTER TABLE public.content_curriculum_evidence ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.content_curriculum_evidence FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.content_curriculum_evidence TO authenticated;
DROP POLICY IF EXISTS "Admins read preparation evidence" ON public.content_curriculum_evidence;
CREATE POLICY "Admins read preparation evidence" ON public.content_curriculum_evidence
  FOR SELECT TO authenticated USING((SELECT public.has_role(auth.uid(),'admin')));

-- Raw bodies/options never leave this owner-only helper through a candidate API.
-- Operational status/timestamps do not change the educational content fingerprint.
CREATE OR REPLACE FUNCTION public._content_curriculum_snapshot(p_entity_type text,p_entity_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE s jsonb;
BEGIN
  CASE p_entity_type
  WHEN 'lesson' THEN
    SELECT jsonb_build_object('id',l.id,'type','lesson','title',l.title,'subject_id',l.subject_id,'status',l.status,
      'payload',to_jsonb(l)-ARRAY['created_at','updated_at','status','reviewed_on','review_note']) INTO s
    FROM public.lessons l WHERE l.id=p_entity_id;
  WHEN 'question' THEN
    SELECT jsonb_build_object('id',q.id,'type','question','title',q.stem,'subject_id',q.subject_id,'status',q.status,
      'payload',jsonb_build_object('question',to_jsonb(q)-ARRAY['created_at','updated_at','status'],
        'options',(SELECT coalesce(jsonb_agg(to_jsonb(o)-ARRAY['created_at','updated_at'] ORDER BY o.sort_order,o.id),'[]'::jsonb) FROM public.answer_options o WHERE o.question_id=q.id))) INTO s
    FROM public.questions q WHERE q.id=p_entity_id;
  WHEN 'case' THEN
    SELECT jsonb_build_object('id',c.id,'type','case','title',c.title,'subject_id',c.subject_id,'status',c.status,
      'payload',to_jsonb(c)-ARRAY['created_at','updated_at','status']) INTO s
    FROM public.clinical_cases c WHERE c.id=p_entity_id;
  ELSE RAISE EXCEPTION 'Unsupported content type';
  END CASE;
  RETURN s;
END; $$;
REVOKE ALL ON FUNCTION public._content_curriculum_snapshot(text,uuid) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.admin_content_evidence(p_entity_type text,p_entity_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE s jsonb; fp text; latest jsonb; v integer; history jsonb; locked boolean;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Administrator access required'; END IF;
  s:=public._content_curriculum_snapshot(p_entity_type,p_entity_id);
  IF s IS NULL THEN RAISE EXCEPTION 'Content not found'; END IF;
  fp:=encode(sha256(convert_to((s->'payload')::text,'UTF8')),'hex');
  SELECT to_jsonb(e),e.version INTO latest,v FROM public.content_curriculum_evidence e
    WHERE e.entity_type=p_entity_type AND e.entity_id=p_entity_id ORDER BY e.version DESC LIMIT 1;
  SELECT coalesce(jsonb_agg(to_jsonb(e) ORDER BY e.version DESC),'[]'::jsonb) INTO history FROM (
    SELECT * FROM public.content_curriculum_evidence WHERE entity_type=p_entity_type AND entity_id=p_entity_id ORDER BY version DESC LIMIT 20
  ) e;
  SELECT count(*)=3 INTO locked FROM pg_trigger WHERE tgname='guard_clinical_publication' AND tgenabled IN ('O','A')
    AND tgrelid IN ('public.lessons'::regclass,'public.questions'::regclass,'public.clinical_cases'::regclass)
    AND tgfoid='public.guard_clinical_publication()'::regprocedure;
  RETURN jsonb_build_object('entity',s-'payload','current_fingerprint',fp,'current_version',coalesce(v,0),
    'latest',latest,'history',history,'publication_locked',locked,'independent_review','not_recorded','server_today',(now() AT TIME ZONE 'Asia/Kolkata')::date,
    'mapping_state',CASE WHEN latest IS NULL THEN 'missing' WHEN latest->>'content_fingerprint'=fp THEN 'matches_draft' ELSE 'stale' END);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_save_content_evidence(p_id uuid,p_entity_type text,p_entity_id uuid,p_expected_fingerprint text,p_expected_version integer,p_evidence jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE s jsonb; fp text; v integer; old public.content_curriculum_evidence; n jsonb; source jsonb; sources jsonb:='[]';
  outcomes text[]; item text; unit_name text; topic_name text; note_text text; citation text; edition text; section_text text; url_text text; checked_text text; checked_date date;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Administrator access required'; END IF;
  IF p_id IS NULL OR p_entity_id IS NULL OR p_expected_version IS NULL OR p_expected_version<0 OR p_expected_fingerprint IS NULL OR p_expected_fingerprint !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'A current draft/version and retry-safe record id are required'; END IF;
  IF p_entity_type IS NULL OR p_entity_type NOT IN ('lesson','question','case') THEN RAISE EXCEPTION 'Unsupported content type'; END IF;
  -- Serialize both the first record and later revisions; stale forms never overwrite history.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_entity_type||':'||p_entity_id::text,0));
  CASE p_entity_type
    WHEN 'lesson' THEN PERFORM 1 FROM public.lessons WHERE id=p_entity_id FOR UPDATE;
    WHEN 'question' THEN PERFORM 1 FROM public.questions WHERE id=p_entity_id FOR UPDATE;
    WHEN 'case' THEN PERFORM 1 FROM public.clinical_cases WHERE id=p_entity_id FOR UPDATE;
  END CASE;
  s:=public._content_curriculum_snapshot(p_entity_type,p_entity_id);
  IF s IS NULL THEN RAISE EXCEPTION 'Content not found'; END IF;
  IF s->>'subject_id' IS NULL THEN RAISE EXCEPTION 'Assign a subject before mapping curriculum evidence'; END IF;
  IF s->>'status' NOT IN ('draft','in_review') THEN RAISE EXCEPTION 'Restore this content to draft before preparing evidence'; END IF;
  IF (SELECT count(*) FROM pg_trigger WHERE tgname='guard_clinical_publication' AND tgenabled IN ('O','A')
      AND tgrelid IN ('public.lessons'::regclass,'public.questions'::regclass,'public.clinical_cases'::regclass)
      AND tgfoid='public.guard_clinical_publication()'::regprocedure)<>3 THEN RAISE EXCEPTION 'Publication safety lock must remain active'; END IF;
  IF jsonb_typeof(p_evidence) IS DISTINCT FROM 'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_evidence) k WHERE k NOT IN ('unit','topic','outcomes','sources','note')) THEN RAISE EXCEPTION 'Only preparation fields may be recorded; clinical approval is separate'; END IF;
  IF jsonb_typeof(p_evidence->'unit') IS DISTINCT FROM 'string' OR jsonb_typeof(p_evidence->'topic') IS DISTINCT FROM 'string' OR (p_evidence ? 'note' AND jsonb_typeof(p_evidence->'note') IS DISTINCT FROM 'string') THEN RAISE EXCEPTION 'Preparation fields must be text'; END IF;
  unit_name:=trim(p_evidence->>'unit'); topic_name:=trim(p_evidence->>'topic'); note_text:=trim(coalesce(p_evidence->>'note',''));
  IF unit_name IS NULL OR char_length(unit_name) NOT BETWEEN 1 AND 160 OR topic_name IS NULL OR char_length(topic_name) NOT BETWEEN 1 AND 160 OR char_length(note_text)>2000 THEN RAISE EXCEPTION 'Unit/topic are required and preparation notes must be bounded'; END IF;
  IF jsonb_typeof(p_evidence->'outcomes') IS DISTINCT FROM 'array' OR jsonb_array_length(p_evidence->'outcomes') NOT BETWEEN 1 AND 20 THEN RAISE EXCEPTION 'Record 1 to 20 learning outcomes'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_evidence->'outcomes') e WHERE jsonb_typeof(e)<>'string' OR char_length(trim(e#>>'{}')) NOT BETWEEN 1 AND 500) THEN RAISE EXCEPTION 'Learning outcomes must be non-empty bounded text'; END IF;
  SELECT array_agg(trim(value)) INTO outcomes FROM jsonb_array_elements_text(p_evidence->'outcomes');
  IF (SELECT count(DISTINCT lower(o)) FROM unnest(outcomes) o)<>cardinality(outcomes) THEN RAISE EXCEPTION 'Learning outcomes must be distinct'; END IF;
  IF jsonb_typeof(p_evidence->'sources') IS DISTINCT FROM 'array' OR jsonb_array_length(p_evidence->'sources') NOT BETWEEN 1 AND 10 THEN RAISE EXCEPTION 'Record 1 to 10 source references'; END IF;
  FOR source IN SELECT value FROM jsonb_array_elements(p_evidence->'sources') LOOP
    IF jsonb_typeof(source) IS DISTINCT FROM 'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(source) k WHERE k NOT IN ('citation','edition','section','url','checked_on')) THEN RAISE EXCEPTION 'Invalid source reference fields'; END IF;
    IF jsonb_typeof(source->'citation') IS DISTINCT FROM 'string' OR jsonb_typeof(source->'edition') IS DISTINCT FROM 'string' OR jsonb_typeof(source->'section') IS DISTINCT FROM 'string' OR (source ? 'url' AND jsonb_typeof(source->'url') NOT IN ('string','null')) OR (source ? 'checked_on' AND jsonb_typeof(source->'checked_on') NOT IN ('string','null')) THEN RAISE EXCEPTION 'Source reference fields must be text'; END IF;
    citation:=trim(source->>'citation'); edition:=trim(source->>'edition'); section_text:=trim(source->>'section');
    url_text:=nullif(trim(source->>'url'),''); checked_text:=nullif(source->>'checked_on',''); checked_date:=NULL;
    IF citation IS NULL OR char_length(citation) NOT BETWEEN 1 AND 500 OR edition IS NULL OR char_length(edition) NOT BETWEEN 1 AND 160 OR section_text IS NULL OR char_length(section_text) NOT BETWEEN 1 AND 300 THEN RAISE EXCEPTION 'Each reference requires a citation, edition/version and page/section'; END IF;
    IF url_text IS NOT NULL AND (char_length(url_text)>2048 OR url_text !~ '^https://[[:alnum:]][[:alnum:].-]*(:[0-9]{1,5})?([/?#][^[:space:]]*)?$') THEN RAISE EXCEPTION 'Source links must be HTTPS without credentials or whitespace'; END IF;
    IF checked_text IS NOT NULL THEN
      IF checked_text !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN RAISE EXCEPTION 'Use an ISO source-check date'; END IF;
      checked_date:=checked_text::date;
      IF checked_date>(now() AT TIME ZONE 'Asia/Kolkata')::date THEN RAISE EXCEPTION 'Source-check dates cannot be in the future'; END IF;
    END IF;
    sources:=sources||jsonb_build_array(jsonb_build_object('citation',citation,'edition',edition,'section',section_text,'url',url_text,'checked_on',checked_date));
  END LOOP;
  n:=jsonb_build_object('unit',unit_name,'topic',topic_name,'outcomes',to_jsonb(outcomes),'sources',sources,'note',note_text);
  -- An identical retry returns the original revision, including after a lost response.
  SELECT * INTO old FROM public.content_curriculum_evidence WHERE id=p_id;
  IF FOUND THEN
    IF old.entity_type IS DISTINCT FROM p_entity_type OR old.entity_id IS DISTINCT FROM p_entity_id OR old.created_by IS DISTINCT FROM auth.uid() OR old.content_fingerprint IS DISTINCT FROM p_expected_fingerprint OR old.evidence IS DISTINCT FROM n THEN RAISE EXCEPTION 'Record id belongs to a different preparation request'; END IF;
    RETURN old.id;
  END IF;
  fp:=encode(sha256(convert_to((s->'payload')::text,'UTF8')),'hex');
  IF fp IS DISTINCT FROM p_expected_fingerprint THEN RAISE EXCEPTION 'Content changed. Reload the latest draft before recording evidence'; END IF;
  SELECT coalesce(max(version),0) INTO v FROM public.content_curriculum_evidence WHERE entity_type=p_entity_type AND entity_id=p_entity_id;
  IF v IS DISTINCT FROM p_expected_version THEN RAISE EXCEPTION 'Preparation version changed. Reload the latest record before saving'; END IF;
  INSERT INTO public.content_curriculum_evidence(id,entity_type,entity_id,version,content_fingerprint,evidence,created_by)
  VALUES(p_id,p_entity_type,p_entity_id,v+1,fp,n,auth.uid());
  RETURN p_id;
END; $$;
REVOKE ALL ON FUNCTION public.admin_content_evidence(text,uuid),public.admin_save_content_evidence(uuid,text,uuid,text,integer,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_content_evidence(text,uuid),public.admin_save_content_evidence(uuid,text,uuid,text,integer,jsonb) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
