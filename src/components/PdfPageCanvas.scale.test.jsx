import { render, screen, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const state = { getDocument: 0, destroy: 0, scales: [], renders: 0 };

vi.mock("../lib/pdfjsSetup.js", () => ({
  default: {
    getDocument: () => {
      state.getDocument++;
      return {
        promise: Promise.resolve({
          numPages: 1,
          loadingTask: {
            destroy: () => {
              state.destroy++;
              return Promise.resolve();
            },
          },
          getPage: async () => ({
            getViewport: ({ scale }) => {
              state.scales.push(scale);
              return { width: 100 * scale, height: 150 * scale };
            },
            render: () => {
              state.renders++;
              return { promise: Promise.resolve(), cancel() {} };
            },
          }),
        }),
      };
    },
  },
}));

import PdfPageCanvas from "./PdfPageCanvas";
import { DEFAULT_SETTINGS } from "../lib/settings.js";

function makeFile(name = "a.pdf") {
  return new File(["x"], name, { type: "application/pdf" });
}

describe("PdfPageCanvas scaling and lifecycle", () => {
  beforeEach(() => {
    state.getDocument = 0;
    state.destroy = 0;
    state.scales = [];
    state.renders = 0;
    window.devicePixelRatio = 2;
    // Fake 2D context so pages are actually drawn.
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      getImageData: () => ({ data: new Uint8ClampedArray(0) }),
      putImageData() {},
    }));
  });
  afterEach(() => {
    window.devicePixelRatio = 1;
  });

  it("scales by fontSize/17 and renders at devicePixelRatio with unchanged CSS size", async () => {
    render(<PdfPageCanvas file={makeFile()} settings={{ ...DEFAULT_SETTINGS, fontSize: 17 }} />);
    const canvas = await screen.findByTestId("pdf-page-canvas");
    // CSS size = 100 * 1.2 ; backing = CSS * dpr
    expect(canvas.style.width).toBe("120px");
    expect(canvas.width).toBe(240);
  });

  it("applies the font-size zoom factor to the scale", async () => {
    render(<PdfPageCanvas file={makeFile()} settings={{ ...DEFAULT_SETTINGS, fontSize: 24 }} />);
    const canvas = await screen.findByTestId("pdf-page-canvas");
    expect(parseFloat(canvas.style.width)).toBeCloseTo(100 * 1.2 * (24 / 17), 3);
  });

  it("re-renders on settings change without reloading the PDF, debounced", async () => {
    const file = makeFile();
    const { rerender } = render(<PdfPageCanvas file={file} settings={DEFAULT_SETTINGS} />);
    await screen.findByTestId("pdf-page-canvas");
    expect(state.getDocument).toBe(1);
    const rendersBefore = state.renders;

    vi.useFakeTimers();
    rerender(<PdfPageCanvas file={file} settings={{ ...DEFAULT_SETTINGS, fontSize: 20 }} />);
    rerender(<PdfPageCanvas file={file} settings={{ ...DEFAULT_SETTINGS, fontSize: 21 }} />);
    expect(state.renders).toBe(rendersBefore);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    vi.useRealTimers();
    await waitFor(() => expect(state.renders).toBe(rendersBefore + 1));
    expect(state.getDocument).toBe(1);
    expect(state.destroy).toBe(0);
  });

  it("destroys the pdf on file change and unmount", async () => {
    const { rerender, unmount } = render(
      <PdfPageCanvas file={makeFile("a.pdf")} settings={DEFAULT_SETTINGS} />
    );
    await screen.findByTestId("pdf-page-canvas");
    rerender(<PdfPageCanvas file={makeFile("b.pdf")} settings={DEFAULT_SETTINGS} />);
    await waitFor(() => expect(state.destroy).toBe(1));
    await waitFor(() => expect(state.getDocument).toBe(2));
    unmount();
    expect(state.destroy).toBe(2);
  });
});
