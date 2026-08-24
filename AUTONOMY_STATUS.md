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
`a342ecad0575951a5fce9aa43031bf963438fa1e` — the three-rival strategy regression now uses a deterministic seeded PRNG instead of replacing `Math.random` with the constant `0.5`. The factual diagnosis is that the constant RNG degenerates world/start-position generation; the runtime already has an explicit three-rival path (`pendingRivalCount` → `strategyRequestedRivals` → `ensureRequestedRivals`) and culture assignment. All assertions still require exactly three rivals, the third rival to be allied with score >=40, and the Elaria diplomacy UI. No threshold or gameplay assertion was weakened.

Before this source push, PR head was re-verified as `b3061a2490a50ea1953765f94ba5836317c53570`; comparison with the previous implementation checkpoint `a432b45db6e2ff5b9f61a4d7a718cd9c1b6bad1f` showed only `AUTONOMY_STATUS.md` changes, with no competing source implementation. Exact previous implementation run `32699273564` was also re-verified as a failed run for `a432b45db6e2ff5b9f61a4d7a718cd9c1b6bad1f` before writing source.

## Exact current validation
Exact PR CI run `32703476861` has been automatically created for source checkpoint `a342ecad0575951a5fce9aa43031bf963438fa1e` and is currently queued. No workflow_dispatch or identical-SHA rerun was used.

Previous factual baseline, exact run `32699273564` for `a432b45db6e2ff5b9f61a4d7a718cd9c1b6bad1f`, artifact `9510012577`:
- Static integrity: **success**.
- Chromium focused: **50/51 passed, 1 failed**.
- WebKit focused: **48/51 passed, 3 failed**.
- Full regression: skipped because focused cross-browser gate remained red.
- The prior visible-unit combat failure is **closed**: the unchanged enemy-removal assertion passed in WebKit.

Previous factual failures in CI order:
1. Chromium: `три соперника создают политическую кампанию с союзником` timed out waiting for `state.rivals.length === 3 && state.rivals.every(civ => Boolean(civ.cultureKey))`. Investigation found the test's `Math.random = () => 0.5` fixture to be an invalid deterministic world generator for the three-rival placement path; checkpoint `a342ecad…` replaces it with a seeded varying PRNG while preserving the exact campaign assertions.
2. WebKit: mouse-wheel zoom uses `mouse.wheel`, which mobile WebKit explicitly reports as unsupported; known automation/API limitation.
3. WebKit: `opening city sheet stays open and heavy observers are quarantined` timed out on native Playwright `openCity.click()` actionability.
4. WebKit: `observer sync is bounded and city sheet survives 30 explicit open-close cycles` remains above the callback threshold: **13 callbacks** for limit **<=8**; observer-sync threshold itself remains unchanged.

No physical-device QA was initiated. PR #84 remains Draft and unmerged.

## CI / notification containment
- CI policy removes the redundant branch `push` trigger, limits automatic CI to one `pull_request:synchronize` run per branch update, and pins checkout to the exact PR head SHA rather than GitHub's synthetic merge ref.
- After checkout, `HEAD^..HEAD` is the actual latest branch commit. Only meaningful workflow/config/package/source/tests/index/service-worker changes install browsers and run Chromium/WebKit Playwright. Status/docs-only commits stop after the cheap detector.
- `workflow_dispatch` is not used by the autonomous loop. Identical-SHA reruns are reserved only for clear infrastructure/no-result failures.
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
- The prior visible-unit WebKit combat blocker is closed; exact `a432b45…` WebKit passed the unchanged enemy-removal assertion.
- Three-rival regression fixture no longer collapses all random world-generation decisions to one constant value; it remains deterministic through a seeded PRNG and still validates the real three-rival campaign semantics.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — branch CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## NEXT ACTION
Treat `a342ecad0575951a5fce9aa43031bf963438fa1e` as the latest implementation checkpoint. Do not make another source change until exact automatically-triggered run `32703476861` completes. Re-verify the PR head first; any newer commit must be docs/status-only before using this exact source run as the gameplay baseline.

When run `32703476861` completes, record Chromium/WebKit focused counts and inspect the first factual failure in CI order. If the three-rival campaign passes, close that blocker and advance to the first remaining reproducible WebKit failure without rerunning `a342ecad…`. If it still fails, inspect its exact artifact/log and change source/test only if a new deterministic cause is proven. Keep all runtime callback thresholds and gameplay assertions unchanged.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
