import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

// Narrow boundary for additive RPCs, without hand-editing Lovable-generated database types.
async function invoke(
  name: "admin_question_options" | "admin_save_question",
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
const optionSchema = z.object({
  id: z.string().uuid(),
  question_id: z.string().uuid(),
  label: z.string(),
  body: z.string(),
  is_correct: z.boolean(),
  sort_order: z.number(),
});
export async function adminQuestionOptions(id: string): Promise<Tables<"answer_options">[]> {
  return z.array(optionSchema).parse(await invoke("admin_question_options", { p_question_id: id }));
}
export async function adminSaveQuestion(
  question: {
    id: string;
    subject_id: string;
    stem: string;
    explanation: string;
    source_note: string;
    difficulty: "easy" | "medium" | "hard";
    status: "draft" | "in_review";
  },
  options: { id?: string; body: string; is_correct: boolean }[],
) {
  return z
    .string()
    .uuid()
    .parse(await invoke("admin_save_question", { p_question: question, p_options: options }));
}
