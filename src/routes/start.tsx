import { createFileRoute } from "@tanstack/react-router";
import { GuidedQuest } from "@/components/app/guided-quest";
import { STUDY_COURSE_BY_ID } from "@/lib/study-course";
import { useAuth } from "@/lib/auth";
export const Route = createFileRoute("/start")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { course?: string; review?: string } => {
    const course =
      typeof search["course"] === "string" ? STUDY_COURSE_BY_ID.get(search["course"]) : undefined;
    const review =
      typeof search["review"] === "string" &&
      course?.kind !== "retention" &&
      course?.units.some((unit) => unit.id === search["review"])
        ? search["review"]
        : undefined;
    return course ? { course: course.id, ...(review ? { review } : {}) } : {};
  },
  component: LearningStart,
  head: () => ({
    meta: [
      { title: "Interactive dental study — DentPrep" },
      {
        name: "description",
        content: "Source-linked interactive chapters for UPSC Dental Surgeon preparation.",
      },
    ],
  }),
});
function LearningStart() {
  const { course, review } = Route.useSearch();
  const { user } = useAuth();
  const chapter = course ? STUDY_COURSE_BY_ID.get(course) : undefined;
  return (
    <GuidedQuest
      key={`${chapter?.id ?? "starter"}:${chapter?.version ?? 1}:${user?.id ?? "guest"}:${review ?? "learn"}`}
      course={chapter}
      reviewUnit={review}
    />
  );
}
