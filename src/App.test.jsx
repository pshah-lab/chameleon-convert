import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import App from "./App";

// We can't easily swap BrowserRouter for MemoryRouter without changing
// App itself, so this test just verifies the root route renders without
// throwing when the app mounts at "/".
describe("App", () => {
  it("renders the landing placeholder at the root route", () => {
    window.history.pushState({}, "", "/");
    render(<App />);
    expect(screen.getByText("Landing placeholder")).toBeInTheDocument();
  });
});
