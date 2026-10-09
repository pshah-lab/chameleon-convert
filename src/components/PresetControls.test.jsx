import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import PresetControls from "./PresetControls";
import { DEFAULT_SETTINGS } from "../lib/settings.js";
import { BUILT_IN_PRESETS, listPresets, saveCustomPreset, applyPreset } from "../lib/presets.js";

function setup() {
  const onChange = vi.fn();
  render(<PresetControls settings={DEFAULT_SETTINGS} onChange={onChange} />);
  return { onChange };
}

const save = (name) => {
  vi.spyOn(window, "prompt").mockReturnValue(name);
  fireEvent.click(screen.getByRole("button", { name: "Save current look…" }));
};

describe("PresetControls", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("selecting a built-in applies it via onChange", () => {
    const { onChange } = setup();
    const preset = BUILT_IN_PRESETS[0];
    fireEvent.change(screen.getByLabelText("Preset"), { target: { value: preset.id } });
    expect(onChange).toHaveBeenCalledWith(applyPreset(preset, DEFAULT_SETTINGS));
  });

  it("groups built-ins and custom presets", () => {
    setup();
    expect(screen.getByRole("group", { name: "Built-in" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Yours" })).toBeNull();
    save("Mine");
    expect(screen.getByRole("group", { name: "Yours" })).toBeInTheDocument();
  });

  it("Save current look stores a custom preset that then appears in the list", () => {
    setup();
    save("My evening look");
    expect(screen.getByRole("option", { name: "My evening look" })).toBeInTheDocument();
    expect(listPresets().some((p) => p.name === "My evening look")).toBe(true);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("empty name shows an alert and stores nothing", () => {
    setup();
    const before = listPresets().length;
    save("   ");
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a name for the preset.");
    expect(listPresets().length).toBe(before);
  });

  it("cancelling the prompt does nothing", () => {
    setup();
    save(null);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(listPresets().length).toBe(BUILT_IN_PRESETS.length);
  });

  it("Rename/Delete hidden for built-ins and work for custom", () => {
    setup();
    expect(screen.queryByRole("button", { name: "Rename" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
    save("First");
    expect(screen.getByLabelText("Preset")).toHaveDisplayValue("First");
    vi.spyOn(window, "prompt").mockReturnValue("Second");
    fireEvent.click(screen.getByRole("button", { name: "Rename" }));
    expect(screen.getByRole("option", { name: "Second" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "First" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.queryByRole("option", { name: "Second" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
  });

  it("limit failure shows the right alert text", () => {
    for (let i = 0; i < 20; i += 1) saveCustomPreset(`P${i}`, DEFAULT_SETTINGS);
    setup();
    save("One too many");
    expect(screen.getByRole("alert")).toHaveTextContent("You can save up to 20 presets.");
  });

  it("storage failure shows the right alert text", () => {
    setup();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    save("Nope");
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn't save — browser storage is unavailable.");
  });
});
