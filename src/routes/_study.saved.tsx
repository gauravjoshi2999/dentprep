import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { bookmarksQuery } from "@/lib/queries";
import { useUserId } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { RequireUser } from "@/components/app/study-shell";
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader } from "@/components/app/common";
import { BookmarkButton } from "@/components/app/bookmark-button";

export const Route = createFileRoute("/_study/saved")({
  component: () => (
    <RequireUser>
      <Saved />
    </RequireUser>
  ),
  head: () => ({ meta: [{ title: "Saved learning — DentPrep" }] }),
});
function Saved() {
  const id = useUserId();
  const bookmarks = useQuery(bookmarksQuery(id));
  const content = useQuery({
    queryKey: ["saved-content", id, bookmarks.data?.map((b) => b.id).join(",")],
    enabled: !!bookmarks.data,
    queryFn: async () => {
      const ids = (type: string) =>
        bookmarks.data?.filter((b) => b.item_type === type).map((b) => b.item_id) ?? [];
      const results = await Promise.all([
        ids("lesson").length
          ? supabase
              .from("lessons")
              .select("id,title,slug,subjects(slug)")
              .eq("status", "published")
              .in("id", ids("lesson"))
          : Promise.resolve({ data: [], error: null }),
        ids("question").length
          ? supabase
              .from("questions")
              .select("id,stem,explanation")
              .eq("status", "published")
              .in("id", ids("question"))
          : Promise.resolve({ data: [], error: null }),
        ids("case").length
          ? supabase
              .from("clinical_cases")
              .select("id,title,slug")
              .eq("status", "published")
              .in("id", ids("case"))
          : Promise.resolve({ data: [], error: null }),
      ]);
      const error = results.find((r) => r.error)?.error;
      if (error) throw error;
      return {
        lessons: results[0]?.data ?? [],
        questions: results[1]?.data ?? [],
        cases: results[2]?.data ?? [],
      };
    },
  });
  if (bookmarks.isPending || content.isPending) return <LoadingBlock />;
  if (bookmarks.isError || content.isError)
    return <ErrorBlock error={bookmarks.error ?? content.error} />;
  return (
    <>
      <PageHeader
        title="Saved for later"
        description="Your bookmarked lessons, questions and clinical cases."
      />
      {!bookmarks.data.length ? (
        <EmptyState title="Build your revision collection">
          Use the Save button on a published lesson or question to find it here.
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {bookmarks.data.map((b) => {
            const lesson = content.data?.lessons.find(
              (l) => l.id === b.item_id && b.item_type === "lesson",
            );
            const question = content.data?.questions.find(
              (q) => q.id === b.item_id && b.item_type === "question",
            );
            const clinicalCase = content.data?.cases.find(
              (c) => c.id === b.item_id && b.item_type === "case",
            );
            return (
              <section key={b.id} className="surface p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-teal">{b.item_type}</p>
                    <h2 className="font-bold">
                      {lesson?.title ??
                        question?.stem ??
                        clinicalCase?.title ??
                        "Content no longer available"}
                    </h2>
                  </div>
                  <BookmarkButton
                    itemType={b.item_type as "lesson" | "question" | "case"}
                    itemId={b.item_id}
                    compact
                  />
                </div>
                {lesson?.subjects && (
                  <Link
                    to="/lesson/$subjectSlug/$lessonSlug"
                    params={{ subjectSlug: lesson.subjects.slug, lessonSlug: lesson.slug }}
                    className="mt-4 block text-sm font-semibold text-teal"
                  >
                    Read lesson →
                  </Link>
                )}
                {question && (
                  <details className="mt-4 text-sm">
                    <summary className="cursor-pointer font-semibold text-teal">
                      Review explanation
                    </summary>
                    <p className="mt-3 whitespace-pre-wrap text-muted-foreground">
                      {question.explanation}
                    </p>
                  </details>
                )}
                {clinicalCase && (
                  <Link to="/cases" className="mt-4 block text-sm font-semibold text-teal">
                    Open case library →
                  </Link>
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
