import { describe, expect, it } from "vitest";
import {
  ALL_STUDY_COURSES,
  STUDY_MANIFEST,
  STUDY_COURSES,
  PUBLIC_HEALTH_COURSE,
} from "@/lib/study-course";
import {
  questProgressSchema,
  EMPTY_QUEST_PROGRESS,
  checkedProgress,
  studyVersionAvailable,
} from "@/lib/quest-progress";
describe("source-led public health chapter", () => {
  it("has source-versioned notes, original fresh questions and option-level explanations", () => {
    const c = PUBLIC_HEALTH_COURSE;
    expect(c.units.filter((unit) => unit.phase === "learn")).toHaveLength(4);
    expect(c.units.filter((unit) => unit.phase === "apply")).toHaveLength(4);
    expect(new Set(c.units.map((unit) => unit.question)).size).toBe(8);
    expect(c.expert_approval_claimed).toBe(false);
    for (const unit of c.units) {
      expect(unit.rationales).toHaveLength(3);
      expect(unit.rationales.every(Boolean)).toBe(true);
      expect(unit.source_ids.every((id) => c.sources.some((source) => source.id === id))).toBe(
        true,
      );
    }
  });
  it("distinguishes an unfinished wrong answer from completed challenges and rejects impossible receipts", () => {
    expect(questProgressSchema.safeParse(EMPTY_QUEST_PROGRESS).success).toBe(true);
    expect(
      questProgressSchema.safeParse({
        ...EMPTY_QUEST_PROGRESS,
        first_choices: [0],
        attempt_counts: [1],
        revision: 1,
      }).success,
    ).toBe(true);
    expect(
      questProgressSchema.safeParse({ ...EMPTY_QUEST_PROGRESS, first_correct: 1 }).success,
    ).toBe(false);
    expect(questProgressSchema.safeParse({ ...EMPTY_QUEST_PROGRESS, next_step: 8 }).success).toBe(
      false,
    );
    expect(
      questProgressSchema.safeParse({
        ...EMPTY_QUEST_PROGRESS,
        first_choices: [0],
        attempt_counts: [],
      }).success,
    ).toBe(false);
  });
});

describe("all-subject study version and delayed checkpoint boundaries", () => {
  it("admits the exact registered version and rejects a stale, missing or substituted server fingerprint", () => {
    const course = STUDY_COURSES.find((course) => course.id === "oms-assessment")!;
    const meta = STUDY_MANIFEST.get(course.id)!;
    const state = { ...EMPTY_QUEST_PROGRESS, content_sha256: meta.content_sha256 };
    expect(checkedProgress(course, state).next_step).toBe(0);
    expect(() => checkedProgress(course, { ...state, content_sha256: "0".repeat(64) })).toThrow(
      /version/,
    );
    expect(() => checkedProgress(course, EMPTY_QUEST_PROGRESS)).toThrow(/version/);
    expect(() => checkedProgress({ ...course, version: 2 }, state)).toThrow(/version/);
    expect(() => checkedProgress(course, { ...state, total_steps: 2 })).toThrow(/version/);
  });
  it("uses a two-question retention boundary instead of the old eight-step constant", () => {
    const recall = ALL_STUDY_COURSES.find((course) => course.kind === "retention")!;
    const meta = STUDY_MANIFEST.get(recall.id)!;
    const complete = {
      ...EMPTY_QUEST_PROGRESS,
      total_steps: 2,
      content_sha256: meta.content_sha256,
      next_step: 2,
      first_correct: 1,
      first_choices: [0, 1],
      attempt_counts: [2, 1],
      revision: 3,
      completed_at: "2026-11-25T09:00:00Z",
      last_result: { step: 1, choice: 1, correct: true },
    };
    expect(checkedProgress(recall, complete).total_steps).toBe(2);
    expect(
      questProgressSchema.safeParse({
        ...complete,
        first_choices: [0, 1, 2],
        attempt_counts: [2, 1, 1],
      }).success,
    ).toBe(false);
    expect(
      questProgressSchema.safeParse({
        ...complete,
        last_result: { step: 2, choice: 1, correct: true },
      }).success,
    ).toBe(false);
  });
  it("treats withdrawn and mismatching public versions as unavailable", () => {
    const course = PUBLIC_HEALTH_COURSE;
    expect(studyVersionAvailable([], course)).toBe(false);
    expect(
      studyVersionAvailable(
        [{ course_id: course.id, content_version: 1, content_sha256: "0".repeat(64) }],
        course,
      ),
    ).toBe(false);
    expect(
      studyVersionAvailable(
        [
          {
            course_id: course.id,
            content_version: 1,
            content_sha256: STUDY_MANIFEST.get(course.id)!.content_sha256,
          },
        ],
        course,
      ),
    ).toBe(true);
  });
});
