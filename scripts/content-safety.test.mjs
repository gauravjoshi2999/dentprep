import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { mkdtempSync, cpSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { evaluatePackage, digest, itemDigest, packageDigest, reviewPayload, GATE_IDS, POLICY_VERSION, assertAppendOnlyHistory } from './content-safety.mjs';

// Nonclinical in-memory fixtures, ephemeral keys. Never insert these into the real trusted roster.
const { publicKey, privateKey } = generateKeyPairSync('ed25519');
function signed(p) {
  for (const i of p.items) i.content_sha256 = itemDigest(i);
  p.review.package_digest = packageDigest(p);
  p.review.signature = sign(null, Buffer.from(reviewPayload(p)), privateKey).toString('base64');
  return p;
}
function fixture() {
  const base = { version: 1, subject: 'qa-workflow', author_id: 'qa-author', outcome_ids: ['QA-01'],
    content_sha256: 'a'.repeat(64), ai_assisted: false, claim_manifest_complete: true,
    claims: [{ id: 'qa-claim', text: 'Synthetic workflow example, not medical teaching.', source_ids: ['qa-source'], locator: 'Synthetic section 1', verification: 'verified' }] };
  const lesson = { ...structuredClone(base), id: 'qa-lesson', kind: 'lesson', body: { title: 'QA routine', concept: 'Read a routine.', example: 'Synthetic example.', hints: ['Read again.'] } };
  const explanation = { ...structuredClone(base), id: 'qa-explanation', kind: 'explanation', body: { concept: 'Workflow concept.', correct_reasoning: 'Synthetic reasoning.', misconceptions: ['A fixture is not clinical proof.'] } };
  const question = n => ({ ...structuredClone(base), id: `qa-question-${n}`, kind: 'question', body: {
    stem: `Synthetic prompt ${n}`, context: 'QA only', options: [1, 2, 3, 4].map(k => ({ id: `option-${k}`, text: `QA choice ${k}`, is_best: k === 1, rationale: 'Synthetic reason.', claim_ids: ['qa-claim'] })), explanation_id: explanation.id, remediation_lesson_id: lesson.id, ambiguity_resolution: 'Synthetic context is explicitly bounded.' } });
  const clinicalCase = { ...structuredClone(base), id: 'qa-case', kind: 'case', body: { scenario: 'Synthetic scheduling workflow.', steps: [{ prompt: 'Choose a routine.', reasoning: 'QA only.', claim_ids: ['qa-claim'] }], red_flags: ['Not clinical material.'], escalation: 'Ask fixture maintainer.' } };
  const quest = { ...structuredClone(base), id: 'qa-quest', kind: 'quest', claims: [], body: { lesson_id: lesson.id, challenge_ids: ['qa-question-1'], fresh_item_ids: ['qa-question-2'], transfer_case_ids: [clinicalCase.id], delayed_probes: [1, 7, 30].map((days, n) => ({ days, item_ids: [`qa-question-${n + 3}`] })), xp_is_competence: false, claims_exam_readiness: false } };
  const p = { policy_version: POLICY_VERSION, release_id: 'qa-release', version: 1, supersedes: null, resolved_report_ids: [], created_on: '2026-11-23',
    sources: [{ id: 'qa-source', title: 'Synthetic QA reference', author_or_organization: 'Fictional fixture organization', edition: 'QA 1', year: 2026, section: 'Section 1', url: 'https://example.invalid/qa', reviewed_on: '2026-11-23', next_review_due: '2027-01-01', content_version: '1', source_kind: 'primary', verification: 'verified', verified_by: 'qa-reviewer', verification_evidence: 'https://example.invalid/qa-evidence', captured_sha256: 'b'.repeat(64) }],
    items: [lesson, explanation, ...[1, 2, 3, 4, 5].map(question), clinicalCase, quest],
    features: { ai_feedback: false, ai_scoring: false, confidence_assessment: false, official_claims: false, calibrated_difficulty: false, learning_validity_claims: false },
    gates: GATE_IDS.map(id => ({ id, result: 'pass', evidence: 'Synthetic QA evidence only.', evaluated_by: 'qa-reviewer', applicability_reason: 'Synthetic check covers a nonclinical workflow fixture.' })),
    error_reporting: { channel: 'https://example.invalid/report', withdrawal_procedure: 'Retain history and block release.', score_correction_procedure: 'Version corrections and retain original attempt.' },
    review: { reviewer_id: 'qa-reviewer', decision: 'approve', reviewed_on: '2026-11-23', valid_until: '2027-01-01', package_digest: 'c'.repeat(64), signature: 'd'.repeat(88) } };
  const context = { today: '2026-11-24', reviewers: [{ id: 'qa-reviewer', profession: 'dentist', qualification: 'Synthetic qualification; never a real credential', registration_council: 'Fictional QA council', registration_reference: 'QA-NOT-REAL', credential_evidence: 'https://example.invalid/credential', verified_by_owner: 'Synthetic QA owner', verified_on: '2026-11-23', credential_valid_until: '2027-01-01', subject_scope: ['qa-workflow'], public_key_pem: publicKey.export({ type: 'spki', format: 'pem' }), active: true }], curriculum: { groups: [{ slug: 'qa-workflow', outcomes: [{ id: 'QA-01', status: 'reviewed', reviewed_by: 'qa-reviewer' }] }] } };
  p.curriculum_digest = digest(context.curriculum);
  return { p: signed(p), context };
}
function rejected(change, expected, { resign = true } = {}) {
  const { p, context } = fixture(); change(p, context); if (resign) signed(p);
  const result = evaluatePackage(p, context);
  assert.equal(result.structural_gate_passed, false, JSON.stringify(result));
  assert.equal(result.clinical_publication, 'LOCKED');
  if (expected) assert(result.blockers.some(b => b.includes(expected)), JSON.stringify(result));
}
test('signed synthetic evidence passes integrity gate while publication remains LOCKED', () => {
  const { p, context } = fixture(); const result = evaluatePackage(p, context);
  assert.deepEqual(result, { structural_gate_passed: true, clinical_publication: 'LOCKED', blockers: [] });
});
for (const id of GATE_IDS) test(`${id}: no blocked academic check can pass a content release`, () => rejected(p => { p.gates.find(g => g.id === id).result = 'blocked'; }, id));
test('missing and duplicate gate decisions fail', () => {
  rejected(p => p.gates.pop());
  rejected(p => { p.gates[19] = structuredClone(p.gates[0]); }, '20 distinct');
});
test('required checks cannot be marked not applicable', () => rejected(p => { p.gates[3].result = 'not_applicable'; }, 'E04'));
test('irrelevant checks require reviewer justification', () => rejected(p => { p.gates[18].result = 'not_applicable'; p.gates[18].applicability_reason = 'None'; }, 'E19'));
test('empty real roster never trusts AI or claimed credentials', () => rejected((p, c) => { c.reviewers = []; }, 'No owner-verified'));
test('author cannot independently approve own content', () => rejected(p => { p.items[0].author_id = 'qa-reviewer'; }, 'independent'));
test('expired and out-of-scope credentials are blocked', () => {
  rejected((p, c) => { c.reviewers[0].credential_valid_until = c.today; }, 'credential');
  rejected((p, c) => { c.reviewers[0].subject_scope = ['other']; }, 'subject scope');
});
test('altering content after review invalidates version and signature', () => rejected(p => { p.items[0].body.concept = 'Changed teaching'; }, 'signature', { resign: false }));
test('all source metadata mandatory, unsafe URLs and fake dates rejected', () => {
  for (const field of ['title', 'author_or_organization', 'edition', 'year', 'section', 'url', 'reviewed_on', 'content_version']) rejected(p => { delete p.sources[0][field]; });
  rejected(p => { p.sources[0].url = 'javascript:alert(1)'; });
  rejected(p => { p.sources[0].reviewed_on = '2026-02-30'; });
});
test('disputed/outdated/unsupported claims and stale sources block release', () => {
  for (const state of ['unresolved', 'contradictory', 'outdated', 'disputed']) {
    rejected(p => { p.items[0].claims[0].verification = state; }, 'unsupported/disputed');
    rejected(p => { p.sources[0].verification = state; }, 'source not independently');
  }
  rejected(p => { p.sources[0].next_review_due = '2026-11-24'; }, 'outdated/future');
  rejected(p => { p.items[0].claims[0].source_ids = ['missing']; }, 'unsupported/disputed');
});
test('candidate outcomes cannot be certified by a signed lesson', () => rejected((p, c) => { c.curriculum.groups[0].outcomes[0].status = 'candidate'; }, 'outcome'));
test('review signature binds the exact curriculum, not only outcome IDs', () => rejected((p, c) => { c.curriculum.groups[0].outcomes[0].text = 'Changed scope'; }, 'curriculum/outcome'));
test('MCQ needs exactly one best answer, distinct distractors and sourced rationale', () => {
  rejected(p => { p.items[2].body.options[1].is_best = true; }, 'exactly one');
  rejected(p => { p.items[2].body.options[1].text = p.items[2].body.options[0].text; }, 'duplicate option');
  rejected(p => { p.items[2].body.options[1].claim_ids = ['missing']; }, 'distractor rationale');
});
test('wrong-answer feedback must link reviewed explanation and remediation', () => rejected(p => { p.items[2].body.explanation_id = 'missing'; }, 'concept explanation'));
test('fresh and delayed question pools cannot recycle exposed answers', () => {
  rejected(p => { p.items.at(-1).body.fresh_item_ids = ['qa-question-1']; }, 'distinct reviewed questions');
  rejected(p => { p.items.at(-1).body.delayed_probes[2].days = 1; }, '1/7/30');
  rejected(p => { p.items[3].body.stem = p.items[2].body.stem; }, 'changing IDs');
});
test('XP or exam readiness cannot claim medical competence', () => rejected(p => { p.items.at(-1).body.xp_is_competence = true; }));
test('error reports and prior withdrawals block affected items without erasing history', () => rejected((p, c) => { c.withdrawals = [{ release_id: 'older', affected_item_ids: [p.items[0].id], status: 'open' }]; }, 'error report/withdrawal'));
test('editing a report status cannot reuse a review that did not sign its correction', () => rejected((p, c) => { c.withdrawals = [{ id: 'qa-report', release_id: 'older', affected_item_ids: [p.items[0].id], status: 'resolved', resolution_evidence: 'Real review would be needed', resolved_by_release: p.release_id, reported_on: '2026-11-23' }]; }, 'signed correction'));
test('a withdrawn release identity cannot be reactivated even by a new signature', () => rejected((p, c) => { p.resolved_report_ids = ['qa-report']; c.withdrawals = [{ id: 'qa-report', release_id: p.release_id, affected_item_ids: [], status: 'resolved', resolution_evidence: 'QA only', resolved_by_release: p.release_id, reported_on: '2026-11-23' }]; }, 'signed correction'));
test('teaching revisions cannot overwrite old item versions', () => rejected((p, c) => { c.history = [{ release_id: 'old', version: 1, package_digest: digest('old'), item_versions: [{ id: p.items[0].id, version: 1, content_sha256: 'f'.repeat(64) }] }]; }, 'immutable teaching version'));
test('accepted history cannot be erased or rewritten with replacement hashes', () => {
  const old = [{ release_id: 'qa-old', package_digest: 'a'.repeat(64) }];
  assert.throws(() => assertAppendOnlyHistory(old, []), /append-only/);
  assert.throws(() => assertAppendOnlyHistory(old, [{ ...old[0], package_digest: 'b'.repeat(64) }]), /append-only/);
  assert.doesNotThrow(() => assertAppendOnlyHistory(old, [...old, { release_id: 'qa-next' }]));
});
test('anatomical illustration requires actual matching bytes, rights and sourced labels', () => {
  const { p, context } = fixture(); const base = structuredClone(p.items[0]);
  p.items.push({ ...base, id: 'qa-diagram', kind: 'illustration', body: { asset_path: 'content/assets/qa.png', asset_sha256: 'e'.repeat(64), alt: 'Synthetic diagram.', orientation: 'Synthetic orientation.', license: 'Synthetic permission record.', rights_evidence: 'https://example.invalid/rights', labels: [{ text: 'QA label', landmark: 'QA point', claim_id: 'qa-claim' }], expert_check_evidence: 'https://example.invalid/labels' } });
  signed(p); assert.equal(evaluatePackage(p, context).structural_gate_passed, false);
  context.assetHashes = { 'content/assets/qa.png': 'e'.repeat(64) };
  assert.equal(evaluatePackage(p, context).structural_gate_passed, true);
  p.items.at(-1).body.labels[0].claim_id = 'missing'; signed(p);
  assert(evaluatePackage(p, context).blockers.some(b => b.includes('anatomical labels')));
});
test('required CLI fails an unsigned package in an isolated repository without touching real content', () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'dentprep-content-'));
  try {
    cpSync(new URL('../content', import.meta.url), resolve(directory, 'content'), { recursive: true });
    writeFileSync(resolve(directory, 'content/releases/unsigned.v1.json'), JSON.stringify({ release_id: 'unsigned', version: 1, items: [] }));
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('./check-content-release.mjs', import.meta.url))], { cwd: directory, encoding: 'utf8' });
    assert.equal(result.status, 1, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.results[0].structural_gate_passed, false);
    assert.equal(report.results[0].clinical_publication, 'LOCKED');
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
test('a source-preparation packet cannot publish itself or claim qualified approval', () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'dentprep-draft-'));
  try {
    cpSync(new URL('../content', import.meta.url), resolve(directory, 'content'), { recursive: true });
    writeFileSync(resolve(directory, 'content/drafts/qa-invalid.review.json'), JSON.stringify({ status: 'published', publication_allowed: true, qualified_review: { claimed: true } }));
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('./check-content-release.mjs', import.meta.url))], { cwd: directory, encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /cannot claim publication or qualified clinical approval/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
