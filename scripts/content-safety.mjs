import { createHash, createPublicKey, verify } from 'node:crypto';
import { z } from 'zod';

// Repository tooling only. This module has no database client or publication capability.
export const POLICY_VERSION = 'dentprep-medical-content-v1';
export const GATE_IDS = Array.from({ length: 20 }, (_, i) => `E${String(i + 1).padStart(2, '0')}`);
const id = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,119}$/);
const text = z.string().trim().min(1).max(10000);
const sha = z.string().regex(/^[a-f0-9]{64}$/);
const date = z.string().refine(value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'Invalid calendar date');
const https = z.string().url().max(2048).refine(value => {
  const u = new URL(value);
  return u.protocol === 'https:' && !u.username && !u.password;
}, 'HTTPS evidence link without credentials required');
const claim = z.object({
  id, text, source_ids: z.array(id).min(1), locator: text,
  verification: z.enum(['verified', 'unresolved', 'contradictory', 'outdated', 'disputed']),
}).strict();
const source = z.object({
  id, title: text, author_or_organization: text, edition: text,
  year: z.number().int().min(1600).max(2200), section: text, url: https,
  reviewed_on: date, next_review_due: date, content_version: text,
  source_kind: z.enum(['primary', 'standard_textbook', 'official_guideline', 'systematic_review']),
  verification: z.enum(['verified', 'unresolved', 'contradictory', 'outdated', 'disputed']),
  verified_by: id, verification_evidence: https, captured_sha256: sha,
}).strict();
const common = {
  id, version: z.number().int().positive(), subject: id, author_id: id,
  outcome_ids: z.array(id).min(1), content_sha256: sha,
  ai_assisted: z.boolean(), claim_manifest_complete: z.boolean(), claims: z.array(claim),
};
const lesson = z.object({ ...common, kind: z.literal('lesson'), body: z.object({
  title: text, concept: text, example: text, hints: z.array(text).min(1),
}).strict() }).strict();
const question = z.object({ ...common, kind: z.literal('question'), body: z.object({
  stem: text, context: text,
  options: z.array(z.object({ id, text, is_best: z.boolean(), rationale: text,
    claim_ids: z.array(id).min(1) }).strict()).min(3).max(6),
  explanation_id: id, remediation_lesson_id: id, ambiguity_resolution: text,
}).strict() }).strict();
const explanation = z.object({ ...common, kind: z.literal('explanation'), body: z.object({
  concept: text, correct_reasoning: text, misconceptions: z.array(text).min(1),
}).strict() }).strict();
const clinicalCase = z.object({ ...common, kind: z.literal('case'), body: z.object({
  scenario: text, steps: z.array(z.object({ prompt: text, reasoning: text,
    claim_ids: z.array(id).min(1) }).strict()).min(1),
  red_flags: z.array(text).min(1), escalation: text,
}).strict() }).strict();
const illustration = z.object({ ...common, kind: z.literal('illustration'), body: z.object({
  asset_path: z.string().regex(/^content\/assets\/[a-zA-Z0-9/_-]+\.(png|jpg|jpeg|svg|webp)$/),
  asset_sha256: sha, alt: text, orientation: text, license: text, rights_evidence: https,
  labels: z.array(z.object({ text, landmark: text, claim_id: id }).strict()).min(1),
  expert_check_evidence: https,
}).strict() }).strict();
const quest = z.object({ ...common, kind: z.literal('quest'), body: z.object({
  lesson_id: id, challenge_ids: z.array(id).min(1), fresh_item_ids: z.array(id).min(1),
  transfer_case_ids: z.array(id).min(1),
  delayed_probes: z.array(z.object({ days: z.union([z.literal(1), z.literal(7), z.literal(30)]),
    item_ids: z.array(id).min(1) }).strict()).length(3),
  xp_is_competence: z.literal(false), claims_exam_readiness: z.literal(false),
}).strict() }).strict();
export const packageSchema = z.object({
  policy_version: z.literal(POLICY_VERSION), release_id: id, version: z.number().int().positive(),
  supersedes: id.nullable(), created_on: date, curriculum_digest: sha,
  resolved_report_ids: z.array(id),
  sources: z.array(source).min(1),
  items: z.array(z.discriminatedUnion('kind', [lesson, question, explanation, clinicalCase, illustration, quest])).min(1),
  features: z.object({ ai_feedback: z.boolean(), ai_scoring: z.boolean(),
    confidence_assessment: z.boolean(), official_claims: z.boolean(),
    calibrated_difficulty: z.boolean(), learning_validity_claims: z.literal(false) }).strict(),
  gates: z.array(z.object({ id: z.enum(GATE_IDS), result: z.enum(['pass', 'not_applicable', 'blocked']),
    evidence: text, evaluated_by: id, applicability_reason: text }).strict()).length(20),
  error_reporting: z.object({ channel: https, withdrawal_procedure: text, score_correction_procedure: text }).strict(),
  review: z.object({ reviewer_id: id, decision: z.literal('approve'), reviewed_on: date,
    valid_until: date, package_digest: sha, signature: z.string().min(80).max(200) }).strict(),
}).strict();

