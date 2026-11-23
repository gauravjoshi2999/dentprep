import assert from "node:assert/strict";

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
async function read(path, format = "text") {
  const response = await fetch(new URL(path, origin), {
    redirect: "error",
    signal: AbortSignal.timeout(20_000),
    headers: { "cache-control": "no-cache" },
  });
  assert.equal(response.status, 200, `${path} did not return HTTP 200`);
  return format === "json" ? response.json() : response.text();
}
const health = await read("/api/health", "json");
assert.deepEqual(
  health,
  { app: "dentprep", status: "ok", revision },
  "The live server is not the expected release.",
);
const html = await read("/");
assert(
  html.includes("DentPrep") && html.includes("Study") && !html.includes("Your app will live here"),
  "The homepage was not rendered by DentPrep.",
);
const script = html.match(/src="(\/assets\/[^"<>]+\.js)"/);
const style = html.match(/href="(\/assets\/[^"<>]+\.css)"/);
assert(script && style, "The SSR page has no built script/stylesheet assets.");
await read(script[1]);
await read(style[1]);
const manifest = await read("/manifest.webmanifest", "json");
assert.equal(manifest.short_name, "DentPrep");
assert.equal(manifest.start_url, "/dashboard");
for (const path of ["/login", "/library", "/offline.html", "/sw.js"]) await read(path);
console.log(`Verified live SSR, release ${revision}, assets, routes and PWA at ${origin.origin}.`);
console.log(
  "Authenticated acceptance, real devices and clinical review require separate verification.",
);
