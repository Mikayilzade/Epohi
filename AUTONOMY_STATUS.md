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
Exact PR head inspected before this package: `c5ad7c3fd8405374e78cf38ffc0f0111d3e40b51` (`Re-arm context cleanup after overlapping identity repair`). PR #84 remains open/draft and targets `prototype/humans-v1`.

Its automatically-triggered workflow run `33142436810` (run #199) completed **failure** on that exact SHA. Retained artifact `9675199244` was downloaded and inspected directly.

## Exact CI / factual blocker from run #199
- Static integrity: **green**.
- Focused Chromium: **60/60 passed**.
- Focused WebKit: **60/60 passed**.
- Full Chromium: **156/177 passed, 21 failed**.
- Full WebKit: **156/177 passed, 21 failed**.
- The previous context-tail ordering blocker is therefore closed in the focused gate.
- First exact full-suite failure by execution order: `tests/camera-2.spec.js:215` on Chromium — the test expected in-memory `debug.getCamera().scale` to remain `99` across a page reload, but received the previously persisted camera scale `2.2`.
- Source inspection confirms this is a stale test boundary rather than a camera-runtime defect: direct mutation of the debug camera object does not persist anything; production camera persistence is explicit through `EpohiCameraStorage.saveCamera()` / the scheduled save path. The test intended to validate clamping of an out-of-range **stored** camera value, but never actually wrote that stored value.

## Bounded package for this run
- Update only the persisted-camera setup in `tests/camera-2.spec.js`.
- Seed the real `EpohiConfig.CAMERA_KEY` storage record with `{x:-99999,y:-99999,scale:99}` before reload instead of mutating the transient debug camera object.
- Strengthen the regression boundary by asserting the raw persisted record still contains scale `99` on the title screen before continuing; the existing post-layout assertions still require the runtime camera to clamp to the current dynamic maximum and remain position-bounded.
- No camera implementation, gameplay semantics, timeouts, browser thresholds, or worker counts are changed.

## Validation state
- Authority before package: run `33142436810` on `c5ad7c3f...`; static green, focused Chromium/WebKit both 60/60, full suites 156/177 on each engine.
- Artifact `9675199244` showed Chromium first failure `Expected: 99`, `Received: 2.2` at `camera-2.spec.js:229`, which matches the transient-vs-persisted setup error above.
- The next authority is the automatically-triggered Chromium/WebKit CI for this single coherent test+status checkpoint. Do not claim the camera regression green before that exact run completes.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [x] Phase 1 focused runtime architecture hardening — run #199 focused Chromium/WebKit are both 60/60.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage; currently working through the first factual full-suite failure.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Wait for the automatically-triggered Chromium/WebKit CI of this persisted-camera regression checkpoint. If focused gates remain green and the camera test passes, inspect and fix only the first remaining factual full-suite failure on that exact SHA. If the camera test still fails, inspect the retained artifact and camera storage/layout ordering before changing any runtime camera code.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
