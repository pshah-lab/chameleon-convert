import { useEffect, useRef, useState } from "react";
import pdfjsLib from "../lib/pdfjsSetup.js";
import { getPdfPageColors, transformPdfCanvas } from "../lib/pdfRender.js";

export default function PdfPageCanvas({ file, settings }) {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);
  const generationRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const generation = ++generationRef.current;
    setError(null);

    async function renderAllPages() {
      try {
        const buffer = await readFileBuffer(file);
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        if (cancelled || generation !== generationRef.current) return;

        const container = containerRef.current;
        if (container) container.replaceChildren();

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
          if (cancelled || generation !== generationRef.current) return;
          await renderPage(pdf, pageNumber, container, settings, generation, generationRef);
        }
      } catch {
        if (!cancelled && generation === generationRef.current) {
          setError("Couldn't load this PDF — it may be corrupted or password-protected.");
        }
      }
    }

    renderAllPages();

    return () => {
      cancelled = true;
    };
  }, [file, settings]);

  if (error) {
    return <p className="pdf-error">{error}</p>;
  }

  return <div ref={containerRef} data-testid="pdf-pages" />;
}

async function renderPage(pdf, pageNumber, container, settings, generation, generationRef) {
  const page = await pdf.getPage(pageNumber);
  if (generation !== generationRef.current) return;

  const viewport = page.getViewport({ scale: 1.2 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.setAttribute("data-testid", "pdf-page-canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    // No 2D canvas support (e.g. jsdom): keep the page slot but skip drawing.
    if (container) container.appendChild(canvas);
    return;
  }

  await page.render({
    canvasContext: context,
    viewport,
    background: "rgb(255, 255, 255)",
    pageColors: getPdfPageColors(settings),
  }).promise;

  if (generation !== generationRef.current) return;
  transformPdfCanvas(canvas, settings);

  if (container) container.appendChild(canvas);
}

// Blob.prototype.arrayBuffer is missing in some environments (e.g. jsdom).
function readFileBuffer(file) {
  if (typeof file.arrayBuffer === "function") return file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}
