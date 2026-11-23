import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyWithPropagationRetries } from "./verify-propagation.mjs";

test("retries transient stale HTML and missing-asset response before accepting full verification", async () => {
  let count = 0;
  const slept = [], reports = [];
  await verifyWithPropagationRetries(async (pass) => {
    count++;
    assert.equal(pass, count);
    if (count < 3) throw new Error("hashed asset is not yet served");
  }, { intervalsMs: [0, 2, 3, 4], sleep: async (ms) => slept.push(ms), report: (s) => reports.push(s) });
  assert.equal(count, 3);
  assert.deepEqual(slept, [2, 3]);
  assert.equal(reports.length, 2);
});
test("does not report a successful release when every attempt fails", async () => {
  let attempts = 0;
  await assert.rejects(() => verifyWithPropagationRetries(
    async () => { attempts++; throw new Error("HTTP 404 for client asset"); },
    { intervalsMs: [0, 1], sleep: async () => {}, report: () => {} },
  ), /HTTP 404 for client asset/);
  assert.equal(attempts, 2);
});
test("retries unexpected revision mismatches instead of accepting a stale Worker", async () => {
  let count = 0;
  await assert.rejects(() => verifyWithPropagationRetries(async () => {
    count++;
    throw new Error("The live server is not the expected release.");
  }, { intervalsMs: [0, 1, 1], sleep: async () => {}, report: () => {} }), /expected release/);
  assert.equal(count, 3);
});
