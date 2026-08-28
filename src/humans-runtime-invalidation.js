(function () {
  "use strict";

  // Keep explicit UI invalidation responsive, but do not let a request storm turn
  // into near-frame-rate decorator work. 36 ms caps the scheduler below 28 Hz and,
  // unlike 32 ms, cannot mathematically produce 13 flushes inside a 400 ms storm
  // when the first flush lands immediately. Ordinary actions still settle well
  // inside the 1 s actionability gates.
  const MIN_FLUSH_INTERVAL_MS = 36;
  let frame = 0;
  let timer = 0;
  let contextTailFrame = 0;
  let lastFlushAt = 0;
  let lastReason = "startup";
  const stats = {
    requests: 0,
    flushes: 0,
    settledSignals: 0,
    actionSignals: 0,
    tilePointerSignals: 0,
    transitionSignals: 0,
    broadObservers: 0,
    visualSyncs: 0,
    feedbackSyncs: 0,
    strategySyncs: 0,
    playerFeedbackSyncs: 0,
    pathingSyncs: 0,
    contextTailSyncs: 0,
    protectedFlushes: 0,
    throttledSchedules: 0
  };

  function strategyIdentitySignature(gs) {
    if (!gs) return "";
    const rivals = (gs.rivals || []).map(function (civ) {
      return [
        civ.civilizationId || "",
        civ.cultureKey || "",
        civ.name || "",
        civ.color || "",
        civ.darkColor || "",
        civ.symbol || "",
        civ.relation || "",
        civ.diplomacyCampaignApplied ? 1 : 0,
        (civ.cities || []).map(function (city) {
          return [city.id || "", city.name || "", city.cultureNamed ? 1 : 0];
        })
      ];
    });
    return JSON.stringify([gs.playerIdentity ? 1 : 0, rivals]);
  }

  function syncStrategyUx() {
    const strategy = window.EpohiStrategyUX;
    if (!strategy || typeof strategy.refresh !== "function") return false;
    const debug = typeof window.__epohiDebug === "function" ? window.__epohiDebug() : null;
    const gs = debug && debug.state ? debug.state : null;
    const before = strategyIdentitySignature(gs);
    strategy.refresh();
    stats.strategySyncs += 1;
    return before !== strategyIdentitySignature(gs);
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

  function syncPathingUi() {
    const pathing = window.EpohiHumansPathingUI;
    if (!pathing || typeof pathing.refresh !== "function") return;
    pathing.refresh();
    stats.pathingSyncs += 1;
  }

  function scheduleContextTailSync() {
    if (contextTailFrame) {
      window.cancelAnimationFrame(contextTailFrame);
      contextTailFrame = 0;
    }
    contextTailFrame = window.requestAnimationFrame(function () {
      contextTailFrame = window.requestAnimationFrame(function () {
        contextTailFrame = 0;
        const cleanup = window.EpohiContextReviewCleanup;
        if (!cleanup || typeof cleanup.sync !== "function") return;
        cleanup.sync();
        stats.contextTailSyncs += 1;
      });
    });
  }

  function flush() {
    frame = 0;
    timer = 0;
    lastFlushAt = window.performance && typeof window.performance.now === "function" ? window.performance.now() : Date.now();
    stats.flushes += 1;
    const strategyQueuedIdentityFollowup = syncStrategyUx();
    syncBasePlayerFeedback();
    if (window.EpohiHumansVisuals && typeof window.EpohiHumansVisuals.decorate === "function") {
      window.EpohiHumansVisuals.decorate();
      stats.visualSyncs += 1;
    }
    if (window.EpohiContextReviewCleanup && typeof window.EpohiContextReviewCleanup.sync === "function") {
      window.EpohiContextReviewCleanup.sync();
    }
    syncPlayerFeedback();
    syncPathingUi();
    if (strategyQueuedIdentityFollowup) scheduleContextTailSync();
  }

  function runExplicitFlush() {
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

  function emitSettledWhenStateReady(source) {
    const debug = typeof window.__epohiDebug === "function" ? window.__epohiDebug() : null;
    if (!debug || !debug.state) return false;
    document.dispatchEvent(new CustomEvent("epohi:humans-ui-settled", {
      detail: { source: source || "runtime-invalidation" }
    }));
    return true;
  }

  document.addEventListener("epohi:humans-ui-settled", function () {
    stats.settledSignals += 1;
    request("humans-ui-settled");
  });

  // app.js owns mobile map taps on mapViewport and may use pointer capture while
  // resolving the gesture. The resulting pointerup can therefore be retargeted from
  // the original tile to #mapViewport even though handleTileClick() already rebuilt
  // the selected-unit context. Treat any pointerup whose target/composed path belongs
  // to the map viewport as the explicit post-map-action boundary instead of relying
  // on a tile-only target match or a synthetic click that app.js may suppress.
  document.addEventListener("pointerup", function (event) {
    const target = event.target && event.target.closest ? event.target : null;
    const path = typeof event.composedPath === "function" ? event.composedPath() : [];
    const mapViewport = document.getElementById("mapViewport");
    const inMapTarget = !!(target && target.closest("#mapViewport"));
    const inMapPath = !!(mapViewport && path.indexOf(mapViewport) !== -1);
    if (!inMapTarget && !inMapPath) return;
    stats.tilePointerSignals += 1;
    request("map-pointerup");
  });

  document.addEventListener("click", function (event) {
    stats.actionSignals += 1;
    const target = event.target && event.target.closest ? event.target : null;
    const cityModalToggle = target && target.closest("#cityBtn, [data-close=\"cityModal\"]");
    if (!cityModalToggle) request("user-action");

    const newGame = target ? target.closest("#newGameScreenBtn") : null;
    if (newGame) {
      stats.transitionSignals += 1;
      window.setTimeout(function () {
        request("new-game-screen-post-transition");
      }, 100);
    }

    const createParty = target ? target.closest("#createParty") : null;
    if (createParty) {
      stats.transitionSignals += 1;
      window.setTimeout(function () {
        request("new-game-created-post-transition");
        emitSettledWhenStateReady("new-game-created-post-transition");
      }, 0);
    }
  }, true);

  window.addEventListener("pageshow", function () { request("pageshow"); });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) request("visibility-return");
  });

  window.EpohiRuntimeInvalidation = {
    version: 21,
    request: request,
    flush: flush,
    stats: function () {
      return Object.assign({}, stats, {
        scheduled: !!(frame || timer || contextTailFrame),
        lastReason: lastReason
      });
    }
  };

  request("startup");
})();
