"""Canonical, platform-agnostic data model.

These types are the *only* thing the optimization engine knows about. A real
shop (AliExpress, etc.) is mapped onto these types by an adapter; the engine
never sees shop-specific concepts.

All monetary fields are integer **minor units** (cents). See ``money.py``.
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator

CouponScope = Literal["order", "store"]


class Product(BaseModel):
    """A single line in the cart.

    ``unit_price_cents`` is the price of one unit; ``quantity`` units are bought
    together and always end up in the same order (we do not split a line).
    """

    name: str = Field(..., min_length=1, description="Human-readable product name.")
    unit_price_cents: int = Field(..., ge=0, description="Price per unit, in cents.")
    quantity: int = Field(1, ge=1, description="Number of units.")
    store: str = Field("", description="Seller/store identifier. Empty = unspecified.")
    owner: Optional[str] = Field(
        None, description="Which user this product belongs to (group orders)."
    )

    @property
    def line_total_cents(self) -> int:
        """Total cost of this line (unit price x quantity)."""
        return self.unit_price_cents * self.quantity


class Coupon(BaseModel):
    """A discount that applies to one order if a spending threshold is met.

    - ``scope="order"``: the threshold is measured against the whole order.
    - ``scope="store"``: the threshold is measured against the items of a
      specific store within the order; ``store`` must be set.

    A coupon can be applied to at most one order. The engine decides which order
    (if any) maximises the total saving.
    """

    name: str = Field(..., min_length=1, description="Human-readable coupon name.")
    scope: CouponScope = Field("order", description="'order' or 'store'.")
    store: Optional[str] = Field(
        None, description="Required when scope='store': which store it applies to."
    )
    threshold_cents: int = Field(
        ..., ge=0, description="Minimum qualifying spend to use the coupon, in cents."
    )
    discount_cents: int = Field(
        ..., ge=1, description="Amount subtracted when the coupon is applied, in cents."
    )

    @model_validator(mode="after")
    def _check_store_scope(self) -> "Coupon":
        if self.scope == "store" and not self.store:
            raise ValueError("A store-scoped coupon must specify 'store'.")
        return self


class Settings(BaseModel):
    """Optimization settings (the 'basic settings' for v0)."""

    currency: str = Field("USD", min_length=1, description="ISO currency code.")
    max_order_value_cents: Optional[int] = Field(
        None,
        ge=1,
        description=(
            "Customs / de-minimis cap: no single order may exceed this subtotal. "
            "None disables the cap."
        ),
    )
    shipping_flat_cents: int = Field(
        0, ge=0, description="Flat shipping cost charged per non-empty order."
    )
    free_shipping_threshold_cents: Optional[int] = Field(
        None,
        ge=0,
        description="An order at or above this subtotal ships free. None disables.",
    )
    max_orders: Optional[int] = Field(
        None,
        ge=1,
        description=(
            "Upper bound on the number of orders. None lets the engine use as many "
            "as there are products (never more is ever needed)."
        ),
    )
    solver_time_limit_seconds: float = Field(
        10.0,
        gt=0,
        description="Wall-clock budget for the solver before it reports UNPROVEN.",
    )


class OptimizationRequest(BaseModel):
    """A complete optimization problem: the cart plus its rules and settings."""

    products: list[Product] = Field(..., min_length=1)
    coupons: list[Coupon] = Field(default_factory=list)
    users: list[str] = Field(
        default_factory=list,
        description="Known user names (for group orders). Informational in v0.",
    )
    settings: Settings = Field(default_factory=Settings)

    @model_validator(mode="after")
    def _check_store_coupons_match_products(self) -> "OptimizationRequest":
        stores = {p.store for p in self.products}
        for coupon in self.coupons:
            if coupon.scope == "store" and coupon.store not in stores:
                raise ValueError(
                    f"Coupon '{coupon.name}' targets store '{coupon.store}', "
                    "but no product belongs to that store."
                )
        return self
