import { test, expect, type Page } from "@playwright/test";

const userId = "11111111-1111-4111-8111-111111111111";
const subjectId = "22222222-2222-4222-8222-222222222222";
const attemptId = "33333333-3333-4333-8333-333333333333";
const questionId = "44444444-4444-4444-8444-444444444444";
const optionId = "55555555-5555-4555-8555-555555555555";
const user = {
  id: userId,
  aud: "authenticated",
  role: "authenticated",
  email: "qa@example.test",
  app_metadata: {},
  user_metadata: { full_name: "QA Candidate" },
  created_at: "2026-11-23T00:00:00Z",
};
const token = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: userId, aud: "authenticated", role: "authenticated", exp: 2147483647 })).toString("base64url")}.test-signature`;
const session = {
  access_token: token,
  token_type: "bearer",
  refresh_token: "test-refresh",
  expires_in: 3600,
  expires_at: 2147483647,
  user,
};
const subjects = [
  {
    id: subjectId,
    name: "Study foundations",
    short_name: "Study",
    slug: "study-foundations",
    description: "Learning routines for candidates.",
    status: "published",
    sort_order: 0,
    lessons: [],
  },
];

async function mockBackend(page: Page, signedIn = false, withQuestion = false) {
  // Isolated test-only records: these tests never create accounts or publish clinical content.
  if (signedIn)
    await page.addInitScript(
      (s) => localStorage.setItem("sb-example-auth-token", JSON.stringify(s)),
      session,
    );
  let submitted = false;
  let answered = false;
  let plan: Record<string, unknown> | null = null;
  let tasks: Record<string, unknown>[] = [];
  const interviews: Record<string, unknown>[] = [];
  const question = {
    id: questionId,
    subject_id: subjectId,
    stem: "Which action helps maintain a study routine?",
    topic: "Learning",
    difficulty: "easy",
    status: "published",
    explanation: "A regular study slot makes practice easier to repeat.",
    source_note: "Original test fixture, not clinical content",
    answer_options: [
      { id: optionId, label: "A", body: "Set a regular study slot", sort_order: 0 },
      { id: "other-option", label: "B", body: "Avoid planning", sort_order: 1 },
    ],
  };
  await page.route("https://example.supabase.co/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();
    const body = route.request().postDataJSON();
    let data: unknown = [];
    if (method === "OPTIONS")
      return route.fulfill({
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "*",
          "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
        },
      });
    if (path.includes("/auth/v1/token")) data = session;
    else if (path.includes("/auth/v1/user")) data = user;
    else if (path.endsWith("/rpc/has_role")) data = false;
    else if (path.endsWith("/rpc/start_attempt")) data = attemptId;
    else if (path.endsWith("/rpc/record_answer")) {
      answered = true;
      data = { is_correct: true, correct_option_id: optionId, explanation: question.explanation };
    } else if (path.endsWith("/rpc/submit_attempt")) {
      submitted = true;
      data = { total: 1, answered: 1, correct: 1, score_pct: 100 };
    } else if (path.endsWith("/subjects"))
      data = url.searchParams.has("slug") ? subjects[0] : subjects;
    else if (path.endsWith("/profiles")) data = { id: userId, full_name: "QA Candidate" };
    else if (path.endsWith("/questions")) {
      expect(url.searchParams.get("status")).toBe("eq.published");
      data = withQuestion ? [question] : [];
    } else if (path.endsWith("/lessons")) {
      expect(url.searchParams.get("status")).toBe("eq.published");
      data = null;
    } else if (path.endsWith("/attempts")) {
      const a = {
        id: attemptId,
        user_id: userId,
        title: "MCQ practice",
        mode: "practice",
        question_ids: [questionId],
        total: 1,
        answered: answered ? 1 : 0,
        correct: answered ? 1 : 0,
        score_pct: submitted ? 100 : null,
        status: submitted ? "submitted" : "in_progress",
        timed: false,
        started_at: "2026-11-23T10:00:00Z",
        duration_sec: 60,
      };
      data = url.searchParams.has("id") ? a : submitted ? [a] : [];
    } else if (path.endsWith("/test_answers"))
      data = answered
        ? [
            {
              question_id: questionId,
              selected_option_id: optionId,
              is_correct: true,
              attempt_id: attemptId,
            },
          ]
        : [];
    else if (path.endsWith("/study_plans")) {
      if (method === "POST") plan = body;
      if (method === "PATCH" && plan && url.searchParams.get("id")?.startsWith("eq."))
        plan = { ...plan, ...body };
      data = method === "GET" && plan?.["active"] ? plan : null;
    } else if (path.endsWith("/study_tasks")) {
      if (method === "POST")
        tasks = body.map((t: Record<string, unknown>, i: number) => ({
          ...t,
          id: `task-${i}`,
          done: false,
        }));
      if (method === "PATCH")
        tasks = tasks.map((t) =>
          url.searchParams.get("id") === `eq.${t["id"]}` ? { ...t, ...body } : t,
        );
      data = method === "GET" ? tasks : null;
    } else if (path.endsWith("/interview_sessions")) {
      if (method === "POST")
        interviews.push({ ...body, status: "active", started_at: "2026-11-23T10:00:00Z" });
      if (method === "PATCH") {
        const s = interviews.find((s) => `eq.${s["id"]}` === url.searchParams.get("id"));
        if (s) Object.assign(s, body);
      }
      data = method === "GET" ? interviews : null;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify(data),
    });
  });
}

test("public library and protected pages behave on mobile and desktop", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/library");
  await expect(page.getByRole("heading", { name: "BDS study library" })).toBeVisible();
  await expect(page.getByText("Lessons awaiting review")).toBeVisible();
  await page.getByRole("searchbox").fill("missing subject");
  await expect(page.getByText("No matching subjects")).toBeVisible();
  for (const path of ["/dashboard", "/practice", "/plan", "/progress", "/saved", "/interviews"]) {
    await page.goto(path);
    await expect(page.getByText("Sign in to your study space")).toBeVisible();
  }
  await page.goto("/lesson/study-foundations/unreviewed-topic");
  await expect(page.getByText("Lesson unavailable")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test("sign in opens a real empty dashboard and logout closes private views", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("qa@example.test");
  await page.getByLabel("Password", { exact: true }).fill("test-only-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Welcome, QA" })).toBeVisible();
  await expect(page.getByText("Practice accuracy", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.goto("/dashboard");
  await expect(page.getByText("Sign in to your study space")).toBeVisible();
  await expect(page.getByText("Welcome, QA")).toHaveCount(0);
});

test("practice saves answers through RPCs and displays the submitted score", async ({ page }) => {
  await mockBackend(page, true, true);
  await page.goto("/practice");
  await page.getByRole("button", { name: "Start session", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Which action helps/ })).toBeVisible();
  await page.getByRole("radio", { name: /Set a regular study slot/ }).check();
  await page.getByRole("button", { name: "Save answer", exact: true }).click();
  await expect(page.getByText("Correct", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Finish and view result" }).click();
  await expect(page.getByText("100%", { exact: true })).toBeVisible();
  await expect(page.getByText("1/1", { exact: true })).toBeVisible();
  await expect(
    page.getByText("An independent DentPrep practice result, not an official UPSC score."),
  ).toBeVisible();
});

test("study plans use available content and persist task completion", async ({ page }) => {
  await mockBackend(page, true);
  await page.goto("/plan");
  await page.getByLabel("Plan length").selectOption("7");
  await page.getByLabel("Daily hours").fill("0.5");
  await page.getByRole("button", { name: "Generate and save study plan" }).click();
  await expect(page.getByText("Day 7", { exact: true })).toBeVisible();
  await expect(page.getByText("0/7 tasks done", { exact: false })).toBeVisible();
  await page
    .getByRole("checkbox", {
      name: "Complete Review your study goals and official recruitment information",
    })
    .first()
    .check();
  await expect(page.getByText("1/7 tasks done", { exact: false })).toBeVisible();
});

test("interview answers and reflections survive a saved session reload", async ({ page }) => {
  await mockBackend(page, true);
  await page.goto("/interviews");
  await page.getByRole("button", { name: "Start text practice" }).click();
  await page
    .getByLabel("Your answer", { exact: true })
    .fill("I want to contribute to public service and build a consistent learning routine.");
  await page.getByLabel("What will you improve next time?").fill("Give one concrete example.");
  await page.getByRole("button", { name: "Finish and save practice" }).click();
  await page.getByRole("button", { name: "Back to sessions" }).click();
  await page.getByRole("button", { name: /general.*1 answers.*completed/ }).click();
  await expect(page.getByRole("textbox", { name: "Your answer", exact: true })).toHaveValue(
    /contribute to public service/,
  );
  await expect(page.getByText("Completed session", { exact: false })).toBeVisible();
});
