import { describe, expect, it } from "vitest";
import { communicationFeedback, promptsFor, transcriptSchema } from "@/lib/interview";

describe("independent interview practice", () => {
  it("returns communication guidance without an invented assessment score", () => {
    const result = communicationFeedback("I would give a clear example.");
    expect(result.words).toBe(6);
    expect(result).not.toHaveProperty("score");
    expect(result).not.toHaveProperty("clinical_accuracy");
    expect(promptsFor("full_mock").length).toBe(5);
  });
  it("rejects invalid or oversized saved transcript payloads", () => {
    expect(transcriptSchema.safeParse({ answer: "invalid" }).success).toBe(false);
    expect(transcriptSchema.safeParse([{ prompt: "Prompt", answer: "a".repeat(10001) }]).success).toBe(false);
    expect(transcriptSchema.parse([{ prompt: "Prompt", answer: "Answer" }])[0]?.reflection).toBe("");
  });
});
