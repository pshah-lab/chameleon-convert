import * as pdfjsLib from "pdfjs-dist";

// Browsers load the bundled worker via a Vite-resolved URL. Without a real
// Worker (e.g. jsdom tests), pdf.js falls back to its in-thread "fake worker"
// and resolves its own worker file, so we must not point it at an http URL.
if (typeof Worker !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
}

export default pdfjsLib;
