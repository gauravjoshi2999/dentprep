import { describe, expect, it } from "vitest";
import { generatePlan, type PlannerSubject } from "@/lib/planner";
import { computeStreak } from "@/lib/dates";
import { nextInterval, scorePercent } from "@/lib/scoring";

const subjects: PlannerSubject[] = [
  { id: "s1", name: "Oral Surgery", lessons: [{ id: "l1", title: "Exodontia", est_minutes: 15 }, { id: "l2", title: "Infections", est_minutes: 15 }] },
  { id: "s2", name: "Periodontics", lessons: [{ id: "l3", title: "Classification", est_minutes: 15 }, { id: "l4", title: "Therapy", est_minutes: 15 }] },
  { id: "s3", name: "Emergencies", lessons: [{ id: "l5", title: "Syncope", est_minutes: 15 }] },
];
const base = { startDate: "2026-11-23", goals: ["interview" as const], subjects, completedLessonIds: [], revisionDueCount: 0 };

describe("study planner", () => {
  it("creates tasks only within the chosen 7/15/30 day window", () => {
    for (const len of [7, 15, 30] as const) {
      const plan = generatePlan({ ...base, lengthDays: len, dailyHours: 2, weakSubjectIds: [] });
      const days = new Set(plan.map((t) => t.day_index));
      expect(Math.max(...days)).toBeLessThan(len);
    }
  });

  it("never exceeds the daily study hours", () => {
    const plan = generatePlan({ ...base, lengthDays: 15, dailyHours: 1, weakSubjectIds: [] });
    const perDay: Record<number, number> = {};
    for (const t of plan) perDay[t.day_index] = (perDay[t.day_index] ?? 0) + t.minutes;
    expect(Math.max(...Object.values(perDay))).toBeLessThanOrEqual(60);
  });

  it("schedules weak-subject lessons first", () => {
    const plan = generatePlan({ ...base, lengthDays: 7, dailyHours: 2, weakSubjectIds: ["s3"] });
    const firstLesson = plan.find((t) => t.task_type === "lesson");
    expect(firstLesson?.lesson_id).toBe("l5");
  });

  it("skips lessons already completed", () => {
    const plan = generatePlan({ ...base, lengthDays: 7, dailyHours: 3, weakSubjectIds: [], completedLessonIds: ["l1"] });
    expect(plan.some((t) => t.lesson_id === "l1" && t.task_type === "lesson")).toBe(false);
  });

  it("revises a lesson 1 and 3 days after it is first studied", () => {
    const plan = generatePlan({ ...base, lengthDays: 7, dailyHours: 3, weakSubjectIds: [] });
    const studied = plan.find((t) => t.task_type === "lesson" && t.lesson_id === "l1");
    const revDays = plan.filter((t) => t.task_type === "revision" && t.lesson_id === "l1").map((t) => t.day_index);
    expect(studied?.day_index).toBe(0);
    expect(revDays).toEqual(expect.arrayContaining([1, 3]));
  });

  it("adds a mock test on day 7", () => {
    const plan = generatePlan({ ...base, lengthDays: 7, dailyHours: 2, weakSubjectIds: [] });
    expect(plan.some((t) => t.task_type === "test" && t.day_index === 6)).toBe(true);
  });

  it("does not schedule unavailable clinical content or empty days", () => {
    const plan = generatePlan({ ...base, subjects: [], lengthDays: 7, dailyHours: 0.5, weakSubjectIds: [], availableQuestionCount: 0, availableCaseCount: 0 });
    expect(plan.some(t => ["lesson", "practice", "test", "case"].includes(t.task_type))).toBe(false);
    expect(new Set(plan.map(t => t.day_index)).size).toBe(7);
    expect(plan.every(t => t.minutes > 0 && t.minutes <= 30)).toBe(true);
    expect(plan.some(t => t.title.includes("AI"))).toBe(false);
  });

  it("rejects invalid dates and non-finite time budgets", () => {
    for (const dailyHours of [NaN, Infinity, 0, -2, 9]) expect(() => generatePlan({ ...base, lengthDays: 7, dailyHours, weakSubjectIds: [] })).toThrow();
    expect(() => generatePlan({ ...base, startDate: "2026-02-31", lengthDays: 7, dailyHours: 2, weakSubjectIds: [] })).toThrow();
  });
});

describe("scoring and streaks", () => {
  it("scores 7 of 10 as 70%", () => expect(scorePercent(7, 10)).toBe(70));
  it("scores 2 of 3 as 66.67%", () => expect(scorePercent(2, 3)).toBe(66.67));
  it("wrong answers come back the next day; correct ones go 3 then 7 days", () => {
    expect(nextInterval(false, 3, 14)).toBe(1);
    expect(nextInterval(true, 0, 1)).toBe(3);
    expect(nextInterval(true, 1, 3)).toBe(7);
    expect(nextInterval(true, 2, 7)).toBe(14);
  });
  it("counts a streak of consecutive days ending today", () => {
    expect(computeStreak(["2026-11-21", "2026-11-22", "2026-11-23"], "2026-11-23")).toBe(3);
    expect(computeStreak(["2026-11-20", "2026-11-22"], "2026-11-23")).toBe(1);
    expect(computeStreak([], "2026-11-23")).toBe(0);
  });
});
