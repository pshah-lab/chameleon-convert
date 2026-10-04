import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Toolbar from "./Toolbar";
import { DEFAULT_SETTINGS } from "../lib/settings.js";

describe("Toolbar", () => {
  it("calls onChange with the new mode when the mode select changes", () => {
    const onChange = vi.fn();
    render(<Toolbar settings={DEFAULT_SETTINGS} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/mode/i), { target: { value: "invert" } });
    expect(onChange).toHaveBeenCalledWith({ mode: "invert" });
  });

  it("calls onChange with the new font size when the slider moves", () => {
    const onChange = vi.fn();
    render(<Toolbar settings={DEFAULT_SETTINGS} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/size/i), { target: { value: "20" } });
    expect(onChange).toHaveBeenCalledWith({ fontSize: 20 });
  });

  it("calls onChange with the new background color", () => {
    const onChange = vi.fn();
    render(<Toolbar settings={DEFAULT_SETTINGS} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/background/i), { target: { value: "#000000" } });
    expect(onChange).toHaveBeenCalledWith({ backgroundColor: "#000000" });
  });
});
