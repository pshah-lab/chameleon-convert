import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TextStylePanel from "./TextStylePanel";
import { DEFAULT_SETTINGS, TEXT_STYLE_KEYS } from "../lib/settings.js";

const NOTE = "PDF layout is fixed — these apply to Word and PowerPoint files.";

function setup(props = {}) {
  const onChange = vi.fn();
  const utils = render(<TextStylePanel settings={DEFAULT_SETTINGS} onChange={onChange} {...props} />);
  return { onChange, ...utils };
}

describe("TextStylePanel", () => {
  it("each control calls onChange with its partial", () => {
    const { onChange } = setup();
    fireEvent.change(screen.getByLabelText("Font"), { target: { value: "atkinson" } });
    expect(onChange).toHaveBeenLastCalledWith({ fontFamily: "atkinson" });
    fireEvent.change(screen.getByLabelText("Size"), { target: { value: "20" } });
    expect(onChange).toHaveBeenLastCalledWith({ fontSize: 20 });
    fireEvent.change(screen.getByLabelText("Line height"), { target: { value: "1.8" } });
    expect(onChange).toHaveBeenLastCalledWith({ lineHeight: 1.8 });
    fireEvent.change(screen.getByLabelText("Paragraph spacing"), { target: { value: "1.5" } });
    expect(onChange).toHaveBeenLastCalledWith({ paragraphSpacing: 1.5 });
    fireEvent.change(screen.getByLabelText("Text width"), { target: { value: "60" } });
    expect(onChange).toHaveBeenLastCalledWith({ textWidth: 60 });
  });

  it("Full width checkbox sets textWidth full and unchecking restores 72", () => {
    const { onChange, rerender } = setup();
    fireEvent.click(screen.getByLabelText("Full width"));
    expect(onChange).toHaveBeenLastCalledWith({ textWidth: "full" });
    rerender(<TextStylePanel settings={{ ...DEFAULT_SETTINGS, textWidth: "full" }} onChange={onChange} />);
    expect(screen.getByLabelText("Full width")).toBeChecked();
    fireEvent.click(screen.getByLabelText("Full width"));
    expect(onChange).toHaveBeenLastCalledWith({ textWidth: 72 });
  });

  it("Reset text style restores the five defaults", () => {
    const { onChange } = setup({ settings: { ...DEFAULT_SETTINGS, fontSize: 22, textWidth: "full" } });
    fireEvent.click(screen.getByRole("button", { name: "Reset text style" }));
    const expected = Object.fromEntries(TEXT_STYLE_KEYS.map((k) => [k, DEFAULT_SETTINGS[k]]));
    expect(onChange).toHaveBeenCalledWith(expected);
  });

  it("isPdf disables the layout controls, shows the note, and keeps Size enabled", () => {
    setup({ isPdf: true });
    for (const name of ["Font", "Line height", "Paragraph spacing", "Text width", "Full width"]) {
      const el = screen.getByLabelText(name);
      expect(el).toBeDisabled();
      const note = document.getElementById(el.getAttribute("aria-describedby"));
      expect(note).toHaveTextContent(NOTE);
    }
    expect(screen.getByText(NOTE)).toBeInTheDocument();
    expect(screen.getByLabelText("Size")).toBeEnabled();
  });

  it("does not show the note or disable controls when not PDF", () => {
    setup();
    expect(screen.queryByText(NOTE)).toBeNull();
    expect(screen.getByLabelText("Font")).toBeEnabled();
  });

  it("values are preserved (not reset) when isPdf toggles", () => {
    const settings = { ...DEFAULT_SETTINGS, lineHeight: 2, fontFamily: "system-serif" };
    const onChange = vi.fn();
    const { rerender } = render(<TextStylePanel settings={settings} onChange={onChange} isPdf />);
    rerender(<TextStylePanel settings={settings} onChange={onChange} isPdf={false} />);
    expect(screen.getByLabelText("Line height")).toHaveValue("2");
    expect(screen.getByLabelText("Font")).toHaveValue("system-serif");
    expect(onChange).not.toHaveBeenCalled();
  });
});
