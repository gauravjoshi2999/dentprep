import { describe, expect, it } from "vitest";
import { latestUniqueAnswers, topicPracticeEvidence } from "@/lib/practice-evidence";
const answer = (id: string, correct: boolean, at = "2026-11-23T10:00:00Z") => ({
  question_id: id,
  is_correct: correct,
  answered_at: at,
});
const questions = Array.from({ length: 10 }, (_, i) => ({
  id: `q${i}`,
  subject_id: i < 5 ? "s1" : "s2",
  topic: i < 5 ? "Prevention" : "Communication",
}));
describe("transparent topic practice evidence", () => {
  it("does not manufacture readiness or percentages from an empty or small sample", () => {
    expect(topicPracticeEvidence([], questions).topics).toEqual([]);
    const result = topicPracticeEvidence([answer("q0", true)], questions).topics[0];
    expect(result).toMatchObject({
      uniqueQuestions: 1,
      correct: 1,
      observedPercent: null,
      suggestRevision: false,
    });
  });
  it("counts fifty retakes of one question as one question, even when the history is unordered", () => {
    const rows = Array.from({ length: 50 }, (_, i) =>
      answer("q0", i !== 49, `2026-11-23T10:00:${String(i).padStart(2, "0")}Z`),
    );
    const before = JSON.stringify(rows);
    const topic = topicPracticeEvidence([...rows].reverse(), questions).topics[0];
    expect(topic).toMatchObject({
      uniqueQuestions: 1,
      correct: 0,
      observedPercent: null,
      suggestRevision: false,
    });
    expect(JSON.stringify(rows)).toBe(before);
  });
  it("uses the latest outcome and preserves the historical source rows", () => {
    const old = answer("q0", false, "2026-11-01T10:00:00Z"),
      current = answer("q0", true);
    expect(latestUniqueAnswers([current, old])).toEqual([current]);
    expect(old.is_correct).toBe(false);
  });
  it("flags a five-item 40 percent topic ahead of stronger observed practice, without a mastery label", () => {
    const rows = questions.map((q, i) => answer(q.id, i < 2 || i >= 5));
    const topics = topicPracticeEvidence(rows, questions).topics;
    expect(topics[0]).toMatchObject({
      subjectId: "s1",
      uniqueQuestions: 5,
      correct: 2,
      observedPercent: 40,
      suggestRevision: true,
    });
    expect(topics[1]).toMatchObject({
      subjectId: "s2",
      uniqueQuestions: 5,
      observedPercent: 100,
      suggestRevision: false,
    });
  });
  it("excludes withdrawn/unavailable metadata rather than counting it as current topic evidence", () => {
    const result = topicPracticeEvidence(
      [answer("withdrawn", false), answer("q0", true)],
      questions,
    );
    expect(result.excludedQuestions).toBe(1);
    expect(result.topics).toHaveLength(1);
    expect(result.topics[0]?.uniqueQuestions).toBe(1);
  });
  it("does not merge identically named topics from different subjects", () => {
    const result = topicPracticeEvidence(
      [answer("q0", true), answer("q5", false)],
      questions.map((q) => ({ ...q, topic: "Shared topic" })),
    );
    expect(result.topics).toHaveLength(2);
  });
  it("discloses the 70 percent boundary as a heuristic, not a validated pass mark", () => {
    const pool = questions.map((q) => ({ ...q, subject_id: "s", topic: "Shared topic" }));
    expect(
      topicPracticeEvidence(
        pool.map((q, i) => answer(q.id, i < 7)),
        pool,
      ).topics[0],
    ).toMatchObject({ observedPercent: 70, suggestRevision: false });
    expect(
      topicPracticeEvidence(
        pool.map((q, i) => answer(q.id, i < 6)),
        pool,
      ).topics[0],
    ).toMatchObject({ observedPercent: 60, suggestRevision: true });
  });
  it("ignores invalid timestamps and resolves conflicting simultaneous outcomes conservatively", () => {
    expect(latestUniqueAnswers([answer("q0", true, "invalid")])).toEqual([]);
    expect(latestUniqueAnswers([answer("q0", false), answer("q0", true)])[0]?.is_correct).toBe(
      false,
    );
  });
  it("never calls missing topic tags a measured weak concept", () => {
    const pool = questions.map((q) => ({ ...q, subject_id: "s", topic: "  " }));
    const result = topicPracticeEvidence(
      pool.map((q) => answer(q.id, false)),
      pool,
    ).topics[0];
    expect(result).toMatchObject({
      topicKnown: false,
      uniqueQuestions: 10,
      observedPercent: null,
      suggestRevision: false,
    });
  });
});
