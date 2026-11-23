import { addDays } from "./dates";

export type PlanLength = 7 | 15 | 30;
export type PlanGoal = "interview" | "recruitment_test" | "clinical" | "english";
export type TaskType = "lesson" | "practice" | "revision" | "interview" | "case" | "test";

export type PlannerSubject = {
  id: string;
  name: string;
  lessons: { id: string; title: string; est_minutes: number }[];
};

export type PlannerInput = {
  lengthDays: PlanLength;
  startDate: string; // YYYY-MM-DD
  dailyHours: number;
  goals: PlanGoal[];
  subjects: PlannerSubject[]; // in syllabus order
  weakSubjectIds: string[];
  completedLessonIds: string[];
  revisionDueCount: number;
};

export type PlannedTask = {
  day_index: number;
  task_date: string;
  task_type: TaskType;
  subject_id: string | null;
  lesson_id: string | null;
  title: string;
  minutes: number;
};

/** Days after first study when a lesson is revised (spaced repetition). */
export const REVISION_OFFSETS = [1, 3, 7, 14] as const;

/**
 * Builds a day-by-day plan:
 * - Weak subjects' unfinished lessons come first, interleaved with other subjects.
 * - Each studied lesson is revised 1, 3, 7 and 14 days later (if inside the plan).
 * - Practice follows each day's lesson; interview/case slots rotate; a mock test every 7th day.
 * - Daily minutes never exceed the candidate's available time (min 30 minutes).
 */
export function generatePlan(input: PlannerInput): PlannedTask[] {
  const budget = Math.max(30, Math.round(input.dailyHours * 60));
  const completed = new Set(input.completedLessonIds);
  const weak = new Set(input.weakSubjectIds);

  const queueFor = (subjects: PlannerSubject[]) =>
    subjects.map((s) => s.lessons.filter((l) => !completed.has(l.id)).map((l) => ({ ...l, subject: s })));
  const interleave = <T,>(lists: T[][]): T[] => {
    const out: T[] = [];
    const max = Math.max(0, ...lists.map((l) => l.length));
    for (let i = 0; i < max; i++) for (const l of lists) if (l[i]) out.push(l[i] as T);
    return out;
  };
  const weakQueue = interleave(queueFor(input.subjects.filter((s) => weak.has(s.id))));
  const otherQueue = interleave(queueFor(input.subjects.filter((s) => !weak.has(s.id))));
  const lessonQueue = [...weakQueue, ...otherQueue];

  const tasks: PlannedTask[] = [];
  const studiedOn: { day: number; lesson: (typeof lessonQueue)[number] }[] = [];
  const wantsInterview = input.goals.includes("interview") || input.goals.includes("english");
  const wantsClinical = input.goals.includes("clinical");

  for (let day = 0; day < input.lengthDays; day++) {
    const date = addDays(input.startDate, day);
    let left = budget;
    const push = (t: Omit<PlannedTask, "day_index" | "task_date">) => {
      if (t.minutes > left) return false;
      tasks.push({ ...t, day_index: day, task_date: date });
      left -= t.minutes;
      return true;
    };

    const isTestDay = (day + 1) % 7 === 0;
    if (isTestDay) {
      push({ task_type: "test", subject_id: null, lesson_id: null, title: "Timed mixed mock test (30 questions)", minutes: Math.min(45, left) });
    }

    // Spaced revision of earlier lessons
    for (const s of studiedOn) {
      const offset = day - s.day;
      if ((REVISION_OFFSETS as readonly number[]).includes(offset)) {
        push({ task_type: "revision", subject_id: s.lesson.subject.id, lesson_id: s.lesson.id, title: `Revise: ${s.lesson.title}`, minutes: 15 });
      }
    }

    // Wrong-answer revision on day 1 when items are due
    if (day === 0 && input.revisionDueCount > 0) {
      push({ task_type: "revision", subject_id: null, lesson_id: null, title: `Revise ${input.revisionDueCount} due question${input.revisionDueCount === 1 ? "" : "s"}`, minutes: 15 });
    }

    // New lessons: as many as fit (at most 2 per day), each followed by subject practice
    let newLessons = 0;
    while (newLessons < 2 && lessonQueue.length > 0) {
      const next = lessonQueue[0];
      if (!next) break;
      const lessonMinutes = Math.max(20, next.est_minutes + 10);
      if (lessonMinutes + 15 > left) break;
      lessonQueue.shift();
      push({ task_type: "lesson", subject_id: next.subject.id, lesson_id: next.id, title: `Study: ${next.title}`, minutes: lessonMinutes });
      push({ task_type: "practice", subject_id: next.subject.id, lesson_id: null, title: `Practice: ${next.subject.name} (10 questions)`, minutes: 15 });
      studiedOn.push({ day, lesson: next });
      newLessons += 1;
    }

    // Rotating skill slot
    if (wantsInterview && day % 2 === 1) {
      push({ task_type: "interview", subject_id: null, lesson_id: null, title: "AI interview practice (15 min)", minutes: 15 });
    } else if (wantsClinical || day % 3 === 2) {
      push({ task_type: "case", subject_id: null, lesson_id: null, title: "Work through one clinical decision case", minutes: 15 });
    }

    // If nothing new remains, fill with mixed practice
    if (lessonQueue.length === 0 && newLessons === 0 && !isTestDay) {
      push({ task_type: "practice", subject_id: null, lesson_id: null, title: "Mixed practice (15 questions)", minutes: 20 });
    }
  }
  return tasks;
}