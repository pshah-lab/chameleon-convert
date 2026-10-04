import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import Landing from "./Landing";

describe("Landing", () => {
  it("renders the hero heading", () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: /chameleon convert/i })).toBeInTheDocument();
  });

  it("links the live Dark Document Viewer card to /viewer", () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    const link = screen.getByRole("link", { name: /^open tool: dark document viewer/i });
    expect(link).toHaveAttribute("href", "/viewer");
  });

  it("marks Excel and Edit & Export as Coming Soon, not linked", () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    const comingSoonBadges = screen.getAllByText(/coming soon/i);
    expect(comingSoonBadges).toHaveLength(2);
  });
});
