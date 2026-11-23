/** Pure scoring helpers mirrored by the backend submit_attempt function (used for display and tests). */
export type AnswerRow = { question_id: string; is_correct: boolean };

export function scorePercent(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((10000 * correct) / total) / 100;
}

export function breakdownBySubject(
  answers: AnswerRow[],
  questionSubject: Record<string, string>,
): Record<string, { answered: number; correct: number }> {
  const out: Record<string, { answered: number; correct: number }> = {};
  for (const a of answers) {
    const subject = questionSubject[a.question_id];
    if (!subject) continue;
    const row = (out[subject] ??= { answered: 0, correct: 0 });
    row.answered += 1;
    if (a.is_correct) row.correct += 1;
  }
  return out;
}

/** Next spaced-repetition interval in days, matching the backend rule (1 → 3 → 7 → doubling, max 60). */
export function nextInterval(correct: boolean, repetitions: number, intervalDays: number): number {
  if (!correct) return 1;
  if (repetitions === 0) return 3;
  if (repetitions === 1) return 7;
  return Math.min(60, intervalDays * 2);
}