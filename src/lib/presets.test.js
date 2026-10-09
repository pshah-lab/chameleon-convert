import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BUILT_IN_PRESETS,
  MAX_CUSTOM_PRESETS,
  applyPreset,
  deleteCustomPreset,
  getCustomPresets,
  listPresets,
  renameCustomPreset,
  saveCustomPreset,
} from "./presets";
import { DEFAULT_SETTINGS } from "./settings";

const KEY = "chameleon-convert-presets";

describe("presets", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("lists the three built-ins by name", () => {
    expect(listPresets().map((p) => p.name)).toEqual(["Night reading", "Large print", "Dyslexia-friendly"]);
    expect(BUILT_IN_PRESETS.every((p) => p.builtIn === true)).toBe(true);
    const night = BUILT_IN_PRESETS[0].settings;
    expect(night).toMatchObject({ fontFamily: "system-serif", fontSize: 18, lineHeight: 1.8, paragraphSpacing: 1.2, textWidth: 68, textColor: "#e8dcc8", backgroundColor: "#14110d", mode: "smart" });
    expect(BUILT_IN_PRESETS[1].settings).toEqual({ fontFamily: "system-sans", fontSize: 22, lineHeight: 1.9, paragraphSpacing: 1.4, textWidth: 55 });
    expect(BUILT_IN_PRESETS[2].settings).toEqual({ fontFamily: "atkinson", fontSize: 19, lineHeight: 1.9, paragraphSpacing: 1.5, textWidth: 60 });
  });

  it("save -> get round-trips and assigns an id", () => {
    const res = saveCustomPreset("Mine", { ...DEFAULT_SETTINGS, fontSize: 20 });
    expect(res.ok).toBe(true);
    expect(res.preset.id).toMatch(/^custom-\d+-\d+$/);
    const got = getCustomPresets();
    expect(got).toHaveLength(1);
    expect(got[0].name).toBe("Mine");
    expect(got[0].settings.fontSize).toBe(20);
    expect(listPresets()).toHaveLength(4);
  });

  it("trims the name and rejects empty/whitespace", () => {
    expect(saveCustomPreset("  Hi  ", DEFAULT_SETTINGS).preset.name).toBe("Hi");
    expect(saveCustomPreset("   ", DEFAULT_SETTINGS)).toEqual({ ok: false, reason: "empty-name" });
    expect(saveCustomPreset("", DEFAULT_SETTINGS)).toEqual({ ok: false, reason: "empty-name" });
  });

  it('duplicate name gets a " (2)" suffix', () => {
    saveCustomPreset("Mine", DEFAULT_SETTINGS);
    expect(saveCustomPreset("Mine", DEFAULT_SETTINGS).preset.name).toBe("Mine (2)");
    expect(saveCustomPreset("Mine", DEFAULT_SETTINGS).preset.name).toBe("Mine (3)");
  });

  it('rejects the 21st preset with reason "limit"', () => {
    for (let i = 0; i < MAX_CUSTOM_PRESETS; i++) {
      expect(saveCustomPreset(`P${i}`, DEFAULT_SETTINGS).ok).toBe(true);
    }
    expect(saveCustomPreset("extra", DEFAULT_SETTINGS)).toEqual({ ok: false, reason: "limit" });
    expect(getCustomPresets()).toHaveLength(20);
  });

  it("rename and delete custom presets", () => {
    const { preset } = saveCustomPreset("Mine", DEFAULT_SETTINGS);
    expect(renameCustomPreset(preset.id, " New ").ok).toBe(true);
    expect(getCustomPresets()[0].name).toBe("New");
    expect(renameCustomPreset(preset.id, "  ")).toEqual({ ok: false, reason: "empty-name" });
    expect(deleteCustomPreset(preset.id)).toBe(true);
    expect(getCustomPresets()).toEqual([]);
    expect(deleteCustomPreset(preset.id)).toBe(false);
  });

  it("built-in ids cannot be renamed or deleted", () => {
    const id = BUILT_IN_PRESETS[0].id;
    expect(renameCustomPreset(id, "x").ok).toBe(false);
    expect(deleteCustomPreset(id)).toBe(false);
    expect(listPresets()[0].name).toBe("Night reading");
  });

  it("corrupted JSON in storage -> only built-ins, no throw", () => {
    localStorage.setItem(KEY, "{not json");
    expect(listPresets()).toHaveLength(3);
  });

  it("non-array JSON -> only built-ins", () => {
    localStorage.setItem(KEY, JSON.stringify({ a: 1 }));
    expect(listPresets()).toHaveLength(3);
  });

  it("stored preset with out-of-range lineHeight is normalized on read", () => {
    localStorage.setItem(KEY, JSON.stringify([{ id: "custom-1-1", name: "Bad", settings: { lineHeight: 9, fontSize: 18 } }]));
    const [p] = getCustomPresets();
    expect(p.settings.lineHeight).toBe(2.2);
    expect(p.settings.fontSize).toBe(18);
    expect(Object.keys(p.settings).sort()).toEqual(["fontSize", "lineHeight"]);
  });

  it("ignores malformed stored entries", () => {
    localStorage.setItem(KEY, JSON.stringify([null, 3, { id: 1 }, { id: "a", name: "ok", settings: {} }]));
    expect(getCustomPresets().map((p) => p.id)).toEqual(["a"]);
  });

  it('setItem throwing -> saveCustomPreset returns reason "storage"', () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("full");
    });
    expect(saveCustomPreset("Mine", DEFAULT_SETTINGS)).toEqual({ ok: false, reason: "storage" });
  });

  it("applyPreset merges over current and keeps unrelated fields", () => {
    const current = { ...DEFAULT_SETTINGS, mode: "invert", backgroundColor: "#101010", textColor: "#fafafa", contrast: 120 };
    const out = applyPreset(BUILT_IN_PRESETS[1], current);
    expect(out.fontSize).toBe(22);
    expect(out.fontFamily).toBe("system-sans");
    expect(out.mode).toBe("invert");
    expect(out.contrast).toBe(120);
  });

  it("applyPreset with no colour keys leaves current colours untouched", () => {
    const current = { ...DEFAULT_SETTINGS, backgroundColor: "#222222", textColor: "#dddddd", mode: "sepia" };
    const out = applyPreset(BUILT_IN_PRESETS[2], current);
    expect(out.backgroundColor).toBe("#222222");
    expect(out.textColor).toBe("#dddddd");
    expect(out.mode).toBe("sepia");
    expect(out.fontFamily).toBe("atkinson");
  });

  it("saved presets only keep known keys and only those present", () => {
    const { preset } = saveCustomPreset("Mine", { fontSize: 20, bogus: 1 });
    expect(Object.keys(preset.settings)).toEqual(["fontSize"]);
  });
});
