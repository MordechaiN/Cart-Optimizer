# ADR-0007: Single-page dashboard UX (revises the wizard from ADR-0006)

- Status: Accepted
- Date: 2026-06-27
- Revises: ADR-0006 (navigation model only)

## Context

ADR-0006 introduced a polished frontend built as a multi-step **wizard**
(Settings → Products → Coupons → Review → Results). In real use the wizard felt
like "filling out a government form": it forced a sequential flow, hid the user's
data across steps, and put the primary action (Optimize) several clicks away.

The goal is a modern productivity feel (Notion / Linear / Todoist): open the app
and immediately understand what to do, with almost everything on one screen and
minimal clicks.

The **visual design system, i18n/RTL, accessibility, theming, and the buildless
vanilla architecture from ADR-0006 are kept unchanged.** Only the interaction
model changes.

## Decision

Replace the wizard with a **single-page dashboard**: one scrollable board of
cards, all visible at once.

- **Layout (top to bottom):** a small collapsible **Settings** card; a large
  **Products** section; a **Coupons** list; a **Live summary**; and **Results**
  rendered in place after optimizing.
- **Always-visible Optimize.** A sticky bottom action bar shows live figures
  (estimated subtotal, product/coupon counts) and the primary **Optimize**
  button at all times — no navigation to reach it.
- **Products as a fast, inline-editable table.** Column headers once at the top,
  compact rows, store autocomplete, per-row duplicate / delete / include-toggle.
  Keyboard flow: **Enter** adds the next product row; **Arrow Up/Down** moves
  between rows (text fields). Comfortable at dozens of items.
- **Coupons are just another list** in the same page — no separate screen.
- **Live summary updates as you type** (products, optional/excluded, people,
  coupons, estimated subtotal and shipping), building confidence before
  optimizing.
- **Results appear below the inputs**, not on a separate screen. The user can
  edit any field and press **Optimize again**; results update in place. The flow
  feels interactive.
- **No forced sequence.** Validation runs on Optimize (highlighting the offending
  fields and scrolling to the first one) rather than gating each step.

Drag-and-drop reordering of products was considered and **deliberately omitted**:
the engine is order-agnostic (products are a set), so reordering has no effect on
the result. Keyboard flow, duplicate, and include-toggle deliver the value
without the accessibility and touch cost of DnD.

## Consequences

- Far fewer clicks; the whole task is visible and obvious at a glance.
- Partial re-rendering keeps typing smooth: the live summary and action bar
  update on input without disturbing the focused field; structural changes
  (add/remove/toggle) re-render only their section.
- The wizard/stepper code is removed; the design system, components, i18n, RTL,
  accessibility, dark mode, and `localStorage` persistence all carry over
  unchanged.
- No API or backend change.
