# CLAUDE.md — Project Constitution

This document is the permanent constitution of **Cart Optimizer**. It holds the
development rules that apply to every change, so they never need to be repeated.
It evolves together with the project: when a rule changes, change it here in the
same commit.

> If a request in a chat ever conflicts with this document, the conflict must be
> raised explicitly before acting.

---

## 1. Project philosophy

Cart Optimizer computes the **mathematically optimal** way to split a shopping
cart into multiple orders while respecting user-defined constraints.

- **Never guess. Never approximate.** The engine returns a *provably optimal*
  legal solution, or it returns an explicit "could not prove optimal" / "no
  legal solution" — never a guess dressed up as an answer.
- **Docker first. Self-hosted. Offline first.** No runtime calls to the
  internet. Everything needed to run ships in the image.
- **Modular, extensible, testable, explainable, maintainable, open-source
  friendly.** Every architectural decision should make future extensions
  easier.
- **The optimization engine is platform-agnostic.** AliExpress (or any other
  shop) is only an input dataset. Platform-specific logic never enters the
  engine — it lives in adapters and data.

Prefer long-term maintainability over short-term convenience. Prefer readable
code over clever code. Prefer explicit over magic.

---

## 2. Architecture principles

- **Hexagonal (ports & adapters), modular monolith.** Dependencies point
  inward. The domain core depends on nothing outward.
- **Layers:** `domain` (pure logic) → `application` (use-cases) → `api` /
  `web` (interfaces). Adapters (solver, future importers) sit at the edge.
- **The domain is pure.** No HTTP, no framework imports, no I/O inside
  `domain/`. This is what makes the engine and the business rules testable in
  isolation.
- **Exact arithmetic.** All money is integer **minor units** (cents). Never use
  floats for money.
- **Optimality is an output.** Every optimization result carries its proof
  status (`PROVEN_OPTIMAL`, `INFEASIBLE`, `UNPROVEN`).
- Introduce abstraction **when a second concrete case appears**, not before
  (see §15). v0 deliberately keeps the solver inside the domain; a `Solver`
  port can be extracted the day a second backend is added.

---

## 3. Development workflow

Iterative. Build the smallest working version first, keep it clean, extend in
thin vertical slices. Each slice should leave the app in a working, tested
state.

1. Understand the requirement. If it is ambiguous **and** architecturally
   significant, stop and ask. If it is ambiguous but not significant, pick the
   best default, document it briefly (ADR or code comment), and continue.
2. Implement the smallest change that satisfies the requirement.
3. Add or update tests.
4. Update documentation (README / CHANGELOG / ADR as applicable).
5. Verify the Definition of Done (§5).
6. Commit (Conventional Commits, §8).

---

## 4. Git workflow

- Work **directly on `main`**. No feature branches, no pull requests, no merge
  requests. Every commit goes to `main`.
- Commit small, coherent units of work.
- Never commit secrets, credentials, or `.env` files.

---

## 5. Definition of Done

A task is done only when **all** of the following hold:

- [ ] Implementation is complete.
- [ ] Tests pass (`pytest`).
- [ ] Documentation updated (README if user-facing, CHANGELOG always for
      meaningful changes, ADR for architectural decisions).
- [ ] README updated if behaviour or usage changed.
- [ ] CHANGELOG updated.
- [ ] Architecture docs / ADRs updated if a significant decision was made.
- [ ] No known regressions.
- [ ] No `TODO` left behind without explicit approval recorded in the commit
      message or an ADR.

---

## 6. Documentation requirements

Documentation is part of the implementation, not an afterthought.

- The repository always contains: `README.md`, `CHANGELOG.md`, `CLAUDE.md`,
  `LICENSE`, `NOTICE`, and `docs/` (architecture, ADRs, and any user/dev/deploy
  docs).
- The README must be understandable by non-developers. Avoid jargon where a
  plain word works.
- Every significant feature ships with documentation in the same change.

---

## 7. Versioning

- **Semantic Versioning** (`MAJOR.MINOR.PATCH`).
- `0.x` while the public API is still settling. Breaking changes are allowed in
  `0.x` but must be called out in the CHANGELOG.
- A breaking change after `1.0.0` requires a major version bump and an ADR
  (§16).

---

## 8. Commit convention

**Conventional Commits.** Format: `type(scope): summary`.

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `build`,
`ci`. Keep the summary in the imperative mood and explain the *why* in the body
when it is not obvious.

---

## 9. Code style

- Readable over clever. Small functions. Cohesive modules. No duplicated logic.
- Favor composition over inheritance.
- Type hints everywhere in Python. The domain is fully typed.
- Lint/format with `ruff`; type-check with `mypy` (added as the codebase grows).
- Prefer explicit code over magic; prefer the standard library over a new
  dependency (§12).

---

## 10. Performance goals

- Avoid premature optimization, but design algorithms with scalability in mind.
- Any algorithm with significant complexity must be documented (its model,
  complexity, and known limits). The optimization engine is the prime example.
