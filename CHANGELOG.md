# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/mordechain/cart-optimizer/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/mordechain/cart-optimizer/releases/tag/v0.1.0
