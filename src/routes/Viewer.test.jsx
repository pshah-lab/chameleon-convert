import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Viewer from "./Viewer";

describe("Viewer", () => {
  it("shows the dropzone when no file is loaded", () => {
    render(<Viewer />);
    expect(screen.getByTestId("dropzone")).toBeInTheDocument();
  });

  it("shows the legacy-format rejection message for a .doc file", () => {
    render(<Viewer />);
    const file = new File(["x"], "legacy.doc", { type: "application/msword" });
    fireEvent.change(screen.getByTestId("file-input"), { target: { files: [file] } });
    expect(
      screen.getByText(/convert.*\.docx.*first/i)
    ).toBeInTheDocument();
  });

  it("shows the legacy-format rejection message for a .ppt file", () => {
    render(<Viewer />);
    const file = new File(["x"], "legacy.ppt", { type: "application/vnd.ms-powerpoint" });
    fireEvent.change(screen.getByTestId("file-input"), { target: { files: [file] } });
    expect(
      screen.getByText(/convert.*\.pptx.*first/i)
    ).toBeInTheDocument();
  });

  it("renders the PDF canvas container when a .pdf file is chosen", () => {
    render(<Viewer />);
    const file = new File(["x"], "sample.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByTestId("file-input"), { target: { files: [file] } });
    expect(screen.getByTestId("pdf-pages")).toBeInTheDocument();
  });

  it("lets the user open another file after one is loaded", () => {
    render(<Viewer />);
    const file = new File(["x"], "legacy.doc", { type: "application/msword" });
    fireEvent.change(screen.getByTestId("file-input"), { target: { files: [file] } });
    expect(screen.queryByTestId("dropzone")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /open another file/i }));
    expect(screen.getByTestId("dropzone")).toBeInTheDocument();
    expect(screen.queryByText(/convert.*\.docx.*first/i)).not.toBeInTheDocument();
  });
});
