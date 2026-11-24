import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { preparationSql, preparationVerificationSql, validateDraftPreparation } from './draft-preparation.mjs';

const packet = JSON.parse(readFileSync(new URL('../content/drafts/OMS-001.review.json', import.meta.url), 'utf8'));
const inventory = JSON.parse(readFileSync(new URL('../content/draft-inventory.json', import.meta.url), 'utf8'));
const candidateText = readFileSync(new URL(`../${packet.revision_candidate.path}`, import.meta.url), 'utf8');
const context = { inventory, candidateText, today: '2026-11-24' };

test('source preparation maps four exact existing drafts without medical approval or new clinical content', () => {
  const records = validateDraftPreparation(packet, context);
  assert.equal(records.length, 4);
  assert.equal(new Set(records.map(r => r.id)).size, 4);
  assert.deepEqual(records.map(r => r.kind), ['lesson', 'question', 'question', 'case']);
  for (const r of records) {
    assert.equal(r.expected_version, 0);
    assert.match(r.evidence.note, /^AI-assisted source preparation, NOT independent clinical approval/);
    assert.equal('qualified_review' in r.evidence, false);
    assert.equal('correct_answer' in r.evidence, false);
  }
});

test('an edited revision candidate or different native content fingerprint invalidates the preparation', () => {
  assert.throws(() => validateDraftPreparation(packet, { ...context, candidateText: `${candidateText}\nChanged item.` }), /candidate changed/);
  const changed = structuredClone(packet);
  changed.item_audits[1].backend_fingerprint = '0'.repeat(64);
  assert.throws(() => validateDraftPreparation(changed, context), /fingerprint/);
  changed.item_audits[1] = structuredClone(changed.item_audits[0]);
  assert.throws(() => validateDraftPreparation(changed, context), /Unique existing draft/);
});

test('AI approval, invented dentist fields, passed academic gates and an approved MCQ are rejected', () => {
  const changes = [
    p => { p.qualified_review = { profession: 'dentist', synthetic: true }; },
    p => { p.publication_allowed = true; },
    p => { p.status = 'published'; },
    p => { p.academic_gates[0].decision = 'PASS'; },
    p => { p.sources[0].clinical_approval = 'approved'; },
    p => { p.item_audits[1].single_best_answer = 'approved'; },
    p => { p.item_audits[0].preparation.reviewer_name = 'Synthetic MDS'; },
    p => { p.review = { decision: 'approve' }; },
  ];
  for (const change of changes) {
    const modified = structuredClone(packet); change(modified);
    assert.throws(() => validateDraftPreparation(modified, context));
  }
});

test('unread, future-dated, credential-bearing and orphaned sources cannot become preparation evidence', () => {
  const changes = [
    p => { p.sources[0].retrieval_status = 'search_snippet_only'; },
    p => { p.sources[0].source_checked_on = '2026-12-01'; },
    p => { p.sources[0].source_checked_on = '2026-02-30'; },
    p => { p.sources[0].url = 'https://private:password@example.invalid/'; },
    p => { p.sources[0].url = 'javascript:alert(1)'; },
    p => { p.sources[0].year = 2027; },
    p => { p.claim_source_map[0].source_id = 'not-inspected'; },
    p => { p.item_audits[0].preparation.sources[0].section = 'An unsourced section'; },
    p => { p.item_audits[0].preparation.sources[0].url = 'https://example.invalid/unreviewed'; },
    p => { p.revision_candidate.path = '../../private.md'; },
    p => { p.packet_id = 'OMS-001\nCOMMIT;'; },
  ];
  for (const change of changes) {
    const modified = structuredClone(packet); change(modified);
    assert.throws(() => validateDraftPreparation(modified, context));
  }
});

test('registry SQL is additive, transaction-bound and guards both changed content and retry collisions', () => {
  const sql = preparationSql(packet, context);
  assert.equal(sql, readFileSync(new URL('../ops/prepare-oms-source-evidence.sql', import.meta.url), 'utf8'),
    'The committed owner-operated SQL must match its exact reviewed packet');
  assert.match(sql, /BEGIN;/);
  assert.match(sql, /LOCK TABLE public\.lessons, public\.questions, public\.answer_options, public\.clinical_cases IN SHARE MODE/);
  assert.match(sql, /Draft changed: inspect and prepare a fresh audit/);
  assert.match(sql, /Preparation version changed/);
  assert.match(sql, /Evidence retry id already belongs to another request/);
  assert.match(sql, /All three publication guards must remain enabled/);
  assert.match(sql, /INSERT INTO public\.content_curriculum_evidence/);
  assert.equal(/\b(?:GRANT|REVOKE|ALTER|DELETE|UPDATE|DROP|TRUNCATE)\b/.test(sql), false);
  assert.equal(/SET(?: LOCAL)? ROLE|set_config\('request/.test(sql), false);
  assert.match(sql, /NULL\);/);
  assert.match(sql, /COMMIT;\n$/);
});

test('native verification isolates its helper in pg_temp and rolls back preparation writes', () => {
  const sql = preparationVerificationSql(packet, context);
  assert.match(sql, /CREATE FUNCTION pg_temp\.dentprep_prepare_check/);
  assert.match(sql, /ROLLBACK;/);
  assert.equal(sql.includes('COMMIT;'), false);
  assert.match(sql, /Stale draft unexpectedly accepted/);
  assert.match(sql, /Changed preparation version unexpectedly accepted/);
  assert.match(sql, /Retry collision unexpectedly accepted/);
  assert.equal(/CREATE FUNCTION public\.|SET ROLE|GRANT/.test(sql), false);
});
