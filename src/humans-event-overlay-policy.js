(function () {
  "use strict";

  let timer = 0;
  let handling = false;

  function state() {
    const value = typeof window.__epohiDebug === "function" ? window.__epohiDebug() : null;
    return value && value.state ? value.state : null;
  }

  function toast(text) {
    if (!text) return;
    const victory = document.getElementById("victoryModal");
    const decision = document.getElementById("stabilityDecisionModal");
    if ((victory && victory.classList.contains("show")) || (decision && decision.classList.contains("show"))) return;
    const node = document.getElementById("flowEventToast");
    if (!node) return;
    node.textContent = text;
    node.classList.add("show");
    window.clearTimeout(timer);
    timer = window.setTimeout(function () { node.classList.remove("show"); }, 1800);
  }

  function normalize() {
    if (handling) return;
    handling = true;
    try {
      const modal = document.getElementById("stabilityMajorModal");
      if (!modal || !modal.classList.contains("show")) return;
      const content = document.getElementById("stabilityMajorContent");
      const text = content ? content.textContent.trim() : "";
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
      const gs = state();
      if (gs && window.EpohiDiplomacyEventFlow) window.EpohiDiplomacyEventFlow.syncChronicle(gs);
      toast(text);
    } finally {
      handling = false;
    }
  }

  function install() {
    const style = document.createElement("style");
    style.id = "eventOverlayPolicyStyles";
    style.textContent = "#stabilityMajorModal{display:none!important;pointer-events:none!important}#feedbackWorldEvents{display:none!important;pointer-events:none!important}";
    document.head.appendChild(style);
    const modal = document.getElementById("stabilityMajorModal");
    if (modal) new MutationObserver(normalize).observe(modal, { attributes: true, attributeFilter: ["class"] });
    document.addEventListener("click", function () { window.setTimeout(normalize, 0); });
    normalize();
  }

  window.EpohiEventOverlayPolicy = { version: 1, normalize: normalize };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();
