/* Cart Optimizer — product app.
 *
 * A focused, self-explaining experience: an inviting empty state, a fast
 * quick-add, a cart grouped by store with ghost-input editing, real-time smart
 * guidance (coupon unlock progress, duplicates, impossible constraints), and a
 * celebratory results screen. State is one object saved to localStorage; all
 * copy goes through i18n; the results explanation is composed client-side so it
 * stays localized without touching the API.
 */
(function () {
  "use strict";

  const I18n = window.I18n;
  const t = window.t;
  const el = (id) => document.getElementById(id);

  /* ----------------------------------------------------------------- Icons */
  const ICONS = {
    cart: '<circle cx="9" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/><path d="M2 3h3l2.4 12a1.6 1.6 0 0 0 1.6 1.3h8.2a1.6 1.6 0 0 0 1.6-1.3L21 7H6"/>',
    package: '<path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    ticket: '<path d="M2 9a3 3 0 0 0 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 0 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 11v2"/><path d="M13 17v2"/>',
    sparkles: '<path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z"/><path d="M5 3v3"/><path d="M19 18v3"/><path d="M3.5 4.5h3"/><path d="M17.5 19.5h3"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.3 17.7-1.4 1.4"/><path d="m19.1 4.9-1.4 1.4"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    alert: '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    checkCircle: '<path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="m9 11 3 3L22 4"/>',
    arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  };
  function icon(name, cls) {
    return `<svg class="icon ${cls || ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
  }

  const CURRENCIES = ["USD", "EUR", "GBP", "ILS", "AUD", "CAD", "CHF", "SEK", "PLN", "BRL", "INR", "MXN", "ZAR", "NZD"];

  /* ----------------------------------------------------------------- State */
  function defaults() {
    return {
      customsOn: false,
      settings: { currency: "USD", cap: "", shipping: "", freeShipping: "" },
      products: [],
      coupons: [],
      result: null,
      placed: {},
    };
  }
  let state = loadState() || defaults();

  function loadState() {
    try {
      const raw = localStorage.getItem("co.state");
      if (!raw) return null;
      const s = JSON.parse(raw);
      s.result = null; s.placed = {};
      return Object.assign(defaults(), s);
    } catch (_) { return null; }
  }
  let saveTimer = null;
  function saveState(quiet) {
    try {
      const { result, placed, ...persist } = state;
      localStorage.setItem("co.state", JSON.stringify(persist));
    } catch (_) { /* ignore */ }
    if (!quiet) { clearTimeout(saveTimer); saveTimer = setTimeout(() => toast(t("action.saved"), "check"), 900); }
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
    try { return new Intl.NumberFormat(I18n.locale(), { style: "currency", currency: cur }).format((cents || 0) / 100); }
    catch (_) { return ((cents || 0) / 100).toFixed(2) + " " + cur; }
  }
  function currencySymbol(cur) {
    try {
      const p = new Intl.NumberFormat(I18n.locale(), { style: "currency", currency: cur }).formatToParts(0).find((x) => x.type === "currency");
      return p ? p.value : cur;
    } catch (_) { return cur; }
  }
  const findById = (list, id) => list.find((x) => x.id === id);
  const included = () => state.products.filter((p) => p.included);
  const lineCents = (p) => (toCents(p.price) || 0) * (parseInt(p.qty) || 1);
  function storeColor(name) {
    if (!name) return "var(--faint)";
    let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return `hsl(${h} 65% 60%)`;
  }
  function metrics() {
    const inc = included();
    const subtotal = inc.reduce((s, p) => s + lineCents(p), 0);
    const free = toCents(state.settings.freeShipping);
    const flat = toCents(state.settings.shipping) || 0;
    const shipping = flat > 0 && (free == null || subtotal < free) ? flat : 0;
    return { count: inc.length, optional: state.products.length - inc.length, subtotal, coupons: state.coupons.length, flat, shipping };
  }
  function capCents() { return state.customsOn ? toCents(state.settings.cap) : null; }

  /* --------------------------------------------------------------- Toast */
  let toastTimer = null;
  function toast(msg, ic) {
    const node = el("toast");
    node.innerHTML = icon(ic || "info") + "<span>" + esc(msg) + "</span>";
    node.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove("show"), 1700);
  }

  /* --------------------------------------------------------------- Smart logic */
  function couponStatus(c) {
    if (toCents(c.discount) == null) return { kind: "incomplete", pct: 0, gap: 0, text: "" };
    const T = toCents(c.minSpend) || 0;
    let Q;
    if (c.scope === "store") {
      if (!c.store) return { kind: "off", pct: 0, gap: 0, text: t("valid.couponStore") };
      const items = included().filter((p) => p.store.trim() === c.store);
      if (items.length === 0) return { kind: "off", pct: 0, gap: 0, text: t("coupon.noStore", { store: c.store }) };
      Q = items.reduce((s, p) => s + lineCents(p), 0);
    } else {
      Q = metrics().subtotal;
    }
    if (T <= 0 || Q >= T) return { kind: "ok", pct: 100, gap: 0, text: t("coupon.ready") };
    const gap = T - Q;
    return { kind: "pending", pct: Math.min(99, Math.round((Q / T) * 100)), gap,
      text: t(c.scope === "store" ? "coupon.unlockStore" : "coupon.unlock", { amount: fmtMoney(gap), store: c.store }) };
  }
  function couponSummary(c) {
    if (toCents(c.discount) == null) return t("coupon.incomplete");
    const d = fmtMoney(toCents(c.discount) || 0), th = fmtMoney(toCents(c.minSpend) || 0);
    return c.scope === "store"
      ? t("coupon.summaryStore", { discount: d, store: c.store || "—", threshold: th })
      : t("coupon.summaryOrder", { discount: d, threshold: th });
  }
  function couponStatusHTML(c) {
    const st = couponStatus(c);
    if (st.kind === "incomplete") return "";
    const bar = st.kind === "pending" ? `<div class="progress"><i style="width:${st.pct}%"></i></div>` : "";
    const ic = st.kind === "ok" ? "checkCircle" : st.kind === "off" ? "info" : "sparkles";
    const cls = st.kind === "ok" ? "ok" : st.kind === "off" ? "off" : "pending";
    return `<div class="coupon-status ${cls}"><span class="st">${icon(ic)}${esc(st.text)}</span>${bar}</div>`;
  }
  function itemFlags(p) {
    const flags = [];
    if (toCents(p.price) == null) flags.push({ cls: "muted", icon: "info", text: t("badge.noPrice") });
    const cap = capCents();
    if (cap && lineCents(p) > cap) flags.push({ cls: "danger", icon: "alert", text: t("badge.overCustoms") });
    const k = p.name.trim().toLowerCase();
    if (k && included().filter((x) => x.name.trim().toLowerCase() === k).length > 1) flags.push({ cls: "warn", icon: "copy", text: t("badge.dupe") });
    return flags;
  }
  function insights() {
    const out = [];
    const m = metrics();
    const cap = capCents();
    if (cap) included().forEach((p) => {
      if (lineCents(p) > cap) out.push({ sev: "danger", icon: "alert", text: t("insight.overCustoms", { name: p.name || "—", cap: fmtMoney(cap) }) });
    });
    const seen = {};
    included().forEach((p) => { const k = p.name.trim().toLowerCase(); if (!k) return; seen[k] = (seen[k] || 0) + 1; });
    Object.keys(seen).filter((k) => seen[k] > 1).forEach((k) => {
      const p = included().find((x) => x.name.trim().toLowerCase() === k);
      out.push({ sev: "warn", icon: "copy", text: t("insight.dupe", { name: p.name }) });
    });
    const pend = [];
    state.coupons.forEach((c) => { const st = couponStatus(c); if (st.kind === "pending" && st.pct > 0) pend.push({ c, st }); });
    pend.sort((a, b) => a.st.gap - b.st.gap).slice(0, 2).forEach(({ c, st }) =>
      out.push({ sev: "tip", icon: "sparkles", text: t(c.scope === "store" ? "insight.couponCloseStore" : "insight.couponClose", { amount: fmtMoney(st.gap), store: c.store, name: c.name || "—" }) }));
    if (!state.customsOn && m.count >= 3 && m.subtotal >= 10000)
      out.push({ sev: "tip", icon: "shield", text: t("insight.customsSuggest") });
    const rank = { danger: 0, warn: 1, tip: 2 };
    out.sort((a, b) => rank[a.sev] - rank[b.sev]);
    let top = out.slice(0, 4);
    const allPriced = included().every((p) => toCents(p.price) != null);
    if (top.length === 0 && m.count > 0 && allPriced) top = [{ sev: "ok", icon: "checkCircle", text: t("insight.ready") }];
    return top;
  }

  /* --------------------------------------------------------------- Pieces */
  function quickAddBar() {
    return `<div class="quickadd">
        <input class="qa-name" id="qaName" autocomplete="off" placeholder="${esc(t("qa.placeholder"))}" aria-label="${esc(t("qa.placeholder"))}" />
        <input class="qa-price" id="qaPrice" type="number" inputmode="decimal" min="0" step="0.01" placeholder="0.00" aria-label="${esc(t("products.col.price"))}" />
        <input class="qa-store" id="qaStore" autocomplete="off" list="storeList" placeholder="${esc(t("products.col.store"))}" aria-label="${esc(t("products.col.store"))}" />
        <button class="btn btn-primary" data-action="quickAdd">${icon("plus")}<span>${esc(t("qa.add"))}</span></button>
      </div>
      <p class="qa-hint">${esc(t("qa.hint"))}</p>`;
  }
  function moneyField(labelKey, hintKey, field, value, optional) {
    const sym = esc(currencySymbol(state.settings.currency));
    return `<div class="field">
      <label>${esc(t(labelKey))}${optional ? ` <span class="optional-tag">· ${esc(t("common.optional"))}</span>` : ""}</label>
      <div class="input-money"><span class="cur">${sym}</span>
        <input class="input" type="number" inputmode="decimal" min="0" step="0.01" data-bind="${field}" value="${esc(value)}" placeholder="0.00" /></div>
      ${hintKey ? `<span class="hint">${esc(t(hintKey))}</span>` : ""}
    </div>`;
  }

  /* ----- Onboarding */
  function onboardingHTML() {
    const v = (ic, ti, de) => `<div class="onb-value"><div class="ico">${icon(ic)}</div><h3>${esc(t(ti))}</h3><p>${esc(t(de))}</p></div>`;
    return `<section class="onb">
      <div class="onb-icon">${icon("cart")}</div>
      <h1 class="onb-title">${esc(t("onb.title"))}</h1>
      <p class="onb-sub">${esc(t("onb.subtitle"))}</p>
      <datalist id="storeList"></datalist>
      ${quickAddBar()}
      <div class="onb-ctas" style="margin-top:var(--space-4)">
        <button class="btn btn-ghost" data-action="loadExample">${icon("sparkles")}<span>${esc(t("onb.example"))}</span></button>
      </div>
      <div class="onb-values">${v("ticket", "onb.v1.title", "onb.v1.desc")}${v("shield", "onb.v2.title", "onb.v2.desc")}${v("package", "onb.v3.title", "onb.v3.desc")}</div>
    </section>`;
  }

  /* ----- Cart */
  function lineItemHTML(p) {
    const sym = esc(currencySymbol(state.settings.currency));
    const flags = itemFlags(p);
    const flagRow = flags.length ? `<div class="li-flags">${flags.map((f) => `<span class="flag ${f.cls}">${icon(f.icon)}${esc(f.text)}</span>`).join("")}</div>` : "";
    return `<div class="lineitem ${p.included ? "" : "is-excluded"}" data-pid="${p.id}">
      <label class="switch switch-sm" title="${esc(t("item.include"))}">
        <input type="checkbox" data-action="toggleInclude" data-pid="${p.id}" aria-label="${esc(t("item.include"))}" ${p.included ? "checked" : ""} />
        <span class="track"><span class="thumb"></span></span></label>
      <div class="li-name"><input class="ghost js-name" data-pid="${p.id}" data-field="name" aria-label="${esc(t("products.col.name"))}" value="${esc(p.name)}" placeholder="${esc(t("products.name.placeholder"))}" /></div>
      <div class="qstep">
        <button type="button" data-action="qtyDec" data-pid="${p.id}" aria-label="−">−</button>
        <input data-pid="${p.id}" data-field="qty" type="number" inputmode="numeric" min="1" step="1" aria-label="${esc(t("products.col.qty"))}" value="${esc(p.qty)}" />
        <button type="button" data-action="qtyInc" data-pid="${p.id}" aria-label="+">+</button>
      </div>
      <div class="li-price"><span class="cur">${sym}</span><input class="ghost" type="number" inputmode="decimal" min="0" step="0.01" data-pid="${p.id}" data-field="price" aria-label="${esc(t("products.col.price"))}" value="${esc(p.price)}" placeholder="0.00" /></div>
      <div class="li-store"><input class="ghost" data-pid="${p.id}" data-field="store" list="storeList" aria-label="${esc(t("products.col.store"))}" value="${esc(p.store)}" placeholder="${esc(t("products.col.store"))}" /></div>
      <div class="li-actions">
        <button class="btn-icon" data-action="dupProduct" data-pid="${p.id}" aria-label="${esc(t("products.duplicate"))}" title="${esc(t("products.duplicate"))}">${icon("copy")}</button>
        <button class="btn-icon is-danger" data-action="delProduct" data-pid="${p.id}" aria-label="${esc(t("products.delete"))}" title="${esc(t("products.delete"))}">${icon("trash")}</button>
      </div>
      ${flagRow}</div>`;
  }
  function cartBodyHTML() {
    const groups = [];
    const idx = {};
    state.products.forEach((p) => {
      const key = p.store.trim() || " ";
      if (!(key in idx)) { idx[key] = groups.length; groups.push({ key, store: p.store.trim(), items: [] }); }
      groups[idx[key]].items.push(p);
    });
    const storeOpts = [...new Set(state.products.map((p) => p.store.trim()).filter(Boolean))].map((s) => `<option value="${esc(s)}"></option>`).join("");
    let body;
    if (groups.length <= 1) {
      body = state.products.map(lineItemHTML).join("");
    } else {
      body = groups.map((g) => {
        const sub = g.items.filter((p) => p.included).reduce((s, p) => s + lineCents(p), 0);
        const name = g.store || t("cart.noStore");
        return `<div class="store-divider"><span class="store-dot" style="background:${g.store ? storeColor(g.store) : "var(--faint)"}"></span>
            <span class="store-name">${esc(name)}</span><span class="store-meta">· ${g.items.length} · ${fmtMoney(sub)}</span></div>
          ${g.items.map(lineItemHTML).join("")}`;
      }).join("");
    }
    return `<datalist id="storeList">${storeOpts}</datalist>${body}`;
  }
  function cartCardHTML() {
    return `<section class="panel" id="cartCard">
      <div class="section-head"><span class="ico">${icon("package")}</span><h2>${esc(t("cart.title"))}</h2>
        <span class="chip" id="cartChip">${esc(t("cart.items", { n: included().length }))}</span></div>
      ${quickAddBar()}
      <div id="cartBody" style="margin-top:var(--space-3)">${cartBodyHTML()}</div>
      <div class="toolbar" style="margin-top:var(--space-4)">
        <span class="spacer"></span>
        <button class="btn btn-ghost" data-action="loadExample">${esc(t("action.loadExample"))}</button>
        <button class="btn btn-ghost" data-action="clearAll">${esc(t("action.clearAll"))}</button>
      </div>
    </section>`;
  }

  /* ----- Discounts */
  function couponHTML(c) {
    const sym = esc(currencySymbol(state.settings.currency));
    const storeField = c.scope === "store"
      ? `<div class="field"><label>${esc(t("coupons.col.store"))}</label>
          <select class="select" data-cid="${c.id}" data-field="store"><option value="">—</option>
            ${[...new Set(included().map((p) => p.store.trim()).filter(Boolean))].map((s) => `<option value="${esc(s)}" ${s === c.store ? "selected" : ""}>${esc(s)}</option>`).join("")}</select></div>` : "";
    return `<div class="coupon2" data-cid="${c.id}">
      <div class="coupon-top">
        <span class="coupon-tic">${icon("ticket")}</span>
        <div class="coupon-main">
          <input class="ghost" style="font-weight:600" data-cid="${c.id}" data-field="name" value="${esc(c.name)}" placeholder="${esc(t("coupons.name.placeholder"))}" aria-label="${esc(t("coupons.col.name"))}" />
          <div class="coupon-summary">${esc(couponSummary(c))}</div>
          <div class="coupon-statuswrap">${couponStatusHTML(c)}</div>
        </div>
        <button class="btn-icon is-danger" data-action="delCoupon" data-cid="${c.id}" aria-label="${esc(t("coupons.delete"))}" title="${esc(t("coupons.delete"))}">${icon("trash")}</button>
      </div>
      <div class="coupon-fields">
        <div class="field" style="grid-column:1/-1"><label>${esc(t("coupons.col.appliesTo"))}</label>
          <div class="segmented" role="group">
            <button type="button" data-action="couponScope" data-cid="${c.id}" data-scope="order" aria-pressed="${c.scope === "order"}">${esc(t("coupons.appliesTo.order"))}</button>
            <button type="button" data-action="couponScope" data-cid="${c.id}" data-scope="store" aria-pressed="${c.scope === "store"}">${esc(t("coupons.appliesTo.store"))}</button>
          </div></div>
        ${storeField}
        <div class="field"><label>${esc(t("coupons.col.minSpend"))}</label>
          <div class="input-money"><span class="cur">${sym}</span><input class="input" type="number" inputmode="decimal" min="0" step="0.01" data-cid="${c.id}" data-field="minSpend" value="${esc(c.minSpend)}" placeholder="0.00" /></div></div>
        <div class="field"><label>${esc(t("coupons.col.discount"))}</label>
          <div class="input-money"><span class="cur">${sym}</span><input class="input" type="number" inputmode="decimal" min="0" step="0.01" data-cid="${c.id}" data-field="discount" value="${esc(c.discount)}" placeholder="0.00" /></div></div>
      </div></div>`;
  }
  function couponsBodyHTML() {
    return state.coupons.length
      ? `<div class="coupons">${state.coupons.map(couponHTML).join("")}</div>`
      : emptyState("ticket", "coupons.empty.title", "coupons.empty.desc");
  }
  function discountsCardHTML() {
    return `<section class="panel" id="discountsCard">
      <div class="section-head"><span class="ico">${icon("ticket")}</span><h2>${esc(t("disc.title"))}</h2>
        <span class="chip">${state.coupons.length}</span><span class="spacer"></span>
        <button class="btn btn-secondary" data-action="addCoupon">${icon("plus")}<span>${esc(t("coupons.add"))}</span></button></div>
      <p class="section-sub">${esc(t("disc.subtitle"))}</p>
      <div id="couponsBody">${couponsBodyHTML()}</div>
    </section>`;
  }

  /* ----- Rules */
  function rulesCardHTML() {
    const capFields = state.customsOn
      ? `<div class="rule-fields">${moneyField("settings.cap", "settings.cap.hint", "cap", state.settings.cap, false)}</div>` : "";
    return `<section class="panel" id="rulesCard">
      <div class="section-head"><span class="ico">${icon("sliders")}</span><h2>${esc(t("rules.title"))}</h2></div>
      <p class="section-sub">${esc(t("rules.subtitle"))}</p>
      <div class="rule-row">
        <div class="rt"><h3>${esc(t("rules.customsToggle"))}</h3><p>${esc(t("settings.cap.hint"))}</p></div>
        <label class="switch"><input type="checkbox" data-action="toggleCustoms" aria-label="${esc(t("rules.customsToggle"))}" ${state.customsOn ? "checked" : ""} /><span class="track"><span class="thumb"></span></span></label>
      </div>
      ${capFields}
      <div class="grid grid-2" style="margin-top:var(--space-4)">
        ${moneyField("settings.shipping", "settings.shipping.hint", "shipping", state.settings.shipping, true)}
        ${moneyField("settings.freeShipping", "settings.freeShipping.hint", "freeShipping", state.settings.freeShipping, true)}
      </div>
    </section>`;
  }

  /* ----- Results */
  function whyBullets(r) {
    const out = [];
    out.push(r.status === "PROVEN_OPTIMAL" ? t("why.proven") : t("why.unproven"));
    r.orders.forEach((o) => o.applied_coupons.forEach((c) => out.push(t("why.coupon", { name: c.name, amount: fmtMoney(c.discount_cents), order: o.index }))));
    if (r.orders.length === 1) out.push(t("why.single"));
    return out;
  }
  function orderCardHTML(o) {
    const placed = !!state.placed[o.index];
    const items = o.products.map((p) => `<div class="order-item"><span>${esc(p.name)}${p.quantity > 1 ? ` <span class="q">× ${p.quantity}</span>` : ""}</span><span>${fmtMoney(p.unit_price_cents * p.quantity)}</span></div>`).join("");
    const lines = [`<div class="order-line2"><span>${esc(t("results.subtotal"))}</span><span>${fmtMoney(o.subtotal_cents)}</span></div>`];
    if (o.shipping_cents) lines.push(`<div class="order-line2"><span>${esc(t("results.shipping"))}</span><span>${fmtMoney(o.shipping_cents)}</span></div>`);
    if (o.discount_cents) lines.push(`<div class="order-line2"><span>${esc(t("results.discount"))}</span><span>−${fmtMoney(o.discount_cents)}</span></div>`);
    const chips = o.applied_coupons.map((c) => `<span class="coupon-chip">${icon("ticket")}${esc(c.name)} · −${fmtMoney(c.discount_cents)}</span>`).join(" ");
    return `<div class="order-card ${placed ? "is-placed" : ""}">
      <div class="order-head">
        <button class="placed-toggle ${placed ? "is-on" : ""}" data-action="placedToggle" data-idx="${o.index}" aria-label="${esc(t("results.markPlaced"))}" aria-pressed="${placed}">${icon("check")}</button>
        <span class="order-title" style="flex:1">${esc(t("results.order", { n: o.index }))}</span>
        <span class="order-pay"><div class="lbl">${esc(t("results.orderPay"))}</div><div class="amt">${fmtMoney(o.total_cents)}</div></span></div>
      <div class="order-body">${items}<div class="order-lines">${lines.join("")}</div>${chips ? `<div>${chips}</div>` : ""}</div></div>`;
  }
  function resultsHTML() {
    const r = state.result;
    if (!r) return "";
    const head = `<div class="results-head"><h2 tabindex="-1" id="resultsHeading">${esc(t("results.title"))}</h2>
      <span class="badge ${r.status === "PROVEN_OPTIMAL" ? "proven" : r.status === "UNPROVEN" ? "unproven" : "infeasible"}">${icon(r.status === "PROVEN_OPTIMAL" ? "checkCircle" : "alert")}${esc(t(r.status === "PROVEN_OPTIMAL" ? "results.status.proven" : r.status === "UNPROVEN" ? "results.status.unproven" : "results.status.infeasible"))}</span></div>`;

    if (r.status === "INFEASIBLE") {
      return `<section class="panel">${head}${emptyState("alert", "results.status.infeasible", "results.infeasible.desc")}
        <div class="res-actions"><button class="btn btn-secondary" data-action="editCart">${icon("package")}<span>${esc(t("results.edit"))}</span></button></div></section>`;
    }
    const fullPrice = r.subtotal_cents + r.shipping_cents;
    const save = r.discount_cents;
    const savePill = save > 0 ? `<div class="save-pill">${icon("sparkles")} ${esc(t("results.youSave"))} ${fmtMoney(save)}</div>` : "";
    const compare = save > 0
      ? `<div class="compare"><span class="full">${fmtMoney(fullPrice)}</span> ${icon("arrowRight", "icon-flip")} <span class="now">${fmtMoney(r.total_cents)} · ${esc(t("results.withCoupons"))}</span></div>` : "";
    const cap = capCents();
    let note = "";
    if (r.orders.length > 1 && cap) note = `<div class="res-note">${icon("shield")}<span>${esc(t("results.customsNote", { n: r.orders.length, cap: fmtMoney(cap) }))}</span></div>`;
    else if (r.orders.length === 1) note = `<div class="res-note">${icon("checkCircle")}<span>${esc(t("why.single"))}</span></div>`;

    const ordersTitle = r.orders.length > 1 ? t("results.placeTitle", { n: r.orders.length }) : t("results.placeOne");
    return `<section class="panel">
      ${head}
      <div class="savings-hero">
        <div class="pay-label">${esc(t("results.finalCost"))}</div>
        <div class="pay">${fmtMoney(r.total_cents)}</div>
        ${savePill}${compare}
      </div>
      ${note}
      <div class="orders-title"><h3>${esc(ordersTitle)}</h3><span class="hint muted">${esc(t("results.placedHint"))}</span></div>
      <div class="orders">${r.orders.map(orderCardHTML).join("")}</div>
      <div class="why"><h3>${icon("info")}${esc(t("results.why"))}</h3>
        <ul>${whyBullets(r).map((b) => `<li><span class="tick">${icon("check")}</span><span>${esc(b)}</span></li>`).join("")}</ul></div>
      <div class="res-actions"><button class="btn btn-secondary" data-action="editCart">${icon("package")}<span>${esc(t("results.edit"))}</span></button></div>
    </section>`;
  }

  function emptyState(ic, titleKey, descKey) {
    return `<div class="empty"><div class="empty-icon">${icon(ic)}</div><div class="empty-title">${esc(t(titleKey))}</div><div class="empty-desc">${esc(t(descKey))}</div></div>`;
  }
  function insightsHTML() {
    return insights().map((i) => `<div class="insight ${i.sev}">${icon(i.icon)}<span>${esc(i.text)}</span></div>`).join("");
  }
  function actionbarHTML() {
    if (state.products.length === 0 && !state.result) return "";
    const m = metrics();
    const sub = `${t("cart.items", { n: m.count })}${m.coupons ? ` · ${m.coupons} ${t("review.coupons")}` : ""}`;
    return `<div class="actionbar-inner">
      <div class="ab-summary"><span class="ab-main">${fmtMoney(m.subtotal)}</span><span class="ab-sub">${esc(sub)}</span></div>
      <span class="spacer"></span>
      <button class="btn btn-primary btn-lg" data-action="optimize" id="optimizeBtn" ${m.count ? "" : "disabled"}>
        ${icon("sparkles")}<span>${esc(t(state.result ? "optimize.again" : "cta.optimize"))}</span></button></div>`;
  }

  /* --------------------------------------------------------------- Render */
  let pendingFocus = null;
  function applyFocus() { if (pendingFocus) { const n = document.querySelector(pendingFocus); if (n) n.focus(); pendingFocus = null; } }
  function boardHTML() {
    const parts = [`<div id="resultsWrap">${state.result ? resultsHTML() : ""}</div>`];
    if (state.products.length === 0 && !state.result) parts.push(onboardingHTML());
    else parts.push(`<div id="insights" class="insights">${insightsHTML()}</div>`, cartCardHTML(), discountsCardHTML(), rulesCardHTML());
    return parts.join("");
  }
  function renderApp() {
    el("board").innerHTML = boardHTML();
    el("actionbar").innerHTML = actionbarHTML();
    syncCurrency();
    applyFocus();
  }
  function renderCart() { const b = el("cartBody"); if (b) b.innerHTML = cartBodyHTML(); applyFocus(); }
  function renderCoupons() { const b = el("couponsBody"); if (b) b.innerHTML = couponsBodyHTML(); applyFocus(); }
  function renderResults() { const w = el("resultsWrap"); if (w) w.innerHTML = state.result ? resultsHTML() : ""; }
  function updateLive() {
    const ins = el("insights"); if (ins) ins.innerHTML = insightsHTML();
    el("actionbar").innerHTML = actionbarHTML();
    const chip = el("cartChip"); if (chip) chip.textContent = t("cart.items", { n: included().length });
  }
  // Surgical updates: refresh derived UI (item flags, coupon status) in place,
  // WITHOUT rebuilding the inputs the user is typing in (so focus is never lost).
  function refreshFlags() {
    const body = el("cartBody"); if (!body) return;
    body.querySelectorAll(".lineitem").forEach((node) => {
      const p = findById(state.products, node.dataset.pid); if (!p) return;
      const old = node.querySelector(".li-flags"); if (old) old.remove();
      const flags = itemFlags(p);
      if (flags.length) {
        const div = document.createElement("div");
        div.className = "li-flags";
        div.innerHTML = flags.map((f) => `<span class="flag ${f.cls}">${icon(f.icon)}${esc(f.text)}</span>`).join("");
        node.appendChild(div);
      }
    });
  }
  function refreshCoupon(cid) {
    const node = document.querySelector(`.coupon2[data-cid="${cid}"]`); if (!node) return;
    const c = findById(state.coupons, cid); if (!c) return;
    const sum = node.querySelector(".coupon-summary"); if (sum) sum.textContent = couponSummary(c);
    const wrap = node.querySelector(".coupon-statuswrap"); if (wrap) wrap.innerHTML = couponStatusHTML(c);
  }
  function refreshAllCoupons() { state.coupons.forEach((c) => refreshCoupon(c.id)); }
  function syncCurrency() { const s = el("currencySel"); if (s) s.value = state.settings.currency; }

  /* --------------------------------------------------------------- Mutations */
  function newProduct(seed) { return Object.assign({ id: uid(), name: "", store: "", price: "", qty: 1, included: true }, seed || {}); }
  function newCoupon(seed) { return Object.assign({ id: uid(), name: "", scope: "order", store: "", minSpend: "", discount: "" }, seed || {}); }
  function loadExample() {
    state.products = [
      newProduct({ name: "Wireless earbuds", store: "AudioHub", price: "29.90" }),
      newProduct({ name: "USB-C cable (2m)", store: "AudioHub", price: "6.50", qty: 2 }),
      newProduct({ name: "Mini tripod", store: "GadgetWorld", price: "12.00" }),
    ];
    state.coupons = [newCoupon({ name: "5 off 40", scope: "order", minSpend: "40", discount: "5" })];
    state.customsOn = false; state.result = null; state.placed = {};
  }
  function addFromQuickAdd() {
    const nameEl = el("qaName"); if (!nameEl) return;
    const name = nameEl.value.trim(); if (!name) { nameEl.focus(); return; }
    const price = el("qaPrice").value, store = el("qaStore").value.trim();
    const wasEmpty = state.products.length === 0;
    state.products.push(newProduct({ name, price, store }));
    saveState(true);
    if (wasEmpty) renderApp(); else renderCart();
    updateLive();
    const n = el("qaName"), p = el("qaPrice"), s = el("qaStore");
    if (n) n.value = ""; if (p) p.value = ""; if (s) s.value = store;  // keep store sticky
    if (n) n.focus();
  }

  /* --------------------------------------------------------------- Optimize */
  function buildPayload() {
    return {
      products: included().map((p) => ({ name: p.name.trim(), store: p.store.trim(), unit_price_cents: toCents(p.price) || 0, quantity: parseInt(p.qty) || 1, owner: null })),
      coupons: state.coupons.map((c) => ({ name: c.name.trim(), scope: c.scope, store: c.scope === "store" ? (c.store.trim() || null) : null, threshold_cents: toCents(c.minSpend) || 0, discount_cents: toCents(c.discount) || 0 })),
      users: [],
      settings: { currency: state.settings.currency, max_order_value_cents: capCents(), shipping_flat_cents: toCents(state.settings.shipping) || 0, free_shipping_threshold_cents: toCents(state.settings.freeShipping) },
    };
  }
  function mark(sel) { const n = document.querySelector(sel); if (n) n.classList.add("is-invalid"); return n; }
  function validateAll() {
    document.querySelectorAll(".is-invalid").forEach((e) => e.classList.remove("is-invalid"));
    const inc = included();
    if (inc.length === 0) { toast(t("valid.atLeastOneIncluded"), "alert"); return false; }
    let ok = true, first = null;
    inc.forEach((p) => {
      if (!p.name.trim()) { ok = false; first = first || mark(`[data-pid="${p.id}"][data-field="name"]`); }
      if (!toCents(p.price)) { ok = false; first = first || mark(`[data-pid="${p.id}"][data-field="price"]`); }
    });
    const storeSet = new Set(included().map((p) => p.store.trim()).filter(Boolean));
    state.coupons.forEach((c) => {
      if (!c.name.trim()) { ok = false; first = first || mark(`[data-cid="${c.id}"][data-field="name"]`); }
      if (!toCents(c.discount)) { ok = false; first = first || mark(`[data-cid="${c.id}"][data-field="discount"]`); }
      if (c.scope === "store" && (!c.store || !storeSet.has(c.store))) { ok = false; first = first || mark(`[data-cid="${c.id}"][data-field="store"]`); }
    });
    if (!ok) { toast(t("valid.fixErrors"), "alert"); if (first) first.scrollIntoView({ behavior: "smooth", block: "center" }); }
    return ok;
  }
  function friendlyError(data) {
    try { const d = data.detail; if (Array.isArray(d) && d.length) return d[0].msg.replace(/^Value error,\s*/, ""); if (typeof d === "string") return d; } catch (_) { /* */ }
    return t("error.generic");
  }
  async function optimize() {
    if (!validateAll()) return;
    const btn = el("optimizeBtn");
    if (btn) { btn.disabled = true; btn.querySelector("span").textContent = t("review.optimizing"); }
    try {
      const res = await fetch("/api/v1/optimize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildPayload()) });
      const data = await res.json();
      if (!res.ok) { toast(friendlyError(data), "alert"); el("actionbar").innerHTML = actionbarHTML(); return; }
      state.result = data; state.placed = {};
      renderResults(); el("actionbar").innerHTML = actionbarHTML();
      const h = el("resultsHeading"); if (h) { h.focus(); h.scrollIntoView({ behavior: "smooth", block: "start" }); }
    } catch (_) { toast(t("error.generic"), "alert"); el("actionbar").innerHTML = actionbarHTML(); }
  }

  /* --------------------------------------------------------------- Events */
  document.addEventListener("input", (e) => {
    const n = e.target;
    if (n.dataset.bind) {
      state.settings[n.dataset.bind] = n.value; saveState();
      updateLive(); refreshFlags();   // cap affects over-limit flags
    } else if (n.dataset.pid && n.dataset.field) {
      const p = findById(state.products, n.dataset.pid);
      if (p) { p[n.dataset.field] = n.value; saveState(); updateLive(); refreshFlags(); refreshAllCoupons(); }
    } else if (n.dataset.cid && n.dataset.field) {
      const c = findById(state.coupons, n.dataset.cid);
      if (c) { c[n.dataset.field] = n.value; saveState(); updateLive(); refreshCoupon(c.id); }
    }
  });

  // On blur, only re-group the cart when a product's STORE changed (it moves the
  // item between store groups). A store <select> change refreshes that coupon.
  document.addEventListener("change", (e) => {
    const n = e.target;
    if (n.dataset && n.dataset.pid && n.dataset.field === "store") renderCart();
    else if (n.dataset && n.dataset.cid && n.dataset.field === "store") { refreshCoupon(n.dataset.cid); updateLive(); }
  });

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); optimize(); return; }
    if (e.key === "Enter" && e.target.classList && (e.target.classList.contains("qa-name") || e.target.classList.contains("qa-price") || e.target.classList.contains("qa-store"))) {
      e.preventDefault(); addFromQuickAdd();
    }
  });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action, pid = btn.dataset.pid, cid = btn.dataset.cid;
    switch (action) {
      case "quickAdd": addFromQuickAdd(); break;
      case "qtyInc": case "qtyDec": {
        const p = findById(state.products, pid);
        if (p) {
          p.qty = Math.max(1, (parseInt(p.qty) || 1) + (action === "qtyInc" ? 1 : -1));
          saveState();
          const inp = document.querySelector(`[data-pid="${pid}"][data-field="qty"]`); if (inp) inp.value = p.qty;
          refreshFlags(); refreshAllCoupons(); updateLive();
        }
        break;
      }
      case "dupProduct": {
        const p = findById(state.products, pid);
        if (p) { const copy = newProduct(Object.assign({}, p, { id: uid() })); state.products.splice(state.products.indexOf(p) + 1, 0, copy); saveState(); pendingFocus = `[data-pid="${copy.id}"][data-field="name"]`; renderCart(); updateLive(); }
        break;
      }
      case "delProduct": {
        const wasEmpty = state.products.length === 1;
        state.products = state.products.filter((p) => p.id !== pid); saveState();
        if (wasEmpty) renderApp(); else { renderCart(); updateLive(); }
        break;
      }
      case "toggleInclude": { const p = findById(state.products, pid); if (p) { p.included = !p.included; saveState(); renderCart(); updateLive(); } break; }
      case "addCoupon": { const c = newCoupon(); state.coupons.push(c); saveState(true); pendingFocus = `[data-cid="${c.id}"][data-field="name"]`; renderCoupons(); updateLive(); break; }
      case "delCoupon": state.coupons = state.coupons.filter((c) => c.id !== cid); saveState(); renderCoupons(); updateLive(); break;
      case "couponScope": { const c = findById(state.coupons, cid); if (c && c.scope !== btn.dataset.scope) { c.scope = btn.dataset.scope; saveState(); renderCoupons(); updateLive(); } break; }
      case "toggleCustoms": state.customsOn = !state.customsOn; saveState(); renderApp(); updateLive(); break;
      case "placedToggle": { const i = btn.dataset.idx; state.placed[i] = !state.placed[i]; renderResults(); break; }
      case "editCart": { const c = el("cartCard"); if (c) c.scrollIntoView({ behavior: "smooth", block: "start" }); break; }
      case "loadExample": loadExample(); renderApp(); updateLive(); toast(t("action.loadExample"), "check"); break;
      case "clearAll": if (confirm(t("action.confirmClear"))) { state = defaults(); saveState(); renderApp(); window.scrollTo({ top: 0, behavior: "smooth" }); } break;
      case "optimize": optimize(); break;
    }
  });

  document.addEventListener("wheel", (e) => { if (document.activeElement === e.target && e.target.type === "number") e.target.blur(); }, { passive: true });
  document.addEventListener("languagechange", () => renderApp());

  /* --------------------------------------------------------------- Header controls */
  function initCurrency() {
    const s = el("currencySel");
    if (!s) return;
    s.innerHTML = CURRENCIES.map((c) => `<option value="${c}">${c}</option>`).join("");
    s.value = state.settings.currency;
    s.addEventListener("change", () => { state.settings.currency = s.value; saveState(); renderApp(); });
  }
  function initTheme() {
    const theme = localStorage.getItem("co.theme") || "dark";
    document.documentElement.setAttribute("data-theme", theme);
    updateThemeIcon(theme);
  }
  function updateThemeIcon(theme) { const b = el("themeBtn"); if (b) b.innerHTML = icon(theme === "dark" ? "sun" : "moon"); }
  el("themeBtn").addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next); localStorage.setItem("co.theme", next); updateThemeIcon(next);
  });

  const langBtn = el("langBtn"), langMenu = el("langMenu");
  const LANG_NAMES = { en: "English", he: "עברית" };
  function buildLangMenu() {
    langMenu.innerHTML = I18n.available().map((l) => `<button data-lang="${l}" aria-current="${l === I18n.lang}">${icon(l === I18n.lang ? "check" : "globe")}<span>${LANG_NAMES[l] || l}</span></button>`).join("");
  }
  langBtn.addEventListener("click", (e) => { e.stopPropagation(); buildLangMenu(); langMenu.classList.toggle("open"); });
  langMenu.addEventListener("click", (e) => { const b = e.target.closest("[data-lang]"); if (!b) return; I18n.setLang(b.dataset.lang); langMenu.classList.remove("open"); });
  document.addEventListener("click", () => langMenu.classList.remove("open"));

  /* --------------------------------------------------------------- Boot */
  I18n.init();
  initTheme();
  initCurrency();
  renderApp();
})();
