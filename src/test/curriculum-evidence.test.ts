import { describe, it, expect } from "vitest";
import {
  preparationEvidenceSchema,
  parsePreparationInput,
  contentEvidenceSnapshotSchema,
} from "@/lib/curriculum-evidence";
const entityId = "11111111-1111-4111-8111-111111111111";
const evidence = {
  unit: "Study routines",
  topic: "Learning habits",
  outcomes: ["Describe a repeatable study routine"],
  sources: [
    {
      citation: "QA reference",
      edition: "QA version 1",
      section: "Section A",
      url: null,
      checked_on: null,
    },
  ],
  note: "Nonclinical fixture",
};
const snapshot = {
  entity: { id: entityId, type: "lesson", title: "QA only", subject_id: entityId, status: "draft" },
  current_fingerprint: "a".repeat(64),
  current_version: 0,
  latest: null,
  history: [],
  publication_locked: true,
  independent_review: "not_recorded",
  server_today: "2026-11-24",
  mapping_state: "missing",
};
describe("curriculum preparation contracts", () => {
  it("accepts print citations and unknown check dates without asserting review approval", () => {
    expect(parsePreparationInput(evidence, "2026-11-24").sources[0]).toMatchObject({
      url: null,
      checked_on: null,
    });
    expect(contentEvidenceSnapshotSchema.parse(snapshot).independent_review).toBe("not_recorded");
  });
  it("rejects fabricated approval and reviewer fields instead of storing them as evidence", () => {
    expect(() =>
      preparationEvidenceSchema.parse({ ...evidence, clinical_approved: true }),
    ).toThrow();
    expect(() =>
      preparationEvidenceSchema.parse({
        ...evidence,
        sources: [{ ...evidence.sources[0], verified_reviewer: "QA doctor" }],
      }),
    ).toThrow();
  });
  it("rejects credential-bearing, non-HTTPS and whitespace source links", () => {
    for (const url of [
      "javascript:alert(1)",
      "http://example.test/paper",
      "https://private:secret@example.test/paper",
      "https://example.test/not a paper",
    ])
      expect(() =>
        preparationEvidenceSchema.parse({
          ...evidence,
          sources: [{ ...evidence.sources[0], url }],
        }),
      ).toThrow();
  });
  it("does not let a future or nonexistent source-check date become recorded history", () => {
    expect(() =>
      parsePreparationInput(
        { ...evidence, sources: [{ ...evidence.sources[0], checked_on: "2026-11-25" }] },
        "2026-11-24",
      ),
    ).toThrow(/future/);
    expect(() =>
      parsePreparationInput(
        { ...evidence, sources: [{ ...evidence.sources[0], checked_on: "2026-02-30" }] },
        "2026-11-24",
      ),
    ).toThrow();
  });
  it("rejects empty or duplicated outcomes and references without edition/section", () => {
    expect(() => preparationEvidenceSchema.parse({ ...evidence, outcomes: [] })).toThrow();
    expect(() =>
      preparationEvidenceSchema.parse({
        ...evidence,
        outcomes: [" Explain concepts ", "explain concepts"],
      }),
    ).toThrow();
    expect(() =>
      preparationEvidenceSchema.parse({
        ...evidence,
        sources: [{ ...evidence.sources[0], edition: "" }],
      }),
    ).toThrow();
  });
  it("cannot label an old fingerprint as a current preparation record", () => {
    const latest = {
      id: entityId,
      entity_id: entityId,
      entity_type: "lesson",
      version: 1,
      content_fingerprint: "b".repeat(64),
      evidence,
      created_by: entityId,
      created_at: "2026-11-24T00:00:00Z",
    };
    const old = { ...snapshot, current_version: 1, latest, history: [latest] };
    expect(() =>
      contentEvidenceSnapshotSchema.parse({ ...old, mapping_state: "matches_draft" }),
    ).toThrow(/Inconsistent/);
    expect(
      contentEvidenceSnapshotSchema.parse({ ...old, mapping_state: "stale" }).mapping_state,
    ).toBe("stale");
  });
  it("rejects a response accidentally pairing another item with the current editor", () => {
    const latest = {
      id: entityId,
      entity_id: "22222222-2222-4222-8222-222222222222",
      entity_type: "lesson",
      version: 1,
      content_fingerprint: "a".repeat(64),
      evidence,
      created_by: entityId,
      created_at: "2026-11-24T00:00:00Z",
    };
    expect(() =>
      contentEvidenceSnapshotSchema.parse({
        ...snapshot,
        current_version: 1,
        latest,
        history: [latest],
        mapping_state: "matches_draft",
      }),
    ).toThrow(/different content/);
  });
});
