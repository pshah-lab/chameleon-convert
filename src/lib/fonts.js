import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";

export const FONT_OPTIONS = [
  { id: "system-sans", label: "Sans-serif", stack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  { id: "system-serif", label: "Serif", stack: 'ui-serif, Georgia, "Times New Roman", serif' },
  { id: "system-mono", label: "Monospace", stack: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace' },
  { id: "atkinson", label: "Atkinson Hyperlegible", stack: 'Atkinson Hyperlegible, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
];

export function getFontStack(id) {
  return (FONT_OPTIONS.find((o) => o.id === id) || FONT_OPTIONS[0]).stack;
}
