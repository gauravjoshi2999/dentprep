import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Lightbulb,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/app/brand";
import { Notice } from "@/components/app/common";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { STARTER_UNITS, starterCorrect, type StarterUnit } from "@/lib/starter-quest";
import type { StudyCourse } from "@/lib/study-course";
import { studyIssueUrl } from "@/lib/study-course";
import { EMPTY_QUEST_PROGRESS, loadQuestProgress, submitQuestAnswer } from "@/lib/quest-progress";
type LearningUnit = StarterUnit & {
  phase?: "learn" | "apply";
  rationales?: readonly string[];
  source_ids?: string[];
};

export function GuidedQuest({ course }: { course?: StudyCourse | undefined }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;
  const units: readonly LearningUnit[] = course
    ? course.units.map((unit) => {
        const source = course.sources.find((source) => source.id === unit.source_ids[0])!;
        return { ...unit, citation: source.title, href: source.url };
      })
    : STARTER_UNITS;
  const [checkpoint, setCheckpoint] = useState(EMPTY_QUEST_PROGRESS);
  const [loaded, setLoaded] = useState(!course || !user);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [review, setReview] = useState(false);
  const [firstAnswers, setFirstAnswers] = useState<Record<number, number>>({});
  const pending = useRef<{ step: number; choice: number; id: string } | null>(null);
  const [receiptCorrect, setReceiptCorrect] = useState<boolean | null>(null);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [hint, setHint] = useState(false);
  const [finished, setFinished] = useState(false);
  const [save, setSave] = useState<"none" | "saving" | "saved" | "failed" | "guest">("none");
  const unit = units[index] ?? units[0]!;
  const correct = receiptCorrect ?? starterCorrect(unit, choice);
  useEffect(() => {
    if (!course || !userId) return;
    let active = true;
    void loadQuestProgress(course)
      .then((state) => {
        if (!active) return;
        setCheckpoint(state);
        setIndex(Math.min(state.next_step, units.length - 1));
        setFinished(state.next_step === units.length);
        setLoaded(true);
      })
      .catch((error) => {
        if (active)
          setFailure(error instanceof Error ? error.message : "Could not load your checkpoint");
      });
    return () => {
      active = false;
    };
  }, [course, userId, units.length]);
  async function checkAnswer() {
    if (choice === null || busy || checked || !loaded) return;
    setFailure(null);
    if (!course || !user || review) {
      setFirstAnswers((old) => (index in old ? old : { ...old, [index]: choice }));
      setReceiptCorrect(starterCorrect(unit, choice));
      setChecked(true);
      return;
    }
    const request =
      pending.current?.step === index && pending.current.choice === choice
        ? pending.current
        : { step: index, choice, id: crypto.randomUUID() };
    pending.current = request;
    setBusy(true);
    try {
      const state = await submitQuestAnswer(course, index, choice, checkpoint.revision, request.id);
      if (state.last_result?.step !== index || state.last_result.choice !== choice)
        throw Error("Unexpected answer receipt; reload saved progress");
      setCheckpoint(state);
      setReceiptCorrect(state.last_result.correct);
      setChecked(true);
      pending.current = null;
      if (state.completed_at) await qc.invalidateQueries({ queryKey: ["activity", user.id] });
    } catch (error) {
      setFailure(
        error instanceof Error ? error.message : "Could not save the answer; retry the check",
      );
    } finally {
      setBusy(false);
    }
  }
  async function reloadProgress() {
    if (!course || !user) return;
    setBusy(true);
    setFailure(null);
    try {
      const state = await loadQuestProgress(course);
      setCheckpoint(state);
      setIndex(Math.min(state.next_step, units.length - 1));
      setFinished(state.next_step === units.length);
      setChoice(null);
      setChecked(false);
      setReceiptCorrect(null);
      setHint(false);
      pending.current = null;
      setLoaded(true);
    } catch (error) {
      setFailure(error instanceof Error ? error.message : "Could not reload the checkpoint");
    } finally {
      setBusy(false);
    }
  }
  const firstScore =
    course && user
      ? checkpoint.first_correct
      : Object.entries(firstAnswers).filter(([i, value]) => units[Number(i)]?.answer === value)
          .length;

  function next() {
    if (!checked || !correct) return;
    setIndex((old) => Math.min(old + 1, units.length - 1));
    setChoice(null);
    setChecked(false);
    setReceiptCorrect(null);
    setHint(false);
  }

  async function finish() {
    if (finished || !checked || !correct) return;
    setFinished(true);
    if (course) return;
    if (!user) {
      setSave("guest");
      return;
    }
    setSave("saving");
    try {
      const { error } = await supabase.rpc("log_activity");
      if (error) throw error;
      setSave("saved");
      await qc.invalidateQueries({ queryKey: ["activity", user.id] });
    } catch {
      setSave("failed");
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-4">
          <Link to="/" aria-label="DentPrep home">
            <Brand />
          </Link>
          <Link to="/dashboard" className="text-sm font-semibold text-teal">
            My study space
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <section className="mb-6 rounded-[1.75rem] bg-hero p-6 text-white sm:p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-[#9df3e1]">
            {course ? `${course.subject} · Chapter 1` : "Day 1 · Start learning today"}
          </p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            {course?.title ?? "Your first DentPrep quest"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/80">
            {course?.summary ??
              "Practise study skills, source awareness and reliable UPSC Dental Surgeon preparation in four interactive challenges."}
          </p>
          <div className="mt-4 text-xs font-semibold text-white/80">
            {course
              ? "4 lessons + 4 fresh challenges · Approximately 15 minutes"
              : "Four steps · Approximately 15 minutes · Nonclinical learning"}
          </div>
        </section>
        <p className="mb-5 text-xs leading-relaxed text-muted-foreground">
          {course
            ? "AI-assisted study notes checked against the linked primary sources. Original practice for UPSC Dental Surgeon preparation; no official syllabus, weightage, clinical certification or selection prediction is claimed."
            : "Source-linked study skills and original practice for independent exam preparation."}
        </p>
        {course && !user && (
          <Notice title="Guest practice" className="mb-5">
            Study now.{" "}
            <Link to="/login" className="font-bold text-teal">
              Sign in
            </Link>{" "}
            to save answers and resume across devices.
          </Notice>
        )}
        {course && user && !loaded && (
          <p role="status" className="mb-4 text-sm">
            Loading your study checkpoint…
          </p>
        )}
        {review && (
          <Notice title="Chapter review" className="mb-5">
            Replaying questions keeps your saved first-attempt result unchanged.
          </Notice>
        )}
        {failure && (
          <div role="alert" className="mb-5 surface p-4 text-sm text-destructive">
            <p>{failure}</p>
            <p>
              Your displayed answer has not been confirmed saved. Retry the check or reload your
              checkpoint.
            </p>
            {course && user && (
              <Button
                variant="outline"
                className="mt-3"
                disabled={busy}
                onClick={() => void reloadProgress()}
              >
                Reload saved progress
              </Button>
            )}
          </div>
        )}

        {finished ? (
          <section aria-label="Quest finished" className="surface p-6 sm:p-8">
            <CheckCircle2 className="h-12 w-12 text-teal" aria-hidden="true" />
            <h2 className="mt-3 text-2xl font-extrabold">
              {course ? "Chapter completed" : "Day 1 starter completed"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {course
                ? "You practised comparable dental surveys, denominators, prevalence and incidence with fresh examples."
                : "You practised recall, spaced revision, source verification and official-information awareness."}
            </p>
            {course && (
              <p className="mt-4 text-lg font-extrabold">
                First-attempt result: {firstScore}/{units.length}
              </p>
            )}
            {course && (
              <p className="mt-2 text-sm text-muted-foreground">
                All {units.length} challenges completed with feedback. This is practice, not an
                official UPSC score or clinical competence assessment.
              </p>
            )}
            {course && user && (
              <p role="status" className="mt-4 text-sm font-bold text-teal">
                Your checkpoint and first-attempt result are saved in your account.
              </p>
            )}
            {course && !user && (
              <p className="mt-4 text-sm text-muted-foreground">
                Guest completion stays in this session.
              </p>
            )}
            {save === "saving" && (
              <p role="status" className="mt-4 text-sm">
                Recording today's activity…
              </p>
            )}
            {save === "saved" && (
              <p role="status" className="mt-4 text-sm font-bold text-teal">
                Today's activity was recorded in your account. Individual starter answers are not
                stored.
              </p>
            )}
            {save === "failed" && (
              <p role="alert" className="mt-4 text-sm text-destructive">
                Could not record today's activity. No score or answer was saved.
              </p>
            )}
            {save === "guest" && (
              <p className="mt-4 text-sm text-muted-foreground">
                Guest session: this completion is not saved. Sign in to use your personal study
                plan.
              </p>
            )}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Button asChild>
                <Link to="/library">Explore BDS subjects</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/plan">Make a study plan</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/interviews">Practise interview</Link>
              </Button>
            </div>
            <Button
              variant="ghost"
              className="mt-5"
              onClick={() => {
                setIndex(0);
                setChoice(null);
                setChecked(false);
                setReceiptCorrect(null);
                setHint(false);
                setFinished(false);
                setSave("none");
                if (course) setReview(true);
                else setFirstAnswers({});
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {course ? "Review chapter" : "Repeat starter"}
            </Button>
          </section>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between gap-4 text-sm font-semibold">
              <span>
                Step {index + 1} of {units.length}
              </span>
              <span>{Math.round((100 * index) / units.length)}% completed</span>
            </div>
            <div
              role="progressbar"
              aria-label="Starter progress"
              aria-valuenow={index}
              aria-valuemin={0}
              aria-valuemax={units.length}
              className="mb-6 h-2 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-teal"
                style={{ width: String((100 * index) / units.length) + "%" }}
              />
            </div>
            <section aria-label="Current learning unit" className="surface p-5 sm:p-8">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-teal">
                <BookOpenCheck className="h-5 w-5" />
                {course
                  ? unit.phase === "apply"
                    ? "Fresh application challenge"
                    : "Learn one concept"
                  : "Learning skills · Nonclinical"}
              </div>
              <h2 className="text-2xl font-extrabold">{unit.title}</h2>
              <p className="mt-4 leading-relaxed">{unit.lesson}</p>
              <a
                href={unit.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal underline underline-offset-4"
              >
                <ShieldCheck className="h-4 w-4" />
                Source: {unit.citation}
              </a>
              {course && (
                <details className="mt-3 text-xs text-muted-foreground">
                  <summary className="cursor-pointer">Source details and version</summary>
                  {course.sources
                    .filter((source) => unit.source_ids?.includes(source.id))
                    .map((source) => (
                      <p key={source.id} className="mt-2">
                        {source.author_or_organization} · {source.edition} ({source.year}) ·{" "}
                        {source.section} · {source.content_version} · Checked {source.checked_on}
                      </p>
                    ))}
                </details>
              )}
              <div className="mt-7 rounded-2xl border border-border bg-muted/40 p-4 sm:p-6">
                <h3 className="text-lg font-extrabold">{unit.question}</h3>
                <div role="group" aria-label="Answer choices" className="mt-4 grid gap-3">
                  {unit.choices.map((option, i) => (
                    <button
                      type="button"
                      key={option}
                      aria-pressed={choice === i}
                      disabled={busy || !loaded || (checked && correct)}
                      onClick={() => {
                        setChoice(i);
                        setChecked(false);
                        setReceiptCorrect(null);
                      }}
                      className={
                        choice === i
                          ? "rounded-xl border-2 border-teal bg-teal-soft p-4 text-left text-sm font-semibold"
                          : "rounded-xl border border-border bg-card p-4 text-left text-sm font-semibold hover:border-teal"
                      }
                    >
                      <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-current text-xs">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {option}
                    </button>
                  ))}
                </div>
                {!checked && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button
                      disabled={choice === null || busy || !loaded}
                      onClick={() => void checkAnswer()}
                    >
                      {busy ? "Saving answer…" : "Check answer"}
                    </Button>
                    <Button variant="outline" onClick={() => setHint((old) => !old)}>
                      <Lightbulb className="mr-2 h-4 w-4" />
                      {hint ? "Hide hint" : "Show hint"}
                    </Button>
                  </div>
                )}
                {hint && !correct && (
                  <p className="mt-4 rounded-xl bg-teal-soft p-3 text-sm">
                    <strong>Hint:</strong> {unit.hint}
                  </p>
                )}
                {checked && (
                  <div
                    aria-live="polite"
                    className={
                      correct
                        ? "mt-4 rounded-xl border border-teal/30 bg-teal-soft p-4"
                        : "mt-4 rounded-xl border border-warning/40 bg-warning/10 p-4"
                    }
                  >
                    <p className="font-extrabold">
                      {correct
                        ? "Correct — keep practicing this skill"
                        : "Not quite — try another answer"}
                    </p>
                    <p className="mt-2 text-sm">{unit.explanation}</p>
                    {choice !== null && unit.rationales && (
                      <p className="mt-2 text-sm">
                        <strong>Your choice:</strong> {unit.rationales[choice]}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {!course && index > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIndex((old) => old - 1);
                      setChoice(null);
                      setChecked(false);
                      setHint(false);
                    }}
                  >
                    Previous
                  </Button>
                )}
                {index < units.length - 1 ? (
                  <Button disabled={!checked || !correct} onClick={next}>
                    {course ? "Next challenge" : "Next lesson"}{" "}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button disabled={!checked || !correct} onClick={() => void finish()}>
                    {course ? "Finish chapter" : "Finish Day 1 starter"}{" "}
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </section>
          </>
        )}
        {course && (
          <a
            className="mt-6 inline-block text-xs font-semibold text-teal underline"
            href={studyIssueUrl(course, unit.id)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Report a lesson issue (GitHub)
          </a>
        )}
        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          {course
            ? "Every checked answer saves to your account when signed in. Reload to resume the next unfinished challenge. First attempts stay separate from corrected retries. Guest progress stays in this session. This chapter teaches population measurement, not patient diagnosis or treatment."
            : "This warm-up records today's activity when signed in; its individual answers are session-only."}
        </p>
      </div>
    </main>
  );
}
