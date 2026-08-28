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
    // A newer identity repair can arrive while an older two-frame cleanup tail is
    // already pending. If we merely dedupe here, that older cleanup may run before
    // the newer StrategyUX RAF(schedule) -> RAF(refresh) chain and the late refresh
    // can overwrite the activity switcher again (observed on WebKit in run #198).
    // Re-arm the tail from the newest identity mutation so ContextReviewCleanup is
    // always the final writer for the latest follow-up, independent of RAF ordering.
    if (contextTailFrame) {
      window.cancelAnimationFrame(contextTailFrame);
      contextTailFrame = 0;
    }
    contextTailFrame = window.requestAnimationFrame(function () {
      // StrategyUX's identity repair does not refresh readiness in the same frame:
      // its first RAF calls schedule(), which queues the actual refresh for the next
      // frame. Keep RuntimeInvalidation as the ordering owner by waiting through that
      // measured two-frame legacy tail, then apply ContextReviewCleanup last.
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
    // Pathing controls used to depend on the context MutationObserver noticing that
    // app.js rebuilt the context card. The observer-local safety architecture no longer
    // guarantees delivery for that synthetic dependency, so make the explicit runtime
    // invalidation boundary the owner of route/worker control refresh as well.
    syncPathingUi();

    // The post-frame cleanup is only needed when StrategyUX actually mutated identity
    // state and therefore queued its measured RAF(schedule) -> RAF(refresh) follow-up.
    // Ordinary explicit invalidations must not stay "scheduled" for two blind frames:
    // their synchronous cleanup above is already the final writer.
    if (strategyQueuedIdentityFollowup) scheduleContextTailSync();
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

  // Mobile map taps are resolved by app.js on mapViewport pointerup, where the
  // handler intentionally preventDefaults the synthetic click. A click-only
  // invalidation hook can therefore miss the exact lifecycle that rebuilt the
  // context card and leave pathing controls waiting on observer delivery. Listen
  // at document bubble phase so app.js has already completed handleTileClick(),
  // then schedule one bounded explicit refresh for the rebuilt unit context.
  document.addEventListener("pointerup", function (event) {
    const target = event.target && event.target.closest ? event.target : null;
    if (!target || !target.closest("#map .tile")) return;
    stats.tilePointerSignals += 1;
    request("map-tile-pointerup");
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
        // The capture-phase click hook runs before app.js creates the campaign. By the
        // zero-delay transition callback the new state is synchronously installed, so
        // emit the canonical settled boundary only when that state is actually readable.
        // This closes the lost-lifecycle race without polling or broad DOM observation.
        emitSettledWhenStateReady("new-game-created-post-transition");
      }, 0);
    }
  }, true);

  window.addEventListener("pageshow", function () { request("pageshow"); });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) request("visibility-return");
  });

  window.EpohiRuntimeInvalidation = {
    version: 20,
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
