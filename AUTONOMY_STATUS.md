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
Latest implementation head: `c4773deb81ea50bec48c35c99ed3466f20921097` (`Deduplicate global click invalidation`).

The following status update is documentation-only and should not trigger branch CI. Always fetch PR #84 head before the next implementation write.

## Why manual QA is suspended
Latest physical iPhone/Safari smoke failed with rapid heat, UI freeze/flicker and unstable city opening. The user should not test intermediate patches again. Next physical-device test is reserved for a Release Candidate after automated gates.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — branch CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## Phase 1 progress
- `RUNTIME_OBSERVER_MAP.md` records confirmed ownership/cycle inventory and explicit debt.
- `src/humans-observer.js` no longer performs broad DOM polling and now also no longer schedules a second global document-click sync. Its semantic signals are limited to new-game/open-map, turn, menu, pageshow and visibility.
- `src/humans-runtime-invalidation.js` remains the single global click owner and coalesces visual/context/player-feedback work into one protected RAF invalidation path.
- `src/humans-player-feedback-stabilization.js` no longer creates broad `#victoryContent` or `#contextPanel` subtree observers.
- `src/humans-context-review-cleanup.js` version 3 removes both remaining broad context observers (`#contextPanel` and `document.body`).
- `tests/runtime-invalidation.spec.js` now rejects restoration of the old global observer click listener, requires observer v3, verifies one runtime action signal per menu click and bounds flushes for that interaction.
- Broad visual observer constructors in `src/humans-visuals.js` remain quarantined by the observer-safety bridge and are still architectural debt.

## Current blocker
The new implementation `c4773deb81ea50bec48c35c99ed3466f20921097` is awaiting its own Chromium/WebKit result. The previous exact run still showed shared city-control instability plus WebKit observer churn; do not make another source push until the new run is diagnosed.

## Latest CI / validation
- PR #84 verified open, Draft, mergeable, base `prototype/humans-v1`; branch head before this implementation write was documentation checkpoint `f68a1b4b07e944d7bf20b0ed81c23de6274474db`, parent implementation `acb2b026e98ab4895960146e92b18c22412fa9d4`.
- Exact workflow for `acb2b026e98ab4895960146e92b18c22412fa9d4`: run `32554990081`, run #49, completed **failure**. Static integrity passed; focused cross-browser gate failed, therefore full mobile regression did not run.
- Chromium focused: **44/49 passed, 5 failed**. Failures: capture-choice modal did not open after visible capital attack; activity military switcher remained disabled; known finite POI collection scenario failed; political campaign scenario failed; physical `open-city` click did not become stable within 1 second.
- WebKit focused: **43/49 passed, 6 failed**. Failures: selected non-capital treasury administration card missing; stacked-unit order test timed out; mobile WebKit does not support Playwright `mouse.wheel`; selected-worker idle produced **18 observer callbacks vs allowed <=6**; physical `open-city` click did not become stable within 1 second; physical city close failed stability during the 30-cycle stress test.
- Shared actionable signal: city interaction is still physically unstable on both engines, while WebKit retains callback churn. The old architecture delivered every click through both `humans-observer` (`setTimeout -> sync -> ui-settled`) and `humans-runtime-invalidation` (RAF), creating redundant post-click layout work.
- Implementation `c4773deb81ea50bec48c35c99ed3466f20921097` removes that duplicate global observer click path without weakening any click timeout or callback threshold and adds a regression proving the runtime invalidation layer is the sole global click owner.
- CI result for `c4773deb81ea50bec48c35c99ed3466f20921097`: **pending**.

## NEXT ACTION
Inspect the exact Chromium/WebKit workflow result and artifacts for implementation SHA `c4773deb81ea50bec48c35c99ed3466f20921097`. If shared city click/close instability or WebKit idle observer churn remains, diagnose the first exact remaining mutation/layout owner from that run and fix it without weakening responsiveness thresholds; if those shared runtime failures are green, proceed to the next concrete focused failure before removing the global safety bridge.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.