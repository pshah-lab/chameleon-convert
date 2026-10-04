const STORAGE_KEY = "chameleon-convert-settings";

export const DEFAULT_SETTINGS = {
  mode: "smart",
  backgroundColor: "#0f1115",
  textColor: "#e8eaed",
  fontSize: 17,
  contrast: 105,
};

const VALID_MODES = new Set(["smart", "invert", "sepia", "original"]);
const COLOR_RE = /^#[0-9a-f]{6}$/i;

function normalizeColor(value, fallback) {
  return typeof value === "string" && COLOR_RE.test(value) ? value : fallback;
}

function clampNumber(value, min, max, fallback) {
  const number = typeof value === "number" ? value : Number.NaN;
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

export function normalizeSettings(settings = {}) {
  const source = settings && typeof settings === "object" ? settings : {};
  return {
    mode: VALID_MODES.has(source.mode) ? source.mode : DEFAULT_SETTINGS.mode,
    backgroundColor: normalizeColor(source.backgroundColor, DEFAULT_SETTINGS.backgroundColor),
    textColor: normalizeColor(source.textColor, DEFAULT_SETTINGS.textColor),
    fontSize: clampNumber(source.fontSize, 14, 24, DEFAULT_SETTINGS.fontSize),
    contrast: clampNumber(source.contrast, 80, 135, DEFAULT_SETTINGS.contrast),
  };
}

export function getSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function setSettings(partial) {
  try {
    const merged = normalizeSettings({ ...getSettings(), ...partial });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // Storage unavailable or full: settings simply won't persist.
  }
}
