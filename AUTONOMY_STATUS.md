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
Exact implementation/test head inspected before this bounded package: `b5e22ba0fee7fa5dd34d6de01e977df0535ce9dd` (`Make turn label renders idempotent`). The branch head before packaging was docs-only `a8e2c1b08182c27d4a36fe9d51a83e3e7ad909ed`.

Its automatically-triggered PR workflow run `33037010950` completed **failure**. Static integrity was green; focused Chromium/WebKit gate failed; full mobile regression was correctly skipped. Artifact `9632475575` (`epohi-autonomous-cross-browser-results`) was downloaded and inspected directly.

## Exact CI / validation for `b5e22ba0...`
- Chromium focused: **57/60 passed, 3 failed**.
  - `tests/context-review-cleanup.spec.js:60`: after the fixture directly marked all units acted and city queues occupied, the readiness decorator still showed `2/2` instead of expected `0/2`.
  - `tests/context-review-cleanup.spec.js:95`: direct fixture mutation + `debug.render()` left the context stack decorator unsynchronized, so `[data-context-stack-picker]` was absent.
  - `tests/context-review-cleanup.spec.js:138`: the mobile context/layout scenario timed out waiting for context actions after the same unsynchronized decorator path.
- WebKit focused: **57/60 passed, 3 failed**.
  - `tests/context-review-cleanup.spec.js:60`: readiness decorator showed stale core-rendered value (`2`) instead of `0/2` after direct fixture mutation.
  - `tests/context-review-cleanup.spec.js:138`: top science readiness remained disabled because the test proceeded before explicit context-review synchronization.
  - `tests/humans-strategy-ux.spec.js:19`: Playwright reports `mouse.wheel` unsupported in mobile WebKit.
- No callback-bound or invalidation-cadence failure appears in this exact run; the previous turn-label/observer package therefore removed those from the current focused failure set.
- No timeout, callback threshold, cadence threshold, actionability limit, gameplay assertion, or physical-device requirement was weakened.

## First factual failure and bounded package
The first common factual failure is a **test-harness synchronization defect**, not evidence of a new gameplay regression. `humans-context-review-cleanup.js` no longer owns a broad DOM observer by design; it exposes an explicit `EpohiContextReviewCleanup.sync()` boundary. These tests mutate state directly through `__epohiDebug()` and call the core `debug.render()`, which intentionally does not re-run post-core decorators. The old tests were still relying on the removed observer to eventually synchronize those decorators.

This checkpoint updates only `tests/context-review-cleanup.spec.js`:
- add an explicit `syncContextReview(page)` step after a fresh debug-created game is ready;
- after direct test-only state mutation + `debug.render()`, invoke the explicit context-review synchronization boundary before asserting decorator-owned UI;
- strengthen the readiness regression by asserting `data-ready-count="0"` as well as visible `0/N` text.

No production source, observer, gameplay behavior, timeout, or threshold is changed. This keeps the architecture observer-free while making direct-debug fixtures obey the same explicit ownership boundary they are testing.

## Current blocker
Validate the exact test-harness synchronization package on Chromium and WebKit. The remaining known independent WebKit `mouse.wheel` incompatibility is secondary until this package proves the three context-review failures are removed; do not change it speculatively before the exact new CI result.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — PR CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## NEXT ACTION
Inspect the automatically-triggered exact Chromium/WebKit CI for the source/test commit that follows this status in the same branch update. Do not push another source/test change while that run is in progress. If all context-review-cleanup failures are green, record the exact SHA/counts and fix only the first remaining factual failure (expected candidate: mobile-WebKit wheel input incompatibility) with one bounded package, without weakening gameplay assertions or thresholds. If any context-review failure remains, inspect its exact artifact/log and fix that first.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
