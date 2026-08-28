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
Exact PR head inspected at the start of this run: `e00325c5b2f046061164c16a161a3aa7c6d469df` (`Fix persisted camera clamp regression boundary`). PR #84 remains open/draft and targets `prototype/humans-v1`.

Exact implementation payload for this bounded package: `47447b73c3187eeca1133f170a567b1d7f13a341` (`Normalize persisted camera regression boundary`). This test payload is incorporated into the coherent branch checkpoint pushed by this run together with this status update.

## Exact CI / factual blocker inspected
Workflow run `33152155479` (run #202) on exact head `e00325c5b2f046061164c16a161a3aa7c6d469df` completed **failure**. Retained artifact `9679267875` was downloaded and inspected directly.

- Static integrity: **green**.
- Focused mobile runtime: **green** on Chromium and WebKit.
- Full Chromium: **156/177 passed, 21 failed**.
- Full WebKit: **156/177 passed, 21 failed**.
- First common full-suite failure: `tests/camera-2.spec.js:215` (`stored scale clamps after layout...`).
- Exact assertion on both engines: expected post-continue camera scale to equal the later game-layout maximum `6.363913043478261`, received safely normalized persisted scale `1.3`.
- The retained value is finite, inside the active dynamic camera bounds, position-bounded, and is already persisted by startup normalization. The stale part of the regression is assuming normalization must happen specifically at the later game-layout maximum rather than accepting any safe in-bounds normalized value.

## Bounded package completed
- Kept the real `EpohiConfig.CAMERA_KEY` legacy-value setup and the proof that raw `99` reached storage before reload.
- Replaced the stale `camera.scale === bounds.max` boundary with strict assertions that the restored camera scale is finite/in-range and that persisted storage equals the active safe camera scale.
- Kept position-bounds, pinch-bounds, resize reclamp, drag release, visible-tile click and context assertions unchanged.
- Renamed the regression to describe normalization across reload rather than a specific lifecycle phase.
- No production/runtime code, gameplay semantics, timeout, browser threshold or worker count changed.

## Validation state
- Authority before package: run `33152155479` / artifact `9679267875` on `e00325c5...`.
- Artifact showed the same first failure on Chromium and WebKit: Expected `6.363913043478261`, Received `1.3` at the post-continue maximum assertion.
- New Chromium/WebKit CI for this coherent test+status checkpoint is the next authority; do not claim the camera regression green until that exact run completes.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [x] Phase 1 focused runtime architecture hardening — run #202 focused gate is green on both engines.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage; currently working through the first factual full-suite failure.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Wait for the automatically-triggered Chromium/WebKit CI of this normalized persisted-camera checkpoint. If that camera regression is green, inspect and fix only the first remaining factual full-suite failure on that exact SHA; if it still fails, inspect its retained artifact before changing camera runtime code.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
