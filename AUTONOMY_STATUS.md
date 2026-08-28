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
Exact PR head inspected before this package: `5e92ffc6b03386f698db943bda0c657864fa60ab` (`Make known POI AI fixture deterministic`). PR #84 remains open/draft and targets `prototype/humans-v1`.

Its automatically-triggered workflow run `33130346145` (run #197) completed **failure** on that exact SHA. Retained artifact `9670829151` was downloaded and inspected directly.

## Exact CI / factual blocker from run #197
- Static integrity: **green**.
- Focused Chromium: **60/60 passed**.
- Focused WebKit: **60/60 passed**.
- Full Chromium/WebKit regression: **failed**.
- First common full-suite failure on both engines: `tests/humans-autonomy.spec.js:142` — the autonomous worker test expected an immediate `farm` and a city-production deduction after one `processOrders()` call.
- Current accepted worker semantics in `humans-worker-learning.js` are different and already explicit in product/UI code: improvements use multi-turn `workerProject` working time and do **not** spend city production. `startWorkerProject()` records `worker-project-started`; `processWorkerProjects()` completes the improvement on later turns and records `worker-build`.
- Therefore the first failure is a stale regression contract, not evidence that the current worker-time model is broken.

## Bounded package for this run
- Update only `tests/humans-autonomy.spec.js` to validate the accepted worker-time lifecycle instead of the obsolete instant-production model.
- Preserve the original behavioral intent: an autonomous `develop` order must choose a farm for a food-priority plains tile and eventually complete it.
- Strengthen the regression to require: project starts, worker spends its action, `worker-project-started` is logged, city production is unchanged at project start and completion, the project completes after deterministic worker-project turns, final improvement is `farm`, project state clears, order returns active, and `worker-build` is logged.
- No gameplay/source logic, timeouts, browser thresholds, or runtime architecture were changed in this package.

## Validation state
- Authority before package: run `33130346145` on `5e92ffc6...`; focused Chromium/WebKit both 60/60, full suite failed with the stale autonomous-worker expectation as the first common failure.
- The next authority is the automatically-triggered Chromium/WebKit CI for the single coherent test+status checkpoint created from this package. Do not claim the full-suite blocker green before that exact run completes.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [x] Phase 1 focused runtime architecture hardening — focused Chromium/WebKit are 60/60 on run #197.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage; currently working through the first factual full-suite failure.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Wait for the automatically-triggered Chromium/WebKit CI of this autonomous-worker regression checkpoint. If focused gates remain green and the updated worker lifecycle test passes on both engines, inspect and fix only the first remaining factual full-suite failure on that exact SHA. If the updated worker test fails, inspect the retained artifact before changing worker/gameplay code.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
