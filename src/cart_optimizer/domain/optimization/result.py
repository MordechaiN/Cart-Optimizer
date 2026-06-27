"""Result types returned by the optimization engine.

The result is designed to be *explainable*: it does not just say "here is the
answer", it says which orders to place, which coupons to use where, what each
choice saved, and whether the answer is provably optimal.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field

from cart_optimizer.domain.models import Product


class OptimizationStatus(str, Enum):
    """The proof status of a result. The engine never disguises one as another."""

    PROVEN_OPTIMAL = "PROVEN_OPTIMAL"
    """A globally optimal legal solution was found and proven optimal."""

    INFEASIBLE = "INFEASIBLE"
    """No legal solution exists under the given constraints."""

    UNPROVEN = "UNPROVEN"
    """A solution was found but optimality could not be proven in the time
    budget. It is reported as-is and must NOT be treated as optimal."""


class AppliedCoupon(BaseModel):
    """A coupon used on a particular order, with the saving it produced."""

    name: str
    scope: str
    store: Optional[str] = None
    qualifying_cents: int = Field(
        ..., description="The spend the threshold was measured against, in cents."
    )
    threshold_cents: int
    discount_cents: int


class OrderResult(BaseModel):
    """A single order in the optimal split."""

    index: int
    products: list[Product]
    subtotal_cents: int
    shipping_cents: int
    applied_coupons: list[AppliedCoupon] = Field(default_factory=list)
    discount_cents: int = Field(
        0, description="Total discount applied to this order, in cents."
    )

    @property
    def total_cents(self) -> int:
        return self.subtotal_cents + self.shipping_cents - self.discount_cents


class UserShare(BaseModel):
    """Per-user breakdown for group orders (informational in v0)."""

    user: str
    items_subtotal_cents: int = Field(
        ..., description="Face value of this user's items, in cents."
    )


class OptimizationResult(BaseModel):
    """The full, explainable answer."""

    status: OptimizationStatus
    currency: str = "USD"

    orders: list[OrderResult] = Field(default_factory=list)

    subtotal_cents: int = 0
    shipping_cents: int = 0
    discount_cents: int = 0
    total_cents: int = 0

    baseline_total_cents: Optional[int] = Field(
        None,
        description=(
            "Cost of the naive single-order baseline (everything in one order), "
            "or None if a single order is not legal (e.g. exceeds the customs cap)."
        ),
    )
    savings_vs_baseline_cents: Optional[int] = None

    user_shares: list[UserShare] = Field(default_factory=list)

    explanation: list[str] = Field(
        default_factory=list,
        description="Human-readable, ordered explanation of the result.",
    )

    solver_wall_time_seconds: float = 0.0
