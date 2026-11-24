import assert from "node:assert/strict";
import { createReleaseReader } from "./read-deployment.mjs";
import { verifyWithPropagationRetries } from "./verify-propagation.mjs";

const [address, revision] = process.argv.slice(2);
const origin = new URL(address);
assert(
  origin.protocol === "https:" &&
    !origin.username &&
    !origin.password &&
    !origin.search &&
    !origin.hash &&
    origin.pathname === "/",
  "Provide only the deployed HTTPS origin.",
);
assert(/^[a-f0-9]{40}$/.test(revision ?? ""), "Provide the expected full Git revision.");

const read = createReleaseReader(origin);
await verifyWithPropagationRetries(async (pass) => {
  // Verify the exact commit on every pass: never accept another Worker revision.
  const health = await read("/api/health", "json");
  assert.deepEqual(
    health,
    { app: "dentprep", status: "ok", revision },
    "The live server is not the expected release.",
  );
  // A unique query is important after a deploy: some Cloudflare edges briefly
  // serve a cached HTML shell from the previous asset manifest.
  const html = await read("/?dentprep_verify=" + revision.slice(0, 12) + "-" + pass);
  assert(
    html.includes("DentPrep") && html.includes("Study") && !html.includes("Your app will live here"),
    "The homepage was not rendered by DentPrep.",
  );
  const script = html.match(/src="(\/assets\/[^"<>]+\.js)"/);
  const style = html.match(/href="(\/assets\/[^"<>]+\.css)"/);
  assert(script && style, "The SSR page has no built script/stylesheet assets.");
  // Both the current HTML and its exact hashed assets must resolve. A stale
  // HTML response is not treated as a successful deployment.
  await read(script[1]);
  await read(style[1]);
  const manifest = await read("/manifest.webmanifest", "json");
  assert.equal(manifest.short_name, "DentPrep");
  assert.equal(manifest.start_url, "/dashboard");
  for (const path of ["/start", "/login", "/library", "/offline.html", "/sw.js"]) await read(path);
});
console.log(`Verified live SSR, release ${revision}, assets, routes and PWA at ${origin.origin}.`);
console.log(
  "Authenticated acceptance, real devices and clinical review require separate verification.",
);
