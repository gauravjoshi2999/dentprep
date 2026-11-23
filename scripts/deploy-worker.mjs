import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

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
execFileSync(
  "npx",
  ["--no-install", "wrangler", "deploy", "--config", ".output/release.wrangler.json"],
  {
    stdio: "inherit",
    env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
  },
);
