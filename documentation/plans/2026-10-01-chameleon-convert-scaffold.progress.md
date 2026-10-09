# SDD ledger — plan: /Users/pshah/Documents/force-dark-mode-extension/documentation/plans/2026-10-01-chameleon-convert-scaffold.md

Spec: /Users/pshah/Documents/force-dark-mode-extension/documentation/specs/2026-10-01-chameleon-convert-scaffold-design.md
Roadmap: /Users/pshah/Documents/force-dark-mode-extension/documentation/specs/2026-09-30-chameleon-convert-roadmap.md

Ruling: this plan bootstraps a brand-new repo (chameleon-convert) that did
not exist before this session. The SDD tooling assumes an existing repo
with a worktree to branch from; there is nothing to branch from here.
Controller created /Users/pshah/Documents/chameleon-convert, ran `git init`,
and renamed the default branch to `main` (matching force-dark-mode-extension's
convention) before resolving this workspace — this is infrastructure setup,
not implementation, so it is not a task under review. All implementation
work (Task 1 onward) happens via dispatched subagents committing directly to
this new repo's `main` branch. No worktree layer is used: there is no prior
history on `main` to protect, since the repo was created fresh for this plan.
Cost if wrong: trivial to redo — `rm -rf` the directory and re-init.

## Pre-flight conflict scan

Checked every task-pair that shares a file or interface, and every task's
internal consistency (tests specified vs. code specified, files created vs.
files later touched).

