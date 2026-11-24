/**
 * READ-ONLY live production verification.
 * A new Cloudflare deploy may briefly serve fresh SSR HTML before every edge can serve
 * its hashed assets. Verify ALL routes in fresh browsers and retry the ENTIRE suite for
 * a bounded propagation window. Persistent failures are fatal, never downgraded.
 * No login, response bodies, credentials, cookies or private candidate data are recorded.
 */
import { chromium, devices } from "@playwright/test";
import { verifyWithPropagationRetries } from "./verify-propagation.mjs";

const origin = process.env.DENTPREP_LIVE_ORIGIN ?? "https://dentprep.gauravjoshi2999.workers.dev";
const parsed = new URL(origin);
if (
  parsed.protocol !== "https:" ||
  parsed.username ||
  parsed.password ||
  parsed.pathname !== "/" ||
  parsed.search ||
  parsed.hash
) {
  throw new Error("Live origin must be a bare HTTPS origin.");
}

const expectedRevision = process.env.DENTPREP_EXPECTED_REVISION;
if (expectedRevision && !/^[a-f0-9]{40}$/.test(expectedRevision)) {
  throw new Error("Expected Git revision must be 40 hex characters.");
}

const routes = ["/", "/start", "/dashboard", "/library", "/practice", "/interviews"];
const browser = await chromium.launch({ headless: true });
try {
  await verifyWithPropagationRetries(
    async (pass) => {
      let failed = false;
      for (const [device, options] of [
        ["mobile", devices["Pixel 5"]],
        ["desktop", devices["Desktop Chrome"]],
      ]) {
        // New context on every pass prevents an earlier broken cache from masking recovery.
        const context = await browser.newContext(options);
        try {
          for (const route of routes) {
            const page = await context.newPage();
            const pageErrors = [];
            const consoleErrors = [];
            const failedAssets = [];
            const redacted = text => String(text)
              .replace(/sb_(?:publishable|secret)_[A-Za-z0-9_-]+/g, "[redacted-api-key]")
              .replace(/Bearer\s+[^\s]+/gi, "Bearer [redacted]")
              .slice(0, 650);
            page.on("console", message => {
              if (message.type() === "error" && consoleErrors.length < 6) {
                consoleErrors.push(redacted(message.text()));
              }
            });
            page.on("pageerror", error => pageErrors.push(redacted(error?.message ?? error)));
            page.on("response", response => {
              const url = new URL(response.url());
              if (
                url.origin === parsed.origin &&
                url.pathname.startsWith("/assets/") &&
                response.status() >= 400
              ) {
                failedAssets.push([url.pathname, response.status()]);
              }
            });
            try {
              const address = new URL(route, origin);
              address.searchParams.set("dentprep_verify_browser", pass + "-" + Date.now());
              const response = await page.goto(address.href, {
                waitUntil: "domcontentloaded",
                timeout: 20_000,
              });
              await page.waitForTimeout(2000);
              const rootBoundary = await page.getByRole("heading", {
                name: "This page didn't load",
              }).count();
              const textContent = await page.locator("body").innerText();
              const blankContent = textContent.trim().length < 25;
              const title = await page.title();
              const result = {
                pass,
                device,
                route,
                http: response?.status(),
                title: title.slice(0, 110),
                rootBoundary: rootBoundary > 0,
                blankContent,
                bodyExcerpt: textContent.slice(0, 140).replace(/\s+/g, " "),
                pageErrors: pageErrors.slice(0, 4),
                consoleErrors: consoleErrors.slice(0, 5),
                failedAssets: failedAssets.slice(0, 5),
              };
              if (
                (response?.status() ?? 0) !== 200 ||
                rootBoundary ||
                blankContent ||
                pageErrors.length ||
                failedAssets.length
              ) failed = true;
              console.log(JSON.stringify(result));
            } catch (error) {
              failed = true;
              console.log(JSON.stringify({
                pass, device, route, navigationError: redacted(error),
              }));
            } finally {
              await page.close();
            }
          }
        } finally {
          await context.close();
        }
      }

      if (expectedRevision) {
        const response = await fetch(new URL("/api/health", origin), {
          cache: "no-store",
          signal: AbortSignal.timeout(12_000),
        });
        if (response.status !== 200) {
          throw new Error("Production health check failed while verifying browser routes.");
        }
        const health = await response.json();
        if (
          health.app !== "dentprep" ||
          health.status !== "ok" ||
          health.revision !== expectedRevision
        ) {
          throw new Error("Production revision changed or is stale during browser verification.");
        }
      }
      if (failed) {
        throw new Error("A real mobile/desktop browser still received broken pages or assets.");
      }
    },
    {
      // 4 independent, complete passes. Do not silently accept partial success.
      intervalsMs: [0, 5000, 10000, 20000],
      report: msg => console.warn(msg),
    },
  );
} finally {
  await browser.close();
}
console.log("Verified all unauthenticated live browser routes. Authenticated QA remains separate.");
