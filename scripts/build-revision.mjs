/** Exact source identity for both npm builds and the protected release wrapper. */
export function resolveBuildRevision(environment, { gitRevision, dirty = false } = {}) {
  if (dirty) throw Error('Commit source changes before creating a versioned build');
  const platform = [
    environment.WORKERS_CI === '1' ? environment.WORKERS_CI_COMMIT_SHA : undefined,
    environment.GITHUB_ACTIONS === 'true' ? environment.GITHUB_SHA : undefined,
  ].filter(value => value !== undefined && value !== '');
  const candidates = [gitRevision, ...platform, environment.VITE_DENTPREP_REVISION].filter(value => value !== undefined && value !== '');
  if ((!gitRevision && !platform.length) || !candidates.length)
    throw Error('A Git revision or trusted build-platform commit is required');
  if (candidates.some(value => typeof value !== 'string' || !/^[a-f0-9]{40}$/.test(value)))
    throw Error('Malformed build revision; refuse an unversioned build');
  if (new Set(candidates).size !== 1)
    throw Error('Build revision hints disagree with the exact source commit');
  return candidates[0];
}
