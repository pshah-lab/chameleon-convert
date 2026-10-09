# Font & Text-Style Customization — Design

Sub-project 2 of the Chameleon Convert roadmap
(`2026-09-30-chameleon-convert-roadmap.md`). Date: 2026-10-09.

## Intent

Readers want to control how document text looks, not only its colours:
comfortable reading for long sessions and for accessibility (dyslexia,
low vision). Success: a user opens a Word or PowerPoint file, opens
"Text style", picks a font, spacing and width (or a preset), sees the
change instantly, and finds the same look next visit — with zero
network requests and no data leaving the device.

## Decisions (agreed with the user)

- Controls in scope: font family, font size (already exists), line
  height, paragraph spacing, text width, presets. Out of scope for now:
  letter/word spacing, text alignment.
- Fonts: system stacks plus **one** bundled, self-hosted dyslexia-friendly
  font (Atkinson Hyperlegible, SIL OFL). No external font requests.
- Presets: built-in presets plus user-saved custom presets.
- UI: a collapsible "Text style" panel under the toolbar; the toolbar
  keeps mode, background, text colour and contrast.
- PDFs are rasterized, so family/line-height/spacing/width cannot apply
  to them; those controls are disabled for PDFs with an explanatory note.
  Size, colours, contrast and mode still apply to PDFs.

## 1. Settings and presets

New fields in `src/lib/settings.js` (`DEFAULT_SETTINGS`, validated on read
by `normalizeSettings`; unknown or out-of-range values fall back to the
default):

| Field | Allowed | Default |
|---|---|---|
| `fontFamily` | `system-sans`, `system-serif`, `system-mono`, `atkinson` | `system-sans` |
| `lineHeight` | 1.3–2.2 | 1.6 |
| `paragraphSpacing` | 0.5–2.0 (em) | 1.0 |
| `textWidth` | 45–100 (characters) or `"full"` | 72 |

`fontSize` (14–24) already exists and stays in the same object.

**Presets** (`src/lib/presets.js`): a preset is `{ id, name, settings }`
where `settings` is a partial settings object covering text fields plus
`backgroundColor`, `textColor`, `contrast` and `mode`. Applying a preset
merges its fields into the current settings; the user may tweak
afterwards.

Built-ins (not editable or deletable; "Save as…" creates a custom copy):
- **Night reading** — warm text on dark, serif, relaxed spacing.
- **Large print** — larger size, wide line height, narrow column.
- **Dyslexia-friendly** — Atkinson Hyperlegible, generous spacing,
  narrow column.

Custom presets: stored in `localStorage` key `chameleon-convert-presets`
as an array of `{ id, name, settings }`. Operations: save current look
under a name, rename, delete. Cap 20; saving at the cap shows a message.
Each stored preset is validated on read with `normalizeSettings`;
corrupted storage or malformed entries are ignored (never throws, never
blocks app load). All reads and writes are wrapped in try/catch.

## 2. Text style panel and application

**Panel.** A "Text style" button (`aria-expanded`, `aria-controls`) in
`Toolbar` toggles `src/components/TextStylePanel.jsx` below the toolbar.
Escape closes it. Contents, top to bottom: presets select with "Save
current look…" and (for custom presets) "Rename" / "Delete"; font
family; size; line height; paragraph spacing; text width; "Reset text
style" restoring the defaults of the five text fields. Sliders display
their value. At phone width the panel is a single full-width column.
The existing size slider moves from the toolbar into the panel.

**Applying to Word/PowerPoint.** `DocumentPanel` already sets
`--viewer-bg`, `--viewer-text`, `--viewer-font-size`, `--viewer-contrast`
and `data-mode`. Add `--viewer-font-family`, `--viewer-line-height`,
`--viewer-paragraph-spacing`, `--viewer-text-width`; `DocumentPanel.css`
reads them. No per-element JS and no re-parse on change.

**Fonts.** System choices map to font stacks (e.g. serif:
`ui-serif, Georgia, "Times New Roman", serif`). Atkinson Hyperlegible is
a self-hosted `.woff2` under `src/assets/fonts/` loaded via `@font-face`
with `font-display: swap`; its OFL license text ships alongside. It is
only fetched (from the same origin) when selected.

**PDFs.** `PdfPageCanvas` is unchanged apart from continuing to honour
size/colour/contrast/mode. In the panel, family/line-height/spacing/
width are disabled when the open file is a PDF, with the note "PDF
layout is fixed — these apply to Word and PowerPoint files." Values are
preserved and re-enabled when a non-PDF file is opened.

## 3. Accessibility, errors, privacy

- Every control has a visible label; panel is fully keyboard-operable;
  the disabled state is explained in text, not only greyed.
- If the font file fails to load, text falls back to the system sans
  stack; nothing else breaks.
- No network calls, analytics, or external fonts; all state is in
  `localStorage`. Privacy rule from `CLAUDE.md` is unchanged.

## 4. Testing

Vitest unit tests: `normalizeSettings` for the new fields; preset apply,
save, rename, delete; 20-preset cap; corrupted/malformed storage
recovery; built-ins immutable. Component tests: panel open/close
(button, Escape), controls call `onChange`, PDF-disabled state and note,
preset menu actions. Real-browser check: CSS variables change a Word
sample's rendering live; Atkinson loads from the same origin only (no
third-party requests in the network log); phone-width layout.

## Out of scope

Letter/word spacing, alignment, more than one bundled font, syncing
presets across devices, editing documents (sub-project 4), Excel
(sub-project 3).
