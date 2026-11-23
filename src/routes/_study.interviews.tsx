import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserId } from "@/lib/auth";
import {
  communicationFeedback,
  promptsFor,
  transcriptSchema,
  type CommunicationMode,
  type InterviewEntry,
} from "@/lib/interview";
import { formatDate } from "@/lib/dates";
import { RequireUser } from "@/components/app/study-shell";
import { EmptyState, ErrorBlock, LoadingBlock, Notice, PageHeader } from "@/components/app/common";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_study/interviews")({
  component: () => (
    <RequireUser>
      <Interviews />
    </RequireUser>
  ),
  head: () => ({ meta: [{ title: "Interview communication practice — DentPrep" }] }),
});
function Interviews() {
  const userId = useUserId();
  const qc = useQueryClient();
  const sessions = useQuery({
    queryKey: ["communication-sessions", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("started_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
  const [mode, setMode] = useState<CommunicationMode>("general");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [entries, setEntries] = useState<InterviewEntry[]>([]);
  const [finished, setFinished] = useState(false);
  const [review, setReview] = useState(false);
  const [index, setIndex] = useState(0);
  const [dirty, setDirty] = useState(false);
  const current = entries[index];
  const prompts = promptsFor(mode);
  const save = useMutation({
    mutationFn: async (complete: boolean) => {
      if (!sessionId) throw new Error("Start a session first.");
      const transcript = transcriptSchema.parse(entries);
      const { error } = await supabase
        .from("interview_sessions")
        .update({
          transcript,
          question_count: entries.filter((e) => e.answer.trim()).length,
          status: complete ? "completed" : "active",
          ended_at: complete ? new Date().toISOString() : null,
        })
        .eq("id", sessionId)
        .eq("user_id", userId);
      if (error) throw error;
      return complete;
    },
    onSuccess: (complete) => {
      setDirty(false);
      setFinished(complete);
      void qc.invalidateQueries({ queryKey: ["communication-sessions", userId] });
      toast.success(complete ? "Practice saved as complete" : "Draft saved");
    },
    onError: (e) => toast.error(e.message),
  });
  const start = useMutation({
    mutationFn: async () => {
      const id = crypto.randomUUID();
      const initial = prompts.map((p) => ({ prompt: p.prompt, answer: "", reflection: "" }));
      const { error } = await supabase
        .from("interview_sessions")
        .insert({
          id,
          user_id: userId,
          mode,
          duration_min: 15,
          transcript: initial,
          question_count: 0,
        });
      if (error) throw error;
      return { id, initial };
    },
    onSuccess: ({ id, initial }) => {
      setSessionId(id);
      setEntries(initial);
      setFinished(false);
      setIndex(0);
      setReview(false);
      setDirty(false);
      void qc.invalidateQueries({ queryKey: ["communication-sessions", userId] });
    },
    onError: (e) => toast.error(e.message),
  });
  function update(field: "answer" | "reflection", value: string) {
    setDirty(true);
    setEntries(entries.map((e, i) => (i === index ? { ...e, [field]: value } : e)));
  }
  const feedback = communicationFeedback(current?.answer ?? "");
  return (
    <>
      <PageHeader
        title="Interview communication studio"
        description="Rehearse your answers in English, reflect on structure and keep a private practice history."
      />
      <Notice className="mb-6" title="Self-guided practice">
        Feedback here uses simple length and structure prompts. AI assessment, clinical viva,
        emergency simulations and voice interviews are not enabled. Nothing here is an official UPSC
        question, model answer or score.
      </Notice>
      {sessionId && current ? (
        <section className="surface p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="font-semibold">
              Question {index + 1} of {entries.length} ·{" "}
              {finished ? "Completed session" : dirty ? "Unsaved changes" : "Saved"}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={dirty || save.isPending}
                onClick={() => {
                  setSessionId(null);
                  setEntries([]);
                }}
              >
                Back to sessions
              </Button>
              {!finished && (
                <Button disabled={save.isPending} onClick={() => save.mutate(false)}>
                  Save draft
                </Button>
              )}
            </div>
          </div>
          <h2 className="mb-5 text-xl font-bold">{current.prompt}</h2>
          <label className="grid gap-2 text-sm font-semibold">
            Your answer
            <textarea
              className="study-input min-h-48"
              maxLength={10000}
              value={current.answer}
              readOnly={finished}
              disabled={save.isPending}
              onChange={(e) => update("answer", e.target.value)}
              placeholder="Write your response as you would say it in the interview."
            />
          </label>
          <p className="mt-2 text-xs text-muted-foreground">
            {feedback.words} words · Your answer is saved to your account only when you press Save
            draft or Finish.
          </p>
          <Button className="mt-4" variant="outline" onClick={() => setReview(!review)}>
            {review ? "Hide practice guide" : "Review answer structure"}
          </Button>
          {review && (
            <div className="mt-5 grid gap-4 rounded-xl bg-muted p-5">
              <div>
                <h3 className="font-bold">Communication prompt</h3>
                <p className="mt-2 text-sm">{feedback.suggestion}</p>
              </div>
              <div>
                <h3 className="font-bold">Answer outline</h3>
                <p className="mt-2 text-sm">
                  {prompts.find((p) => p.prompt === current.prompt)?.outline ??
                    "Check that your answer has a clear main point, a supporting example and a concise conclusion."}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                This guide does not check factual or clinical accuracy.
              </p>
            </div>
          )}
          <label className="mt-5 grid gap-2 text-sm font-semibold">
            What will you improve next time?
            <textarea
              className="study-input min-h-24"
              maxLength={2000}
              value={current.reflection}
              readOnly={finished}
              disabled={save.isPending}
              onChange={(e) => update("reflection", e.target.value)}
            />
          </label>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              variant="outline"
              disabled={index === 0 || save.isPending}
              onClick={() => {
                setIndex(index - 1);
                setReview(false);
              }}
            >
              Previous
            </Button>
            {index + 1 < entries.length && (
              <Button
                variant="outline"
                disabled={save.isPending}
                onClick={() => {
                  setIndex(index + 1);
                  setReview(false);
                }}
              >
                Next question
              </Button>
            )}
            {!finished && (
              <Button
                disabled={save.isPending || !entries.some((e) => e.answer.trim())}
                onClick={() => save.mutate(true)}
              >
                Finish and save practice
              </Button>
            )}
          </div>
        </section>
      ) : (
        <>
          <section className="surface mb-6 grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-end sm:p-7">
            <label className="grid gap-2 font-semibold">
              Practice format
              <select
                className="study-input"
                value={mode}
                onChange={(e) => setMode(e.target.value as CommunicationMode)}
              >
                <option value="general">General public service interview</option>
                <option value="english">English communication</option>
                <option value="full_mock">Full communication rehearsal</option>
              </select>
            </label>
            <Button disabled={start.isPending} size="lg" onClick={() => start.mutate()}>
              {start.isPending ? "Starting…" : "Start text practice"}
            </Button>
          </section>
          <h2 className="mb-4 text-xl font-bold">Your practice history</h2>
          {sessions.isPending ? (
            <LoadingBlock />
          ) : sessions.isError ? (
            <ErrorBlock error={sessions.error} />
          ) : !sessions.data.length ? (
            <EmptyState title="Your first rehearsal starts here">
              Practice at your own pace. There is no automated interview score.
            </EmptyState>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {sessions.data.map((s) => (
                <button
                  className="surface p-5 text-left hover:border-teal"
                  key={s.id}
                  onClick={() => {
                    const parsed = transcriptSchema.safeParse(s.transcript);
                    if (!parsed.success || !parsed.data.length) {
                      toast.error("This older session has an unsupported transcript format.");
                      return;
                    }
                    setSessionId(s.id);
                    setEntries(parsed.data);
                    setMode(s.mode as CommunicationMode);
                    setFinished(s.status === "completed");
                    setDirty(false);
                    setReview(false);
                    setIndex(0);
                  }}
                >
                  <strong className="capitalize">{s.mode.replaceAll("_", " ")}</strong>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatDate(s.started_at)} · {s.question_count} answers · {s.status}
                  </p>
                  <span className="mt-3 block text-sm font-semibold text-teal">
                    {s.status === "completed" ? "Review practice" : "Continue draft"} →
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
