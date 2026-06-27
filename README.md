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

## What it can do today

- A clean, **guided step-by-step interface** — add products and coupons,
  duplicate or toggle items, and review before optimizing.
- Enter your **coupons** in plain language (whole-order or store-specific).
- Set **basic rules**: a customs limit per order, flat shipping, and a
  free-shipping threshold.
- Get the **provably optimal split** into orders, with a results page that shows
  what you pay, how much you saved, every order, the coupons used, and *why* this
  is the best plan.
- **English and Hebrew** with full right-to-left layout, **light/dark** themes,
  and your work auto-saved in the browser.

It runs entirely on your own machine. Nothing is sent to the internet, and there
are no accounts or logins.

---

## Run it (the easy way: Docker)

You need [Docker](https://docs.docker.com/get-docker/) installed. Then, from the
project folder:

```bash
docker compose up --build
```

Now open **http://localhost:8000** in your browser. That's it.

To stop it, press `Ctrl+C` (or run `docker compose down`).

> Self-hosting with Portainer? See **[Deployment with Portainer](#deployment-with-portainer)**
> below for a no-SSH, "Pull and redeploy" workflow.

---

## How to use it

The app guides you through a few simple steps — no manual required:

1. **Settings** — pick your currency and, optionally, a customs limit, shipping
   fee, or free-shipping threshold. Anything optional can be left blank.
2. **Products** — add the items in your cart (name, store, price, quantity). You
   can duplicate a row, or toggle an item out of the calculation without
   deleting it.
3. **Coupons** — add any discounts in plain language ("applies to the whole
   order" or "a specific store"). Coupons are optional.
4. **Review** — a quick summary of your cart.
5. **Optimize** — and you're done.

The **Results** page shows what you'll pay, how much you saved, each order to
place, which coupons were used where, and a plain-language explanation of *why*
this is the best plan. A green **Proven optimal** badge means it's mathematically
the cheapest legal option. (If a problem is ever too large to prove in time, it
says so honestly instead of guessing.)

**Languages & theme.** Switch between **English** and **Hebrew** (with full
right-to-left layout) from the language button in the top bar, and toggle
light/dark mode next to it. Your entries are saved in your browser, so a refresh
won't lose your work.

See the [user guide](docs/user-guide.md) for a walkthrough.

---

## Deployment with Portainer

Cart Optimizer is designed to deploy as a **Portainer Stack straight from this
Git repository**, so updating it never requires SSH or manual Docker commands.

The primary `docker-compose.yml` lives at the repository root and builds the
image from `docker/Dockerfile` using the repo root as the build context — which
is exactly what Portainer expects.

### One-time setup

1. In Portainer, go to **Stacks → Add stack → Repository**.
2. **Repository URL:** your fork/clone of this repo
   (e.g. `https://github.com/mordechain/cart-optimizer`).
3. **Repository reference:** `refs/heads/main`.
4. **Compose path:** `docker-compose.yml` (the default — it's at the root).
5. *(Optional)* Under **Environment variables**, set `APP_PORT` if you want a
   host port other than `8000`.
6. Click **Deploy the stack**. Portainer clones the repo, builds the image, and
   starts the container. Open `http://<your-server>:8000`.

### Updating (the everyday workflow)

No SSH, no manual Docker commands:

1. **Commit and push** your changes to GitHub (`main`).
2. Open **Portainer → Stacks →** your stack.
3. Click **Pull and redeploy**.

Portainer pulls the latest commit, **rebuilds the image** from the Dockerfile,
and recreates the container. (Optionally enable Portainer's **automatic updates**
— polling or a webhook — to skip even step 2–3.)

### Notes

- The image is **self-contained and offline**: it bundles the optimization
  engine and the Web UI (verified at build time). No internet access is needed
  at runtime.
- It runs **read-only, non-root**, with `no-new-privileges`. There is no
  authentication in v0, so keep it on your trusted network or behind your own
  reverse proxy / VPN.
- Because the image is built on the server, the first deploy (and each rebuild)
  downloads the solver and may take a few minutes.

See [`docs/deployment.md`](docs/deployment.md) for more detail.

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
