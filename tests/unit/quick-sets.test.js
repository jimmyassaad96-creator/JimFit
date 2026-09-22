import { describe, it, expect } from "vitest";
import { parseQuickSets } from "../../src/domain/group3.js";

// Backs the "QUICK ENTRY" box on the workout form: "3x8x60" means three sets
// of eight reps at 60kg.
describe("parseQuickSets", () => {
  it("expands count x reps x weight", () => {
    expect(parseQuickSets("3x8x60")).toEqual([
      { reps: "8", weight: "60", rest: "" },
      { reps: "8", weight: "60", rest: "" },
      { reps: "8", weight: "60", rest: "" },
    ]);
  });

  it("allows the weight to be left off", () => {
    expect(parseQuickSets("2x10")).toEqual([
      { reps: "10", weight: "", rest: "" },
      { reps: "10", weight: "", rest: "" },
    ]);
  });

  it("accepts the multiplication sign as well as x", () => {
    expect(parseQuickSets("2×5")).toHaveLength(2);
  });

  it("caps the expansion at 20 sets", () => {
    expect(parseQuickSets("99x5")).toHaveLength(20);
  });

  it("rejects input that is not count-by-reps", () => {
    for (const bad of ["", "   ", "3", "x8", "0x8", "3xabc"]) {
      expect(parseQuickSets(bad)).toBeNull();
    }
  });

  it("keeps a decimal weight but ignores a non-numeric one", () => {
    expect(parseQuickSets("1x5x62.5")[0].weight).toBe("62.5");
    expect(parseQuickSets("1x5xheavy")[0].weight).toBe("");
  });
});
