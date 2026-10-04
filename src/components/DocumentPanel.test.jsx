import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import DocumentPanel from "./DocumentPanel";
import { DEFAULT_SETTINGS } from "../lib/settings.js";

// A docx is a ZIP containing word/document.xml. We build one in-memory
// using CompressionStream so the test doesn't depend on a binary fixture
// file living in the repo.
async function makeDocxFile(documentXml) {
  const files = {
    "word/document.xml": documentXml,
    "[Content_Types].xml": "<Types/>",
  };
  // Minimal uncompressed (stored) ZIP writer, sufficient for this test —
  // not the real writer that ships in sub-project 4.
  const encoder = new TextEncoder();
  const parts = [];
  const centralDirectory = [];
  let offset = 0;

  for (const [name, content] of Object.entries(files)) {
    const nameBytes = encoder.encode(name);
    const contentBytes = encoder.encode(content);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHeader.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0, true);
    view.setUint16(8, 0, true); // stored, no compression
    view.setUint32(14, crc32(contentBytes), true);
    view.setUint32(18, contentBytes.length, true);
    view.setUint32(22, contentBytes.length, true);
    view.setUint16(26, nameBytes.length, true);
    localHeader.set(nameBytes, 30);

    parts.push(localHeader, contentBytes);
    centralDirectory.push({ name: nameBytes, offset, size: contentBytes.length, crc: crc32(contentBytes) });
    offset += localHeader.length + contentBytes.length;
  }

  const centralStart = offset;
  for (const entry of centralDirectory) {
    const header = new Uint8Array(46 + entry.name.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x02014b50, true);
    view.setUint32(16, entry.crc, true);
    view.setUint32(20, entry.size, true);
    view.setUint32(24, entry.size, true);
    view.setUint16(28, entry.name.length, true);
    view.setUint32(42, entry.offset, true);
    header.set(entry.name, 46);
    parts.push(header);
    offset += header.length;
  }

  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(8, centralDirectory.length, true);
  eocdView.setUint16(10, centralDirectory.length, true);
  eocdView.setUint32(12, offset - centralStart, true);
  eocdView.setUint32(16, centralStart, true);
  parts.push(eocd);

  return new File(parts, "sample.docx", {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

function crc32(bytes) {
  let crc = ~0;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ~crc >>> 0;
}

// jsdom's Blob/File lacks arrayBuffer(); shim it with FileReader (test-only).
if (!Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function () {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this);
    });
  };
}

describe("DocumentPanel", () => {
  it("announces loading with role=status and errors with role=alert", async () => {
    const bad = new File(["not a zip"], "bad.docx");
    render(<DocumentPanel kind="docx" file={bad} settings={DEFAULT_SETTINGS} />);
    expect(screen.getByRole("status")).toHaveTextContent(/loading/i);
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't read/i);
  });

  it("renders a heading and paragraph from a docx file", async () => {
    const xml =
      '<w:document xmlns:w="x"><w:body>' +
      '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Hello</w:t></w:r></w:p>' +
      '<w:p><w:r><w:t>World</w:t></w:r></w:p>' +
      "</w:body></w:document>";
    const file = await makeDocxFile(xml);

    render(<DocumentPanel kind="docx" file={file} settings={DEFAULT_SETTINGS} />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Hello" })).toBeInTheDocument();
      expect(screen.getByText("World")).toBeInTheDocument();
    });
  });

  it("drives the panel with CSS variables and data-mode from settings", async () => {
    const xml =
      '<w:document xmlns:w="x"><w:body><w:p><w:r><w:t>Body</w:t></w:r></w:p></w:body></w:document>';
    const file = await makeDocxFile(xml);
    const settings = {
      mode: "sepia",
      backgroundColor: "#112233",
      textColor: "#aabbcc",
      fontSize: 20,
      contrast: 120,
    };
    const { container } = render(<DocumentPanel kind="docx" file={file} settings={settings} />);
    await waitFor(() => expect(screen.getByText("Body")).toBeInTheDocument());
    const panel = container.querySelector(".document-panel");
    expect(panel).toHaveAttribute("data-mode", "sepia");
    expect(panel.style.getPropertyValue("--viewer-bg")).toBe("#112233");
    expect(panel.style.getPropertyValue("--viewer-text")).toBe("#aabbcc");
    expect(panel.style.getPropertyValue("--viewer-font-size")).toBe("20px");
    expect(panel.style.getPropertyValue("--viewer-contrast")).toBe("120%");
  });
});
