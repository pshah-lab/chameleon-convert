import { describe, it, expect } from "vitest";
import { parsePptxSlideXml, parsePptxPresentation } from "./pptxParser.js";

const slideXmlFixture = `<p:sld><p:cSld><p:spTree><p:sp><p:txBody>
  <a:p><a:r><a:rPr b="1" lang="en-US" dirty="0"/><a:t>Slide Title</a:t></a:r></a:p>
  <a:p><a:r><a:rPr i="1" lang="en-US" dirty="0"/><a:t>A subtitle &amp; more</a:t></a:r></a:p>
</p:txBody></p:sp></p:spTree></p:cSld></p:sld>`;

describe("parsePptxSlideXml", () => {
  it("extracts bold and italic runs per paragraph", () => {
    const blocks = parsePptxSlideXml(slideXmlFixture);
    expect(blocks).toEqual([
      { runs: [{ text: "Slide Title", bold: true, italic: false }] },
      { runs: [{ text: "A subtitle & more", bold: false, italic: true }] },
    ]);
  });

  it("returns an empty array for a slide with no text", () => {
    const blocks = parsePptxSlideXml("<p:sld><p:cSld><p:spTree></p:spTree></p:cSld></p:sld>");
    expect(blocks).toEqual([]);
  });

  it("does not treat a hypothetical <a:tXY> tag as a <a:t> opening tag", () => {
    const xml = `<a:p><a:r><a:tXY/><a:t>Hello</a:t></a:r></a:p>`;
    const blocks = parsePptxSlideXml(xml);
    expect(blocks[0].runs[0].text).toBe("Hello");
  });
});

describe("parsePptxPresentation", () => {
  it("orders slides numerically, not lexicographically", async () => {
    const entryNames = ["ppt/slides/slide10.xml", "ppt/slides/slide2.xml", "ppt/slides/slide1.xml", "ppt/presentation.xml"];
    const fetchEntryText = async (name) => {
      if (name === "ppt/slides/slide1.xml") return `<p:sld><a:p><a:r><a:t>one</a:t></a:r></a:p></p:sld>`;
      if (name === "ppt/slides/slide2.xml") return `<p:sld><a:p><a:r><a:t>two</a:t></a:r></a:p></p:sld>`;
      if (name === "ppt/slides/slide10.xml") return `<p:sld><a:p><a:r><a:t>ten</a:t></a:r></a:p></p:sld>`;
      return null;
    };
    const { slides, truncated } = await parsePptxPresentation(entryNames, fetchEntryText);
    expect(slides.map((slide) => slide.number)).toEqual([1, 2, 10]);
    expect(slides[0].blocks[0].runs[0].text).toBe("one");
    expect(truncated).toBe(false);
  });

  it("returns an empty, non-truncated result when there are no slide entries", async () => {
    const result = await parsePptxPresentation(["ppt/presentation.xml"], async () => null);
    expect(result).toEqual({ slides: [], truncated: false });
  });

  it("caps slide count at 500 and marks it truncated", async () => {
    const entryNames = Array.from({ length: 505 }, (_, i) => `ppt/slides/slide${i + 1}.xml`);
    const fetchEntryText = async () => `<p:sld><a:p><a:r><a:t>x</a:t></a:r></a:p></p:sld>`;
    const { slides, truncated } = await parsePptxPresentation(entryNames, fetchEntryText);
    expect(slides.length).toBe(500);
    expect(truncated).toBe(true);
  });
});
