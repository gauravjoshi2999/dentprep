import { describe, it, expect } from "vitest";
import { generateCycle, type PendingStudyTask } from "@/lib/study-cycles";
import { generatePlan, type PlannerInput } from "@/lib/planner";

const base: PlannerInput = {
  lengthDays: 7,
  startDate: "2026-11-23",
  dailyHours: 0.5,
  goals: ["interview"],
  subjects: [],
  weakSubjectIds: [],
  completedLessonIds: [],
  revisionDueCount: 0,
  availableQuestionCount: 0,
  availableCaseCount: 0,
};
const task = (id: string, extra: Partial<PendingStudyTask> = {}): PendingStudyTask => ({
  id,
  plan_id: "old",
  done: false,
  day_index: 0,
  task_date: "2026-10-01",
  task_type: "interview",
  subject_id: null,
  lesson_id: null,
  title: "Interview communication practice (15 min)",
  minutes: 15,
  ...extra,
});
describe("renewable study cycles", () => {
  it("carries each unresolved task once and preserves the historical objects", () => {
    const a = task("a"),
      b = task("b", { done: true });
    const snapshot = JSON.stringify([a, b]);
    const result = generateCycle(base, [a, a, b]);
    expect(result.carried).toBe(1);
    expect(result.tasks.filter((t) => t.source_task_id === "a")).toHaveLength(1);
    expect(result.tasks.some((t) => t.source_task_id === "b")).toBe(false);
    expect(JSON.stringify([a, b])).toBe(snapshot);
  });
  it.each([7, 15, 30] as const)(
    "keeps a %s-day renewal within its daily budget after a long gap",
    (lengthDays) => {
      const result = generateCycle(
        { ...base, lengthDays },
        Array.from({ length: 60 }, (_, i) => task(`t${i}`)),
      );
      for (let day = 0; day < lengthDays; day++)
        expect(
          result.tasks.filter((t) => t.day_index === day).reduce((n, t) => n + t.minutes, 0),
        ).toBeLessThanOrEqual(30);
      expect(result.tasks.every((t) => t.task_date >= "2026-11-23")).toBe(true);
      expect(new Set(result.tasks.map((t) => t.day_index)).size).toBe(lengthDays);
    },
  );
  it("defers work that cannot fit without deleting or pretending it was completed", () => {
    const long = task("long", { minutes: 120 });
    const result = generateCycle(base, [long]);
    expect(result.carried).toBe(0);
    expect(result.deferred).toBe(1);
    expect(long.done).toBe(false);
    expect(long.task_date).toBe("2026-10-01");
  });
  it("does not carry withdrawn lessons, completed lesson reads or unavailable clinical pools", () => {
    const tasks = [
      task("l", { task_type: "lesson", lesson_id: "withdrawn", subject_id: "s" }),
      task("q", { task_type: "practice" }),
      task("c", { task_type: "case" }),
    ];
    const result = generateCycle(base, tasks);
    expect(result.carried).toBe(0);
    expect(
      result.tasks.some((t) => ["lesson", "practice", "test", "case"].includes(t.task_type)),
    ).toBe(false);
    const completed = generateCycle(
      {
        ...base,
        subjects: [
          {
            id: "s",
            name: "Reviewed",
            lessons: [{ id: "l", title: "Reviewed routine", est_minutes: 20 }],
          },
        ],
        completedLessonIds: ["l"],
      },
      [task("done-read", { task_type: "lesson", subject_id: "s", lesson_id: "l" })],
    );
    expect(completed.carried).toBe(0);
  });
  it("does not manufacture a question or case pool when availability is unknown", () => {
    const { availableQuestionCount: _q, availableCaseCount: _c, ...unknown } = base;
    expect(
      generatePlan({ ...unknown, revisionDueCount: 20 }).some(
        (t) =>
          ["practice", "test", "case"].includes(t.task_type) || t.title.startsWith("Revise 20"),
      ),
    ).toBe(false);
  });
});
