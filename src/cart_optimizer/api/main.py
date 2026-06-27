"""FastAPI application: the REST API plus the static Web UI.

v0 is deliberately stateless: there is no database. The client sends the whole
problem (products, coupons, settings) to ``POST /api/v1/optimize`` and gets the
optimal split back. This keeps the app trivial to self-host and reason about.
"""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from cart_optimizer import __version__
from cart_optimizer.application import optimize_cart
from cart_optimizer.domain.models import OptimizationRequest
from cart_optimizer.domain.optimization import OptimizationResult

_STATIC_DIR = Path(__file__).resolve().parent.parent / "web" / "static"

app = FastAPI(
    title="Cart Optimizer",
    version=__version__,
    summary="Find the mathematically optimal way to split a shopping cart.",
    description=(
        "Cart Optimizer computes the provably cheapest legal way to split a "
        "cart into multiple orders, respecting coupons and customs limits. "
        "It never approximates: results are proven optimal or reported as such."
    ),
)


@app.get("/api/v1/health", tags=["system"])
def health() -> dict[str, str]:
    """Liveness/readiness probe."""
    return {"status": "ok", "version": __version__}


@app.post("/api/v1/optimize", response_model=OptimizationResult, tags=["optimization"])
def optimize_endpoint(request: OptimizationRequest) -> OptimizationResult:
    """Compute the optimal split for a cart.

    The request is validated against the schema; the response includes the
    proof status, the orders to place, the savings, and a plain-language
    explanation.
    """
    return optimize_cart(request)


@app.get("/", include_in_schema=False)
def index() -> FileResponse:
    """Serve the minimal Web UI."""
    return FileResponse(_STATIC_DIR / "index.html")


# Serve any other static assets (kept minimal for v0).
if _STATIC_DIR.is_dir():
    app.mount("/static", StaticFiles(directory=_STATIC_DIR), name="static")
