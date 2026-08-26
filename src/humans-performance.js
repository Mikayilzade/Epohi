(function () {
  "use strict";

  const startedAt = Date.now();

  function installObserverSafety() {
    if (window.__epohiCoherenceObserverSafetyInstalled) return;
    const NativeObserver = window.MutationObserver;
    if (typeof NativeObserver !== "function") return;

    const nativeObserve = NativeObserver.prototype.observe;
    const nativeDisconnect = NativeObserver.prototype.disconnect;
    const nativeTakeRecords = NativeObserver.prototype.takeRecords;
    const nativeRaf = window.requestAnimationFrame.bind(window);
    const nativeSetTimeout = window.setTimeout.bind(window);
    const nativeClearTimeout = window.clearTimeout.bind(window);
    const nativeQueueMicrotask = typeof window.queueMicrotask === "function"
      ? window.queueMicrotask.bind(window)
      : function (callback) { Promise.resolve().then(callback); };
    const observerRedeliveryDelayMs = 64;
    let activeProtectedObserver = null;

    const stats = window.__epohiObserverSafetyStats = window.__epohiObserverSafetyStats || {
      observers: 0,
      callbacks: 0,
      records: 0,
      maxBatch: 0,
      protectedTasks: 0,
      suppressedHeavy: 0,
      narrowedHeavy: 0
    };
    ["protectedTasks", "suppressedHeavy", "narrowedHeavy"].forEach(function (key) {
      if (!Number.isFinite(stats[key])) stats[key] = 0;
    });

    function appendPending(observerState, records) {
      if (!records || !records.length) return;
      observerState.pending = observerState.pending.concat(Array.from(records));
      if (observerState.pending.length > 240) observerState.pending = observerState.pending.slice(-240);
    }

    function normalizeObservation(target, options) {
      const input = Object.assign({}, options || {});
      const id = target && target.id || "";

      // Broad render listeners are transitional debt. Their useful work is driven by
      // explicit action/UI invalidation, so do not let descendant churn wake them.
      if (target === document.body && input.childList && input.subtree) {
        stats.suppressedHeavy += 1;
        return null;
      }
      if (id === "map" && input.childList) {
        stats.suppressedHeavy += 1;
        return null;
      }
      if (id === "screenRoot" && input.childList) {
        stats.suppressedHeavy += 1;
        return null;
      }
      if (id === "contextPanel" && input.childList && input.subtree) {
        stats.suppressedHeavy += 1;
        return null;
      }
      if ((id === "menuContent" || id === "wikiContent" || id === "victoryContent") && input.childList) {
        stats.suppressedHeavy += 1;
        return null;
      }

      // The city sheet is now owned by explicit app/runtime invalidation. A legacy
      // descendant observer on this surface is pure decorator polling and is the
      // remaining source of repeated open/close callback churn. Suppress only heavy
      // city-sheet registrations; semantic root-class observers are still allowed.
      if (id === "cityModal" && input.childList && input.subtree) {
        stats.suppressedHeavy += 1;
        return null;
      }

      const modalIds = new Set([
        "feedbackTreasuryModal", "strategyDiplomacyModal",
        "stabilityDecisionModal", "stabilityMajorModal", "captureChoiceModal",
        "coherenceProposalModal", "victoryModal", "wikiModal", "menuModal"
      ]);
      if (modalIds.has(id) && input.childList && input.subtree) {
        stats.narrowedHeavy += 1;
        return { attributes: true, attributeFilter: ["class"] };
      }

      return input;
    }

    function pauseObserver(observerState) {
      if (!observerState || observerState.disconnectedByClient || !observerState.native) return false;
      appendPending(observerState, nativeTakeRecords.call(observerState.native));
      nativeDisconnect.call(observerState.native);
      return true;
    }

    function restoreObserver(observerState) {
      if (!observerState || observerState.disconnectedByClient || !observerState.native) return;
      observerState.registrations.forEach(function (entry) {
        nativeObserve.call(observerState.native, entry.target, entry.options);
      });
      if (observerState.pending.length) observerState.scheduleDelivery();
    }

    function runProtectedTask(observerState, callback, thisArg, args) {
      if (typeof callback !== "function") return undefined;
      if (!observerState) {
        stats.protectedTasks += 1;
        return callback.apply(thisArg, args || []);
      }

      const outermostForObserver = observerState.protectionDepth === 0;
      const paused = outermostForObserver ? pauseObserver(observerState) : false;
      const previousActive = activeProtectedObserver;
      observerState.protectionDepth += 1;
      activeProtectedObserver = observerState;
      stats.protectedTasks += 1;
      try {
        return callback.apply(thisArg, args || []);
      } finally {
        activeProtectedObserver = previousActive;
        observerState.protectionDepth -= 1;
        if (outermostForObserver && paused) restoreObserver(observerState);
      }
    }

    window.requestAnimationFrame = function (callback) {
      if (typeof callback !== "function" || !activeProtectedObserver) return nativeRaf(callback);
      const owner = activeProtectedObserver;
      return nativeRaf(function (time) {
        return runProtectedTask(owner, callback, window, [time]);
      });
    };

    window.setTimeout = function (callback, delay) {
      const args = Array.prototype.slice.call(arguments, 2);
      if (typeof callback !== "function" || !activeProtectedObserver) {
        return nativeSetTimeout.apply(window, [callback, delay].concat(args));
      }
      const owner = activeProtectedObserver;
      return nativeSetTimeout(function () {
        return runProtectedTask(owner, callback, window, args);
      }, delay);
    };

    function CoalescedMutationObserver(callback) {
      const observerState = {
        native: null,
        deliveryScheduled: false,
        deliveryGeneration: 0,
        deliveryTimer: 0,
        lastDeliveryAt: 0,
        pending: [],
        registrations: [],
        disconnectedByClient: false,
        protectionDepth: 0,
        scheduleDelivery: null
      };

      function deliver(generation) {
        if (generation !== observerState.deliveryGeneration) return;
        observerState.deliveryScheduled = false;
        observerState.deliveryTimer = 0;
        if (observerState.disconnectedByClient || !observerState.pending.length) {
          observerState.pending = [];
          return;
        }
        const batch = observerState.pending;
        observerState.pending = [];
        observerState.lastDeliveryAt = performance.now();
        stats.callbacks += 1;
        stats.records += batch.length;
        stats.maxBatch = Math.max(stats.maxBatch, batch.length);
        runProtectedTask(observerState, callback, observerState.native, [batch, observerState.native]);
      }

      function scheduleDelivery() {
        if (observerState.deliveryScheduled || observerState.disconnectedByClient || !observerState.pending.length) return;
        observerState.deliveryScheduled = true;
        const generation = ++observerState.deliveryGeneration;
        const elapsed = observerState.lastDeliveryAt ? performance.now() - observerState.lastDeliveryAt : observerRedeliveryDelayMs;
        const delay = Math.max(0, observerRedeliveryDelayMs - elapsed);
        if (delay > 0) {
          observerState.deliveryTimer = nativeSetTimeout(function () {
            deliver(generation);
          }, Math.ceil(delay));
          return;
        }
        nativeQueueMicrotask(function () {
          deliver(generation);
        });
      }
      observerState.scheduleDelivery = scheduleDelivery;

      const native = new NativeObserver(function (records) {
        appendPending(observerState, records);
        scheduleDelivery();
      });
      observerState.native = native;

      native.observe = function (target, options) {
        observerState.disconnectedByClient = false;
        const normalized = normalizeObservation(target, options);
        if (!normalized) return;
        const existing = observerState.registrations.find(function (entry) { return entry.target === target; });
        if (existing) existing.options = normalized;
        else observerState.registrations.push({ target: target, options: normalized });
        if (observerState.protectionDepth > 0) return;
        return nativeObserve.call(native, target, normalized);
      };

      native.disconnect = function () {
        observerState.disconnectedByClient = true;
        observerState.registrations = [];
        observerState.pending = [];
        observerState.deliveryScheduled = false;
        observerState.deliveryGeneration += 1;
        if (observerState.deliveryTimer) {
          nativeClearTimeout(observerState.deliveryTimer);
          observerState.deliveryTimer = 0;
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
    window.EpohiObserverSafety = {
      version: 10,
      mode: "observer-local",
      stats: stats,
      runProtected: function (callback) {
        if (typeof callback !== "function") return undefined;
        return runProtectedTask(activeProtectedObserver, callback, window, []);
      }
    };
  }

  function installMobileGpuGuard() {
    if (document.getElementById("epohiMobileGpuGuard")) return;
    const style = document.createElement("style");
    style.id = "epohiMobileGpuGuard";
    style.textContent = "@media(max-width:720px){*{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}.flow-event-toast{transition:none!important}}";
    document.head.appendChild(style);
  }

  installObserverSafety();
  installMobileGpuGuard();

  window.EpohiPerformance = {
    version: 11,
    mode: "observer-local-safety",
    snapshot: function () {
      const observerStats = window.__epohiObserverSafetyStats || {};
      return {
        mode: "observer-local-safety",
        uptimeMs: Date.now() - startedAt,
        waterTiles: document.querySelectorAll("#map .tile.water").length,
        routeBadges: document.querySelectorAll("#map .route-badge").length,
        observerCallbacks: Number(observerStats.callbacks || 0),
        observerRecords: Number(observerStats.records || 0),
        observerProtectedTasks: Number(observerStats.protectedTasks || 0),
        observerSuppressedHeavy: Number(observerStats.suppressedHeavy || 0),
        observerNarrowedHeavy: Number(observerStats.narrowedHeavy || 0)
      };
    }
  };
})();
