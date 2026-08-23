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
Latest source-triggering implementation checkpoint: `8b7e660df6f954fd24e7a10d61d9a91f47c8938d` (`Synchronize treasury stability decoration`).

Before every further source push, fetch PR #84 head and inspect the exact Chromium/WebKit CI for the latest source-triggering checkpoint. Documentation-only status commits are not implementation checkpoints.

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
- GitHub Actions visibility is restored for PR #84; exact PR-visible Chromium/WebKit runs can be inspected autonomously.
- StrategyUX broad MutationObserver/global-click schedulers were removed; central `EpohiRuntimeInvalidation` owns normal explicit refresh.
- `73d920d6…` added bounded post-transition invalidation for asynchronous main-menu → new-game render and removed the two StrategyUX initialization failures seen previously.
- `24061e1198cfa264bcc20d9f1413d54eac62fdf0` added synchronous capture ownership around pathing/combat calls. Capture became more reliable but remained intermittent.
- Exact rerun of `24061e11…` proved the weighted-pathfinding failure was flaky/non-reproducible; do not change gameplay pathfinding for that signal without a deterministic fixture.
- While that rerun was being diagnosed, source head advanced to `8b7e660d…` with a treasury stability synchronization fix. Its exact CI was therefore inspected before any further source write.
- Exact run `32659384626` for `8b7e660d…`: static integrity **success**; focused Chromium **47/51 passed, 4 failed**; focused WebKit **45/51 passed, 6 failed**; full regression skipped.
- The treasury synchronization improved WebKit and removed the prior treasury selected-city / stacked-unit failures from this exact run.
- Capture remains the first factual Chromium failure: `visible capital attack opens capture choice...` still sometimes loses `#captureChoiceModal.show`.
- Root cause is now narrowed to outcome semantics, not another observer timeout: `src/humans-outcomes.js::rivalIsDefeated()` still uses the legacy rule “no living capital and no settler = defeated”. During the new capture flow a fallen capital may be `capturePending`, and a rival may still own another living city. The scheduled outcome evaluator can therefore announce a premature military victory; `EpohiEventOverlayPolicy` gives `victoryModal` higher priority and removes `.show` from `captureChoiceModal`.
- Correct semantic replacement: a rival is not defeated while any capture is pending; otherwise it is defeated only when explicitly `civ.defeated` or when it has no living city and no living settler. This matches `EpohiCaptureState.finalizeFaction()` and the accepted rule that losing one capital does not destroy a state with surviving cities.
- Existing combat regression `tests/combat-world-stability.spec.js` already directly exercises this defect and remains red when the race occurs; do not weaken it.
- Remaining reproducible debt after capture includes StrategyUX rival-marker refresh, city-sheet open/close stability, WebKit worker callback churn, the runtime-invalidation menu/setup mismatch, and the known Playwright mobile-WebKit `mouse.wheel` limitation.
- No thresholds were weakened. No physical-device QA was initiated.

## Latest CI / validation
- PR #84 remains open, Draft, mergeable, base `prototype/humans-v1`.
- Authoritative implementation checkpoint: `8b7e660df6f954fd24e7a10d61d9a91f47c8938d`.
- Exact run: `32659384626`; job `97243112160`; artifact `9498376580`.
- Chromium focused: **47/51 passed, 4 failed** — capture-choice race; rival-marker refresh; city-sheet open click; runtime-invalidation menu visibility/setup.
- WebKit focused: **45/51 passed, 6 failed** — unsupported mobile-WebKit mouse wheel; diplomacy idle/click stability; worker callback churn; city-sheet open/close stability; runtime-invalidation menu visibility/setup.
- Full Chromium/WebKit regression was correctly skipped because the focused gate failed.

## NEXT ACTION
Change `src/humans-outcomes.js::rivalIsDefeated()` to respect unresolved `capturePending` cities and surviving non-capital cities (no timeout/observer workaround), then run exact Chromium/WebKit CI for that implementation checkpoint before any further source push. If capture turns green, continue with the first remaining factual failure from that exact run.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
