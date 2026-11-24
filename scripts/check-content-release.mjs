import { readFileSync, readdirSync, realpathSync, existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { evaluatePackage, GATE_IDS, POLICY_VERSION, packageDigest, digest, assertAppendOnlyHistory } from './content-safety.mjs';

const root = realpathSync(process.cwd());
function read(path) {
  const absolute = realpathSync(resolve(root, path));
  if (!absolute.startsWith(`${root}${sep}content${sep}`)) throw Error(`Content path escaped repository: ${path}`);
  return JSON.parse(readFileSync(absolute, 'utf8'));
}
function assert(condition, message) { if (!condition) throw Error(message); }
const curriculum = read('content/curriculum.json');
const inventory = read('content/draft-inventory.json');
const policy = read('content/quality-policy.json');
const reviewers = read('content/reviewers.json').reviewers;
const withdrawals = read('content/withdrawals.json').entries;
const history = read('content/history/index.json').entries;
// Required workflow checkout retains both parents; compare with the previously accepted tree.
// A scratch fixture without git has no historical baseline, and cannot publish anything.
let previousHistory = [];
let baseline = 'HEAD';
try { execFileSync('git', ['rev-parse', '--verify', 'HEAD^'], { stdio: 'ignore' }); baseline = 'HEAD^'; } catch { /* first commit */ }
let previousText = null;
try { previousText = execFileSync('git', ['show', `${baseline}:content/history/index.json`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { /* no previous content ledger */ }
if (previousText !== null) previousHistory = JSON.parse(previousText).entries;
assertAppendOnlyHistory(previousHistory, history);
const today = new Date().toISOString().slice(0, 10);
assert(Array.isArray(reviewers) && Array.isArray(withdrawals) && Array.isArray(history), 'Invalid trusted roster/history/withdrawal registry');
assert(curriculum.groups.length === 15 && new Set(curriculum.groups.map(g => g.slug)).size === 15, 'All 15 distinct existing subject groups are required');
const outcomes = curriculum.groups.flatMap(g => g.outcomes);
assert(outcomes.length > 0 && new Set(outcomes.map(o => o.id)).size === outcomes.length, 'Curriculum outcome IDs must be unique');
assert(outcomes.every(o => ['candidate', 'reviewed', 'withdrawn'].includes(o.status)), 'Unrecognized outcome status');
assert(policy.gates.length === 20 && new Set(policy.gates.map(g => g.id)).size === 20 && GATE_IDS.every(id => policy.gates.some(g => g.id === id)), 'All 20 educational quality checks required');
assert(policy.version === POLICY_VERSION, 'Unknown educational policy version');
assert(new Set(inventory.items.map(i => `${i.kind}:${i.id}`)).size === inventory.items.length, 'Duplicate draft identity');
assert(inventory.items.every(i => curriculum.groups.some(g => g.slug === i.subject) && /^[a-f0-9]{64}$/.test(i.backend_fingerprint)), 'Draft inventory lacks subject/version evidence');
assert(inventory.items.every(i => i.decision === 'BLOCKED' && i.status !== 'published' && i.qualified_approval === null), 'Draft inventory must not silently certify a release');

for (const w of withdrawals) {
  assert(w.id && w.release_id && Array.isArray(w.affected_item_ids) && w.reason && w.reported_on && ['open', 'withdrawn', 'resolved'].includes(w.status), 'Invalid withdrawal/error report');
  assert(w.status !== 'resolved' || (w.resolution_evidence && w.resolved_by_release), 'Report resolution needs review/correction provenance');
}
for (const h of history) {
  assert(/^content\/history\/[a-zA-Z0-9_-]+\.v\d+\.json$/.test(h.path), 'History path is not an immutable snapshot');
  const archived = read(h.path);
  assert(digest(archived) === h.document_sha256 && packageDigest(archived) === h.package_digest && archived.release_id === h.release_id && archived.version === h.version, 'Historical release content was altered');
  assert(Array.isArray(h.item_versions) && h.item_versions.length === archived.items.length && archived.items.every(i => h.item_versions.some(v => v.id === i.id && v.version === i.version && v.content_sha256 === i.content_sha256)), 'History does not retain exact item versions');
}
const releases = readdirSync('content/releases').filter(n => n.endsWith('.json')).sort();
const results = [];
for (const name of releases) {
  assert(/^[a-zA-Z0-9_-]+\.v\d+\.json$/.test(name), 'Use release-id.vVERSION.json package names');
  const p = read(`content/releases/${name}`);
  assert(name === `${p.release_id}.v${p.version}.json`, 'Package filename/identity mismatch');
  const assetHashes = {};
  for (const i of p.items ?? []) {
    if (i.kind !== 'illustration') continue;
    const path = i.body?.asset_path;
    if (typeof path !== 'string' || !/^content\/assets\/[a-zA-Z0-9/_-]+\.(png|jpg|jpeg|svg|webp)$/.test(path) || !existsSync(path)) continue;
    const file = realpathSync(path);
    assert(file.startsWith(`${root}${sep}content${sep}assets${sep}`), 'Illustration path escaped asset directory');
    assetHashes[path] = createHash('sha256').update(readFileSync(file)).digest('hex');
  }
  const result = evaluatePackage(p, { today, reviewers, curriculum, history, withdrawals, assetHashes });
  if (!history.some(h => h.release_id === p.release_id && h.version === p.version && h.document_sha256 === digest(p))) {
    result.structural_gate_passed = false;
    result.blockers.push('Exact signed release must also be retained in immutable history');
  }
  results.push({ file: name, ...result });
}
assert(new Set(results.map(r => r.file.replace(/\.v\d+\.json$/, ''))).size === releases.length, 'Keep only one active version per release identity; archive older versions');
const report = {
  checked_at: new Date().toISOString(), policy_version: policy.version,
  curriculum_groups: curriculum.groups.length, proposed_outcomes: outcomes.length,
  reviewed_outcomes: outcomes.filter(o => o.status === 'reviewed').length,
  completeness: curriculum.status, draft_items_blocked: inventory.items.length,
  clinical_release_packages: releases.length, trusted_reviewers: reviewers.length,
  clinical_publication: 'LOCKED — no database publishing capability; existing guards retained',
  academic_approval: 'NOT established by software checks', results,
};
console.log(JSON.stringify(report, null, 2));
if (results.some(r => !r.structural_gate_passed)) process.exitCode = 1;
