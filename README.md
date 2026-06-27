# 🛒 Cart Optimizer

**Find the cheapest way to split your online shopping into separate orders.**

When you buy a lot of items online, putting them all in one order isn't always
the cheapest option. Coupons need a minimum spend. Some countries add customs
fees above a certain order value. Shipping rules differ. Working out the best way
to split everything by hand is fiddly and error-prone.

Cart Optimizer does it for you — and it does it **exactly**. It doesn't guess or
estimate. It finds the *mathematically proven cheapest* legal way to split your
cart, and explains the result in plain language.

> First built for AliExpress orders, but the engine itself knows nothing about
> any specific shop — it works for any cart you type in.

---

## What it can do today (v0)

- Enter your **products** (name, price, store, quantity, and who they're for).
- Enter your **coupons** (e.g. "$5 off when you spend $50", or a store-specific
  deal).
- Set **basic rules**: a customs cap per order, flat shipping, and a
  free-shipping threshold.
- Get the **provably optimal split** into orders — with a clear explanation of
  *why* it split things the way it did and how much you saved.

It runs entirely on your own machine. Nothing is sent to the internet, and there
are no accounts or logins.

---

## Run it (the easy way: Docker)

You need [Docker](https://docs.docker.com/get-docker/) installed. Then, from the
project folder:

```bash
docker compose -f docker/docker-compose.yml up --build
```

Now open **http://localhost:8000** in your browser. That's it.

To stop it, press `Ctrl+C` (or run `docker compose -f docker/docker-compose.yml down`).

---

## How to use it

1. Open http://localhost:8000.
2. Fill in your **Settings** (currency, and optionally a customs cap, shipping,
   or free-shipping threshold). Leave fields blank to ignore them.
3. Add your **Products**.
4. Add any **Coupons** you have.
5. Click **⚡ Optimize**.

You'll see the recommended orders, what to pay for each, the coupons used, your
total savings, and a short explanation. A green **PROVEN OPTIMAL** badge means
the answer is mathematically the best possible. (If a problem is ever too large
to prove in time, it says so honestly instead of guessing.)

---

## For developers

### Run locally without Docker

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
uvicorn cart_optimizer.api:app --reload
# open http://127.0.0.1:8000
```

### Run the tests

```bash
pytest
```

### The API

Interactive API docs are served at **http://localhost:8000/docs**.

The core endpoint is `POST /api/v1/optimize`. All money is in **integer cents**.

```bash
curl -s -X POST http://localhost:8000/api/v1/optimize \
  -H 'Content-Type: application/json' \
  -d '{
    "products": [
      {"name": "Drone",   "unit_price_cents": 9500},
      {"name": "Battery", "unit_price_cents": 4000, "store": "GadgetStore"},
      {"name": "Charger", "unit_price_cents": 4000, "store": "GadgetStore"}
    ],
    "coupons": [
      {"name": "$10 off $90", "threshold_cents": 9000, "discount_cents": 1000}
    ],
    "settings": {"currency": "USD", "max_order_value_cents": 10000}
  }'
```

### How the optimization works

It uses **Google OR-Tools CP-SAT**, an exact constraint solver that *proves*
optimality — no heuristics, no approximation. The full model (variables,
constraints, objective, complexity) is documented in
[`engine.py`](src/cart_optimizer/domain/optimization/engine.py) and in the
[architecture docs](docs/architecture/overview.md).

### Project layout

```
src/cart_optimizer/
  domain/         # pure logic: data model, money, the optimization engine
  application/    # use-cases (optimize_cart)
  api/            # FastAPI REST API + the Web UI
  web/static/     # the single-page Web UI
docs/architecture/  # overview + Architecture Decision Records (ADRs)
tests/            # the test suite
```

The development rules and conventions live in
[CLAUDE.md](CLAUDE.md), and significant decisions are recorded as
[ADRs](docs/architecture/adr/).

---

## License

Licensed under the **Apache License 2.0** — you may use, modify, and self-host
it freely, provided you keep the attribution (see [LICENSE](LICENSE) and
[NOTICE](NOTICE)). See [ADR-0004](docs/architecture/adr/0004-license-apache-2.0.md)
for why.
