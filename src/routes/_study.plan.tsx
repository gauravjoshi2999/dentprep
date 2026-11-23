import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { generatePlan, type PlanGoal, type PlanLength } from "@/lib/planner";
import {
  casesQuery,
  logActivity,
  planQuery,
  progressQuery,
  questionMetaQuery,
  revisionQuery,
  subjectsQuery,
} from "@/lib/queries";
import { istToday, formatDate } from "@/lib/dates";
import { useUserId } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { RequireUser } from "@/components/app/study-shell";
import { EmptyState, ErrorBlock, LoadingBlock, Notice, PageHeader } from "@/components/app/common";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_study/plan")({
  component: () => (
    <RequireUser>
      <Plan />
    </RequireUser>
  ),
  head: () => ({ meta: [{ title: "Personal study plan — DentPrep" }] }),
});
const goals: [PlanGoal, string][] = [
  ["interview", "General interview"],
  ["recruitment_test", "Question practice"],
  ["clinical", "Clinical revision"],
  ["english", "English communication"],
];
function Plan() {
  const userId = useUserId();
  const qc = useQueryClient();
  const plan = useQuery(planQuery(userId));
  const subjects = useQuery(subjectsQuery());
  const progress = useQuery(progressQuery(userId));
  const revision = useQuery(revisionQuery(userId));
  const questions = useQuery(questionMetaQuery());
  const cases = useQuery(casesQuery());
  const [length, setLength] = useState<PlanLength>(7);
  const [hours, setHours] = useState(2);
  const [startDate, setStartDate] = useState(istToday());
  const [selectedGoals, setSelectedGoals] = useState<PlanGoal[]>(["interview"]);
  const [weak, setWeak] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [pendingTask, setPendingTask] = useState<{ id: string; done: boolean } | null>(null);
  const save = useMutation({
    mutationFn: async () => {
      const tasks = generatePlan({
        lengthDays: length,
        startDate,
        dailyHours: hours,
        goals: selectedGoals,
        subjects: subjects.data ?? [],
        weakSubjectIds: weak,
        completedLessonIds:
          progress.data?.filter((p) => p.status === "completed").map((p) => p.lesson_id) ?? [],
        revisionDueCount: revision.data?.filter((r) => r.due_date <= istToday()).length ?? 0,
        availableQuestionCount: questions.data?.length ?? 0,
        availableCaseCount: cases.data?.length ?? 0,
      });
      // Build the replacement privately first. The previous plan remains usable if an insert fails.
      const id = crypto.randomUUID();
      const { error } = await supabase.from("study_plans").insert({
        id,
        user_id: userId,
        active: false,
        length_days: length,
        start_date: startDate,
        daily_hours: hours,
        goals: selectedGoals,
        weak_subject_ids: weak,
      });
      if (error) throw error;
      const inserted = await supabase
        .from("study_tasks")
        .insert(tasks.map((t) => ({ ...t, user_id: userId, plan_id: id })));
      if (inserted.error) {
        await supabase.from("study_plans").delete().eq("id", id).eq("user_id", userId);
        throw inserted.error;
      }
      const activated = await supabase
        .from("study_plans")
        .update({ active: true })
        .eq("id", id)
        .eq("user_id", userId);
      if (activated.error) throw activated.error;
      const deactivated = await supabase
        .from("study_plans")
        .update({ active: false })
        .eq("user_id", userId)
        .neq("id", id)
        .eq("active", true);
      if (deactivated.error)
        toast.message("Your new plan is saved. Older plans could not be marked inactive.");
      await logActivity();
    },
    onSuccess: () => {
      setCreating(false);
      void qc.invalidateQueries({ queryKey: ["plan", userId] });
      toast.success("Your study plan is ready");
    },
    onError: (e) => toast.error(e.message),
  });
  const toggle = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase
        .from("study_tasks")
        .update({ done, done_at: done ? new Date().toISOString() : null })
        .eq("id", id)
        .eq("user_id", userId);
      if (error) throw error;
      await logActivity();
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["plan", userId] });
      void qc.invalidateQueries({ queryKey: ["activity", userId] });
    },
    onError: (e) => toast.error(e.message),
    onSettled: () => setPendingTask(null),
  });
  const queries = [plan, subjects, progress, revision, questions, cases];
  if (queries.some((q) => q.isPending)) return <LoadingBlock />;
  const failed = queries.find((q) => q.isError);
  if (failed)
    return (
      <ErrorBlock error={failed.error} onRetry={() => queries.forEach((q) => void q.refetch())} />
    );
  function submit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }
  return (
    <>
      <PageHeader
        title="A plan that fits your day"
        description="Prioritize weaker subjects and revisit lessons at spaced intervals. Only published learning content is scheduled."
        actions={
          plan.data && (
            <Button variant="outline" onClick={() => setCreating(!creating)}>
              {creating ? "Keep current plan" : "Create replacement plan"}
            </Button>
          )
        }
      />
      {!questions.data?.length && !subjects.data?.some((s) => s.lessons.length) && (
        <Notice className="mb-6" title="Clinical content is awaiting review">
          Your plan can include study-goal review and general interview communication. Lessons and
          question sessions will become available after publication. Create a replacement plan when
          new material is released.
        </Notice>
      )}
      {(!plan.data || creating) && (
        <form onSubmit={submit} className="surface mb-7 grid gap-5 p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2 text-sm font-semibold">
              Plan length
              <select
                className="study-input"
                value={length}
                onChange={(e) => setLength(Number(e.target.value) as PlanLength)}
              >
                {[7, 15, 30].map((n) => (
                  <option key={n} value={n}>
                    {n} days
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Daily hours
              <input
                className="study-input"
                type="number"
                step={0.5}
                min={0.5}
                max={8}
                required
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Start date
              <input
                className="study-input"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
          </div>
          <fieldset>
            <legend className="mb-3 text-sm font-bold">Preparation goals</legend>
            <div className="flex flex-wrap gap-3">
              {goals.map(([id, label]) => (
                <label
                  key={id}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedGoals.includes(id)}
                    onChange={(e) =>
                      setSelectedGoals(
                        e.target.checked
                          ? [...selectedGoals, id]
                          : selectedGoals.filter((g) => g !== id),
                      )
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-3 text-sm font-bold">Subjects needing more attention</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.data?.map((s) => (
                <label key={s.id} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={weak.includes(s.id)}
                    onChange={(e) =>
                      setWeak(e.target.checked ? [...weak, s.id] : weak.filter((id) => id !== s.id))
                    }
                  />
                  {s.name}
                </label>
              ))}
            </div>
          </fieldset>
          <Button type="submit" size="lg" disabled={save.isPending || !selectedGoals.length}>
            {save.isPending ? "Saving plan…" : "Generate and save study plan"}
          </Button>
        </form>
      )}
      {plan.data && (
        <>
          <p className="mb-5 text-sm text-muted-foreground">
            {plan.data.plan.length_days} day plan · Started {formatDate(plan.data.plan.start_date)}{" "}
            · Up to {plan.data.plan.daily_hours} hours per day ·{" "}
            {plan.data.tasks.filter((t) => t.done).length}/{plan.data.tasks.length} tasks done.
            Marking a task done does not mark its lesson complete.
          </p>
          <div className="grid items-start gap-4 lg:grid-cols-2">
            {Array.from({ length: plan.data.plan.length_days }, (_, day) => {
              const tasks = plan.data?.tasks.filter((t) => t.day_index === day) ?? [];
              return (
                <section className="surface p-5" key={day}>
                  <h2 className="mb-4 flex justify-between gap-3 font-bold">
                    <span>Day {day + 1}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {tasks[0] ? formatDate(tasks[0].task_date) : ""} ·{" "}
                      {tasks.reduce((n, t) => n + t.minutes, 0)} min
                    </span>
                  </h2>
                  <ul className="space-y-4">
                    {tasks.map((t) => {
                      const subject = subjects.data?.find((s) => s.id === t.subject_id);
                      const lesson = subject?.lessons.find((l) => l.id === t.lesson_id);
                      return (
                        <li key={t.id} className="flex items-start gap-3">
                          <input
                            aria-label={`Complete ${t.title}`}
                            type="checkbox"
                            className="mt-1 h-4 w-4"
                            checked={pendingTask?.id === t.id ? pendingTask.done : t.done}
                            disabled={toggle.isPending}
                            onChange={(e) => {
                              const value = { id: t.id, done: e.target.checked };
                              setPendingTask(value);
                              toggle.mutate(value);
                            }}
                          />
                          <div className="min-w-0">
                            <p
                              className={`text-sm font-semibold ${t.done ? "line-through text-muted-foreground" : ""}`}
                            >
                              {t.title}
                            </p>
                            <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                              <span>{t.minutes} min</span>
                              {lesson && subject ? (
                                <Link
                                  to="/lesson/$subjectSlug/$lessonSlug"
                                  params={{ subjectSlug: subject.slug, lessonSlug: lesson.slug }}
                                  className="text-teal underline"
                                >
                                  Open lesson
                                </Link>
                              ) : t.task_type === "interview" ? (
                                <Link to="/interviews" className="text-teal underline">
                                  Practice
                                </Link>
                              ) : ["practice", "test"].includes(t.task_type) ||
                                t.title.startsWith("Revise ") ? (
                                <Link to="/practice" className="text-teal underline">
                                  Open practice
                                </Link>
                              ) : t.task_type === "case" ? (
                                <Link to="/cases" className="text-teal underline">
                                  Open cases
                                </Link>
                              ) : (
                                <Link to="/" hash="notices" className="text-teal underline">
                                  Official notices
                                </Link>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  {!tasks.length && <EmptyState title="No tasks scheduled" />}
                </section>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
