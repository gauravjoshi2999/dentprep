import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { loadEnv } from "vite";

// Only public backend configuration is carried to this host. No service-role key is needed.
const source = { ...loadEnv("production", process.cwd(), "VITE_SUPABASE_"), ...process.env };
const url = source.VITE_SUPABASE_URL;
const key = source.VITE_SUPABASE_PUBLISHABLE_KEY;
const allowTestBackend = process.argv.includes("--allow-test-backend");
const backend = url ? new URL(url) : undefined;
if (
  !backend ||
  backend.protocol !== "https:" ||
  backend.username ||
  backend.password ||
  backend.pathname !== "/" ||
  backend.search ||
  backend.hash
) {
  throw new Error("Set VITE_SUPABASE_URL to the DentPrep backend's HTTPS origin.");
}
let publicKey = Boolean(key?.startsWith("sb_publishable_") && key.length >= 24);
if (key?.startsWith("eyJ")) {
  try {
    publicKey = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString()).role === "anon";
  } catch {
    publicKey = false;
  }
}
if (!publicKey)
  throw new Error(
    "Use the public publishable/anon key. Secret and service-role keys are rejected.",
  );
if (
  !allowTestBackend &&
  (/example|your-project|localhost/.test(backend.hostname) || /dummy|ci_only/.test(key))
) {
  throw new Error("A production release cannot use the test backend.");
}
const revision = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error("A committed Git revision is required.");
if (
  execFileSync("git", ["status", "--porcelain", "--untracked-files=normal"], {
    encoding: "utf8",
  }).trim()
) {
  throw new Error(
    "Commit source changes before building a release. The live receipt must identify the actual source.",
  );
}
execFileSync("npm", ["run", "build"], {
  stdio: "inherit",
  env: {
    ...process.env,
    VITE_SUPABASE_URL: url,
    VITE_SUPABASE_PUBLISHABLE_KEY: key,
    VITE_DENTPREP_REVISION: revision,
  },
});
const generated = JSON.parse(await readFile(".output/server/wrangler.json", "utf8"));
if (generated.main !== "index.mjs" || generated.assets?.binding !== "ASSETS") {
  throw new Error("Unexpected Nitro output; inspect it before deploying.");
}
const config = {
  ...generated,
  name: "dentprep",
  main: "./server/index.mjs",
  assets: { ...generated.assets, directory: "./public" },
  workers_dev: true,
  preview_urls: false,
  keep_vars: true,
  vars: { SUPABASE_URL: backend.origin, SUPABASE_PUBLISHABLE_KEY: key },
};
await writeFile(".output/release.wrangler.json", JSON.stringify(config, null, 2) + "\n");
await writeFile(
  ".output/release.json",
  JSON.stringify({ revision, test_backend: allowTestBackend }, null, 2) + "\n",
);
console.log(
  `Release prepared for ${revision}${allowTestBackend ? " (test backend; dry run only)" : ""}.`,
);
