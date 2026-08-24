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
`f7fd3b9225b845d748a81f0c68c0d811882b22bf` — CoherenceFinalize no longer enqueues its full decorator after every document click. Its click path is now limited to the local capture-administration action and one post-render pass when `#cityBtn` opens the city sheet; closing the city and unrelated clicks no longer wake this decorator. No callback threshold or gameplay assertion was weakened.

Before that source push, PR head was re-verified as `58aff8d5ff815b59e1d46662d671584da10fb5c6`. The authoritative previous-source validation was run `32688175766` for the source-equivalent head containing implementation checkpoint `6c9d4029a69b9d7313a068f9760332338b40fedf`: Chromium **49/51**, WebKit **49/51**. The 30-cycle city-sheet invariant still failed at **18** Chromium / **13** WebKit callbacks versus unchanged `<=8`; Chromium also hit the known stochastic third-rival initialization timeout, while WebKit's other failure was unsupported mobile `mouse.wheel`.

## Exact current validation
Exact implementation run `32691163962` for `f7fd3b9225b845d748a81f0c68c0d811882b22bf`, artifact `9507360860`:

- Static integrity: **success**.
- Chromium focused: **51/51 passed**.
- WebKit focused: **46/51 passed, 5 failed**.
- Full regression: skipped because focused WebKit remained red.

Factual WebKit failures in CI order:
1. `three same-type stacked units keep distinct selection and orders` — Playwright WebKit actionability waited for a map tile to become stable until the 20 s test timeout. The failure screenshot shows the game/map rendered and the stacked scouts visible; this must be classified as runtime instability vs WebKit actionability artifact before changing source/test behavior.
2. Mouse-wheel zoom — `mouse.wheel` is unsupported by mobile WebKit; known automation limitation, not the next source target.
3. Selected-worker idle callback delta **16** vs unchanged `<=6`.
4. Opening-city actionability timeout on a visible `open-city` context button.
5. 30-cycle city-sheet idle callback delta **13** vs unchanged `<=8`.

The CoherenceFinalize click-scheduler change made Chromium fully green, but WebKit still exposes actionability and idle callback instability. No physical-device QA was initiated. PR #84 remains Draft and unmerged.

## Runtime hardening progress
- StrategyUX broad DOM observers/global-click scheduling are gone; `EpohiRuntimeInvalidation` owns explicit refresh.
- Duplicate player-feedback invalidation and journey/victory/turn observers were removed from stabilization.
- Legacy base `humans-player-feedback.js` observer/global refresh scheduling has been removed; RuntimeInvalidation owns its refresh.
- Event overlay policy no longer schedules normalization for city-modal open/close clicks.
- `src/humans-coherence-finalize.js` no longer registers its broad `cityModal` subtree observer.
- Temporary observer safety suppresses heavy `cityModal` descendant registrations while semantic root signals remain allowed.
- CoherenceFinalize no longer schedules its decorator for every document click; city closing is now quiescent on that path.
- Chromium focused runtime/coherence/capture/diplomacy gate is now fully green at exact checkpoint `f7fd3b92…`.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — branch CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## NEXT ACTION
Treat `f7fd3b9225b845d748a81f0c68c0d811882b22bf` as the latest implementation checkpoint. Before another source push, re-verify the current PR head and use exact run `32691163962` / artifact `9507360860` as the factual baseline.

Investigate the first WebKit failure in CI order: `three same-type stacked units keep distinct selection and orders`. Inspect the WebKit video/error context together with map/context invalidation ownership and determine whether the tile never becomes stable because the DOM is continuously rerendered or because Playwright actionability is incompatible with the transformed mobile map. If runtime DOM churn is present, remove/narrow its native owner without weakening any thresholds. If the rendered tile is stable and only Playwright's native actionability is blocking, change only the automation interaction to an equivalent deterministic DOM/pointer action while preserving all selection/order assertions. Then validate the exact new SHA on Chromium + WebKit before any further source push. Do not prioritize the known unsupported WebKit `mouse.wheel` over this reproduced stacked-unit failure.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
