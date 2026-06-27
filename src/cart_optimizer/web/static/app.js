/* Cart Optimizer — application logic.
 *
 * A small, dependency-free single-page app: a guided multi-step wizard over the
 * stateless /api/v1/optimize endpoint. State lives in one object, is saved to
 * localStorage, and is rendered with plain DOM. All user-facing text goes
 * through the i18n layer; the results explanation is composed client-side from
 * the structured result so it is fully localized without touching the API.
 */
(function () {
  "use strict";

  const I18n = window.I18n;
  const t = window.t;

  /* ----------------------------------------------------------------- Icons */
  const ICONS = {
    cart: '<circle cx="9" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/><path d="M2 3h3l2.4 12a1.6 1.6 0 0 0 1.6 1.3h8.2a1.6 1.6 0 0 0 1.6-1.3L21 7H6"/>',
    sliders: '<line x1="5" y1="21" x2="5" y2="14"/><line x1="5" y1="10" x2="5" y2="3"/><line x1="12" y1="21" x2="12" y2="13"/><line x1="12" y1="9" x2="12" y2="3"/><line x1="19" y1="21" x2="19" y2="16"/><line x1="19" y1="12" x2="19" y2="3"/><line x1="2" y1="14" x2="8" y2="14"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="16" y1="16" x2="22" y2="16"/>',
    package: '<path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    ticket: '<path d="M2 9a3 3 0 0 0 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 0 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 11v2"/><path d="M13 17v2"/>',
    sparkles: '<path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z"/><path d="M5 3v3"/><path d="M19 18v3"/><path d="M3.5 4.5h3"/><path d="M17.5 19.5h3"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.3 17.7-1.4 1.4"/><path d="m19.1 4.9-1.4 1.4"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    alert: '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    checkCircle: '<path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="m9 11 3 3L22 4"/>',
    store: '<path d="m2 7 1.5-3.5A1 1 0 0 1 4.4 3h15.2a1 1 0 0 1 .9.5L22 7"/><path d="M4 10v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V10"/><path d="M2 7h20v1a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  };
  function icon(name, cls) {
    return `<svg class="icon ${cls || ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
  }

  const STEP_ICONS = ["sliders", "package", "ticket", "check", "sparkles"];
  const STEPS = ["settings", "products", "coupons", "review", "results"];
  const CURRENCIES = ["USD", "EUR", "GBP", "ILS", "AUD", "CAD", "CHF", "SEK", "PLN", "BRL", "INR", "MXN", "ZAR", "NZD"];

  /* ----------------------------------------------------------------- State */
  function defaults() {
    return {
      step: 0,
      maxStep: 0,
      groupMode: false,
      settings: { currency: "USD", cap: "", shipping: "", freeShipping: "" },
      products: [],
      coupons: [],
      result: null,
    };
  }
  let state = loadState() || defaults();

  function loadState() {
    try {
      const raw = localStorage.getItem("co.state");
      if (!raw) return null;
      const s = JSON.parse(raw);
      s.result = null; // never trust a stale result
      s.step = Math.min(s.step || 0, 3);
      return Object.assign(defaults(), s);
    } catch (_) {
      return null;
    }
  }
  let saveTimer = null;
  function saveState(quiet) {
    try {
      const { result, ...persist } = state;
      localStorage.setItem("co.state", JSON.stringify(persist));
    } catch (_) { /* storage may be unavailable */ }
    if (!quiet) {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => toast(t("action.saved"), "check"), 700);
    }
  }

  /* --------------------------------------------------------------- Helpers */
  let _uid = 1;
  const uid = () => "id" + (_uid++) + Date.now().toString(36);
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function toCents(v) {
    if (v === "" || v === null || v === undefined) return null;
    const n = parseFloat(String(v).replace(",", "."));
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.round(n * 100);
  }
  function fmtMoney(cents) {
    const cur = state.settings.currency || "USD";
    try {
      return new Intl.NumberFormat(I18n.locale(), { style: "currency", currency: cur })
        .format((cents || 0) / 100);
    } catch (_) {
      return ((cents || 0) / 100).toFixed(2) + " " + cur;
    }
  }
  function currencySymbol(cur) {
    try {
      const parts = new Intl.NumberFormat(I18n.locale(), { style: "currency", currency: cur })
        .formatToParts(0);
      const p = parts.find((x) => x.type === "currency");
      return p ? p.value : cur;
    } catch (_) {
      return cur;
    }
  }
  const includedProducts = () => state.products.filter((p) => p.included);
  function stores() {
    const set = new Set();
    includedProducts().forEach((p) => { if (p.store && p.store.trim()) set.add(p.store.trim()); });
    return [...set];
  }

  /* --------------------------------------------------------------- Toast */
  let toastTimer = null;
  function toast(msg, ic) {
    const el = document.getElementById("toast");
    el.innerHTML = icon(ic || "info") + "<span>" + esc(msg) + "</span>";
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 1600);
  }

  /* --------------------------------------------------------------- Render */
  let pendingFocus = null;
  function render() {
    renderStepper();
    const panel = document.getElementById("panel");
    panel.innerHTML = PANELS[STEPS[state.step]]();
    if (pendingFocus) {
      const el = panel.querySelector(pendingFocus) || document.querySelector(pendingFocus);
      if (el) el.focus();
      pendingFocus = null;
    }
  }

  function renderStepper() {
    const wrap = document.getElementById("stepper");
    const html = STEPS.map((key, i) => {
      const cls = i === state.step ? "is-active" : i < state.step ? "is-done" : "is-todo";
      const reachable = i <= 3 || !!state.result;
      const dot = i < state.step ? icon("check") : String(i + 1);
      const bar = i < STEPS.length - 1
        ? `<span class="step-bar ${i < state.step ? "is-done" : ""}"></span>` : "";
      return `<button class="step ${cls}" data-action="goto" data-step="${i}" ${reachable ? "" : "disabled"} ${i === state.step ? 'aria-current="step"' : ""}>
          <span class="step-dot">${dot}</span>
          <span class="step-name">${esc(t("step." + key))}</span>
        </button>${bar}`;
    }).join("");
    wrap.innerHTML = html;
  }

  function panelHead(titleKey, subKey) {
    return `<div class="panel-head">
      <h2 id="panelHeading" tabindex="-1">${esc(t(titleKey))}</h2>
      <p class="panel-sub">${esc(t(subKey))}</p>
    </div>`;
  }
  function moneyField(labelKey, hintKey, field, value, optional) {
    const sym = esc(currencySymbol(state.settings.currency));
    return `<div class="field">
      <label>${esc(t(labelKey))}${optional ? ` <span class="optional-tag">· ${esc(t("common.optional") || "optional")}</span>` : ""}</label>
      <div class="input-money"><span class="cur">${sym}</span>
        <input class="input" type="number" inputmode="decimal" min="0" step="0.01"
          data-bind="${field}" value="${esc(value)}" placeholder="0.00" />
      </div>
      <span class="hint">${esc(t(hintKey))}</span>
    </div>`;
  }
  function navButtons(extra) {
    const back = state.step > 0
      ? `<button class="btn btn-secondary" data-action="back">${icon("chevronLeft", "icon-flip")}<span>${esc(t("action.back"))}</span></button>` : "";
    const next = `<button class="btn btn-primary" data-action="next"><span>${esc(t("action.next"))}</span>${icon("chevronRight", "icon-flip")}</button>`;
    return `<div class="wizard-nav">${back}<span class="spacer"></span>${extra || next}</div>`;
  }

  /* ----- Settings panel */
  function settingsPanel() {
    const s = state.settings;
    const options = CURRENCIES.map((c) =>
      `<option value="${c}" ${c === s.currency ? "selected" : ""}>${c} (${esc(currencySymbol(c))})</option>`).join("");
    return `<section class="panel">
      ${panelHead("settings.title", "settings.subtitle")}
      <div class="grid grid-2">
        <div class="field">
          <label>${esc(t("settings.currency"))}</label>
          <select class="select" data-bind="currency">${options}</select>
          <span class="hint">${esc(t("settings.currency.hint"))}</span>
        </div>
        ${moneyField("settings.cap", "settings.cap.hint", "cap", s.cap, true)}
        ${moneyField("settings.shipping", "settings.shipping.hint", "shipping", s.shipping, true)}
        ${moneyField("settings.freeShipping", "settings.freeShipping.hint", "freeShipping", s.freeShipping, true)}
      </div>
      ${navButtons()}
    </section>`;
  }

  /* ----- Products panel */
  function productRow(p) {
    const owner = state.groupMode
      ? `<div class="field"><label>${esc(t("products.col.owner"))}</label>
          <input class="input" data-pid="${p.id}" data-field="owner" value="${esc(p.owner)}"
            data-i18n-placeholder="products.owner.placeholder" placeholder="${esc(t("products.owner.placeholder"))}" /></div>` : "";
    const sym = esc(currencySymbol(state.settings.currency));
    return `<div class="item ${p.included ? "" : "is-excluded"}">
      <div class="item-grid product">
        <div class="field">
          <label>${esc(t("products.col.name"))}</label>
          <input class="input js-name" data-pid="${p.id}" data-field="name" value="${esc(p.name)}"
            placeholder="${esc(t("products.name.placeholder"))}" />
        </div>
        <div class="field">
          <label>${esc(t("products.col.store"))}</label>
          <input class="input" list="storeList" data-pid="${p.id}" data-field="store" value="${esc(p.store)}"
            placeholder="${esc(t("products.store.placeholder"))}" />
        </div>
        <div class="field">
          <label>${esc(t("products.col.price"))}</label>
          <div class="input-money"><span class="cur">${sym}</span>
            <input class="input" type="number" inputmode="decimal" min="0" step="0.01"
              data-pid="${p.id}" data-field="price" value="${esc(p.price)}" placeholder="0.00" /></div>
        </div>
        <div class="field">
          <label>${esc(t("products.col.qty"))}</label>
          <input class="input" type="number" inputmode="numeric" min="1" step="1"
            data-pid="${p.id}" data-field="qty" value="${esc(p.qty)}" />
        </div>
      </div>
      ${owner ? `<div class="grid" style="margin-block-start:var(--space-3)">${owner}</div>` : ""}
      <div class="item-foot">
        <label class="switch">
          <input type="checkbox" data-action="toggleInclude" data-pid="${p.id}" ${p.included ? "checked" : ""} />
          <span class="track"><span class="thumb"></span></span>
          <span>${esc(t("products.include"))}</span>
        </label>
        <div class="item-actions">
          <button class="btn-icon" data-action="dupProduct" data-pid="${p.id}" title="${esc(t("products.duplicate"))}" aria-label="${esc(t("products.duplicate"))}">${icon("copy")}</button>
          <button class="btn-icon is-danger" data-action="delProduct" data-pid="${p.id}" title="${esc(t("products.delete"))}" aria-label="${esc(t("products.delete"))}">${icon("trash")}</button>
        </div>
      </div>
    </div>`;
  }
  function productsPanel() {
    const list = state.products.length
      ? `<div class="items">${state.products.map(productRow).join("")}</div>`
      : emptyState("package", "products.empty.title", "products.empty.desc");
    const storeOpts = stores().map((s) => `<option value="${esc(s)}"></option>`).join("");
    return `<section class="panel">
      ${panelHead("products.title", "products.subtitle")}
      <datalist id="storeList">${storeOpts}</datalist>
      <label class="switch" style="margin-block-end:var(--space-4)">
        <input type="checkbox" data-action="toggleGroup" ${state.groupMode ? "checked" : ""} />
        <span class="track"><span class="thumb"></span></span>
        <span>${esc(t("products.groupToggle"))}</span>
      </label>
      ${list}
      <div class="toolbar">
        <button class="btn btn-secondary" data-action="addProduct">${icon("plus")}<span>${esc(t("products.add"))}</span></button>
        <span class="spacer"></span>
        <button class="btn btn-ghost" data-action="loadExample">${esc(t("action.loadExample"))}</button>
        <button class="btn btn-ghost" data-action="clearAll">${esc(t("action.clearAll"))}</button>
      </div>
      <div class="form-alert" id="formAlert">${icon("alert")}<span></span></div>
      ${navButtons()}
    </section>`;
  }

  /* ----- Coupons panel */
  function couponRow(c) {
    const storeField = c.scope === "store"
      ? `<div class="field">
          <label>${esc(t("coupons.col.store"))}</label>
          <select class="select" data-cid="${c.id}" data-field="store">
            <option value="">—</option>
            ${stores().map((s) => `<option value="${esc(s)}" ${s === c.store ? "selected" : ""}>${esc(s)}</option>`).join("")}
          </select>
        </div>`
      : `<div class="field"><label>&nbsp;</label><div class="hint" style="padding-block:11px">${esc(t("coupons.appliesTo.order"))}</div></div>`;
    const sym = esc(currencySymbol(state.settings.currency));
    return `<div class="item">
      <div class="field" style="margin-block-end:var(--space-3)">
        <label>${esc(t("coupons.col.name"))}</label>
        <input class="input js-name" data-cid="${c.id}" data-field="name" value="${esc(c.name)}"
          placeholder="${esc(t("coupons.name.placeholder"))}" />
      </div>
      <div class="field" style="margin-block-end:var(--space-3)">
        <label>${esc(t("coupons.col.appliesTo"))}</label>
        <div class="segmented" role="group">
          <button type="button" data-action="couponScope" data-cid="${c.id}" data-scope="order" aria-pressed="${c.scope === "order"}">${esc(t("coupons.appliesTo.order"))}</button>
          <button type="button" data-action="couponScope" data-cid="${c.id}" data-scope="store" aria-pressed="${c.scope === "store"}">${esc(t("coupons.appliesTo.store"))}</button>
        </div>
      </div>
      <div class="item-grid coupon">
        ${storeField}
        <div class="field">
          <label>${esc(t("coupons.col.minSpend"))}</label>
          <div class="input-money"><span class="cur">${sym}</span>
            <input class="input" type="number" inputmode="decimal" min="0" step="0.01"
              data-cid="${c.id}" data-field="minSpend" value="${esc(c.minSpend)}" placeholder="0.00" /></div>
          <span class="hint">${esc(t("coupons.minSpend.hint"))}</span>
        </div>
        <div class="field">
          <label>${esc(t("coupons.col.discount"))}</label>
          <div class="input-money"><span class="cur">${sym}</span>
            <input class="input" type="number" inputmode="decimal" min="0" step="0.01"
              data-cid="${c.id}" data-field="discount" value="${esc(c.discount)}" placeholder="0.00" /></div>
          <span class="hint">${esc(t("coupons.discount.hint"))}</span>
        </div>
        <div class="field" style="justify-content:flex-end">
          <button class="btn-icon is-danger" data-action="delCoupon" data-cid="${c.id}" title="${esc(t("coupons.delete"))}" aria-label="${esc(t("coupons.delete"))}">${icon("trash")}</button>
        </div>
      </div>
    </div>`;
  }
  function couponsPanel() {
    const list = state.coupons.length
      ? `<div class="items">${state.coupons.map(couponRow).join("")}</div>`
      : emptyState("ticket", "coupons.empty.title", "coupons.empty.desc");
    return `<section class="panel">
      ${panelHead("coupons.title", "coupons.subtitle")}
      ${list}
      <div class="toolbar">
        <button class="btn btn-secondary" data-action="addCoupon">${icon("plus")}<span>${esc(t("coupons.add"))}</span></button>
      </div>
      <div class="form-alert" id="formAlert">${icon("alert")}<span></span></div>
      ${navButtons()}
    </section>`;
  }

  /* ----- Review panel */
  function reviewPanel() {
    const incl = includedProducts();
    const cartTotal = incl.reduce((sum, p) => sum + (toCents(p.price) || 0) * (parseInt(p.qty) || 1), 0);
    const s = state.settings;
    const capLine = toCents(s.cap) != null ? t("review.cap", { amount: fmtMoney(toCents(s.cap)) }) : t("review.noCap");
    return `<section class="panel">
      ${panelHead("review.title", "review.subtitle")}
      <div class="review-grid">
        <div class="review-card">
          <h3>${esc(t("review.products"))}</h3>
          <div class="review-line"><span>${esc(t("review.itemsIncluded", { n: incl.length }))}</span></div>
          ${incl.slice(0, 6).map((p) => `<div class="review-line"><span>${esc(p.name || "—")}</span><span class="v">${fmtMoney((toCents(p.price) || 0) * (parseInt(p.qty) || 1))}</span></div>`).join("")}
          ${incl.length > 6 ? `<div class="review-line"><span class="hint">+ ${incl.length - 6}</span></div>` : ""}
        </div>
        <div class="review-card">
          <h3>${esc(t("review.coupons"))}</h3>
          ${state.coupons.length
            ? state.coupons.map((c) => `<div class="review-line"><span>${esc(c.name || "—")}</span><span class="v">−${fmtMoney(toCents(c.discount) || 0)}</span></div>`).join("")
            : `<div class="review-line"><span class="hint">${esc(t("review.none"))}</span></div>`}
        </div>
        <div class="review-card">
          <h3>${esc(t("review.settings"))}</h3>
          <div class="review-line"><span>${esc(t("settings.currency"))}</span><span class="v">${esc(s.currency)}</span></div>
          <div class="review-line"><span>${esc(capLine)}</span></div>
          ${toCents(s.shipping) ? `<div class="review-line"><span>${esc(t("settings.shipping"))}</span><span class="v">${fmtMoney(toCents(s.shipping))}</span></div>` : ""}
        </div>
      </div>
      <div class="review-total">
        <span class="hint">${esc(t("review.cartTotal"))}</span>
        <span class="amt">${fmtMoney(cartTotal)}</span>
      </div>
      <div class="form-alert" id="formAlert">${icon("alert")}<span></span></div>
      ${navButtons(`<button class="btn btn-primary btn-lg" data-action="optimize" id="optimizeBtn">${icon("sparkles")}<span>${esc(t("review.optimize"))}</span></button>`)}
    </section>`;
  }

  /* ----- Results panel */
  function statusBadge(status) {
    const map = {
      PROVEN_OPTIMAL: ["proven", "checkCircle", "results.status.proven"],
      UNPROVEN: ["unproven", "alert", "results.status.unproven"],
      INFEASIBLE: ["infeasible", "alert", "results.status.infeasible"],
    };
    const [cls, ic, key] = map[status] || map.INFEASIBLE;
    return `<span class="badge ${cls}">${icon(ic)}${esc(t(key))}</span>`;
  }
  function whyBullets(r) {
    const out = [];
    out.push(r.status === "PROVEN_OPTIMAL" ? t("why.proven") : t("why.unproven"));
    out.push(r.orders.length > 1 ? t("why.split", { n: r.orders.length }) : t("why.single"));
    r.orders.forEach((o) => {
      o.applied_coupons.forEach((c) => {
        out.push(t("why.coupon", { name: c.name, amount: fmtMoney(c.discount_cents), order: o.index }));
      });
    });
    const cap = toCents(state.settings.cap);
    if (cap != null && r.orders.length > 1) out.push(t("why.cap", { cap: fmtMoney(cap) }));
    if (r.baseline_total_cents == null && cap != null) {
      out.push(t("results.noBaselineNote"));
    } else if (r.savings_vs_baseline_cents != null && r.savings_vs_baseline_cents > 0) {
      out.push(t("why.savings", { amount: fmtMoney(r.savings_vs_baseline_cents) }));
    } else {
      out.push(t("why.alreadyOptimal"));
    }
    return out;
  }
  function orderCard(o) {
    const items = o.products.map((p) =>
      `<div class="order-item"><span>${esc(p.name)}${p.quantity > 1 ? ` <span class="q">× ${p.quantity}</span>` : ""}</span>
        <span>${fmtMoney(p.unit_price_cents * p.quantity)}</span></div>`).join("");
    const lines = [];
    lines.push(`<div class="order-line2"><span>${esc(t("results.subtotal"))}</span><span>${fmtMoney(o.subtotal_cents)}</span></div>`);
    if (o.shipping_cents) lines.push(`<div class="order-line2"><span>${esc(t("results.shipping"))}</span><span>${fmtMoney(o.shipping_cents)}</span></div>`);
    if (o.discount_cents) lines.push(`<div class="order-line2"><span>${esc(t("results.discount"))}</span><span>−${fmtMoney(o.discount_cents)}</span></div>`);
    const chips = o.applied_coupons.map((c) =>
      `<span class="coupon-chip">${icon("ticket")}${esc(c.name)} · −${fmtMoney(c.discount_cents)}</span>`).join(" ");
    return `<div class="order-card">
      <div class="order-head">
        <span class="order-title">${esc(t("results.order", { n: o.index }))}</span>
        <span class="order-pay"><div class="lbl">${esc(t("results.orderPay"))}</div><div class="amt">${fmtMoney(o.total_cents)}</div></span>
      </div>
      <div class="order-body">
        ${items}
        <div class="order-lines">${lines.join("")}</div>
        ${chips ? `<div>${chips}</div>` : ""}
      </div>
    </div>`;
  }
  function resultsPanel() {
    const r = state.result;
    if (!r) return `<section class="panel">${emptyState("sparkles", "results.title", "review.subtitle")}${navButtons("")}</section>`;

    const startOver = `<button class="btn btn-secondary" data-action="edit">${icon("chevronLeft", "icon-flip")}<span>${esc(t("results.edit"))}</span></button>`;

    if (r.status === "INFEASIBLE") {
      return `<section class="panel">
        <div class="results-head"><h2>${esc(t("results.title"))}</h2>${statusBadge(r.status)}</div>
        ${emptyState("alert", "results.status.infeasible", "results.infeasible.desc")}
        <div class="wizard-nav">${startOver}</div>
      </section>`;
    }

    const before = r.subtotal_cents + r.shipping_cents;
    const save = r.discount_cents;
    const stats = [
      `<div class="stat primary"><div class="stat-label">${esc(t("results.finalCost"))}</div><div class="stat-value">${fmtMoney(r.total_cents)}</div><div class="stat-sub">${esc(t(r.orders.length > 1 ? "results.split" : "results.single", { n: r.orders.length }))}</div></div>`,
      `<div class="stat"><div class="stat-label">${esc(t("results.originalCost"))}</div><div class="stat-value ${save ? "stat-strike" : ""}">${fmtMoney(before)}</div><div class="stat-sub">${esc(t("results.subtotal"))} + ${esc(t("results.shipping"))}</div></div>`,
    ];
    if (save > 0) {
      stats.push(`<div class="stat save"><div class="stat-label">${esc(t("results.youSave"))}</div><div class="stat-value">${fmtMoney(save)}</div><div class="stat-sub">${esc(t("coupons.title"))}</div></div>`);
    }
    return `<section class="panel">
      <div class="results-head"><h2 id="panelHeading" tabindex="-1">${esc(t("results.title"))}</h2>${statusBadge(r.status)}</div>
      <div class="hero" style="grid-template-columns:${save > 0 ? "1.2fr 1fr 1fr" : "1.4fr 1fr"}">${stats.join("")}</div>
      <div class="orders">${r.orders.map(orderCard).join("")}</div>
      <div class="why">
        <h3>${icon("info")}${esc(t("results.why"))}</h3>
        <ul>${whyBullets(r).map((b) => `<li><span class="tick">${icon("check")}</span><span>${esc(b)}</span></li>`).join("")}</ul>
      </div>
      <div class="wizard-nav">${startOver}<span class="spacer"></span>
        <button class="btn btn-ghost" data-action="clearAll">${esc(t("results.startOver"))}</button></div>
    </section>`;
  }

  function emptyState(ic, titleKey, descKey) {
    return `<div class="empty">
      <div class="empty-icon">${icon(ic)}</div>
      <div class="empty-title">${esc(t(titleKey))}</div>
      <div class="empty-desc">${esc(t(descKey))}</div>
    </div>`;
  }

  const PANELS = {
    settings: settingsPanel,
    products: productsPanel,
    coupons: couponsPanel,
    review: reviewPanel,
    results: resultsPanel,
  };

  /* --------------------------------------------------------------- Mutations */
  function addProduct(seed) {
    const p = Object.assign({ id: uid(), name: "", store: "", price: "", qty: 1, owner: "", included: true }, seed || {});
    state.products.push(p);
    return p;
  }
  function addCoupon(seed) {
    const c = Object.assign({ id: uid(), name: "", scope: "order", store: "", minSpend: "", discount: "" }, seed || {});
    state.coupons.push(c);
    return c;
  }
  function loadExample() {
    state.products = [];
    state.coupons = [];
    addProduct({ name: "Wireless earbuds", store: "AudioHub", price: "29.90", qty: 1 });
    addProduct({ name: "USB-C cable (2m)", store: "AudioHub", price: "6.50", qty: 2 });
    addProduct({ name: "Phone stand", store: "GadgetWorld", price: "12.00", qty: 1 });
    addCoupon({ name: t("coupons.name.placeholder"), scope: "order", minSpend: "50", discount: "5" });
    state.settings.cap = "";
    state.groupMode = false;
    state.result = null;
  }

  /* --------------------------------------------------------------- Validation */
  function showAlert(msgKey) {
    const a = document.getElementById("formAlert");
    if (!a) return;
    a.querySelector("span").textContent = t(msgKey);
    a.classList.add("show");
  }
  function markInvalid(selector) {
    const el = document.querySelector(selector);
    if (el) el.classList.add("is-invalid");
  }
  function validateProducts() {
    let ok = true;
    document.querySelectorAll(".is-invalid").forEach((e) => e.classList.remove("is-invalid"));
    if (includedProducts().length === 0) { showAlert("valid.atLeastOneIncluded"); return false; }
    includedProducts().forEach((p) => {
      if (!p.name.trim()) { ok = false; markInvalid(`[data-pid="${p.id}"][data-field="name"]`); }
      if (toCents(p.price) == null || toCents(p.price) === 0) { ok = false; markInvalid(`[data-pid="${p.id}"][data-field="price"]`); }
    });
    if (!ok) showAlert("valid.fixErrors");
    return ok;
  }
  function validateCoupons() {
    let ok = true;
    document.querySelectorAll(".is-invalid").forEach((e) => e.classList.remove("is-invalid"));
    const storeSet = new Set(stores());
    state.coupons.forEach((c) => {
      if (!c.name.trim()) { ok = false; markInvalid(`[data-cid="${c.id}"][data-field="name"]`); }
      if (toCents(c.discount) == null || toCents(c.discount) === 0) { ok = false; markInvalid(`[data-cid="${c.id}"][data-field="discount"]`); }
      if (c.scope === "store" && (!c.store || !storeSet.has(c.store))) { ok = false; markInvalid(`[data-cid="${c.id}"][data-field="store"]`); }
    });
    if (!ok) showAlert("valid.fixErrors");
    return ok;
  }
  function validateStep(step) {
    if (STEPS[step] === "products") return validateProducts();
    if (STEPS[step] === "coupons") return validateCoupons();
    return true;
  }

  /* --------------------------------------------------------------- Navigation */
  function goStep(i) {
    state.step = i;
    state.maxStep = Math.max(state.maxStep, i);
    pendingFocus = "#panelHeading";
    saveState(true);
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* --------------------------------------------------------------- Optimize */
  function buildPayload() {
    const products = includedProducts().map((p) => ({
      name: p.name.trim(),
      store: p.store.trim(),
      unit_price_cents: toCents(p.price) || 0,
      quantity: parseInt(p.qty) || 1,
      owner: state.groupMode && p.owner.trim() ? p.owner.trim() : null,
    }));
    const coupons = state.coupons.map((c) => ({
      name: c.name.trim(),
      scope: c.scope,
      store: c.scope === "store" ? (c.store.trim() || null) : null,
      threshold_cents: toCents(c.minSpend) || 0,
      discount_cents: toCents(c.discount) || 0,
    }));
    const s = state.settings;
    return {
      products,
      coupons,
      users: [],
      settings: {
        currency: s.currency,
        max_order_value_cents: toCents(s.cap),
        shipping_flat_cents: toCents(s.shipping) || 0,
        free_shipping_threshold_cents: toCents(s.freeShipping),
      },
    };
  }
  async function optimize() {
    // Validate every editable step; jump to the first with problems.
    for (let i = 1; i <= 2; i++) {
      if (!validateStepAt(i)) { goStep(i); setTimeout(() => validateStep(i), 0); return; }
    }
    const btn = document.getElementById("optimizeBtn");
    if (btn) { btn.disabled = true; btn.querySelector("span").textContent = t("review.optimizing"); }
    try {
      const res = await fetch("/api/v1/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(friendlyError(data), "alert");
        if (btn) { btn.disabled = false; btn.querySelector("span").textContent = t("review.optimize"); }
        return;
      }
      state.result = data;
      goStep(4);
    } catch (_) {
      toast(t("error.generic"), "alert");
      if (btn) { btn.disabled = false; btn.querySelector("span").textContent = t("review.optimize"); }
    }
  }
  // Validate a step's data without it being on screen (used before optimizing).
  function validateStepAt(step) {
    if (STEPS[step] === "products") {
      if (includedProducts().length === 0) return false;
      return includedProducts().every((p) => p.name.trim() && toCents(p.price));
    }
    if (STEPS[step] === "coupons") {
      const storeSet = new Set(stores());
      return state.coupons.every((c) =>
        c.name.trim() && toCents(c.discount) &&
        (c.scope !== "store" || (c.store && storeSet.has(c.store))));
    }
    return true;
  }
  function friendlyError(data) {
    try {
      const d = data.detail;
      if (Array.isArray(d) && d.length) return d[0].msg.replace(/^Value error,\s*/, "");
      if (typeof d === "string") return d;
    } catch (_) { /* ignore */ }
    return t("error.generic");
  }

  /* --------------------------------------------------------------- Events */
  function findById(list, id) { return list.find((x) => x.id === id); }

  document.addEventListener("input", (e) => {
    const el = e.target;
    if (el.dataset.bind) {
      state.settings[el.dataset.bind] = el.value;
      saveState();
    } else if (el.dataset.pid && el.dataset.field) {
      const p = findById(state.products, el.dataset.pid);
      if (p) { p[el.dataset.field] = el.value; saveState(); }
    } else if (el.dataset.cid && el.dataset.field) {
      const c = findById(state.coupons, el.dataset.cid);
      if (c) { c[el.dataset.field] = el.value; saveState(); }
    }
    if (el.dataset.bind === "currency") render(); // refresh currency symbols
  });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    const pid = btn.dataset.pid, cid = btn.dataset.cid;

    switch (action) {
      case "next":
        if (validateStep(state.step)) goStep(state.step + 1);
        break;
      case "back": goStep(state.step - 1); break;
      case "goto": {
        const i = parseInt(btn.dataset.step);
        if (i <= 3 || state.result) goStep(i);
        break;
      }
      case "edit": goStep(1); break;
      case "addProduct": {
        const p = addProduct();
        saveState(true);
        pendingFocus = `[data-pid="${p.id}"][data-field="name"]`;
        render();
        break;
      }
      case "dupProduct": {
        const p = findById(state.products, pid);
        if (p) { const copy = addProduct(Object.assign({}, p, { id: uid() })); state.products.splice(state.products.indexOf(copy), 1); state.products.splice(state.products.indexOf(p) + 1, 0, copy); saveState(); render(); }
        break;
      }
      case "delProduct":
        state.products = state.products.filter((p) => p.id !== pid);
        saveState(); render();
        break;
      case "toggleInclude": {
        const p = findById(state.products, pid);
        if (p) { p.included = !p.included; saveState(); render(); }
        break;
      }
      case "toggleGroup":
        state.groupMode = !state.groupMode; saveState(); render();
        break;
      case "addCoupon": {
        const c = addCoupon();
        saveState(true);
        pendingFocus = `[data-cid="${c.id}"][data-field="name"]`;
        render();
        break;
      }
      case "delCoupon":
        state.coupons = state.coupons.filter((c) => c.id !== cid);
        saveState(); render();
        break;
      case "couponScope": {
        const c = findById(state.coupons, cid);
        if (c) { c.scope = btn.dataset.scope; saveState(); render(); }
        break;
      }
      case "loadExample": loadExample(); saveState(); render(); toast(t("action.loadExample"), "check"); break;
      case "clearAll":
        if (confirm(t("action.confirmClear"))) { state = defaults(); saveState(); goStep(0); }
        break;
      case "optimize": optimize(); break;
    }
  });

  // Prevent the number-input scroll-wheel value change footgun.
  document.addEventListener("wheel", (e) => {
    if (document.activeElement === e.target && e.target.type === "number") e.target.blur();
  }, { passive: true });

  // Re-render dynamic content (and reformat money) on language change.
  document.addEventListener("languagechange", () => render());

  /* --------------------------------------------------------------- Theme + lang menu */
  function initTheme() {
    const saved = localStorage.getItem("co.theme");
    const theme = saved || "dark";
    document.documentElement.setAttribute("data-theme", theme);
    updateThemeIcon(theme);
  }
  function updateThemeIcon(theme) {
    const b = document.getElementById("themeBtn");
    if (b) b.innerHTML = icon(theme === "dark" ? "sun" : "moon");
  }
  document.getElementById("themeBtn").addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("co.theme", next);
    updateThemeIcon(next);
  });

  const langBtn = document.getElementById("langBtn");
  const langMenu = document.getElementById("langMenu");
  const LANG_NAMES = { en: "English", he: "עברית" };
  function buildLangMenu() {
    langMenu.innerHTML = I18n.available().map((l) =>
      `<button data-lang="${l}" aria-current="${l === I18n.lang}">${icon(l === I18n.lang ? "check" : "globe")}<span>${LANG_NAMES[l] || l}</span></button>`).join("");
  }
  langBtn.addEventListener("click", (e) => { e.stopPropagation(); buildLangMenu(); langMenu.classList.toggle("open"); });
  langMenu.addEventListener("click", (e) => {
    const b = e.target.closest("[data-lang]");
    if (!b) return;
    I18n.setLang(b.dataset.lang);
    langMenu.classList.remove("open");
  });
  document.addEventListener("click", () => langMenu.classList.remove("open"));

  /* --------------------------------------------------------------- Boot */
  I18n.init();
  initTheme();
  // Seed an empty product row for first-time users so the page is never blank.
  if (state.products.length === 0 && !state.result) addProduct();
  render();
})();
