import { describe, it, expect } from "vitest";
import { parseDocxDocument } from "./docxParser.js";

describe("parseDocxDocument", () => {
  it("extracts a heading with its level", () => {
    const xml = `<w:document><w:body>
      <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Chapter One</w:t></w:r></w:p>
    </w:body></w:document>`;
    const { blocks } = parseDocxDocument(xml);
    expect(blocks).toEqual([{ type: "heading", level: 1, text: "Chapter One" }]);
  });

  it("maps the Title style to heading level 1", () => {
    const xml = `<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>Doc Title</w:t></w:r></w:p>`;
    const { blocks } = parseDocxDocument(xml);
    expect(blocks[0].type).toBe("heading");
    expect(blocks[0].level).toBe(1);
  });

  it("extracts bold and italic runs within a paragraph", () => {
    const xml = `<w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Bold text</w:t></w:r>
      <w:r><w:t xml:space="preserve"> and normal text &amp; more</w:t></w:r>
    </w:p>`;
    const { blocks } = parseDocxDocument(xml);
    expect(blocks[0].type).toBe("paragraph");
    expect(blocks[0].runs).toEqual([
      { text: "Bold text", bold: true, italic: false },
      { text: " and normal text & more", bold: false, italic: false },
    ]);
  });

  it("treats a w:val=0 bold flag as not bold", () => {
    const xml = `<w:p><w:r><w:rPr><w:b w:val="0"/></w:rPr><w:t>Explicitly not bold</w:t></w:r></w:p>`;
    const { blocks } = parseDocxDocument(xml);
    expect(blocks[0].runs[0].bold).toBe(false);
  });

  it("detects a list item via numPr", () => {
    const xml = `<w:p>
      <w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>
      <w:r><w:t>First bullet</w:t></w:r>
    </w:p>`;
    const { blocks } = parseDocxDocument(xml);
    expect(blocks[0].type).toBe("listItem");
  });

  it("returns an empty, non-truncated result for XML with no paragraphs", () => {
    const result = parseDocxDocument("<w:document><w:body></w:body></w:document>");
    expect(result).toEqual({ blocks: [], truncated: false });
  });

  it("does not treat <w:tab/> as a <w:t> opening tag", () => {
    const xml = `<w:p><w:r><w:tab/><w:t>Hello</w:t></w:r></w:p>`;
    const { blocks } = parseDocxDocument(xml);
    expect(blocks[0].runs[0].text).toBe("Hello");
  });

  it("caps output at 2000 paragraphs and marks it truncated", () => {
    const paragraph = `<w:p><w:r><w:t>line</w:t></w:r></w:p>`;
    const xml = paragraph.repeat(2005);
    const { blocks, truncated } = parseDocxDocument(xml);
    expect(blocks.length).toBe(2000);
    expect(truncated).toBe(true);
  });
});
