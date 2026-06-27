# ADR-0003: Language and technology stack

- Status: Accepted
- Date: 2026-06-27

## Context

The optimization requirement (ADR-0002) dominates the stack choice: we need a
language with a first-class exact-optimization ecosystem. We also value
open-source friendliness, testability, offline/Docker-first operation, and
maintainability.

## Decision

- **Language/runtime:** Python 3.11+.
- **Solver:** Google OR-Tools (CP-SAT).
- **API:** FastAPI + Uvicorn (typed, automatic OpenAPI docs, request
  validation).
- **Validation / data model:** Pydantic v2 (shared between the domain model and
  the API boundary in v0).
- **Web UI:** a single static HTML page with vanilla JavaScript — no build step,
  no Node toolchain, fully offline.
- **Tooling:** pytest (tests), ruff (lint/format), mypy (types).

Alternatives considered: Rust + MILP (best performance and a single binary, but
a far thinner exact-optimization ecosystem and slower development); Java/Kotlin +
OR-Tools (first-class but heavier and less inviting to casual contributors).
Node/TypeScript was rejected for the engine because it has no serious exact
solver ecosystem.

## Consequences

- The richest exact-optimization ecosystem, the largest contributor pool, and
  fast development.
- OR-Tools wheels make the image self-contained and offline, at the cost of a
  larger image.
- Python packaging requires discipline; mitigated with `pyproject.toml`, pinned
  dependencies, and Docker.
- Choosing vanilla JS for the UI keeps the project buildless and approachable; a
  richer frontend can be added later as a separate module if needed.
