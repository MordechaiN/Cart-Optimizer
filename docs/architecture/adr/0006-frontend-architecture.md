# ADR-0006: Frontend architecture — buildless vanilla SPA with i18n & RTL

- Status: Accepted
- Date: 2026-06-27

## Context

v0 shipped a single functional HTML page. The next milestone is a polished,
SaaS-grade interface: a guided multi-step workflow, excellent results page,
accessibility, and full localization (English + Hebrew with RTL).

The obvious temptation is a frontend framework (React/Vue) with a build
pipeline. But that conflicts with the project constitution: offline-first,
minimal dependencies (§12), and Docker simplicity — the image is a Python
package that bundles static assets via `package-data`; there is no Node in the
runtime image, and adding a bundler/npm toolchain would mean a Node build stage,
a large dependency tree, and more moving parts to keep offline and reproducible.

## Decision

Build the frontend as a **buildless, framework-free single-page app**: plain
HTML, CSS, and ES (vanilla) JavaScript, split into maintainable files
(`index.html`, `styles.css`, `i18n.js`, `app.js`) served as static assets.

Key choices:

- **No build step, no npm, no framework.** Modern CSS (custom properties, grid,
  logical properties) and structured vanilla JS reach the required polish while
  keeping the app offline and the image self-contained.
- **Guided wizard.** A multi-step flow (Settings → Products → Coupons → Review →
  Results) with a stepper, per-step validation, and free back-navigation,
  instead of one large form.
- **i18n from one source of truth.** A tiny i18n layer holds all strings for
  every language; the UI references keys (`data-i18n`, `t()`). No language-
  specific code paths or duplicated markup. Number/currency formatting uses
  `Intl.NumberFormat` with the active locale.
- **RTL via CSS logical properties.** Switching to Hebrew sets `dir="rtl"` and
  the layout mirrors automatically; no separate RTL stylesheet.
- **Localized explanations.** The results "why" narrative is composed on the
  client from the structured result, so it is fully localized without the API
  returning localized prose. The API stays unchanged.
- **Accessibility & UX baseline** (informed by the *ui-ux-pro-max* skill's
  checklist): SVG icons (no emoji), visible keyboard focus, ≥4.5:1 contrast,
  150–300 ms transitions, `prefers-reduced-motion`, responsive breakpoints at
  375/768/1024/1440, dark-first with a light theme toggle.
- **State persistence.** Wizard state is saved to `localStorage` so a refresh
  never loses a half-entered cart. No server-side storage is introduced.

## Consequences

- The image stays self-contained and offline; deployment is unchanged
  (`package-data` already bundles `web/**`).
- No new runtime or build dependencies; the constitution's dependency policy
  holds.
- Adding a language is data-only (one translation table); adding a step or field
  is localized markup plus keys.
- The trade-off is that very complex UI growth is more manual than with a
  framework. If the UI ever outgrows vanilla JS, this ADR can be superseded —
  but that threshold is far off for this tool.

### Related fix

Surfaced during this work: `OrderResult.total_cents` was a plain `@property` and
therefore not serialized by Pydantic, so per-order totals were absent from the
API response. It is now a `computed_field` (an additive, backward-compatible
change), and a regression test guards it.
