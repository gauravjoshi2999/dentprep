import { describe, expect, it } from "vitest";
import { PUBLIC_HEALTH_COURSE } from "@/lib/study-course";
import { questProgressSchema, EMPTY_QUEST_PROGRESS } from "@/lib/quest-progress";
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
