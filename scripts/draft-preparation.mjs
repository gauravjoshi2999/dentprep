import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { GATE_IDS } from './content-safety.mjs';

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const HASH = /^[a-f0-9]{64}$/;
function assert(ok, message) { if (!ok) throw Error(message); }
function text(value, max) { return typeof value === 'string' && value.trim().length > 0 && value.length <= max; }
function date(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
function link(value) {
  if (typeof value !== 'string' || value.length > 2048 || /\s/.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !!url.hostname;
  } catch { return false; }
}
function keys(value, allowed) {
  return value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).every(k => allowed.includes(k));
}

/** Integrity of AI preparation only. This neither determines medical truth nor authorizes publication. */
export function validateDraftPreparation(packet, { inventory, candidateText, today }) {
  assert(keys(packet, ['schema_version', 'packet_id', 'status', 'publication_allowed', 'qualified_review', 'prepared_on',
    'source_lookup_by', 'subject_slug', 'scope', 'revision_candidate', 'sources', 'claim_source_map', 'item_audits',
    'issues_before_approval', 'academic_gates', 'next_action']) && packet.schema_version === 1, 'Unknown preparation fields or schema');
  assert(packet.status === 'draft' && packet.publication_allowed === false && packet.qualified_review === null,
    'Preparation cannot claim publication or qualified clinical approval');
  assert(date(today) && date(packet.prepared_on) && packet.prepared_on <= today, 'Invalid preparation date');
  assert(/^[A-Z]{2,5}-\d{3}$/.test(packet.packet_id) && text(packet.subject_slug, 100) &&
    text(packet.source_lookup_by, 500) && packet.source_lookup_by.startsWith('AI-assisted '), 'Preparation identity and AI provenance required');
  assert(Array.isArray(packet.academic_gates) && packet.academic_gates.length === 20 &&
    new Set(packet.academic_gates.map(g => g.id)).size === 20 &&
    GATE_IDS.every(id => packet.academic_gates.some(g => g.id === id && g.decision === 'BLOCKED')),
    'All 20 academic decisions remain BLOCKED');
  const candidate = packet.revision_candidate;
  assert(candidate && /^content\/preparation\/[A-Za-z0-9._-]+\.md$/.test(candidate.path) && HASH.test(candidate.sha256),
    'Bounded candidate path and hash required');
  assert(typeof candidateText === 'string' && createHash('sha256').update(candidateText).digest('hex') === candidate.sha256,
    'Revision candidate changed; prepare a new exact-version audit');
  assert(Array.isArray(packet.sources) && packet.sources.length > 0 && packet.sources.length <= 20, 'Source records required');
  const sources = new Map();
  for (const s of packet.sources) {
    assert(keys(s, ['id', 'title', 'author_or_organization', 'edition', 'year', 'section', 'url', 'content_version',
      'source_checked_on', 'retrieval_status', 'clinical_reviewed_on', 'clinical_approval']), 'Unknown source fields');
    assert(text(s.id, 100) && !sources.has(s.id), 'Source ids must be unique');
    assert(text(s.title, 400) && text(s.author_or_organization, 250) && text(s.edition, 160) && text(s.section, 300) && text(s.content_version, 300),
      'Complete bibliographic metadata and section/version required');
    assert(s.year === null || (Number.isInteger(s.year) && s.year > 1800 && s.year <= Number(today.slice(0, 4))), 'Do not invent source years');
    assert(link(s.url) && date(s.source_checked_on) && s.source_checked_on <= today, 'Source needs HTTPS and an actual check date');
    assert(s.retrieval_status === 'full_page_opened' && s.clinical_reviewed_on === null && s.clinical_approval === null,
      'Retrieved text is preparation, not qualified source approval');
    sources.set(s.id, s);
  }
  assert(Array.isArray(packet.claim_source_map) && packet.claim_source_map.length > 0, 'Claim-to-source preparation required');
  const claims = new Set();
  for (const c of packet.claim_source_map) {
    assert(text(c.id, 100) && !claims.has(c.id) && text(c.claim, 1000) && text(c.locator, 500), 'Distinct claims and exact locators required');
    assert(sources.has(c.source_id) && (!c.additional_source_id || sources.has(c.additional_source_id)), 'Claim references an unknown source');
    assert(c.lookup === 'supported_by_retrieved_text' && c.qualified_review === 'pending', 'Source lookup cannot approve a claim');
    claims.add(c.id);
  }
  assert(Array.isArray(packet.issues_before_approval) && packet.issues_before_approval.length > 0 &&
    packet.issues_before_approval.every(i => text(i, 2000)), 'Record unresolved clinical/source gaps');
  assert(Array.isArray(packet.item_audits) && packet.item_audits.length > 0 && packet.item_audits.length <= 60, 'Bounded exact-item audit required');
  const identities = new Set();
  const recordIds = new Set();
  return packet.item_audits.map(item => {
    assert(keys(item, ['kind', 'id', 'title', 'backend_fingerprint', 'expected_evidence_version', 'evidence_record_id',
      'decision', 'single_best_answer', 'findings', 'source_ids', 'preparation']), 'Unknown item preparation fields');
    const identity = `${item.kind}:${item.id}`;
    assert(['lesson', 'question', 'case'].includes(item.kind) && UUID.test(item.id) && !identities.has(identity), 'Unique existing draft identity required');
    identities.add(identity);
    const existing = inventory.items.find(i => i.kind === item.kind && i.id === item.id);
    assert(existing && existing.subject === packet.subject_slug && existing.backend_fingerprint === item.backend_fingerprint && HASH.test(item.backend_fingerprint) && existing.decision === 'BLOCKED' && existing.status === 'draft',
      'Audit must match the exact existing blocked draft fingerprint and subject');
    assert(item.decision === 'REVISION_REQUIRED' && item.single_best_answer === (item.kind === 'question' ? 'not_established' : 'not_applicable'),
      'AI critique cannot establish clinical or single-best-answer validity');
    assert(Number.isInteger(item.expected_evidence_version) && item.expected_evidence_version >= 0 && UUID.test(item.evidence_record_id) && !recordIds.has(item.evidence_record_id),
      'Retry-safe evidence id and expected version required');
    recordIds.add(item.evidence_record_id);
    assert(Array.isArray(item.findings) && item.findings.length > 0 && item.findings.every(i => text(i, 2000)), 'Item findings required');
    assert(Array.isArray(item.source_ids) && item.source_ids.length > 0 && item.source_ids.length <= 10 &&
      new Set(item.source_ids).size === item.source_ids.length && item.source_ids.every(id => sources.has(id)), 'Item source mapping required');
    const e = item.preparation;
    assert(keys(e, ['unit', 'topic', 'outcomes', 'sources', 'note']) && text(e.unit, 160) && text(e.topic, 160) && text(e.note, 2000),
      'Only bounded preparation fields may enter the existing registry');
    assert(e.note.startsWith('AI-assisted source preparation, NOT independent clinical approval.'), 'Store the actual AI provenance');
    assert(Array.isArray(e.outcomes) && e.outcomes.length > 0 && e.outcomes.length <= 20 && e.outcomes.every(o => text(o, 500)) &&
      new Set(e.outcomes.map(o => o.trim().toLowerCase())).size === e.outcomes.length, 'Distinct bounded outcomes required');
    const expectedSources = item.source_ids.map(id => {
      const s = sources.get(id);
      return { citation: `${s.author_or_organization}: ${s.title}`, edition: s.edition, section: s.section, url: s.url, checked_on: s.source_checked_on };
    });
    assert(expectedSources.every(s => text(s.citation, 500)) && isDeepStrictEqual(e.sources, expectedSources), 'Registry sources must exactly match the audited source locators');
    return { id: item.evidence_record_id, kind: item.kind, entity_id: item.id, fingerprint: item.backend_fingerprint,
      expected_version: item.expected_evidence_version, subject_slug: packet.subject_slug, evidence: e };
  });
}

