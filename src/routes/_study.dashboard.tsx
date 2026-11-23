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
  noticesQuery,
} from "@/lib/queries";
import { computeStreak, istToday } from "@/lib/dates";
import { scorePercent } from "@/lib/scoring";
import { RequireUser } from "@/components/app/study-shell";
import {
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  ProgressBar,
} from "@/components/app/common";
import { Button } from "@/components/ui/button";
import { AppHero } from "@/components/app/app-hero";
import { BookOpen, CalendarCheck2, CheckCircle2, ClipboardList, Flame, Target, ArrowRight, Megaphone } from "lucide-react";

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
  const notices = useQuery(noticesQuery());
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
  const availableLessons = subjects.data?.flatMap((s) => s.lessons.map((l) => ({ ...l, subjectSlug: s.slug, subjectName: s.name }))) ?? [];
  const nextLesson = availableLessons.find((l) => !progress.data?.some((p) => p.lesson_id === l.id && p.status === "completed"));
  const streak = computeStreak(activity.data?.map((a) => a.day) ?? []);
  return (
    <>
      <AppHero
        eyebrow="Your daily study space"
        title={`Welcome${profile.data?.full_name ? `, ${profile.data.full_name.split(" ")[0]}` : " to DentPrep"}`}
        description="Learn. Practice. Interview. Succeed. Take one focused step today."
        actions={<Button asChild variant="secondary"><Link to="/plan">{plan.data ? "View today's plan" : "Create study plan"} <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>}
      />
      <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link to="/plan" className="surface bg-teal-soft/60 p-4 transition hover:border-teal sm:p-5">
          <CalendarCheck2 className="mb-3 h-6 w-6 text-teal" aria-hidden="true" />
          <p className="text-sm font-semibold">Today's plan</p>
          <p className="mt-1 text-2xl font-black">{todayTasks.length ? `${completedTasks}/${todayTasks.length}` : "Not set"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{todayTasks.length ? "Tasks completed" : "Create your first plan"}</p>
          {todayTasks.length > 0 && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border"><div className="h-full rounded-full bg-teal" style={{ width: `${Math.round(100 * completedTasks / todayTasks.length)}%` }} /></div>}
        </Link>
        <div className="surface bg-amber-50/70 p-4 dark:bg-card sm:p-5">
          <Flame className="mb-3 h-6 w-6 text-warning" aria-hidden="true" />
          <p className="text-sm font-semibold">Study streak</p>
          <p className="mt-1 text-2xl font-black">{streak} days</p>
          <p className="mt-1 text-xs text-muted-foreground">Recorded India-time activity</p>
        </div>
        <div className="surface bg-blue-50/70 p-4 dark:bg-card sm:p-5">
          <ClipboardList className="mb-3 h-6 w-6 text-teal" aria-hidden="true" />
          <p className="text-sm font-semibold">Questions solved</p>
          <p className="mt-1 text-2xl font-black">{totalAnswers.toLocaleString("en-IN")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{submitted.length} completed sessions</p>
        </div>
        <div className="surface bg-teal-soft/50 p-4 sm:p-5">
          <Target className="mb-3 h-6 w-6 text-teal" aria-hidden="true" />
          <p className="text-sm font-semibold">Practice accuracy</p>
          <p className="mt-1 text-2xl font-black">{totalAnswers ? `${scorePercent(correct, totalAnswers)}%` : "—"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{totalAnswers ? `${correct} correct of ${totalAnswers}` : "No answered questions yet"}</p>
        </div>
      </div>
      <section className="mb-7">
        <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-xl font-extrabold">Continue learning</h2><Link to="/library" className="text-sm font-semibold text-teal">View all →</Link></div>
        <div className="surface flex items-center gap-4 p-4 sm:p-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-soft text-teal"><BookOpen className="h-7 w-7" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">{nextLesson?.title ?? "Your next reviewed lesson"}</p>
            <p className="mt-1 text-xs text-muted-foreground">{nextLesson ? `${nextLesson.subjectName} · ${nextLesson.est_minutes} min reading` : "Reviewed clinical lessons will appear here when published."}</p>
            <p className="mt-1 text-xs text-teal">{done} of {availableLessons.length} published lessons completed</p>
          </div>
          <Button size="sm" asChild>
            {nextLesson ? <Link to="/lesson/$subjectSlug/$lessonSlug" params={{ subjectSlug: nextLesson.subjectSlug, lessonSlug: nextLesson.slug }}>Read</Link> : <Link to="/library">Explore</Link>}
          </Button>
        </div>
      </section>
      <section className="mb-7">
        <h2 className="mb-3 text-xl font-extrabold">Quick actions</h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Link to="/library" className="rounded-2xl bg-navy p-3 text-white sm:p-5"><BookOpen className="mb-4 h-6 w-6" /><strong className="block text-sm sm:text-lg">Study</strong><span className="text-xs text-white/70">Notes</span></Link>
          <Link to="/practice" className="rounded-2xl bg-teal p-3 text-white sm:p-5"><CheckCircle2 className="mb-4 h-6 w-6" /><strong className="block text-sm sm:text-lg">Practice</strong><span className="text-xs text-white/80">MCQs</span></Link>
          <Link to="/interviews" className="rounded-2xl bg-[#076569] p-3 text-white sm:p-5"><ClipboardList className="mb-4 h-6 w-6" /><strong className="block text-sm sm:text-lg">Interview</strong><span className="text-xs text-white/80">Text rehearsal</span></Link>
        </div>
      </section>
      {notices.data?.[0] && (
        <section className="surface mb-7 flex items-center gap-4 bg-teal-soft/30 p-4 sm:p-5" aria-label="Official recruitment notice">
          <span className="rounded-2xl bg-teal-soft p-3 text-teal"><Megaphone className="h-6 w-6" aria-hidden="true" /></span>
          <div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wider text-teal">Official notice linked</p><h2 className="mt-1 font-extrabold">{notices.data[0].title}</h2><p className="mt-1 text-xs text-muted-foreground">Verify recruitment details directly on the official UPSC website.</p></div>
          <a href={notices.data[0].official_url} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">View notice</a>
        </section>
      )}
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
