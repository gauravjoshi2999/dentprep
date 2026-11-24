
import { describe, expect, it } from "vitest";
import { STARTER_UNITS, starterCorrect, starterCatalogErrors } from "./starter-quest";
describe("nonclinical starter catalog", () => {
  it("has four distinct complete source-linked units", () => {
    expect(STARTER_UNITS).toHaveLength(4);
    expect(starterCatalogErrors(STARTER_UNITS)).toEqual([]);
  });
  it("checks exact answer index without accepting missing or out-of-range values", () => {
    for (const unit of STARTER_UNITS) {
      expect(starterCorrect(unit, unit.answer)).toBe(true);
      for (const n of [-1, 0, 1, 2, 3, null, 1.5])
        if (n !== unit.answer) expect(starterCorrect(unit, n)).toBe(false);
    }
  });
  it("rejects duplicate units or invalid evidence", () => {
    const first = STARTER_UNITS[0]!;
    expect(starterCatalogErrors([first, first])).toContain("Duplicate or empty ID");
    expect(starterCatalogErrors([{...STARTER_UNITS[0]!, href:"http://example.test"}])).toContain("Missing evidence");
  });
});
