(function () {
  "use strict";

  let modal = null;

  function state() {
    const value = typeof window.__epohiDebug === "function" ? window.__epohiDebug() : null;
    return value && value.state ? value.state : null;
  }

  function escapeText(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function ensureModal() {
    if (modal && document.body.contains(modal)) return modal;
    modal = document.getElementById("flowChronicleModal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "flowChronicleModal";
    modal.className = "modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "flowChronicleTitle");
    modal.innerHTML = '<section class="sheet flow-chronicle-sheet"><header class="sheet-head"><h2 id="flowChronicleTitle">Летопись</h2><button type="button" class="close-btn" data-flow-chronicle-close aria-label="Закрыть">×</button></header><div id="flowChronicleContent" class="sheet-scroll"></div></section>';
    document.body.appendChild(modal);
    modal.querySelector("[data-flow-chronicle-close]").addEventListener("click", function () { modal.classList.remove("show"); });
    return modal;
  }

  function open() {
    const gs = state();
    if (!gs) return false;
    if (window.EpohiDiplomacyEventFlow) window.EpohiDiplomacyEventFlow.syncChronicle(gs);
    const view = ensureModal();
    const content = view.querySelector("#flowChronicleContent");
    const history = Array.isArray(gs.history) ? gs.history : [];
    content.innerHTML = history.length
      ? '<div class="flow-chronicle-list">' + history.map(function (line) { return '<article>' + escapeText(line) + '</article>'; }).join("") + '</div>'
      : '<div class="inline-note">Летопись пока пуста.</div>';
    view.classList.add("show");
    return true;
  }

  function install() {
    ensureModal();
    const style = document.createElement("style");
    style.id = "flowChronicleStyles";
    style.textContent = ".flow-chronicle-sheet{max-width:720px}.flow-chronicle-list{display:grid;gap:7px}.flow-chronicle-list article{padding:9px 11px;border-radius:10px;background:rgba(79,99,68,.1);border-left:3px solid rgba(160,128,67,.55);color:#4d5548;font-size:12px;line-height:1.35}@media(max-width:520px){.flow-chronicle-list article{font-size:11px;padding:8px 9px}}";
    document.head.appendChild(style);
    if (window.EpohiHumansJourneyUI && typeof window.EpohiHumansJourneyUI.open === "function") {
      if (!window.EpohiHumansJourneyUI.openSaga) window.EpohiHumansJourneyUI.openSaga = window.EpohiHumansJourneyUI.open;
      window.EpohiHumansJourneyUI.openChronicle = open;
      window.EpohiHumansJourneyUI.open = open;
    }
  }

  window.EpohiChronicleUI = { version: 1, open: open, ensureModal: ensureModal };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();
