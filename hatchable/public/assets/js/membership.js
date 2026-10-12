/* Membership and gifts — the slip for standing behind the work.
   Shared by both houses; nothing here knows which one it is on.

   Both forms go to /api/checkout and end on Stripe's own page, so no card
   number ever reaches this site. The gate-word is read from the captcha box
   site.js already drew, and is single-use — so after any attempt, pass or
   fail, a fresh one is asked for. */
(() => {
  "use strict";

  const gate = (which) => {
    const box = document.querySelector('[data-captcha="' + which + '"]');
    const input = box && box.querySelector("[data-captcha-input]");
    return {
      token: box ? box.dataset.token || "" : "",
      answer: input ? input.value : "",
      renew() { if (window.EGCaptchaRenew) window.EGCaptchaRenew(which); if (input) input.value = ""; }
    };
  };

  const tell = (line, msg) => {
    if (!line) return;
    if (msg) { line.textContent = msg; line.hidden = false; } else { line.hidden = true; }
  };

  /* ---------------------------------------------------------- membership */
  const joinForm = document.getElementById("join-form");
  const joinError = document.getElementById("join-error");
  const joinPicked = document.getElementById("join-picked");
  let picked = null;

  document.querySelectorAll("[data-join]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest("[data-tier]");
      if (!card) return;
      picked = {
        tier: card.dataset.tier,
        name: card.dataset.name,
        amount: Number(card.dataset.amount) || 0
      };
      document.querySelectorAll("[data-join]").forEach((b) => b.classList.remove("is-picked"));
      btn.classList.add("is-picked");
      tell(joinPicked, picked.name + " \u00b7 \u00a3" + picked.amount +
        " \u2014 read the gate-word, then press Join.");
      tell(joinError, null);
      const input = document.querySelector('[data-captcha="join"] [data-captcha-input]');
      if (input) input.focus();
    });
  });

  if (joinForm) {
    /* The button is in the page, not built here: a form with no submit button
       is unreachable without script, and says so to anyone auditing it. */
    const go = document.getElementById("join-submit");
    if (!go) return;

    joinForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      tell(joinError, null);
      if (!picked) { tell(joinError, "Choose a tier above first."); return; }
      const g = gate("join");
      const email = String(joinForm.email.value || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        tell(joinError, "A working email address, so the membership has somewhere to live.");
        return;
      }
      if (!g.answer) { tell(joinError, "Read the gate-word and type it in."); return; }

      go.disabled = true;
      go.textContent = "Opening Stripe\u2026";
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "checkout", kind: "membership", tier: picked.tier,
            name: String(joinForm.name.value || "").trim(), email,
            captcha_token: g.token, captcha: g.answer })
        });
        const d = await res.json().catch(() => ({}));
        if (res.ok && d.ok && d.url) { window.location.href = d.url; return; }
        if (d.not_configured) {
          tell(joinError, "Card payment is not switched on at this house yet. " +
            "Write to shakradragon@gmail.com and it will be arranged by hand.");
        } else {
          tell(joinError, d.error || "The payment page could not be opened.");
        }
        if (d.captcha) g.renew();
      } catch {
        tell(joinError, "The payment page could not be opened. Nothing has been charged.");
        g.renew();
      }
      go.disabled = false;
      go.textContent = "Join";
    });
  }

  /* --------------------------------------------------------------- gifts */
  const giftForm = document.getElementById("gift-form");
  if (!giftForm) return;
  const giftError = document.getElementById("gift-error");
  const giftSubmit = document.getElementById("gift-submit");
  const amount = giftForm.querySelector('[name="amount"]');

  const repaint = () => {
    const v = Math.round(Number(amount && amount.value) || 0);
    if (giftSubmit) {
      giftSubmit.textContent = v >= 1 ? "Give \u00a3" + v + " by card" : "Give by card";
    }
  };
  if (amount) amount.addEventListener("input", repaint);
  repaint();

  giftForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    tell(giftError, null);
    const g = gate("gift");
    const v = Math.round(Number(amount && amount.value) || 0);
    const email = String(giftForm.email.value || "").trim();

    if (v < 1 || v > 5000) {
      tell(giftError, "A gift of between \u00a31 and \u00a35000."); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      tell(giftError, "A working email address, so the thanks can find you."); return;
    }
    if (!g.answer) { tell(giftError, "Read the gate-word and type it in."); return; }

    giftSubmit.disabled = true;
    giftSubmit.textContent = "Opening Stripe\u2026";
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "checkout", kind: "donation", amount: v, email,
          name: String(giftForm.name.value || "").trim(),
          message: String(giftForm.message.value || "").trim(),
          captcha_token: g.token, captcha: g.answer
        })
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.ok && d.url) { window.location.href = d.url; return; }
      if (d.not_configured) {
        tell(giftError, "Card payment is not switched on at this house yet. " +
          "Write to shakradragon@gmail.com and it will be arranged by hand.");
      } else {
        tell(giftError, d.error || "The payment page could not be opened.");
      }
      if (d.captcha) g.renew();
    } catch {
      tell(giftError, "The payment page could not be opened. Nothing has been charged.");
      g.renew();
    }
    giftSubmit.disabled = false;
    repaint();
  });
})();
