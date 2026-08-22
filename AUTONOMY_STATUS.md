# AUTONOMY STATUS — «Эпохи» Humans v1

## State
`IN_PROGRESS_AUTONOMOUS`

## Integration
- Repository: `Mikayilzade/Epohi`
- Active branch: `codex/coherence-capture-learning-v1`
- Draft PR: #84
- Base: `prototype/humans-v1`
- `main`: DO NOT TOUCH

## Current branch checkpoint
Latest implementation head: `faecc620468ea174f921ea1338cc96d5384ffe28` (`Run legacy observer containment in focused gate`), with implementation parent `58242489248d244447ba8d7a05d8f685b81538c` (`Contain remaining legacy observer roots`).

This status update is documentation-only and does not match workflow trigger paths. Always fetch PR #84 head before the next implementation write.

## Why manual QA is suspended
Intermediate physical-device QA remains suspended until Release Candidate. Automated Chromium/WebKit gates own the stabilization loop.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — branch CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## Phase 1 progress
- Broad observers have been removed natively from `humans-observer`, `humans-visuals`, context cleanup and broad stabilization content polling.
- Exact run `32575460633` exposed two loaded legacy decorator owners omitted from the prior observer map: `src/humans-strategy-ux.js` still registers broad map/context observers plus screen/menu observers and its own click→timeout→RAF refresh; `src/humans-player-feedback.js` still registers broad map/context/content observers and its own post-click timeout refresh.
- `src/humans-performance.js` v7 now temporarily quarantines the exact remaining legacy child-list roots (`screenRoot`, `menuContent`, `wikiContent`, `victoryContent` in addition to body/map/context roots already contained). This is containment, not the final native refactor.
- `tests/legacy-observer-containment.spec.js` exercises descendant churn on those legacy roots and requires callback activity to remain bounded; the focused workflow now includes this regression on Chromium and WebKit.
- `RUNTIME_OBSERVER_MAP.md` now records the two legacy owners explicitly and names their native click/observer schedulers as the next architectural debt.
- Service-worker cache was bumped for the runtime bridge change.

## Current blocker
The exact Chromium/WebKit result for implementation head `faecc620468ea174f921ea1338cc96d5384ffe28` is pending. Do not make another source push until that workflow and artifact are inspected.

## Latest CI / validation
- PR #84 verified immediately before this package: open, Draft, mergeable, base `prototype/humans-v1`, branch head `a0791020d0865d95057c911e7b39861b79061316`.
- Exact workflow for implementation `4ea00a8c311d1bcccdb0ba9d145f57286f53a3cc`: run `32575460633`, completed **failure**; focused gate failed, so full mobile regression did not run.
- Chromium focused: **45/49 passed, 4 failed**. Runtime failures included `runtime-invalidation` at **15 flushes vs required <15** and physical `open-city` unable to become stable for a 1-second click. The other two focused failures were outside this immediate containment target.
- WebKit focused: **41/49 passed, 8 failed**. Runtime failures included selected-worker idle at **18 observer callbacks vs allowed <=6**, physical `open-city` unable to become stable, 30-cycle physical city close timing out, and runtime-invalidation timing out at the menu click. Additional focused failures included the known unsupported mobile-WebKit `mouse.wheel` path and functional scenarios outside this immediate containment target.
- Artifact/video inspection confirmed the city context can visibly alternate while the action control is expected to be stable, matching an independent decorator-refresh problem rather than a too-short click timeout.
- Source inspection after this exact run identified `humans-strategy-ux` and base `humans-player-feedback` as the remaining broad/native decorator owners. The containment implementation does **not** weaken callback or click thresholds.
- CI result for `faecc620468ea174f921ea1338cc96d5384ffe28`: **pending**.

## NEXT ACTION
Inspect the exact Chromium/WebKit workflow and artifact for `faecc620468ea174f921ea1338cc96d5384ffe28`; if observer/city instability remains, migrate the native observer/click schedulers in `humans-strategy-ux.js` and `humans-player-feedback.js` into explicit invalidation rather than extending the safety wrapper or click timeouts.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
