import { test } from "node:test";
import assert from "node:assert/strict";
import { deployedWorkerOrigin } from "./deploy-target.mjs";

test("extracts the exact Worker workers.dev URL from Wrangler's deploy log", () => {
  const output = "Total Upload: 433 KiB\nDeployed dentprep triggers (4.0 sec)\n  https://dentprep.my-workers.workers.dev\nCurrent Version ID: abc";
  assert.equal(deployedWorkerOrigin(output), "https://dentprep.my-workers.workers.dev");
});

test("ignores unrelated links in a deployment log", () => {
  const output = "Documentation: https://developers.cloudflare.com/workers/\nhttps://unrelated.my-workers.workers.dev\nhttps://dentprep.my-workers.workers.dev";
  assert.equal(deployedWorkerOrigin(output), "https://dentprep.my-workers.workers.dev");
});

test("rejects a missing, ambiguous or misleading URL instead of claiming success", () => {
  const invalidLogs = [
    "Deployed successfully but no live URL",
    "https://other.user.workers.dev",
    "https://dentprep.p1.workers.dev https://dentprep.p2.workers.dev",
    "https://other.dentprep.user.workers.dev",
    "https://dentprep.user.workers.dev/malicious",
  ];
  for (const output of invalidLogs) {
    assert.throws(() => deployedWorkerOrigin(output), /Unable to uniquely identify/);
  }
});

test("rejects invalid Worker names", () => {
  assert.throws(() => deployedWorkerOrigin("https://dentprep.user.workers.dev", "../danger"), /Invalid/);
});
