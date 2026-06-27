# Configuration

Cart Optimizer v0 is intentionally simple to configure. It is **stateless**:
there is no database and there are no secrets. There are two kinds of settings.

## 1. Server settings (environment variables)

These control how the server runs. An [`.env.example`](../.env.example) is
provided.

| Variable   | Default   | Meaning                                  |
|------------|-----------|------------------------------------------|
| `APP_HOST` | `0.0.0.0` | Interface the server binds to.           |
| `APP_PORT` | `8000`    | Port the server listens on.              |

With Docker Compose, `APP_PORT` also chooses the published host port.

## 2. Optimization settings (per request)

These are part of each optimization request (the `settings` object), not global
configuration. The Web UI exposes them as the "Settings" panel. All money is in
**integer cents**.

| Field                            | Default | Meaning |
|----------------------------------|---------|---------|
| `currency`                       | `USD`   | Currency label used in the output. |
| `max_order_value_cents`          | `null`  | Customs/de-minimis cap: no order may exceed this subtotal. `null` disables it. |
| `shipping_flat_cents`            | `0`     | Flat shipping charged per non-empty order. |
| `free_shipping_threshold_cents`  | `null`  | An order at/above this subtotal ships free. `null` disables it. |
| `max_orders`                     | `null`  | Upper bound on the number of orders. `null` = as many as there are products. |
| `solver_time_limit_seconds`      | `10`    | Time budget before the solver reports `UNPROVEN` instead of guessing. |

## Input limits (the safety boundary)

To keep requests small and the solver fast and within safe integer range, the
API rejects oversized input (HTTP 422). These limits suit manual data entry:

| Limit                       | Value |
|-----------------------------|-------|
| Products per request        | 200 |
| Coupons per request         | 100 |
| Users per request           | 100 |
| Quantity per product        | 10,000 |
| Any single amount (price, discount, shipping) | 1,000,000.00 |
| `solver_time_limit_seconds` | 60 |

These are defined in `cart_optimizer.domain.models` and can be revisited (with a
CHANGELOG entry) if a real need appears.
