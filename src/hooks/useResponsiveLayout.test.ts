import { classifyLayout } from "./useResponsiveLayout";

describe("classifyLayout", () => {
  it("classifies a typical phone in portrait and landscape", () => {
    expect(classifyLayout(390, 844)).toBe("phone-portrait");
    expect(classifyLayout(844, 390)).toBe("phone-landscape");
  });

  it("classifies a typical tablet in portrait and landscape", () => {
    expect(classifyLayout(834, 1194)).toBe("tablet-portrait");
    expect(classifyLayout(1194, 834)).toBe("tablet-landscape");
  });

  it("uses the shortest dimension against the tablet breakpoint, regardless of orientation", () => {
    // A very tall/narrow window shouldn't be classified as a tablet just because one side is large.
    expect(classifyLayout(400, 2000)).toBe("phone-portrait");
  });

  it("treats an exact square at the breakpoint as tablet, portrait by tie-break", () => {
    expect(classifyLayout(600, 600)).toBe("tablet-portrait");
  });
});
