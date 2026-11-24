import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { attemptsQuery, questionMetaQuery, revisionQuery, subjectsQuery } from "@/lib/queries";
import { useUserId } from "@/lib/auth";
import { istToday, shuffle } from "@/lib/dates";
import { supabase } from "@/integrations/supabase/client";
import { RequireUser } from "@/components/app/study-shell";
import { EmptyState, ErrorBlock, LoadingBlock, Notice } from "@/components/app/common";
import { Button } from "@/components/ui/button";
import { AppHero } from "@/components/app/app-hero";
import { ClipboardCheck, Timer, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/_study/practice")({
  component: () => (
    <RequireUser>
      <Practice />
    </RequireUser>
  ),
  head: () => ({ meta: [{ title: "Question practice — DentPrep" }] }),
});
function Practice() {
  const userId = useUserId();
  const navigate = useNavigate();
  const questions = useQuery(questionMetaQuery());
  const subjects = useQuery(subjectsQuery());
  const revision = useQuery(revisionQuery(userId));
  const attempts = useQuery(attemptsQuery(userId));
  const [subjectId, setSubjectId] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [mode, setMode] = useState<"practice" | "custom" | "revision">("practice");
  const [count, setCount] = useState(10);
  const [minutes, setMinutes] = useState(15);
  const dueIds = new Set(
    revision.data?.filter((r) => r.due_date <= istToday()).map((r) => r.question_id),
  );
  const eligible =
    questions.data?.filter(
      (q) =>
        (!subjectId || q.subject_id === subjectId) &&
        (!difficulty || q.difficulty === difficulty) &&
        (mode !== "revision" || dueIds.has(q.id)),
    ) ?? [];
  const start = useMutation({
    mutationFn: async () => {
      const ids = shuffle(eligible)
        .slice(0, count)
        .map((q) => q.id);
      if (!ids.length) throw new Error("No published questions match your selection.");
      // The generated RPC types omit this argument's SQL nullability.
      const { data, error } = await supabase.rpc("start_attempt", {
        p_mode: mode,
        p_title:
          mode === "revision"
            ? "Wrong-answer revision"
            : mode === "custom"
              ? "Custom timed practice"
              : "MCQ practice",
        p_question_ids: ids,
        p_subject_id: subjectId || (null as unknown as string),
        p_time_limit_sec: mode === "custom" ? minutes * 60 : 0,
      });
      if (error) throw error;
      if (!data) throw new Error("The session could not be created.");
      return data;
    },
    onSuccess: (id) => void navigate({ to: "/attempt/$attemptId", params: { attemptId: id } }),
    onError: (e) => toast.error(e.message),
  });
  const queries = [questions, subjects, revision, attempts];
  if (queries.some((q) => q.isPending)) return <LoadingBlock />;
  const failed = queries.find((q) => q.isError);
  if (failed)
    return (
      <ErrorBlock error={failed.error} onRetry={() => queries.forEach((q) => void q.refetch())} />
    );
  const unfinished = attempts.data?.filter((a) => a.status === "in_progress") ?? [];
  return (
    <>
      <AppHero
        eyebrow="MCQ practice"
        title="Practice with purpose"
        description="Choose a subject and build accuracy with reviewed, original DentPrep questions."
      />
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="surface bg-teal-soft/50 p-4">
          <ClipboardCheck className="mb-2 h-6 w-6 text-teal" />
          <p className="text-sm font-semibold">Completed tests</p>
          <p className="text-2xl font-black">
            {attempts.data?.filter((a) => a.status === "submitted").length ?? 0}
          </p>
        </div>
        <div className="surface bg-blue-50/70 p-4 dark:bg-card">
          <RotateCcw className="mb-2 h-6 w-6 text-teal" />
          <p className="text-sm font-semibold">Due for revision</p>
          <p className="text-2xl font-black">{dueIds.size}</p>
        </div>
      </div>
      <Notice className="mb-6">
        These are DentPrep practice sessions. Scores and timers do not represent an official UPSC
        assessment or exam pattern.
      </Notice>
      {unfinished.length > 0 && (
        <section className="surface mb-6 p-5">
          <h2 className="mb-3 font-bold">Continue a session</h2>
          <div className="flex flex-wrap gap-3">
            {unfinished.slice(0, 5).map((a) => (
              <Button key={a.id} variant="outline" asChild>
                <Link to="/attempt/$attemptId" params={{ attemptId: a.id }}>
                  {a.title} · {a.total} questions
                </Link>
              </Button>
            ))}
          </div>
        </section>
      )}
      {!questions.data?.length ? (
        <EmptyState title="Start with chapter practice">
          Learn the concept, try an original question and check the explanation in the Public Health
          chapter.
          <div className="mt-4">
            <Link
              to="/start"
              search={{ course: "ph-frequency" }}
              className="font-semibold text-teal"
            >
              Practise Public Health foundations →
            </Link>
          </div>
        </EmptyState>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            start.mutate();
          }}
          className="surface grid max-w-3xl gap-5 p-5 sm:p-7"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Session type
              <select
                className="study-input"
                value={mode}
                onChange={(e) => setMode(e.target.value as typeof mode)}
              >
                <option value="practice">Practice · explanations after answering</option>
                <option value="custom">Custom timed practice · review at the end</option>
                <option value="revision">Due wrong-answer revision</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Subject
              <select
                className="study-input"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
              >
                <option value="">All subjects</option>
                {subjects.data?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Difficulty
              <select
                className="study-input"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="">All difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Questions
              <select
                className="study-input"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              >
                {[5, 10, 20, 30, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {mode === "custom" && (
            <label className="grid max-w-xs gap-2 text-sm font-semibold">
              <span className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-teal" /> Time limit (minutes)
              </span>
              <input
                className="study-input"
                type="number"
                min={1}
                max={180}
                required
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
            </label>
          )}
          <p className="text-sm text-muted-foreground">
            {eligible.length} published questions match · Your session will use{" "}
            {Math.min(count, eligible.length)} questions.
          </p>
          <Button size="lg" disabled={!eligible.length || start.isPending} type="submit">
            {start.isPending ? "Creating session…" : "Start session"}
          </Button>
        </form>
      )}
    </>
  );
}
