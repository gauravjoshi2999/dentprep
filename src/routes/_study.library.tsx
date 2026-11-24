import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppHero } from "@/components/app/app-hero";
import { SourceStudyShelf } from "@/components/app/source-study-shelf";
import { subjectsQuery } from "@/lib/queries";
export const Route = createFileRoute("/_study/library")({
  component: Library,
  head: () => ({ meta: [{ title: "BDS study library — DentPrep" }] }),
});
function Library() {
  const subjects = useQuery(subjectsQuery());
  const extra =
    subjects.data?.flatMap((subject) =>
      subject.lessons.map((lesson) => ({ ...lesson, subjectSlug: subject.slug })),
    ) ?? [];
  return (
    <>
      <AppHero
        eyebrow="Your study desk"
        title="BDS study library"
        description="UPSC Dental Surgeon preparation: learn a concept, solve a question, read why and apply it again. All 15 subjects now have introductory chapters."
      />
      <SourceStudyShelf />
      {extra.length > 0 && (
        <section className="surface mt-6 p-5">
          <h2 className="text-xl font-bold">Additional published lessons</h2>
          <ul className="mt-4 space-y-3">
            {extra.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  to="/lesson/$subjectSlug/$lessonSlug"
                  params={{ subjectSlug: lesson.subjectSlug, lessonSlug: lesson.slug }}
                  className="font-semibold text-teal underline"
                >
                  {lesson.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
