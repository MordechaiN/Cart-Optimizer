# User Guide

Cart Optimizer finds the cheapest legal way to split your shopping cart into
separate orders. This guide walks through the app. No prior knowledge needed.

Open the app in your browser (for a local run, http://localhost:8000).

## The steps

A progress bar at the top shows where you are. You can click a previous step at
any time to go back and change something.

### 1. Settings

- **Currency** — used to show all amounts.
- **Customs limit per order** *(optional)* — keep each order at or below this to
  avoid import fees. Leave blank to ignore.
- **Shipping per order** *(optional)* — a flat fee charged for each separate
  order.
- **Free shipping over** *(optional)* — orders at or above this ship free.

### 2. Products

Add each item in your cart:

- **Product** — its name.
- **Store** — the seller. Items from the same store should use the same store
  name (the field suggests stores you've already typed). This matters for
  store-specific coupons.
- **Unit price** and **Qty**.

Handy actions on each item:

- **Duplicate** to copy a similar item.
- **Delete** to remove it.
- The **Include in optimization** switch lets you leave an item out of the
  calculation without deleting it.

If several people are sharing one cart, turn on *"These items are for different
people"* and tag each item with a name.

Use **Load example** to see how it works, or **Clear all** to start fresh.

### 3. Coupons (optional)

Add any discounts you have:

- **Coupon** — a name to recognise it.
- **Applies to** — *Whole order* or *A specific store*.
- **Min. spend to unlock** — what you must spend for it to apply.
- **Discount** — how much it takes off.

### 4. Review

A quick summary of your products, coupons, settings, and cart total.

### 5. Optimize → Results

Press **Optimize my cart**. The results page shows:

- **You pay** — the final total.
- **Before discounts** and **You save** — how much the coupons saved.
- **Each order** to place, what it costs, and which coupons it uses.
- **Why this plan** — a plain-language explanation, and whether the answer is
  **Proven optimal**.

If no legal split is possible (for example, an item costs more than your customs
limit), the app says so clearly rather than guessing.

## Language, theme, and saved work

- **Language**: switch between English and Hebrew from the top bar. Hebrew is
  shown fully right-to-left.
- **Theme**: toggle light/dark next to the language button.
- **Saved automatically**: your entries are kept in your browser, so refreshing
  the page won't lose your work. There are no accounts and nothing is uploaded.
