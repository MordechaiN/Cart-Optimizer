/* Cart Optimizer — internationalization (i18n).
 *
 * A tiny, dependency-free i18n engine. Translations live in one place (no string
 * duplication across the app); the UI references keys via `data-i18n*` attributes
 * and the `t()` helper. Switching language updates text, direction (LTR/RTL) and
 * the document locale, then notifies the app to re-render dynamic content.
 */
(function () {
  "use strict";

  const RTL_LANGS = new Set(["he"]);

  // Locale used for number/currency formatting per UI language.
  const LOCALES = { en: "en-US", he: "he-IL" };

  const TRANSLATIONS = {
    en: {
      "brand": "Cart Optimizer",
      "tagline": "Find the cheapest way to split your order.",

      "nav.language": "Language",
      "nav.theme": "Toggle light / dark theme",

      "step.settings": "Settings",
      "step.products": "Products",
      "step.coupons": "Coupons",
      "step.review": "Review",
      "step.results": "Results",
      "step.counter": "Step {n} of {total}",

      "settings.title": "General settings",
      "settings.subtitle": "Choose your currency and any limits. Anything optional can be left blank.",
      "settings.currency": "Currency",
      "settings.currency.hint": "Used to display all amounts.",
      "settings.cap": "Customs limit per order",
      "settings.cap.hint": "Keep each order at or below this to avoid import fees. Leave blank to ignore.",
      "settings.shipping": "Shipping per order",
      "settings.shipping.hint": "A flat fee charged for each separate order.",
      "settings.freeShipping": "Free shipping over",
      "settings.freeShipping.hint": "Orders at or above this amount ship free. Leave blank to ignore.",

      "products.title": "Your products",
      "products.subtitle": "Add everything in your cart. Set the store so store coupons can match.",
      "products.add": "Add product",
      "products.empty.title": "No products yet",
      "products.empty.desc": "Add the items from your cart to get started.",
      "products.col.name": "Product",
      "products.col.store": "Store",
      "products.col.price": "Unit price",
      "products.col.qty": "Qty",
      "products.col.owner": "For",
      "products.name.placeholder": "e.g. Wireless earbuds",
      "products.store.placeholder": "e.g. TechStore",
      "products.owner.placeholder": "Name",
      "products.include": "Include in optimization",
      "products.duplicate": "Duplicate",
      "products.delete": "Delete",
      "products.groupToggle": "These items are for different people",

      "coupons.title": "Your coupons",
      "coupons.subtitle": "Optional. Add any discounts you have and we'll use them where they help most.",
      "coupons.add": "Add coupon",
      "coupons.empty.title": "No coupons",
      "coupons.empty.desc": "That's fine — coupons are optional. Add one if you have a discount.",
      "coupons.col.name": "Coupon",
      "coupons.col.appliesTo": "Applies to",
      "coupons.col.store": "Store",
      "coupons.col.minSpend": "Min. spend to unlock",
      "coupons.col.discount": "Discount",
      "coupons.appliesTo.order": "Whole order",
      "coupons.appliesTo.store": "A specific store",
      "coupons.name.placeholder": "e.g. 5 off 50",
      "coupons.minSpend.hint": "What you must spend for it to apply.",
      "coupons.discount.hint": "How much it takes off.",
      "coupons.delete": "Delete",

      "review.title": "Review & optimize",
      "review.subtitle": "A quick check before we crunch the numbers.",
      "review.products": "Products",
      "review.coupons": "Coupons",
      "review.settings": "Settings",
      "review.cartTotal": "Cart total",
      "review.itemsIncluded": "{n} included",
      "review.none": "None",
      "review.noCap": "No customs limit",
      "review.cap": "Customs limit {amount}",
      "review.optimize": "Optimize my cart",
      "review.optimizing": "Optimizing…",

      "results.title": "Your optimal plan",
      "results.finalCost": "You pay",
      "results.originalCost": "As one order",
      "results.youSave": "You save",
      "results.status.proven": "Proven optimal",
      "results.status.unproven": "Best found (not proven optimal)",
      "results.status.infeasible": "No valid solution",
      "results.split": "Split into {n} orders",
      "results.single": "Kept as a single order",
      "results.order": "Order {n}",
      "results.subtotal": "Subtotal",
      "results.shipping": "Shipping",
      "results.discount": "Discount",
      "results.orderPay": "Pay",
      "results.why": "Why this plan",
      "results.savingsNote": "compared with one combined order",
      "results.noBaselineNote": "A single combined order would exceed your customs limit, so splitting is required.",
      "results.infeasible.desc": "We couldn't find a legal way to split this cart under your current settings. Try raising or removing the customs limit.",
      "results.startOver": "Start over",
      "results.edit": "Edit cart",

      "why.proven": "This split is proven to be the cheapest legal option.",
      "why.unproven": "This is the best split found, but it couldn't be proven optimal in the time available.",
      "why.split": "We split your cart into {n} orders.",
      "why.single": "Everything fits best in a single order.",
      "why.coupon": "Coupon “{name}” saves {amount} on order {order}.",
      "why.cap": "Orders are kept under your {cap} customs limit.",
      "why.savings": "You save {amount} versus one combined order.",
      "why.alreadyOptimal": "A single combined order is already the cheapest option.",

      "summary.heading": "Live summary",
      "summary.subtotal": "Estimated subtotal",
      "summary.shipping": "Estimated shipping",
      "summary.optionalOff": "Optional (off)",
      "summary.people": "People",
      "optimize.again": "Optimize again",
      "products.enterHint": "Tip: press Enter to add the next product.",
      "results.heading": "Results",

      "onb.title": "Split your cart. Pay less.",
      "onb.subtitle": "Add what's in your cart and we'll find the cheapest way to order it — proven optimal, never guessed.",
      "onb.cta": "Add your items",
      "onb.example": "Try an example",
      "onb.v1.title": "Use coupons smartly",
      "onb.v1.desc": "We place each coupon where it saves the most.",
      "onb.v2.title": "Avoid customs fees",
      "onb.v2.desc": "Keep every order under your import limit.",
      "onb.v3.title": "Cheapest shipping",
      "onb.v3.desc": "Pay for shipping only where it's worth it.",

      "qa.placeholder": "Add an item — e.g. Wireless earbuds",
      "qa.add": "Add",
      "qa.hint": "Press Enter to add. A store helps store coupons work.",

      "cart.title": "Your cart",
      "cart.items": "{n} items",
      "cart.noStore": "No store",
      "item.include": "Include in plan",
      "item.menu": "More actions",

      "badge.dupe": "Possible duplicate",
      "badge.noPrice": "Add a price",
      "badge.overCustoms": "Over your limit",

      "disc.title": "Discounts",
      "disc.subtitle": "Add your coupons — we'll use each one where it saves the most.",
      "coupon.ready": "Ready to use",
      "coupon.unlock": "Add {amount} more to unlock",
      "coupon.unlockStore": "Add {amount} more at {store} to unlock",
      "coupon.noStore": "Add an item from {store} to use this",
      "coupon.summaryOrder": "{discount} off your order over {threshold}",
      "coupon.summaryStore": "{discount} off {store} over {threshold}",

      "rules.title": "Order rules",
      "rules.subtitle": "Optional limits that shape the split. Most people can skip these.",
      "rules.customsToggle": "Avoid customs fees",

      "insight.overCustoms": "“{name}” costs more than your {cap} limit, so no split can include it. Lower its price or raise the limit.",
      "insight.dupe": "“{name}” appears more than once — intentional?",
      "insight.couponClose": "You're {amount} away from unlocking “{name}”.",
      "insight.couponCloseStore": "Add {amount} at {store} to unlock “{name}”.",
      "insight.customsSuggest": "Shopping internationally? Turn on “Avoid customs fees”.",
      "insight.ready": "Everything checks out — ready to optimize.",

      "cta.optimize": "Find my best split",

      "results.fullPrice": "Full price",
      "results.withCoupons": "with coupons",
      "results.placeTitle": "Place these {n} orders",
      "results.placeOne": "Place this single order",
      "results.placedHint": "Tick each one as you place it.",
      "results.customsNote": "Split into {n} orders to stay under your {cap} customs limit.",
      "results.markPlaced": "Mark this order as placed",
      "coupon.incomplete": "Add the discount below to check it.",

      "common.optional": "optional",

      "action.back": "Back",
      "action.next": "Next",
      "action.clearAll": "Clear all",
      "action.loadExample": "Load example",
      "action.confirmClear": "Clear all entered data? This can't be undone.",
      "action.saved": "Saved",

      "valid.productName": "Add a product name.",
      "valid.productPrice": "Enter a price.",
      "valid.atLeastOne": "Add at least one product to continue.",
      "valid.atLeastOneIncluded": "Include at least one product.",
      "valid.couponName": "Add a coupon name.",
      "valid.couponStore": "Choose the store this coupon applies to.",
      "valid.couponStoreMatch": "No included product belongs to this store.",
      "valid.couponDiscount": "Enter a discount amount.",
      "valid.fixErrors": "Please fix the highlighted fields.",
      "error.generic": "Something went wrong. Please try again.",
    },

    he: {
      "brand": "Cart Optimizer",
      "tagline": "מצא את הדרך הזולה ביותר לפצל את ההזמנה שלך.",

      "nav.language": "שפה",
      "nav.theme": "מעבר בין ערכת נושא בהירה/כהה",

      "step.settings": "הגדרות",
      "step.products": "מוצרים",
      "step.coupons": "קופונים",
      "step.review": "סקירה",
      "step.results": "תוצאות",
      "step.counter": "שלב {n} מתוך {total}",

      "settings.title": "הגדרות כלליות",
      "settings.subtitle": "בחר מטבע ומגבלות. כל שדה אופציונלי אפשר להשאיר ריק.",
      "settings.currency": "מטבע",
      "settings.currency.hint": "משמש להצגת כל הסכומים.",
      "settings.cap": "מגבלת מכס להזמנה",
      "settings.cap.hint": "שמור כל הזמנה מתחת לסכום זה כדי להימנע מדמי ייבוא. השאר ריק כדי להתעלם.",
      "settings.shipping": "משלוח להזמנה",
      "settings.shipping.hint": "דמי משלוח קבועים לכל הזמנה נפרדת.",
      "settings.freeShipping": "משלוח חינם מעל",
      "settings.freeShipping.hint": "הזמנות בסכום זה ומעלה נשלחות חינם. השאר ריק כדי להתעלם.",

      "products.title": "המוצרים שלך",
      "products.subtitle": "הוסף את כל הפריטים בעגלה. ציין חנות כדי שקופוני חנות יתאימו.",
      "products.add": "הוסף מוצר",
      "products.empty.title": "אין מוצרים עדיין",
      "products.empty.desc": "הוסף את הפריטים מהעגלה כדי להתחיל.",
      "products.col.name": "מוצר",
      "products.col.store": "חנות",
      "products.col.price": "מחיר ליחידה",
      "products.col.qty": "כמות",
      "products.col.owner": "עבור",
      "products.name.placeholder": "לדוגמה: אוזניות אלחוטיות",
      "products.store.placeholder": "לדוגמה: TechStore",
      "products.owner.placeholder": "שם",
      "products.include": "כלול באופטימיזציה",
      "products.duplicate": "שכפל",
      "products.delete": "מחק",
      "products.groupToggle": "הפריטים מיועדים לאנשים שונים",

      "coupons.title": "הקופונים שלך",
      "coupons.subtitle": "אופציונלי. הוסף הנחות שיש לך ונשתמש בהן במקום שבו הן מועילות ביותר.",
      "coupons.add": "הוסף קופון",
      "coupons.empty.title": "אין קופונים",
      "coupons.empty.desc": "זה בסדר — קופונים הם אופציונליים. הוסף קופון אם יש לך הנחה.",
      "coupons.col.name": "קופון",
      "coupons.col.appliesTo": "חל על",
      "coupons.col.store": "חנות",
      "coupons.col.minSpend": "מינימום קנייה להפעלה",
      "coupons.col.discount": "הנחה",
      "coupons.appliesTo.order": "כל ההזמנה",
      "coupons.appliesTo.store": "חנות מסוימת",
      "coupons.name.placeholder": "לדוגמה: 20 הנחה מ-200",
      "coupons.minSpend.hint": "הסכום שצריך להוציא כדי שהקופון יחול.",
      "coupons.discount.hint": "כמה הקופון מוריד.",
      "coupons.delete": "מחק",

      "review.title": "סקירה ואופטימיזציה",
      "review.subtitle": "בדיקה מהירה לפני שנחשב.",
      "review.products": "מוצרים",
      "review.coupons": "קופונים",
      "review.settings": "הגדרות",
      "review.cartTotal": "סך העגלה",
      "review.itemsIncluded": "{n} כלולים",
      "review.none": "אין",
      "review.noCap": "אין מגבלת מכס",
      "review.cap": "מגבלת מכס {amount}",
      "review.optimize": "בצע אופטימיזציה",
      "review.optimizing": "מבצע אופטימיזציה…",

      "results.title": "התוכנית האופטימלית שלך",
      "results.finalCost": "אתה משלם",
      "results.originalCost": "כהזמנה אחת",
      "results.youSave": "אתה חוסך",
      "results.status.proven": "אופטימליות מוכחת",
      "results.status.unproven": "הטוב ביותר שנמצא (לא מוכח)",
      "results.status.infeasible": "אין פתרון חוקי",
      "results.split": "מפוצל ל-{n} הזמנות",
      "results.single": "נשמר כהזמנה אחת",
      "results.order": "הזמנה {n}",
      "results.subtotal": "סכום ביניים",
      "results.shipping": "משלוח",
      "results.discount": "הנחה",
      "results.orderPay": "לתשלום",
      "results.why": "למה התוכנית הזו",
      "results.savingsNote": "בהשוואה להזמנה אחת משולבת",
      "results.noBaselineNote": "הזמנה אחת משולבת הייתה חורגת ממגבלת המכס, ולכן נדרש פיצול.",
      "results.infeasible.desc": "לא הצלחנו למצוא דרך חוקית לפצל את העגלה תחת ההגדרות הנוכחיות. נסה להעלות או להסיר את מגבלת המכס.",
      "results.startOver": "התחל מחדש",
      "results.edit": "ערוך עגלה",

      "why.proven": "פיצול זה מוכח כאפשרות החוקית הזולה ביותר.",
      "why.unproven": "זהו הפיצול הטוב ביותר שנמצא, אך לא ניתן היה להוכיח אופטימליות בזמן שהוקצב.",
      "why.split": "פיצלנו את העגלה ל-{n} הזמנות.",
      "why.single": "הכול משתלב בצורה הטובה ביותר בהזמנה אחת.",
      "why.coupon": "הקופון “{name}” חוסך {amount} בהזמנה {order}.",
      "why.cap": "ההזמנות נשמרות מתחת למגבלת המכס {cap}.",
      "why.savings": "אתה חוסך {amount} בהשוואה להזמנה אחת משולבת.",
      "why.alreadyOptimal": "הזמנה אחת משולבת היא כבר האפשרות הזולה ביותר.",

      "summary.heading": "סיכום חי",
      "summary.subtotal": "סכום ביניים משוער",
      "summary.shipping": "משלוח משוער",
      "summary.optionalOff": "אופציונליים (כבויים)",
      "summary.people": "אנשים",
      "optimize.again": "אופטימיזציה מחדש",
      "products.enterHint": "טיפ: לחץ Enter כדי להוסיף את המוצר הבא.",
      "results.heading": "תוצאות",

      "onb.title": "פצלו את העגלה. שלמו פחות.",
      "onb.subtitle": "הוסיפו את מה שיש בעגלה ואנחנו נמצא את הדרך הזולה ביותר להזמין — אופטימליות מוכחת, בלי ניחושים.",
      "onb.cta": "הוסיפו את הפריטים",
      "onb.example": "נסו דוגמה",
      "onb.v1.title": "ניצול חכם של קופונים",
      "onb.v1.desc": "אנחנו משבצים כל קופון במקום שבו הוא חוסך הכי הרבה.",
      "onb.v2.title": "להימנע מדמי מכס",
      "onb.v2.desc": "לשמור כל הזמנה מתחת לסף הייבוא.",
      "onb.v3.title": "המשלוח הזול ביותר",
      "onb.v3.desc": "לשלם על משלוח רק כשזה משתלם.",

      "qa.placeholder": "הוסיפו פריט — לדוגמה: אוזניות אלחוטיות",
      "qa.add": "הוספה",
      "qa.hint": "לחצו Enter כדי להוסיף. ציון חנות עוזר לקופוני חנות לעבוד.",

      "cart.title": "העגלה שלכם",
      "cart.items": "{n} פריטים",
      "cart.noStore": "ללא חנות",
      "item.include": "כלול בתוכנית",
      "item.menu": "פעולות נוספות",

      "badge.dupe": "אולי כפילות",
      "badge.noPrice": "הוסיפו מחיר",
      "badge.overCustoms": "מעל המגבלה",

      "disc.title": "הנחות",
      "disc.subtitle": "הוסיפו קופונים — נשתמש בכל אחד במקום שבו הוא חוסך הכי הרבה.",
      "coupon.ready": "מוכן לשימוש",
      "coupon.unlock": "הוסיפו עוד {amount} כדי להפעיל",
      "coupon.unlockStore": "הוסיפו עוד {amount} בחנות {store} כדי להפעיל",
      "coupon.noStore": "הוסיפו פריט מהחנות {store} כדי להשתמש",
      "coupon.summaryOrder": "{discount} הנחה על הזמנה מעל {threshold}",
      "coupon.summaryStore": "{discount} הנחה ב-{store} מעל {threshold}",

      "rules.title": "כללי הזמנה",
      "rules.subtitle": "מגבלות אופציונליות שמעצבות את הפיצול. רוב האנשים יכולים לדלג.",
      "rules.customsToggle": "להימנע מדמי מכס",

      "insight.overCustoms": "“{name}” עולה יותר מהמגבלה {cap}, ולכן אף פיצול לא יכול לכלול אותו. הורידו את המחיר או העלו את המגבלה.",
      "insight.dupe": "“{name}” מופיע יותר מפעם אחת — בכוונה?",
      "insight.couponClose": "חסרים {amount} כדי להפעיל את “{name}”.",
      "insight.couponCloseStore": "הוסיפו {amount} בחנות {store} כדי להפעיל את “{name}”.",
      "insight.customsSuggest": "קונים מחו״ל? הפעילו “להימנע מדמי מכס”.",
      "insight.ready": "הכול תקין — אפשר לבצע אופטימיזציה.",

      "cta.optimize": "מצאו לי את הפיצול הטוב ביותר",

      "results.fullPrice": "מחיר מלא",
      "results.withCoupons": "עם קופונים",
      "results.placeTitle": "בצעו את {n} ההזמנות הבאות",
      "results.placeOne": "בצעו הזמנה אחת",
      "results.placedHint": "סמנו כל הזמנה לאחר ביצועה.",
      "results.customsNote": "מפוצל ל-{n} הזמנות כדי להישאר מתחת למגבלת המכס {cap}.",
      "results.markPlaced": "סמנו שההזמנה בוצעה",
      "coupon.incomplete": "הוסיפו את ההנחה למטה כדי לבדוק.",

      "common.optional": "אופציונלי",

      "action.back": "חזרה",
      "action.next": "הבא",
      "action.clearAll": "נקה הכול",
      "action.loadExample": "טען דוגמה",
      "action.confirmClear": "לנקות את כל הנתונים שהוזנו? לא ניתן לבטל פעולה זו.",
      "action.saved": "נשמר",

      "valid.productName": "הוסף שם מוצר.",
      "valid.productPrice": "הזן מחיר.",
      "valid.atLeastOne": "הוסף לפחות מוצר אחד כדי להמשיך.",
      "valid.atLeastOneIncluded": "כלול לפחות מוצר אחד.",
      "valid.couponName": "הוסף שם קופון.",
      "valid.couponStore": "בחר את החנות שעליה חל הקופון.",
      "valid.couponStoreMatch": "אף מוצר כלול אינו שייך לחנות זו.",
      "valid.couponDiscount": "הזן סכום הנחה.",
      "valid.fixErrors": "אנא תקן את השדות המסומנים.",
      "error.generic": "משהו השתבש. נסה שוב.",
    },
  };

  function format(str, params) {
    if (!params) return str;
    return str.replace(/\{(\w+)\}/g, (m, k) => (k in params ? params[k] : m));
  }

  const I18n = {
    lang: "en",

    init() {
      const saved = localStorage.getItem("co.lang");
      const guess = (navigator.language || "en").slice(0, 2);
      this.lang = saved || (TRANSLATIONS[guess] ? guess : "en");
      this._apply();
    },

    available() {
      return Object.keys(TRANSLATIONS);
    },

    isRTL() {
      return RTL_LANGS.has(this.lang);
    },

    locale() {
      return LOCALES[this.lang] || "en-US";
    },

    t(key, params) {
      const table = TRANSLATIONS[this.lang] || TRANSLATIONS.en;
      const value = key in table ? table[key] : (TRANSLATIONS.en[key] ?? key);
      return format(value, params);
    },

    setLang(lang) {
      if (!TRANSLATIONS[lang]) return;
      this.lang = lang;
      localStorage.setItem("co.lang", lang);
      this._apply();
      document.dispatchEvent(new CustomEvent("languagechange"));
    },

    // Apply translations + direction to the static DOM.
    _apply() {
      const html = document.documentElement;
      html.lang = this.lang;
      html.dir = this.isRTL() ? "rtl" : "ltr";

      document.querySelectorAll("[data-i18n]").forEach((el) => {
        el.textContent = this.t(el.getAttribute("data-i18n"));
      });
      document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
        el.setAttribute("placeholder", this.t(el.getAttribute("data-i18n-placeholder")));
      });
      document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
        el.setAttribute("aria-label", this.t(el.getAttribute("data-i18n-aria")));
      });
      document.querySelectorAll("[data-i18n-title]").forEach((el) => {
        el.setAttribute("title", this.t(el.getAttribute("data-i18n-title")));
      });
    },
  };

  window.I18n = I18n;
  window.t = (key, params) => I18n.t(key, params);
})();
