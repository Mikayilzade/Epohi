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
Latest implementation head: `6ba7e0c0f6d735de26824388bcb8fa929d3886a3` (`Bridge player feedback into bounded invalidation`).

Current branch head before this CI-infrastructure repair: `7a173dd30b81cf4a7476c6e30f1d5b7e5439679e` (`Record bounded player feedback checkpoint`).

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
- Extended the bounded invalidation owner to call the existing `EpohiPlayerFeedbackStabilization` synchronization APIs (`ensureStableControls`, `preserveFreePlay`, `stabilizeMovementExplanation`, `expireSkippedJourneyEvents`) once per coalesced flush. This restores context/outcome feedback work through explicit invalidation while old broad subtree observers remain quarantined.
- Strengthened `tests/runtime-invalidation.spec.js` to prove player-feedback synchronization runs through the bounded scheduler and still settles at idle.

## Current blocker
The global `humans-performance.js` MutationObserver wrapper remains temporary scaffolding. `humans-visuals.js` and `humans-context-review-cleanup.js` still instantiate quarantined broad observers, and `humans-player-feedback-stabilization.js` still declares context/content subtree observers even though useful player-feedback synchronization is now available through the explicit invalidation bridge. Those constructors must be removed directly before the global wrapper can be retired.

## Latest CI / validation
- PR #84 verified open Draft, mergeable, base `prototype/humans-v1`; current PR head before this repair was `7a173dd30b81cf4a7476c6e30f1d5b7e5439679e`.
- Exact cross-browser run for implementation SHA `6ba7e0c0f6d735de26824388bcb8fa929d3886a3`: workflow run `32543982175`, job `96959110850`, conclusion `failure`.
- Failure is CI infrastructure only, not gameplay/runtime: browser installation completed successfully, then `Static integrity` failed at `git diff --check HEAD^ HEAD` because `actions/checkout@v4` used the default shallow `fetch-depth: 1`, so `HEAD^` was unavailable (`fatal: ambiguous argument 'HEAD^'`). Focused Chromium/WebKit and full regression steps were therefore skipped.
- This package repairs the workflow by checking out depth 2, preserving the existing static integrity check instead of weakening it.
- Cross-browser gameplay status for `6ba7e0c0...` remains unknown until the repaired workflow executes; do not mark it green based on this run.

## NEXT ACTION
Inspect the exact repaired cross-browser gate result produced by the CI-depth fix. If Chromium or WebKit exposes a concrete test regression, fix that regression first. If the repaired gate is green, directly remove the now-redundant broad `#contextPanel` / `#victoryContent` subtree observers from `humans-player-feedback-stabilization.js`, then remove the quarantined observer constructors from `humans-visuals.js` / `humans-context-review-cleanup.js` while keeping the explicit invalidation path and regression coverage. Do not ask the user to test.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
