import { describe, it, expect, beforeEach, vi } from "vitest";
import { DEFAULT_SETTINGS, getSettings, setSettings } from "./settings.js";

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
});
