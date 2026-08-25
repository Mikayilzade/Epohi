(function () {
  "use strict";

  // Keep explicit UI invalidation responsive, but do not let a request storm turn
  // into near-frame-rate decorator work. 32 ms caps the scheduler at roughly 30 Hz
  // while ordinary click/transition requests still settle well inside the 1 s gates.
  const MIN_FLUSH_INTERVAL_MS = 32;
  let frame = 0;
  let timer = 0;
  let lastFlushAt = 0;
  let lastReason = "startup";
  const stats = {
    requests: 0,
    flushes: 0,
    settledSignals: 0,
    actionSignals: 0,
    transitionSignals: 0,
    broadObservers: 0,
    visualSyncs: 0,
    feedbackSyncs: 0,
    strategySyncs: 0,
    playerFeedbackSyncs: 0,
    protectedFlushes: 0,
    throttledSchedules: 0
  };

  function syncStrategyUx() {
    const strategy = window.EpohiStrategyUX;
    if (!strategy || typeof strategy.refresh !== "function") return;
    strategy.refresh();
    stats.strategySyncs += 1;
  }

  function syncBasePlayerFeedback() {
    const feedback = window.EpohiPlayerFeedback;
    if (!feedback || typeof feedback.refresh !== "function") return;
    feedback.refresh();
    stats.playerFeedbackSyncs += 1;
  }

  function syncPlayerFeedback() {
    const feedback = window.EpohiPlayerFeedbackStabilization;
    if (!feedback) return;
    if (typeof feedback.ensureStableControls === "function") feedback.ensureStableControls();
    if (typeof feedback.preserveFreePlay === "function") feedback.preserveFreePlay();
    if (typeof feedback.stabilizeMovementExplanation === "function") feedback.stabilizeMovementExplanation();
    if (typeof feedback.expireSkippedJourneyEvents === "function") feedback.expireSkippedJourneyEvents();
    if (typeof feedback.addStackSelectionAcknowledgement === "function") feedback.addStackSelectionAcknowledgement();
    stats.feedbackSyncs += 1;
  }

  function flush() {
    frame = 0;
    timer = 0;
    lastFlushAt = window.performance && typeof window.performance.now === "function" ? window.performance.now() : Date.now();
    stats.flushes += 1;
    syncStrategyUx();
    syncBasePlayerFeedback();
    if (window.EpohiHumansVisuals && typeof window.EpohiHumansVisuals.decorate === "function") {
      window.EpohiHumansVisuals.decorate();
      stats.visualSyncs += 1;
    }
    if (window.EpohiContextReviewCleanup && typeof window.EpohiContextReviewCleanup.sync === "function") {
      window.EpohiContextReviewCleanup.sync();
    }
    syncPlayerFeedback();
  }

  function runExplicitFlush() {
    // RuntimeInvalidation is already the explicit lifecycle boundary for ordinary UI
    // decoration. Routing this flush through the global observer safety bridge used to
    // pause/drain/reconnect every registered MutationObserver. On mobile WebKit that
    // converted one bounded action flush into a backlog of per-observer delivery RAFs
    // that executed during the later idle/actionability window. Keep the safety bridge
    // for actual observer callbacks, but do not invoke its global quarantine here.
    flush();
  }

  function scheduleFrame() {
    timer = 0;
    if (frame) return;
    frame = window.requestAnimationFrame(runExplicitFlush);
  }

  function request(reason) {
    lastReason = reason || lastReason || "explicit";
    stats.requests += 1;
    if (frame || timer) return;

    const now = window.performance && typeof window.performance.now === "function" ? window.performance.now() : Date.now();
    const elapsed = lastFlushAt ? now - lastFlushAt : MIN_FLUSH_INTERVAL_MS;
    const remaining = Math.max(0, MIN_FLUSH_INTERVAL_MS - elapsed);
    if (remaining > 0) {
      stats.throttledSchedules += 1;
      timer = window.setTimeout(scheduleFrame, remaining);
      return;
    }
    scheduleFrame();
  }

  document.addEventListener("epohi:humans-ui-settled", function () {
    stats.settledSignals += 1;
    request("humans-ui-settled");
  });

  document.addEventListener("click", function (event) {
    stats.actionSignals += 1;
    const target = event.target && event.target.closest ? event.target : null;
    const cityModalToggle = target && target.closest("#cityBtn, [data-close=\"cityModal\"]");
    if (!cityModalToggle) request("user-action");

    // The new-game screen is rendered only after an async campaign-name lookup.
    // The immediate click RAF can therefore run before #rivalCount exists. Keep a
    // single bounded post-transition wake-up instead of restoring screenRoot polling.
    const newGame = target ? target.closest("#newGameScreenBtn") : null;
    if (newGame) {
      stats.transitionSignals += 1;
      window.setTimeout(function () {
        request("new-game-screen-post-transition");
      }, 100);
    }

    // StrategyUX captures the requested rival count on #createParty, while app.js
    // creates the base state in the same click. Always issue one semantic wake-up
    // after that event so requested rivals are materialized against the new state,
    // independent of any older coalesced frame from form interaction.
    const createParty = target ? target.closest("#createParty") : null;
    if (createParty) {
      stats.transitionSignals += 1;
      window.setTimeout(function () {
        request("new-game-created-post-transition");
      }, 0);
    }
  }, true);

  window.addEventListener("pageshow", function () { request("pageshow"); });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) request("visibility-return");
  });

  window.EpohiRuntimeInvalidation = {
    version: 12,
    request: request,
    flush: flush,
    stats: function () {
      return Object.assign({}, stats, {
        scheduled: !!(frame || timer),
        lastReason: lastReason
      });
    }
  };

  request("startup");
})();
