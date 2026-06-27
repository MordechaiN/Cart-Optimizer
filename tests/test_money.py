from cart_optimizer.domain.money import format_money


def test_format_basic():
    assert format_money(1250, "USD") == "12.50 USD"


def test_format_zero_padding():
    assert format_money(5, "USD") == "0.05 USD"


def test_format_negative():
    assert format_money(-500, "EUR") == "-5.00 EUR"
