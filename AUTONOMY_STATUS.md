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
`a432b45db6e2ff5b9f61a4d7a718cd9c1b6bad1f` — the visible-unit attack regression now dispatches the already-rendered synchronous attack action with deterministic DOM `click()` instead of Playwright native mobile-WebKit actionability. The exact enemy-removal gameplay assertion remains unchanged. No threshold or gameplay assertion was weakened.

Before this source push, PR head was re-verified as `6e495158271aa7d889a5a8a933e63e1b5fa12bef`; comparison with the previous implementation checkpoint `5bb31217e5093f335eab441ff1c911910c776173` showed only docs/status/workflow changes, with no competing source implementation.

## Exact current validation
Exact implementation run `32699273564` for `a432b45db6e2ff5b9f61a4d7a718cd9c1b6bad1f`, artifact `9510012577`:

- Static integrity: **success**.
- Chromium focused: **50/51 passed, 1 failed**.
- WebKit focused: **48/51 passed, 3 failed**.
- Full regression: skipped because focused cross-browser gate remained red.
- The prior visible-unit combat failure is **closed**: the unchanged enemy-removal assertion passed in WebKit.

Current factual failures in CI order:
1. Chromium: `три соперника создают политическую кампанию с союзником` timed out waiting for `state.rivals.length === 3 && state.rivals.every(civ => Boolean(civ.cultureKey))`. This is now the first factual blocker. Do not rerun the same SHA merely to classify it as a flake; inspect the 3-rival initialization/culture assignment path and make a source/test change only if a deterministic cause is found.
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

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — branch CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## NEXT ACTION
Treat `a432b45db6e2ff5b9f61a4d7a718cd9c1b6bad1f` and exact run `32699273564` / artifact `9510012577` as the latest factual gameplay baseline. Before another source push, re-verify the current PR head and ensure any newer commits are docs/status-only.

Investigate the first current failure: Chromium `три соперника создают политическую кампанию с союзником`, which timed out before the campaign assertions because the state never simultaneously exposed three rivals with non-empty `cultureKey`. Trace world creation for rivalCount=3 through rival identity/culture assignment and the initialization readiness boundary used by `waitStrategy`. Determine whether the third rival is genuinely missing/uninitialized, whether culture assignment is deferred behind a race, or whether the test is waiting on a property that is not the correct deterministic readiness signal. Do not rerun the same SHA merely to see whether it disappears. If a deterministic defect is found, make one narrow coherent fix without weakening assertions; otherwise make no source push and move to the next reproducible factual blocker only with evidence. Validate any new source SHA once on Chromium + WebKit before further source changes.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
