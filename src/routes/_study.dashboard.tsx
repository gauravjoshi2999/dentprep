import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useUserId } from "@/lib/auth";
import {
  activityQuery,
  attemptsQuery,
  planQuery,
  profileQuery,
  progressQuery,
  revisionQuery,
  subjectsQuery,
} from "@/lib/queries";
import { computeStreak, istToday } from "@/lib/dates";
import { studentGreetingName } from "@/lib/display-name";
import { scorePercent } from "@/lib/scoring";
import { RequireUser } from "@/components/app/study-shell";
import { EmptyState, ErrorBlock, LoadingBlock } from "@/components/app/common";
import { Button } from "@/components/ui/button";
import { AppHero } from "@/components/app/app-hero";
import { CalendarCheck2, ClipboardList, Flame, Target, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_study/dashboard")({
  component: () => (
    <RequireUser>
      <Dashboard />
    </RequireUser>
  ),
  head: () => ({ meta: [{ title: "Your dashboard — DentPrep" }] }),
});
function Dashboard() {
  const id = useUserId();
  const profile = useQuery(profileQuery(id));
  const progress = useQuery(progressQuery(id));
  const attempts = useQuery(attemptsQuery(id));
  const activity = useQuery(activityQuery(id));
  const plan = useQuery(planQuery(id));
  const revision = useQuery(revisionQuery(id));
  const subjects = useQuery(subjectsQuery());
  const queries = [profile, progress, attempts, activity, plan, revision, subjects];
  if (queries.some((q) => q.isPending)) return <LoadingBlock label="Loading your study space…" />;
  const error = queries.find((q) => q.isError);
  if (error)
    return (
      <ErrorBlock error={error.error} onRetry={() => queries.forEach((q) => void q.refetch())} />
    );
  const publishedIds = new Set(subjects.data?.flatMap((s) => s.lessons.map((l) => l.id)));
  const done =
    progress.data?.filter((p) => p.status === "completed" && publishedIds.has(p.lesson_id))
      .length ?? 0;
  const submitted = attempts.data?.filter((a) => a.status === "submitted") ?? [];
  const totalAnswers = submitted.reduce((n, a) => n + a.answered, 0);
  const correct = submitted.reduce((n, a) => n + a.correct, 0);
  const todayTasks = plan.data?.tasks.filter((t) => t.task_date === istToday()) ?? [];
  const completedTasks = todayTasks.filter((t) => t.done).length;
  const availableLessons =
    subjects.data?.flatMap((s) =>
      s.lessons.map((l) => ({ ...l, subjectSlug: s.slug, subjectName: s.name })),
    ) ?? [];
  const nextLesson = availableLessons.find(
    (l) => !progress.data?.some((p) => p.lesson_id === l.id && p.status === "completed"),
  );
  const greetingName = studentGreetingName(profile.data?.full_name);
  const streak = computeStreak(activity.data?.map((a) => a.day) ?? []);
  return (
    <>
      <AppHero
        eyebrow="Your daily study space"
        title={greetingName ? `Welcome, ${greetingName}` : "Welcome to DentPrep"}
        description="Your UPSC Dental Surgeon study space. Read one idea, recall it, and plan your next revision."
      />
      <section
        aria-labelledby="daily-mission-title"
        className="mb-7 rounded-2xl border border-teal/30 bg-teal-soft/50 p-5 sm:p-7"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-teal">
          Today's learning mission
        </p>
        <h2 id="daily-mission-title" className="mt-2 text-2xl font-extrabold">
          {nextLesson
            ? nextLesson.title
            : (availableLessons[0]?.title ?? "Start your dental reference reading")}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {availableLessons.length
            ? "Read a reviewed lesson, explain it in your own words, then return to the source to check gaps."
            : "An official Oral Medicine reference is ready to read. Follow its reading checklist, note your questions, then rehearse explaining your learning in English. DentPrep clinical lessons are awaiting independent review."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {(nextLesson ?? availableLessons[0]) ? (
            <Button asChild>
              <Link
                to="/lesson/$subjectSlug/$lessonSlug"
                params={{
                  subjectSlug: (nextLesson ?? availableLessons[0])!.subjectSlug,
                  lessonSlug: (nextLesson ?? availableLessons[0])!.slug,
                }}
              >
                {nextLesson ? "Continue lesson" : "Revisit lesson"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link to="/library" hash="primary-reading">
                Start source reading
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link to="/start">Study-skills warm-up</Link>
          </Button>
        </div>
        {availableLessons.length > 0 && (
          <p className="mt-4 text-xs text-muted-foreground">
            {done} of {availableLessons.length} available lesson checklists completed.
          </p>
        )}
      </section>
      <div className="mb-7 grid grid-cols-2 gap-3">
        <Link
          to="/plan"
          className="surface bg-teal-soft/60 p-4 transition hover:border-teal sm:p-5"
        >
          <CalendarCheck2 className="mb-3 h-6 w-6 text-teal" aria-hidden="true" />
          <p className="text-sm font-semibold">Today's plan</p>
          <p className="mt-1 text-2xl font-black">
            {todayTasks.length ? `${completedTasks}/${todayTasks.length}` : "Not set"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {todayTasks.length ? "Tasks completed" : "Create your first plan"}
          </p>
          {todayTasks.length > 0 && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-teal"
                style={{ width: `${Math.round((100 * completedTasks) / todayTasks.length)}%` }}
              />
            </div>
          )}
        </Link>
        <div className="surface bg-amber-50/70 p-4 dark:bg-card sm:p-5">
          <Flame className="mb-3 h-6 w-6 text-warning" aria-hidden="true" />
          <p className="text-sm font-semibold">Study streak</p>
          <p className="mt-1 text-2xl font-black">{streak} days</p>
          <p className="mt-1 text-xs text-muted-foreground">Recorded India-time activity</p>
        </div>
        {totalAnswers > 0 && (
          <div className="surface bg-blue-50/70 p-4 dark:bg-card sm:p-5">
            <ClipboardList className="mb-3 h-6 w-6 text-teal" aria-hidden="true" />
            <p className="text-sm font-semibold">Questions solved</p>
            <p className="mt-1 text-2xl font-black">{totalAnswers.toLocaleString("en-IN")}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {submitted.length} completed sessions
            </p>
          </div>
        )}
        {totalAnswers > 0 && (
          <div className="surface bg-teal-soft/50 p-4 sm:p-5">
            <Target className="mb-3 h-6 w-6 text-teal" aria-hidden="true" />
            <p className="text-sm font-semibold">Practice accuracy</p>
            <p className="mt-1 text-2xl font-black">
              {totalAnswers ? `${scorePercent(correct, totalAnswers)}%` : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {totalAnswers ? `${correct} correct of ${totalAnswers}` : "No answered questions yet"}
            </p>
          </div>
        )}
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="surface p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Today's focus</h2>
            <Link to="/plan" className="text-sm font-semibold text-teal">
              Open plan →
            </Link>
          </div>
          {todayTasks.length ? (
            <ul className="space-y-3">
              {todayTasks.map((t) => (
                <li
                  key={t.id}
                  className="flex items-start justify-between gap-3 rounded-lg bg-muted p-3"
                >
                  <span className={t.done ? "text-muted-foreground line-through" : "font-semibold"}>
                    {t.title}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {t.done ? "Done" : `${t.minutes} min`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Set your own pace">
              Create a 7, 15 or 30 day plan around your available time.
            </EmptyState>
          )}
        </section>
        <section className="surface p-5 sm:p-6">
          <h2 className="text-xl font-bold">After reading</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Close the source and explain your understanding aloud. Reopen it to check gaps, then
            schedule another session.
          </p>
          <div className="mt-5 grid gap-3">
            <Button asChild>
              <Link to="/interviews">Practise a clear English answer</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/plan">Plan your next revision</Link>
            </Button>
          </div>
        </section>
      </div>
      {submitted.length > 0 && (
        <section className="surface mt-6 p-5 sm:p-6">
          <h2 className="mb-4 text-xl font-bold">Recent practice</h2>
          {submitted.length ? (
            <ul className="divide-y divide-border">
              {submitted.slice(0, 5).map((a) => (
                <li key={a.id}>
                  <Link
                    to="/attempt/$attemptId"
                    params={{ attemptId: a.id }}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <strong>{a.title}</strong>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(a.started_at).toLocaleDateString("en-IN", {
                          timeZone: "Asia/Kolkata",
                        })}{" "}
                        · {a.correct}/{a.total} correct
                      </p>
                    </div>
                    <strong className="text-teal">{a.score_pct}%</strong>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Your completed practice sessions will appear here. No scores have been recorded yet.
            </p>
          )}
        </section>
      )}
    </>
  );
}