| Tasks | Shared surface | Check | Finding |
|---|---|---|---|
| 1 → all | `package.json`, `vite.config.js`, test runner | Task 1 sets up Vitest + RTL + jsdom; every later task's tests assume this config exists | Consistent — no later task redefines test config. |
| 2 → 9, 10, 11, 13, 14 | `src/styles/tokens.css` custom properties | Task 2 defines `--bg-surface`, `--border-subtle`, `--text-secondary`, `--accent-primary`, `--chameleon-orange`, `--radius-*`, etc.; later component CSS files reference these exact names | Consistent — spot-checked each later CSS block against Task 2's token list; all referenced vars are defined there. |
| 3 → 13 | `zipReader.js` exports | Task 3 produces `listZipEntryNames`, `readZipEntryText`; Task 13's `DocumentPanel.jsx` imports both | Consistent. |
| 4 → 13 | `docxParser.js` exports | Task 4 produces `parseDocxDocument`; Task 13 imports and calls it with xml text, destructures `{ blocks, truncated }` | Consistent. |
| 5 → 13 | `pptxParser.js` exports | Task 5 produces `parsePptxSlideXml`, `parsePptxPresentation`; Task 13 imports `parsePptxPresentation`, calls with `(entryNames, fetchFn)`, destructures `{ slides, truncated }` | Consistent. |
| 6 → 7 | `pixelMath.js` exports | Task 6 produces `hexToRgb, rgbToHsl, getRelativeLuminance, mixRgb, dimColor, applyContrast, clampColorChannel, clampNumber`; Task 7 imports `rgbToHsl, getRelativeLuminance, mixRgb, dimColor, applyContrast` from it | Consistent — Task 7 does NOT import `hexToRgb` from pixelMath (it re-declares `hexToRgbLocal` instead, per the task's own note allowing either). Not a defect, just worth the task reviewer's attention if the implementer picks the redundant path. |
| 7 → 12 | `pdfRender.js` exports | Task 7 produces `getPdfPageColors`, `transformPdfCanvas`, `transformPixel`; Task 12's `PdfPageCanvas.jsx` imports `getPdfPageColors` and `transformPdfCanvas` | Consistent. |
| 8 → 14 | `settings.js` exports | Task 8 produces `DEFAULT_SETTINGS`, `getSettings()`, `setSettings(partial)`; Task 14's `Viewer.jsx` imports all three with matching call signatures | Consistent. |
| 10 → 14 | `Toolbar` props | Task 10 produces `<Toolbar settings={} onChange={} />`; Task 14 renders it with a `settings` state object shaped like `DEFAULT_SETTINGS` and an `onChange` that merges partials | Consistent. |
| 11 → 14 | `FileDropzone` props | Task 11 produces `<FileDropzone onFile={} />`; Task 14 renders it and wires `onFile` to `handleFile` | Consistent. |
| 12 → 14 | `PdfPageCanvas` props | Task 12 produces `<PdfPageCanvas file={} settings={} />`; Task 14 renders it with matching props when `kind === "pdf"` | Consistent. |
| 13 → 14 | `DocumentPanel` props | Task 13 produces `<DocumentPanel kind={} file={} />`; Task 14 renders it with matching props when `kind` is `docx`/`pptx` | Consistent. |
| 9, 14 → 1 | `App.jsx` modifications | Task 9 replaces the `/` placeholder, Task 14 replaces the `/viewer` placeholder — both modify the same file but different routes, dispatched in order so no overlap | Consistent — sequential, not parallel. |
| Task 13 internal | Test fixture vs. parser expectations | Task 13's test hand-builds a ZIP via a local `crc32`/header-writing helper, not using Task 3's `zipReader.js` (which only *reads*) | Correct — Task 3 has no writer; this is a test-only ZIP-encode helper, scoped to the test file, not a product dependency. Worth the task reviewer confirming it isn't accidentally treated as a reusable module (it must stay local to the test). |
| Global Constraints → all tasks | Plain JS not TS | No task file uses `.ts`/`.tsx` extensions or type annotations | Consistent. |
| Global Constraints → all tasks | Plain CSS not Tailwind | No task introduces a Tailwind config or `className` utility strings | Consistent. |

Scan is clean — no rulings needed beyond the bootstrap ruling above.

Task 1: complete (commit d5d3dc5). Controller verified directly: clean tree, 1/1 test passes, .superpowers/ ignored. Ruling: no separate reviewer dispatched for Task 1 (boilerplate scaffold, verified by controller); full reviewer for Tasks 2+.

Task 2: complete (commit afb85d1). Controller verified: clean tree, tests green.

Task 3: complete (commits 1b35e3a, fix). Ruling: implementer swapped Blob.stream() for awaited writer.write before reading (jsdom compat); controller changed to non-awaited write to avoid deadlock on large entries.

Task 4: complete (1d024be). Verified: identical to extension source, tests green.

Task 5: complete (e15dad6). Verified identical to source, 23 tests green.

Task 6: complete (f5aa923). Verified: clean tree, 38 tests green.

Task 7: complete (5bfaae4 + fix). Ruling: implementer lowered a production threshold (0.18->0.15) to pass a test; the plan's test color (220,30,30, L~0.164) was wrong, not the code. Controller restored 0.18 for parity with the extension and changed the test color to (240,80,80). 44 tests green.

Task 8: complete (ad18215). Verified: clean tree, 48 tests green.

Task 9: complete (23f6ef3). Ruling: plan test wanted link name /dark document viewer/ but component rendered 'Open tool'; controller added aria-label='Open <tool name>' (also better a11y). Controller also wired / to <Landing /> in App.jsx and updated App.test (implementer skipped it). 51 tests green, build ok.

Task 10: complete (a01dbb2). Verified: clean tree, 54 tests green.

Task 11: complete (0d54805). Verified: clean tree, 57 tests green.

Task 12: complete (529b912). Deviations accepted: jsdom shims only (FileReader fallback, skip render when no canvas ctx, workerSrc guarded by typeof Worker, Uint8Array.toHex polyfill in test-setup). Worker bundling verified by implementer with temp import. 59 tests green.

Task 13: complete (981e79a). Good catch by implementer: added missing awaits on async zipReader calls; null document.xml now -> error state. jsdom-only Blob.arrayBuffer shim in test. 60 tests green.

Task 14: complete (b5ecfa7). Verified: 64 tests green, build contains pdf.worker asset.

Live smoke test (vite dev, real browser): sample.pdf renders dark (#0f1115 bg, light text), sample.docx renders text. UX note for later: dropzone disappears after a file loads (must reload to open another) — not in plan scope. Task 15 (public GitHub repo + Vercel + DNS) is outward-facing: needs user confirmation; user handles auth/DNS.

Final review (opus) found 0 critical; fixes for Important items 1-6 + minor a11y/favicon committed f130d64..a1b4722, 76 tests green. Deferred: PDF text layer/selection, fit-to-width, file-size guard, zip efficiency, spec structure doc update. Ruling: pdf.js v6 has no destroy() on proxy -> loadingTask.destroy().
