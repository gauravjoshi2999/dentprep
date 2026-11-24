
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BookOpenCheck, CheckCircle2, Lightbulb, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/app/brand";
import { Notice } from "@/components/app/common";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { STARTER_UNITS, starterCorrect } from "@/lib/starter-quest";

export const Route = createFileRoute("/start")({
  component: DayOneStarter,
  head: () => ({
    meta: [
      { title: "Day 1 interactive starter — DentPrep" },
      { name: "description", content: "A nonclinical, evidence-linked introduction to effective study methods." },
    ],
  }),
});

function DayOneStarter() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [hint, setHint] = useState(false);
  const [finished, setFinished] = useState(false);
  const [save, setSave] = useState<"none" | "saving" | "saved" | "failed" | "guest">("none");
  const unit = STARTER_UNITS[index] ?? STARTER_UNITS[0]!;
  const correct = starterCorrect(unit, choice);

  function next() {
    if (!checked || !correct) return;
    setIndex((old) => Math.min(old + 1, STARTER_UNITS.length - 1));
    setChoice(null);
    setChecked(false);
    setHint(false);
  }

  async function finish() {
    if (finished || !checked || !correct) return;
    setFinished(true);
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
          <Link to="/" aria-label="DentPrep home"><Brand /></Link>
          <Link to="/dashboard" className="text-sm font-semibold text-teal">My study space</Link>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <section className="mb-6 rounded-[1.75rem] bg-hero p-6 text-white sm:p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-[#9df3e1]">Day 1 · Start learning today</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Your first DentPrep quest</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/80">
            Practise study skills, source awareness and reliable exam preparation in four interactive challenges.
            You can start even if the clinical lesson library is awaiting expert approval.
          </p>
          <div className="mt-4 text-xs font-semibold text-white/80">Four steps · Approximately 15 minutes · Nonclinical learning</div>
        </section>
        <Notice title="Honest learning" className="mb-6">
          This starter teaches general learning techniques, not unreviewed dentistry or official UPSC questions.
          It is not a clinical mastery test. Published subject outlines, personal plans and interview communication
          practice are available separately.
        </Notice>

        {finished ? (
          <section aria-label="Quest finished" className="surface p-6 sm:p-8">
            <CheckCircle2 className="h-12 w-12 text-teal" aria-hidden="true" />
            <h2 className="mt-3 text-2xl font-extrabold">Day 1 starter completed</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You practised recall, spaced revision, source verification and official-information awareness.
              These exercises do not measure dental knowledge or exam readiness.
            </p>
            {save === "saving" && <p role="status" className="mt-4 text-sm">Recording today's activity…</p>}
            {save === "saved" && <p role="status" className="mt-4 text-sm font-bold text-teal">Today's activity was recorded in your account. Individual starter answers are not stored.</p>}
            {save === "failed" && <p role="alert" className="mt-4 text-sm text-destructive">Could not record today's activity. No score or answer was saved.</p>}
            {save === "guest" && <p className="mt-4 text-sm text-muted-foreground">Guest session: this completion is not saved. Sign in to use your personal study plan.</p>}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Button asChild><Link to="/library">Explore BDS subjects</Link></Button>
              <Button asChild variant="outline"><Link to="/plan">Make a study plan</Link></Button>
              <Button asChild variant="outline"><Link to="/interviews">Practise interview</Link></Button>
            </div>
            <Button variant="ghost" className="mt-5" onClick={() => { setIndex(0); setChoice(null); setChecked(false); setHint(false); setFinished(false); setSave("none"); }}><RotateCcw className="mr-2 h-4 w-4" />Repeat starter</Button>
          </section>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between gap-4 text-sm font-semibold">
              <span>Step {index + 1} of {STARTER_UNITS.length}</span>
              <span>{Math.round(100 * index / STARTER_UNITS.length)}% completed</span>
            </div>
            <div role="progressbar" aria-label="Starter progress" aria-valuenow={index} aria-valuemin={0} aria-valuemax={STARTER_UNITS.length} className="mb-6 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-teal" style={{ width: String(100 * index / STARTER_UNITS.length) + "%" }} />
            </div>
            <section aria-label="Current learning unit" className="surface p-5 sm:p-8">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-teal"><BookOpenCheck className="h-5 w-5" />Learning skills · Nonclinical</div>
              <h2 className="text-2xl font-extrabold">{unit.title}</h2>
              <p className="mt-4 leading-relaxed">{unit.lesson}</p>
              <a href={unit.href} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal underline underline-offset-4"><ShieldCheck className="h-4 w-4" />Source: {unit.citation}</a>
              <div className="mt-7 rounded-2xl border border-border bg-muted/40 p-4 sm:p-6">
                <h3 className="text-lg font-extrabold">{unit.question}</h3>
                <div role="group" aria-label="Answer choices" className="mt-4 grid gap-3">
                  {unit.choices.map((option, i) => (
                    <button type="button" key={option} aria-pressed={choice === i} disabled={checked && correct} onClick={() => { setChoice(i); setChecked(false); }} className={choice === i ? "rounded-xl border-2 border-teal bg-teal-soft p-4 text-left text-sm font-semibold" : "rounded-xl border border-border bg-card p-4 text-left text-sm font-semibold hover:border-teal"}>
                      <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-current text-xs">{String.fromCharCode(65 + i)}</span>{option}
                    </button>
                  ))}
                </div>
                {!checked && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button disabled={choice === null} onClick={() => setChecked(true)}>Check answer</Button>
                    <Button variant="outline" onClick={() => setHint((old) => !old)}><Lightbulb className="mr-2 h-4 w-4" />{hint ? "Hide hint" : "Show hint"}</Button>
                  </div>
                )}
                {hint && !correct && <p className="mt-4 rounded-xl bg-teal-soft p-3 text-sm"><strong>Hint:</strong> {unit.hint}</p>}
                {checked && (
                  <div aria-live="polite" className={correct ? "mt-4 rounded-xl border border-teal/30 bg-teal-soft p-4" : "mt-4 rounded-xl border border-warning/40 bg-warning/10 p-4"}>
                    <p className="font-extrabold">{correct ? "Correct — keep practicing this skill" : "Not quite — try another answer"}</p>
                    <p className="mt-2 text-sm">{correct ? unit.explanation : "Read the lesson or open the hint, then choose a different option."}</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {index > 0 && <Button variant="outline" onClick={() => { setIndex((old) => old - 1); setChoice(null); setChecked(false); setHint(false); }}>Previous</Button>}
                {index < STARTER_UNITS.length - 1 ? (
                  <Button disabled={!checked || !correct} onClick={next}>Next lesson <ArrowRight className="ml-2 h-4 w-4" /></Button>
                ) : (
                  <Button disabled={!checked || !correct} onClick={() => void finish()}>Finish Day 1 starter <CheckCircle2 className="ml-2 h-4 w-4" /></Button>
                )}
              </div>
            </section>
          </>
        )}
        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          This optional introductory activity is not a dental lesson, diagnostic score or medical approval.
          The quest does not persist individual answers or completion status across reloads. If signed in,
          successful completion records only an activity event for today.
        </p>
      </div>
    </main>
  );
}
