import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const curriculumEntityType = z.enum(["lesson", "question", "case"]);
export type CurriculumEntityType = z.infer<typeof curriculumEntityType>;
const fingerprint = z.string().regex(/^[a-f0-9]{64}$/);
const isoDate = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "Use a valid YYYY-MM-DD date");
const emptyToNull = (value: unknown) => (typeof value === "string" && !value.trim() ? null : value);
function isReferenceLink(value: string) {
  if (!/^https:\/\/[A-Za-z0-9][A-Za-z0-9.-]*(:[0-9]{1,5})?([/?#][^\s]*)?$/.test(value))
    return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}
export const evidenceSourceSchema = z
  .object({
    citation: z.string().trim().min(1, "A source citation is required").max(500),
    edition: z.string().trim().min(1, "Record the edition or source version").max(160),
    section: z.string().trim().min(1, "Record the page or section").max(300),
    url: z.preprocess(
      emptyToNull,
      z
        .string()
        .trim()
        .max(2048)
        .refine(isReferenceLink, "Use an HTTPS reference link without credentials")
        .nullable(),
    ),
    checked_on: z.preprocess(emptyToNull, isoDate.nullable()),
  })
  .strict();
export type EvidenceSource = z.infer<typeof evidenceSourceSchema>;
export const preparationEvidenceSchema = z
  .object({
    unit: z.string().trim().min(1, "A curriculum unit is required").max(160),
    topic: z.string().trim().min(1, "A topic is required").max(160),
    outcomes: z
      .array(z.string().trim().min(1).max(500))
      .min(1, "Record at least one learning outcome")
      .max(20)
      .refine(
        (rows) => new Set(rows.map((s) => s.toLowerCase())).size === rows.length,
        "Use distinct learning outcomes",
      ),
    sources: z.array(evidenceSourceSchema).min(1).max(10),
    note: z.string().trim().max(2000).default(""),
  })
  .strict();
export type PreparationEvidence = z.infer<typeof preparationEvidenceSchema>;
export function parsePreparationInput(value: unknown, serverToday: string) {
  const data = preparationEvidenceSchema.parse(value);
  const today = isoDate.parse(serverToday);
  if (data.sources.some((s) => s.checked_on && s.checked_on > today))
    throw new Error("Source-check dates cannot be in the future");
  return data;
}
const recordSchema = z.object({
  id: z.string().uuid(),
  entity_type: curriculumEntityType,
  entity_id: z.string().uuid(),
  version: z.number().int().positive(),
  content_fingerprint: fingerprint,
  evidence: preparationEvidenceSchema,
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
});
export const contentEvidenceSnapshotSchema = z
  .object({
    entity: z.object({
      id: z.string().uuid(),
      type: curriculumEntityType,
      title: z.string(),
      subject_id: z.string().uuid().nullable(),
      status: z.enum(["draft", "in_review", "published", "archived"]),
    }),
    current_fingerprint: fingerprint,
    current_version: z.number().int().nonnegative(),
    latest: recordSchema.nullable(),
    history: z.array(recordSchema).max(20),
    publication_locked: z.boolean(),
    independent_review: z.literal("not_recorded"),
    server_today: isoDate,
    mapping_state: z.enum(["missing", "matches_draft", "stale"]),
  })
  .superRefine((s, ctx) => {
    const expected = !s.latest
      ? "missing"
      : s.latest.content_fingerprint === s.current_fingerprint
        ? "matches_draft"
        : "stale";
    if (s.mapping_state !== expected || s.current_version !== (s.latest?.version ?? 0))
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Inconsistent curriculum evidence version; reload the record",
      });
    if (s.latest && (s.latest.entity_id !== s.entity.id || s.latest.entity_type !== s.entity.type))
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Curriculum evidence belongs to a different content item",
      });
  });
export type ContentEvidenceSnapshot = z.infer<typeof contentEvidenceSnapshotSchema>;
async function invoke(
  name: "admin_content_evidence" | "admin_save_content_evidence",
  args: Record<string, unknown>,
) {
  // Additive RPC boundary; generated Supabase schema files stay untouched.
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    name: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
  const { data, error } = await rpc(name, args);
  if (error) throw new Error(error.message);
  return data;
}
export async function loadContentEvidence(entityType: CurriculumEntityType, entityId: string) {
  return contentEvidenceSnapshotSchema.parse(
    await invoke("admin_content_evidence", { p_entity_type: entityType, p_entity_id: entityId }),
  );
}
export async function saveContentEvidence(
  id: string,
  snapshot: ContentEvidenceSnapshot,
  evidence: PreparationEvidence,
) {
  return z
    .string()
    .uuid()
    .parse(
      await invoke("admin_save_content_evidence", {
        p_id: id,
        p_entity_type: snapshot.entity.type,
        p_entity_id: snapshot.entity.id,
        p_expected_fingerprint: snapshot.current_fingerprint,
        p_expected_version: snapshot.current_version,
        p_evidence: evidence,
      }),
    );
}
