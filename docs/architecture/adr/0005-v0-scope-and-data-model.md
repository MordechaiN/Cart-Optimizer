# ADR-0005: v0 scope and data model

- Status: Accepted
- Date: 2026-06-27

## Context

v0's goal is a working, Dockerized application that finds the optimal split for a
real AliExpress order, using manual data entry. The brief lists the entities to
support: products, coupons, users, and basic settings. We must choose concrete
semantics for these without over-building for the future.

A few choices were genuinely ambiguous; per the project's decision-making rules
(CLAUDE.md §23), we picked sensible defaults that keep the architecture open and
documented them here rather than blocking on approval.

## Decisions

### No database; stateless API
Each optimization is a self-contained problem. The client sends the whole cart
to `POST /api/v1/optimize` and receives the answer. There is no persistence,
no accounts, and no authentication in v0. This is the simplest thing that works
and removes a whole class of complexity (migrations, secrets, multi-tenancy).
Persistence can be added later behind the application layer without changing the
engine.

### Money as integer cents
All monetary values in the API and the model are integer **minor units**. The
Web UI accepts familiar decimal amounts and converts to cents before sending.
This keeps the engine exact (see ADR-0002).

### "Users" = product owners (group orders), informational in v0
The realistic AliExpress use of "users" is people pooling items into a shared
cart. We model a user as an **optional `owner` label on each product**. v0
reports a per-user subtotal (so each person knows the face value of their items)
but imposes **no per-user constraints** and does **not** allocate shared
discounts/shipping. This satisfies "manual entry of users" minimally while
leaving room to add per-user rules or fair-share cost splitting later without a
model change. *(Open question deferred to the user: should shared
savings be allocated back to users, and if so by what rule?)*

### Coupons: threshold + discount, order- or store-scoped
A coupon subtracts a fixed amount from one order if a qualifying spend meets a
threshold. Order-scoped coupons measure against the whole order; store-scoped
coupons measure against a single store's items within the order. Each coupon is
used on at most one order. This covers the common AliExpress "select" (platform)
and store coupons. Assumption (documented): a coupon's discount does not exceed
its threshold, so an order total never goes negative; richer coupon types
(percentage, stacking limits, per-store shipping) are deferred.

### Splitting drivers in v0
With the model above, the lever that forces or rewards splitting is the
**customs cap** (a hard per-order maximum), together with shipping. The engine
finds, among all legal splits, the one that minimises shipping minus discounts —
e.g. isolating a high-value item so a coupon still qualifies while staying under
the cap. Per-order shipping and a free-shipping threshold are supported so that
over-splitting carries a real cost.

## Consequences

- v0 is small, exact, explainable, and genuinely useful for a real order.
- The deferred items (persistence, auth, import/export, per-user cost
  allocation, richer coupons/shipping, a solver port) are all additive; none
  requires reworking the v0 architecture.
- The one open product question (allocating shared savings to users) is recorded
  here for a future milestone.
