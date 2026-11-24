import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const choice = z.number().int().min(0).max(2);
export const questProgressSchema = z
  .object({
    next_step: z.number().int().min(0).max(8),
    first_correct: z.number().int().min(0).max(8),
    first_choices: z.array(choice).max(8),
    attempt_counts: z.array(z.number().int().min(1).max(100)).max(8),
    revision: z.number().int().nonnegative(),
    completed_at: z.string().nullable(),
    last_result: z
      .object({ step: z.number().int().min(0).max(7), choice, correct: z.boolean() })
      .nullable(),
  })
  .superRefine((state, ctx) => {
    if (
      state.first_correct > state.next_step ||
      state.first_choices.length !== state.attempt_counts.length ||
      state.first_choices.length < state.next_step ||
      state.first_choices.length > state.next_step + 1 ||
      (state.completed_at !== null) !== (state.next_step === 8)
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid study checkpoint; reload your progress",
      });
  });
export type QuestProgress = z.infer<typeof questProgressSchema>;
export const EMPTY_QUEST_PROGRESS: QuestProgress = {
  next_step: 0,
  first_correct: 0,
  first_choices: [],
  attempt_counts: [],
  revision: 0,
  completed_at: null,
  last_result: null,
};
async function invoke(name: string, args: Record<string, unknown>) {
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    name: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
  const { data, error } = await rpc(name, args);
  if (error) throw Error(error.message);
  return questProgressSchema.parse(data);
}
export function loadQuestProgress(course: { id: string; version: number }) {
  return invoke("exam_quest_state", { p_course_id: course.id, p_version: course.version });
}
export function submitQuestAnswer(
  course: { id: string; version: number },
  step: number,
  selected: number,
  revision: number,
  requestId: string,
) {
  return invoke("exam_quest_answer", {
    p_course_id: course.id,
    p_version: course.version,
    p_step: step,
    p_choice: selected,
    p_expected_revision: revision,
    p_request_id: requestId,
  });
}
