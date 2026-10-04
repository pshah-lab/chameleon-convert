import {
  rgbToHsl,
  getRelativeLuminance,
  mixRgb,
  dimColor,
  applyContrast,
} from "./pixelMath.js";

export function getPdfPageColors(settings) {
  if (settings.mode !== "smart") return null;

  return {
    background: settings.backgroundColor,
    foreground: settings.textColor,
  };
}

export function transformPixel(pixel, mode, palette) {
  if (mode === "invert") {
    return applyContrast(
      { r: 255 - pixel.r, g: 255 - pixel.g, b: 255 - pixel.b },
      palette.contrast
    );
  }

  if (mode === "sepia") {
    return transformSepiaPixel(pixel);
  }

  return transformSmartPixel(pixel, palette);
}

function transformSmartPixel(pixel, { background, text, contrast }) {
  const hsl = rgbToHsl(pixel);
  const luminance = getRelativeLuminance(pixel);

  if (hsl.s > 0.32 && luminance > 0.18 && luminance < 0.88) {
    return applyContrast(dimColor(pixel, 0.82), contrast);
  }

  if (luminance > 0.78) {
    return mixRgb(background, text, (1 - luminance) * 0.16);
  }

  if (luminance < 0.35) {
    return mixRgb(text, background, 0.08 + luminance * 0.28);
  }

  return applyContrast(
    mixRgb(background, text, 1 - Math.min(Math.max(luminance, 0.2), 0.86)),
    contrast
  );
}

function transformSepiaPixel(pixel) {
  const luminance = getRelativeLuminance(pixel);
  const background = { r: 36, g: 30, b: 23 };
  const text = { r: 240, g: 221, b: 193 };
  const preserveColor = rgbToHsl(pixel).s > 0.36 && luminance > 0.18 && luminance < 0.82;

  if (preserveColor) {
    return dimColor(pixel, 0.78);
  }

  return mixRgb(text, background, luminance);
}

export function transformPdfCanvas(canvas, settings) {
  if (settings.mode === "original" || settings.mode === "smart") return;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  const background = hexToRgbLocal(settings.backgroundColor);
  const text = hexToRgbLocal(settings.textColor);
  const contrast = settings.contrast / 100;

  for (let index = 0; index < data.length; index += 4) {
    const pixel = { r: data[index], g: data[index + 1], b: data[index + 2] };
    const transformed = transformPixel(pixel, settings.mode, { background, text, contrast });
    data[index] = transformed.r;
    data[index + 1] = transformed.g;
    data[index + 2] = transformed.b;
  }

  context.putImageData(image, 0, 0);
}

function hexToRgbLocal(hex) {
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}
