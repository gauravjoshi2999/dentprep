import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Bookmark, Search } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { STUDY_COURSES } from "@/lib/study-course";
import { SUBJECT_STUDY_BRIEFS } from "@/lib/subject-study-briefs";
import {
  questOverviewQuery,
  toggleStudyBookmark,
  studyAvailabilityQuery,
  studyVersionAvailable,
} from "@/lib/quest-progress";
import { ErrorBlock } from "@/components/app/common";

export function SourceStudyShelf({
  mode = "library",
}: {
  mode?: "library" | "practice" | "saved";
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const availability = useQuery(studyAvailabilityQuery());
  const report = useQuery(questOverviewQuery(user?.id ?? ""));
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const bookmark = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) =>
      toggleStudyBookmark({ id, version: 1 }, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["source-study", user?.id] }),
  });
  const visible = STUDY_COURSES.filter((course) => {
    if (!studyVersionAvailable(availability.data, course)) return false;
    const row = report.data?.find((item) => item.course_id === course.id);
    const group = SUBJECT_STUDY_BRIEFS.find(
      (brief) => brief.slug === course.subject_slug,
    )?.category;
    return (
      (mode !== "saved" || row?.bookmarked) &&
      (category === "All" || group === category) &&
      `${course.subject} ${course.title} ${course.units.map((unit) => `${unit.title} ${unit.lesson}`).join(" ")}`
        .toLowerCase()
        .includes(search.trim().toLowerCase())
    );
  });
  return (
    <section
      aria-label={mode === "saved" ? "Bookmarked source chapters" : "Available subject chapters"}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="study-guides" className="scroll-mt-6 text-xl font-extrabold">
          {mode === "saved"
            ? "Saved chapters"
            : mode === "practice"
              ? "Subject question practice"
              : "Study Library"}
        </h2>
        <span className="text-sm font-bold text-teal">
          {visible.length} Subjects ·{" "}
          {mode === "saved"
            ? "bookmarked chapters"
            : "15 chapters · 60 teaching sections · 120 questions"}
        </span>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        Open a chapter to read, answer, see the explanation and apply the idea to a different
        question. All subjects have actual introductory notes. The full BDS curriculum still needs
        further chapters.
      </p>
      <label className="mb-4 flex max-w-xl items-center gap-3">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          className="study-input"
          type="search"
          aria-label="Search subjects and lessons"
          placeholder="Search subjects, concepts or notes"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2" aria-label="Subject categories">
        {["All", "Clinical", "Basics", "Public Health"].map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
            className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-bold ${category === item ? "bg-teal text-teal-foreground" : "bg-card text-muted-foreground ring-1 ring-border"}`}
          >
            {item}
          </button>
        ))}
      </div>
      {user && report.isError && (
        <ErrorBlock error={report.error} onRetry={() => void report.refetch()} />
      )}
      {bookmark.isError && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          Could not update bookmark. {bookmark.error.message}
        </p>
      )}
      {availability.isPending && <p role="status">Loading available study chapters…</p>}
      {availability.isError && (
        <ErrorBlock error={availability.error} onRetry={() => void availability.refetch()} />
      )}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        {visible.map((course) => {
          const row = report.data?.find((item) => item.course_id === course.id);
          const lessons = course.units.filter((unit) => unit.phase === "learn");
          return (
            <article
              key={course.id}
              className="surface bg-teal-soft/20 p-5 sm:p-6"
              aria-label={`${course.subject} chapter`}
            >
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-teal-soft p-2.5 text-teal">
                  <BookOpen className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-extrabold">{course.subject}</h3>
                  <p className="mt-1 text-xs font-bold text-teal">
                    Chapter 1 ready · {lessons.length} teaching sections · {course.units.length}{" "}
                    questions
                  </p>
                </div>
                {user && (
                  <button
                    type="button"
                    className="rounded-lg p-2 text-teal hover:bg-teal-soft"
                    aria-label={`${row?.bookmarked ? "Remove bookmark for" : "Bookmark"} ${course.subject}`}
                    aria-pressed={!!row?.bookmarked}
                    disabled={bookmark.isPending || report.isPending || report.isError}
                    onClick={() => bookmark.mutate({ id: course.id, value: !row?.bookmarked })}
                  >
                    <Bookmark className={`h-5 w-5 ${row?.bookmarked ? "fill-current" : ""}`} />
                  </button>
                )}
              </div>
              <h4 className="mt-4 font-bold">{course.title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{course.summary}</p>
              <ul className="mt-4 grid gap-2 text-sm">
                {lessons.map((unit, index) => (
                  <li key={unit.id} className="flex gap-2">
                    <span className="font-bold text-teal">{index + 1}.</span>
                    {unit.title}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                {row
                  ? `${row.next_step}/${row.total_steps} challenges completed${row.first_choices.length ? ` · ${row.first_correct}/${row.first_choices.length} first correct` : ""}`
                  : user
                    ? "Loading saved checkpoint…"
                    : "Guest study available · sign in to save"}
              </p>
              <Link
                to="/start"
                search={{ course: course.id }}
                className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-teal px-4 py-3 text-sm font-bold text-teal-foreground"
              >
                {row?.completed_at
                  ? "Revisit chapter"
                  : row?.next_step
                    ? "Continue chapter"
                    : "Start chapter"}{" "}
                →
              </Link>
              <details className="mt-5 border-t border-border pt-4">
                <summary className="cursor-pointer text-sm font-bold text-teal">
                  Read notes and sources
                </summary>
                <div className="mt-4 space-y-5">
                  {lessons.map((unit) => (
                    <section key={unit.id}>
                      <h5 className="font-bold">{unit.title}</h5>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                        {unit.lesson}
                      </p>
                      <div className="mt-2 text-xs">
                        {course.sources
                          .filter((source) => unit.source_ids.includes(source.id))
                          .map((source) => (
                            <a
                              key={source.id}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mr-3 inline-block text-teal underline"
                            >
                              {source.title}
                            </a>
                          ))}
                      </div>
                    </section>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    AI-assisted, primary-source checked · Content v{course.version} · Source check{" "}
                    {course.checked_on}. Original exam practice. Reading alone does not create a
                    saved question result.
                  </p>
                </div>
              </details>
            </article>
          );
        })}
      </div>
      {!visible.length && availability.isSuccess && (
        <p className="surface p-5 text-sm">
          {mode === "saved"
            ? "Bookmark a chapter from the Study library to keep it here."
            : "No matching subjects. Try another concept or category."}
        </p>
      )}
    </section>
  );
}
