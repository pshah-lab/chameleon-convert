import { describe, it, expect } from "vitest";
import {
  hexToRgb,
  rgbToHsl,
  getRelativeLuminance,
  mixRgb,
  dimColor,
  applyContrast,
  clampColorChannel,
  clampNumber,
} from "./pixelMath.js";

describe("hexToRgb", () => {
  it("parses a 6-digit hex color", () => {
    expect(hexToRgb("#0f1115")).toEqual({ r: 15, g: 17, b: 21 });
  });
});

describe("rgbToHsl", () => {
  it("returns zero saturation for a pure gray", () => {
    const { h, s, l } = rgbToHsl({ r: 128, g: 128, b: 128 });
    expect(h).toBe(0);
    expect(s).toBe(0);
    expect(l).toBeCloseTo(0.5, 1);
  });

  it("detects a saturated red", () => {
    const { s } = rgbToHsl({ r: 220, g: 40, b: 40 });
    expect(s).toBeGreaterThan(0.5);
  });
});

describe("getRelativeLuminance", () => {
  it("returns 1 for white", () => {
    expect(getRelativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 2);
  });

  it("returns 0 for black", () => {
    expect(getRelativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
  });
});

describe("mixRgb", () => {
  it("returns colorA at amount 0", () => {
    const a = { r: 10, g: 20, b: 30 };
    const b = { r: 200, g: 200, b: 200 };
    expect(mixRgb(a, b, 0)).toEqual({ r: 10, g: 20, b: 30 });
  });

  it("returns colorB at amount 1", () => {
    const a = { r: 10, g: 20, b: 30 };
    const b = { r: 200, g: 200, b: 200 };
    expect(mixRgb(a, b, 1)).toEqual({ r: 200, g: 200, b: 200 });
  });

  it("clamps amount above 1", () => {
    const a = { r: 0, g: 0, b: 0 };
    const b = { r: 100, g: 100, b: 100 };
    expect(mixRgb(a, b, 5)).toEqual({ r: 100, g: 100, b: 100 });
  });
});

describe("dimColor", () => {
  it("scales each channel by the given amount", () => {
    expect(dimColor({ r: 200, g: 100, b: 50 }, 0.5)).toEqual({ r: 100, g: 50, b: 25 });
  });
});

describe("applyContrast", () => {
  it("returns the color unchanged at amount 1", () => {
    expect(applyContrast({ r: 100, g: 150, b: 200 }, 1)).toEqual({ r: 100, g: 150, b: 200 });
  });
});

describe("clampColorChannel", () => {
  it("clamps below 0 to 0", () => {
    expect(clampColorChannel(-10)).toBe(0);
  });

  it("clamps above 255 to 255", () => {
    expect(clampColorChannel(300)).toBe(255);
  });

  it("rounds fractional values", () => {
    expect(clampColorChannel(127.6)).toBe(128);
  });
});

describe("clampNumber", () => {
  it("returns the fallback for non-finite input", () => {
    expect(clampNumber(NaN, 0, 10, 5)).toBe(5);
  });

  it("clamps within range", () => {
    expect(clampNumber(50, 0, 10, 5)).toBe(10);
  });
});
