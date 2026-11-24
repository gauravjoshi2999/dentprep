import { useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { type PlanGoal, type PlanLength } from "@/lib/planner";
import { generateCycle, type CycleTask } from "@/lib/study-cycles";
import { pendingStudyTasks, saveStudyCycle } from "@/lib/study-cycle-api";
import {
  casesQuery,
  logActivity,
  planQuery,
  progressQuery,
  questionMetaQuery,
  revisionQuery,
  subjectsQuery,
} from "@/lib/queries";
import { istToday, formatDate, addDays, diffDays } from "@/lib/dates";
import { SUBJECT_STUDY_BRIEFS, STUDY_BRIEF_BY_SLUG } from "@/lib/subject-study-briefs";
import { ALL_DENTAL_READINGS } from "@/lib/primary-reading";
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
  const pending = useQuery({
    queryKey: ["pending-study-tasks", userId],
    queryFn: pendingStudyTasks,
  });
  const [length, setLength] = useState<PlanLength>(7);
  const [hours, setHours] = useState(2);
  const [startDate, setStartDate] = useState(istToday());
  const [selectedGoals, setSelectedGoals] = useState<PlanGoal[]>(["interview"]);
  const [weak, setWeak] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [carry, setCarry] = useState(true);
  const [cycleSummary, setCycleSummary] = useState<string | null>(null);
  const request = useRef<{
    fingerprint: string;
    id: string;
    previous: string | null;
    settings: Parameters<typeof saveStudyCycle>[2];
    tasks: CycleTask[];
    carried: number;
    deferred: number;
  } | null>(null);
  const [pendingTask, setPendingTask] = useState<{ id: string; done: boolean } | null>(null);
  const save = useMutation({
    mutationFn: async () => {
      const settings = {
        length_days: length,
        start_date: startDate,
        daily_hours: hours,
        goals: selectedGoals,
        weak_subject_ids: weak,
      };
      const fingerprint = JSON.stringify({ settings, carry });
      // Retain the entire intent on a lost response; retrying must not create a second cycle.
      if (request.current?.fingerprint === fingerprint) {
        const old = request.current;
        await saveStudyCycle(old.id, old.previous, old.settings, old.tasks);
        return old;
      }
      // Skip already checked source-study topics across earlier cycles.
      // These are reading checkmarks, not verified clinical mastery.
      const { data: studied, error: studiedError } = await supabase
        .from("study_tasks")
        .select("title")
        .eq("user_id", userId)
        .eq("done", true)
        .eq("task_type", "revision")
        .like("title", "Source study:%")
        .limit(200);
      if (studiedError) throw new Error(studiedError.message);
      const cycle = generateCycle(
        {
          lengthDays: length,
          startDate,
          dailyHours: hours,
          goals: selectedGoals,
          subjects: subjects.data ?? [],
          weakSubjectIds: weak,
          completedLessonIds:
            progress.data?.filter((p) => p.status === "completed").map((p) => p.lesson_id) ?? [],
          revisionDueCount:
            revision.data?.filter(
              (r) =>
                r.due_date <= istToday() && questions.data?.some((q) => q.id === r.question_id),
            ).length ?? 0,
          availableQuestionCount: questions.data?.length ?? 0,
          availableCaseCount: cases.data?.length ?? 0,
          completedGuideTitles: (studied ?? []).map((row) => row.title),
        },
        carry ? (pending.data?.tasks ?? []) : [],
      );
      const intent = {
        fingerprint,
        id: crypto.randomUUID(),
        previous: plan.data?.plan.id ?? null,
        settings,
        ...cycle,
        deferred: carry
          ? cycle.deferred +
            Math.max(0, (pending.data?.total_pending ?? 0) - (pending.data?.tasks.length ?? 0))
          : (pending.data?.total_pending ?? 0),
      };
      request.current = intent;
      await saveStudyCycle(intent.id, intent.previous, intent.settings, intent.tasks);
      return intent;
    },
    onSuccess: (saved) => {
      setCreating(false);
      request.current = null;
      setCycleSummary(
        `${saved.carried} unfinished tasks continued. ${saved.deferred} historical unfinished tasks were not scheduled and remain in your history/queue; unavailable content is not scheduled.`,
      );
      for (const key of ["plan", "pending-study-tasks", "plan-history"])
        void qc.invalidateQueries({ queryKey: [key, userId] });
      toast.success("Your next study cycle is ready");
    },
    onError: (e) => {
      toast.error(e.message);
      void qc.invalidateQueries({ queryKey: ["plan", userId] });
      if (e.message.includes("cycle changed") || e.message.includes("unfinished task changed")) {
        void qc.invalidateQueries({ queryKey: ["pending-study-tasks", userId] });
        request.current = null;
        setCreating(false);
      }
    },
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
      void qc.invalidateQueries({ queryKey: ["pending-study-tasks", userId] });
    },
    onError: (e) => toast.error(e.message),
    onSettled: () => setPendingTask(null),
  });
  const queries = [plan, subjects, progress, revision, questions, cases, pending];
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
  function startSubjectCycle() {
    nextCycle();
    setCarry(false); // Explicitly opt out of copying stale legacy task repetition.
  }
  function nextCycle() {
    if (plan.data) {
      setLength(plan.data.plan.length_days as PlanLength);
      setHours(plan.data.plan.daily_hours);
      const chosen = plan.data.plan.goals.filter((g): g is PlanGoal =>
        goals.some(([id]) => id === g),
      );
      setSelectedGoals(chosen.length ? chosen : ["interview"]);
      setWeak(
        plan.data.plan.weak_subject_ids.filter((id) => subjects.data?.some((s) => s.id === id)),
      );
    }
    setStartDate(istToday());
    setCarry(true);
    request.current = null;
    setCreating(true);
  }
  const dayOffset = Math.max(0, diffDays(istToday(), plan.data?.plan.start_date ?? istToday()));
  const todayGuide = plan.data?.tasks.find(
    (t) => t.task_date === istToday() && /^(Continue: )*Source study:/.test(t.title),
  );
  const todaySubject = subjects.data?.find((s) => s.id === todayGuide?.subject_id);
  const currentBrief =
    STUDY_BRIEF_BY_SLUG.get(todaySubject?.slug ?? "") ??
    SUBJECT_STUDY_BRIEFS[dayOffset % SUBJECT_STUDY_BRIEFS.length];
  const currentChapter = currentBrief
    ? (currentBrief.chapters.find((chapter) => todayGuide?.title.endsWith(` — ${chapter.title}`)) ??
      currentBrief.chapters[dayOffset % currentBrief.chapters.length])
    : undefined;
  const currentSource = ALL_DENTAL_READINGS.find(
    (source) => source.subjectSlug === currentBrief?.slug,
  );
  return (
    <>
      <PageHeader
        title="A plan that fits your day"
        description="Prepare for UPSC Dental Surgeon one topic at a time: learn, practise, check your explanation and revise."
        actions={
          plan.data && (
            <Button
              variant="outline"
              disabled={save.isPending || toggle.isPending}
              onClick={() =>
                creating ? (setCreating(false), (request.current = null)) : nextCycle()
              }
            >
              {creating ? "Keep current cycle" : "Plan next cycle"}
            </Button>
          )
        }
      />
      <Notice className="mb-6" title="Renewable planning cycles">
        No exam date has been set for this plan. A 7, 15 or 30-day cycle is not your course duration
        or an official UPSC deadline. Continue with another cycle whenever needed; completed history
        is retained.
      </Notice>
      {cycleSummary && <Notice className="mb-6">{cycleSummary}</Notice>}
      {plan.data && currentBrief && currentSource && (
        <section
          className="surface mb-6 border-teal/40 bg-teal-soft/20 p-5"
          aria-label="Today's dental subject focus"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-teal">
            Available now · Today's dental study
          </p>
          <h2 className="mt-2 text-xl font-extrabold">{currentBrief.name}</h2>
          <p className="mt-2 text-sm font-semibold">{currentChapter?.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{currentChapter?.task}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Original-source study, not an approved clinical lesson. Choose your daily tasks below,
            or create a new subject-focused schedule.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/library"
              hash={
                currentSource.id === "ada-oral-cancer-2026"
                  ? "primary-reading"
                  : `source-reading-${currentSource.id}`
              }
              className="text-sm font-bold text-teal underline underline-offset-4"
            >
              Open original source →
            </Link>
            <Link
              to="/library"
              hash="study-guides"
              className="text-sm font-bold text-teal underline underline-offset-4"
            >
              All 15 subject guides
            </Link>
          </div>
          {!creating && (
            <Button
              className="mt-4"
              variant="outline"
              disabled={save.isPending || toggle.isPending}
              onClick={startSubjectCycle}
            >
              Start subject-focused cycle
            </Button>
          )}
        </section>
      )}
      {!questions.data?.length && !subjects.data?.some((s) => s.lessons.length) && (
        <Notice className="mb-6" title="Use your available study paths">
          Start the interactive Public Health chapter or follow a source-reading guide across all 15
          subjects. Your renewable study cycles preserve previous planning history.
        </Notice>
      )}
      {(!plan.data || creating) && (
        <form onSubmit={submit} className="surface mb-7 grid gap-5 p-5 sm:p-7">
          <fieldset disabled={save.isPending || toggle.isPending} className="contents">
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" checked={carry} onChange={(e) => setCarry(e.target.checked)} />
              <span>
                Carry unfinished tasks forward ({pending.data?.total_pending ?? 0} available).
                Untick to start fresh subject-wise study instead of repeating old notice/interview
                tasks. Original history stays saved. Only approved clinical questions/cases are
                scheduled.{" "}
                {(pending.data?.total_pending ?? 0) > 1000 &&
                  "The oldest 1,000 tasks are considered first; the remaining queue is retained."}
              </span>
            </label>
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
                        setWeak(
                          e.target.checked ? [...weak, s.id] : weak.filter((id) => id !== s.id),
                        )
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
          </fieldset>
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
          <p className="mb-5 text-sm text-muted-foreground">
            Cycle ends{" "}
            {formatDate(addDays(plan.data.plan.start_date, plan.data.plan.length_days - 1))}. You
            can start a new cycle after completion or restart after a gap. Task completion is not
            evidence of clinical mastery.
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
                            disabled={toggle.isPending || save.isPending}
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
                              ) : t.task_type === "revision" &&
                                /^(Continue: )*(Source study:|Recall source:)/.test(t.title) &&
                                subject ? (
                                <Link
                                  to="/library"
                                  hash={(() => {
                                    const source = ALL_DENTAL_READINGS.find(
                                      (item) => item.subjectSlug === subject.slug,
                                    );
                                    return source?.id === "ada-oral-cancer-2026"
                                      ? "primary-reading"
                                      : source
                                        ? `source-reading-${source.id}`
                                        : "study-guides";
                                  })()}
                                  className="text-teal underline"
                                >
                                  Open original source
                                </Link>
                              ) : t.task_type === "interview" ? (
                                <Link to="/interviews" className="text-teal underline">
                                  Practice
                                </Link>
                              ) : ["practice", "test"].includes(t.task_type) ||
                                (t.task_type === "revision" &&
                                  t.title.replace(/^(Continue: )+/, "").startsWith("Revise ")) ? (
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
      <CycleHistory userId={userId} />
    </>
  );
}

function CycleHistory({ userId }: { userId: string }) {
  const [limit, setLimit] = useState(20);
  const [selected, setSelected] = useState("");
  const history = useQuery({
    queryKey: ["plan-history", userId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_plans")
        .select("*")
        .eq("user_id", userId)
        .eq("active", false)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });
  const oldTasks = useQuery({
    queryKey: ["historical-tasks", userId, selected],
    enabled: !!selected,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("plan_id", selected)
        .order("day_index");
      if (error) throw error;
      return data;
    },
  });
  return (
    <details className="surface mt-7 p-5">
      <summary className="cursor-pointer font-bold">Previous cycles</summary>
      <p className="mt-3 text-sm text-muted-foreground">
        Original schedules and completion are shown as recorded. Continuing unfinished work does not
        rewrite its earlier completion state. History is read-only here.
      </p>
      {history.isPending ? (
        <LoadingBlock />
      ) : history.isError ? (
        <ErrorBlock error={history.error} />
      ) : !history.data.length ? (
        <p className="mt-3 text-sm">No previous cycles yet.</p>
      ) : (
        <>
          <label className="mt-4 grid gap-2 text-sm font-semibold">
            Choose previous cycle
            <select
              className="study-input"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">Choose a cycle</option>
              {history.data.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.length_days} days from {formatDate(p.start_date)}
                </option>
              ))}
            </select>
          </label>
          {history.data.length === limit && (
            <Button className="mt-3" variant="outline" onClick={() => setLimit(limit + 20)}>
              Load older cycles
            </Button>
          )}
          {selected &&
            (oldTasks.isPending ? (
              <LoadingBlock />
            ) : oldTasks.isError ? (
              <ErrorBlock error={oldTasks.error} />
            ) : (
              <div className="mt-4">
                <p className="text-sm font-bold">
                  Historical completion: {oldTasks.data?.filter((t) => t.done).length}/
                  {oldTasks.data?.length} tasks
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  {oldTasks.data?.map((t) => (
                    <li key={t.id}>
                      {t.done ? "Completed" : "Unfinished at that schedule"} · {t.title} ·{" "}
                      {formatDate(t.task_date)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </>
      )}
    </details>
  );
}
