import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolveBuildRevision } from './build-revision.mjs';

let gitRevision;
let dirty = false;
try { gitRevision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { /* immutable platform export may omit .git */ }
if (gitRevision) dirty = Boolean(execFileSync('git', ['status', '--porcelain', '--untracked-files=normal'], { encoding: 'utf8' }).trim());
const revision = resolveBuildRevision(process.env, { gitRevision, dirty });
const env = { ...process.env, VITE_DENTPREP_REVISION: revision };
execFileSync(process.execPath, [fileURLToPath(new URL('./prepare-pwa.mjs', import.meta.url))], { env, stdio: 'inherit' });
execFileSync(process.execPath, [fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)), 'build', ...process.argv.slice(2)], { env, stdio: 'inherit' });
console.log(`Versioned application build prepared for ${revision}`);
