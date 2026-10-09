# Font & Text-Style Customization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add font family, line height, paragraph spacing, text width and presets (built-in + custom) behind a collapsible "Text style" panel, applied live to Word/PowerPoint files.

**Architecture:** Extend the single saved settings object and its validator; apply new values to `DocumentPanel` through CSS variables (no re-parse). A new `TextStylePanel` hosts the controls and a `PresetControls` child; presets live in a separate pure-logic module with its own `localStorage` key. PDFs keep rendering as today and the four layout controls are disabled for them.

**Tech Stack:** React 18, Vite, Vitest + React Testing Library (jsdom), plain CSS, `@fontsource/atkinson-hyperlegible` (OFL, self-bundled by Vite).

**Spec:** `documentation/specs/2026-10-09-font-style-customization-design.md`

## Global Constraints

- Plain JavaScript and plain CSS (no TypeScript, no Tailwind); tokens from `src/styles/tokens.css`.
- Privacy is a hard rule: no network calls from `src`, no analytics, no external fonts/CDNs. The font is bundled and served from the app's own origin.
- Settings object keys and ranges: `fontFamily` ∈ `system-sans|system-serif|system-mono|atkinson` (default `system-sans`); `lineHeight` 1.3–2.2 (default 1.6); `paragraphSpacing` 0.5–2.0 em (default 1.0); `textWidth` 45–100 characters or `"full"` (default 72); existing `fontSize` 14–24 (default 17).
- Presets storage key `chameleon-convert-presets`; custom cap 20; built-ins immutable: "Night reading", "Large print", "Dyslexia-friendly".
- Every `localStorage` read/write is wrapped in try/catch; bad data is ignored, never thrown.
- Never weaken tests or constants to make a test pass; fix the component or the test data and report it.
- Commits end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`; never stage `.superpowers/`.

## Review Focus

- Corrupted or non-array `chameleon-convert-presets` JSON → app loads, presets list is just the built-ins (Task 4).
- A stored preset whose `settings` contain out-of-range or unknown values → normalized, not applied raw (Task 4).
- `localStorage` blocked/full when saving a preset or settings → no throw, UI keeps working (Tasks 1, 4).
- Preset name that is empty/whitespace, or duplicates an existing name → rejected with a message / suffixed, never a silent no-op (Task 4, 6).
- Opening a PDF then a Word file: layout values are preserved, controls re-enable (Task 5).
- `textWidth: "full"` and extreme slider values render without overflow/NaN CSS (Tasks 1, 3).

---

## File Structure

- Modify `src/lib/settings.js` — new defaults, constants, validation.
- Create `src/lib/fonts.js` — font option list and CSS stacks; imports the bundled font CSS.
- Modify `src/components/DocumentPanel.jsx` / `.css` — new CSS variables and rules.
- Create `src/lib/presets.js` — built-ins and custom-preset storage logic (pure, no React).
- Create `src/components/TextStylePanel.jsx` / `.css` — controls panel.
- Create `src/components/PresetControls.jsx` — presets select + save/rename/delete UI.
- Modify `src/components/Toolbar.jsx` / `.css`, `src/routes/Viewer.jsx` — button, wiring, PDF flag.

### Task 1: Extend settings and validation

**Files:**
- Modify: `src/lib/settings.js`
- Test: `src/lib/settings.test.js`

**Interfaces:**
- Produces: `DEFAULT_SETTINGS` gains `fontFamily, lineHeight, paragraphSpacing, textWidth`; exports `FONT_FAMILY_IDS` (array of the four ids), `TEXT_STYLE_KEYS` (`["fontFamily","fontSize","lineHeight","paragraphSpacing","textWidth"]`), `normalizeSettings(settings)` validating all nine fields.

- [ ] **Step 1: Write failing tests** in `settings.test.js` (all use the existing `localStorage.clear()` setup):
  - `defaults include the text-style fields` → `DEFAULT_SETTINGS` equals `fontFamily:"system-sans", lineHeight:1.6, paragraphSpacing:1, textWidth:72` (plus existing keys).
  - `normalizes an unknown fontFamily to the default`.
  - `clamps lineHeight to 1.3–2.2`, `clamps paragraphSpacing to 0.5–2`, `clamps textWidth numbers to 45–100`.
  - `accepts textWidth "full" and rejects other strings` (e.g. `"wide"` → 72).
  - `non-numeric lineHeight/paragraphSpacing/textWidth fall back to defaults`.
  - `setSettings does not throw when localStorage.setItem throws` (spy on `Storage.prototype.setItem`).
- [ ] **Step 2: Run** `npx vitest run src/lib/settings.test.js` — expect FAIL.
- [ ] **Step 3: Implement** the new defaults/constants and extend `normalizeSettings` using the existing `clampNumber`; `textWidth` is `"full"` or `clampNumber(...)`.
- [ ] **Step 4: Run** `npm test` — expect all PASS (existing tests unchanged).
- [ ] **Step 5: Commit** `feat(settings): add font family, line height, spacing and width`.

### Task 2: Font options and bundled Atkinson Hyperlegible

**Files:**
- Create: `src/lib/fonts.js`, `src/lib/fonts.test.js`
- Modify: `package.json` / `package-lock.json` (dependency)

**Interfaces:**
- Consumes: `FONT_FAMILY_IDS` from Task 1.
- Produces: `FONT_OPTIONS` = `[{ id, label, stack }]` for the four ids (labels "Sans-serif", "Serif", "Monospace", "Atkinson Hyperlegible"); `getFontStack(id) → string` (unknown id → the `system-sans` stack).

- [ ] **Step 1: Write failing tests**: `FONT_OPTIONS ids match FONT_FAMILY_IDS exactly`; `getFontStack("atkinson") starts with "Atkinson Hyperlegible"`; `getFontStack("nope") equals the system-sans stack`; `every stack ends with a generic family (sans-serif|serif|monospace)`.
- [ ] **Step 2: Run** `npx vitest run src/lib/fonts.test.js` — FAIL.
- [ ] **Step 3: Run** `npm install @fontsource/atkinson-hyperlegible` (OFL-1.1). In `fonts.js` `import "@fontsource/atkinson-hyperlegible/400.css"` and `.../700.css` and implement the two exports. System stacks: sans `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`; serif `ui-serif, Georgia, "Times New Roman", serif`; mono `ui-monospace, "SF Mono", Menlo, Consolas, monospace`.
- [ ] **Step 4: Run** `npm test` and `npm run build`; confirm `dist/assets` contains `atkinson-hyperlegible` `.woff2` files and `grep -r "fonts.googleapis\|fonts.gstatic" dist` finds nothing.
- [ ] **Step 5: Commit** `feat(fonts): font options with bundled Atkinson Hyperlegible`.

### Task 3: Apply text style in DocumentPanel

**Files:**
- Modify: `src/components/DocumentPanel.jsx` (style object near line 139), `src/components/DocumentPanel.css`
- Test: `src/components/DocumentPanel.test.jsx`

**Interfaces:**
- Consumes: `getFontStack` (Task 2); settings fields (Task 1).
- Produces: container sets `--viewer-font-family`, `--viewer-line-height` (unitless), `--viewer-paragraph-spacing` (`${n}em`), `--viewer-text-width` (`${n}ch` or `none` when `"full"`).

- [ ] **Step 1: Write failing tests** rendering a docx via the existing test helper with custom settings: `sets font-family variable from fontFamily`, `sets line-height and paragraph-spacing variables`, `textWidth 60 yields "60ch" and "full" yields "none"`.
- [ ] **Step 2: Run** `npx vitest run src/components/DocumentPanel.test.jsx` — FAIL.
- [ ] **Step 3: Implement** the four variables in the style object; in the CSS use them: `font-family`, `line-height` on `.document-panel`; `p, li { margin-block: 0 var(--viewer-paragraph-spacing) }`; `max-width: var(--viewer-text-width, 760px)` (replacing the fixed 760px) and keep `margin: 24px auto`; on narrow screens the panel must not overflow (`max-width` is also bounded by the viewport via `box-sizing: border-box; width: 100%`).
- [ ] **Step 4: Run** `npm test` — all PASS.
- [ ] **Step 5: Commit** `feat(viewer): apply font, spacing and width to documents`.

### Task 4: Presets module

**Files:**
- Create: `src/lib/presets.js`, `src/lib/presets.test.js`

**Interfaces:**
- Consumes: `normalizeSettings`, `TEXT_STYLE_KEYS` (Task 1).
- Produces: `BUILT_IN_PRESETS` (array of `{ id, name, builtIn: true, settings }` for the three built-ins); `getCustomPresets() → preset[]`; `listPresets() → [...BUILT_IN_PRESETS, ...custom]`; `saveCustomPreset(name, settings) → { ok: true, preset } | { ok: false, reason: "empty-name"|"limit"|"storage" }`; `renameCustomPreset(id, name) → { ok } | { ok:false, reason }`; `deleteCustomPreset(id) → boolean`; `applyPreset(preset, current) → settings` (normalized merge of the preset's fields over `current`); `MAX_CUSTOM_PRESETS = 20`.
- Preset `settings` captures only `TEXT_STYLE_KEYS` plus `mode, backgroundColor, textColor, contrast`.

- [ ] **Step 1: Write failing tests** (clear `localStorage` in `beforeEach`): `lists the three built-ins by name`; `save → get round-trips and assigns an id`; `trims the name and rejects empty/whitespace with reason "empty-name"`; `duplicate name gets a " (2)" suffix`; `rejects the 21st preset with reason "limit"`; `rename and delete custom presets`; `built-in ids cannot be renamed or deleted`; `corrupted JSON in storage → only built-ins, no throw`; `non-array JSON → only built-ins`; `stored preset with out-of-range lineHeight is normalized on read`; `setItem throwing → saveCustomPreset returns reason "storage"`; `applyPreset merges over current and keeps unrelated fields`.
- [ ] **Step 2: Run** `npx vitest run src/lib/presets.test.js` — FAIL.
- [ ] **Step 3: Implement** per the interfaces. Custom ids are generated as `custom-<timestamp>-<counter>`. Built-in values: Night reading — serif, size 18, lineHeight 1.8, paragraphSpacing 1.2, textWidth 68, textColor `#e8dcc8`, backgroundColor `#14110d`, mode `smart`; Large print — sans, size 22, lineHeight 1.9, paragraphSpacing 1.4, textWidth 55; Dyslexia-friendly — atkinson, size 19, lineHeight 1.9, paragraphSpacing 1.5, textWidth 60.
- [ ] **Step 4: Run** `npm test` — all PASS.
- [ ] **Step 5: Commit** `feat(presets): built-in and custom presets with safe storage`.

