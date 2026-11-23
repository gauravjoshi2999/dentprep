import { appendFile, readFile } from "node:fs/promises";
import { execFileSync, spawnSync } from "node:child_process";
import { deployedWorkerOrigin } from "./deploy-target.mjs";

const receipt = JSON.parse(await readFile(".output/release.json", "utf8"));
const revision = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (receipt.test_backend !== false || receipt.revision !== revision) {
  throw new Error(
    "Build a real release from the current commit before deploying. Test/stale builds cannot be published.",
  );
}
if (
  execFileSync("git", ["status", "--porcelain", "--untracked-files=normal"], {
    encoding: "utf8",
  }).trim()
) {
  throw new Error("Source changed since the release was prepared. Commit, test and rebuild first.");
}
if (process.argv.length > 2)
  throw new Error("This release command does not accept configuration overrides.");

const run = spawnSync(
  "npx",
  ["--no-install", "wrangler", "deploy", "--config", ".output/release.wrangler.json"],
  {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
  },
);
if (run.stdout) process.stdout.write(run.stdout);
if (run.stderr) process.stderr.write(run.stderr);
if (run.error) throw run.error;
if (run.status !== 0) {
  throw new Error("Cloudflare deployment failed; no live verification is claimed.");
}
// Only the exact DentPrep workers.dev origin may be sent to GitHub step outputs.
// Never emit credentials, temporary claim URLs, or arbitrary redirects.
if (process.env.GITHUB_OUTPUT) {
  const workerUrl = deployedWorkerOrigin(String(run.stdout ?? "") + "\n" + String(run.stderr ?? ""));
  await appendFile(process.env.GITHUB_OUTPUT, "worker_url=" + workerUrl + "\n");
  console.log("Captured exact DentPrep workers.dev origin for live verification.");
}
