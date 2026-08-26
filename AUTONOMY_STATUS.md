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
Exact implementation/test head before this status update: `a2b420e8491b03ee8235a106dea70de21e5c0719` (`Attribute post-turn UI owner activity`).

Its automatically-triggered PR workflow is run `32995082749` (run #169), completed **failure**. Artifact `9616407035` (`epohi-autonomous-cross-browser-results`) was downloaded and inspected. Static integrity was green; full Chromium/WebKit regression was skipped because the focused gate failed.

## Exact CI / validation for `a2b420e8...`
- Chromium focused: **53/56 passed, 3 failed**.
  - `tests/combat-world-stability.spec.js:177`: joint-war real-turn scenario exhausted the unchanged 20-second test budget only when the immediate post-turn proposal read was attempted.
  - `tests/runtime-invalidation-cadence.spec.js:4`: request storm produced **13 flushes vs required <=12**.
  - `tests/runtime-invalidation-cadence.spec.js:99`: the retained diagnostic itself reached End Turn quickly, then the immediate proposal read timed out under the same strict budget.
- WebKit focused: **54/56 passed, 2 failed**.
  - `tests/humans-strategy-ux.spec.js:19`: Playwright mobile WebKit does not support `mouse.wheel`.
  - `tests/mobile-performance-stability.spec.js:190`: city-sheet actionability timed out at the unchanged 1-second click limit.
- No timeout, cadence threshold, callback threshold, actionability limit, gameplay assertion, or physical-device requirement was weakened.

## Diagnostic finding
The retained run #169 evidence excludes the explicitly wrapped post-turn owners as the source of the Chromium stall. In the synthetic joint-war diagnostic, real End Turn itself was only **207 ms on Chromium** and **745 ms on WebKit**. `EpohiLivingCivilizations.processAlliedActions` / `processTurn` were about **0.2/0.9 ms on Chromium** and **0/2 ms on WebKit**. Wrapped post-turn UI owners were also cheap: Chromium maxima were `ContextReviewCleanup.sync` ~3.2 ms, `StrategyUX.refresh` ~1.8 ms and the remaining tracked owners sub-millisecond; WebKit `StrategyUX.refresh` maxed ~5 ms and the rest were near 0–1 ms. Despite that, Chromium could become unresponsive before the following trivial `page.evaluate`, so another unwrapped asynchronous callback/microtask/RAF owner must be measured before any gameplay/source change.

## Current blocker
Identify the asynchronous callback owner that can monopolize Chromium after the synthetic joint-war End Turn even though the turn processor and known UI/decorator owners are cheap. Chromium cadence 13 vs <=12, WebKit `mouse.wheel`, and one WebKit city actionability miss remain secondary factual blockers.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — PR CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## NEXT ACTION
Run exactly one test-only diagnostic checkpoint that installs startup attribution for `setTimeout`, `setInterval`, `requestAnimationFrame` and `queueMicrotask`, activates collection only around the existing synthetic joint-war real End Turn, and forwards long/high-frequency callback stacks plus periodic aggregate snapshots into retained Playwright output. Preserve the real End Turn path, unchanged 20-second timeout and all existing thresholds/assertions. Inspect its exact Chromium/WebKit CI before any gameplay/source fix; target only the first measured asynchronous owner.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
