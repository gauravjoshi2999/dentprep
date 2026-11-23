import { test } from "node:test";
import assert from "node:assert/strict";
import { createReleaseReader } from "./read-deployment.mjs";

const origin = new URL("https://dentprep.example");
test("accepts Cloudflare's one-hop .html canonicalization and verifies its response", async () => {
  const calls = [];
  const read = createReleaseReader(origin, async (url, options) => {
    calls.push({ url: url.href, redirect: options.redirect });
    return url.pathname.endsWith(".html")
      ? new Response(null, { status: 307, headers: { location: "/offline" } })
      : new Response("Offline notes");
  });
  assert.equal(await read("/offline.html"), "Offline notes");
  assert.deepEqual(calls, [
    { url: "https://dentprep.example/offline.html", redirect: "manual" },
    { url: "https://dentprep.example/offline", redirect: "error" },
  ]);
});
test("never follows a redirect to a different origin", async () => {
  let requests = 0;
  const read = createReleaseReader(origin, async () => {
    requests++;
    return new Response(null, {
      status: 307,
      headers: { location: "https://another.example/offline" },
    });
  });
  await assert.rejects(() => read("/offline.html"), /Unexpected redirect/);
  assert.equal(requests, 1);
});
test("does not accept a login redirect as a healthy server", async () => {
  const read = createReleaseReader(
    origin,
    async () => new Response(null, { status: 302, headers: { location: "/login" } }),
  );
  await assert.rejects(() => read("/api/health", "json"), /HTTP 200/);
});
test("rejects failed canonical targets and off-origin assets", async () => {
  const read = createReleaseReader(origin, async (url) =>
    url.pathname.endsWith(".html")
      ? new Response(null, { status: 307, headers: { location: "/offline" } })
      : new Response("Failure", { status: 500 }),
  );
  await assert.rejects(() => read("/offline.html"), /HTTP 200/);
  await assert.rejects(() => read("https://another.example/script.js"), /deployed origin/);
});
