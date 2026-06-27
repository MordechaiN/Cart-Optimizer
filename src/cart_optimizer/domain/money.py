"""Exact money handling.

All money in Cart Optimizer is stored and computed as **integer minor units**
(e.g. cents, agorot). We never use floating-point for money, because the
project promises exact, provably optimal answers and floats silently round.

This module only contains presentation helpers. The arithmetic that matters
happens on plain ``int`` cents inside the optimization engine.
"""

from __future__ import annotations

# Minor units per major unit. The vast majority of supported currencies use 2
# decimal places. Currencies with a different exponent (e.g. JPY=0) can be
# added here when they are actually needed; v0 keeps it simple and documented.
_DEFAULT_MINOR_UNITS = 100


def format_money(cents: int, currency: str = "USD") -> str:
    """Format integer minor units as a human-readable string.

    >>> format_money(1250, "USD")
    '12.50 USD'
    >>> format_money(-500, "EUR")
    '-5.00 EUR'
    """
    sign = "-" if cents < 0 else ""
    value = abs(cents)
    major, minor = divmod(value, _DEFAULT_MINOR_UNITS)
    return f"{sign}{major}.{minor:02d} {currency}"
