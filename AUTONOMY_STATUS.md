# AUTONOMY STATUS — «Эпохи» Humans v1

## State
`IN_PROGRESS_AUTONOMOUS`

## Integration
- Repository: `Mikayilzade/Epohi`
- Active branch: `codex/coherence-capture-learning-v1`
- Draft PR: #84
- Base: `prototype/humans-v1`
- `main`: DO NOT TOUCH

## Current checkpoint
Exact implementation/test head inspected this run: `cca58d1c49a62d26acf5469dd6ac74c796af6aa3` (`Bound runtime invalidation cadence below 28Hz`). PR #84 is open/draft and still points to this exact implementation head.

Its automatically-triggered PR workflow run `33063827902` completed **failure**. Artifact `9644146695` (`epohi-autonomous-cross-browser-results`) was downloaded and inspected directly.

## Exact CI / validation for `cca58d1c...`
- Static integrity: **green**.
- Focused Chromium mobile: **60/60 passed**.
- Focused WebKit mobile: **60/60 passed**.
- The new 36 ms invalidation cadence package is green on both engines; the previous Chromium `13 vs ≤12` cadence failure is closed.
- The previously observed WebKit readiness-button transition timeout did **not** reproduce in the focused gate.
- Callback churn, observer-delivery bounds, wheel zoom, mobile overflow, context cleanup, joint-war flow and the rest of the focused runtime hardening set are all green together on both engines at this exact SHA.

The workflow remains red because the **full mobile regression** now runs and exposes older/non-focused failures:
- Full Chromium mobile: **151 passed, 25 failed**.
- Full WebKit mobile: **150 passed, 26 failed**.
- First WebKit-only failure in suite order: `tests/camera-2.spec.js:169` — after removing all units and centering on the capital, the camera test measured the capital far from the viewport center (`x ≈ 1548.80` vs center `≈195.20`). The selected-unit half of the same test passed before this assertion.
- The first common failure family after that is `tests/humans-art-observer.spec.js`, whose old `createConfiguredGame` helper still waits for removed `#openMapMode`; this is a separate stale full-suite harness issue and must not be mixed into the camera package.

## Bounded package completed this run
This run performed the exact post-cadence CI diagnosis rather than making a speculative source change:
- confirmed the cadence fix and all focused hardening gates are green on both engines;
- downloaded and inspected the retained full-suite logs rather than inferring from workflow status;
- isolated the first remaining factual full-regression blocker to the WebKit camera focus scenario and separated it from the later stale new-game helper failures.

No gameplay code, thresholds, timeouts or browser-specific skips were changed in this diagnostic package.

## Current blocker
Determine whether the WebKit camera-center failure is a real camera-state/transition defect or a stale fixed-delay assertion. The test currently waits fixed `50 ms` after `render()` and `220 ms` after `centerCameraOnFocus(true)` before measuring geometry. A repair must preserve the exact centering assertion; do not weaken it into a broad tolerance and do not skip WebKit.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — PR CI for Chromium + WebKit mobile projects and full regression.
- [x] Phase 1 focused gate — runtime/UI architecture hardening focused suite is green 60/60 on Chromium and 60/60 on WebKit at `cca58d1c...`; full-regression cleanup remains before Phase 2 can be declared green.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## NEXT ACTION
Isolate `tests/camera-2.spec.js:169` on WebKit by comparing the internal camera state/target immediately after `centerCameraOnFocus(true)` with the rendered tile geometry after the camera transition settles. If internal state is wrong, fix the camera source and add/strengthen a regression; if state is correct and only the fixed-delay geometry sample races WebKit transition/layout, replace that fixed delay with an explicit deterministic settled-state wait while preserving the exact center assertion. Do not touch the later `humans-art-observer` helper failures in the same package.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
