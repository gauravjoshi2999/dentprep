/**
 * READ-ONLY live production diagnostic.
 * CI has good SSR asset checks, but a browser may still encounter React route errors.
 * Never attempts login or records response bodies, credentials, cookies or user data.
 */
import { chromium, devices } from "@playwright/test";

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

const routes = ["/", "/dashboard", "/library", "/practice", "/interviews"];
const browser = await chromium.launch({ headless: true });
let failed = false;
try {
  for (const [name, options] of [
    ["mobile", devices["Pixel 5"]],
    ["desktop", devices["Desktop Chrome"]],
  ]) {
    // Separate clean browser contexts. No saved cookies or login state.
    const context = await browser.newContext(options);
    try {
      for (const route of routes) {
        const page = await context.newPage();
        const pageErrors = [];
        const consoleErrors = [];
        const failedAssets = [];
        const redacted = text => String(text)
          .replace(/sb_(?:publishable|secret)_[A-Za-z0-9_-]+/g, "[redacted-api-key]")
          .replace(/Bearer\\s+[^\\s]+/gi, "Bearer [redacted]")
          .slice(0, 650);
        page.on("console", message => {
          if (message.type() === "error" && consoleErrors.length < 6) consoleErrors.push(redacted(message.text()));
        });
        page.on("pageerror", error => pageErrors.push(String(error?.message ?? error).slice(0, 500)));
        page.on("response", response => {
          const url = new URL(response.url());
          if (url.origin === parsed.origin && url.pathname.startsWith("/assets/") && response.status() >= 400) {
            failedAssets.push([url.pathname, response.status()]);
          }
        });
        try {
          const address = new URL(route, origin);
          address.searchParams.set("diagnostic", "live-20261123");
          const response = await page.goto(address.href, { waitUntil: "domcontentloaded", timeout: 20_000 });
          await page.waitForTimeout(2000);
          const rootBoundary = await page.getByRole("heading", { name: "This page didn't load" }).count();
          const appText = await page.locator("body").innerText();
          const title = await page.title();
          const result = {
            device: name,
            route,
            http: response?.status(),
            title: title.slice(0, 110),
            rootBoundary: rootBoundary > 0,
            bodyExcerpt: appText.slice(0, 140).replace(/\s+/g, " "),
            pageErrors: pageErrors.slice(0, 4),
            consoleErrors: consoleErrors.slice(0, 5),
            failedAssets: failedAssets.slice(0, 5),
          };
          if ((response?.status() ?? 0) >= 400 || rootBoundary || pageErrors.length || failedAssets.length) failed = true;
          console.log(JSON.stringify(result));
        } catch (error) {
          failed = true;
          console.log(JSON.stringify({ device: name, route, navigationError: String(error).slice(0, 500) }));
        } finally {
          await page.close();
        }
      }
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
if (failed) {
  throw new Error("One or more real production routes failed in a fresh browser context.");
}
console.log("All unauthenticated live browser routes passed. Authenticated acceptance is still required.");
