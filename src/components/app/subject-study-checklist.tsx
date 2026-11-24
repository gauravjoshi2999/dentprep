import { useState } from "react";
import { BookOpen, CheckCircle2 } from "lucide-react";
import type { SubjectStudyBrief } from "@/lib/subject-study-briefs";

/**
 * These topic missions and recall prompts are an ungraded, session-only
 * preparation scaffold. They never update published clinical lesson status,
 * academic progress, attempt scores or medical review approval.
 */
export function SubjectStudyChecklist({
  brief,
  sourceAnchor,
}: {
  brief: SubjectStudyBrief;
  sourceAnchor: string;
}) {
  const [done, setDone] = useState<Set<number>>(new Set());
  function toggle(index: number) {
    setDone((previous) => {
      const next = new Set(previous);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }
  const chapterRow = (chapter: SubjectStudyBrief["chapters"][number], index: number) => (
    <li key={chapter.title} className="rounded-lg border border-border/80 bg-card p-3">
      <label className="flex cursor-pointer items-start gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          className="mt-1 size-4 shrink-0 accent-teal"
          checked={done.has(index)}
          onChange={() => toggle(index)}
          aria-label={`Read: ${chapter.title}`}
        />
        <span>{chapter.title}</span>
      </label>
      <p className="mt-1 pl-6 text-xs leading-relaxed text-muted-foreground">{chapter.task}</p>
    </li>
  );
  return (
    <section
      aria-label={`${brief.name} study guide`}
      className="mt-4 rounded-xl bg-muted/50 p-3 sm:p-4"
    >
      <div className="flex items-start gap-2">
        <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-extrabold">Start today · 5 guided study topics</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            UPSC Dental Surgeon preparation · guided topic roadmap
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs font-bold text-teal" role="status">
        {done.size}/{brief.chapters.length} topics read in this session
      </p>
      <ul className="mt-2 grid gap-2">
        {brief.chapters.slice(0, 2).map((chapter, index) => chapterRow(chapter, index))}
      </ul>
      <details className="mt-2 rounded-lg border border-border p-3">
        <summary className="cursor-pointer text-sm font-bold text-teal">
          Read remaining 3 topics and recall prompts
        </summary>
        <ul className="mt-3 grid gap-2">
          {brief.chapters.slice(2).map((chapter, index) => chapterRow(chapter, index + 2))}
        </ul>
        <h4 className="mt-4 text-sm font-bold">Active recall · explain without notes</h4>
        <ol className="mt-2 list-inside list-decimal space-y-2 text-sm text-muted-foreground">
          {brief.recall.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-muted-foreground">
          Use these recall prompts after studying. Check your explanation against the original
          source.
        </p>
      </details>
      <a
        href={`#${sourceAnchor}`}
        className="mt-3 inline-block text-sm font-bold text-teal underline underline-offset-4"
      >
        Open subject references ↓
      </a>
    </section>
  );
}
