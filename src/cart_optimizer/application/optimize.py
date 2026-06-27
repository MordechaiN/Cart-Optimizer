"""The optimize-cart use-case.

This is intentionally thin in v0: it is the single entry point that both the API
and any future CLI call, so there is one source of truth for "optimize a cart".
Validation lives in the request model; the maths lives in the engine.
"""

from __future__ import annotations

from cart_optimizer.domain.models import OptimizationRequest
from cart_optimizer.domain.optimization import OptimizationResult, optimize


def optimize_cart(request: OptimizationRequest) -> OptimizationResult:
    """Return the provably optimal split for a cart."""
    return optimize(request)
