"""Exact cart-splitting optimization with OR-Tools CP-SAT.

The model
=========
We decide how to partition the cart's products into orders so as to minimise
total cost. Because every product is always bought, the sum of item prices is a
constant; the only things the split changes are **shipping** (paid per order)
and **coupon discounts** (each coupon usable on at most one order). So:

    minimise   sum(shipping per order)  -  sum(coupon discounts)
    subject to constraints (customs cap, coupon eligibility, ...)

Decision variables
-------------------
- ``x[p, o] in {0,1}``    product ``p`` is placed in order ``o``.
- ``use[c, o] in {0,1}``  coupon ``c`` is applied to order ``o``.
- ``active[o] in {0,1}``  order ``o`` contains at least one product.
- ``S[o]``                subtotal of order ``o`` (cents).

Constraints
-----------
- Each product is in exactly one order.
- Optional customs cap: ``S[o] <= max_order_value`` for every order.
- Coupon eligibility: if ``use[c, o] = 1`` then the qualifying spend of coupon
  ``c`` in order ``o`` is at least its threshold. For an order-scoped coupon the
  qualifying spend is ``S[o]``; for a store-scoped coupon it is the subtotal of
  that store's items within the order.
- Each coupon is used on at most one order.
- **Symmetry breaking**: orders are interchangeable, so we force product ``p``
  to live in one of orders ``0..p`` only, and require orders to fill from index
  0 upward. Every distinct partition still has exactly one legal representation,
  so no optimal solution is lost, but the search space shrinks dramatically.

Objective
---------
Minimise ``sum(shipping) - sum(discounts)`` in integer cents. CP-SAT proves
global optimality. Among equally-priced solutions we prefer the one with the
**fewest orders** via a strictly-secondary (lexicographic) term, so the engine
never splits more than the cost actually requires.

Complexity
----------
Cart splitting (set partitioning with cost) is NP-hard in general. CP-SAT solves
it exactly via branch-and-bound and proves optimality. For the manual-entry
carts this tool targets (tens of products), it solves in well under a second.
The model is bounded by ``max_orders`` (default: number of products). If the
solver cannot prove optimality within the time budget, the result is reported as
``UNPROVEN`` rather than guessed.
"""

from __future__ import annotations

from ortools.sat.python import cp_model

from cart_optimizer.domain.models import Coupon, OptimizationRequest, Product
from cart_optimizer.domain.money import format_money
from cart_optimizer.domain.optimization.result import (
    AppliedCoupon,
    OptimizationResult,
    OptimizationStatus,
    OrderResult,
    UserShare,
)


def _qualifying_products(products: list[Product], coupon: Coupon) -> list[int]:
    """Indices of products whose spend counts towards ``coupon``'s threshold."""
    if coupon.scope == "store":
        return [i for i, p in enumerate(products) if p.store == coupon.store]
    return list(range(len(products)))


