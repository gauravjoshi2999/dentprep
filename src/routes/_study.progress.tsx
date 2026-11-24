import { SourceStudyReport } from "@/components/app/source-study-report";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  attemptsQuery,
  answersQuery,
  progressQuery,
  subjectsQuery,
  questionMetaQuery,
} from "@/lib/queries";
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
import {
  latestUniqueAnswers,
  topicPracticeEvidence,
  MIN_PRACTICE_SAMPLE,
  REVISION_FOCUS_PERCENT,
} from "@/lib/practice-evidence";

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
  const questions = useQuery(questionMetaQuery());
  const queries = [attempts, progress, subjects, answers, questions];
  if (queries.some((q) => q.isPending)) return <LoadingBlock />;
  const failed = queries.find((q) => q.isError);
  if (failed) return <ErrorBlock error={failed.error} />;
  const submitted = attempts.data?.filter((a) => a.status === "submitted") ?? [];
  const submittedIds = new Set(submitted.map((a) => a.id));
  const recorded = answers.data?.filter((a) => submittedIds.has(a.attempt_id)) ?? [];
  const latest = latestUniqueAnswers(recorded);
  const evidence = topicPracticeEvidence(
    recorded,
    questions.data?.filter((q) => subjects.data?.some((s) => s.id === q.subject_id)) ?? [],
  );
  return (
    <>
      <PageHeader
        title="Your progress"
        description="Reports cover your most recent 200 sessions and 1,000 recorded answers. These are independent practice results."
      />
      <SourceStudyReport />
      <details className="mb-6">
        <summary className="cursor-pointer font-bold">
          Additional question-bank and legacy lesson reports
        </summary>
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
            value={latest.filter((a) => !a.is_correct).length}
            hint="Within the report window"
          />
        </div>
        <section className="surface mb-6 p-5" aria-label="Subject and topic practice evidence">
          <h2 className="mb-3 text-xl font-bold">Subject and topic practice evidence</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Each distinct question counts once, using its latest submitted answer in this report
            window. Repeated practice is not an unseen diagnostic. Percentages need at least{" "}
            {MIN_PRACTICE_SAMPLE} distinct questions per topic; below {REVISION_FOCUS_PERCENT}%
            suggests revision. These are product heuristics, not validated mastery, clinical
            competence, UPSC pass marks or readiness predictions.
          </p>
          {evidence.topics.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Observed answers to currently published questions, grouped by subject and topic
                </caption>
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className="p-3">
                      Subject / topic
                    </th>
                    <th scope="col" className="p-3">
                      Latest correct / distinct
                    </th>
                    <th scope="col" className="p-3">
                      Observed accuracy
                    </th>
                    <th scope="col" className="p-3">
                      Suggested focus
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {evidence.topics.map((t) => (
                    <tr
                      key={JSON.stringify([t.subjectId, t.topic, t.topicKnown])}
                      className="border-b border-border"
                    >
                      <th scope="row" className="p-3">
                        <span className="block">
                          {subjects.data?.find((s) => s.id === t.subjectId)?.name}
                        </span>
                        <span className="font-normal text-muted-foreground">{t.topic}</span>
                      </th>
                      <td className="p-3">
                        {t.correct}/{t.uniqueQuestions}
                      </td>
                      <td className="p-3">
                        {!t.topicKnown
                          ? "Topic tagging needed"
                          : t.observedPercent === null
                            ? "More evidence needed"
                            : `${t.observedPercent}%`}
                      </td>
                      <td className="p-3">
                        {!t.topicKnown
                          ? "Use the subject outline for now"
                          : t.observedPercent === null
                            ? `${t.uniqueQuestions}/${MIN_PRACTICE_SAMPLE} distinct questions`
                            : t.suggestRevision
                              ? "Revise this topic"
                              : "Continue varied practice"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No published-question evidence yet">
              Complete practice sessions to build a report. No weak topic or readiness score is
              inferred from an empty account.
            </EmptyState>
          )}
          {evidence.excludedQuestions > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              {evidence.excludedQuestions} distinct questions were omitted because current published
              subject/topic metadata is unavailable. Original session results are retained below.
            </p>
          )}
          <p className="mt-4 text-sm">
            <Link to="/plan" className="font-semibold text-teal underline">
              Choose subjects to prioritize in your next cycle
            </Link>
          </p>
        </section>
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
      </details>
    </>
  );
}
