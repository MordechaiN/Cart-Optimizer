# Development

This guide is for working on Cart Optimizer itself. Read
[CLAUDE.md](../CLAUDE.md) first — it is the project's constitution.

## Setup

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
```

Requires Python 3.11+.

## Run the app locally (no Docker)

```bash
uvicorn cart_optimizer.api:app --reload
# Web UI:   http://127.0.0.1:8000
# API docs: http://127.0.0.1:8000/docs
```

## Quality gates

```bash
pytest            # tests (unit + API integration; no Docker needed)
ruff check src tests   # lint
ruff format src tests  # format
mypy src          # type-check (strict)
```

All of these run without Docker. Docker is a deployment target, not a local
execution requirement — see [deployment.md](deployment.md).

## Project layout

```
src/cart_optimizer/
  domain/              # pure logic — no I/O, no web framework
    money.py           # exact integer-cent helpers
    models.py          # canonical model: Product, Coupon, Settings, request
    optimization/
      engine.py        # the CP-SAT model (the heart of the project)
      result.py        # result/explanation types
  application/         # use-cases (optimize_cart)
  api/                 # FastAPI app: REST + serves the Web UI
  web/static/          # the single-page Web UI
docs/architecture/     # overview + ADRs
tests/                 # unit + integration tests
```

## Where to make changes

- **The optimization model** lives in
  `domain/optimization/engine.py`. Its module docstring documents the variables,
  constraints, objective, symmetry breaking, and complexity. Keep it pure and
  exact; add a test for every behavioural change.
- **The data model** lives in `domain/models.py`. Changing it is a public-API
  change — update the CHANGELOG and, if significant, add an ADR.
- **New significant decisions** get an ADR in `docs/architecture/adr/`.

## Definition of Done

See [CLAUDE.md §5](../CLAUDE.md). In short: implemented, tested, documented
(README/CHANGELOG/ADR as applicable), no known regressions, no stray `TODO`s.
