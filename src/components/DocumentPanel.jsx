import { useEffect, useState } from "react";
import { listZipEntryNames, readZipEntryText } from "../lib/zipReader.js";
import { parseDocxDocument } from "../lib/docxParser.js";
import { parsePptxPresentation } from "../lib/pptxParser.js";
import "./DocumentPanel.css";

export default function DocumentPanel({ kind, file, settings }) {
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    async function load() {
      try {
        const buffer = new Uint8Array(await file.arrayBuffer());

        if (kind === "docx") {
          const xml = await readZipEntryText(buffer, "word/document.xml");
          if (xml === null) throw new Error("Missing word/document.xml");
          const result = parseDocxDocument(xml);
          if (!cancelled) setState({ status: "ready", kind, result });
          return;
        }

        if (kind === "pptx") {
          const entryNames = await listZipEntryNames(buffer);
          const result = await parsePptxPresentation(entryNames, (name) =>
            readZipEntryText(buffer, name)
          );
          if (!cancelled) setState({ status: "ready", kind, result });
          return;
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error?.code === "ENCRYPTED"
              ? "This file is password-protected and can't be opened."
              : "Couldn't read this file — it may not be a valid document.";
          setState({ status: "error", message });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [kind, file]);

  if (state.status === "loading") return <p>Loading…</p>;
  if (state.status === "error") return <p className="document-error">{state.message}</p>;

  if (state.kind === "docx") return <DocxView result={state.result} settings={settings} />;
  return <PptxView result={state.result} settings={settings} />;
}

function Runs({ runs }) {
  return runs.map((run, index) => {
    let node = run.text;
    if (run.bold) node = <strong key={index}>{node}</strong>;
    if (run.italic) node = <em key={index}>{node}</em>;
    return <span key={index}>{node}</span>;
  });
}

function DocxView({ result, settings }) {
  const elements = [];
  let currentListItems = null;

  result.blocks.forEach((block, index) => {
    if (block.type === "heading") {
      currentListItems = null;
      const Heading = `h${block.level}`;
      elements.push(<Heading key={index}>{block.text}</Heading>);
      return;
    }

    if (block.type === "listItem") {
      if (!currentListItems) {
        currentListItems = [];
        elements.push(<ul key={`list-${index}`}>{currentListItems}</ul>);
      }
      currentListItems.push(
        <li key={index}>
          <Runs runs={block.runs} />
        </li>
      );
      return;
    }

    currentListItems = null;
    elements.push(
      <p key={index}>
        <Runs runs={block.runs} />
      </p>
    );
  });

  return (
    <article className="document-panel" {...panelProps(settings)}>
      {elements}
      {result.truncated && (
        <p className="truncation-notice">
          This document is very long — only the first 2000 paragraphs are shown.
        </p>
      )}
    </article>
  );
}

function PptxView({ result, settings }) {
  return (
    <article className="document-panel" {...panelProps(settings)}>
      {result.slides.map((slide) => (
        <section className="pptx-slide" key={slide.number}>
          <div className="pptx-slide-label">Slide {slide.number}</div>
          {slide.blocks.map((block, index) => (
            <p key={index}>
              <Runs runs={block.runs} />
            </p>
          ))}
        </section>
      ))}
      {result.truncated && (
        <p className="truncation-notice">
          This presentation has a lot of slides — only the first 500 are shown.
        </p>
      )}
    </article>
  );
}

function panelProps(settings) {
  if (!settings) return {};
  return {
    "data-mode": settings.mode,
    style: {
      "--viewer-bg": settings.backgroundColor,
      "--viewer-text": settings.textColor,
      "--viewer-font-size": `${settings.fontSize}px`,
      "--viewer-contrast": `${settings.contrast}%`,
    },
  };
}
