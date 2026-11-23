import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { attemptsQuery, answersQuery, progressQuery, subjectsQuery } from "@/lib/queries";
import { useUserId } from "@/lib/auth";
import { RequireUser } from "@/components/app/study-shell";
import {
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  ProgressBar,
  StatCard,
} from "@/components/app/common";
import { scorePercent } from "@/lib/scoring";
import { formatDate } from "@/lib/dates";

export const Route = createFileRoute("/_study/progress")({
  component: () => (
    <RequireUser>
      <Progress />
    </RequireUser>
  ),
  head: () => ({ meta: [{ title: "Learning progress — DentPrep" }] }),
});
function Progress() {
  const id = useUserId();
  const attempts = useQuery(attemptsQuery(id));
  const progress = useQuery(progressQuery(id));
  const subjects = useQuery(subjectsQuery());
  const answers = useQuery(answersQuery(id));
  const queries = [attempts, progress, subjects, answers];
  if (queries.some((q) => q.isPending)) return <LoadingBlock />;
  const failed = queries.find((q) => q.isError);
  if (failed) return <ErrorBlock error={failed.error} />;
  const submitted = attempts.data?.filter((a) => a.status === "submitted") ?? [];
  const submittedIds = new Set(submitted.map((a) => a.id));
  const recorded = answers.data?.filter((a) => submittedIds.has(a.attempt_id)) ?? [];
  const latest = new Map<string, boolean>();
  recorded.forEach((a) => {
    if (!latest.has(a.question_id)) latest.set(a.question_id, a.is_correct);
  });
  return (
    <>
      <PageHeader
        title="Your progress"
        description="Reports cover your most recent 200 sessions and 1,000 recorded answers. These are independent practice results."
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Completed sessions" value={submitted.length} />
        <StatCard
          label="Questions answered"
          value={submitted.reduce((n, a) => n + a.answered, 0)}
        />
        <StatCard
          label="Practice accuracy"
          value={
            submitted.some((a) => a.answered)
              ? `${scorePercent(
                  submitted.reduce((n, a) => n + a.correct, 0),
                  submitted.reduce((n, a) => n + a.answered, 0),
                )}%`
              : "—"
          }
        />
        <StatCard
          label="Latest wrong answers"
          value={[...latest.values()].filter((v) => !v).length}
          hint="Within the report window"
        />
      </div>
      <section className="surface mb-6 p-5">
        <h2 className="mb-5 text-xl font-bold">Subject completion</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {subjects.data?.map((s) => {
            const done =
              progress.data?.filter(
                (p) => p.status === "completed" && s.lessons.some((l) => l.id === p.lesson_id),
              ).length ?? 0;
            return (
              <div key={s.id}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <strong>{s.name}</strong>
                  <span className="text-muted-foreground">
                    {done}/{s.lessons.length}
                  </span>
                </div>
                <ProgressBar
                  label={`${s.name} completion`}
                  value={scorePercent(done, s.lessons.length)}
                />
              </div>
            );
          })}
        </div>
      </section>
      <section className="surface p-5">
        <h2 className="mb-4 text-xl font-bold">Session history</h2>
        {submitted.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th scope="col" className="p-3">
                    Session
                  </th>
                  <th scope="col" className="p-3">
                    Date
                  </th>
                  <th scope="col" className="p-3">
                    Correct
                  </th>
                  <th scope="col" className="p-3">
                    Practice score
                  </th>
                </tr>
              </thead>
              <tbody>
                {submitted.map((a) => (
                  <tr key={a.id} className="border-b border-border">
                    <td className="p-3">
                      <Link
                        to="/attempt/$attemptId"
                        params={{ attemptId: a.id }}
                        className="font-semibold text-teal"
                      >
                        {a.title}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap p-3">{formatDate(a.started_at)}</td>
                    <td className="p-3">
                      {a.correct}/{a.total}
                    </td>
                    <td className="p-3">{a.score_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Your first result starts here">
            Complete a practice session to see your learning trends.
          </EmptyState>
        )}
      </section>
    </>
  );
}
