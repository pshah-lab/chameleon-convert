import { describe, it, expect } from "vitest";
import { FONT_FAMILY_IDS } from "./settings.js";
import { FONT_OPTIONS, getFontStack } from "./fonts.js";

describe("fonts", () => {
  it("FONT_OPTIONS ids match FONT_FAMILY_IDS exactly", () => {
    expect(FONT_OPTIONS.map((o) => o.id)).toEqual(FONT_FAMILY_IDS);
  });
  it("getFontStack('atkinson') starts with Atkinson Hyperlegible", () => {
    expect(getFontStack("atkinson").startsWith("Atkinson Hyperlegible")).toBe(true);
  });
  it("getFontStack of unknown id equals the system-sans stack", () => {
    expect(getFontStack("nope")).toBe(getFontStack("system-sans"));
    expect(getFontStack("nope")).toBe('system-ui, -apple-system, "Segoe UI", Roboto, sans-serif');
  });
  it("every stack ends with a generic family", () => {
    for (const o of FONT_OPTIONS) expect(o.stack).toMatch(/(sans-serif|serif|monospace)$/);
  });
});
