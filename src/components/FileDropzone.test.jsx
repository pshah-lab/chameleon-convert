import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import FileDropzone from "./FileDropzone";

function makeFile(name, type) {
  return new File(["content"], name, { type });
}

describe("FileDropzone", () => {
  it("calls onFile when a file is dropped", () => {
    const onFile = vi.fn();
    render(<FileDropzone onFile={onFile} />);
    const file = makeFile("sample.pdf", "application/pdf");

    fireEvent.drop(screen.getByTestId("dropzone"), {
      dataTransfer: { files: [file] },
    });

    expect(onFile).toHaveBeenCalledWith(file);
  });

  it("calls onFile when a file is chosen via the Browse button", () => {
    const onFile = vi.fn();
    render(<FileDropzone onFile={onFile} />);
    const file = makeFile("sample.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    const input = screen.getByTestId("file-input");

    fireEvent.change(input, { target: { files: [file] } });

    expect(onFile).toHaveBeenCalledWith(file);
  });

  it("does not call onFile when the drop has no files", () => {
    const onFile = vi.fn();
    render(<FileDropzone onFile={onFile} />);

    fireEvent.drop(screen.getByTestId("dropzone"), {
      dataTransfer: { files: [] },
    });

    expect(onFile).not.toHaveBeenCalled();
  });
});
