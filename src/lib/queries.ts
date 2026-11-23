import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Subject = Tables<"subjects">;
export type Lesson = Tables<"lessons">;
export type Question = Tables<"questions">;
export type AnswerOption = Tables<"answer_options">;
export type ClinicalCase = Tables<"clinical_cases">;
export type Notice = Tables<"recruitment_notices">;
export type Profile = Tables<"profiles">;
export type Attempt = Tables<"attempts">;

function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export type SubjectWithLessons = Subject & {
  lessons: Pick<Lesson, "id" | "slug" | "title" | "summary" | "est_minutes" | "sort_order">[];
};

export const subjectsQuery = () =>
  queryOptions({
    queryKey: ["subjects"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const rows = must(
        await supabase
          .from("subjects")
          .select("*, lessons(id, slug, title, summary, est_minutes, sort_order)")
          .eq("status", "published")
          .order("sort_order"),
      ) as SubjectWithLessons[];
      return rows.map((s) => ({ ...s, lessons: [...s.lessons].sort((a, b) => a.sort_order - b.sort_order) }));
    },
  });

export const lessonQuery = (subjectSlug: string, lessonSlug: string) =>
  queryOptions({
    queryKey: ["lesson", subjectSlug, lessonSlug],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const subRes = await supabase.from("subjects").select("*").eq("slug", subjectSlug).maybeSingle();
      if (subRes.error) throw new Error(subRes.error.message);
      const subject = subRes.data;
      if (!subject) return null;
      const lesson = must(
        await supabase.from("lessons").select("*").eq("subject_id", subject.id).eq("slug", lessonSlug).maybeSingle(),
      );
      if (!lesson) return null;
      return { subject, lesson };
    },
  });

export type QuestionMeta = Pick<Question, "id" | "subject_id" | "difficulty" | "topic">;
export const questionMetaQuery = () =>
  queryOptions({
    queryKey: ["question-meta"],
    staleTime: 5 * 60_000,
    queryFn: async () =>
      must(await supabase.from("questions").select("id, subject_id, difficulty, topic").eq("status", "published")) as QuestionMeta[],
  });

export type QuestionWithOptions = Question & { answer_options: Pick<AnswerOption, "id" | "label" | "body" | "sort_order">[] };
export async function fetchQuestions(ids: string[]): Promise<QuestionWithOptions[]> {
  if (ids.length === 0) return [];
  const rows = must(
    await supabase.from("questions").select("*, answer_options(id, label, body, sort_order)").in("id", ids),
  ) as QuestionWithOptions[];
  const order = new Map(ids.map((id, i) => [id, i]));
  return rows
    .map((q) => ({ ...q, answer_options: [...q.answer_options].sort((a, b) => a.sort_order - b.sort_order) }))
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export const profileQuery = (userId: string) =>
  queryOptions({
    queryKey: ["profile", userId],
    queryFn: async () => must(await supabase.from("profiles").select("*").eq("id", userId).maybeSingle()),
  });

export const isAdminQuery = (userId: string) =>
  queryOptions({
    queryKey: ["is-admin", userId],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
      if (error) return false;
      return data === true;
    },
  });

export const progressQuery = (userId: string) =>
  queryOptions({
    queryKey: ["progress", userId],
    queryFn: async () => must(await supabase.from("topic_progress").select("*").eq("user_id", userId)),
  });

export const bookmarksQuery = (userId: string) =>
  queryOptions({
    queryKey: ["bookmarks", userId],
    queryFn: async () =>
      must(await supabase.from("bookmarks").select("*").eq("user_id", userId).order("created_at", { ascending: false })),
  });

export const attemptsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["attempts", userId],
    queryFn: async () =>
      must(
        await supabase
          .from("attempts")
          .select("*")
          .eq("user_id", userId)
          .order("started_at", { ascending: false })
          .limit(200),
      ),
  });

export const answersQuery = (userId: string) =>
  queryOptions({
    queryKey: ["answers", userId],
    queryFn: async () =>
      must(
        await supabase
          .from("test_answers")
          .select("question_id, is_correct, answered_at, attempt_id")
          .eq("user_id", userId)
          .order("answered_at", { ascending: false })
          .limit(1000),
      ),
  });

export const activityQuery = (userId: string) =>
  queryOptions({
    queryKey: ["activity", userId],
    queryFn: async () =>
      must(await supabase.from("daily_activity").select("day, actions").eq("user_id", userId).order("day", { ascending: false }).limit(120)),
  });

export const revisionQuery = (userId: string) =>
  queryOptions({
    queryKey: ["revision", userId],
    queryFn: async () => must(await supabase.from("revision_schedule").select("*").eq("user_id", userId).order("due_date")),
  });

export const casesQuery = () =>
  queryOptions({
    queryKey: ["cases"],
    staleTime: 5 * 60_000,
    queryFn: async () =>
      must(
        await supabase
          .from("clinical_cases")
          .select("id, slug, title, difficulty, presentation, subject_id, subjects(name, slug)")
          .eq("status", "published")
          .order("created_at"),
      ),
  });

export const caseQuery = (slug: string) =>
  queryOptions({
    queryKey: ["case", slug],
    queryFn: async () =>
      must(await supabase.from("clinical_cases").select("*, subjects(name, slug)").eq("slug", slug).maybeSingle()),
  });

export const noticesQuery = () =>
  queryOptions({
    queryKey: ["notices"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const notices = must(
        await supabase.from("recruitment_notices").select("*").eq("status", "published").order("published_on", { ascending: false }),
      );
      const ids = notices.map((n) => n.id);
      const sources = ids.length
        ? must(await supabase.from("content_sources").select("*").eq("entity_type", "notice").in("entity_id", ids))
        : [];
      return notices.map((n) => ({ ...n, sources: sources.filter((s) => s.entity_id === n.id) }));
    },
  });

export const planQuery = (userId: string) =>
  queryOptions({
    queryKey: ["plan", userId],
    queryFn: async () => {
      const planRes = await supabase
        .from("study_plans")
        .select("*")
        .eq("user_id", userId)
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (planRes.error) throw new Error(planRes.error.message);
      const plan = planRes.data;
      if (!plan) return null;
      const tasks = must(
        await supabase.from("study_tasks").select("*").eq("plan_id", plan.id).order("day_index").order("task_type"),
      );
      return { plan, tasks };
    },
  });

export const interviewSessionsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["interviews", userId],
    queryFn: async () =>
      must(
        await supabase
          .from("interview_sessions")
          .select("id, mode, duration_min, status, question_count, started_at, ended_at, interview_feedback(overall)")
          .eq("user_id", userId)
          .order("started_at", { ascending: false })
          .limit(50),
      ),
  });

export async function logActivity() {
  await supabase.rpc("log_activity");
}