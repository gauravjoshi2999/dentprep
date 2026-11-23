import { test, expect } from "@playwright/test";

test("reviewed public notes save locally and remain readable through the offline fallback", async ({
  page,
  context,
}) => {
  const subject = {
    id: "10000000-0000-4000-8000-000000000001",
    slug: "study-routines",
    name: "Study routines",
    status: "published",
  };
  const lesson = {
    id: "20000000-0000-4000-8000-000000000001",
    subject_id: subject.id,
    slug: "regular-practice",
    title: "Regular study practice",
    summary: "Non-clinical test fixture",
    notes_md: "# A consistent routine\nChoose a regular time for learning.",
    status: "published",
    reviewed_on: "2026-11-23",
    est_minutes: 5,
    objectives: [],
    high_yield: [],
    viva_prompts: [],
    references: [],
  };
  await page.route("https://example.supabase.co/**", async (route) => {
    const url = new URL(route.request().url());
    const data = url.pathname.endsWith("/subjects")
      ? subject
      : url.pathname.endsWith("/lessons")
        ? lesson
        : [];
    await route.fulfill({
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify(data),
    });
  });
  await page.goto("/lesson/study-routines/regular-practice");
  await page.getByRole("button", { name: "Save for offline reading", exact: true }).click();
  await expect(
    page.getByText("Lesson saved for offline reading on this device", { exact: true }),
  ).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // A fresh navigation is controlled by the installed worker.
  await page.goto("/offline.html");
  await expect(page.getByRole("button", { name: /^Regular study practice/ })).toBeVisible();
  await context.setOffline(true);
  await page.goto("/library");
  await expect(page.getByRole("heading", { name: "Your offline reading shelf" })).toBeVisible();
  await page.getByRole("button", { name: /^Regular study practice/ }).click();
  await expect(page.locator("#notes")).toContainText("Choose a regular time for learning.");
  const keys = await page.evaluate(() => caches.keys());
  expect(keys.every((k) => k.startsWith("dentprep-offline-"))).toBe(true);
  await context.setOffline(false);
});