### Task 5: TextStylePanel controls

**Files:**
- Create: `src/components/TextStylePanel.jsx`, `TextStylePanel.css`, `TextStylePanel.test.jsx`

**Interfaces:**
- Consumes: `FONT_OPTIONS` (Task 2), `DEFAULT_SETTINGS`/`TEXT_STYLE_KEYS` (Task 1).
- Produces: `<TextStylePanel settings onChange isPdf />` — `onChange(partial)` as in `Toolbar`. Labelled controls: "Font", "Size", "Line height", "Paragraph spacing", "Text width" (range 45–100 plus a "Full width" checkbox); "Reset text style" button calls `onChange` with the defaults of the five `TEXT_STYLE_KEYS`. When `isPdf`, Font/Line height/Paragraph spacing/Text width/Full width are `disabled` and a note reads exactly "PDF layout is fixed — these apply to Word and PowerPoint files." (`id` linked via `aria-describedby`); Size stays enabled.  Task 5 does NOT render presets; Task 6 adds `<PresetControls>` at the top of this panel.

- [ ] **Step 1: Write failing tests**: `each control calls onChange with its partial` (font → `{fontFamily}`, line height → `{lineHeight: number}`, etc.); `Full width checkbox sets textWidth "full" and unchecking restores 72`; `Reset text style restores the five defaults`; `isPdf disables the four layout controls, shows the note, and keeps Size enabled`; `values are preserved (not reset) when isPdf toggles`.
- [ ] **Step 2: Run** `npx vitest run src/components/TextStylePanel.test.jsx` — FAIL.
- [ ] **Step 3: Implement** the component with token-based CSS; slider values shown next to labels; single column below 600px.
- [ ] **Step 4: Run** `npm test` — all PASS.
- [ ] **Step 5: Commit** `feat(viewer): text style panel controls`.

