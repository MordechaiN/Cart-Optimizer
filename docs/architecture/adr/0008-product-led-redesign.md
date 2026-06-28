# ADR-0008: Product-led redesign — goal-oriented IA, onboarding, smart guidance

- Status: Accepted
- Date: 2026-06-27
- Builds on: ADR-0006 (buildless frontend, i18n/RTL), ADR-0007 (single page)

## Context

The single-page dashboard (ADR-0007) was clean but still felt like an
*editor*: a set of cards to fill in, structured like the data model. The product
goal is for a first-time, non-technical user to open the app and immediately
understand what it does, what to do, and what they gain — with no documentation
and no admin-panel feel. The experience should be self-teaching and delightful.

The visual design system, buildless architecture, i18n/RTL, accessibility,
theming, and the backend/API are all kept.

## Decision

Redesign the information architecture around the **user's goal** ("tell me the
cheapest way to order my cart"), not around the data model.

- **Inviting empty state.** Instead of a blank form, a hero that states the value
  in one line, three benefit chips, an example, and a prominent quick-add as the
  first thing you can do.
- **Fast, natural capture.** A quick-add bar (name · price · store, Enter to add,
  store stays sticky for the next item) is the primary way to enter items. The
  cart is grouped by store with **ghost-input** editing — fields look like text
  and become editable on focus, so it reads as content, not a spreadsheet.
- **Real-time, intelligent guidance.** The app actively helps while you type:
  coupon **unlock progress** ("you're $4.10 away"), coupon qualification status,
  duplicate detection, missing/over-limit prices, impossible constraints (an item
  over the customs limit), and a customs suggestion. Surfaced both as a top
  insights strip and as inline flags.
- **Plain language everywhere.** Coupons read as "$5 off your order over $50" with
  a live status; "Avoid customs fees" replaces "max order value"; no scopes,
  thresholds, or other implementation terms in the UI.
- **Progressive disclosure.** Customs/shipping rules are a small section with the
  amount field revealed only when the relevant toggle is on. Currency moved to a
  compact header control.
- **Results as the hero screen.** A celebratory "You pay" headline with a savings
  pill and full-price→you-pay comparison, a customs/why note, an order
  **checklist** you tick as you place each one, per-order coupon usage, and a
  localized "why this is the best plan" explanation. Results render in place
  above the editor; you can edit and "Optimize again" without leaving.

### Removed

- The **group-order / per-person ("Users") mode** was removed from the primary
  UI. It served a niche (splitting a shared cart between people) at the cost of an
  extra field on every item and conceptual weight for the common solo user. The
  backend still accepts an `owner` field, so it can return later as an advanced
  option. (Recorded here per the "challenge every decision; keep only what helps"
  brief.)

## Engineering notes

- **Live updates are surgical.** Typing never rebuilds the input you're in:
  item flags and coupon status/progress are patched into the DOM in place, and
  the cart only re-groups when a product's *store* changes. This avoids the
  focus-loss that a naive "re-render on change" would cause when tabbing between
  fields.
- No backend, API, or dependency change. Still buildless vanilla JS/CSS.

## Consequences

- The product is self-explaining and goal-oriented; the data-model framing is
  gone from the surface.
- The smart guidance is presentation-only (computed client-side from the same
  inputs the engine already takes), so it adds no backend complexity and stays
  localized.
- If group-order support is reintroduced, it should be an opt-in advanced mode,
  not a default field.
