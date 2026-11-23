import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Search } from "lucide-react";
import { subjectsQuery } from "@/lib/queries";
import { EmptyState, ErrorBlock, LoadingBlock, Notice, PageHeader } from "@/components/app/common";

export const Route = createFileRoute("/_study/library")({
  component: Library,
  head: () => ({ meta: [{ title: "BDS study library — DentPrep" }] }),
});
function Library() {
  const subjects = useQuery(subjectsQuery());
  const [search, setSearch] = useState("");
  return (
    <>
      <PageHeader
        eyebrow="Learn with clarity"
        title="BDS study library"
        description="English study notes, learning objectives and revision prompts, released after content review."
      />
      <label className="mb-6 flex max-w-xl items-center gap-3">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          type="search"
          aria-label="Search subjects and lessons"
          className="study-input"
          placeholder="Search subjects or lessons"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      {subjects.isPending ? (
        <LoadingBlock />
      ) : subjects.isError ? (
        <ErrorBlock error={subjects.error} onRetry={() => void subjects.refetch()} />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          {subjects.data
            .filter((s) =>
              `${s.name} ${s.description} ${s.lessons.map((l) => l.title).join(" ")}`
                .toLowerCase()
                .includes(search.toLowerCase()),
            )
            .map((s) => (
              <section key={s.id} className="surface p-5 sm:p-6">
                <div className="mb-3 flex items-start gap-3">
                  <span className="rounded-xl bg-teal-soft p-2.5 text-secondary-foreground">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold">{s.name}</h2>
                    <p className="mt-1 text-xs font-semibold text-teal">
                      {s.lessons.length} published lessons
                    </p>
                  </div>
                </div>
                <p className="mb-5 text-sm text-muted-foreground">{s.description}</p>
                {s.lessons.length ? (
                  <ul className="divide-y divide-border">
                    {s.lessons
                      .filter(
                        (l) =>
                          !search ||
                          `${s.name} ${l.title}`.toLowerCase().includes(search.toLowerCase()),
                      )
                      .map((l) => (
                        <li key={l.id}>
                          <Link
                            to="/lesson/$subjectSlug/$lessonSlug"
                            params={{ subjectSlug: s.slug, lessonSlug: l.slug }}
                            className="block rounded-lg py-3 hover:bg-muted"
                          >
                            <strong>{l.title}</strong>
                            <p className="mt-1 text-sm text-muted-foreground">{l.summary}</p>
                            <span className="mt-2 block text-xs text-teal">
                              {l.est_minutes} min · Read lesson →
                            </span>
                          </Link>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <Notice title="Lessons awaiting review">
                    The curriculum outline is available. Detailed clinical lessons will appear here
                    after review.
                  </Notice>
                )}
              </section>
            ))}
          {!subjects.data.some((s) =>
            `${s.name} ${s.description} ${s.lessons.map((l) => l.title).join(" ")}`
              .toLowerCase()
              .includes(search.toLowerCase()),
          ) && (
            <EmptyState title="No matching subjects">
              Try a different subject or topic name.
            </EmptyState>
          )}
        </div>
      )}
    </>
  );
}
