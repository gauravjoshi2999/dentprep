import { describe, expect, it } from "vitest";
import { ALL_DENTAL_READINGS } from "@/lib/primary-reading";
import { SUBJECT_STUDY_BRIEFS, STUDY_BRIEF_BY_SLUG } from "@/lib/subject-study-briefs";
import { reviewQuestions } from "@/lib/clinical-review-questions";

describe("all 15 dental subject study paths", () => {
  it("provides exactly one independent nonclinical study plan per existing subject", () => {
    expect(SUBJECT_STUDY_BRIEFS).toHaveLength(15);
    expect(new Set(SUBJECT_STUDY_BRIEFS.map(item => item.slug)).size).toBe(15);
    expect(SUBJECT_STUDY_BRIEFS.every(item =>
      item.chapters.length === 5 &&
      item.recall.length === 3 &&
      item.chapters.every(chapter => chapter.title.length > 2 && chapter.task.length > 20)
    )).toBe(true);
  });

  it("pairs every subject with one publisher reading and 12 or more review questions", () => {
    expect(ALL_DENTAL_READINGS).toHaveLength(15);
    expect(new Set(ALL_DENTAL_READINGS.map(source => source.id)).size).toBe(15);
    expect(new Set(ALL_DENTAL_READINGS.map(source => source.subjectSlug)).size).toBe(15);
    for (const source of ALL_DENTAL_READINGS) {
      const brief = STUDY_BRIEF_BY_SLUG.get(source.subjectSlug);
      expect(brief?.name).toBe(source.subject);
      expect(source.readingSteps).toHaveLength(4);
      expect(source.guideUrl.startsWith("https://")).toBe(true);
      expect(source.publisherUrl.startsWith("https://")).toBe(true);
      const questions = reviewQuestions(source.id);
      expect(questions.length).toBeGreaterThanOrEqual(12);
      expect(new Set(questions.map(question => question.id)).size).toBe(questions.length);
      expect(questions.filter(question => question.section === "Subject-specific check").length).toBeGreaterThanOrEqual(2);
    }
  });
});
