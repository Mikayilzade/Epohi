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
Latest implementation head: `8e0145bb3af2c677f805c9a5c0290dc9c791d07e` (`Bridge broad visual/context polling to explicit invalidation`).

A status-only commit may advance the branch beyond that SHA without changing runtime behavior; always fetch PR #84 head before the next write.

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
- Expanded the temporary observer bridge to quarantine legacy broad child-list observers on `body`, `#map`, `#screenRoot` and `#contextPanel`. This removes their callback feedback while preserving the modules until direct native cleanup is safe.
- Added `tests/runtime-invalidation.spec.js`: 40 rapid invalidation cycles must coalesce into bounded flushes, settle while idle, retain `broadObservers = 0`, and produce no console/page errors.
- Added that regression to the focused Chromium/WebKit gate and bumped the service-worker cache to include the new runtime module.

## Current blocker
The global `humans-performance.js` MutationObserver wrapper is still temporary scaffolding. `humans-visuals.js` and `humans-context-review-cleanup.js` still instantiate legacy broad observers, but their registrations are now quarantined and useful work is driven explicitly. Remaining high-priority observer debt is in `humans-player-feedback-stabilization.js` (`#contextPanel` / `#victoryContent` subtree observers). Direct removal of the quarantined observer constructors is still required before the wrapper can be retired.

## Latest CI / validation
- Latest fully inspected completed CI remains `Epohi Autonomous Cross-Browser Gate` run #39 for checkpoint `2f65131216a0404a2f07f8160e5ab4a31e5858ed`: **cancelled before tests** while downloading Chromium after a newer push; static/focused/full test steps were skipped. Exact log reported `The operation was canceled`, so this was not a gameplay/test failure.
- For prior implementation SHA `12355b0f362623a948b65cd1515a730c4100cc9b`, the available commit workflow/status endpoints exposed no completed run/check to inspect; it was therefore never marked green.
- Current implementation SHA `8e0145bb3af2c677f805c9a5c0290dc9c791d07e` was pushed once as the coherent code/test checkpoint. Local static validation completed successfully: `node --check` passed for the changed runtime module, performance bridge, regression test and service worker. Cross-browser CI must be inspected on the next run; do not infer green before logs/results exist.

## NEXT ACTION
Inspect the exact Chromium/WebKit gate result for implementation SHA `8e0145bb3af2c677f805c9a5c0290dc9c791d07e`. If it exposes a concrete regression, fix that regression first. If green, continue `MOBILE_RUNTIME_ARCHITECTURE_HARDENING_V1` by replacing the `humans-player-feedback-stabilization.js` context/content subtree polling path with bounded invalidation and then remove the now-quarantined observer constructors from `humans-visuals.js` / `humans-context-review-cleanup.js` directly. Do not ask the user to test.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
