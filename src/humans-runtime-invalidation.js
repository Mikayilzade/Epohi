(function () {
  "use strict";

  const MIN_FLUSH_INTERVAL_MS = 24;
  const NEW_GAME_READY_RETRY_MS = 50;
  const NEW_GAME_READY_MAX_ATTEMPTS = 40;
  const inheritedSetTimeout = window.setTimeout.bind(window);
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
    transitionRetries: 0,
    broadObservers: 0,
    visualSyncs: 0,
    feedbackSyncs: 0,
    strategySyncs: 0,
    playerFeedbackSyncs: 0,
    protectedFlushes: 0,
    throttledSchedules: 0,
    legacyFeedbackTimersSuppressed: 0
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

  function runFlushProtected() {
    const safety = window.EpohiObserverSafety;
    if (safety && typeof safety.runProtected === "function") {
      stats.protectedFlushes += 1;
      safety.runProtected(flush);
      return;
    }
    flush();
  }

  function scheduleFrame() {
    timer = 0;
    if (frame) return;
    frame = window.requestAnimationFrame(runFlushProtected);
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

  function requestNewGameWhenReady(attempt) {
    if (document.getElementById("rivalCount") || attempt >= NEW_GAME_READY_MAX_ATTEMPTS) {
      request("new-game-screen-post-transition");
      return;
    }
    stats.transitionRetries += 1;
    inheritedSetTimeout(function () {
      requestNewGameWhenReady(attempt + 1);
    }, NEW_GAME_READY_RETRY_MS);
  }

  // PlayerFeedback still has one transitional document-click -> setTimeout(refresh, 0)
  // bridge. Every click is already owned below by request("user-action"), whose flush calls
  // the same refresh exactly once. Suppress only that exact legacy timer instead of turning
  // it into a second invalidation request (the broader reroute regressed runtime stability).
  window.setTimeout = function (callback, delay) {
    if (Number(delay || 0) === 0 && window.EpohiPlayerFeedback && callback === window.EpohiPlayerFeedback.refresh) {
      stats.legacyFeedbackTimersSuppressed += 1;
      return 0;
    }
    return inheritedSetTimeout.apply(window, arguments);
  };

  document.addEventListener("epohi:humans-ui-settled", function () {
    stats.settledSignals += 1;
    request("humans-ui-settled");
  });

  document.addEventListener("click", function (event) {
    stats.actionSignals += 1;
    request("user-action");

    // The new-game form is rendered after an async campaign-name/storage lookup. Wake
    // StrategyUX only when #rivalCount exists, with a short bounded probe instead of
    // restoring a broad screenRoot MutationObserver or an unbounded polling loop.
    const target = event.target && event.target.closest ? event.target.closest("#newGameScreenBtn") : null;
    if (target) {
      stats.transitionSignals += 1;
      requestNewGameWhenReady(0);
    }
  }, true);

  window.addEventListener("pageshow", function () { request("pageshow"); });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) request("visibility-return");
  });

  window.EpohiRuntimeInvalidation = {
    version: 10,
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