const literal = value => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;

/** Owner-operated, additive SQL. No roles, medical approval, content edit or publication operation. */
export function preparationSql(packet, context) {
  const records = validateDraftPreparation(packet, context);
  return `-- ${packet.packet_id}: AI source preparation, NOT clinical approval. Review before owner execution.
-- Source: content/drafts/${packet.packet_id}.review.json; original content and all publication guards retained.
BEGIN;
SET LOCAL standard_conforming_strings = on;
LOCK TABLE public.lessons, public.questions, public.answer_options, public.clinical_cases IN SHARE MODE;
LOCK TABLE public.content_curriculum_evidence IN SHARE ROW EXCLUSIVE MODE;
DO $preparation$
DECLARE r jsonb; s jsonb; fp text; v integer; old public.content_curriculum_evidence;
BEGIN
  IF (SELECT count(*) FROM pg_trigger WHERE tgname='guard_clinical_publication' AND tgenabled IN ('O','A')
      AND tgrelid IN ('public.lessons'::regclass,'public.questions'::regclass,'public.clinical_cases'::regclass)
      AND tgfoid='public.guard_clinical_publication()'::regprocedure) <> 3 THEN
    RAISE EXCEPTION 'All three publication guards must remain enabled';
  END IF;
  FOR r IN SELECT value FROM jsonb_array_elements(${literal(records)}) LOOP
    s := public._content_curriculum_snapshot(r->>'kind',(r->>'entity_id')::uuid);
    IF s IS NULL THEN RAISE EXCEPTION 'Expected draft is missing'; END IF;
    fp := encode(sha256(convert_to((s->'payload')::text,'UTF8')),'hex');
    IF fp IS DISTINCT FROM r->>'fingerprint' OR s->>'status' NOT IN ('draft','in_review') OR NOT EXISTS(
      SELECT 1 FROM public.subjects WHERE id=(s->>'subject_id')::uuid AND slug=r->>'subject_slug'
    ) THEN RAISE EXCEPTION 'Draft changed: inspect and prepare a fresh audit'; END IF;
    SELECT * INTO old FROM public.content_curriculum_evidence WHERE id=(r->>'id')::uuid;
    IF FOUND THEN
      IF old.entity_type IS DISTINCT FROM r->>'kind' OR old.entity_id IS DISTINCT FROM (r->>'entity_id')::uuid
        OR old.content_fingerprint IS DISTINCT FROM fp OR old.evidence IS DISTINCT FROM r->'evidence'
        OR old.version IS DISTINCT FROM (r->>'expected_version')::int+1 OR old.created_by IS NOT NULL
      THEN RAISE EXCEPTION 'Evidence retry id already belongs to another request'; END IF;
    ELSE
      SELECT coalesce(max(version),0) INTO v FROM public.content_curriculum_evidence
        WHERE entity_type=r->>'kind' AND entity_id=(r->>'entity_id')::uuid;
      IF v IS DISTINCT FROM (r->>'expected_version')::int THEN RAISE EXCEPTION 'Preparation version changed'; END IF;
      INSERT INTO public.content_curriculum_evidence(id,entity_type,entity_id,version,content_fingerprint,evidence,created_by)
        VALUES((r->>'id')::uuid,r->>'kind',(r->>'entity_id')::uuid,v+1,fp,r->'evidence',NULL);
    END IF;
  END LOOP;
END; $preparation$;
COMMIT;
`;
}

