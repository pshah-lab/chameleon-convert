# Chameleon Convert

Standalone, 100% client-side document tools (React + Vite, plain JS, plain CSS, Vitest). Separate product from the Force Dark Mode extension (`pshah-lab/force-dark-mode-extension`), which keeps its own document viewer until this app is ~70% complete.

- Roadmap: `documentation/specs/2026-09-30-chameleon-convert-roadmap.md` (next: font/style customization, Excel viewer, editing + download — each needs its own brainstorm → spec → plan).
- Scaffold spec/plan and the SDD ledger of rulings: `documentation/`.
- Privacy is a hard rule: no uploads, no analytics, no external fonts/CDNs, no network calls from `src`.
- Tests: `npm test`. Never weaken tests or constants to make them pass.
- Deploy: Vercel → convert.pshah.fun. The user handles all sign-ins and DNS.
- Commits end with the Co-Authored-By line; `.superpowers/` stays untracked.
- Browser testing gotcha: pdf.js draws via `requestAnimationFrame`, which never fires in a hidden tab. If the Claude Browser pane is hidden, PDFs look "blank" (no canvas, no error) in dev and prod alike — it is not an app bug. Verify with the pane visible, or temporarily shim `window.requestAnimationFrame = cb => setTimeout(cb, 16)` in the page before loading a PDF.
