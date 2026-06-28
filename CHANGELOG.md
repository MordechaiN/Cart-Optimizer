# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.0] - 2026-06-27

A product-led redesign: the app now teaches itself and guides the user toward
their goal, instead of presenting a form. Visual design, backend, API, i18n/RTL,
and accessibility are unchanged. (See ADR-0008.)

### Added
- **Inviting empty state** that explains the value, shows benefits, offers an
  example, and puts a quick-add front and centre.
- **Quick-add** capture: type a name, price and store, press Enter to add; the
  store stays sticky for the next item.
- **Cart grouped by store** with **ghost-input** inline editing (fields read as
  text, become editable on focus) and a quantity stepper — no spreadsheet feel.
- **Real-time smart guidance:** coupon *unlock progress* ("you're X away"),
  coupon qualification status, duplicate detection, missing/over-limit price
  flags, impossible-constraint and customs suggestions — as a top insights strip
  and inline badges.
- **Plain-language coupons** with a live "$5 off your order over $50" summary and
  status; "Avoid customs fees" toggle replaces technical limit wording.
- **Results as the hero screen:** big "You pay" with a savings pill and
  full-price → you-pay comparison, a customs/why note, an order **checklist** you
  tick as you place each one, per-order coupon usage, and a localized
  "why this is the best plan" explanation. Edit and "Optimize again" in place.
- Currency moved to a compact header control; `Ctrl/Cmd+Enter` optimizes.

### Changed
- The previous wizard/dashboard editor framing is replaced by a goal-oriented,
  self-teaching product flow.
- Live updates are now surgical (item flags and coupon progress patch in place),
  so typing and tabbing between fields never lose focus.

### Removed
- The group-order / per-person ("Users") mode is removed from the primary UI to
  keep the common path simple. The backend still accepts an `owner` field, so it
  can return later as an opt-in advanced mode (see ADR-0008).

## [0.3.0] - 2026-06-27

Reworked the user experience from a multi-step wizard into a single-page
"dashboard", keeping the exact visual design, i18n/RTL, accessibility and theming.

### Changed
- **The UI is now a single-page dashboard instead of a wizard.** Everything is
  visible on one scrollable board: a collapsible Settings card, a large Products
  section, a Coupons list, a Live summary, and Results rendered in place. No
  steps, no navigation. (See ADR-0007.)
- **Products are a fast, inline-editable table.** Compact rows with column
  headers, store autocomplete, per-row duplicate / delete / include toggle, and
  keyboard flow — **Enter** adds the next product, **Arrow Up/Down** moves
  between rows — so entering many products stays comfortable.
- **Coupons are just another list** on the same page (no separate screen).
- Results now appear **below the inputs**; edit anything and press **Optimize
  again** to recompute in place.

### Added
- An always-visible **sticky Optimize bar** with live figures (estimated
  subtotal, product and coupon counts).
- A **Live summary** card that updates as you type (products, optional/excluded,
  people, coupons, estimated subtotal and shipping).
- ADR-0007 documenting the dashboard UX (revising the wizard from ADR-0006).

### Fixed
- **Portainer "Pull and redeploy" no longer fails trying to pull a non-existent
  image.** The compose service dropped its `image: cart-optimizer:latest` tag and
  now sets `pull_policy: build`, so Compose/Portainer always builds the image
  locally from `docker/Dockerfile` and never attempts a registry pull.

## [0.2.0] - 2026-06-27

A complete frontend redesign and the Portainer deployment restructure.

### Added
- **Redesigned Web UI**: a guided, multi-step wizard (Settings → Products →
  Coupons → Review → Results) replacing the single form. Dark-first design with a
  light theme toggle, responsive and touch-friendly layout, SVG icons, visible
  keyboard focus, and `prefers-reduced-motion` support.
- **Product management**: add, edit, duplicate, delete, and an include/exclude
  toggle to leave an item out of a calculation without deleting it; store
  autocomplete keeps store names consistent for store coupons.
