import { describe, expect, it } from "vitest";
import { generatePlan, type PlannerSubject } from "@/lib/planner";
import { computeStreak } from "@/lib/dates";
import { nextInterval, scorePercent } from "@/lib/scoring";

const subjects: PlannerSubject[] = [
  {
    id: "s1",
    name: "Oral Surgery",
    lessons: [
      { id: "l1", title: "Exodontia", est_minutes: 15 },
      { id: "l2", title: "Infections", est_minutes: 15 },
    ],
  },
  {
    id: "s2",
    name: "Periodontics",
    lessons: [
      { id: "l3", title: "Classification", est_minutes: 15 },
      { id: "l4", title: "Therapy", est_minutes: 15 },
    ],
  },
  { id: "s3", name: "Emergencies", lessons: [{ id: "l5", title: "Syncope", est_minutes: 15 }] },
];
const base = {
  startDate: "2026-11-23",
  goals: ["interview" as const],
  subjects,
  completedLessonIds: [],
  revisionDueCount: 0,
  availableQuestionCount: 30,
  availableCaseCount: 1,
};

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
    const plan = generatePlan({
      ...base,
      lengthDays: 7,
      dailyHours: 3,
      weakSubjectIds: [],
      completedLessonIds: ["l1"],
    });
    expect(plan.some((t) => t.lesson_id === "l1" && t.task_type === "lesson")).toBe(false);
  });

  it("revises a lesson 1 and 3 days after it is first studied", () => {
    const plan = generatePlan({ ...base, lengthDays: 7, dailyHours: 3, weakSubjectIds: [] });
    const studied = plan.find((t) => t.task_type === "lesson" && t.lesson_id === "l1");
    const revDays = plan
      .filter((t) => t.task_type === "revision" && t.lesson_id === "l1")
      .map((t) => t.day_index);
    expect(studied?.day_index).toBe(0);
    expect(revDays).toEqual(expect.arrayContaining([1, 3]));
  });

  it("adds a mock test on day 7", () => {
    const plan = generatePlan({ ...base, lengthDays: 7, dailyHours: 2, weakSubjectIds: [] });
    expect(plan.some((t) => t.task_type === "test" && t.day_index === 6)).toBe(true);
  });

  it("does not schedule unavailable clinical content or empty days", () => {
    const plan = generatePlan({
      ...base,
      subjects: [],
      lengthDays: 7,
      dailyHours: 0.5,
      weakSubjectIds: [],
      availableQuestionCount: 0,
      availableCaseCount: 0,
    });
    expect(plan.some((t) => ["lesson", "practice", "test", "case"].includes(t.task_type))).toBe(
      false,
    );
    expect(new Set(plan.map((t) => t.day_index)).size).toBe(7);
    expect(plan.every((t) => t.minutes > 0 && t.minutes <= 30)).toBe(true);
    expect(plan.some((t) => t.title.includes("AI"))).toBe(false);
  });

  it("rejects invalid dates and non-finite time budgets", () => {
    for (const dailyHours of [NaN, Infinity, 0, -2, 9])
      expect(() =>
        generatePlan({ ...base, lengthDays: 7, dailyHours, weakSubjectIds: [] }),
      ).toThrow();
    expect(() =>
      generatePlan({
        ...base,
        startDate: "2026-02-31",
        lengthDays: 7,
        dailyHours: 2,
        weakSubjectIds: [],
      }),
    ).toThrow();
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


describe("source-led Dental Surgeon preparation without clinical publication", () => {
  const subjectGuides: PlannerSubject[] = [
    { id: "s-omr", name: "Oral Medicine & Radiology", slug: "oral-medicine-radiology", lessons: [] },
    { id: "s-oms", name: "Oral & Maxillofacial Surgery", slug: "oral-maxillofacial-surgery", lessons: [] },
    { id: "s-endo", name: "Conservative Dentistry & Endodontics", slug: "conservative-endodontics", lessons: [] },
    { id: "s-perio", name: "Periodontology", slug: "periodontology", lessons: [] },
    { id: "s-prosth", name: "Prosthodontics", slug: "prosthodontics", lessons: [] },
    { id: "s-ortho", name: "Orthodontics", slug: "orthodontics", lessons: [] },
    { id: "s-pedo", name: "Pediatric Dentistry", slug: "pediatric-dentistry", lessons: [] },
    { id: "s-phd", name: "Public Health Dentistry", slug: "public-health-dentistry", lessons: [] },
    { id: "s-path", name: "Oral Pathology", slug: "oral-pathology", lessons: [] },
    { id: "s-general", name: "General Medicine & Surgery", slug: "general-medicine-surgery", lessons: [] },
    { id: "s-pharm", name: "Pharmacology & Dental Materials", slug: "pharmacology-dental-materials", lessons: [] },
    { id: "s-basic", name: "Basic Medical Sciences", slug: "basic-medical-sciences", lessons: [] },
    { id: "s-emergency", name: "Medical Emergencies", slug: "medical-emergencies", lessons: [] },
    { id: "s-ethics", name: "Infection Control & Ethics", slug: "infection-control-ethics", lessons: [] },
    { id: "s-govt", name: "Government Healthcare & Administration", slug: "govt-healthcare-administration", lessons: [] },
  ];
  const input = { ...base, subjects: subjectGuides, lengthDays: 15 as const, dailyHours: 2,
    availableQuestionCount: 0, availableCaseCount: 0, weakSubjectIds: [] };

  it("uses available source guides, rotates all 15 subject categories, never manufactures approved clinical learning", () => {
    const result = generatePlan(input);
    const reading = result.filter(t => t.title.startsWith("Source study:"));
    expect(reading.length).toBeGreaterThanOrEqual(15);
    expect(new Set(reading.map(t => t.subject_id)).size).toBe(15);
    expect(new Set(reading.map(t => t.title)).size).toBe(reading.length);
    expect(result.some(t => ["lesson", "practice", "test", "case"].includes(t.task_type))).toBe(false);
    expect(result.filter(t => t.title.startsWith("Recall source:")).length).toBeGreaterThan(0);
    for (let day = 0; day < input.lengthDays; day++) {
      const daily = result.filter(t => t.day_index === day);
      expect(daily.length).toBeGreaterThan(0);
      expect(daily.reduce((n, task) => n + task.minutes, 0)).toBeLessThanOrEqual(120);
    }
  });
  it("starts from weak subjects and skips completed source-study tasks on renewal", () => {
    const first = generatePlan({ ...input, weakSubjectIds: ["s-oms"] });
    const firstGuide = first.find(t => t.title.startsWith("Source study:"));
    expect(firstGuide?.subject_id).toBe("s-oms");
    const next = generatePlan({ ...input, weakSubjectIds: ["s-oms"], completedGuideTitles: [firstGuide?.title ?? ""] });
    expect(next.some(t => t.title === firstGuide?.title)).toBe(false);
  });
  it("works in 30 minute days and preserves one-day spaced recall without invented MCQ scores", () => {
    const result = generatePlan({ ...input, dailyHours: 0.5, lengthDays: 7 });
    expect(result.some(t => t.day_index === 0 && t.title.startsWith("Source study:"))).toBe(true);
    expect(result.some(t => t.day_index === 1 && t.title.startsWith("Recall source:"))).toBe(true);
    for (let day = 0; day < 7; day++) {
      expect(result.filter(t => t.day_index === day).reduce((n, t) => n + t.minutes, 0)).toBeLessThanOrEqual(30);
    }
    expect(result.some(t => ["lesson", "practice", "test", "case"].includes(t.task_type))).toBe(false);
  });
});