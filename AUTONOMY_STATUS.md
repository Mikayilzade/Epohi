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
Exact PR head inspected at the start of this run: `43aecf736ea11e496c0b588206a60d2fc9fce2ba` (`Stabilize city-open actionability regression`). PR #84 remains open/draft and targets `prototype/humans-v1`.

Exact implementation payload for this bounded package: `ed9f67304480064119f4d3f27bd4b84b479bad81` (`Fix persisted camera clamp regression boundary`). This code/test payload is incorporated into the coherent branch checkpoint pushed by this run together with this status update.

## Exact CI / factual blocker inspected
Workflow run `33148519493` (run #201) on exact head `43aecf736ea11e496c0b588206a60d2fc9fce2ba` completed **failure**. Retained artifact `9677656290` was downloaded and inspected directly.

- Static integrity: **green**.
- Focused mobile runtime: **green** on Chromium and WebKit.
- Full Chromium: **155/177 passed, 22 failed**.
- Full WebKit: **154/177 passed, 23 failed**.
- First common full-suite failure: `tests/camera-2.spec.js:215` (`stored scale clamps after layout...`).
- Exact assertion failure on both engines: expected persisted `scale` `99`, received already-clamped `1.3` at the pre-continue title-screen assertion.
- This is a stale regression boundary, not a camera-runtime defect: startup camera/layout legitimately restores, clamps, and persists the safe value during reload before the title-screen assertion executes.

## Bounded package completed
- Kept the test on the real `EpohiConfig.CAMERA_KEY` persistence path.
- Moved the `scale === 99` assertion to immediately after the test writes the out-of-range persisted record, before reload/startup is allowed to normalize it.
- Strengthened the regression after continue: the test now also asserts that storage contains the same clamped scale as the active runtime camera.
- No camera runtime, gameplay semantics, timeout, browser threshold, worker count, or production code changed.

## Validation state
- Authority before package: run `33148519493` / artifact `9677656290` on `43aecf73...`.
- Local/static semantic review: test-only change; JavaScript syntax unchanged outside the edited test body.
- New Chromium/WebKit CI for the coherent checkpoint is the next authority; do not claim this regression green until that exact run completes.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [x] Phase 1 focused runtime architecture hardening — run #201 focused gate is green on both engines.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage; currently working through the first factual full-suite failure.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Wait for the automatically-triggered Chromium/WebKit CI of this persisted-camera regression checkpoint. If the camera persistence test is green, inspect and fix only the first remaining factual full-suite failure on that exact SHA; if it still fails, inspect its retained artifact before changing camera runtime code.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
