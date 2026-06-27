"""Tests for the exact optimization engine.

Each test fixes a small problem whose optimum is known by hand, then checks the
engine reaches it and proves optimality.
"""

from cart_optimizer.domain.models import (
    Coupon,
    OptimizationRequest,
    Product,
    Settings,
)
from cart_optimizer.domain.optimization import OptimizationStatus, optimize


def _req(products, coupons=None, **settings):
    return OptimizationRequest(
        products=products,
        coupons=coupons or [],
        settings=Settings(**settings),
    )


def test_no_constraints_single_order():
    result = optimize(
        _req([Product(name="A", unit_price_cents=1000),
              Product(name="B", unit_price_cents=2000)])
    )
    assert result.status is OptimizationStatus.PROVEN_OPTIMAL
    assert len(result.orders) == 1
    assert result.total_cents == 3000
    assert result.discount_cents == 0
    assert result.shipping_cents == 0


def test_customs_cap_forces_split():
    result = optimize(
        _req(
            [Product(name=n, unit_price_cents=4000) for n in ("A", "B", "C")],
            max_order_value_cents=10000,
        )
    )
    assert result.status is OptimizationStatus.PROVEN_OPTIMAL
    assert len(result.orders) == 2  # 12000 total, cap 10000 -> at least two orders
    assert all(o.subtotal_cents <= 10000 for o in result.orders)
    assert result.total_cents == 12000
    # A single combined order is illegal under the cap, so there is no baseline.
    assert result.baseline_total_cents is None
    assert result.savings_vs_baseline_cents is None


def test_order_coupon_applied():
    result = optimize(
        _req(
            [Product(name="A", unit_price_cents=6000),
             Product(name="B", unit_price_cents=3000)],
            [Coupon(name="$10 off $50", threshold_cents=5000, discount_cents=1000)],
        )
    )
    assert result.status is OptimizationStatus.PROVEN_OPTIMAL
    assert result.discount_cents == 1000
    assert result.total_cents == 8000


def test_store_coupon_counts_only_its_store():
    # Order subtotal is 6000, but the S1-only coupon needs 3500 from S1 alone,
    # and S1 only has 3000 -> it must NOT apply.
    result = optimize(
        _req(
            [Product(name="A", unit_price_cents=3000, store="S1"),
             Product(name="B", unit_price_cents=3000, store="S2")],
            [Coupon(name="S1 deal", scope="store", store="S1",
                    threshold_cents=3500, discount_cents=500)],
        )
    )
    assert result.status is OptimizationStatus.PROVEN_OPTIMAL
    assert result.discount_cents == 0


def test_store_coupon_qualifies():
    result = optimize(
        _req(
            [Product(name="A", unit_price_cents=3000, store="S1"),
             Product(name="B", unit_price_cents=3000, store="S2")],
            [Coupon(name="S1 deal", scope="store", store="S1",
                    threshold_cents=2500, discount_cents=500)],
        )
    )
    assert result.status is OptimizationStatus.PROVEN_OPTIMAL
    assert result.discount_cents == 500


def test_cap_and_coupon_choose_qualifying_split():
    # A alone (9500) qualifies a 9000-threshold coupon; B and C cannot join A
    # without breaching the 10000 cap. The engine must isolate A to keep the
    # coupon AND respect the cap.
    result = optimize(
        _req(
            [Product(name="A", unit_price_cents=9500),
             Product(name="B", unit_price_cents=4000),
             Product(name="C", unit_price_cents=4000)],
            [Coupon(name="$10 off $90", threshold_cents=9000, discount_cents=1000)],
            max_order_value_cents=10000,
        )
    )
    assert result.status is OptimizationStatus.PROVEN_OPTIMAL
    assert result.discount_cents == 1000
    assert result.total_cents == 16500
    assert all(o.subtotal_cents <= 10000 for o in result.orders)


def test_infeasible_when_item_exceeds_cap():
    result = optimize(
        _req([Product(name="Pricey", unit_price_cents=20000)],
             max_order_value_cents=10000)
    )
    assert result.status is OptimizationStatus.INFEASIBLE
    assert result.orders == []
    assert any("cap" in line.lower() for line in result.explanation)


def test_shipping_prefers_fewer_orders():
    result = optimize(
        _req([Product(name="A", unit_price_cents=1000),
              Product(name="B", unit_price_cents=1000)],
             shipping_flat_cents=500)
    )
    assert result.status is OptimizationStatus.PROVEN_OPTIMAL
    assert len(result.orders) == 1
    assert result.shipping_cents == 500
    assert result.total_cents == 2500


def test_free_shipping_threshold():
    result = optimize(
        _req([Product(name="A", unit_price_cents=6000)],
             shipping_flat_cents=500, free_shipping_threshold_cents=5000)
    )
    assert result.status is OptimizationStatus.PROVEN_OPTIMAL
    assert result.shipping_cents == 0
    assert result.total_cents == 6000


def test_no_minimum_coupon_applies_to_a_real_order():
    # A "no minimum" coupon (threshold 0) must attach to an actual order and be
    # reflected in the result, not float off onto an empty order.
    result = optimize(
        _req(
            [Product(name="A", unit_price_cents=1000)],
            [Coupon(name="$5 off, no minimum", threshold_cents=0, discount_cents=500)],
        )
    )
    assert result.status is OptimizationStatus.PROVEN_OPTIMAL
    assert len(result.orders) == 1
    assert result.orders[0].applied_coupons  # the coupon is attributed to the order
    assert result.discount_cents == 500
    assert result.total_cents == 500


def test_discount_never_makes_total_negative():
    # Discount exceeds the order value: you pay 0, never a negative amount, and
    # the reported discount is capped at the order value.
    result = optimize(
        _req(
            [Product(name="Cheap", unit_price_cents=200)],
            [Coupon(name="$5 off, no minimum", threshold_cents=0, discount_cents=500)],
        )
    )
    assert result.status is OptimizationStatus.PROVEN_OPTIMAL
    assert result.total_cents == 0
    assert result.discount_cents == 200
    assert all(o.total_cents >= 0 for o in result.orders)


def test_user_shares_reported():
    result = optimize(
        _req([Product(name="A", unit_price_cents=1000, owner="alice"),
              Product(name="B", unit_price_cents=2000, owner="bob"),
              Product(name="C", unit_price_cents=500, owner="alice")])
    )
    shares = {s.user: s.items_subtotal_cents for s in result.user_shares}
    assert shares == {"alice": 1500, "bob": 2000}
