# ADR-0001: Record architecture decisions

- Status: Accepted
- Date: 2026-06-27

## Context

Cart Optimizer is intended to be a long-lived, open-source, maintainable
project. Significant architectural decisions need to be remembered, with their
reasoning, so they are not re-litigated and so future contributors understand
why things are the way they are.

## Decision

We record every significant architectural decision as an **Architecture
Decision Record (ADR)** in `docs/architecture/adr/`, numbered sequentially. Each
ADR uses a lightweight (MADR-style) format: Context, Decision, Consequences.

A decision is "significant" if it is hard to reverse, affects module boundaries
or public contracts, introduces a dependency, or changes how the optimization
engine behaves.

## Consequences

- The reasoning behind the architecture is durable and discoverable.
- Changing a past decision means superseding its ADR with a new one, not
  silently editing history.
- Small, local, reversible choices do not need an ADR (a code comment or
  CHANGELOG entry is enough).
