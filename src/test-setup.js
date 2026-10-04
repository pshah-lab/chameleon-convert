import "@testing-library/jest-dom/vitest";

// pdfjs-dist uses Uint8Array.prototype.toHex, which older Node versions lack.
if (!Uint8Array.prototype.toHex) {
  Uint8Array.prototype.toHex = function toHex() {
    return Array.from(this, (b) => b.toString(16).padStart(2, "0")).join("");
  };
}
