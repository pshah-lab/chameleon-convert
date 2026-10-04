import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import PdfPageCanvas from "./PdfPageCanvas";
import { DEFAULT_SETTINGS } from "../lib/settings.js";

// A minimal single-page PDF, same fixture content used in the
// extension's test-fixtures/sample.pdf.
const MINIMAL_PDF_BASE64 =
  "JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgMjAwIDIwMF0+PmVuZG9iagp4cmVmCjAgNAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCnRyYWlsZXI8PC9TaXplIDQvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgoxOTAKJSVFT0Y=";

function base64ToFile(base64, name) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], name, { type: "application/pdf" });
}

describe("PdfPageCanvas", () => {
  it("renders one canvas for a one-page PDF", async () => {
    const file = base64ToFile(MINIMAL_PDF_BASE64, "sample.pdf");
    render(<PdfPageCanvas file={file} settings={DEFAULT_SETTINGS} />);

    await waitFor(() => {
      expect(screen.getAllByTestId("pdf-page-canvas")).toHaveLength(1);
    }, { timeout: 5000 });
  });

  it("shows an error state for a corrupt file instead of a blank screen", async () => {
    const file = new File(["not a real pdf"], "broken.pdf", { type: "application/pdf" });
    render(<PdfPageCanvas file={file} settings={DEFAULT_SETTINGS} />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/couldn't load this pdf/i);
    }, { timeout: 5000 });
  });
});
