import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";

// Execute the actual built Worker, independently of Vite dev and mocked browser data.
const { revision } = JSON.parse(await readFile(".output/release.json", "utf8"));
const worker = spawn(
  "npx",
  [
    "--no-install",
    "wrangler",
    "dev",
    "--local",
    "--config",
    ".output/release.wrangler.json",
    "--ip",
    "127.0.0.1",
    "--port",
    "8790",
    "--inspector-port",
    "0",
    "--log-level",
    "error",
    "--show-interactive-dev-session",
    "false",
  ],
  {
    env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  },
);
let diagnostic = "";
for (const stream of [worker.stdout, worker.stderr])
  stream.on("data", (chunk) => {
    diagnostic = (diagnostic + chunk).slice(-6_000);
  });
let spawnError;
worker.on("error", (error) => {
  spawnError = error;
});
try {
  let response;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (spawnError) throw spawnError;
    if (worker.exitCode !== null) throw new Error("Built Worker exited before becoming ready.");
    try {
      response = await fetch("http://127.0.0.1:8790/api/health", {
        signal: AbortSignal.timeout(1_000),
      });
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  assert(response, "Built Worker did not start within 30 seconds.");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { app: "dentprep", status: "ok", revision });
  const home = await fetch("http://127.0.0.1:8790/", { signal: AbortSignal.timeout(15_000) });
  assert.equal(home.status, 200);
  const homeHtml = await home.text();
  assert(homeHtml.includes("DentPrep"), "Built Worker did not render the DentPrep shell.");
  // A successful HTTP 200 containing only the root error boundary is NOT a healthy app.
  assert(
    homeHtml.includes("Study with clarity.") && !homeHtml.includes("This page didn't load"),
    "Built Worker served the React root error boundary instead of the actual homepage.",
  );
  const manifest = await fetch("http://127.0.0.1:8790/manifest.webmanifest");
  assert.equal((await manifest.json()).short_name, "DentPrep");
  console.log(`Built Cloudflare Worker served release ${revision}, SSR and PWA successfully.`);
} catch (error) {
  console.error(diagnostic);
  throw error;
} finally {
  if (worker.pid) {
    try {
      process.kill(-worker.pid, "SIGTERM");
    } catch {
      /* Already stopped. */
    }
  }
}
