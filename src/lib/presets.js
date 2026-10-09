import { TEXT_STYLE_KEYS, normalizeSettings } from "./settings";

const STORAGE_KEY = "chameleon-convert-presets";
export const MAX_CUSTOM_PRESETS = 20;

const PRESET_KEYS = [...TEXT_STYLE_KEYS, "mode", "backgroundColor", "textColor", "contrast"];

let counter = 0;

// Normalize per field, but keep only the keys the preset actually contains,
// so applying a partial preset never resets fields it does not define.
function normalizePresetSettings(settings) {
  const source = settings && typeof settings === "object" ? settings : {};
  const normalized = normalizeSettings(source);
  const out = {};
  for (const key of PRESET_KEYS) {
    if (Object.prototype.hasOwnProperty.call(source, key)) out[key] = normalized[key];
  }
  return out;
}

export const BUILT_IN_PRESETS = [
  {
    id: "builtin-night-reading",
    name: "Night reading",
    builtIn: true,
    settings: normalizePresetSettings({
      fontFamily: "system-serif",
      fontSize: 18,
      lineHeight: 1.8,
      paragraphSpacing: 1.2,
      textWidth: 68,
      textColor: "#e8dcc8",
      backgroundColor: "#14110d",
      mode: "smart",
    }),
  },
  {
    id: "builtin-large-print",
    name: "Large print",
    builtIn: true,
    settings: normalizePresetSettings({
      fontFamily: "system-sans",
      fontSize: 22,
      lineHeight: 1.9,
      paragraphSpacing: 1.4,
      textWidth: 55,
    }),
  },
  {
    id: "builtin-dyslexia-friendly",
    name: "Dyslexia-friendly",
    builtIn: true,
    settings: normalizePresetSettings({
      fontFamily: "atkinson",
      fontSize: 19,
      lineHeight: 1.9,
      paragraphSpacing: 1.5,
      textWidth: 60,
    }),
  },
];

function readCustom() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p) => p && typeof p === "object" && typeof p.id === "string" && typeof p.name === "string")
      .map((p) => ({ id: p.id, name: p.name, settings: normalizePresetSettings(p.settings) }));
  } catch {
    return [];
  }
}

function writeCustom(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

function uniqueName(name, list, ignoreId) {
  const taken = new Set(list.filter((p) => p.id !== ignoreId).map((p) => p.name));
  if (!taken.has(name)) return name;
  let n = 2;
  while (taken.has(`${name} (${n})`)) n += 1;
  return `${name} (${n})`;
}

export function getCustomPresets() {
  return readCustom();
}

export function listPresets() {
  return [...BUILT_IN_PRESETS, ...readCustom()];
}

export function saveCustomPreset(name, settings) {
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (!trimmed) return { ok: false, reason: "empty-name" };
  const list = readCustom();
  if (list.length >= MAX_CUSTOM_PRESETS) return { ok: false, reason: "limit" };
  counter += 1;
  const preset = {
    id: `custom-${Date.now()}-${counter}`,
    name: uniqueName(trimmed, list),
    settings: normalizePresetSettings(settings),
  };
  if (!writeCustom([...list, preset])) return { ok: false, reason: "storage" };
  return { ok: true, preset };
}

export function renameCustomPreset(id, name) {
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (!trimmed) return { ok: false, reason: "empty-name" };
  const list = readCustom();
  const target = list.find((p) => p.id === id);
  if (!target) return { ok: false, reason: "not-found" };
  const next = list.map((p) => (p.id === id ? { ...p, name: uniqueName(trimmed, list, id) } : p));
  if (!writeCustom(next)) return { ok: false, reason: "storage" };
  return { ok: true };
}

export function deleteCustomPreset(id) {
  const list = readCustom();
  if (!list.some((p) => p.id === id)) return { ok: false, reason: "not-found" };
  if (!writeCustom(list.filter((p) => p.id !== id))) return { ok: false, reason: "storage" };
  return { ok: true };
}

export function applyPreset(preset, current) {
  const own = normalizePresetSettings(preset && preset.settings);
  return normalizeSettings({ ...normalizeSettings(current), ...own });
}
