# AUTONOMY STATUS — «Эпохи» Humans v1

## State
`IN_PROGRESS_AUTONOMOUS`

## Integration
- Repository: `Mikayilzade/Epohi`
- Active branch: `codex/coherence-capture-learning-v1`
- Draft PR: #84
- Base: `prototype/humans-v1`
- `main`: DO NOT TOUCH

## Current branch checkpoint
Latest source-triggering implementation checkpoint: `12379c31435d8375fa40f20d970a69e88284ab69` (`Remove legacy strategy UI observer schedulers`).

The preceding exact source checkpoint `229c20c8cd2d0b5d77f86d05dca4bd8a1cf3f3e6` only fixed static-integrity trailing whitespace in `src/humans-capture-state.js`; its exact cross-browser run is recorded below.

Documentation-only status commits after `12379c31…` are not new implementation checkpoints. Always fetch PR #84 head and inspect the exact CI for `12379c31…` before the next source write.

## Why manual QA is suspended
Intermediate physical-device QA remains suspended until Release Candidate. Automated Chromium/WebKit gates own the stabilization loop.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — branch CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## Phase 1 progress
- Broad observers have been removed natively from `humans-observer`, `humans-visuals`, context cleanup and broad stabilization content polling.
- `src/humans-performance.js` v7 temporarily quarantines remaining legacy broad roots while native registrations are migrated.
- `src/humans-runtime-invalidation.js` v6 explicitly invokes `EpohiStrategyUX.refresh()` and `EpohiPlayerFeedback.refresh()` inside one protected coalesced RAF with visual/context/stabilization work.
- GitHub Actions visibility blocker is resolved: the temporary autonomy workflow now also exposes a PR-triggered run for PR #84. The connector can therefore inspect exact head runs even though the original branch workflow is push-triggered.
- Exact run `32655693257` for `229c20c8…`: static integrity **success**; focused Chromium **47/51 passed, 4 failed**; focused WebKit **43/51 passed, 8 failed**; full regression skipped. Failures showed capture-choice instability, context/city click instability, WebKit selected-worker callback churn, runtime invalidation and related UI races.
- `src/humans-strategy-ux.js` v3 now removes its persistent map/context/turn/screen/menu/menu-content MutationObservers and generic document click→timeout scheduler. Module-local explicit scheduling and bounded viewport resize remain; central RuntimeInvalidation owns normal DOM/action refresh.
- Exact run `32656385874` for `12379c31…`: static integrity **success**; focused Chromium **46/51 passed, 5 failed**; focused WebKit **44/51 passed, 7 failed**; full regression skipped.
- WebKit improved by one failure after StrategyUX scheduler removal, but callback churn remains (`selected worker`: 17 callbacks vs required <=6) and city open/close stability still fails. Chromium still has capture-choice failure and city instability; two StrategyUX scenarios additionally exposed a missing explicit refresh after the asynchronous main-menu → new-game-screen transition.
- The new-game screen is rendered asynchronously after `nextDefaultCampaignName()` resolves, so the central click RAF can occur before `#rivalCount` exists. The old persistent screen observer had accidentally supplied that wake-up. The replacement must be a bounded semantic/post-transition invalidation signal, not restored broad observation or polling.
- The runtime-invalidation test still reaches `#menuBtn` while the main menu is active and the game toolbar is hidden; this existing test/setup mismatch remains factual and must not be masked by threshold changes.
- WebKit still reports the known Playwright limitation `mouse.wheel: Mouse wheel is not supported in mobile WebKit`; do not weaken the mobile gate to hide it.
- No click/callback threshold has been weakened. No physical-device QA was initiated.

## Latest CI / validation
- PR #84 remains open, Draft, mergeable, base `prototype/humans-v1`; implementation head validated in this pass: `12379c31435d8375fa40f20d970a69e88284ab69`.
- Exact run `32656385874`, job `97235705682`, artifact `9497607085` (`epohi-autonomous-cross-browser-results`) is the authoritative latest implementation validation.
- Chromium focused: **46/51 passed, 5 failed** — capture-choice modal did not open; two StrategyUX initialization/campaign scenarios failed; city-open click was unstable; runtime-invalidation menu click occurred while toolbar hidden.
- WebKit focused: **44/51 passed, 7 failed** — treasury selected-city refresh, stacked-unit interaction, unsupported mobile-WebKit mouse wheel, worker callback churn, city open/close stability, and runtime-invalidation toolbar visibility.
- Full Chromium/WebKit regression was correctly skipped because the focused gate failed.

## NEXT ACTION
Add a bounded explicit post-transition invalidation for the asynchronous main-menu → new-game-screen render (without restoring MutationObserver/global polling), then run and inspect exact Chromium/WebKit CI for that new implementation checkpoint before any further source change.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
