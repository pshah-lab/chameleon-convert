const STORAGE_KEY = "chameleon-convert-settings";

export const DEFAULT_SETTINGS = {
  mode: "smart",
  backgroundColor: "#0f1115",
  textColor: "#e8eaed",
  fontSize: 17,
  contrast: 105,
};

export function getSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function setSettings(partial) {
  const merged = { ...getSettings(), ...partial };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}
