import { describe, expect, it } from "vitest";
import { clampListIndex, getNextListIndex } from "../shared/animated-list";

describe("AnimatedList navigation", () => {
  it("returns a safe empty state for an empty list", () => {
    expect(clampListIndex(3, 0)).toBe(-1);
    expect(getNextListIndex(-1, "down", 0)).toBe(-1);
  });

  it("wraps arrow navigation from the first and last items", () => {
    expect(getNextListIndex(0, "up", 4)).toBe(3);
    expect(getNextListIndex(3, "down", 4)).toBe(0);
  });

  it("clamps an out-of-range current index before moving", () => {
    expect(getNextListIndex(99, "up", 3)).toBe(1);
    expect(getNextListIndex(-99, "down", 3)).toBe(1);
  });
});