def optimize(request: OptimizationRequest) -> OptimizationResult:
    """Compute the provably optimal split for ``request``."""
    products = request.products
    coupons = request.coupons
    settings = request.settings

    n = len(products)
    line = [p.line_total_cents for p in products]
    total_subtotal = sum(line)

    # An order is never needed beyond one-per-product. Respect an optional bound.
    num_orders = min(settings.max_orders or n, n)

    model = cp_model.CpModel()

    # x[p, o] = product p in order o. Symmetry breaking: p only in orders 0..p.
    x: dict[tuple[int, int], cp_model.IntVar] = {}
    for p in range(n):
        for o in range(min(p + 1, num_orders)):
            x[p, o] = model.NewBoolVar(f"x_{p}_{o}")
        model.AddExactlyOne(x[p, o] for o in range(min(p + 1, num_orders)))

    def x_in(p: int, o: int) -> cp_model.IntVar | int:
        """x[p, o], or the literal 0 when that placement is forbidden."""
        return x.get((p, o), 0)

    # active[o] and subtotal S[o].
    active = [model.NewBoolVar(f"active_{o}") for o in range(num_orders)]
    subtotal = [
        model.NewIntVar(0, total_subtotal, f"S_{o}") for o in range(num_orders)
    ]
    for o in range(num_orders):
        member_vars = [x[p, o] for p in range(n) if (p, o) in x]
        model.Add(subtotal[o] == sum(line[p] * x_in(p, o) for p in range(n)))
        # active iff at least one product is placed in this order.
        if member_vars:
            model.AddMaxEquality(active[o], member_vars)
        else:
            model.Add(active[o] == 0)
        # Fill orders from index 0 upward (further symmetry breaking).
        if o > 0:
            model.Add(active[o] <= active[o - 1])

    # Customs / de-minimis cap.
    if settings.max_order_value_cents is not None:
        for o in range(num_orders):
            model.Add(subtotal[o] <= settings.max_order_value_cents)

    # Coupons.
    use: dict[tuple[int, int], cp_model.IntVar] = {}
    discount_terms: list[cp_model.LinearExpr] = []
    for ci, coupon in enumerate(coupons):
        members = _qualifying_products(products, coupon)
        for o in range(num_orders):
            u = model.NewBoolVar(f"use_{ci}_{o}")
            use[ci, o] = u
            qualifying = sum(line[p] * x_in(p, o) for p in members)
            # If the coupon is applied here, the qualifying spend must reach the
            # threshold. (When u = 0 this constraint is not enforced.)
            model.Add(qualifying >= coupon.threshold_cents).OnlyEnforceIf(u)
            discount_terms.append(coupon.discount_cents * u)
        model.AddAtMostOne(use[ci, o] for o in range(num_orders))

    # Shipping (flat per active order, free above an optional threshold).
    shipping_terms: list[cp_model.LinearExpr] = []
    pays_shipping: list[cp_model.IntVar | int] = [0] * num_orders
    if settings.shipping_flat_cents > 0:
        free_threshold = settings.free_shipping_threshold_cents
        for o in range(num_orders):
            if free_threshold is None:
                pays_shipping[o] = active[o]
            else:
                below = model.NewBoolVar(f"below_free_{o}")
                model.Add(subtotal[o] <= free_threshold - 1).OnlyEnforceIf(below)
                model.Add(subtotal[o] >= free_threshold).OnlyEnforceIf(below.Not())
                pays = model.NewBoolVar(f"pays_{o}")
                model.AddBoolAnd([active[o], below]).OnlyEnforceIf(pays)
                model.AddBoolOr([active[o].Not(), below.Not()]).OnlyEnforceIf(
                    pays.Not()
                )
                pays_shipping[o] = pays
            shipping_terms.append(settings.shipping_flat_cents * pays_shipping[o])

    # Objective. The primary cost is shipping minus discounts (in cents). Among
    # solutions of equal cost we prefer FEWER orders, since extra orders are pure
    # hassle for the user. We encode this as a lexicographic objective: scale the
    # primary cost by (n + 1) so a single cent of real saving always outweighs
    # the order-count term (which is at most n). This never trades away a genuine
    # saving — it only breaks ties.
    primary_cost = sum(shipping_terms) - sum(discount_terms)
    order_count = sum(active)
    model.Minimize((n + 1) * primary_cost + order_count)

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = settings.solver_time_limit_seconds
    solver.parameters.num_search_workers = 8
    status = solver.Solve(model)

    if status == cp_model.INFEASIBLE:
        return _infeasible_result(request)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        # No solution at all within budget (rare for these sizes).
        return _infeasible_result(request, unknown=True)

    proven = status == cp_model.OPTIMAL
    return _build_result(
        request=request,
        solver=solver,
        x=x,
        use=use,
        subtotal=subtotal,
        pays_shipping=pays_shipping,
        num_orders=num_orders,
        proven=proven,
        wall_time=solver.WallTime(),
    )


def _build_result(
    *,
    request: OptimizationRequest,
    solver: cp_model.CpSolver,
    x: dict[tuple[int, int], cp_model.IntVar],
    use: dict[tuple[int, int], cp_model.IntVar],
    subtotal: list[cp_model.IntVar],
    pays_shipping: list[cp_model.IntVar | int],
    num_orders: int,
    proven: bool,
    wall_time: float,
) -> OptimizationResult:
    products = request.products
    coupons = request.coupons
    settings = request.settings
    currency = settings.currency
    n = len(products)

    orders: list[OrderResult] = []
    for o in range(num_orders):
        members = [
            p for p in range(n) if (p, o) in x and solver.Value(x[p, o]) == 1
        ]
        if not members:
            continue

        order_products = [products[p] for p in members]
        order_subtotal = int(solver.Value(subtotal[o]))

        applied: list[AppliedCoupon] = []
        discount_total = 0
        for ci, coupon in enumerate(coupons):
            if solver.Value(use[ci, o]) == 1:
                qualifying = sum(
                    products[p].line_total_cents
                    for p in members
                    if coupon.scope == "order" or products[p].store == coupon.store
                )
                applied.append(
                    AppliedCoupon(
                        name=coupon.name,
                        scope=coupon.scope,
                        store=coupon.store,
                        qualifying_cents=qualifying,
                        threshold_cents=coupon.threshold_cents,
                        discount_cents=coupon.discount_cents,
                    )
                )
                discount_total += coupon.discount_cents

        ship = pays_shipping[o]
        shipping_cents = (
            settings.shipping_flat_cents
            if isinstance(ship, cp_model.IntVar) and solver.Value(ship) == 1
            else 0
        )

        orders.append(
            OrderResult(
                index=len(orders) + 1,
                products=order_products,
                subtotal_cents=order_subtotal,
                shipping_cents=shipping_cents,
                applied_coupons=applied,
                discount_cents=discount_total,
            )
        )

    subtotal_cents = sum(o.subtotal_cents for o in orders)
    shipping_cents = sum(o.shipping_cents for o in orders)
    discount_cents = sum(o.discount_cents for o in orders)
    total_cents = subtotal_cents + shipping_cents - discount_cents

    baseline = _single_order_baseline(request)
    savings = None if baseline is None else baseline - total_cents

    result = OptimizationResult(
        status=(
            OptimizationStatus.PROVEN_OPTIMAL if proven else OptimizationStatus.UNPROVEN
        ),
        currency=currency,
        orders=orders,
        subtotal_cents=subtotal_cents,
        shipping_cents=shipping_cents,
        discount_cents=discount_cents,
        total_cents=total_cents,
        baseline_total_cents=baseline,
        savings_vs_baseline_cents=savings,
        user_shares=_user_shares(request),
        solver_wall_time_seconds=round(wall_time, 4),
    )
    result.explanation = _explain(request, result)
    return result


