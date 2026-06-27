"""Validation tests for the request model (the security boundary)."""

import pytest
from pydantic import ValidationError

from cart_optimizer.domain.models import (
    MAX_PRODUCTS,
    Coupon,
    OptimizationRequest,
    Product,
    Settings,
)


def _products(n):
    return [Product(name=f"P{i}", unit_price_cents=100) for i in range(n)]


def test_rejects_too_many_products():
    with pytest.raises(ValidationError):
        OptimizationRequest(products=_products(MAX_PRODUCTS + 1))


def test_accepts_max_products():
    req = OptimizationRequest(products=_products(MAX_PRODUCTS))
    assert len(req.products) == MAX_PRODUCTS


def test_rejects_absurd_price():
    with pytest.raises(ValidationError):
        Product(name="X", unit_price_cents=10**15)


def test_rejects_excessive_quantity():
    with pytest.raises(ValidationError):
        Product(name="X", unit_price_cents=100, quantity=10**9)


def test_rejects_oversized_solver_time_limit():
    with pytest.raises(ValidationError):
        Settings(solver_time_limit_seconds=10_000)


def test_store_coupon_requires_store():
    with pytest.raises(ValidationError):
        Coupon(name="bad", scope="store", threshold_cents=100, discount_cents=50)


def test_negative_price_rejected():
    with pytest.raises(ValidationError):
        Product(name="X", unit_price_cents=-1)
