import { describe, expect, it } from "vitest";
import { studentGreetingName } from "./display-name";

describe("studentGreetingName", () => {
  it("greets the learner as Dr. Garima, not only Garima", () => {
    expect(studentGreetingName("Garima Paliwal")).toBe("Dr. Garima");
  });
  it("does not duplicate the title after a profile name update", () => {
    expect(studentGreetingName("Dr. Garima Paliwal")).toBe("Dr. Garima");
    expect(studentGreetingName("dr garima")).toBe("Dr. Garima");
  });
  it("handles missing or whitespace-only profile names", () => {
    expect(studentGreetingName(null)).toBeNull();
    expect(studentGreetingName("   ")).toBeNull();
  });
});
