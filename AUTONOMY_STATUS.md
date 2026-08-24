# AUTONOMY STATUS — «Эпохи» Humans v1

## State
`IN_PROGRESS_AUTONOMOUS`

## Integration
- Repository: `Mikayilzade/Epohi`
- Active branch: `codex/coherence-capture-learning-v1`
- Draft PR: #84
- Base: `prototype/humans-v1`
- `main`: DO NOT TOUCH

## Current implementation checkpoint
`a342ecad0575951a5fce9aa43031bf963438fa1e` — the three-rival strategy regression uses a deterministic seeded PRNG instead of replacing `Math.random` with the constant `0.5`. The runtime three-rival path (`pendingRivalCount` → `strategyRequestedRivals` → `ensureRequestedRivals`) and culture assignment are now validated by exact CI. No gameplay assertion or runtime threshold was weakened.

Before reading this result, current PR head was re-verified as `85f731b55d68aad7e5688297ac76a5d4c419a79e`; that newer commit is docs/status-only (`AUTONOMY_STATUS.md`), so `a342ecad…` remains the latest implementation checkpoint and exact run `32703476861` is a valid gameplay baseline.

## Exact current validation
Exact automatically-triggered PR CI run `32703476861` for source checkpoint `a342ecad0575951a5fce9aa43031bf963438fa1e`, artifact `9512707778`:
- Static integrity: **success**.
- Chromium focused: **51/51 passed**.
- WebKit focused: **48/51 passed, 3 failed**.
- Full regression: skipped because focused WebKit gate remains red.
- The previous Chromium three-rival campaign blocker is **closed**: the deterministic seeded fixture passed all unchanged three-rival assertions.

Current factual WebKit failures in CI order:
1. `колесо мыши масштабирует карту к курсору` — mobile WebKit/Playwright reports `mouse.wheel` as unsupported. This is a known automation/API limitation, not evidence of a gameplay regression.
2. `opening city sheet stays open and heavy observers are quarantined` — native Playwright `openCity.click({ timeout: 1000 })` times out after resolving the button and confirming it is visible, enabled and stable, while attempting `scrolling into view`. The city action exists; this is currently classified as an actionability/automation blocker until the exact synchronous DOM path is verified.
3. `observer sync is bounded and city sheet survives 30 explicit open-close cycles` — all 30 explicit DOM open/close cycles complete, but the post-cycle idle window records **13 observer callbacks** against the unchanged limit **<=8**. This is the first remaining reproducible runtime-churn signal.

`src/humans-performance.js` currently exposes only aggregate `__epohiObserverSafetyStats.callbacks`; it does not attribute delivered callbacks to an observer owner or target. Heavy `cityModal` descendant observers are already suppressed, while semantic root-class observers remain allowed. Therefore the +13 callback owner cannot be named from the current aggregate counter alone.

No physical-device QA was initiated. PR #84 remains Draft and unmerged.

## CI / notification containment
- CI removes the redundant branch `push` trigger and runs automatically on meaningful `pull_request:synchronize` changes.
- Checkout is pinned to the exact PR head SHA rather than GitHub's synthetic merge ref.
- Only meaningful workflow/config/package/source/tests/index/service-worker changes install browsers and run Chromium/WebKit Playwright; status/docs-only commits stop after the cheap detector.
- `workflow_dispatch` is not used by the autonomous loop. Identical-SHA reruns are reserved for clear infrastructure/no-result failures.
- Gmail is not used by the automation; its email/push notification channels are disabled.

## Runtime hardening progress
- StrategyUX broad DOM observers/global-click scheduling are gone; `EpohiRuntimeInvalidation` owns explicit refresh.
- Duplicate player-feedback invalidation and journey/victory/turn observers were removed from stabilization.
- Legacy base `humans-player-feedback.js` observer/global refresh scheduling has been removed; RuntimeInvalidation owns its refresh.
- Event overlay policy no longer schedules normalization for city-modal open/close clicks.
- `src/humans-coherence-finalize.js` no longer registers its broad `cityModal` subtree observer.
- Temporary observer safety suppresses heavy `cityModal` descendant registrations while semantic root signals remain allowed.
- CoherenceFinalize no longer schedules its decorator for every document click; city closing is quiescent on that path.
- The prior stacked-unit WebKit actionability blocker is closed without changing gameplay semantics or thresholds.
- The prior visible-unit WebKit combat blocker is closed; unchanged enemy-removal assertion passes.
- The prior three-rival Chromium blocker is closed; exact `a342ecad…` Chromium focused is 51/51.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — branch CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## NEXT ACTION
Treat `a342ecad0575951a5fce9aa43031bf963438fa1e` and exact run `32703476861` / artifact `9512707778` as the latest factual gameplay baseline. Before any source/test push, re-verify the current PR head and ensure any newer commits are docs/status-only or otherwise inspect their exact CI first.

First address the reproducible WebKit city runtime signal without changing thresholds: statically enumerate the remaining live `MutationObserver` registrations that can receive mutations after `#cityModal` open/close and identify which semantic root observer(s) can account for the post-cycle callbacks. If static ownership is still ambiguous, add the smallest temporary test/diagnostic attribution needed to identify observer target/owner; do not add polling, broad observers, or relax the `<=8` callback threshold. Remove or replace only the redundant owner once proven, then validate the new implementation SHA once on Chromium + WebKit before another source change.

For the separate `opening city sheet stays open...` actionability failure, verify the existing context action handler is synchronous and stable. If so, change only the WebKit-sensitive test interaction to deterministic DOM `click()` while preserving the modal-open assertion and all observer-safety thresholds. Do not treat `mouse.wheel` on mobile WebKit as a gameplay failure; handle that automation/API incompatibility separately without weakening Chromium coverage.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
