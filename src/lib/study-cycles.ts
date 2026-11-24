import { addDays } from "./dates";
import { STUDY_BRIEF_BY_SLUG } from "./subject-study-briefs";
import { chapterForSubject } from "./study-course";
import { generatePlan, type PlannerInput, type PlannedTask, type TaskType } from "./planner";

export type PendingStudyTask = PlannedTask & { id: string; plan_id: string; done: boolean };
export type CycleTask = PlannedTask & { source_task_id?: string };
const goalReview = "Review your study goals and official recruitment information";

/** Carry unresolved work first, without mutating history or assuming unavailable clinical content. */
export function generateCycle(input: PlannerInput, pending: PendingStudyTask[]) {
  const fresh = generatePlan(input);
  const budget = Math.round(input.dailyHours * 60);
  const minutes = Array.from({ length: input.lengthDays }, () => 0);
  const tasks: CycleTask[] = [];
  const seen = new Set<string>();
  const completed = new Set(input.completedLessonIds);
  const lessons = new Set(input.subjects.flatMap((s) => s.lessons.map((l) => l.id)));
  const subjects = new Set(input.subjects.map((s) => s.id));
  const types: TaskType[] = ["lesson", "practice", "revision", "interview", "case", "test"];
  const sourceGuideTitles = new Set(
    input.subjects.flatMap((subject) => {
      const brief = STUDY_BRIEF_BY_SLUG.get(subject.slug ?? "");
      const course = chapterForSubject(subject.slug ?? "");
      const concepts = [
        ...(brief?.chapters ?? []),
        ...(course?.units.filter((unit) => unit.phase === "learn") ?? []),
      ];
      return concepts.flatMap((chapter) => [
        `Source study: ${subject.name} — ${chapter.title}`,
        `Recall source: ${subject.name} — ${chapter.title}`,
      ]);
    }),
  );
  const isGuidedReview = (t: PlannedTask) =>
    t.task_type === "revision" &&
    !!t.subject_id &&
    !t.lesson_id &&
    sourceGuideTitles.has(t.title.replace(/^(Continue: )+/, ""));
  const eligible = (t: PlannedTask) =>
    types.includes(t.task_type) &&
    Number.isFinite(t.minutes) &&
    t.minutes > 0 &&
    (!t.subject_id || subjects.has(t.subject_id)) &&
    (!t.lesson_id || lessons.has(t.lesson_id)) &&
    !(t.task_type === "lesson" && (!t.lesson_id || completed.has(t.lesson_id))) &&
    (!(t.task_type === "practice" || t.task_type === "test") ||
      (input.availableQuestionCount ?? 0) > 0) &&
    (t.task_type !== "case" || (input.availableCaseCount ?? 0) > 0) &&
    !(
      t.task_type === "revision" &&
      !t.lesson_id &&
      t.title.replace(/^(Continue: )+/, "") !== goalReview &&
      !isGuidedReview(t) &&
      !(input.availableQuestionCount ?? 0)
    );
  let carried = 0;
  for (const t of [...pending].sort(
    (a, b) => a.task_date.localeCompare(b.task_date) || a.id.localeCompare(b.id),
  )) {
    if (seen.has(t.id) || t.done) continue;
    seen.add(t.id);
    if (!eligible(t)) continue;
    const day = minutes.findIndex((n) => n + t.minutes <= budget);
    if (day < 0) continue;
    tasks.push({
      ...t,
      day_index: day,
      task_date: addDays(input.startDate, day),
      source_task_id: t.id,
      title: `Continue: ${t.title.replace(/^(Continue: )+/, "")}`,
    });
    minutes[day] = (minutes[day] ?? 0) + t.minutes;
    carried++;
  }
  for (const t of fresh) {
    if (!eligible(t) || (minutes[t.day_index] ?? 0) + t.minutes > budget) continue;
    // A carried source-study task takes precedence over the same fresh topic.
    if (
      t.task_type === "revision" &&
      t.title.startsWith("Source study:") &&
      tasks.some((old) => old.title.replace(/^(Continue: )+/, "") === t.title)
    )
      continue;
    if (
      t.task_type === "lesson" &&
      tasks.some((old) => old.task_type === "lesson" && old.lesson_id === t.lesson_id)
    )
      continue;
    if (
      t.task_type === "revision" &&
      t.lesson_id &&
      !completed.has(t.lesson_id) &&
      !tasks.some(
        (old) =>
          old.task_type === "lesson" &&
          old.lesson_id === t.lesson_id &&
          old.day_index < t.day_index,
      )
    )
      continue;
    tasks.push(t);
    minutes[t.day_index] = (minutes[t.day_index] ?? 0) + t.minutes;
  }
  for (let day = 0; day < input.lengthDays; day++) {
    if (!tasks.some((t) => t.day_index === day))
      tasks.push({
        day_index: day,
        task_date: addDays(input.startDate, day),
        task_type: "revision",
        subject_id: null,
        lesson_id: null,
        title: goalReview,
        minutes: Math.min(15, budget),
      });
  }
  tasks.sort((a, b) => a.day_index - b.day_index);
  return { tasks, carried, deferred: seen.size - carried };
}
