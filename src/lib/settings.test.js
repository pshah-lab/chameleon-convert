import { describe, it, expect, beforeEach } from "vitest";
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
});
