import data from "../../content/study/ph-frequency.v1.json";
import { z } from "zod";

const sourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  author_or_organization: z.string(),
  edition: z.string(),
  year: z.number().int(),
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
  schema_version: z.literal(1),
  id: z.literal("ph-frequency"),
  version: z.literal(1),
  subject_slug: z.literal("public-health-dentistry"),
  subject: z.string(),
  title: z.string(),
  scope: z.literal("nonclinical_exam_foundation"),
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
export const PUBLIC_HEALTH_COURSE = courseSchema.parse(data);
export type StudyCourse = z.infer<typeof courseSchema>;
export type StudyUnit = z.infer<typeof unitSchema>;
export const STUDY_COURSES: readonly StudyCourse[] = [PUBLIC_HEALTH_COURSE];

export function studyIssueUrl(course: StudyCourse, unitId: string) {
  const params = new URLSearchParams({
    title: `Study content: ${course.id} v${course.version} / ${unitId}`,
    body: `Course: ${course.id}\nContent version: ${course.version}\nUnit: ${unitId}\n\nWhat needs correcting?\n\nRelevant source and section:\n\nPlease omit patient or private account details.`,
  });
  return `https://github.com/gauravjoshi2999/dentprep/issues/new?${params.toString()}`;
}
