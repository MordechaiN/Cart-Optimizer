from fastapi.testclient import TestClient

from cart_optimizer.api import app

client = TestClient(app)


def test_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_optimize_endpoint():
    payload = {
        "products": [
            {"name": "A", "unit_price_cents": 6000},
            {"name": "B", "unit_price_cents": 3000},
        ],
        "coupons": [
            {"name": "$10 off $50", "threshold_cents": 5000, "discount_cents": 1000}
        ],
        "settings": {"currency": "USD"},
    }
    response = client.post("/api/v1/optimize", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "PROVEN_OPTIMAL"
    assert body["total_cents"] == 8000
    assert body["discount_cents"] == 1000
    assert body["explanation"]
    # Per-order total must be serialized (the Web UI relies on it).
    order = body["orders"][0]
    assert "total_cents" in order
    assert order["total_cents"] == order["subtotal_cents"] + order["shipping_cents"] - order["discount_cents"]


def test_optimize_rejects_empty_cart():
    response = client.post("/api/v1/optimize", json={"products": []})
    assert response.status_code == 422


def test_optimize_rejects_store_coupon_without_matching_product():
    payload = {
        "products": [{"name": "A", "unit_price_cents": 1000, "store": "S1"}],
        "coupons": [
            {
                "name": "bad",
                "scope": "store",
                "store": "S2",
                "threshold_cents": 100,
                "discount_cents": 50,
            }
        ],
    }
    response = client.post("/api/v1/optimize", json=payload)
    assert response.status_code == 422


def test_optimize_rejects_oversized_cart():
    payload = {
        "products": [
            {"name": f"P{i}", "unit_price_cents": 100} for i in range(201)
        ]
    }
    response = client.post("/api/v1/optimize", json=payload)
    assert response.status_code == 422


def test_index_served():
    response = client.get("/")
    assert response.status_code == 200
    assert "Cart Optimizer" in response.text
    # The UI references its split-out assets; make sure the markup points at them.
    for asset in ("styles.css", "i18n.js", "app.js"):
        assert asset in response.text


def test_static_assets_served():
    # The redesigned UI is split into CSS/JS files; all must ship in the image
    # and be served by the static mount.
    for path, snippet in [
        ("/static/styles.css", "Cart Optimizer"),
        ("/static/i18n.js", "I18n"),
        ("/static/app.js", "optimize"),
    ]:
        response = client.get(path)
        assert response.status_code == 200, path
        assert snippet in response.text
