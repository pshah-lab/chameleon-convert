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

  it("Text style button toggles the panel and aria-expanded", () => {
    render(<Toolbar settings={DEFAULT_SETTINGS} onChange={vi.fn()} />);
    const button = screen.getByRole("button", { name: /text style/i });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveAttribute("aria-controls", "text-style-panel");
    expect(screen.queryByRole("region", { name: "Text style" })).not.toBeInTheDocument();
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("region", { name: "Text style" })).toBeInTheDocument();
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("region", { name: "Text style" })).not.toBeInTheDocument();
  });

  it("Escape closes the panel and refocuses the button", () => {
    render(<Toolbar settings={DEFAULT_SETTINGS} onChange={vi.fn()} />);
    const button = screen.getByRole("button", { name: /text style/i });
    fireEvent.click(button);
    const slider = screen.getByLabelText("Size");
    slider.focus();
    fireEvent.keyDown(slider, { key: "Escape" });
    expect(screen.queryByRole("region", { name: "Text style" })).not.toBeInTheDocument();
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
  });

  it("size slider is reachable inside the panel and calls onChange({fontSize})", () => {
    const onChange = vi.fn();
    render(<Toolbar settings={DEFAULT_SETTINGS} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /text style/i }));
    fireEvent.change(screen.getByLabelText("Size"), { target: { value: "20" } });
    expect(onChange).toHaveBeenCalledWith({ fontSize: 20 });
  });

  it("calls onChange with the new background color", () => {
    const onChange = vi.fn();
    render(<Toolbar settings={DEFAULT_SETTINGS} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/background/i), { target: { value: "#000000" } });
    expect(onChange).toHaveBeenCalledWith({ backgroundColor: "#000000" });
  });
});
