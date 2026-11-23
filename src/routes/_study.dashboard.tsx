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
import { scorePercent } from "@/lib/scoring";
import { RequireUser } from "@/components/app/study-shell";
import {
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  ProgressBar,
  StatCard,
} from "@/components/app/common";
import { Button } from "@/components/ui/button";

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
  const due = revision.data?.filter((r) => r.due_date <= istToday()).length ?? 0;
  const todayTasks = plan.data?.tasks.filter((t) => t.task_date === istToday()) ?? [];
  return (
    <>
      <PageHeader
        eyebrow="Your daily study space"
        title={`Welcome${profile.data?.full_name ? `, ${profile.data.full_name.split(" ")[0]}` : " to DentPrep"}`}
        description="Take one focused step towards your next interview."
        actions={
          <Button asChild>
            <Link to="/plan">{plan.data ? "View study plan" : "Create study plan"}</Link>
          </Button>
        }
      />
      <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Lessons completed"
          value={done}
          hint={`${publishedIds.size} published lessons`}
        />
        <StatCard
          label="Practice accuracy"
          value={totalAnswers ? `${scorePercent(correct, totalAnswers)}%` : "—"}
          hint={
            totalAnswers
              ? `${totalAnswers} answered in recent tests`
              : "Complete practice to see your score"
          }
        />
        <StatCard
          label="Study streak"
          value={`${computeStreak(activity.data?.map((a) => a.day) ?? [])} days`}
          hint="Activity recorded in India time"
        />
        <StatCard label="Due for revision" value={due} hint="Questions in your revision queue" />
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
          <h2 className="mb-5 text-xl font-bold">Your learning path</h2>
          <ProgressBar
            value={scorePercent(done, publishedIds.size)}
            label="Published lessons completed"
          />
          <p className="mt-3 text-sm text-muted-foreground">
            {publishedIds.size
              ? `${done} of ${publishedIds.size} lessons completed`
              : "Clinical lessons are awaiting review. Explore the subject outlines while they are prepared."}
          </p>
          <div className="mt-6 grid gap-3">
            <Button asChild>
              <Link to="/library">Explore study library</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/practice">Start practice or revision</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/interviews">Interview communication practice</Link>
            </Button>
          </div>
        </section>
      </div>
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
    </>
  );
}
