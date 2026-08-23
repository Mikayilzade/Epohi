(function () {
  "use strict";

  let frame = 0;
  let lastReason = "startup";
  const inheritedSetTimeout = window.setTimeout.bind(window);
  const stats = {
    requests: 0,
    flushes: 0,
    settledSignals: 0,
    actionSignals: 0,
    transitionSignals: 0,
    legacyFeedbackReroutes: 0,
    broadObservers: 0,
    visualSyncs: 0,
    feedbackSyncs: 0,
    strategySyncs: 0,
    playerFeedbackSyncs: 0,
    protectedFlushes: 0
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

  function request(reason) {
    lastReason = reason || lastReason || "explicit";
    stats.requests += 1;
    if (frame) return;
    frame = window.requestAnimationFrame(runFlushProtected);
  }

  // PlayerFeedback still contains one transitional generic click -> setTimeout(refresh, 0)
  // scheduler. Route only that exact callback through the central coalesced owner so a
  // context button is not recreated while the same user action is trying to activate it.
  // Other timers retain the observer-safety wrapper installed earlier in script order.
  window.setTimeout = function (callback, delay) {
    if (Number(delay || 0) === 0 && window.EpohiPlayerFeedback && callback === window.EpohiPlayerFeedback.refresh) {
      stats.legacyFeedbackReroutes += 1;
      request("legacy-player-feedback-refresh");
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

    // The new-game screen is rendered only after an async campaign-name lookup.
    // The immediate click RAF can therefore run before #rivalCount exists. Keep a
    // single bounded post-transition wake-up instead of restoring screenRoot polling.
    const target = event.target && event.target.closest ? event.target.closest("#newGameScreenBtn") : null;
    if (target) {
      stats.transitionSignals += 1;
      window.setTimeout(function () {
        request("new-game-screen-post-transition");
      }, 100);
    }
  }, true);

  window.addEventListener("pageshow", function () { request("pageshow"); });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) request("visibility-return");
  });

  window.EpohiRuntimeInvalidation = {
    version: 8,
    request: request,
    flush: flush,
    stats: function () {
      return Object.assign({}, stats, {
        scheduled: !!frame,
        lastReason: lastReason
      });
    }
  };

  request("startup");
})();