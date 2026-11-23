import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

// Additive typed boundary; do not hand-edit Lovable-generated schema types.
const uuid = z.string().uuid();
export const attemptDetailsSchema = z.object({
  answers: z.array(
    z.object({
      question_id: uuid,
      selected_option_id: uuid.nullable(),
      is_correct: z.boolean().nullable(),
    }),
  ),
  reviews: z.array(
    z.object({
      question_id: uuid,
      explanation: z.string(),
      source_note: z.string().nullable(),
      correct_option_id: uuid.nullable(),
    }),
  ),
});
const historySchema = z.array(
  z.object({
    question_id: uuid,
    is_correct: z.boolean(),
    answered_at: z.string(),
    attempt_id: uuid,
  }),
);
async function invoke(
  name: "candidate_attempt_details" | "candidate_answer_history",
  args: Record<string, unknown>,
) {
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    name: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
  const { data, error } = await rpc(name, args);
  if (error) throw new Error(error.message);
  return data;
}
export async function fetchAttemptDetails(id: string) {
  return attemptDetailsSchema.parse(
    await invoke("candidate_attempt_details", { p_attempt_id: id }),
  );
}
export async function fetchAnswerHistory() {
  return historySchema.parse(await invoke("candidate_answer_history", {}));
}