### Task 6: PresetControls UI

**Files:**
- Create: `src/components/PresetControls.jsx`, `PresetControls.test.jsx`
- Modify: `src/components/TextStylePanel.jsx` (render it)

**Interfaces:**
- Consumes: `listPresets, saveCustomPreset, renameCustomPreset, deleteCustomPreset, applyPreset` (Task 4).
- Produces: `<PresetControls settings onChange />`: a labelled select "Preset" of `listPresets()` (built-ins grouped under an `<optgroup label="Built-in">`, custom under "Yours"); choosing one calls `onChange(applyPreset(preset, settings))`. Buttons "Save current look…" (uses `window.prompt` for the name), "Rename", "Delete" (the last two only when a custom preset is selected). Failure reasons surface as a `role="alert"` message: empty name, "You can save up to 20 presets.", "Couldn't save — browser storage is unavailable."

- [ ] **Step 1: Write failing tests** (stub `window.prompt` with `vi.spyOn`): `selecting a built-in applies it via onChange`; `Save current look stores a custom preset that then appears in the list`; `empty name shows an alert and stores nothing`; `Rename/Delete hidden for built-ins and work for custom`; `limit and storage failures show the right alert text`.
- [ ] **Step 2: Run** `npx vitest run src/components/PresetControls.test.jsx` — FAIL.
- [ ] **Step 3: Implement** with local state for the list and message; re-read `listPresets()` after each mutation.
- [ ] **Step 4: Run** `npm test` — all PASS.
- [ ] **Step 5: Commit** `feat(viewer): preset menu with save, rename and delete`.

