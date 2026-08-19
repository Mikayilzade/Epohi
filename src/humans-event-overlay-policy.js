(function () {
  "use strict";

  let timer = 0;
  let handling = false;
  let lastTurn = "";
  let higherPriorityWasOpen = false;

  function state() {
    const value = typeof window.__epohiDebug === "function" ? window.__epohiDebug() : null;
    return value && value.state ? value.state : null;
  }

  function installObserverSafety() {
    if (window.__epohiCoherenceObserverSafetyInstalled) return;
    const NativeObserver = window.MutationObserver;
    if (typeof NativeObserver !== "function") return;

    const stats = window.__epohiObserverSafetyStats = window.__epohiObserverSafetyStats || {
      observers: 0,
      callbacks: 0,
      records: 0,
      maxBatch: 0
    };

    function CoalescedMutationObserver(callback) {
      let frame = 0;
      let pending = [];
      let registrations = [];
      let disconnectedByClient = false;
      const native = new NativeObserver(function (records) {
        if (records && records.length) {
          pending = pending.concat(Array.from(records));
          if (pending.length > 400) pending = pending.slice(-400);
        }
        if (frame) return;
        frame = window.requestAnimationFrame(function () {
          frame = 0;
          if (disconnectedByClient || !pending.length) {
            pending = [];
            return;
          }
          const batch = pending;
          pending = [];
          stats.callbacks += 1;
          stats.records += batch.length;
          stats.maxBatch = Math.max(stats.maxBatch, batch.length);

          // Decorator observers in the prototype often update the same subtree they watch.
          // Native MutationObserver would immediately schedule another callback for those
          // writes, which can become a permanent 60 fps feedback loop on mobile Safari.
          // Temporarily detach this observer while its own callback runs, then restore its
          // registrations. External mutations are still observed normally afterwards.
          NativeObserver.prototype.disconnect.call(native);
          try {
            callback(batch, native);
          } finally {
            if (!disconnectedByClient) {
              registrations.forEach(function (entry) {
                NativeObserver.prototype.observe.call(native, entry.target, entry.options);
              });
            }
          }
        });
      });

      const nativeObserve = NativeObserver.prototype.observe;
      const nativeDisconnect = NativeObserver.prototype.disconnect;
      const nativeTakeRecords = NativeObserver.prototype.takeRecords;

      native.observe = function (target, options) {
        disconnectedByClient = false;
        const existing = registrations.find(function (entry) { return entry.target === target; });
        if (existing) existing.options = options;
        else registrations.push({ target: target, options: options });
        return nativeObserve.call(native, target, options);
      };
      native.disconnect = function () {
        disconnectedByClient = true;
        registrations = [];
        pending = [];
        if (frame) {
          window.cancelAnimationFrame(frame);
          frame = 0;
        }
        return nativeDisconnect.call(native);
      };
      native.takeRecords = function () {
        const records = nativeTakeRecords.call(native);
        if (pending.length) {
          const combined = pending.concat(Array.from(records || []));
          pending = [];
          return combined;
        }
        return records;
      };
      stats.observers += 1;
      return native;
    }

    CoalescedMutationObserver.prototype = NativeObserver.prototype;
    Object.setPrototypeOf(CoalescedMutationObserver, NativeObserver);
    window.MutationObserver = CoalescedMutationObserver;
    window.__epohiCoherenceObserverSafetyInstalled = true;
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
    const higherPriorityOpen = victoryOpen || captureOpen || !!urgent;
    const previouslyBlocked = higherPriorityWasOpen;

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
    }

    higherPriorityWasOpen = higherPriorityOpen;

    if (!higherPriorityOpen && previouslyBlocked && proposal && window.EpohiDiplomacyCoherence && typeof window.EpohiDiplomacyCoherence.renderProposal === "function") {
      window.setTimeout(function () {
        const next = state();
        if (next && !pendingDecision(next)) window.EpohiDiplomacyCoherence.renderProposal(next);
      }, 0);
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
      "#stabilityDecisionModal{z-index:186!important;pointer-events:auto!important;align-items:center!important;justify-content:center!important;padding:10px!important}",
      "#stabilityDecisionModal .sheet{pointer-events:auto!important;position:relative!important;top:auto!important;right:auto!important;left:auto!important;width:min(560px,calc(100vw - 20px))!important;max-height:min(84dvh,720px)!important;margin:auto!important}",
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

  installObserverSafety();

  window.EpohiEventOverlayPolicy = {
    version: 9,
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