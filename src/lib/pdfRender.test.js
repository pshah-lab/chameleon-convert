import { describe, it, expect } from "vitest";
import { transformPixel, getPdfPageColors } from "./pdfRender.js";

const palette = {
  background: { r: 15, g: 17, b: 21 },
  text: { r: 232, g: 234, b: 237 },
  contrast: 1.05,
};

describe("transformPixel", () => {
  it("inverts in invert mode", () => {
    const result = transformPixel({ r: 255, g: 255, b: 255 }, "invert", palette);
    // 255 inverted is 0, then contrast is applied around 128 — stays near 0.
    expect(result.r).toBeLessThan(20);
  });

  it("darkens a near-white pixel in smart mode", () => {
    const result = transformPixel({ r: 250, g: 250, b: 250 }, "smart", palette);
    expect(result.r).toBeLessThan(250);
  });

  it("warms toward sepia tones in sepia mode", () => {
    const result = transformPixel({ r: 250, g: 250, b: 250 }, "sepia", palette);
    // Sepia background is warm dark brown (36, 30, 23) — result should
    // trend toward more red than blue.
    expect(result.r).toBeGreaterThanOrEqual(result.b);
  });

  it("preserves saturated colors in smart mode rather than flattening them", () => {
    const saturatedRed = { r: 240, g: 80, b: 80 };
    const result = transformPixel(saturatedRed, "smart", palette);
    // Should still read as reddish, not converted to a flat gray.
    expect(result.r).toBeGreaterThan(result.g);
    expect(result.r).toBeGreaterThan(result.b);
  });
});

describe("getPdfPageColors", () => {
  it("returns null when mode is not smart", () => {
    expect(getPdfPageColors({ mode: "invert", backgroundColor: "#000", textColor: "#fff" })).toBeNull();
  });

  it("returns background/foreground when mode is smart", () => {
    const result = getPdfPageColors({ mode: "smart", backgroundColor: "#0f1115", textColor: "#e8eaed" });
    expect(result).toEqual({ background: "#0f1115", foreground: "#e8eaed" });
  });
});
