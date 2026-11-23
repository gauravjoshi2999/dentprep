import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { PendingStudyTask, CycleTask } from "./study-cycles";
import type { PlanGoal, PlanLength } from "./planner";

async function invoke(
  name: "save_study_cycle" | "pending_study_tasks",
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
export async function pendingStudyTasks(): Promise<{
  tasks: PendingStudyTask[];
  total_pending: number;
}> {
  return z
    .object({
      total_pending: z.number(),
      tasks: z.array(
        z.object({
          id: z.string().uuid(),
          plan_id: z.string().uuid(),
          day_index: z.number(),
          task_date: z.string(),
          task_type: z.enum(["lesson", "practice", "revision", "interview", "case", "test"]),
          subject_id: z.string().uuid().nullable(),
          lesson_id: z.string().uuid().nullable(),
          title: z.string(),
          minutes: z.number(),
          done: z.boolean(),
        }),
      ),
    })
    .parse(await invoke("pending_study_tasks", {}));
}
export async function saveStudyCycle(
  id: string,
  previous: string | null,
  plan: {
    length_days: PlanLength;
    daily_hours: number;
    start_date: string;
    goals: PlanGoal[];
    weak_subject_ids: string[];
  },
  tasks: CycleTask[],
) {
  return z
    .string()
    .uuid()
    .parse(
      await invoke("save_study_cycle", {
        p_id: id,
        p_previous_plan_id: previous,
        p_plan: plan,
        p_tasks: tasks,
      }),
    );
}
