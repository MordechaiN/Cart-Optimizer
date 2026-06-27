# Architecture Overview

Cart Optimizer is a self-hosted, offline-first application that computes the
**mathematically optimal** way to split a shopping cart into multiple orders.

This document describes the v0 architecture. It is deliberately small, but the
boundaries are drawn so the project can grow without rework.

## Guiding constraint

> Never guess. Never approximate. Return a provably optimal legal solution, or
> say clearly that one could not be found/proven.

Everything below follows from this. We use an **exact** constraint solver
(OR-Tools CP-SAT), integer-cent arithmetic, and report a proof status with every
result. See [ADR-0002](adr/0002-exact-optimization-with-cp-sat.md).

## Shape: hexagonal modular monolith

```
            ┌───────────────────────────────────────────────┐
 driving →  │  Interfaces:  REST API (FastAPI)  ·  Web UI    │
            ├───────────────────────────────────────────────┤
            │  Application:  optimize_cart use-case          │
            ├───────────────────────────────────────────────┤
            │  Domain (pure, no I/O):                         │
            │    money · models (Product/Coupon/Settings) ·  │
            │    optimization engine (CP-SAT) · result        │
            ├───────────────────────────────────────────────┤
 driven  →  │  Adapters:  (future) platform importers,        │
            │             alternative solvers                 │
            └───────────────────────────────────────────────┘
```

Dependencies point inward. The `domain` package imports no web framework and
performs no I/O, which is what makes the engine and the business rules testable
in isolation and keeps them platform-agnostic.

### Layers

| Layer | Package | Responsibility |
|-------|---------|----------------|
| Domain | `cart_optimizer.domain` | Data model, money, and the exact optimization engine. Pure logic. |
| Application | `cart_optimizer.application` | Use-cases. v0 has one: `optimize_cart`. |
| Interface | `cart_optimizer.api` | FastAPI REST endpoints + the static Web UI. |

## Data flow (v0)

The app is **stateless** — there is no database (see
[ADR-0005](adr/0005-v0-scope-and-data-model.md)).

1. The Web UI (or any API client) collects products, coupons, and settings.
2. It POSTs them to `POST /api/v1/optimize`.
3. FastAPI validates the request against the Pydantic model.
4. `optimize_cart` calls the engine, which builds and solves a CP-SAT model.
5. The result — orders, savings, proof status, and a plain-language explanation
   — is returned as JSON and rendered by the UI.

## Why a monolith, and why no database

A self-hosted, offline-first tool benefits from being a single image you can
`docker compose up`. There is no multi-user state to store in v0: each request
is a self-contained problem. Adding services or a database now would be
complexity without a current need. The module boundaries make both possible
later if a real need appears.

## Extensibility (deliberately deferred, not blocked)

- **Other shops:** an importer adapter maps a shop's data to the canonical
  model. The engine never learns shop-specific logic.
- **Other solvers:** the engine's model is separable from CP-SAT; a `Solver`
  port can be extracted the day a second backend is wanted.
- **More rules:** new constraints/costs are added as new terms in the model
  builder.

None of these are built in v0 — but none of them require changing the v0
architecture to add.

## The optimization model

See the module docstring in
`src/cart_optimizer/domain/optimization/engine.py` for the full formulation
(variables, constraints, objective, symmetry breaking, and complexity notes).
In short: assign each product to an order; respect an optional per-order customs
cap; apply each coupon to at most one order if its threshold is met; minimise
shipping minus discounts; and, among equally-priced solutions, prefer fewer
orders.
