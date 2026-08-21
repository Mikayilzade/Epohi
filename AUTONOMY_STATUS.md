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
Latest implementation head: `12355b0f362623a948b65cd1515a730c4100cc9b` (`Harden humans observer invalidation loop`).

Status-only updates may advance the branch beyond that SHA without changing runtime behavior; always fetch PR #84 head before the next write.

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
- Refactored `src/humans-observer.js` from broad DOM polling to bounded invalidation: removed `screenRoot`, map and `menuContent` observers; retained only `#turnValue` and `#menuModal` class observers plus coalesced explicit action signals.
- Added `EpohiHumansObserver.requestSync()` / runtime stats and an `epohi:humans-ui-settled` signal for later decorator migration.
- Strengthened `tests/mobile-performance-stability.spec.js` with a 30-cycle city open/close regression and explicit `broadObservers = 0` / idle-sync bounds for this module.

## Current blocker
Broader runtime debt remains. Confirmed high-priority loops are `humans-visuals.js` (`screenRoot` subtree + map observer), `humans-context-review-cleanup.js` (`contextPanel` subtree + body subtree; body currently suppressed by the global safety wrapper), and context/content observers in `humans-player-feedback-stabilization.js`. The global `humans-performance.js` MutationObserver monkey-patch is still temporary containment and must not be considered the final architecture.

## Latest CI
Latest inspected completed run: `Epohi Autonomous Cross-Browser Gate` run #39 for checkpoint `2f65131216a0404a2f07f8160e5ab4a31e5858ed` ended **cancelled before tests**. Exact log: dependency installation completed, Playwright began downloading Chromium (`184.3 MiB`), then GitHub reported `The operation was canceled`; static/focused/full test steps were skipped. This was a concurrency/new-push cancellation, not a test failure.

Implementation push `12355b0f362623a948b65cd1515a730c4100cc9b` is the next code checkpoint for the push-gated cross-browser workflow. At this status write there is no failure notification for that SHA yet; do not mark it green until its run and logs are inspected.

## NEXT ACTION
Inspect the cross-browser CI run for implementation SHA `12355b0f362623a948b65cd1515a730c4100cc9b` and exact logs. If the gate itself runs, fix any concrete Chromium/WebKit regression it exposes; if green, continue `MOBILE_RUNTIME_ARCHITECTURE_HARDENING_V1` by removing the broad `humans-visuals.js` screen/map polling path and then replacing the `humans-context-review-cleanup.js` body/context feedback loop with bounded explicit invalidation. Do not ask the user to test.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
