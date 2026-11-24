import { test, expect, type Page, type Route } from "@playwright/test";
import { randomUUID } from "node:crypto";

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

async function mockBackend(
  page: Page,
  signedIn = false,
  withQuestion = false,
  admin = false,
  exam = false,
  evidenceConflict = false,
  logoutDelayMs = 0,
) {
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
  const history: Record<string, unknown>[] = [];
  const carriedSources = new Set<string>();
  const interviews: Record<string, unknown>[] = [];
  const drafts: Record<string, unknown>[] = [];
  const preparationRecords: Record<string, unknown>[] = [];
  let preparationFingerprint = "a".repeat(64);
  let firstPreparationSave = true;
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
    if (path.includes("/auth/v1/logout")) {
      // Model delayed successful revocation so acceptance must await app completion.
      if (logoutDelayMs) await new Promise((resolve) => setTimeout(resolve, logoutDelayMs));
      return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*" } });
    }
    if (path.includes("/auth/v1/token")) data = session;
    else if (path.includes("/auth/v1/user")) data = user;
    else if (path.endsWith("/rpc/has_role")) data = admin;
    else if (path.endsWith("/rpc/admin_content_evidence")) {
      expect(admin).toBe(true);
      const target = drafts.find((d) => d.id === body.p_entity_id);
      expect(target).toBeTruthy();
      const history = preparationRecords.filter((r) => r.entity_id === body.p_entity_id);
      const latest = history[0] ?? null;
      data = {
        entity: {
          id: body.p_entity_id,
          type: body.p_entity_type,
          title: target?.stem,
          subject_id: subjectId,
          status: target?.status,
        },
        current_fingerprint: preparationFingerprint,
        current_version: latest?.version ?? 0,
        latest,
        history,
        publication_locked: true,
        independent_review: "not_recorded",
        server_today: "2026-11-24",
        mapping_state: latest
          ? latest.content_fingerprint === preparationFingerprint
            ? "matches_draft"
            : "stale"
          : "missing",
      };
    } else if (path.endsWith("/rpc/admin_save_content_evidence")) {
      expect(admin).toBe(true);
      expect(body.p_evidence.clinical_approved).toBeUndefined();
      if (evidenceConflict && firstPreparationSave) {
        firstPreparationSave = false;
        preparationFingerprint = "b".repeat(64);
        return route.fulfill({
          status: 409,
          contentType: "application/json",
          headers: { "access-control-allow-origin": "*" },
          body: JSON.stringify({
            code: "P0001",
            message: "Content changed. Reload the latest draft before recording evidence",
          }),
        });
      }
      expect(body.p_expected_fingerprint).toBe(preparationFingerprint);
      const version = preparationRecords.filter((r) => r.entity_id === body.p_entity_id).length;
      expect(body.p_expected_version).toBe(version);
      preparationRecords.unshift({
        id: body.p_id,
        entity_type: body.p_entity_type,
        entity_id: body.p_entity_id,
        version: version + 1,
        content_fingerprint: preparationFingerprint,
        evidence: body.p_evidence,
        created_by: userId,
        created_at: "2026-11-24T00:00:00Z",
      });
      data = body.p_id;
    } else if (path.endsWith("/rpc/pending_study_tasks")) {
      const pending = tasks.filter((t) => !t.done && !carriedSources.has(String(t.id)));
      data = { total_pending: pending.length, tasks: pending };
    } else if (path.endsWith("/rpc/save_study_cycle")) {
      expect(body.p_previous_plan_id).toBe(plan?.id ?? null);
      if (plan) history.unshift({ ...plan, active: false });
      plan = { ...body.p_plan, id: body.p_id, user_id: userId, active: true };
      tasks.push(
        ...body.p_tasks.map((t: Record<string, unknown>) => {
          if (t.source_task_id) carriedSources.add(String(t.source_task_id));
          return { ...t, id: randomUUID(), plan_id: body.p_id, user_id: userId, done: false };
        }),
      );
      data = body.p_id;
    } else if (path.endsWith("/rpc/admin_questions")) {
      expect(admin).toBe(true);
      data = drafts.map((d) => ({
        topic: "",
        created_at: "2026-11-23T10:00:00Z",
        updated_at: "2026-11-23T10:00:00Z",
        ...d,
      }));
    } else if (path.endsWith("/rpc/candidate_answer_history")) {
      data = submitted
        ? [
            {
              question_id: questionId,
              is_correct: true,
              attempt_id: attemptId,
              answered_at: "2026-11-23T10:00:00Z",
            },
          ]
        : [];
    } else if (path.endsWith("/rpc/candidate_attempt_details")) {
      data = {
        answers: answered
          ? [
              {
                question_id: questionId,
                selected_option_id: optionId,
                is_correct: submitted || !exam ? true : null,
              },
            ]
          : [],
        reviews:
          submitted || (answered && !exam)
            ? [
                {
                  question_id: questionId,
                  explanation: question.explanation,
                  source_note: question.source_note,
                  correct_option_id: optionId,
                },
              ]
            : [],
      };
    } else if (path.endsWith("/rpc/admin_save_question")) {
      expect(admin).toBe(true);
      expect(["draft", "in_review"]).toContain(body.p_question.status);
      expect(body.p_options).toHaveLength(4);
      expect(body.p_options.filter((o: { is_correct: boolean }) => o.is_correct)).toHaveLength(1);
      drafts.push(body.p_question);
      data = body.p_question.id;
    } else if (path.endsWith("/rpc/start_attempt")) data = attemptId;
    else if (path.endsWith("/rpc/record_answer")) {
      answered = true;
      data = exam
        ? { saved: true }
        : { is_correct: true, correct_option_id: optionId, explanation: question.explanation };
    } else if (path.endsWith("/rpc/submit_attempt")) {
      submitted = true;
      data = { total: 1, answered: 1, correct: 1, score_pct: 100 };
    } else if (path.endsWith("/subjects"))
      data = url.searchParams.has("slug") ? subjects[0] : subjects;
    else if (path.endsWith("/profiles")) data = { id: userId, full_name: "QA Candidate" };
    else if (path.endsWith("/questions")) {
      if (url.searchParams.has("status")) {
        expect(url.searchParams.get("status")).toBe("eq.published");
        expect(url.searchParams.get("select")).not.toContain("explanation");
        expect(url.searchParams.get("select")).not.toContain("*");
        const { explanation: _explanation, source_note: _source, ...safe } = question;
        data = withQuestion ? [safe] : [];
      } else {
        expect(admin).toBe(true);
        data = drafts;
      }
    } else if (path.endsWith("/lessons")) {
      if (url.searchParams.has("slug")) {
        expect(url.searchParams.get("status")).toBe("eq.published");
        data = null;
      } else {
        expect(admin).toBe(true);
        data = [];
      }
    } else if (path.endsWith("/attempts")) {
      const a = {
        id: attemptId,
        user_id: userId,
        title: "MCQ practice",
        mode: exam ? "custom" : "practice",
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
    } else if (path.endsWith("/test_answers")) {
      expect(url.searchParams.get("select")).not.toContain("is_correct");
      data = [];
    } else if (path.endsWith("/study_plans")) {
      expect(method).toBe("GET");
      data = url.searchParams.get("active") === "eq.false" ? history : plan;
    } else if (path.endsWith("/study_tasks")) {
      expect(["GET", "PATCH"]).toContain(method);
      if (method === "PATCH")
        tasks = tasks.map((t) =>
          url.searchParams.get("id") === `eq.${t["id"]}` ? { ...t, ...body } : t,
        );
      data =
        method === "GET"
          ? tasks.filter((t) => url.searchParams.get("plan_id") === `eq.${t.plan_id}`)
          : null;
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

test("unreviewed anatomical teaching is absent from public branding", async ({ page }) => {
  await mockBackend(page);
  for (const route of ["/", "/library"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("img", { name: /cross-section.*molar/i })).toHaveCount(0);
    await expect(page.getByText("Enamel", { exact: true })).toHaveCount(0);
    await expect(page.getByText("PDL & cementum", { exact: true })).toHaveCount(0);
  }
});

test("public library and protected pages behave on mobile and desktop", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/library");
  await expect(page.getByRole("heading", { name: "BDS study library" })).toBeVisible();
  await expect(page.getByText("Clinical lessons awaiting independent review")).toBeVisible();
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
  await mockBackend(page, false, false, false, false, false, 200);
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("qa@example.test");
  await page.getByLabel("Password", { exact: true }).fill("test-only-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Welcome, Dr. QA" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Start your dental reference reading" })).toBeVisible();
  // A click dispatches the async handler; navigating immediately can cancel its logout request.
  // Wait for the app's completed-signout navigation and cleared control, then reload a private URL.
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: "Sign out", exact: true })).toHaveCount(0);
  await page.goto("/dashboard");
  await expect(page.getByText("Sign in to your study space")).toBeVisible();
  await expect(page.getByText("Welcome, Dr. QA")).toHaveCount(0);
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

test("exam saves and resumes without correctness or explanations until submission", async ({
  page,
}) => {
  await mockBackend(page, true, true, false, true);
  const explanation = "A regular study slot makes practice easier to repeat.";
  await page.goto(`/attempt/${attemptId}`);
  await expect(page.getByRole("heading", { name: /Which action helps/ })).toBeVisible();
  await expect(page.getByText(explanation, { exact: true })).toHaveCount(0);
  await page.getByRole("radio", { name: /Set a regular study slot/ }).check();
  await page.getByRole("button", { name: "Save answer", exact: true }).click();
  await expect(page.getByText("1 answers saved", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("1 answers saved", { exact: true })).toBeVisible();
  await expect(page.getByText(explanation, { exact: true })).toHaveCount(0);
  await expect(page.getByText("Correct", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Finish and view result" }).click();
  await expect(page.getByText("100%", { exact: true })).toBeVisible();
  await expect(page.getByText(explanation, { exact: true })).toBeVisible();
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

test("topic reports show honest empty states and explain distinct-question revision suggestions", async ({
  page,
}) => {
  await mockBackend(page, true);
  await page.goto("/progress");
  await expect(page.getByText("No published-question evidence yet", { exact: true })).toBeVisible();
  const pool = Array.from({ length: 5 }, (_, i) => ({
    id: `64444444-4444-4444-8444-${String(i).padStart(12, "0")}`,
    subject_id: subjectId,
    topic: "Study routines",
    difficulty: "easy",
  }));
  const respond = (json: unknown) => async (route: Route) => {
    if (route.request().method() === "OPTIONS") return route.fallback();
    return route.fulfill({ json, headers: { "access-control-allow-origin": "*" } });
  };
  await page.route("https://example.supabase.co/rest/v1/questions**", respond(pool));
  await page.route(
    "https://example.supabase.co/rest/v1/rpc/candidate_answer_history",
    respond(
      pool.map((q, i) => ({
        question_id: q.id,
        is_correct: i < 2,
        answered_at: "2026-11-23T10:00:00Z",
        attempt_id: attemptId,
      })),
    ),
  );
  await page.route(
    "https://example.supabase.co/rest/v1/attempts**",
    respond([
      {
        id: attemptId,
        user_id: userId,
        status: "submitted",
        title: "QA study-routine practice",
        correct: 2,
        answered: 5,
        total: 5,
        score_pct: 40,
        started_at: "2026-11-23T10:00:00Z",
      },
    ]),
  );
  await page.reload();
  const evidence = page.getByRole("region", { name: "Subject and topic practice evidence" });
  await expect(
    evidence.getByRole("row", {
      name: /Study foundations Study routines 2\/5 40% Revise this topic/,
    }),
  ).toBeVisible();
  await expect(evidence.getByText(/not validated mastery, clinical competence/)).toBeVisible();
  await expect(
    evidence.getByRole("link", { name: "Choose subjects to prioritize in your next cycle" }),
  ).toHaveAttribute("href", "/plan");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test("next study cycle carries unfinished work and retains original completion history", async ({
  page,
}) => {
  await mockBackend(page, true);
  await page.goto("/plan");
  await page.getByLabel("Daily hours").fill("0.5");
  await page.getByRole("button", { name: "Generate and save study plan" }).click();
  await page
    .getByRole("checkbox", {
      name: "Complete Review your study goals and official recruitment information",
    })
    .first()
    .check();
  await expect(page.getByText("1/7 tasks done", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Plan next cycle", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: /Carry unfinished tasks forward \(6 available\)/ }),
  ).toBeChecked();
  await page.getByLabel("Plan length").selectOption("15");
  await page.getByRole("button", { name: "Generate and save study plan" }).click();
  await expect(page.getByText(/6 unfinished tasks continued\./)).toBeVisible();
  await expect(page.getByText("Day 15", { exact: true })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /^Complete Continue:/ })).toHaveCount(6);
  await page.getByText("Previous cycles", { exact: true }).click();
  await page.getByLabel("Choose previous cycle").selectOption({ index: 1 });
  await expect(page.getByText("Historical completion: 1/7 tasks", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("checkbox", { name: /^Complete Continue:/ })).toHaveCount(6);
  await page.getByRole("button", { name: "Plan next cycle", exact: true }).click();
  // Six source rows remain as history; they must not return in the unresolved queue.
  await expect(
    page.getByRole("checkbox", { name: /Carry unfinished tasks forward \(18 available\)/ }),
  ).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test("interview answers and reflections survive a saved session reload", async ({ page }) => {
  await mockBackend(page, true);
  await page.goto("/interviews");
  await page.getByRole("button", { name: "Start text practice" }).click();
  await expect(page.getByRole("region", { name: "Optional voice answer dictation" })).toBeVisible();
  await expect(page.getByText(/DentPrep does not.*store the raw audio/)).toBeVisible();
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

test("ordinary candidates cannot access the content administration screen", async ({ page }) => {
  await mockBackend(page, true);
  await page.goto("/admin");
  await expect(page.getByText("Administrator access required")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add draft", exact: true })).toHaveCount(0);
});

async function createDraftQuestion(page: Page) {
  await page.goto("/admin");
  await expect(page.getByRole("link", { name: "Admin", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "MCQs", exact: true }).click();
  await page.getByRole("button", { name: "Add draft", exact: true }).click();
  await page
    .getByLabel("Question stem", { exact: true })
    .fill("QA original study routine question");
  await page
    .getByLabel("Answer explanation", { exact: true })
    .fill("QA explanation for a study routine.");
  for (const [i, label] of ["A", "B", "C", "D"].entries())
    await page.getByLabel(`Answer option ${label}`, { exact: true }).fill(`QA option ${i + 1}`);
  await page.getByLabel("Workflow status").selectOption("in_review");
  await expect(page.getByRole("option", { name: "Published", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Save draft content" }).click();
  await expect(
    page.getByRole("heading", { name: "QA original study routine question", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("in review", { exact: true })).toBeVisible();
}
async function fillPreparation(page: Page) {
  await page.getByLabel("Curriculum unit", { exact: true }).fill("Study routines");
  await page.getByLabel("Curriculum topic", { exact: true }).fill("Communication practice");
  await page
    .getByLabel("Learning outcomes (one per line)")
    .fill("Describe a repeatable practice routine");
  await page.getByLabel("Citation 1", { exact: true }).fill("Synthetic QA reference");
  await page.getByLabel("Edition or version 1").fill("QA version 1");
  await page.getByLabel("Page or section 1").fill("Section A");
}

test("administrators save MCQs through the draft-only transactional API", async ({ page }) => {
  await mockBackend(page, true, false, true);
  await createDraftQuestion(page);
});

test("administrators map outcomes and sources to an immutable draft preparation revision", async ({
  page,
}) => {
  await mockBackend(page, true, false, true);
  await createDraftQuestion(page);
  await page.getByRole("button", { name: "Curriculum & sources", exact: true }).click();
  await expect(page.getByText("No preparation record yet", { exact: false })).toBeVisible();
  await fillPreparation(page);
  await page.getByRole("button", { name: "Save preparation revision", exact: true }).click();
  await expect(
    page.getByText(/Matches current draft.*Latest preparation revision: 1/),
  ).toBeVisible();
  await expect(
    page.getByText("Preparation record, not clinical approval", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "MCQs", exact: true }).click();
  await page.getByRole("button", { name: "Curriculum & sources", exact: true }).click();
  await expect(page.getByLabel("Curriculum unit", { exact: true })).toHaveValue("Study routines");
  await page.getByText("Preparation history (latest 20)", { exact: true }).click();
  await page.getByText(/^Preparation revision 1 ·/).click();
  await expect(page.getByText(/Synthetic QA reference · QA version 1 · Section A/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test("a stale preparation form cannot overwrite changed content and requires explicit reload", async ({
  page,
}) => {
  await mockBackend(page, true, false, true, false, true);
  await createDraftQuestion(page);
  await page.getByRole("button", { name: "Curriculum & sources", exact: true }).click();
  await fillPreparation(page);
  await page.getByRole("button", { name: "Save preparation revision", exact: true }).click();
  await expect(page.getByText("Latest draft required", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save preparation revision", exact: true }),
  ).toBeDisabled();
  await expect(page.getByLabel("Curriculum unit", { exact: true })).toHaveValue("Study routines");
  await page
    .getByRole("button", { name: "Reload latest (discard form changes)", exact: true })
    .click();
  await expect(page.getByLabel("Curriculum unit", { exact: true })).toHaveValue("");
  await fillPreparation(page);
  await page.getByRole("button", { name: "Save preparation revision", exact: true }).click();
  await expect(
    page.getByText(/Matches current draft.*Latest preparation revision: 1/),
  ).toBeVisible();
});

test("approved mobile visual navigation uses real pages and honest study data", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "mobile",
    "Mobile navigation is intentionally hidden on desktop.",
  );
  await mockBackend(page, true);
  await page.goto("/dashboard");
  const nav = page.getByRole("navigation", { name: "Mobile primary navigation" });
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("link", { name: "Home" })).toBeVisible();
  await nav.getByRole("link", { name: "Study" }).click();
  await expect(page.getByRole("heading", { name: "BDS study library" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Clinical", exact: true })).toBeVisible();
  await expect(page.getByText("Clinical review pending", { exact: true })).toBeVisible();
  await nav.getByRole("link", { name: "Interview" }).click();
  await expect(page.getByRole("heading", { name: "Interview communication studio" })).toBeVisible();
  await expect(page.getByText(/Voice and AI clinical scoring are not enabled/)).toBeVisible();
  await nav.getByRole("button", { name: "Profile" }).click();
  await expect(page.getByRole("region", { name: "Profile shortcuts" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test("Day 1 starter is immediately usable without clinical publication", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/start");
  await expect(page.getByRole("heading", { name: "Your first DentPrep quest" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Active recall" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Source: Dunlosky/ })).toHaveAttribute("href", /pubmed/);
  for (const answer of [1, 0, 2, 1]) {
    await page.getByRole("group", { name: "Answer choices" }).getByRole("button").nth(answer).click();
    await expect(page.getByRole("group", { name: "Answer choices" }).getByRole("button").nth(answer)).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Check answer" }).click();
    await expect(page.getByText("Correct — keep practicing this skill")).toBeVisible();
    if (answer !== 1 || await page.getByRole("button", { name: "Next lesson" }).count() > 0) {
      if (await page.getByRole("button", { name: "Next lesson" }).count() > 0)
        await page.getByRole("button", { name: "Next lesson" }).click();
    }
  }
  await page.getByRole("button", { name: "Finish Day 1 starter" }).click();
  await expect(page.getByRole("heading", { name: "Day 1 starter completed" })).toBeVisible();
  await expect(page.getByText(/Guest session: this completion is not saved/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("Day 1 starter corrects mistakes and records signed-in activity only at completion", async ({ page }) => {
  await mockBackend(page, true);
  let activityRequests = 0;
  page.on("request", (req) => {
    if (new URL(req.url()).pathname.endsWith("/rpc/log_activity")) activityRequests += 1;
  });
  await page.goto("/start");
  await page.getByRole("group", { name: "Answer choices" }).getByRole("button").first().click();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByText("Not quite — try another answer")).toBeVisible();
  await expect(page.getByRole("button", { name: "Next lesson" })).toBeDisabled();
  for (const answer of [1, 0, 2, 1]) {
    await page.getByRole("group", { name: "Answer choices" }).getByRole("button").nth(answer).click();
    await expect(page.getByRole("group", { name: "Answer choices" }).getByRole("button").nth(answer)).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Check answer" }).click();
    if (await page.getByRole("button", { name: "Next lesson" }).count() > 0)
      await page.getByRole("button", { name: "Next lesson" }).click();
  }
  await page.getByRole("button", { name: "Finish Day 1 starter" }).click();
  await expect(page.getByText(/Today's activity was recorded in your account/)).toBeVisible();
  expect(activityRequests).toBe(1);
});

test("study focus leads to an honest primary reading path and keeps tools in Profile", async ({ page }, testInfo) => {
  await mockBackend(page, true);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Start your dental reference reading" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Quick actions" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Official recruitment notice" })).toHaveCount(0);
  await page.getByRole("link", { name: "Start source reading" }).click();
  await expect(page).toHaveURL(/\/library#primary-reading$/);
  await expect(page.getByRole("heading", { name: "Oral Cancer Guideline — 2026 chairside guide" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Dental Patients Taking Anticoagulants — professional guide" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Infection Prevention Practices in Dental Settings" })).toBeVisible();
  const cdcCard = page.locator("#source-reading-cdc-dental-infection-prevention");
  await expect(cdcCard.getByRole("link", { name: "Open official guidance" })).toHaveAttribute(
    "href",
    "https://www.cdc.gov/dental-infection-control/hcp/summary/index.html",
  );
  const reviewerForm = cdcCard.getByRole("button", { name: "Prepare senior MDS feedback form" });
  await reviewerForm.click();
  await expect(cdcCard.getByText("It is not a verified MDS sign-off", { exact: false })).toBeVisible();
  await expect(cdcCard.getByRole("button", { name: "Copy review worksheet" })).toBeVisible();
  await expect(page.locator("#source-reading-sdcep-anticoagulants-2022").getByRole("link", { name: "Open official guidance" })).toHaveAttribute(
    "href",
    "https://companion.sdcep.org.uk/management-of-dental-patients-taking-anticoagulants-or-antiplatelet-drugs/",
  );
  await expect(page.getByRole("group", { name: "Oral surgery reading checklist" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open official guide (PDF)" })).toHaveAttribute("href", /^https:\/\/www\.ada\.org\/.*2026\/ada_oral_cancer_guideline\.pdf/);
  await expect(page.getByText("Clinical lessons awaiting independent review")).toBeVisible();
  const checklist = page.getByRole("group", { name: "Your reading checklist" });
  await expect(checklist.getByRole("checkbox")).toHaveCount(4);
  for (const checkbox of await checklist.getByRole("checkbox").all()) await checkbox.check();
  await expect(page.getByText(/Reading checklist complete/)).toBeVisible();
  await page.reload();
  for (const checkbox of await page.getByRole("group", { name: "Your reading checklist" }).getByRole("checkbox").all()) await expect(checkbox).not.toBeChecked();
  const navigation = page.getByRole("navigation", { name: testInfo.project.name === "mobile" ? "Mobile primary navigation" : "Learning navigation", exact: true });
  await expect(navigation.getByRole("link")).toHaveCount(4);
  await navigation.getByRole("button", { name: "Profile", exact: true }).click();
  const profile = page.getByRole("region", { name: "Profile shortcuts" });
  await expect(profile).toBeVisible();
  await expect(profile.getByRole("link", { name: "My progress" })).toHaveAttribute("href", "/progress");
  await expect(profile.getByRole("link", { name: "Saved questions & lessons" })).toHaveAttribute("href", "/saved");
  await profile.getByRole("link", { name: "Study plan", exact: true }).click();
  await expect(page).toHaveURL(/\/plan$/);
  await expect(page.getByLabel("Daily hours")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
