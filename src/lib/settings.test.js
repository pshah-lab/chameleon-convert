import { describe, it, expect, beforeEach, vi } from "vitest";
import { DEFAULT_SETTINGS, FONT_FAMILY_IDS, TEXT_STYLE_KEYS, getSettings, setSettings } from "./settings.js";

describe("settings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns defaults when nothing is stored", () => {
    expect(getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("persists a partial update and merges it with defaults", () => {
    setSettings({ mode: "invert" });
    expect(getSettings()).toEqual({ ...DEFAULT_SETTINGS, mode: "invert" });
  });

  it("persists across separate getSettings calls", () => {
    setSettings({ fontSize: 20 });
    setSettings({ backgroundColor: "#000000" });
    expect(getSettings()).toEqual({
      ...DEFAULT_SETTINGS,
      fontSize: 20,
      backgroundColor: "#000000",
    });
  });

  it("ignores corrupted stored JSON and falls back to defaults", () => {
    localStorage.setItem("chameleon-convert-settings", "{not valid json");
    expect(getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("normalizes invalid stored values", () => {
    localStorage.setItem(
      "chameleon-convert-settings",
      JSON.stringify({ mode: "neon", backgroundColor: "red", textColor: "#12345", fontSize: "abc", contrast: null })
    );
    expect(getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("clamps out-of-range numbers and accepts valid colors", () => {
    localStorage.setItem(
      "chameleon-convert-settings",
      JSON.stringify({ mode: "sepia", backgroundColor: "#ABCDEF", fontSize: 99, contrast: 10 })
    );
    expect(getSettings()).toEqual({
      ...DEFAULT_SETTINGS,
      mode: "sepia",
      backgroundColor: "#ABCDEF",
      fontSize: 24,
      contrast: 80,
    });
  });

  it("does not throw when storage writes fail", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => setSettings({ mode: "invert" })).not.toThrow();
    spy.mockRestore();
  });
  describe("text-style fields", () => {
    const KEY = "chameleon-convert-settings";
    const store = (obj) => localStorage.setItem(KEY, JSON.stringify(obj));

    it("defaults include the text-style fields", () => {
      expect(DEFAULT_SETTINGS).toEqual({
        mode: "smart",
        backgroundColor: "#0f1115",
        textColor: "#e8eaed",
        fontSize: 17,
        contrast: 105,
        fontFamily: "system-sans",
        lineHeight: 1.6,
        paragraphSpacing: 1,
        textWidth: 72,
      });
      expect(FONT_FAMILY_IDS).toEqual(["system-sans", "system-serif", "system-mono", "atkinson"]);
      expect(TEXT_STYLE_KEYS).toEqual(["fontFamily", "fontSize", "lineHeight", "paragraphSpacing", "textWidth"]);
    });

    it("normalizes an unknown fontFamily to the default", () => {
      store({ fontFamily: "comic-sans" });
      expect(getSettings().fontFamily).toBe("system-sans");
      store({ fontFamily: "atkinson" });
      expect(getSettings().fontFamily).toBe("atkinson");
    });

    it("clamps lineHeight to 1.3-2.2", () => {
      store({ lineHeight: 0.5 });
      expect(getSettings().lineHeight).toBe(1.3);
      store({ lineHeight: 5 });
      expect(getSettings().lineHeight).toBe(2.2);
    });

    it("clamps paragraphSpacing to 0.5-2", () => {
      store({ paragraphSpacing: 0 });
      expect(getSettings().paragraphSpacing).toBe(0.5);
      store({ paragraphSpacing: 9 });
      expect(getSettings().paragraphSpacing).toBe(2);
    });

    it("clamps textWidth numbers to 45-100", () => {
      store({ textWidth: 10 });
      expect(getSettings().textWidth).toBe(45);
      store({ textWidth: 500 });
      expect(getSettings().textWidth).toBe(100);
    });

    it('accepts textWidth "full" and rejects other strings', () => {
      store({ textWidth: "full" });
      expect(getSettings().textWidth).toBe("full");
      store({ textWidth: "wide" });
      expect(getSettings().textWidth).toBe(72);
    });

    it("non-numeric lineHeight/paragraphSpacing/textWidth fall back to defaults", () => {
      store({ lineHeight: "tall", paragraphSpacing: null, textWidth: {} });
      const s = getSettings();
      expect(s.lineHeight).toBe(1.6);
      expect(s.paragraphSpacing).toBe(1);
      expect(s.textWidth).toBe(72);
    });

    it("setSettings does not throw when localStorage.setItem throws", () => {
      const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("quota");
      });
      expect(() => setSettings({ lineHeight: 2 })).not.toThrow();
      spy.mockRestore();
    });
  });
});
