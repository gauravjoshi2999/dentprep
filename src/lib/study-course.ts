import manifest from "../../content/study-manifest.json";
import { z } from "zod";

const sourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  author_or_organization: z.string(),
  edition: z.string(),
  year: z.number().int().nullable(),
  section: z.string(),
  url: z.string().url().startsWith("https://"),
  content_version: z.string(),
  checked_on: z.string(),
});
const unitSchema = z.object({
  id: z.string(),
  title: z.string(),
  phase: z.enum(["learn", "apply"]),
  lesson: z.string(),
  question: z.string(),
  choices: z.tuple([z.string(), z.string(), z.string()]),
  answer: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  hint: z.string(),
  explanation: z.string(),
  rationales: z.tuple([z.string(), z.string(), z.string()]),
  source_ids: z.array(z.string()),
  calculation: z.unknown().nullable(),
});
const courseSchema = z.object({
  schema_version: z.number().int().positive(),
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{1,63}$/),
  version: z.number().int().positive(),
  subject_slug: z.string(),
  subject: z.string(),
  title: z.string(),
  scope: z.enum(["nonclinical_exam_foundation", "source_checked_academic_study"]),
  kind: z.enum(["chapter", "retention"]).default("chapter"),
  required_course_id: z.string().optional(),
  delay_hours: z.number().int().min(0).default(0),
  authoring: z.string(),
  expert_approval_claimed: z.literal(false),
  exam_target: z.string(),
  official_questions: z.literal(false),
  complete_subject: z.literal(false),
  estimated_minutes: z.number(),
  checked_on: z.string(),
  summary: z.string(),
  sources: z.array(sourceSchema),
  units: z.array(unitSchema),
});
const packages = import.meta.glob("../../content/{study,recall}/*.json", {
  eager: true,
  import: "default",
});
export const ALL_STUDY_COURSES = Object.values(packages).map((raw) => courseSchema.parse(raw));
export const STUDY_COURSES = ALL_STUDY_COURSES.filter((course) => course.kind === "chapter").sort(
  (a, b) => a.subject.localeCompare(b.subject),
);
export const STUDY_COURSE_BY_ID = new Map(ALL_STUDY_COURSES.map((course) => [course.id, course]));
export const PUBLIC_HEALTH_COURSE = STUDY_COURSE_BY_ID.get("ph-frequency")!;
export const STUDY_MANIFEST = new Map(manifest.map((item) => [item.course_id, item]));
export function chapterForSubject(slug: string) {
  return STUDY_COURSES.find((course) => course.subject_slug === slug);
}
export type StudyCourse = z.infer<typeof courseSchema>;
export type StudyUnit = z.infer<typeof unitSchema>;

export function studyIssueUrl(course: StudyCourse, unitId: string) {
  const params = new URLSearchParams({
    title: `Study content: ${course.id} v${course.version} / ${unitId}`,
    body: `Course: ${course.id}\nContent version: ${course.version}\nUnit: ${unitId}\n\nWhat needs correcting?\n\nRelevant source and section:\n\nPlease omit patient or private account details.`,
  });
  return `https://github.com/gauravjoshi2999/dentprep/issues/new?${params.toString()}`;
}
