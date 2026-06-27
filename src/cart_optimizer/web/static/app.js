/* Cart Optimizer — application logic (single-page dashboard).
 *
 * Everything lives on one scrollable board: collapsible Settings, a fast
 * inline-editable Products table, a Coupons list, a live Summary, an always-
 * visible Optimize action bar, and Results rendered in place. No wizard, no
 * navigation. State is one object, saved to localStorage; all text goes through
 * the i18n layer; the results explanation is composed client-side so it stays
 * fully localized without touching the API.
 */
(function () {
  "use strict";

  const I18n = window.I18n;
  const t = window.t;
  const el = (id) => document.getElementById(id);

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
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.3 17.7-1.4 1.4"/><path d="m19.1 4.9-1.4 1.4"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    alert: '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    checkCircle: '<path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="m9 11 3 3L22 4"/>',
  };
  function icon(name, cls) {
    return `<svg class="icon ${cls || ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
  }

  const CURRENCIES = ["USD", "EUR", "GBP", "ILS", "AUD", "CAD", "CHF", "SEK", "PLN", "BRL", "INR", "MXN", "ZAR", "NZD"];

  /* ----------------------------------------------------------------- State */
  function defaults() {
    return {
      settingsOpen: false,
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
      s.result = null;
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
      saveTimer = setTimeout(() => toast(t("action.saved"), "check"), 800);
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
      return new Intl.NumberFormat(I18n.locale(), { style: "currency", currency: cur }).format((cents || 0) / 100);
    } catch (_) {
      return ((cents || 0) / 100).toFixed(2) + " " + cur;
    }
  }
  function currencySymbol(cur) {
    try {
      const p = new Intl.NumberFormat(I18n.locale(), { style: "currency", currency: cur })
        .formatToParts(0).find((x) => x.type === "currency");
      return p ? p.value : cur;
    } catch (_) { return cur; }
  }
  const findById = (list, id) => list.find((x) => x.id === id);
  const includedProducts = () => state.products.filter((p) => p.included);
  function stores() {
    const set = new Set();
    includedProducts().forEach((p) => { if (p.store && p.store.trim()) set.add(p.store.trim()); });
    return [...set];
  }
  function metrics() {
    const incl = includedProducts();
    const subtotal = incl.reduce((s, p) => s + (toCents(p.price) || 0) * (parseInt(p.qty) || 1), 0);
    const owners = new Set();
    incl.forEach((p) => { if (state.groupMode && p.owner && p.owner.trim()) owners.add(p.owner.trim()); });
    const free = toCents(state.settings.freeShipping);
    const flat = toCents(state.settings.shipping) || 0;
    const shipping = flat > 0 && (free == null || subtotal < free) ? flat : 0;
    return {
      inclCount: incl.length, optionalCount: state.products.length - incl.length,
      subtotal, couponCount: state.coupons.length, peopleCount: owners.size, flat, shipping,
    };
  }

  /* --------------------------------------------------------------- Toast */
  let toastTimer = null;
  function toast(msg, ic) {
    const node = el("toast");
    node.innerHTML = icon(ic || "info") + "<span>" + esc(msg) + "</span>";
    node.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove("show"), 1700);
  }

  /* --------------------------------------------------------------- Pieces */
  function moneyField(labelKey, hintKey, field, value, optional) {
    const sym = esc(currencySymbol(state.settings.currency));
    return `<div class="field">
      <label>${esc(t(labelKey))}${optional ? ` <span class="optional-tag">· ${esc(t("common.optional"))}</span>` : ""}</label>
      <div class="input-money"><span class="cur">${sym}</span>
        <input class="input" type="number" inputmode="decimal" min="0" step="0.01"
          data-bind="${field}" value="${esc(value)}" placeholder="0.00" /></div>
      <span class="hint">${esc(t(hintKey))}</span>
    </div>`;
  }
  function settingsSummaryText() {
    const s = state.settings;
    const cap = toCents(s.cap) != null ? t("review.cap", { amount: fmtMoney(toCents(s.cap)) }) : t("review.noCap");
    return `${s.currency} · ${cap}`;
  }

  function settingsCardHTML() {
    const s = state.settings;
    const options = CURRENCIES.map((c) =>
      `<option value="${c}" ${c === s.currency ? "selected" : ""}>${c} (${esc(currencySymbol(c))})</option>`).join("");
    return `<section class="panel collapsible ${state.settingsOpen ? "is-open" : ""}" id="settingsCard">
      <button class="card-toggle" data-action="toggleSettings" aria-expanded="${state.settingsOpen}">
        <span class="ico">${icon("sliders")}</span>
        <h2>${esc(t("settings.title"))}</h2>
        <span class="sum" id="settingsSummary">${esc(settingsSummaryText())}</span>
        <span class="chev">${icon("chevronDown")}</span>
      </button>
      <div class="card-body">
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
      </div>
    </section>`;
  }

  /* ----- Products */
  function prodCols() {
    return state.groupMode
      ? "minmax(0,2.1fr) minmax(0,1.5fr) minmax(0,1fr) minmax(0,0.7fr) minmax(0,1fr) 120px"
      : "minmax(0,2.2fr) minmax(0,1.5fr) minmax(0,1fr) minmax(0,0.7fr) 120px";
  }
  function productRowHTML(p) {
    const cols = prodCols();
    const sym = esc(currencySymbol(state.settings.currency));
    const owner = state.groupMode
      ? `<div class="pcell pcell-owner"><label class="pcell-label">${esc(t("products.col.owner"))}</label>
          <input class="input" data-pid="${p.id}" data-field="owner" aria-label="${esc(t("products.col.owner"))}"
            value="${esc(p.owner)}" placeholder="${esc(t("products.owner.placeholder"))}" /></div>` : "";
    return `<div class="prow ${p.included ? "" : "is-excluded"}" data-pid="${p.id}" style="grid-template-columns:${cols}">
      <div class="pcell pcell-name"><label class="pcell-label">${esc(t("products.col.name"))}</label>
        <input class="input js-name" data-pid="${p.id}" data-field="name" aria-label="${esc(t("products.col.name"))}"
          value="${esc(p.name)}" placeholder="${esc(t("products.name.placeholder"))}" /></div>
      <div class="pcell"><label class="pcell-label">${esc(t("products.col.store"))}</label>
        <input class="input" list="storeList" data-pid="${p.id}" data-field="store" aria-label="${esc(t("products.col.store"))}"
          value="${esc(p.store)}" placeholder="${esc(t("products.store.placeholder"))}" /></div>
      <div class="pcell"><label class="pcell-label">${esc(t("products.col.price"))}</label>
        <div class="input-money"><span class="cur">${sym}</span>
          <input class="input" type="number" inputmode="decimal" min="0" step="0.01"
            data-pid="${p.id}" data-field="price" aria-label="${esc(t("products.col.price"))}"
            value="${esc(p.price)}" placeholder="0.00" /></div></div>
      <div class="pcell"><label class="pcell-label">${esc(t("products.col.qty"))}</label>
        <input class="input" type="number" inputmode="numeric" min="1" step="1"
          data-pid="${p.id}" data-field="qty" aria-label="${esc(t("products.col.qty"))}" value="${esc(p.qty)}" /></div>
      ${owner}
      <div class="pcell pcell-actions">
        <label class="switch switch-sm" title="${esc(t("products.include"))}">
          <input type="checkbox" data-action="toggleInclude" data-pid="${p.id}" aria-label="${esc(t("products.include"))}" ${p.included ? "checked" : ""} />
          <span class="track"><span class="thumb"></span></span></label>
        <button class="btn-icon" data-action="dupProduct" data-pid="${p.id}" aria-label="${esc(t("products.duplicate"))}" title="${esc(t("products.duplicate"))}">${icon("copy")}</button>
        <button class="btn-icon is-danger" data-action="delProduct" data-pid="${p.id}" aria-label="${esc(t("products.delete"))}" title="${esc(t("products.delete"))}">${icon("trash")}</button>
      </div>
    </div>`;
  }
  function productsBodyHTML() {
    const storeOpts = stores().map((s) => `<option value="${esc(s)}"></option>`).join("");
    const head = `<div class="ptable-head" style="grid-template-columns:${prodCols()}">
      <span>${esc(t("products.col.name"))}</span><span>${esc(t("products.col.store"))}</span>
      <span>${esc(t("products.col.price"))}</span><span>${esc(t("products.col.qty"))}</span>
      ${state.groupMode ? `<span>${esc(t("products.col.owner"))}</span>` : ""}<span></span></div>`;
    const list = state.products.length
      ? `<div class="ptable">${head}${state.products.map(productRowHTML).join("")}</div>
         <p class="hint-row">${esc(t("products.enterHint"))}</p>`
      : emptyState("package", "products.empty.title", "products.empty.desc");
    return `<datalist id="storeList">${storeOpts}</datalist>
      ${list}
      <div class="toolbar">
        <button class="btn btn-secondary" data-action="addProduct">${icon("plus")}<span>${esc(t("products.add"))}</span></button>
        <span class="spacer"></span>
        <button class="btn btn-ghost" data-action="loadExample">${esc(t("action.loadExample"))}</button>
        <button class="btn btn-ghost" data-action="clearAll">${esc(t("action.clearAll"))}</button>
      </div>`;
  }
  function productsCardHTML() {
    return `<section class="panel" id="productsCard">
      <div class="section-head">
        <span class="ico">${icon("package")}</span>
        <h2>${esc(t("products.title"))}</h2>
        <span class="chip" id="prodChip">${esc(t("review.itemsIncluded", { n: includedProducts().length }))}</span>
        <span class="spacer"></span>
        <label class="switch" title="${esc(t("products.groupToggle"))}">
          <input type="checkbox" data-action="toggleGroup" aria-label="${esc(t("products.groupToggle"))}" ${state.groupMode ? "checked" : ""} />
          <span class="track"><span class="thumb"></span></span></label>
      </div>
      <p class="section-sub">${esc(t("products.subtitle"))}</p>
      <div id="productsBody">${productsBodyHTML()}</div>
    </section>`;
  }

  /* ----- Coupons */
  function couponRowHTML(c) {
    const sym = esc(currencySymbol(state.settings.currency));
    const storeField = c.scope === "store"
      ? `<div class="field"><label>${esc(t("coupons.col.store"))}</label>
          <select class="select" data-cid="${c.id}" data-field="store">
            <option value="">—</option>
            ${stores().map((s) => `<option value="${esc(s)}" ${s === c.store ? "selected" : ""}>${esc(s)}</option>`).join("")}
          </select></div>`
      : `<div class="field"><label>&nbsp;</label><div class="hint" style="padding-block:11px">${esc(t("coupons.appliesTo.order"))}</div></div>`;
    return `<div class="item">
      <div class="item-grid coupon" style="grid-template-columns:1.6fr 1.4fr 1fr 1fr auto">
        <div class="field"><label>${esc(t("coupons.col.name"))}</label>
          <input class="input" data-cid="${c.id}" data-field="name" value="${esc(c.name)}" placeholder="${esc(t("coupons.name.placeholder"))}" /></div>
        ${storeField}
        <div class="field"><label>${esc(t("coupons.col.minSpend"))}</label>
          <div class="input-money"><span class="cur">${sym}</span>
            <input class="input" type="number" inputmode="decimal" min="0" step="0.01" data-cid="${c.id}" data-field="minSpend" value="${esc(c.minSpend)}" placeholder="0.00" /></div></div>
        <div class="field"><label>${esc(t("coupons.col.discount"))}</label>
          <div class="input-money"><span class="cur">${sym}</span>
            <input class="input" type="number" inputmode="decimal" min="0" step="0.01" data-cid="${c.id}" data-field="discount" value="${esc(c.discount)}" placeholder="0.00" /></div></div>
        <div class="field" style="justify-content:flex-end">
          <button class="btn-icon is-danger" data-action="delCoupon" data-cid="${c.id}" aria-label="${esc(t("coupons.delete"))}" title="${esc(t("coupons.delete"))}">${icon("trash")}</button></div>
      </div>
      <div class="item-foot" style="margin-block-start:var(--space-3)">
        <div class="segmented" role="group" aria-label="${esc(t("coupons.col.appliesTo"))}">
          <button type="button" data-action="couponScope" data-cid="${c.id}" data-scope="order" aria-pressed="${c.scope === "order"}">${esc(t("coupons.appliesTo.order"))}</button>
          <button type="button" data-action="couponScope" data-cid="${c.id}" data-scope="store" aria-pressed="${c.scope === "store"}">${esc(t("coupons.appliesTo.store"))}</button>
        </div>
      </div>
    </div>`;
  }
  function couponsBodyHTML() {
    const list = state.coupons.length
      ? `<div class="items">${state.coupons.map(couponRowHTML).join("")}</div>`
      : emptyState("ticket", "coupons.empty.title", "coupons.empty.desc");
    return `${list}
      <div class="toolbar"><button class="btn btn-secondary" data-action="addCoupon">${icon("plus")}<span>${esc(t("coupons.add"))}</span></button></div>`;
  }
  function couponsCardHTML() {
    return `<section class="panel" id="couponsCard">
      <div class="section-head">
        <span class="ico">${icon("ticket")}</span>
        <h2>${esc(t("coupons.title"))}</h2>
        <span class="chip">${state.coupons.length}</span>
      </div>
      <p class="section-sub">${esc(t("coupons.subtitle"))}</p>
      <div id="couponsBody">${couponsBodyHTML()}</div>
    </section>`;
  }

  /* ----- Live summary */
  function summaryBodyHTML() {
    const m = metrics();
    const cells = [];
    cells.push(`<div class="sum-cell accent"><div class="k">${esc(t("review.products"))}</div><div class="v">${m.inclCount}</div></div>`);
    cells.push(`<div class="sum-cell accent"><div class="k">${esc(t("summary.subtotal"))}</div><div class="v">${fmtMoney(m.subtotal)}</div></div>`);
    cells.push(`<div class="sum-cell"><div class="k">${esc(t("review.coupons"))}</div><div class="v">${m.couponCount}</div></div>`);
    if (m.optionalCount > 0) cells.push(`<div class="sum-cell"><div class="k">${esc(t("summary.optionalOff"))}</div><div class="v">${m.optionalCount}</div></div>`);
    if (state.groupMode && m.peopleCount > 0) cells.push(`<div class="sum-cell"><div class="k">${esc(t("summary.people"))}</div><div class="v">${m.peopleCount}</div></div>`);
    if (m.flat > 0) cells.push(`<div class="sum-cell"><div class="k">${esc(t("summary.shipping"))}</div><div class="v">${fmtMoney(m.shipping)}</div></div>`);
    return cells.join("");
  }
  function summaryCardHTML() {
    return `<section class="panel" id="summaryCard">
      <div class="section-head"><span class="ico">${icon("info")}</span><h2>${esc(t("summary.heading"))}</h2></div>
      <div id="summaryBody" class="summary-grid">${summaryBodyHTML()}</div>
    </section>`;
  }

  /* ----- Results */
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
    r.orders.forEach((o) => o.applied_coupons.forEach((c) =>
      out.push(t("why.coupon", { name: c.name, amount: fmtMoney(c.discount_cents), order: o.index }))));
    const cap = toCents(state.settings.cap);
    if (cap != null && r.orders.length > 1) out.push(t("why.cap", { cap: fmtMoney(cap) }));
    if (r.baseline_total_cents == null && cap != null) out.push(t("results.noBaselineNote"));
    else if (r.savings_vs_baseline_cents != null && r.savings_vs_baseline_cents > 0) out.push(t("why.savings", { amount: fmtMoney(r.savings_vs_baseline_cents) }));
    else out.push(t("why.alreadyOptimal"));
    return out;
  }
  function orderCard(o) {
    const items = o.products.map((p) =>
      `<div class="order-item"><span>${esc(p.name)}${p.quantity > 1 ? ` <span class="q">× ${p.quantity}</span>` : ""}</span>
        <span>${fmtMoney(p.unit_price_cents * p.quantity)}</span></div>`).join("");
    const lines = [`<div class="order-line2"><span>${esc(t("results.subtotal"))}</span><span>${fmtMoney(o.subtotal_cents)}</span></div>`];
    if (o.shipping_cents) lines.push(`<div class="order-line2"><span>${esc(t("results.shipping"))}</span><span>${fmtMoney(o.shipping_cents)}</span></div>`);
    if (o.discount_cents) lines.push(`<div class="order-line2"><span>${esc(t("results.discount"))}</span><span>−${fmtMoney(o.discount_cents)}</span></div>`);
    const chips = o.applied_coupons.map((c) => `<span class="coupon-chip">${icon("ticket")}${esc(c.name)} · −${fmtMoney(c.discount_cents)}</span>`).join(" ");
    return `<div class="order-card">
      <div class="order-head">
        <span class="order-title">${esc(t("results.order", { n: o.index }))}</span>
        <span class="order-pay"><div class="lbl">${esc(t("results.orderPay"))}</div><div class="amt">${fmtMoney(o.total_cents)}</div></span>
      </div>
      <div class="order-body">${items}<div class="order-lines">${lines.join("")}</div>${chips ? `<div>${chips}</div>` : ""}</div>
    </div>`;
  }
  function resultsBodyHTML() {
    const r = state.result;
    if (!r) return "";
    const head = `<div class="results-head"><h2 tabindex="-1" id="resultsHeading">${esc(t("results.heading"))}</h2>${statusBadge(r.status)}</div>`;
    if (r.status === "INFEASIBLE") return head + emptyState("alert", "results.status.infeasible", "results.infeasible.desc");

    const before = r.subtotal_cents + r.shipping_cents;
    const save = r.discount_cents;
    const stats = [
      `<div class="stat primary"><div class="stat-label">${esc(t("results.finalCost"))}</div><div class="stat-value">${fmtMoney(r.total_cents)}</div><div class="stat-sub">${esc(t(r.orders.length > 1 ? "results.split" : "results.single", { n: r.orders.length }))}</div></div>`,
      `<div class="stat"><div class="stat-label">${esc(t("results.originalCost"))}</div><div class="stat-value ${save ? "stat-strike" : ""}">${fmtMoney(before)}</div><div class="stat-sub">${esc(t("results.subtotal"))} + ${esc(t("results.shipping"))}</div></div>`,
    ];
    if (save > 0) stats.push(`<div class="stat save"><div class="stat-label">${esc(t("results.youSave"))}</div><div class="stat-value">${fmtMoney(save)}</div><div class="stat-sub">${esc(t("coupons.title"))}</div></div>`);
    return `${head}
      <div class="hero" style="grid-template-columns:${save > 0 ? "1.2fr 1fr 1fr" : "1.4fr 1fr"}">${stats.join("")}</div>
      <div class="orders">${r.orders.map(orderCard).join("")}</div>
      <div class="why"><h3>${icon("info")}${esc(t("results.why"))}</h3>
        <ul>${whyBullets(r).map((b) => `<li><span class="tick">${icon("check")}</span><span>${esc(b)}</span></li>`).join("")}</ul></div>`;
  }
  function resultsCardHTML() {
    return `<section class="panel" id="resultsCard" ${state.result ? "" : "hidden"}><div id="resultsBody">${resultsBodyHTML()}</div></section>`;
  }

  function emptyState(ic, titleKey, descKey) {
    return `<div class="empty"><div class="empty-icon">${icon(ic)}</div>
      <div class="empty-title">${esc(t(titleKey))}</div><div class="empty-desc">${esc(t(descKey))}</div></div>`;
  }

  /* ----- Action bar */
  function actionbarHTML() {
    const m = metrics();
    const sub = `${t("review.itemsIncluded", { n: m.inclCount })}${m.couponCount ? ` · ${m.couponCount} ${t("review.coupons")}` : ""}`;
    return `<div class="actionbar-inner">
      <div class="ab-summary"><span class="ab-main">${fmtMoney(m.subtotal)}</span><span class="ab-sub">${esc(sub)}</span></div>
      <span class="spacer"></span>
      <button class="btn btn-primary btn-lg" data-action="optimize" id="optimizeBtn" ${m.inclCount ? "" : "disabled"}>
        ${icon("sparkles")}<span>${esc(t(state.result ? "optimize.again" : "review.optimize"))}</span></button>
    </div>`;
  }

  /* --------------------------------------------------------------- Render */
  let pendingFocus = null;
  function applyFocus() {
    if (!pendingFocus) return;
    const node = document.querySelector(pendingFocus);
    if (node) node.focus();
    pendingFocus = null;
  }
  function renderBoard() {
    el("board").innerHTML = settingsCardHTML() + productsCardHTML() + couponsCardHTML() + summaryCardHTML() + resultsCardHTML();
    renderActionbar();
    applyFocus();
  }
  function renderProducts() { el("productsBody").innerHTML = productsBodyHTML(); applyFocus(); updateLive(); }
  function renderCoupons() { el("couponsBody").innerHTML = couponsBodyHTML(); applyFocus(); updateLive(); }
  function renderActionbar() { el("actionbar").innerHTML = actionbarHTML(); }
  function renderResults() {
    const card = el("resultsCard");
    if (!state.result) { card.hidden = true; el("resultsBody").innerHTML = ""; return; }
    card.hidden = false;
    el("resultsBody").innerHTML = resultsBodyHTML();
  }
  function updateLive() {
    const sb = el("summaryBody"); if (sb) sb.innerHTML = summaryBodyHTML();
    renderActionbar();
    const chip = el("prodChip"); if (chip) chip.textContent = t("review.itemsIncluded", { n: includedProducts().length });
    const ss = el("settingsSummary"); if (ss) ss.textContent = settingsSummaryText();
  }

  /* --------------------------------------------------------------- Mutations */
  function newProduct(seed) {
    return Object.assign({ id: uid(), name: "", store: "", price: "", qty: 1, owner: "", included: true }, seed || {});
  }
  function newCoupon(seed) {
    return Object.assign({ id: uid(), name: "", scope: "order", store: "", minSpend: "", discount: "" }, seed || {});
  }
  function loadExample() {
    state.products = [
      newProduct({ name: "Wireless earbuds", store: "AudioHub", price: "29.90", qty: 1 }),
      newProduct({ name: "USB-C cable (2m)", store: "AudioHub", price: "6.50", qty: 2 }),
      newProduct({ name: "Phone stand", store: "GadgetWorld", price: "12.00", qty: 1 }),
    ];
    state.coupons = [newCoupon({ name: t("coupons.name.placeholder"), scope: "order", minSpend: "50", discount: "5" })];
    state.settings.cap = "";
    state.groupMode = false;
    state.result = null;
  }

  /* --------------------------------------------------------------- Optimize */
  function buildPayload() {
    return {
      products: includedProducts().map((p) => ({
        name: p.name.trim(), store: p.store.trim(),
        unit_price_cents: toCents(p.price) || 0, quantity: parseInt(p.qty) || 1,
        owner: state.groupMode && p.owner.trim() ? p.owner.trim() : null,
      })),
      coupons: state.coupons.map((c) => ({
        name: c.name.trim(), scope: c.scope,
        store: c.scope === "store" ? (c.store.trim() || null) : null,
        threshold_cents: toCents(c.minSpend) || 0, discount_cents: toCents(c.discount) || 0,
      })),
      users: [],
      settings: {
        currency: state.settings.currency,
        max_order_value_cents: toCents(state.settings.cap),
        shipping_flat_cents: toCents(state.settings.shipping) || 0,
        free_shipping_threshold_cents: toCents(state.settings.freeShipping),
      },
    };
  }
  function mark(sel) { const node = document.querySelector(sel); if (node) node.classList.add("is-invalid"); return node; }
  function validateAll() {
    document.querySelectorAll(".is-invalid").forEach((e) => e.classList.remove("is-invalid"));
    const incl = includedProducts();
    if (incl.length === 0) { toast(t("valid.atLeastOneIncluded"), "alert"); return false; }
    let ok = true, first = null;
    incl.forEach((p) => {
      if (!p.name.trim()) { ok = false; first = first || mark(`[data-pid="${p.id}"][data-field="name"]`); }
      if (!toCents(p.price)) { ok = false; first = first || mark(`[data-pid="${p.id}"][data-field="price"]`); }
    });
    const storeSet = new Set(stores());
    state.coupons.forEach((c) => {
      if (!c.name.trim()) { ok = false; first = first || mark(`[data-cid="${c.id}"][data-field="name"]`); }
      if (!toCents(c.discount)) { ok = false; first = first || mark(`[data-cid="${c.id}"][data-field="discount"]`); }
      if (c.scope === "store" && (!c.store || !storeSet.has(c.store))) { ok = false; first = first || mark(`[data-cid="${c.id}"][data-field="store"]`); }
    });
    if (!ok) { toast(t("valid.fixErrors"), "alert"); if (first) first.scrollIntoView({ behavior: "smooth", block: "center" }); }
    return ok;
  }
  function friendlyError(data) {
    try {
      const d = data.detail;
      if (Array.isArray(d) && d.length) return d[0].msg.replace(/^Value error,\s*/, "");
      if (typeof d === "string") return d;
    } catch (_) { /* ignore */ }
    return t("error.generic");
  }
  async function optimize() {
    if (!validateAll()) return;
    const btn = el("optimizeBtn");
    if (btn) { btn.disabled = true; btn.querySelector("span").textContent = t("review.optimizing"); }
    try {
      const res = await fetch("/api/v1/optimize", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok) { toast(friendlyError(data), "alert"); renderActionbar(); return; }
      state.result = data;
      renderResults();
      renderActionbar();
      const heading = el("resultsHeading");
      if (heading) { heading.focus(); heading.scrollIntoView({ behavior: "smooth", block: "start" }); }
    } catch (_) {
      toast(t("error.generic"), "alert");
      renderActionbar();
    }
  }

  /* --------------------------------------------------------------- Events */
  document.addEventListener("input", (e) => {
    const node = e.target;
    if (node.dataset.bind) {
      state.settings[node.dataset.bind] = node.value;
      saveState();
      if (node.dataset.bind === "currency") renderBoard(); else updateLive();
    } else if (node.dataset.pid && node.dataset.field) {
      const p = findById(state.products, node.dataset.pid);
      if (p) { p[node.dataset.field] = node.value; saveState(); updateLive(); }
    } else if (node.dataset.cid && node.dataset.field) {
      const c = findById(state.coupons, node.dataset.cid);
      if (c) { c[node.dataset.field] = node.value; saveState(); updateLive(); }
    }
  });

  // Spreadsheet-style keyboard flow in the products table.
  document.addEventListener("keydown", (e) => {
    const node = e.target;
    if (!node.dataset || !node.dataset.field || !node.closest || !node.closest(".prow")) return;
    if (e.key === "Enter") {
      e.preventDefault();
      const idx = state.products.findIndex((p) => p.id === node.dataset.pid);
      const np = newProduct();
      state.products.splice(idx + 1, 0, np);
      saveState(true);
      pendingFocus = `[data-pid="${np.id}"][data-field="name"]`;
      renderProducts();
    } else if ((e.key === "ArrowDown" || e.key === "ArrowUp") && node.type !== "number") {
      const rows = [...document.querySelectorAll(".prow")];
      const i = rows.indexOf(node.closest(".prow"));
      const next = rows[i + (e.key === "ArrowDown" ? 1 : -1)];
      if (next) {
        const inp = next.querySelector(`[data-field="${node.dataset.field}"]`);
        if (inp) { e.preventDefault(); inp.focus(); if (inp.select) inp.select(); }
      }
    }
  });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action, pid = btn.dataset.pid, cid = btn.dataset.cid;
    switch (action) {
      case "toggleSettings": {
        state.settingsOpen = !state.settingsOpen;
        saveState(true);
        el("settingsCard").classList.toggle("is-open", state.settingsOpen);
        btn.setAttribute("aria-expanded", state.settingsOpen);
        break;
      }
      case "addProduct": {
        const np = newProduct(); state.products.push(np); saveState(true);
        pendingFocus = `[data-pid="${np.id}"][data-field="name"]`; renderProducts();
        break;
      }
      case "dupProduct": {
        const p = findById(state.products, pid);
        if (p) {
          const copy = newProduct(Object.assign({}, p, { id: uid() }));
          state.products.splice(state.products.indexOf(p) + 1, 0, copy);
          saveState(); pendingFocus = `[data-pid="${copy.id}"][data-field="name"]`; renderProducts();
        }
        break;
      }
      case "delProduct":
        state.products = state.products.filter((p) => p.id !== pid); saveState(); renderProducts(); break;
      case "toggleInclude": {
        const p = findById(state.products, pid);
        if (p) { p.included = !p.included; saveState(); renderProducts(); }
        break;
      }
      case "toggleGroup": state.groupMode = !state.groupMode; saveState(); renderProducts(); break;
      case "addCoupon": {
        const c = newCoupon(); state.coupons.push(c); saveState(true);
        pendingFocus = `[data-cid="${c.id}"][data-field="name"]`; renderCoupons();
        break;
      }
      case "delCoupon":
        state.coupons = state.coupons.filter((c) => c.id !== cid); saveState(); renderCoupons(); break;
      case "couponScope": {
        const c = findById(state.coupons, cid);
        if (c && c.scope !== btn.dataset.scope) { c.scope = btn.dataset.scope; saveState(); renderCoupons(); }
        break;
      }
      case "loadExample": loadExample(); renderBoard(); toast(t("action.loadExample"), "check"); break;
      case "clearAll":
        if (confirm(t("action.confirmClear"))) {
          state = defaults(); state.products = [newProduct()]; saveState(); renderBoard();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        break;
      case "optimize": optimize(); break;
    }
  });

  document.addEventListener("wheel", (e) => {
    if (document.activeElement === e.target && e.target.type === "number") e.target.blur();
  }, { passive: true });

  document.addEventListener("languagechange", () => renderBoard());

  /* --------------------------------------------------------------- Theme + lang */
  function initTheme() {
    const theme = localStorage.getItem("co.theme") || "dark";
    document.documentElement.setAttribute("data-theme", theme);
    updateThemeIcon(theme);
  }
  function updateThemeIcon(theme) {
    const b = el("themeBtn"); if (b) b.innerHTML = icon(theme === "dark" ? "sun" : "moon");
  }
  el("themeBtn").addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("co.theme", next);
    updateThemeIcon(next);
  });

  const langBtn = el("langBtn"), langMenu = el("langMenu");
  const LANG_NAMES = { en: "English", he: "עברית" };
  function buildLangMenu() {
    langMenu.innerHTML = I18n.available().map((l) =>
      `<button data-lang="${l}" aria-current="${l === I18n.lang}">${icon(l === I18n.lang ? "check" : "globe")}<span>${LANG_NAMES[l] || l}</span></button>`).join("");
  }
  langBtn.addEventListener("click", (e) => { e.stopPropagation(); buildLangMenu(); langMenu.classList.toggle("open"); });
  langMenu.addEventListener("click", (e) => {
    const b = e.target.closest("[data-lang]"); if (!b) return;
    I18n.setLang(b.dataset.lang); langMenu.classList.remove("open");
  });
  document.addEventListener("click", () => langMenu.classList.remove("open"));

  /* --------------------------------------------------------------- Boot */
  I18n.init();
  initTheme();
  if (state.products.length === 0 && !state.result) state.products.push(newProduct());
  renderBoard();
})();
