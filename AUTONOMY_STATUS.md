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
Exact PR head inspected at the start of this run: `3fd7e708a6f33b8d1ccbb685b91c14394082efd7` (`Align pathing performance regression with observer-local safety`). PR #84 remains open/draft and targets `prototype/humans-v1`.

Exact implementation payload for this bounded package: `e507aa9bf70c6fe9231af2945ca4ea94cda21b8c` (`Align pathing fixture with explicit UI invalidation`). This payload is incorporated into the single coherent branch checkpoint pushed by this run together with this status update.

## Exact CI / factual blocker inspected
Workflow run `33164250332` (run #205) on exact head `3fd7e708a6f33b8d1ccbb685b91c14394082efd7` completed **failure**. Retained artifact `9683926384` was downloaded and inspected directly.

- Static integrity: **green**.
- Focused mobile runtime: **green** on Chromium and WebKit.
- Full Chromium: **159/177 passed, 18 failed**.
- Full WebKit: **159/177 passed, 18 failed**.
- First common full-suite failure: `tests/humans-pathing-performance.spec.js:83` (`кнопка Идти назначает маршрут, показывает шаги и переносит приказ между ходами`).
- Exact failure on both engines: after the fixture directly rewrote state and called `debug.render()`, `[data-path-action="start"]` never appeared and the test timed out at `page.waitForFunction`.
- Retained error context shows the selected scout and its context card were already visible, but the pathing action container remained empty. This fixture performs synthetic state writes outside normal user/runtime action hooks; under the accepted explicit-invalidation architecture, broad observer polling is no longer a valid synchronization mechanism for that setup.

## Bounded package completed
- Updated `prepareOpenPlains()` so its direct synthetic state rewrite explicitly refreshes the owning `EpohiHumansPathingUI` immediately after `debug.render()` instead of depending on observer side effects.
- Strengthened the route regression to require the real `Идти` action to become visible within the existing 1-second actionability boundary before the route interaction proceeds.
- Kept production/runtime code, gameplay semantics, browser thresholds, worker count and normal user interaction paths unchanged.

## Validation state
- Authority before package: run `33164250332` / artifact `9683926384` on `3fd7e708...`.
- Artifact showed the identical first pathing-action synchronization failure on Chromium and WebKit; both full suites were 159/177.
- New Chromium/WebKit CI for this coherent test+status checkpoint is the next authority; do not claim this regression green until that exact run completes.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [x] Phase 1 focused runtime architecture hardening — run #205 focused gate is green on both engines.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage; currently working through the first factual full-suite failure.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Wait for the automatically-triggered Chromium/WebKit CI of this explicit pathing-fixture invalidation checkpoint; when it completes, inspect its retained artifact and act only on the first remaining factual full-suite failure on that exact SHA.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