### Task 7: Wire the panel into Toolbar and Viewer

**Files:**
- Modify: `src/components/Toolbar.jsx`, `Toolbar.css`, `src/routes/Viewer.jsx`
- Test: `src/components/Toolbar.test.jsx`, `src/routes/Viewer.test.jsx`

**Interfaces:**
- Consumes: `<TextStylePanel settings onChange isPdf />` (Task 5).
- Produces: `<Toolbar settings onChange isPdf />`. Adds a "Text style" button (`aria-expanded`, `aria-controls="text-style-panel"`) toggling the panel rendered directly below the bar; Escape closes it and returns focus to the button. The Size slider is removed from the toolbar (it now lives in the panel). `Viewer` passes `isPdf={kind === "pdf"}`.

- [ ] **Step 1: Update/add failing tests**: in `Toolbar.test.jsx` replace the size-slider test with `Text style button toggles the panel and aria-expanded`, `Escape closes the panel and refocuses the button`, `size slider is reachable inside the panel and calls onChange({fontSize})`; in `Viewer.test.jsx` add `opening a PDF disables the layout controls; opening a docx enables them` (reuse the file-loading helpers already in that test).
- [ ] **Step 2: Run** `npx vitest run src/components/Toolbar.test.jsx src/routes/Viewer.test.jsx` — FAIL.
- [ ] **Step 3: Implement** the toggle state in `Toolbar`, panel placement and responsive CSS (full width, single column at phone width), and the `Viewer` prop.
- [ ] **Step 4: Run** `npm test` and `npm run build` — all PASS, build succeeds.
- [ ] **Step 5: Commit** `feat(viewer): wire Text style panel into the toolbar`.

### Task 8: Real-browser verification and docs

**Files:**
- Modify: `README.md` (feature list), `documentation/plans/2026-10-09-font-style-customization.md` (tick off nothing; leave as is)

- [ ] **Step 1:** Start the dev server (project's `convert-preview` entry or `npm run dev`), open `/viewer`, load `test-fixtures/sample.docx` (copy it into `public/` temporarily, remove afterwards).
- [ ] **Step 2:** In the browser, verify: Text style opens/closes; choosing each font changes the computed `font-family` on `.document-panel`; line height, paragraph spacing and width sliders change computed styles live; Full width removes the cap; each built-in preset applies; Save/Rename/Delete a custom preset persists across reload; reload keeps settings.
- [ ] **Step 3:** Open `sample.pdf`: layout controls disabled with the note; Size/colours still change the render; reopen the docx and confirm values were preserved.
- [ ] **Step 4:** In the network log confirm requests are same-origin only and the Atkinson `.woff2` loads only after selecting that font; check a 375px-wide viewport lays out in one column.
- [ ] **Step 5:** Add a short "Text style & presets" bullet to `README.md`; commit `docs: document text style and presets`.

---

## Self-Review Notes

- **Spec coverage:** settings/validation → T1; fonts + bundling + no external requests → T2; CSS variables in DocumentPanel → T3; presets (built-in, custom, cap, corruption) → T4, T6; panel (controls, reset, PDF-disabled note, values preserved) → T5; toolbar button, Escape, size slider move, phone layout, PDF flag → T7; real-browser/network/responsive checks → T8; privacy → Global Constraints + T2/T8.
- **Type consistency:** `textWidth` is a number or `"full"` everywhere; `applyPreset(preset, current)` returns a normalized full settings object used by `onChange`; save/rename return `{ ok, reason }` shapes consumed by `PresetControls`.
