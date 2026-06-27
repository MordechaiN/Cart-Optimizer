# ADR-0002: Exact optimization with OR-Tools CP-SAT

- Status: Accepted
- Date: 2026-06-27

## Context

The defining requirement of the project is that it must **never approximate**.
It must return the globally optimal legal solution, or state clearly that one
could not be found or proven. Cart splitting with thresholds (coupons, customs
limits) is a cost-based set-partitioning problem, which is NP-hard in general.

This rules out the entire family of heuristic and metaheuristic optimizers
(greedy, local search, genetic algorithms, simulated annealing, and tools such
as OptaPlanner/Timefold), because they cannot prove optimality.

## Decision

Use an **exact solver**: Google OR-Tools **CP-SAT**.

- CP-SAT performs exact branch-and-bound and **proves** global optimality.
- It models the conditional/threshold structure of this problem naturally
  (coupon eligibility above a spend, customs caps, free-shipping tiers).
- It is a mature, permissively licensed (Apache-2.0), offline library shipped as
  prebuilt wheels.

Two consequences are treated as hard rules:

1. **Integer-cent arithmetic only.** All money is integer minor units; no floats
   anywhere in the model. Floats would silently approximate.
2. **Optimality is an output.** Every result carries a status:
   `PROVEN_OPTIMAL`, `INFEASIBLE`, or `UNPROVEN`. If the solver cannot prove
   optimality within its time budget, the result is reported as `UNPROVEN` —
   never disguised as the optimum.

Among equally-priced optimal solutions we prefer the one with the fewest orders,
encoded as a strictly-secondary lexicographic objective so it can never trade
away a real saving.

## Consequences

- We can promise, and verify in tests, that answers are provably optimal.
- The engine's scalability is bounded by the difficulty of the instance; for the
  manual-entry carts v0 targets (tens of products) it solves in well under a
  second. Larger instances may need a time budget, in which case an `UNPROVEN`
  status is returned rather than a guess.
- CP-SAT becomes a core dependency. The model is written separately from the
  solver call, so an alternative exact backend (e.g. a MILP solver) can be
  introduced behind a port later without reworking the model.
