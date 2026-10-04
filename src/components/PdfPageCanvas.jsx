import { useEffect, useRef, useState } from "react";
import pdfjsLib from "../lib/pdfjsSetup.js";
import { getPdfPageColors, transformPdfCanvas } from "../lib/pdfRender.js";

const RERENDER_DEBOUNCE_MS = 150;

export default function PdfPageCanvas({ file, settings }) {
  const containerRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [error, setError] = useState(null);
  const [renderSettings, setRenderSettings] = useState(settings);

  const { mode, backgroundColor, textColor, fontSize, contrast } = settings;

  // Debounce settings changes (e.g. slider drags) before re-rendering pages.
  useEffect(() => {
    const next = { mode, backgroundColor, textColor, fontSize, contrast };
    const timer = setTimeout(() => setRenderSettings(next), RERENDER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [mode, backgroundColor, textColor, fontSize, contrast]);

  // Load and parse the document once per file.
  useEffect(() => {
    let cancelled = false;
    let loaded = null;
    setPdf(null);
    setError(null);

    (async () => {
      try {
        const buffer = await readFileBuffer(file);
        const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
        loaded = doc;
        if (cancelled) {
          destroyPdf(doc);
          return;
        }
        setPdf(doc);
      } catch {
        if (!cancelled) {
          setError("Couldn't load this PDF — it may be corrupted or password-protected.");
        }
      }
    })();

    return () => {
      cancelled = true;
      if (loaded) destroyPdf(loaded);
    };
  }, [file]);

  // Re-render pages whenever the document or (debounced) settings change.
  useEffect(() => {
    if (!pdf) return undefined;
    let cancelled = false;
    const activeTasks = new Set();

    (async () => {
      try {
        const fragment = document.createDocumentFragment();
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
          if (cancelled) return;
          await renderPage(pdf, pageNumber, fragment, renderSettings, activeTasks, () => cancelled);
        }
        if (cancelled) return;
        containerRef.current?.replaceChildren(fragment);
      } catch {
        if (!cancelled) {
          setError("Couldn't load this PDF — it may be corrupted or password-protected.");
        }
      }
    })();

    return () => {
      cancelled = true;
      for (const task of activeTasks) {
        try {
          task.cancel();
        } catch {
          // already finished
        }
      }
    };
  }, [pdf, renderSettings]);

  if (error) {
    return (
      <p className="pdf-error" role="alert">
        {error}
      </p>
    );
  }

  return (
    <>
      {!pdf && <p role="status">Loading…</p>}
      <div ref={containerRef} data-testid="pdf-pages" />
    </>
  );
}

// pdf.js v6's PDFDocumentProxy has no destroy(); it lives on the loading task.
function destroyPdf(doc) {
  const target = doc.loadingTask ?? doc;
  try {
    target.destroy();
  } catch {
    // already destroyed
  }
}

function getPageScale(settings) {
  return 1.2 * (settings.fontSize / 17);
}

function getPdfOutputScale() {
  return window.devicePixelRatio || 1;
}

async function renderPage(pdf, pageNumber, target, settings, activeTasks, isCancelled) {
  const page = await pdf.getPage(pageNumber);
  if (isCancelled()) return;

  const scale = getPageScale(settings);
  const outputScale = getPdfOutputScale();
  const cssViewport = page.getViewport({ scale });
  const viewport = page.getViewport({ scale: scale * outputScale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  canvas.style.width = `${cssViewport.width}px`;
  canvas.style.height = `${cssViewport.height}px`;
  canvas.setAttribute("data-testid", "pdf-page-canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    // No 2D canvas support (e.g. jsdom): keep the page slot but skip drawing.
    target.appendChild(canvas);
    return;
  }

  const task = page.render({
    canvasContext: context,
    viewport,
    background: "rgb(255, 255, 255)",
    pageColors: getPdfPageColors(settings),
  });
  activeTasks.add(task);
  try {
    await task.promise;
  } finally {
    activeTasks.delete(task);
  }

  if (isCancelled()) return;
  transformPdfCanvas(canvas, settings);
  target.appendChild(canvas);
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