export function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
}
export function digest(value) { return createHash('sha256').update(canonical(value)).digest('hex'); }
export function itemDigest(item) { const { content_sha256, ...payload } = item; return digest(payload); }
export function reviewPayload(pkg) {
  const { review, ...payload } = pkg;
  return `${POLICY_VERSION}\n${canonical(payload)}`;
}
export function packageDigest(pkg) { return createHash('sha256').update(reviewPayload(pkg)).digest('hex'); }
export function assertAppendOnlyHistory(previous, current) {
  if (current.length < previous.length || previous.some((entry, n) => canonical(entry) !== canonical(current[n])))
    throw Error('Accepted history index is append-only; preserve all original snapshots and item versions');
}
const duplicates = values => new Set(values).size !== values.length;
function datesCurrent(reviewed, due, today) { return reviewed <= today && due > today && due > reviewed; }

export function requiredGates(pkg) {
  const kinds = new Set(pkg.items.map(i => i.kind));
  const required = new Set(['E01', 'E02', 'E03', 'E04', 'E06', 'E14', 'E17', 'E20']);
  if (kinds.has('question')) ['E05', 'E08', 'E09'].forEach(k => required.add(k));
  if (kinds.has('illustration')) required.add('E07');
  if (kinds.has('quest')) ['E08', 'E09', 'E10', 'E15'].forEach(k => required.add(k));
  if (kinds.has('case')) required.add('E15');
  if (pkg.features.confidence_assessment) required.add('E11');
  if (pkg.features.calibrated_difficulty) required.add('E12');
  if (pkg.features.ai_feedback) required.add('E13');
  if (pkg.features.ai_scoring) required.add('E16');
  if (pkg.features.official_claims) required.add('E18');
  // E19: a consenting single-learner pilot, not a multi-tenant cohort; before validity claims.
  return required;
}

