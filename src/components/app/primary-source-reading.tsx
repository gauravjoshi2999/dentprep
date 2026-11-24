import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, BookOpen, CheckCircle2 } from "lucide-react";
import {
  FIRST_DENTAL_READING as firstSource,
  SECOND_DENTAL_READING,
  type DentalReading,
} from "@/lib/primary-reading";
import { Button } from "@/components/ui/button";
import { ClinicalReviewRequest } from "./clinical-review-request";
import { READING_SECTIONS } from "@/lib/reading-sections";

type SourceReading = DentalReading;

export function PrimarySourceReading({ source = firstSource }: { source?: SourceReading }) {
  const isFirstReading = source.id === firstSource.id;
  const isOralSurgeryReading = source.id === SECOND_DENTAL_READING.id;
  const sections = READING_SECTIONS[source.id] ?? [];
  const [checked, setChecked] = useState<Set<number>>(new Set());
  return (
    <section
      id={isFirstReading ? "primary-reading" : `source-reading-${source.id}`}
      aria-labelledby={`source-reading-title-${source.id}`}
      className="surface mb-7 scroll-mt-6 border-teal/40 p-5 sm:p-7"
    >
      <div className="flex items-start gap-3">
        <BookOpen className="mt-1 h-6 w-6 shrink-0 text-teal" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-teal">
            Dental reference reading · Available now
          </p>
          <h2 id={`source-reading-title-${source.id}`} className="mt-2 text-xl font-extrabold">
            {source.title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {source.subject} · {source.publisher}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {source.edition} · Source link checked {source.checkedOn}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Read the original professional reference on its publisher's website. This reading link is
        separate from DentPrep lessons, which need independent dental review before they are
        unlocked. Follow qualified guidance for applying a guideline in your own clinical setting.
      </p>
      {isOralSurgeryReading && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This source is written for UK professional practice. Do not transfer drug, INR, emergency
          service or procedure recommendations to India without individual assessment and current
          local qualified guidance. Reading it does not unlock DentPrep clinical lessons.
        </p>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Button asChild>
          <a href={source.guideUrl} target="_blank" rel="noopener noreferrer">
            {isFirstReading ? "Open official guide (PDF)" : "Open official guidance"}
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
        <a
          href={source.publisherUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-teal underline underline-offset-4"
        >
          Publisher and latest updates
        </a>
      </div>
      {sections.length > 0 && (
        <details className="mt-5 rounded-xl border border-border bg-muted/40 p-4">
          <summary className="cursor-pointer text-sm font-bold text-teal">
            Read the exact source sections
          </summary>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Choose a section, read the original, then make your own recall note. These links were
            checked on 24 November 2026; they do not approve a DentPrep lesson or verify your
            clinical understanding. Check the publisher for later changes.
          </p>
          <ol className="mt-3 grid gap-3 sm:grid-cols-2" aria-label="Oral surgery source sections">
            {sections.map((section, index) => (
              <li key={section.sourceId} className="min-w-0 rounded-lg bg-card p-3">
                <a
                  href={section.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-teal underline underline-offset-4"
                >
                  {index + 1}. {section.title}
                </a>
                <p className="mt-1 text-xs text-muted-foreground">
                  {section.publisher} · {section.edition}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{section.locator}</p>
                <p className="mt-1 text-xs font-semibold">{section.context}</p>
              </li>
            ))}
          </ol>
        </details>
      )}
      <fieldset className="mt-6 rounded-xl bg-muted/60 p-4">
        <legend className="px-1 text-sm font-bold">
          {isFirstReading
            ? "Your reading checklist"
            : isOralSurgeryReading
              ? "Oral surgery reading checklist"
              : `${source.subject} reading checklist`}
        </legend>
        <p className="mb-3 text-xs text-muted-foreground">
          For this session only; checklist ticks are not saved or assessed as clinical knowledge.
        </p>
        <div className="grid gap-3">
          {source.readingSteps.map((step, index) => (
            <label key={step} className="flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 accent-teal"
                checked={checked.has(index)}
                onChange={() =>
                  setChecked((old) => {
                    const next = new Set(old);
                    if (next.has(index)) next.delete(index);
                    else next.add(index);
                    return next;
                  })
                }
              />
              <span>{step}</span>
            </label>
          ))}
        </div>
        {checked.size === source.readingSteps.length && (
          <p role="status" className="mt-4 flex items-start gap-2 text-sm font-semibold text-teal">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            Reading checklist complete. Bring your clinical questions to a qualified educator.
          </p>
        )}
      </fieldset>
      <ClinicalReviewRequest
        subject={source.subject}
        subjectSlug={source.subjectSlug}
        sourceId={source.id}
        sourceTitle={source.title}
        sourceEdition={source.edition}
        sourceUrl={source.guideUrl}
      />
      <p className="mt-5 text-sm">
        <Link to="/interviews" className="font-semibold text-teal">
          Next: practise explaining your learning in English →
        </Link>
      </p>
    </section>
  );
}
