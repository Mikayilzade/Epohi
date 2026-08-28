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
Exact PR head inspected at the start of this run: `7339ee8e9c7212a5616e6e824c36f9df4d790bbd` (`Align journey decision regression with blocking overlay`). PR #84 remains open/draft and targets `prototype/humans-v1`.

Exact implementation payload for this bounded package: `c6e81ddab09f8acbeb19e04b0bf5fda5a932601e` (`Align pathing performance regression with observer-local safety`). This payload is incorporated into the single coherent branch checkpoint pushed by this run together with this status update.

## Exact CI / factual blocker inspected
Workflow run `33160409430` (run #204) on exact head `7339ee8e9c7212a5616e6e824c36f9df4d790bbd` completed **failure**. Retained artifact `9682481274` was downloaded and inspected directly.

- Static integrity: **green**.
- Focused mobile runtime: **green** on Chromium and WebKit.
- Full Chromium: **158/177 passed, 19 failed**.
- Full WebKit: **158/177 passed, 19 failed**.
- First common full-suite failure: `tests/humans-pathing-performance.spec.js:48` (`desktop-карта крупная, а постоянные водные анимации отключены`).
- Exact assertion on both engines: expected `EpohiPerformance.mode === "static-visuals"`, received `"observer-local-safety"`.
- Current runtime source intentionally exposes `EpohiPerformance.mode = "observer-local-safety"`, `snapshot().mode = "observer-local-safety"`, and `EpohiObserverSafety.mode = "observer-local"`; the visual invariants in the same regression (large desktop map, no water animation, no backdrop filter) remain the accepted behavior. The stale defect was the regression pinning an obsolete performance-mode label.

## Bounded package completed
- Updated the stale pathing/performance regression to assert the current observer-local safety mode instead of the removed `static-visuals` label.
- Strengthened the regression so snapshot mode must equal the live performance mode and the installed observer safety layer must report `observer-local`.
- Kept the actual visual/performance assertions unchanged: desktop map dimensions, disabled water animation, disabled backdrop filter, and no console problems.
- No production/runtime code, gameplay semantics, timeout, browser threshold or worker count changed.

## Validation state
- Authority before package: run `33160409430` / artifact `9682481274` on `7339ee8e...`.
- Artifact showed the identical obsolete-mode assertion as the first full-suite failure on Chromium and WebKit; both full suites were 158/177.
- New Chromium/WebKit CI for this coherent test+status checkpoint is the next authority; do not claim this regression green until that exact run completes.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [x] Phase 1 focused runtime architecture hardening — run #204 focused gate is green on both engines.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage; currently working through the first factual full-suite failure.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Wait for the automatically-triggered Chromium/WebKit CI of this pathing-performance regression checkpoint; when it completes, inspect its retained artifact and act only on the first remaining factual full-suite failure on that exact SHA.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
