import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveBuildRevision } from './build-revision.mjs';
const a = 'a'.repeat(40);
const b = 'b'.repeat(40);
test('ordinary builds derive their exact committed source without a special release variable', () => assert.equal(resolveBuildRevision({}, { gitRevision: a }), a));
test('protected release and GitHub identity must agree with source', () => assert.equal(resolveBuildRevision({ VITE_DENTPREP_REVISION: a, GITHUB_ACTIONS: 'true', GITHUB_SHA: a }, { gitRevision: a }), a));
test('Cloudflare immutable source export can use the documented platform commit', () => assert.equal(resolveBuildRevision({ WORKERS_CI: '1', WORKERS_CI_COMMIT_SHA: a }), a));
test('stale configured revision cannot label a different source build', () => assert.throws(() => resolveBuildRevision({ VITE_DENTPREP_REVISION: b }, { gitRevision: a }), /disagree/));
test('platform and Git mismatch cannot claim success', () => assert.throws(() => resolveBuildRevision({ WORKERS_CI: '1', WORKERS_CI_COMMIT_SHA: b }, { gitRevision: a }), /disagree/));
test('dirty working tree cannot pretend to be the committed release', () => assert.throws(() => resolveBuildRevision({}, { gitRevision: a, dirty: true }), /Commit source/));
test('unknown source and a caller-supplied revision alone are rejected', () => {
  assert.throws(() => resolveBuildRevision({}), /required/);
  assert.throws(() => resolveBuildRevision({ VITE_DENTPREP_REVISION: a }), /required/);
});
test('malformed and unauthenticated platform hints do not mint a receipt', () => {
  assert.throws(() => resolveBuildRevision({ WORKERS_CI: '1', WORKERS_CI_COMMIT_SHA: 'main' }), /Malformed/);
  assert.throws(() => resolveBuildRevision({ WORKERS_CI_COMMIT_SHA: a }), /required/);
});
