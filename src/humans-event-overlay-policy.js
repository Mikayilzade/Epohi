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

    const nativeObserve = NativeObserver.prototype.observe;
    const nativeDisconnect = NativeObserver.prototype.disconnect;
    const nativeTakeRecords = NativeObserver.prototype.takeRecords;
    const nativeRaf = window.requestAnimationFrame.bind(window);
    const nativeSetTimeout = window.setTimeout.bind(window);
    const observerStates = [];
    let safetyDepth = 0;

    const stats = window.__epohiObserverSafetyStats = window.__epohiObserverSafetyStats || {
      observers: 0,
      callbacks: 0,
      records: 0,
      maxBatch: 0,
      protectedTasks: 0
    };
    if (!Number.isFinite(stats.protectedTasks)) stats.protectedTasks = 0;

    function appendPending(observerState, records) {
      if (!records || !records.length) return;
      observerState.pending = observerState.pending.concat(Array.from(records));
      if (observerState.pending.length > 400) observerState.pending = observerState.pending.slice(-400);
    }

    function pauseObservers() {
      observerStates.forEach(function (observerState) {
        if (observerState.disconnectedByClient || !observerState.native) return;
        appendPending(observerState, nativeTakeRecords.call(observerState.native));
        nativeDisconnect.call(observerState.native);
      });
    }

    function restoreObservers() {
      observerStates.forEach(function (observerState) {
        if (observerState.disconnectedByClient || !observerState.native) return;
        observerState.registrations.forEach(function (entry) {
          nativeObserve.call(observerState.native, entry.target, entry.options);
        });
        if (observerState.pending.length) observerState.scheduleDelivery();
      });
    }

    function runProtectedTask(callback, thisArg, args) {
      const outermost = safetyDepth === 0;
      if (outermost) pauseObservers();
      safetyDepth += 1;
      stats.protectedTasks += 1;
      try {
        return callback.apply(thisArg, args || []);
      } finally {
        safetyDepth -= 1;
        if (outermost) restoreObservers();
      }
    }

    // Observer callbacks in this prototype usually enqueue a requestAnimationFrame or
    // setTimeout decorator. Propagate the safety context into those queued tasks too;
    // otherwise observer A schedules a DOM write after it reconnects and observer B
    // schedules the same write back, producing the mobile 60-fps feedback loop.
    window.requestAnimationFrame = function (callback) {
      if (typeof callback !== "function" || safetyDepth <= 0) return nativeRaf(callback);
      return nativeRaf(function (time) {
        return runProtectedTask(callback, window, [time]);
      });
    };

    window.setTimeout = function (callback, delay) {
      const args = Array.prototype.slice.call(arguments, 2);
      if (typeof callback !== "function" || safetyDepth <= 0) {
        return nativeSetTimeout.apply(window, [callback, delay].concat(args));
      }
      return nativeSetTimeout(function () {
        return runProtectedTask(callback, window, args);
      }, delay);
    };

    function CoalescedMutationObserver(callback) {
      const observerState = {
        native: null,
        frame: 0,
        pending: [],
        registrations: [],
        disconnectedByClient: false,
        scheduleDelivery: null
      };

      function scheduleDelivery() {
        if (observerState.frame || observerState.disconnectedByClient || !observerState.pending.length) return;
        observerState.frame = nativeRaf(function () {
          observerState.frame = 0;
          if (observerState.disconnectedByClient || !observerState.pending.length) {
            observerState.pending = [];
            return;
          }
          const batch = observerState.pending;
          observerState.pending = [];
          stats.callbacks += 1;
          stats.records += batch.length;
          stats.maxBatch = Math.max(stats.maxBatch, batch.length);
          runProtectedTask(callback, observerState.native, [batch, observerState.native]);
        });
      }
      observerState.scheduleDelivery = scheduleDelivery;

      const native = new NativeObserver(function (records) {
        appendPending(observerState, records);
        scheduleDelivery();
      });
      observerState.native = native;
      observerStates.push(observerState);

      native.observe = function (target, options) {
        observerState.disconnectedByClient = false;
        const existing = observerState.registrations.find(function (entry) { return entry.target === target; });
        if (existing) existing.options = options;
        else observerState.registrations.push({ target: target, options: options });
        if (safetyDepth > 0) return;
        return nativeObserve.call(native, target, options);
      };
      native.disconnect = function () {
        observerState.disconnectedByClient = true;
        observerState.registrations = [];
        observerState.pending = [];
        if (observerState.frame) {
          window.cancelAnimationFrame(observerState.frame);
          observerState.frame = 0;
        }
        return nativeDisconnect.call(native);
      };
      native.takeRecords = function () {
        const records = nativeTakeRecords.call(native);
        if (observerState.pending.length) {
          const combined = observerState.pending.concat(Array.from(records || []));
          observerState.pending = [];
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
    document.addEventListener("click", function (event) {
      const target = event.target && event.target.closest ? event.target : null;
      if (target && target.closest("#cityBtn, [data-close=\"cityModal\"]")) return;
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
    version: 11,
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