- The engine must always return a *correct* answer; performance tuning never
  trades away optimality.

---

## 11. Security rules

- Never hardcode secrets. Never commit credentials or `.env`.
- Always validate inputs at the boundary (API request schemas). Never trust
  user input.
- Avoid unsafe defaults. Fail closed.
- Run the container as a non-root user.

---

## 12. Dependency policy

- Never add a dependency without justification. Prefer the standard library.
- Every new dependency must be explained (in the commit body and, if
  significant, an ADR): what it does, why nothing simpler suffices, and its
  license.
- Avoid heavyweight frameworks where a small library or stdlib will do.
- Pin/track versions and keep them in the lockfile / `pyproject.toml`.

Current core runtime dependencies and why:
- **ortools** — the exact CP-SAT solver. This is the engine; it is the reason
  the project can promise provable optimality.
- **fastapi** + **uvicorn** — typed REST API with automatic OpenAPI docs and
  input validation.
- **pydantic** — input validation and the shared data model.

---

## 13. Configuration, environment variables, and secrets

- Configuration via environment variables, documented in `docs/configuration`
  (or the README until that grows). Provide an `.env.example`.
- Secrets only via environment / mounted files — never baked into the image,
  never committed.
- v0 has no secrets (no auth, no database). Keep it that way until a feature
  genuinely needs one, then document it here.

---

## 14. Validation, logging, and error handling

- **Validation:** all external input is validated by Pydantic schemas at the API
  boundary. Domain functions may assume validated input but still guard their
  own invariants.
- **Errors:** return clear, typed errors. An infeasible problem is a normal,
  explainable result — not a crash. An un-provable optimum is reported
  explicitly, never silently approximated.
- **Logging:** structured and concise. No secrets in logs. (Introduced as the
  app grows; v0 keeps logging minimal.)

---

## 15. Rules for creating new modules / adding abstractions

- A new module must be cohesive and have a single clear responsibility.
- Do not add an abstraction (port/interface/plugin system) until a **second**
  concrete implementation exists or is imminent. Document the extraction in an
  ADR when it happens.
- Platform-specific code (e.g., an AliExpress importer) goes in an adapter and
  maps external data to the canonical model. It never enters `domain/`.

---

## 16. Rules for breaking changes

- A breaking change to the public API or data model requires: an ADR explaining
  why, a CHANGELOG entry under a clear "Changed"/"Removed" heading, and a
  version bump per §7.

---

## 17. Architecture Decision Records (ADRs)

- Every significant architectural decision is recorded as an ADR in
  `docs/architecture/adr/`, numbered sequentially (MADR-style: context,
  decision, consequences).
- Never make a major architectural decision without creating or updating an ADR.

---

## 18. CHANGELOG rules

- Maintain `CHANGELOG.md` in **Keep a Changelog** format.
- Every meaningful change gets an entry under `Unreleased`, grouped by Added /
  Changed / Fixed / Removed / Deprecated / Security.
- On release, move `Unreleased` items under the new version with a date.

---

## 19. README rules

- Update the README whenever user-facing behaviour, setup, or usage changes.
- Keep it friendly to non-developers: what it does, how to run it, how to use
  it — before any deep technical detail.

---

## 20. Docker rules

- Docker first: the supported way to run the app is `docker compose up`.
- Multi-stage build, slim pinned base image, non-root user, healthcheck.
- The image is self-contained and offline: no network access required at
  runtime.

---

## 21. Rules for the optimization engine

- **Exact only.** Use OR-Tools CP-SAT (or another exact solver behind the same
  contract). No heuristics, no metaheuristics, no approximations.
- **Integer cents only.** No floating-point money anywhere in the model.
- **Prove or refuse.** Report `PROVEN_OPTIMAL`, `INFEASIBLE`, or `UNPROVEN`.
  Never present an unproven solution as the answer.
- **Explainable.** Every result explains itself: which orders, which coupons
  applied and why, what each split achieved, and the savings versus the naive
  single-order baseline.
- **Platform-agnostic.** The engine consumes only the canonical model
  (products, coupons, settings). No shop-specific logic.
- Document the model (variables, constraints, objective, symmetry breaking) and
  its complexity.

---

## 22. AI collaboration rules

- Do not guess. Do not invent requirements.
- Stop and ask when a human decision is genuinely required and architecturally
  significant; otherwise choose the best default, document it, and continue.
- Always explain important trade-offs. When proposing alternatives, state the
  pros and cons clearly.

---

## 23. Decision-making process

1. Is the decision architecturally significant or hard to reverse? → Propose
   options with trade-offs and get a human decision; record an ADR.
2. Is it a local, reversible choice? → Pick the best default, note it briefly,
   continue.
3. Record significant decisions as ADRs so they are never re-litigated.

---

## 24. Rules for future contributors

- Read this document first. It is the contract.
- Keep the domain pure and the engine exact.
- Add tests with every change. Make regressions easy to catch.
- Update docs in the same change as the code.
- When in doubt, prefer the simplest design that keeps the architecture open to
  the documented future direction.
