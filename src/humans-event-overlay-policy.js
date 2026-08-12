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

  function dismissBaseToast() {
    const node = document.getElementById("toast");
    if (node) node.classList.remove("show");
  }

  function pendingDecision(gs) {
    return gs && (gs.urgentDecisions || []).find(function (item) { return item.status === "pending"; }) || null;
  }

  function blockingOverlay() {
    return ["victoryModal", "captureChoiceModal", "stabilityDecisionModal", "coherenceProposalModal"].some(function (id) {
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

  function enforcePriority() {
    const gs = state();
    if (!gs) return;
    const victory = document.getElementById("victoryModal");
    const capture = document.getElementById("captureChoiceModal");
    const decision = document.getElementById("stabilityDecisionModal");
    const proposal = document.getElementById("coherenceProposalModal");
    const urgent = pendingDecision(gs);
    const victoryOpen = !!(victory && victory.classList.contains("show"));
    const captureOpen = !!(capture && capture.classList.contains("show"));

    const indicator = document.getElementById("urgentDecisionIndicator");
    if (indicator) {
      indicator.classList.remove("show");
      indicator.hidden = true;
      indicator.setAttribute("aria-hidden", "true");
    }

    if (!urgent && decision) decision.classList.remove("show");

    if (victoryOpen) {
      if (capture) capture.classList.remove("show");
      if (decision) decision.classList.remove("show");
      if (proposal) proposal.classList.remove("show");
    } else if (captureOpen) {
      if (decision) decision.classList.remove("show");
      if (proposal) proposal.classList.remove("show");
    } else if (urgent) {
      if (decision) decision.classList.add("show");
      if (proposal) proposal.classList.remove("show");
    } else if (proposal && window.EpohiDiplomacyCoherence && typeof window.EpohiDiplomacyCoherence.renderProposal === "function") {
      window.EpohiDiplomacyCoherence.renderProposal(gs);
    }

    if (blockingOverlay()) {
      dismissToast();
      dismissBaseToast();
    }
  }

  function bindPriorityObservers() {
    ["victoryModal", "captureChoiceModal", "stabilityDecisionModal", "coherenceProposalModal"].forEach(function (id) {
      const node = document.getElementById(id);
      if (!node || node.dataset.overlayPolicyObserved === "1") return;
      node.dataset.overlayPolicyObserved = "1";
      new MutationObserver(function () {
        window.setTimeout(enforcePriority, 0);
      }).observe(node, { attributes:true, attributeFilter:["class"] });
    });
  }

  function handleTurnChange() {
    const turn = document.getElementById("turnValue");
    const current = turn ? turn.textContent.trim() : "";
    if (lastTurn && current && current !== lastTurn) dismissToast();
    lastTurn = current;
    window.setTimeout(function () {
      bindPriorityObservers();
      enforcePriority();
    }, 0);
  }

  function protectMandatoryDecision(event) {
    const gs = state();
    if (!pendingDecision(gs)) return;
    const decision = document.getElementById("stabilityDecisionModal");
    if (!decision || !decision.classList.contains("show")) return;
    const close = event.target.closest && event.target.closest('[data-stability-close="decision"]');
    const backdrop = event.target === decision;
    if (!close && !backdrop) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  function install() {
    const style = document.createElement("style");
    style.id = "eventOverlayPolicyStyles";
    style.textContent = [
      "#stabilityMajorModal{display:none!important;pointer-events:none!important}",
      "#feedbackWorldEvents{display:none!important;pointer-events:none!important}",
      "#urgentDecisionIndicator{display:none!important}",
      "#coherenceProposalModal{z-index:184!important}",
      "#captureChoiceModal{z-index:185!important}",
      "#stabilityDecisionModal{z-index:186!important}",
      "#victoryModal{z-index:187!important}",
      "#stabilityDecisionModal [data-stability-close=\"decision\"]{display:none!important}"
    ].join("");
    document.head.appendChild(style);
    const modal = document.getElementById("stabilityMajorModal");
    if (modal) new MutationObserver(normalize).observe(modal, { attributes: true, attributeFilter: ["class"] });
    const turn = document.getElementById("turnValue");
    if (turn) {
      lastTurn = turn.textContent.trim();
      new MutationObserver(handleTurnChange).observe(turn, { childList: true, characterData: true, subtree: true });
    }
    document.addEventListener("click", protectMandatoryDecision, true);
    document.addEventListener("click", function () {
      window.setTimeout(function () {
        normalize();
        bindPriorityObservers();
        enforcePriority();
      }, 0);
    });
    window.setTimeout(function () {
      bindPriorityObservers();
      enforcePriority();
    }, 0);
    normalize();
  }

  window.EpohiEventOverlayPolicy = {
    version: 4,
    normalize: normalize,
    dismissToast: dismissToast,
    handleTurnChange: handleTurnChange,
    blockingOverlay: blockingOverlay,
    enforcePriority: enforcePriority,
    bindPriorityObservers: bindPriorityObservers
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();