/** Evidence/integrity gate, never a medical judgment or a publisher. No trusted reviewer is seeded. */
export function evaluatePackage(input, { today, reviewers = [], curriculum, withdrawals = [], history = [], assetHashes = {} } = {}) {
  date.parse(today);
  const parsed = packageSchema.safeParse(input);
  if (!parsed.success) return { structural_gate_passed: false, clinical_publication: 'LOCKED', blockers:
    parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`) };
  const p = parsed.data;
  const blockers = [];
  const reject = (condition, message) => { if (condition) blockers.push(message); };
  const reviewer = reviewers.find(r => r.id === p.review.reviewer_id);
  const rosterSchema = z.object({ id, profession: z.literal('dentist'), registration_council: text,
    qualification: text, registration_reference: text, credential_evidence: https,
    verified_by_owner: text, verified_on: date, credential_valid_until: date,
    subject_scope: z.array(id).min(1), public_key_pem: text, active: z.literal(true) }).strict();
  const trusted = rosterSchema.safeParse(reviewer);
  reject(!trusted.success, 'No owner-verified independent qualified reviewer in trusted roster');
  if (trusted.success) {
    reject(!datesCurrent(reviewer.verified_on, reviewer.credential_valid_until, today), 'Reviewer credential verification expired/future');
    reject(p.items.some(i => i.author_id === reviewer.id), 'Reviewer must be independent of every item author');
    reject(p.items.some(i => !reviewer.subject_scope.includes(i.subject)), 'Reviewer subject scope does not cover this package');
    try {
      const key = createPublicKey(reviewer.public_key_pem);
      reject(key.asymmetricKeyType !== 'ed25519' || !verify(null, Buffer.from(reviewPayload(p)), key, Buffer.from(p.review.signature, 'base64')), 'Independent review signature invalid');
    } catch { blockers.push('Independent review signature/key invalid'); }
  }
  reject(p.review.package_digest !== packageDigest(p), 'Review digest does not bind exact content/sources/gates');
  reject(!curriculum || p.curriculum_digest !== digest(curriculum), 'Review does not bind exact curriculum/outcome version');
  reject(!datesCurrent(p.review.reviewed_on, p.review.valid_until, today), 'Review expired or future');
  reject(p.created_on > p.review.reviewed_on, 'Review predates this package');
  reject(duplicates(p.items.map(i => i.id)) || duplicates(p.sources.map(s => s.id)), 'Duplicate item/source identity');
  reject(duplicates(p.gates.map(g => g.id)) || GATE_IDS.some(id => !p.gates.some(g => g.id === id)), 'All 20 distinct educational gates must be recorded');
  const required = requiredGates(p);
  for (const g of p.gates) {
    reject(g.evaluated_by !== p.review.reviewer_id, `${g.id}: independent reviewer must attest gate decision`);
    reject(g.result === 'blocked' || (required.has(g.id) && g.result !== 'pass'), `${g.id}: mandatory gate unresolved`);
    reject(g.result === 'not_applicable' && g.applicability_reason.trim().length < 30, `${g.id}: explain why check is not relevant`);
  }
  const sources = new Map(p.sources.map(s => [s.id, s]));
  for (const s of p.sources) {
    reject(s.verification !== 'verified' || s.verified_by !== p.review.reviewer_id, `${s.id}: authoritative source not independently verified`);
    reject(s.year > Number(today.slice(0, 4)) || !datesCurrent(s.reviewed_on, s.next_review_due, today), `${s.id}: source outdated/future/unreviewed`);
    reject(s.year > Number(s.reviewed_on.slice(0, 4)), `${s.id}: source verification predates its publication year`);
  }
  const items = new Map(p.items.map(i => [i.id, i]));
  const outcomes = new Map((curriculum?.groups ?? []).flatMap(g => g.outcomes.map(o => [o.id, { ...o, subject: g.slug }])));
  for (const i of p.items) {
    reject(i.content_sha256 !== itemDigest(i), `${i.id}: content version hash mismatch`);
    reject(!i.claim_manifest_complete || (i.kind !== 'quest' && !i.claims.length), `${i.id}: factual claim inventory incomplete`);
    reject(duplicates(i.claims.map(c => c.id)) || duplicates(i.outcome_ids), `${i.id}: duplicate claim/outcome identity`);
    for (const oid of i.outcome_ids) {
      const o = outcomes.get(oid);
      reject(!o || o.subject !== i.subject || o.status !== 'reviewed' || o.reviewed_by !== p.review.reviewer_id, `${i.id}: outcome ${oid} is not independently reconciled to curriculum`);
    }
    for (const c of i.claims) reject(c.verification !== 'verified' || duplicates(c.source_ids) || c.source_ids.some(s => !sources.has(s)), `${i.id}/${c.id}: unsupported/disputed claim or missing authoritative source`);
    const claimIds = new Set(i.claims.map(c => c.id));
    if (i.kind === 'question') {
      reject(i.body.options.filter(o => o.is_best).length !== 1, `${i.id}: exactly one defensible marked best answer required`);
      reject(duplicates(i.body.options.map(o => o.id)) || duplicates(i.body.options.map(o => o.text.trim().toLowerCase())), `${i.id}: duplicate option identity/text`);
      reject(i.body.options.some(o => o.claim_ids.some(c => !claimIds.has(c))), `${i.id}: every distractor rationale must map to verified claims`);
      reject(items.get(i.body.explanation_id)?.kind !== 'explanation' || items.get(i.body.remediation_lesson_id)?.kind !== 'lesson', `${i.id}: verified concept explanation and remedial lesson required`);
      for (const related of [i.body.explanation_id, i.body.remediation_lesson_id])
        reject(!items.get(related)?.outcome_ids.some(o => i.outcome_ids.includes(o)) || items.get(related)?.subject !== i.subject, `${i.id}: explanation/remediation outcome mismatch`);
    }
    if (i.kind === 'case') reject(i.body.steps.some(s => s.claim_ids.some(c => !claimIds.has(c))), `${i.id}: unsupported case reasoning`);
    if (i.kind === 'illustration') {
      reject(i.body.labels.some(l => !claimIds.has(l.claim_id)), `${i.id}: anatomical labels lack source mapping`);
      reject(assetHashes[i.body.asset_path] !== i.body.asset_sha256, `${i.id}: illustration bytes/rights/labels require actual asset inspection`);
    }
    if (i.kind === 'quest') {
      reject(items.get(i.body.lesson_id)?.kind !== 'lesson', `${i.id}: missing reviewed concept lesson`);
      const questionIds = [...i.body.challenge_ids, ...i.body.fresh_item_ids, ...i.body.delayed_probes.flatMap(d => d.item_ids)];
      reject(duplicates(questionIds) || questionIds.some(q => items.get(q)?.kind !== 'question'), `${i.id}: fresh/delayed probes must use distinct reviewed questions`);
      const fingerprints = questionIds.map(q => items.get(q)).filter(q => q?.kind === 'question').map(q =>
        digest({ stem: q.body.stem.trim().toLowerCase(), options: q.body.options.map(o => o.text.trim().toLowerCase()).sort() }));
      reject(duplicates(fingerprints), `${i.id}: changing IDs cannot turn repeated question text into fresh retrieval`);
      reject(duplicates(i.body.delayed_probes.map(d => d.days)), `${i.id}: all 1/7/30-day retention probes required`);
      reject(duplicates(i.body.transfer_case_ids) || i.body.transfer_case_ids.some(c => items.get(c)?.kind !== 'case'), `${i.id}: novel application case required`);
      for (const linked of [i.body.lesson_id, ...questionIds, ...i.body.transfer_case_ids])
        reject(!items.get(linked)?.outcome_ids.some(o => i.outcome_ids.includes(o)), `${i.id}: exercise ${linked} does not assess the quest outcome`);
    }
    const previous = history.flatMap(h => h.item_versions ?? []).filter(v => v.id === i.id);
    reject(previous.some(v => v.version === i.version && v.content_sha256 !== i.content_sha256), `${i.id}: immutable teaching version changed`);
    reject(previous.some(v => v.version > i.version), `${i.id}: teaching version rollback`);
    for (const w of withdrawals) {
      const affected = w.release_id === p.release_id || w.affected_item_ids?.includes(i.id) || i.claims.some(c => c.source_ids.some(s => w.affected_source_ids?.includes(s)));
      if (!affected) continue;
      reject(w.status !== 'resolved' || w.release_id === p.release_id || w.resolved_by_release !== p.release_id || !w.resolution_evidence || !p.resolved_report_ids.includes(w.id) || !w.reported_on || p.review.reviewed_on < w.reported_on, `${i.id}: unresolved error report/withdrawal; new signed correction release required`);
    }
  }
  reject(history.some(h => h.release_id === p.release_id && (h.version !== p.version || h.package_digest !== packageDigest(p))), 'Existing release identity/history cannot be rewritten');
  reject(p.supersedes !== null && !history.some(h => h.release_id === p.supersedes), 'Superseded release must remain in immutable history');
  return { structural_gate_passed: blockers.length === 0, clinical_publication: 'LOCKED', blockers };
}
