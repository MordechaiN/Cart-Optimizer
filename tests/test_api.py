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


def test_index_served():
    response = client.get("/")
    assert response.status_code == 200
    assert "Cart Optimizer" in response.text
