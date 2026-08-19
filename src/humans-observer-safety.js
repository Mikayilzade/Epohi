(function () {
  "use strict";

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
  window.EpohiObserverSafety = { version: 2, stats: stats };
})();