def _single_order_baseline(request: OptimizationRequest) -> int | None:
    """Cost of putting everything in one order, or None if that is not legal."""
    products = request.products
    settings = request.settings
    total = sum(p.line_total_cents for p in products)

    if (
        settings.max_order_value_cents is not None
        and total > settings.max_order_value_cents
    ):
        return None  # A single order would breach the customs cap.

    shipping = 0
    if settings.shipping_flat_cents > 0:
        free = settings.free_shipping_threshold_cents
        if free is None or total < free:
            shipping = settings.shipping_flat_cents

    # Best discount achievable with everything in one order: every coupon whose
    # qualifying spend meets its threshold can be applied (each is independent).
    discount = 0
    for coupon in request.coupons:
        qualifying = sum(
            p.line_total_cents
            for p in products
            if coupon.scope == "order" or p.store == coupon.store
        )
        if qualifying >= coupon.threshold_cents:
            discount += coupon.discount_cents

    return total + shipping - discount


def _user_shares(request: OptimizationRequest) -> list[UserShare]:
    totals: dict[str, int] = {}
    for product in request.products:
        if product.owner:
            totals[product.owner] = totals.get(product.owner, 0) + product.line_total_cents
    return [
        UserShare(user=user, items_subtotal_cents=value)
        for user, value in sorted(totals.items())
    ]


def _explain(request: OptimizationRequest, result: OptimizationResult) -> list[str]:
    currency = result.currency
    lines: list[str] = []

    if result.status == OptimizationStatus.PROVEN_OPTIMAL:
        lines.append("This split is mathematically proven to be the cheapest legal option.")
    else:
        lines.append(
            "A solution was found but could NOT be proven optimal within the time "
            "budget. Treat it as a best-effort answer, not the guaranteed optimum."
        )

    lines.append(
        f"Plan: place {len(result.orders)} "
        f"{'order' if len(result.orders) == 1 else 'separate orders'}."
    )

    for order in result.orders:
        names = ", ".join(p.name for p in order.products)
        parts = [
            f"Order {order.index}: {names} "
            f"(subtotal {format_money(order.subtotal_cents, currency)}"
        ]
        if order.shipping_cents:
            parts.append(f", shipping {format_money(order.shipping_cents, currency)}")
        for coupon in order.applied_coupons:
            parts.append(
                f", coupon '{coupon.name}' saves "
                f"{format_money(coupon.discount_cents, currency)}"
            )
        parts.append(f") -> pay {format_money(order.total_cents, currency)}")
        lines.append("".join(parts))

    if request.settings.max_order_value_cents is not None and len(result.orders) > 1:
        cap = format_money(request.settings.max_order_value_cents, currency)
        lines.append(
            f"Orders were split partly to keep each one at or below the {cap} "
            "customs cap."
        )

    if result.savings_vs_baseline_cents is not None:
        if result.savings_vs_baseline_cents > 0:
            lines.append(
                f"This saves {format_money(result.savings_vs_baseline_cents, currency)} "
                "compared with placing everything as one order."
            )
        else:
            lines.append("A single combined order is already optimal here.")
    elif request.settings.max_order_value_cents is not None:
        lines.append(
            "A single combined order is not allowed (it would exceed the customs "
            "cap), so splitting is required."
        )

    lines.append(f"Total to pay: {format_money(result.total_cents, currency)}.")
    return lines


def _infeasible_result(
    request: OptimizationRequest, unknown: bool = False
) -> OptimizationResult:
    settings = request.settings
    currency = settings.currency
    explanation = []
    if unknown:
        explanation.append(
            "The solver could not find any legal solution within the time budget."
        )
    else:
        explanation.append("No legal way to split this cart exists under the given rules.")
        if settings.max_order_value_cents is not None:
            offenders = [
                p.name
                for p in request.products
                if p.line_total_cents > settings.max_order_value_cents
            ]
            if offenders:
                cap = format_money(settings.max_order_value_cents, currency)
                explanation.append(
                    f"These items alone exceed the {cap} customs cap and cannot fit "
                    f"in any order: {', '.join(offenders)}."
                )
    return OptimizationResult(
        status=OptimizationStatus.INFEASIBLE,
        currency=currency,
        explanation=explanation,
    )
