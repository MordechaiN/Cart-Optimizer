<div align="center">

# 🛒 Cart Optimizer

### **The smartest way to split your online shopping and save money.**

Find the **cheapest possible way** to split your cart into multiple orders while automatically applying coupons, shipping rules and customs limits.

**Fast • Accurate • Offline • Open Source**

---

[🚀 Quick Start](#-quick-start) •
[✨ Features](#-features) •
[📖 How It Works](#-how-it-works) •
[🐳 Docker](#-run-with-docker) •
[👨‍💻 Developers](#-for-developers)

</div>

---

# 💡 Why Cart Optimizer?

When shopping online, the cheapest solution is **not always** putting everything into one order.

Sometimes you save money by splitting your cart because of:

- 🎟️ Discount coupons
- 🚚 Free shipping thresholds
- 📦 Shipping costs
- 💰 Customs limits
- 🏪 Store-specific promotions

Finding the best combination manually quickly becomes impossible.

**Cart Optimizer calculates every valid combination and finds the mathematically cheapest solution.**

No guessing.

No approximations.

No trial and error.

---

# ✨ Features

## 🛍️ Shopping

- Add unlimited products
- Support for multiple stores
- Product quantities
- Enable/disable products instantly

## 🎟️ Coupons

- Global coupons
- Store-specific coupons
- Multiple coupon support
- Automatic coupon selection

## ⚙️ Rules

- Customs limit
- Shipping cost
- Free shipping threshold
- Multiple currencies

## 📊 Results

- Cheapest possible order split
- Total savings
- Coupon usage
- Order summary
- Proof that the solution is optimal

## 🌍 User Experience

- 🇬🇧 English
- 🇮🇱 Hebrew (RTL)
- 🌞 Light mode
- 🌙 Dark mode
- 💾 Auto-save
- 🔒 100% Offline

---

# 📖 How It Works

Using Cart Optimizer is simple.

### ① Add your products

Enter:

- Product name
- Store
- Price
- Quantity

---

### ② Add your coupons

Examples:

- $10 off $90
- 15% off Store A
- $5 off any order

---

### ③ Configure optional rules

You can set:

- Shipping cost
- Free shipping threshold
- Customs limit

Or simply leave them empty.

---

### ④ Click **Optimize**

Cart Optimizer automatically calculates the best possible solution.

---

### ⑤ View your optimized orders

You'll instantly see:

- ✅ Which products belong in each order
- ✅ Which coupons should be used
- ✅ Total amount you'll pay
- ✅ Total money saved
- ✅ Why this solution is the best one

---

# 🧠 Powered by Mathematics

Cart Optimizer uses **Google OR-Tools CP-SAT**, one of the world's most powerful optimization solvers.

Unlike many shopping calculators, Cart Optimizer does **not** estimate.

It **proves** that the result is the cheapest legal solution.

---

# 🚀 Quick Start

## Using Docker (Recommended)

```bash
docker compose up --build
```

Open your browser:

```
http://localhost:8000
```

Stop the application:

```bash
docker compose down
```

---

# 🐳 Run with Docker

Requirements:

- Docker
- Docker Compose

Then simply run:

```bash
docker compose up --build
```

That's it.

No database.

No configuration.

No cloud account.

---

# 👨‍💻 For Developers

Clone the repository:

```bash
git clone https://github.com/MordechaiN/Cart-Optimizer.git
cd Cart-Optimizer
```

Create a virtual environment:

```bash
python -m venv .venv
```

Install dependencies:

```bash
pip install -e ".[dev]"
```

Run the application:

```bash
uvicorn cart_optimizer.api:app --reload
```

Open:

```
http://127.0.0.1:8000
```

---

## Run Tests

```bash
pytest
```

---

## API Documentation

```
http://localhost:8000/docs
```

---

# 🔒 Privacy

Your shopping data belongs to you.

Cart Optimizer runs entirely on your own computer or server.

- ✅ No account required
- ✅ No tracking
- ✅ No analytics
- ✅ No cloud processing
- ✅ No data leaves your device

---

# 📂 Project Structure

```
src/
├── application/
├── api/
├── domain/
└── web/

docs/
tests/
docker/
```

---

# 🤝 Contributing

Contributions are welcome!

If you have an idea, found a bug, or want to improve Cart Optimizer:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request

---

# 📜 License

This project is licensed under the **Apache License 2.0**.

See the **LICENSE** file for more information.

---

<div align="center">

### ⭐ If Cart Optimizer saved you money, consider giving the project a star!

Made with ❤️ for smart online shoppers.

</div>
