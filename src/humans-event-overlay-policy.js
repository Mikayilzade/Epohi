(function () {
  "use strict";

  let timer = 0;
  let handling = false;
  let lastTurn = "";

  function state() {
    const value = typeof window.__epohiDebug === "function" ? window.__epohiDebug() : null;
    return value && value.state ? value.state : null;
  }

  function dismissToast() {
    window.clearTimeout(timer);
    const node = document.getElementById("flowEventToast");
    if (node) node.classList.remove("show");
  }

  function blockingOverlay() {
    return ["victoryModal", "stabilityDecisionModal", "coherenceProposalModal", "captureChoiceModal"].some(function (id) {
      const node = document.getElementById(id);
      return node && node.classList.contains("show");
    });
  }

  function toast(text) {
    if (!text || blockingOverlay()) return;
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
      if (blockingOverlay()) dismissToast();
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

  function handleTurnChange() {
    const turn = document.getElementById("turnValue");
    const current = turn ? turn.textContent.trim() : "";
    if (lastTurn && current && current !== lastTurn) dismissToast();
    lastTurn = current;
  }

  function install() {
    const style = document.createElement("style");
    style.id = "eventOverlayPolicyStyles";
    style.textContent = [
      "#stabilityMajorModal{display:none!important;pointer-events:none!important}",
      "#feedbackWorldEvents{display:none!important;pointer-events:none!important}",
      "body:has(#coherenceProposalModal.show) #flowEventToast,body:has(#captureChoiceModal.show) #flowEventToast,body:has(#stabilityDecisionModal.show) #flowEventToast{opacity:0!important;pointer-events:none!important}",
      "body:has(#stabilityDecisionModal.show) #coherenceProposalModal,body:has(#captureChoiceModal.show) #coherenceProposalModal{display:none!important;pointer-events:none!important}"
    ].join("");
    document.head.appendChild(style);
    const modal = document.getElementById("stabilityMajorModal");
    if (modal) new MutationObserver(normalize).observe(modal, { attributes: true, attributeFilter: ["class"] });
    const turn = document.getElementById("turnValue");
    if (turn) {
      lastTurn = turn.textContent.trim();
      new MutationObserver(handleTurnChange).observe(turn, { childList: true, characterData: true, subtree: true });
    }
    new MutationObserver(function () {
      if (blockingOverlay()) dismissToast();
    }).observe(document.body, { attributes: true, attributeFilter: ["class"], subtree: true });
    document.addEventListener("click", function () { window.setTimeout(normalize, 0); });
    normalize();
  }

  window.EpohiEventOverlayPolicy = { version: 3, normalize: normalize, dismissToast: dismissToast, handleTurnChange: handleTurnChange, blockingOverlay: blockingOverlay };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();
