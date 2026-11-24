import { createFileRoute } from "@tanstack/react-router";
import { GuidedQuest } from "@/components/app/guided-quest";
import { PUBLIC_HEALTH_COURSE } from "@/lib/study-course";
import { useAuth } from "@/lib/auth";
export const Route = createFileRoute("/start")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { course?: "ph-frequency" } =>
    search["course"] === "ph-frequency" ? { course: "ph-frequency" } : {},
  component: LearningStart,
  head: () => ({
    meta: [
      { title: "Day 1 interactive starter — DentPrep" },
      {
        name: "description",
        content: "Source-linked interactive chapters for UPSC Dental Surgeon preparation.",
      },
    ],
  }),
});
function LearningStart() {
  const { course } = Route.useSearch();
  const { user } = useAuth();
  const chapter = course === "ph-frequency" ? PUBLIC_HEALTH_COURSE : undefined;
  return (
    <GuidedQuest
      key={`${chapter?.id ?? "starter"}:${chapter?.version ?? 1}:${user?.id ?? "guest"}`}
      course={chapter}
    />
  );
}
