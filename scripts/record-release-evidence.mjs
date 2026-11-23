import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";

// Runs only after the required production checks; never copies environment values or logs.
const origin = new URL(process.env.DENTPREP_RELEASE_ORIGIN);
const revision = process.env.GITHUB_SHA;
assert(
  origin.protocol === "https:" &&
    origin.pathname === "/" &&
    !origin.search &&
    !origin.hash &&
    !origin.username &&
    !origin.password,
);
assert(/^[a-f0-9]{40}$/.test(revision ?? ""));
assert.equal(process.env.GITHUB_REPOSITORY, "gauravjoshi2999/dentprep");
const response = await fetch(new URL("/api/health", origin), {
  cache: "no-store",
  redirect: "error",
  signal: AbortSignal.timeout(20_000),
});
assert.equal(response.status, 200);
assert.deepEqual(await response.json(), { app: "dentprep", status: "ok", revision });
await writeFile(
  ".output/release-evidence.json",
  JSON.stringify(
    {
      repository: process.env.GITHUB_REPOSITORY,
      deployed_revision: revision,
      origin: origin.origin,
      verified_at: new Date().toISOString(),
      workflow_run: `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
      revision_check: "PASS",
      other_checks:
        "See the required preceding steps in this workflow run for exact logs. This receipt is not a clinical or real-account certificate.",
      authenticated_manual_qa: "BLOCKED — separate account/browser evidence required",
      clinical_review: "BLOCKED — independent qualified review required",
      physical_device_qa: "NOT RUN by this workflow",
    },
    null,
    2,
  ) + "\n",
);
console.log(`Recorded release evidence for ${revision}.`);
