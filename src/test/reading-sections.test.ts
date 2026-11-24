import { describe, expect, it } from "vitest";
import { READING_SECTIONS } from "@/lib/reading-sections";
import { ALL_DENTAL_READINGS } from "@/lib/primary-reading";
import packet from "../../content/drafts/OMS-001.review.json";

describe("focused primary-source navigation", () => {
  it("links the surgery reading path to exact inspected publishers and section locators", () => {
    for (const [readingId, sections] of Object.entries(READING_SECTIONS)) {
      expect(ALL_DENTAL_READINGS.some((reading) => reading.id === readingId)).toBe(true);
      expect(new Set(sections.map((section) => section.sourceId)).size).toBe(sections.length);
      for (const section of sections) {
        const source = packet.sources.find((source) => source.id === section.sourceId);
        expect(source?.url).toBe(section.url);
        expect(source?.retrieval_status).toBe("full_page_opened");
        expect(source?.clinical_approval).toBeNull();
        expect(section.locator.length).toBeGreaterThan(15);
        expect(new URL(section.url).protocol).toBe("https:");
      }
    }
  });
  it("keeps different medicine-class references separate and preserves source jurisdiction", () => {
    const sections = READING_SECTIONS["sdcep-anticoagulants-2022"] ?? [];
    expect(sections).toHaveLength(6);
    expect(sections.find((section) => section.sourceId === "SDCEP-VKA")?.url).not.toBe(
      sections.find((section) => section.sourceId === "SDCEP-DOAC")?.url,
    );
    expect(sections.filter((section) => section.context.startsWith("UK"))).toHaveLength(5);
    expect(sections.find((section) => section.sourceId === "IDA-ASSESSMENT")?.edition).toContain(
      "year not displayed",
    );
  });
});
