# User Guide

Cart Optimizer finds the cheapest legal way to split your shopping cart into
separate orders. Everything happens on **one screen** — no steps to click
through. This guide is a quick tour. No prior knowledge needed.

Open the app in your browser (for a local run, http://localhost:8000).

## The screen at a glance

From top to bottom:

1. **Settings** (small, collapsible) — currency and optional limits.
2. **Products** — the main area; add everything in your cart.
3. **Coupons** — any discounts you have.
4. **Live summary** — counts and totals that update as you type.
5. **Results** — appears here after you optimize.

A bar pinned to the bottom always shows your running subtotal and the big
**Optimize** button, so you can run it at any time.

## Products (the important part)

Add each item as a row:

- **Product**, **Store**, **Unit price**, **Qty**.
- Items from the same store should use the same store name — the field suggests
  stores you've already typed. This matters for store-specific coupons.

It's built for speed:

- **Add product**, or just press **Enter** in a row to add the next one.
- **Arrow Up / Down** moves between rows.
- **Duplicate** copies a similar item; **Delete** removes it.
- The **include toggle** on each row leaves an item out of the calculation
  without deleting it.

Sharing a cart with others? Turn on *"These items are for different people"* to
tag each item with a name.

Use **Load example** to see how it works, or **Clear all** to start fresh.

## Coupons

Just another list. For each coupon:

- A **name** to recognise it.
- **Applies to** — *Whole order* or *A specific store*.
- **Min. spend to unlock** and **Discount**.

Coupons are optional — skip the section if you have none.

## Settings

Click the Settings card to expand it:

- **Currency**.
- **Customs limit per order** *(optional)* — keep each order at or below this to
  avoid import fees.
- **Shipping per order** and **Free shipping over** *(optional)*.

Leave optional fields blank to ignore them.

## Optimize and read the results

Press **Optimize** (always available at the bottom). Results appear right below
your inputs:

- **You pay**, **Before discounts**, and **You save**.
- **Each order** to place, what it costs, and which coupons it uses.
- **Why this plan** — a plain-language explanation, and whether the answer is
  **Proven optimal**.

Change anything and press **Optimize again** — it recomputes in place. If no
legal split exists (for example, an item costs more than your customs limit), the
app says so clearly rather than guessing.

## Language, theme, and saved work

- **Language**: switch between English and Hebrew (fully right-to-left) from the
  top bar.
- **Theme**: toggle light/dark next to it.
- **Saved automatically**: your entries live in your browser, so refreshing won't
  lose your work. No accounts, nothing uploaded.