- **Plain-language coupons**: "whole order" vs "a specific store", with inline
  hints instead of technical fields.
- **Results page**: headline what-you-pay / before-discounts / you-save figures,
  a per-order breakdown with coupon usage, and a localized "why this plan"
  explanation composed on the client.
- **Internationalization (i18n)**: English and Hebrew, switchable in-app, with
  full right-to-left layout for Hebrew via CSS logical properties. One shared
  translation source — no duplicated, language-specific code. Currency/number
  formatting via `Intl.NumberFormat`.
- **Browser persistence**: wizard state is saved to `localStorage`, so a refresh
  never loses a half-entered cart. Clear-all and load-example helpers.
- ADR-0006 recording the buildless, framework-free frontend architecture.
- Dedicated **"Deployment with Portainer"** section in the README and an updated
  deployment guide.
- OCI image labels (title, description, source, license) on the runtime image.

### Changed
- **Deployment restructured for Portainer.** The primary `docker-compose.yml`
  now lives at the repository root and builds from the root context
  (`docker/Dockerfile`), so the repository deploys directly as a Portainer Stack
  from Git with a "Pull and redeploy" workflow — no manual Docker commands. The
  old `docker/docker-compose.yml` was removed.
- The Web UI is now split into maintainable `index.html` / `styles.css` /
  `i18n.js` / `app.js` files (still buildless, no framework, served as static
  assets).

### Fixed
- `OrderResult.total_cents` is now serialized in the API response (it was a plain
  property and silently omitted), so per-order totals are available to clients.
  Backward-compatible (additive) and covered by a regression test.
- Packaging now bundles **all** web assets under `cart_optimizer/web/`
  (including any future CSS/JS/template subdirectories), guaranteeing the runtime
  image is self-contained. Verified by installing the built package and serving
  the UI from it.

## [0.1.0] - 2026-06-27

First working version (v0): a Dockerized application that computes the provably
optimal way to split a shopping cart into multiple orders.

### Added
- **Exact optimization engine** using OR-Tools CP-SAT. Splits a cart into orders
  to minimise the total actually paid — `max(0, subtotal + shipping - discounts)`
  per order, so a coupon never pushes an order below zero — respecting an
  optional per-order customs cap, and proves global optimality. Among
  equally-priced solutions it prefers the fewest orders, and results are
  reproducible run-to-run.
- **Canonical, platform-agnostic data model**: products, coupons (order- and
  store-scoped), users (as product owners), and settings. All money is integer
  cents for exact arithmetic.
- **Explainable results**: every answer reports its proof status
  (`PROVEN_OPTIMAL` / `INFEASIBLE` / `UNPROVEN`), the orders to place, the
  savings versus a single-order baseline, and a plain-language explanation.
- **REST API** (FastAPI) with `POST /api/v1/optimize`, a health check, and
  automatic OpenAPI docs at `/docs`.
- **Minimal Web UI**: a single static page to enter products/coupons/settings
  and view the optimal split. No build step, fully offline.
- **Docker support**: multi-stage, non-root Dockerfile and a one-command
  `docker compose` setup.
- **Documentation**: README (for non-developers), CLAUDE.md (project
  constitution), architecture overview, and ADRs 0001–0005.
- **Test suite** covering the engine's correctness guarantees and the API.

### Changed
- Project license changed from MIT to **Apache-2.0**, with a `NOTICE` file for
  attribution (see ADR-0004).

### Security
- Input is bounded at the API boundary (max products/coupons/users, per-amount
  and quantity caps, and a solver time-limit ceiling) to fail closed against
  oversized or malicious requests and to keep the solver model within safe
  integer range. Limits are documented in `docs/configuration.md`.
- The container runs read-only with an in-memory `/tmp`, as a non-root user, and
  with `no-new-privileges`.

[Unreleased]: https://github.com/mordechain/cart-optimizer/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/mordechain/cart-optimizer/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/mordechain/cart-optimizer/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/mordechain/cart-optimizer/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/mordechain/cart-optimizer/releases/tag/v0.1.0
