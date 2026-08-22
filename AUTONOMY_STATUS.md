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
Latest implementation head before this package: `8e0145bb3af2c677f805c9a5c0290dc9c791d07e` (`Bridge broad visual/context polling to explicit invalidation`).

This run prepares one coherent implementation commit from branch head `cd02ade465c8e731ef8766924cd2e4c609f7f205`; after commit, use the resulting commit SHA as the new implementation checkpoint.

## Why manual QA is suspended
Latest physical iPhone/Safari smoke failed:
- phone heated quickly;
- UI froze and flickered;
- event decisions were clickable;
- opening a city repeatedly appeared to open/cancel and eventually became unusable.

The user should not test intermediate patches again. Next physical-device test is reserved for a Release Candidate after automated gates.

## Phase plan
- [x] Phase 0A — define autonomous control plane and quality gates.
- [x] Phase 0B — configure branch CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## Phase 1 progress
- Added `RUNTIME_OBSERVER_MAP.md` with confirmed ownership/cycle inventory and explicit debt.
- Refactored `src/humans-observer.js` from broad DOM polling to bounded invalidation; `broadObservers = 0` and it emits `epohi:humans-ui-settled`.
- Added `src/humans-runtime-invalidation.js`: one coalesced RAF owner driven by explicit settled/action/pageshow/visibility signals; it refreshes visuals and context cleanup without adding DOM observers.
- Expanded the temporary observer bridge to quarantine legacy broad child-list observers on `body`, `#map`, `#screenRoot` and `#contextPanel`.
- Added `tests/runtime-invalidation.spec.js` for bounded coalescing and idle quiescence.
- This package extends the same bounded invalidation owner to call the existing `EpohiPlayerFeedbackStabilization` synchronization APIs (`ensureStableControls`, `preserveFreePlay`, `stabilizeMovementExplanation`, `expireSkippedJourneyEvents`) once per coalesced flush. This restores context/outcome feedback work through explicit invalidation while the old broad subtree observers remain quarantined.
- Strengthened `tests/runtime-invalidation.spec.js` to prove player-feedback synchronization runs through the bounded scheduler and still settles at idle.

## Current blocker
The global `humans-performance.js` MutationObserver wrapper remains temporary scaffolding. `humans-visuals.js` and `humans-context-review-cleanup.js` still instantiate quarantined broad observers, and `humans-player-feedback-stabilization.js` still declares context/content subtree observers even though useful player-feedback synchronization is now available through the explicit invalidation bridge. Those constructors must be removed directly before the global wrapper can be retired.

## Latest CI / validation
- PR #84 is still open Draft, mergeable, base `prototype/humans-v1`; fetched branch head before writing was `cd02ade465c8e731ef8766924cd2e4c609f7f205`.
- Exact workflow/status lookup for prior implementation SHA `8e0145bb3af2c677f805c9a5c0290dc9c791d07e` exposed no run/check through the available commit workflow/status endpoints, so it is not marked green.
- Latest fully inspected completed CI remains run #39 for `2f65131216a0404a2f07f8160e5ab4a31e5858ed`, cancelled during Playwright browser download before tests; this was infrastructure/concurrency cancellation, not a gameplay failure.
- This package is intentionally one source+test+status checkpoint. Cross-browser CI for the resulting SHA must be inspected on the next run; do not infer green before logs/results exist.

## NEXT ACTION
Inspect the exact Chromium/WebKit gate result for the new implementation checkpoint produced by this package. If it exposes a concrete regression, fix that regression first. If green, directly remove the now-redundant broad `#contextPanel` / `#victoryContent` subtree observers from `humans-player-feedback-stabilization.js`, then remove the quarantined observer constructors from `humans-visuals.js` / `humans-context-review-cleanup.js` while keeping the explicit invalidation path and regression coverage. Do not ask the user to test.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
