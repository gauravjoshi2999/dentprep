import { scorePercent } from "./scoring";

// Product triage heuristics, not validated clinical or examination thresholds.
export const MIN_PRACTICE_SAMPLE = 5;
export const REVISION_FOCUS_PERCENT = 70;
export type RecordedPracticeAnswer = {
  question_id: string;
  is_correct: boolean;
  answered_at: string;
};
type PublishedQuestion = { id: string; subject_id: string; topic: string };
export type TopicPracticeEvidence = {
  subjectId: string;
  topic: string;
  topicKnown: boolean;
  uniqueQuestions: number;
  correct: number;
  observedPercent: number | null;
  suggestRevision: boolean;
};

/** Latest answer per distinct question in the supplied submitted-only report window. */
export function latestUniqueAnswers<T extends RecordedPracticeAnswer>(answers: T[]): T[] {
  const latest = new Map<string, T>();
  for (const answer of answers) {
    const time = Date.parse(answer.answered_at);
    if (!Number.isFinite(time)) continue;
    const old = latest.get(answer.question_id);
    // If timestamps tie with conflicting outcomes, retain the wrong one conservatively.
    if (
      !old ||
      time > Date.parse(old.answered_at) ||
      (time === Date.parse(old.answered_at) && !answer.is_correct)
    )
      latest.set(answer.question_id, answer);
  }
  return [...latest.values()];
}

/** Metadata must come from the current published pool; withdrawn/unknown items are excluded. */
export function topicPracticeEvidence(
  answers: RecordedPracticeAnswer[],
  published: PublishedQuestion[],
) {
  const questions = new Map(published.map((q) => [q.id, q]));
  const groups = new Map<string, TopicPracticeEvidence>();
  let excludedQuestions = 0;
  for (const answer of latestUniqueAnswers(answers)) {
    const q = questions.get(answer.question_id);
    if (!q) {
      excludedQuestions++;
      continue;
    }
    const topic = q.topic.trim() || "Unspecified topic";
    const key = JSON.stringify([q.subject_id, q.topic.trim()]);
    const row = groups.get(key) ?? {
      subjectId: q.subject_id,
      topic,
      topicKnown: !!q.topic.trim(),
      uniqueQuestions: 0,
      correct: 0,
      observedPercent: null,
      suggestRevision: false,
    };
    row.uniqueQuestions++;
    if (answer.is_correct) row.correct++;
    groups.set(key, row);
  }
  for (const row of groups.values()) {
    if (!row.topicKnown || row.uniqueQuestions < MIN_PRACTICE_SAMPLE) continue;
    row.observedPercent = scorePercent(row.correct, row.uniqueQuestions);
    row.suggestRevision = row.observedPercent < REVISION_FOCUS_PERCENT;
  }
  const topics = [...groups.values()].sort(
    (a, b) =>
      Number(b.suggestRevision) - Number(a.suggestRevision) ||
      (a.observedPercent ?? 101) - (b.observedPercent ?? 101) ||
      b.uniqueQuestions - a.uniqueQuestions ||
      a.topic.localeCompare(b.topic) ||
      a.subjectId.localeCompare(b.subjectId),
  );
  return { topics, excludedQuestions };
}
