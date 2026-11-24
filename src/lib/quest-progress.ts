import { z } from "zod";
import { queryOptions } from "@tanstack/react-query";
import { STUDY_MANIFEST, STUDY_COURSE_BY_ID } from "@/lib/study-course";
import { supabase } from "@/integrations/supabase/client";

const choice = z.number().int().min(0).max(2);
export const questProgressSchema = z
  .object({
    total_steps: z.number().int().min(1).max(100).default(8),
    content_sha256: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
    next_step: z.number().int().min(0).max(100),
    first_correct: z.number().int().min(0).max(100),
    first_choices: z.array(choice).max(100),
    attempt_counts: z.array(z.number().int().min(1).max(100)).max(100),
    revision: z.number().int().nonnegative(),
    completed_at: z.string().nullable(),
    last_result: z
      .object({ step: z.number().int().min(0).max(99), choice, correct: z.boolean() })
      .nullable(),
  })
  .superRefine((state, ctx) => {
    if (
      state.next_step > state.total_steps ||
      state.first_choices.length > state.total_steps ||
      (state.last_result !== null && state.last_result.step >= state.total_steps) ||
      state.first_correct > state.next_step ||
      state.first_choices.length !== state.attempt_counts.length ||
      state.first_choices.length < state.next_step ||
      state.first_choices.length > state.next_step + 1 ||
      (state.completed_at !== null) !== (state.next_step === state.total_steps)
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid study checkpoint; reload your progress",
      });
  });
export type QuestProgress = z.infer<typeof questProgressSchema>;
export const EMPTY_QUEST_PROGRESS: QuestProgress = {
  total_steps: 8,
  next_step: 0,
  first_correct: 0,
  first_choices: [],
  attempt_counts: [],
  revision: 0,
  completed_at: null,
  last_result: null,
};
export async function studyRpc(name: string, args: Record<string, unknown>) {
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    name: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
  const { data, error } = await rpc(name, args);
  if (error) throw Error(error.message);
  return data;
}
export function checkedProgress(course: { id: string; version: number }, data: unknown) {
  const state = questProgressSchema.parse(data);
  const expected = STUDY_MANIFEST.get(course.id);
  if (
    !expected ||
    expected.content_version !== course.version ||
    state.content_sha256 !== expected.content_sha256 ||
    state.total_steps !== STUDY_COURSE_BY_ID.get(course.id)?.units.length
  )
    throw Error("Study content version changed. Reload the app before continuing.");
  return state;
}
export async function loadQuestProgress(course: { id: string; version: number }) {
  return checkedProgress(
    course,
    await studyRpc("exam_quest_state", { p_course_id: course.id, p_version: course.version }),
  );
}
export async function submitQuestAnswer(
  course: { id: string; version: number },
  step: number,
  selected: number,
  revision: number,
  requestId: string,
) {
  return checkedProgress(
    course,
    await studyRpc("exam_quest_answer", {
      p_course_id: course.id,
      p_version: course.version,
      p_step: step,
      p_choice: selected,
      p_expected_revision: revision,
      p_request_id: requestId,
    }),
  );
}

const overviewSchema = z.array(
  z.object({
    course_id: z.string(),
    content_version: z.number().int().positive(),
    content_sha256: z.string().regex(/^[a-f0-9]{64}$/),
    total_steps: z.number().int().positive().max(100),
    next_step: z.number().int().nonnegative(),
    first_correct: z.number().int().nonnegative(),
    first_choices: z.array(choice),
    attempt_counts: z.array(z.number().int().positive()),
    completed_at: z.string().nullable(),
    required_course_id: z.string().nullable(),
    available_at: z.string().nullable(),
    available: z.boolean(),
    bookmarked: z.boolean().default(false),
  }),
);
export type QuestOverview = z.infer<typeof overviewSchema>[number];
export function questOverviewQuery(owner: string) {
  return queryOptions({
    queryKey: ["source-study", owner],
    enabled: !!owner,
    refetchInterval: 60_000,
    queryFn: async () => {
      if (!owner) throw Error("Sign in to load your study history");
      const rows = overviewSchema.parse(await studyRpc("exam_quest_overview", {}));
      for (const row of rows) {
        const expected = STUDY_MANIFEST.get(row.course_id);
        if (
          expected?.content_version === row.content_version &&
          expected.content_sha256 !== row.content_sha256
        )
          throw Error("Saved study version differs from this app. Reload before continuing.");
      }
      return rows.filter((row) => {
        const expected = STUDY_MANIFEST.get(row.course_id);
        return (
          expected?.content_version === row.content_version &&
          expected.content_sha256 === row.content_sha256
        );
      });
    },
  });
}
export async function toggleStudyBookmark(course: { id: string; version: number }, value: boolean) {
  await studyRpc("exam_study_bookmark", {
    p_course_id: course.id,
    p_version: course.version,
    p_value: value,
  });
}

const availabilitySchema = z.array(
  z.object({
    course_id: z.string(),
    content_version: z.number().int().positive(),
    content_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  }),
);
export function studyAvailabilityQuery() {
  return queryOptions({
    queryKey: ["study-availability"],
    refetchInterval: 60_000,
    queryFn: async () => availabilitySchema.parse(await studyRpc("exam_study_availability", {})),
  });
}
export function studyVersionAvailable(
  rows: z.infer<typeof availabilitySchema> | undefined,
  course: { id: string; version: number },
) {
  const expected = STUDY_MANIFEST.get(course.id);
  return !!rows?.some(
    (row) =>
      row.course_id === course.id &&
      row.content_version === course.version &&
      row.content_sha256 === expected?.content_sha256,
  );
}
