/* EGregoRA Infographics — one source fold open at a time. */
(() => {
  "use strict";

  const folds = Array.from(document.querySelectorAll(
    'body[data-page="infographics"] .info-fold[name="infographic-room"]'
  ));
  if (!folds.length) return;

  const closeFolds = (except) => folds.forEach((fold) => {
    if (fold !== except) fold.removeAttribute("open");
  });

  /* `details[name]` provides native exclusive behaviour in modern browsers;
     this listener preserves it in older engines. */
  folds.forEach((fold) => fold.addEventListener("toggle", () => {
    if (fold.open) closeFolds(fold);
  }));

  const openFromHash = () => {
    if (!window.location.hash) return;
    let id;
    try { id = decodeURIComponent(window.location.hash.slice(1)); }
    catch (_) { return; }
    const fold = document.getElementById(id);
    if (!fold || !fold.classList.contains("info-fold")) return;
    closeFolds(fold);
    fold.setAttribute("open", "");
  };

  openFromHash();
  window.addEventListener("hashchange", openFromHash);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const openFold = folds.find((fold) => fold.open);
    if (!openFold) return;
    openFold.removeAttribute("open");
    const summary = openFold.querySelector("summary");
    if (summary) summary.focus();
  });
})();