/** Exercise the exact compiled transaction body in a temporary function, then roll back every write. */
export function preparationVerificationSql(packet, context) {
  const sql = preparationSql(packet, context);
  const body = sql.slice(sql.indexOf('DECLARE r jsonb;'), sql.indexOf('END; $preparation$;') + 4);
  const expression = body.match(/jsonb_array_elements\((.*?)\) LOOP/s)?.[1];
  assert(expression?.endsWith('::jsonb'), 'Cannot derive the exact compiled preparation fixture');
  const parameterBody = body.replace(`jsonb_array_elements(${expression})`, 'jsonb_array_elements(p_records)');
  return `BEGIN;
SET LOCAL standard_conforming_strings=on;
LOCK TABLE public.lessons, public.questions, public.answer_options, public.clinical_cases IN SHARE MODE;
LOCK TABLE public.content_curriculum_evidence IN SHARE ROW EXCLUSIVE MODE;
CREATE FUNCTION pg_temp.dentprep_prepare_check(p_records jsonb) RETURNS void LANGUAGE plpgsql AS $check$${parameterBody}$check$;
SELECT pg_temp.dentprep_prepare_check(${expression});
SELECT pg_temp.dentprep_prepare_check(${expression});
DO $qa$
DECLARE records jsonb:=${expression}; bad jsonb;
BEGIN
 IF (SELECT count(*) FROM public.content_curriculum_evidence WHERE id IN (SELECT (value->>'id')::uuid FROM jsonb_array_elements(records)))<>jsonb_array_length(records) THEN RAISE EXCEPTION 'Retry changed the evidence count'; END IF;
 bad:=jsonb_set(records,'{0,fingerprint}',to_jsonb(repeat('0',64)));
 BEGIN
  PERFORM pg_temp.dentprep_prepare_check(bad);
  RAISE EXCEPTION 'Stale draft unexpectedly accepted';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE 'Draft changed:%' THEN RAISE; END IF;
 END;
 bad:=jsonb_set(records,'{0,id}','"ff000000-0000-4000-8000-000000000001"');
 BEGIN
  PERFORM pg_temp.dentprep_prepare_check(bad);
  RAISE EXCEPTION 'Changed preparation version unexpectedly accepted';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'Preparation version changed' THEN RAISE; END IF;
 END;
 bad:=jsonb_set(records,'{0,evidence,topic}','"Different retry request"');
 BEGIN
  PERFORM pg_temp.dentprep_prepare_check(bad);
  RAISE EXCEPTION 'Retry collision unexpectedly accepted';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'Evidence retry id already belongs to another request' THEN RAISE; END IF;
 END;
END; $qa$;
ROLLBACK;
SELECT jsonb_build_object('test','PASS: native exact draft hashes; additive insertion; duplicate retry; stale fingerprint, changed-version and retry collision rejection; all fixtures rolled back',
 'checked_at',now(),'persisted_preparation_rows',(SELECT count(*) FROM public.content_curriculum_evidence),
 'guards',(SELECT count(*) FROM pg_trigger WHERE tgname='guard_clinical_publication' AND tgenabled='O'),
 'draft_lessons',(SELECT count(*) FROM public.lessons WHERE status='draft'),
 'draft_questions',(SELECT count(*) FROM public.questions WHERE status='draft'),
 'draft_cases',(SELECT count(*) FROM public.clinical_cases WHERE status='draft')) AS result;
`;
}
