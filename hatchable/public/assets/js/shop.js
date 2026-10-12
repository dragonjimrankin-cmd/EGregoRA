/* The shop's order slip, shared by both houses.
   The page is the shelf; this script is the slip, and the two ways to send
   it: written down for a human to follow up, or paid by card through
   Stripe. The page decides nothing about payment, and neither does this. */
(() => {
  "use strict";

  const drawer = document.getElementById("shop-drawer");
  if (!drawer) return;
  const card = drawer.querySelector(".shop-drawer-card");
  const itemLine = document.getElementById("shop-drawer-item");
  const form = document.getElementById("shop-form");
  const errorLine = document.getElementById("shop-form-error");
  const done = document.getElementById("shop-form-done");
  const doneText = document.getElementById("shop-form-done-text");
  const submit = document.getElementById("shop-submit");

  const products = {};
  document.querySelectorAll(".shop-card").forEach((el) => {
    products[el.dataset.key] = {
      name: el.dataset.name,
      price: Number(el.dataset.price) || 0
    };
  });

  let current = null;
  let lastFocus = null;

  const totalLine = () => {
    if (!current) return "";
    const qty = Number(form.qty && form.qty.value) || 1;
    const total = current.price * qty;
    return ` \u00b7 ${current.price ? "\u00a3" + current.price + " each" : ""} \u00b7 total \u00a3${total}`;
  };

  function refreshItem() {
    if (!current) return;
    itemLine.textContent = current.name + totalLine();
  }

  function show(err) {
    if (err) {
      errorLine.textContent = err;
      errorLine.hidden = false;
    } else {
      errorLine.hidden = true;
    }
  }

  function open(key) {
    const p = products[key];
    if (!p) return;
    current = Object.assign({}, p, { key: key });
    form.hidden = false;
    done.hidden = true;
    show(null);
    refreshItem();
    lastFocus = document.activeElement;
    drawer.hidden = false;
    document.body.style.overflow = "hidden";
    const nameInput = form.querySelector('input[name="name"]');
    if (nameInput) nameInput.focus();
  }

  function close() {
    drawer.hidden = true;
    document.body.style.overflow = "";
    current = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* The card door is built here rather than marked up, so the same script
     works on both houses' shop pages without either needing new markup. */
  const pay = document.createElement("button");
  pay.type = "button";
  pay.id = "shop-pay";
  pay.className = (submit && submit.className) || "btn";
  pay.textContent = "Pay by card";
  if (submit && submit.parentNode) submit.parentNode.insertBefore(pay, submit.nextSibling);

  document.querySelectorAll("[data-order]").forEach((btn) => {
    btn.addEventListener("click", () => open(btn.dataset.order));
  });
  const cancel = document.getElementById("shop-cancel");
  if (cancel) cancel.addEventListener("click", close);
  const doneClose = document.getElementById("shop-done-close");
  if (doneClose) doneClose.addEventListener("click", close);
  drawer.addEventListener("click", (e) => { if (e.target === drawer) close(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !drawer.hidden) close();
  });
  if (form.qty) form.qty.addEventListener("change", refreshItem);

  /* The two doors ask for the same things, so they are checked once. */
  function read() {
    const captchaBox = drawer.querySelector('[data-captcha="shop"]');
    const captchaInput = drawer.querySelector("[data-captcha-input]");
    return {
      name: String(form.name.value || "").trim(),
      email: String(form.email.value || "").trim(),
      qty: Math.round(Number(form.qty.value)) || 1,
      notes: String(form.notes.value || "").trim(),
      captcha_token: captchaBox ? captchaBox.dataset.token || "" : "",
      captcha: captchaInput ? captchaInput.value : ""
    };
  }

  function fillIn() {
    if (!current) { show("Choose a thing first."); return false; }
    const f = read();
    if (f.name.length < 2) { show("A name, so the order has one."); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) {
      show("A working email address, or the confirmation cannot find you."); return false;
    }
    return true;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    show(null);
    const name = String(form.name.value || "").trim();
    const email = String(form.email.value || "").trim();
    const qty = Math.round(Number(form.qty.value)) || 1;
    const notes = String(form.notes.value || "").trim();
    const captchaBox = drawer.querySelector('[data-captcha="shop"]');
    const captchaInput = drawer.querySelector('[data-captcha-input]');

    if (!fillIn()) return;

    submit.disabled = true;
    submit.textContent = "Sending\u2026";
    try {
      const res = await fetch("/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "order",
          key: current.key,
          name, email, qty, notes,
          captcha_token: captchaBox ? captchaBox.dataset.token || "" : "",
          captcha: captchaInput ? captchaInput.value : ""
        })
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.ok) {
        form.hidden = true;
        done.hidden = false;
        doneText.textContent = "Order " + d.ref + " is written to the ledger. The confirmation email " +
          "carries the payment link; nothing is charged until you follow it.";
        form.name.value = "";
        form.email.value = "";
        form.notes.value = "";
        form.qty.value = "1";
      } else if (d.captcha && window.EGCaptchaRenew) {
        window.EGCaptchaRenew("shop");
        show(d.error || "Read the gate-word again.");
      } else {
        show(d.error || "The ledger could not be reached. Try again in a moment.");
      }
    } catch {
      show("The ledger could not be reached. Try again in a moment.");
    } finally {
      submit.disabled = false;
      submit.textContent = "Send the order";
    }
  });

  /* Paying by card. The order is written to the ledger first and Stripe is
     asked afterwards, so nothing is lost if the customer closes the tab; and
     no card number ever reaches this site \u2014 Stripe's own page takes it. */
  pay.addEventListener("click", async () => {
    show(null);
    if (!fillIn()) return;
    const f = read();

    pay.disabled = true;
    if (submit) submit.disabled = true;
    pay.textContent = "Opening the payment page\u2026";
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.assign({
          action: "checkout", kind: "shop", key: current.key
        }, f))
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.ok && d.url) {
        pay.textContent = "Taking you to Stripe\u2026";
        window.location.href = d.url;
        return;   /* leaving the page; leave the button as it is */
      }
      if (d.not_configured) {
        show("Card payment is not switched on at this house yet. Send the order below " +
             "and the confirmation will carry a payment link.");
      } else if (d.captcha && window.EGCaptchaRenew) {
        window.EGCaptchaRenew("shop");
        show(d.error || "Read the gate-word again.");
      } else {
        show(d.error || "The payment page could not be opened. Nothing has been charged.");
      }
    } catch {
      show("The payment page could not be opened. Nothing has been charged.");
    }
    pay.disabled = false;
    if (submit) submit.disabled = false;
    pay.textContent = "Pay by card";
  });
})();