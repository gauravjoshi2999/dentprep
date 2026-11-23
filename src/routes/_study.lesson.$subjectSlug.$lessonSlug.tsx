import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { lessonQuery, logActivity, progressQuery } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader } from "@/components/app/common";
import { Markdown } from "@/components/app/markdown";
import { BookmarkButton } from "@/components/app/bookmark-button";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_study/lesson/$subjectSlug/$lessonSlug")({
  component: Lesson,
  head: () => ({ meta: [{ title: "Study lesson — DentPrep" }] }),
});
function Lesson() {
  const { subjectSlug, lessonSlug } = Route.useParams();
  const query = useQuery(lessonQuery(subjectSlug, lessonSlug));
  const { user } = useAuth();
  const qc = useQueryClient();
  const progress = useQuery({ ...progressQuery(user?.id ?? ""), enabled: !!user });
  const lesson = query.data?.lesson;
  const completed = progress.data?.some(
    (p) => p.lesson_id === lesson?.id && p.status === "completed",
  );
  const complete = useMutation({
    mutationFn: async () => {
      if (!user || !lesson) throw new Error("Sign in to save progress.");
      const { error } = await supabase
        .from("topic_progress")
        .upsert(
          {
            user_id: user.id,
            lesson_id: lesson.id,
            subject_id: lesson.subject_id,
            status: completed ? "in_progress" : "completed",
            last_viewed_at: new Date().toISOString(),
            completed_at: completed ? null : new Date().toISOString(),
          },
          { onConflict: "user_id,lesson_id" },
        );
      if (error) throw error;
      await logActivity();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["progress", user?.id] });
      void qc.invalidateQueries({ queryKey: ["activity", user?.id] });
      toast.success("Progress saved");
    },
    onError: (e) => toast.error(e.message),
  });
  if (query.isPending) return <LoadingBlock />;
  if (query.isError) return <ErrorBlock error={query.error} />;
  if (!lesson)
    return (
      <EmptyState title="Lesson unavailable">
        This lesson may be awaiting review or no longer published.{" "}
        <Link to="/library" className="text-teal underline">
          Return to the study library.
        </Link>
      </EmptyState>
    );
  return (
    <article className="mx-auto max-w-4xl">
      <Link to="/library" className="mb-5 inline-block text-sm font-semibold text-teal">
        ← Study library
      </Link>
      <PageHeader
        eyebrow={query.data?.subject.name ?? "Study lesson"}
        title={lesson.title}
        description={lesson.summary}
        actions={<BookmarkButton itemType="lesson" itemId={lesson.id} />}
      />
      <p className="mb-6 text-xs text-muted-foreground">
        {lesson.est_minutes} min reading ·{" "}
        {lesson.reviewed_on ? `Review date: ${lesson.reviewed_on}` : "Review date not recorded"}
      </p>
      {lesson.objectives.length > 0 && (
        <section className="surface mb-6 p-5">
          <h2 className="mb-3 font-bold">Learning objectives</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm">
            {lesson.objectives.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </section>
      )}
      <div className="surface p-5 sm:p-8">
        <Markdown>{lesson.notes_md}</Markdown>
      </div>
      {lesson.high_yield.length > 0 && (
        <section className="surface mt-6 p-5">
          <h2 className="mb-3 font-bold">Revision points</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm">
            {lesson.high_yield.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </section>
      )}
      {lesson.viva_prompts.length > 0 && (
        <section className="surface mt-6 p-5">
          <h2 className="mb-3 font-bold">Viva prompts</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm">
            {lesson.viva_prompts.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </section>
      )}
      {lesson.references.length > 0 && (
        <section className="mt-6 text-sm">
          <h2 className="mb-3 font-bold">References</h2>
          <ul className="space-y-2 text-muted-foreground">
            {lesson.references.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </section>
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        {user ? (
          <Button
            disabled={complete.isPending || progress.isPending || progress.isError}
            onClick={() => complete.mutate()}
          >
            {completed ? "Completed · Mark unfinished" : "Mark lesson complete"}
          </Button>
        ) : (
          <Button asChild>
            <Link to="/login">Sign in to save progress</Link>
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link to="/practice">Practice questions</Link>
        </Button>
      </div>
    </article>
  );
}
