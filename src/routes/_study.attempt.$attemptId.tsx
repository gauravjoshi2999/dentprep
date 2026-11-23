import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchQuestions } from "@/lib/queries";
import { useUserId } from "@/lib/auth";
import { formatDuration } from "@/lib/dates";
import { RequireUser } from "@/components/app/study-shell";
import {
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  Notice,
  PageHeader,
  StatCard,
} from "@/components/app/common";
import { BookmarkButton } from "@/components/app/bookmark-button";
import { Markdown } from "@/components/app/markdown";
import { Button } from "@/components/ui/button";
import { AppHero } from "@/components/app/app-hero";
import { ArrowLeft, ArrowRight, Clock3 } from "lucide-react";

export const Route = createFileRoute("/_study/attempt/$attemptId")({
  component: () => (
    <RequireUser>
      <Attempt />
    </RequireUser>
  ),
  head: () => ({ meta: [{ title: "Practice session — DentPrep" }] }),
});
function Attempt() {
  const { attemptId } = Route.useParams();
  const userId = useUserId();
  const qc = useQueryClient();
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ is_correct: boolean; explanation: string } | null>(
    null,
  );
  const [now, setNow] = useState(Date.now());
  const autoSubmitted = useRef(false);
  const query = useQuery({
    queryKey: ["attempt", userId, attemptId],
    queryFn: async () => {
      const { data: attempt, error } = await supabase
        .from("attempts")
        .select("*")
        .eq("id", attemptId)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      if (!attempt) return null;
      const { data: answers, error: answerError } = await supabase
        .from("test_answers")
        .select("question_id, selected_option_id, is_correct")
        .eq("attempt_id", attemptId)
        .eq("user_id", userId);
      if (answerError) throw answerError;
      return { attempt, answers, questions: await fetchQuestions(attempt.question_ids) };
    },
  });
  const attempt = query.data?.attempt;
  const question = query.data?.questions[index];
  const answer = query.data?.answers.find((a) => a.question_id === question?.id);
  const immediate = attempt && ["practice", "daily", "revision"].includes(attempt.mode);
  const locked = immediate && !!answer;
  const remaining =
    attempt?.timed && attempt.time_limit_sec
      ? Math.max(
          0,
          Math.ceil((Date.parse(attempt.started_at) + attempt.time_limit_sec * 1000 - now) / 1000),
        )
      : null;
  function refresh() {
    for (const key of [
      ["attempt", userId, attemptId],
      ["attempts", userId],
      ["answers", userId],
      ["revision", userId],
      ["activity", userId],
    ])
      void qc.invalidateQueries({ queryKey: key });
  }
  const submit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("submit_attempt", { p_attempt_id: attemptId });
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (e) => toast.error(e.message),
  });
  const save = useMutation({
    mutationFn: async () => {
      if (!question || !choice) throw new Error("Choose an answer first.");
      const { data, error } = await supabase.rpc("record_answer", {
        p_attempt_id: attemptId,
        p_question_id: question.id,
        p_option_id: choice,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (
        immediate &&
        data &&
        typeof data === "object" &&
        !Array.isArray(data) &&
        typeof data["is_correct"] === "boolean"
      )
        setFeedback({
          is_correct: data["is_correct"],
          explanation: String(data["explanation"] ?? ""),
        });
      setChoice(null);
      refresh();
    },
    onError: (e) => toast.error(e.message),
  });
  useEffect(() => {
    if (attempt?.status !== "in_progress" || !attempt.timed) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [attempt?.status, attempt?.timed]);
  useEffect(() => {
    if (
      remaining === 0 &&
      attempt?.status === "in_progress" &&
      !autoSubmitted.current &&
      !save.isPending
    ) {
      autoSubmitted.current = true;
      submit.mutate();
    }
  }, [remaining, attempt?.status, save.isPending, submit.mutate]);
  function go(next: number) {
    setIndex(next);
    setChoice(null);
    setFeedback(null);
  }
  if (query.isPending) return <LoadingBlock />;
  if (query.isError) return <ErrorBlock error={query.error} onRetry={() => void query.refetch()} />;
  if (!query.data || !attempt)
    return (
      <EmptyState title="Session not found">
        This session is unavailable in your account.
      </EmptyState>
    );
  if (attempt.status === "submitted")
    return (
      <>
        <PageHeader
          eyebrow="Practice complete"
          title={attempt.title}
          description="An independent DentPrep practice result, not an official UPSC score."
          actions={
            <Button asChild>
              <Link to="/practice">Start another session</Link>
            </Button>
          }
        />
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Practice score" value={`${attempt.score_pct ?? 0}%`} />
          <StatCard label="Correct" value={`${attempt.correct}/${attempt.total}`} />
          <StatCard label="Unanswered" value={attempt.total - attempt.answered} />
          <StatCard label="Time spent" value={formatDuration(attempt.duration_sec)} />
        </div>
        <Notice className="mb-6">
          Each correct answer counts as one point. Unanswered questions count as zero. Wrong answers
          are added to your revision queue.
        </Notice>
        <h2 className="mb-4 text-xl font-bold">Review your answers</h2>
        <div className="grid gap-4">
          {query.data.questions.map((q, i) => {
            const a = query.data?.answers.find((row) => row.question_id === q.id);
            return (
              <section className="surface p-5" key={q.id}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="font-bold">
                    {i + 1}. {q.stem}
                  </h3>
                  <BookmarkButton itemType="question" itemId={q.id} compact />
                </div>
                <p
                  className={`mb-3 text-sm font-semibold ${a?.is_correct ? "text-success" : "text-destructive"}`}
                >
                  {a
                    ? `${a.is_correct ? "Correct" : "Needs revision"} · Your answer: ${q.answer_options.find((o) => o.id === a.selected_option_id)?.body ?? "Unavailable"}`
                    : "Unanswered"}
                </p>
                <Markdown>{q.explanation}</Markdown>
                {q.source_note && (
                  <p className="mt-3 text-xs text-muted-foreground">Source note: {q.source_note}</p>
                )}
              </section>
            );
          })}
        </div>
      </>
    );
  return (
    <>
      <AppHero eyebrow="Independent MCQ practice" title={attempt.title} description="Answer carefully and save each response. This is not an official UPSC test." actions={remaining !== null && <span role="timer" className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold"><Clock3 className="h-4 w-4" />{formatDuration(remaining)} remaining</span>} />
      <div className="mb-5 flex items-center justify-between gap-4" aria-label="Test progress">
        <span className="text-sm font-extrabold">Question {index + 1} of {query.data.questions.length}</span>
        <span className="text-sm font-semibold text-teal">{query.data.answers.length} answers saved</span>
      </div>
      <div className="mb-5 h-2.5 overflow-hidden rounded-full bg-border" role="progressbar" aria-label="Saved answer progress" aria-valuemin={0} aria-valuemax={attempt.total} aria-valuenow={query.data.answers.length}>
        <div className="h-full rounded-full bg-teal transition-[width]" style={{ width: `${attempt.total ? Math.round(100 * query.data.answers.length / attempt.total) : 0}%` }} />
      </div>
      <div className="mb-5 flex flex-wrap gap-2" aria-label="Question navigation">
        {query.data.questions.map((q, i) => (
          <Button
            key={q.id}
            size="icon"
            aria-label={`Question ${i + 1}`}
            aria-current={i === index ? "step" : undefined}
            disabled={save.isPending || submit.isPending}
            variant={
              i === index
                ? "default"
                : query.data?.answers.some((a) => a.question_id === q.id)
                  ? "soft"
                  : "outline"
            }
            onClick={() => go(i)}
          >
            {i + 1}
          </Button>
        ))}
      </div>
      {question ? (
        <section className="surface mx-auto max-w-4xl border-teal/20 p-5 sm:p-8">
          <div className="mb-5 flex items-start justify-between gap-4">
            <h2 className="text-xl font-extrabold">
              <span className="mr-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-teal-soft align-middle text-base text-teal">Q{index + 1}</span>{question.stem}
            </h2>
            <BookmarkButton itemType="question" itemId={question.id} compact />
          </div>
          <fieldset
            disabled={!!locked || save.isPending || submit.isPending || remaining === 0}
            className="grid gap-3"
          >
            <legend className="sr-only">Choose one answer</legend>
            {question.answer_options.map((o) => (
              <label
                key={o.id}
                className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-4 transition hover:border-teal/70 ${(choice ?? answer?.selected_option_id) === o.id ? "border-teal bg-teal-soft shadow-card" : "border-border bg-card"}`}
              >
                <input
                  type="radio"
                  name="answer"
                  value={o.id}
                  checked={(choice ?? answer?.selected_option_id) === o.id}
                  onChange={() => setChoice(o.id)}
                  className="mt-1"
                />
                <span>
                  <strong>{o.label}.</strong> {o.body}
                </span>
              </label>
            ))}
          </fieldset>
          {immediate && (feedback || answer) && (
            <div className="mt-5 rounded-xl bg-muted p-4">
              <p className="mb-2 font-bold">
                {(feedback?.is_correct ?? answer?.is_correct)
                  ? "Correct"
                  : "Review this explanation"}
              </p>
              <Markdown>{feedback?.explanation ?? question.explanation}</Markdown>
            </div>
          )}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
            <Button variant="outline" disabled={index === 0 || save.isPending || submit.isPending} onClick={() => go(index - 1)}><ArrowLeft className="mr-1 h-4 w-4" />Previous</Button>
            <Button
              disabled={!choice || !!locked || save.isPending || submit.isPending || remaining === 0}
              onClick={() => save.mutate()}
            >
              {save.isPending ? "Saving…" : "Save answer"}
            </Button>
            {index + 1 < query.data.questions.length && (
              <Button variant="outline" disabled={save.isPending || submit.isPending} onClick={() => go(index + 1)}>
                {choice ? "Next without saving" : "Skip for now"} <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </section>
      ) : (
        <EmptyState title="Question unavailable">
          Some content is no longer published. You can submit this session to keep a record of your
          saved answers.
        </EmptyState>
      )}
      <div className="mx-auto mt-6 flex max-w-4xl flex-col items-start gap-3">
        <p className="text-sm text-muted-foreground">
          Submit when finished. {Math.max(0, attempt.total - query.data.answers.length)} questions
          remain unanswered. Your choice is saved only after pressing Save answer.
        </p>
        <Button
          variant="outline"
          disabled={submit.isPending || save.isPending}
          onClick={() => submit.mutate()}
        >
          {submit.isPending ? "Submitting…" : "Finish and view result"}
        </Button>
      </div>
    </>
  );
}
