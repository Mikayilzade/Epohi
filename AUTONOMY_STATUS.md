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
Exact implementation/test head inspected before this package: `341873fa4b0ee3f74366bed1a7e7d9bb44ec40fe` (`Bound observer feedback redelivery cadence`).

Its automatically-triggered PR workflow is run `33030989443` (run #175), completed **failure**. Artifact `9630310197` (`epohi-autonomous-cross-browser-results`) was downloaded and inspected. Static integrity was green; full Chromium/WebKit regression was skipped because the focused gate failed.

## Exact CI / validation for `341873fa...`
- Chromium focused: **57/59 passed, 2 failed**.
  - `tests/mobile-performance-stability.spec.js:219`: 30 city open/close cycles left **12 observer callbacks vs required <=8**.
  - `tests/runtime-invalidation-cadence.spec.js:4`: invalidation request storm produced **13 flushes vs required <=12**.
- WebKit focused: **56/59 passed, 3 failed**.
  - `tests/humans-strategy-ux.spec.js:19`: Playwright mobile WebKit does not support `mouse.wheel`.
  - `tests/mobile-performance-stability.spec.js:219`: 30 city open/close cycles left **12 observer callbacks vs required <=8**.
  - `tests/observer-startup-attribution.spec.js:253`: diagnostic callback gate also measured **12 vs <=8**.
- The 128 ms observer redelivery floor did not solve the callback gate.
- Crucially, both retained callback diagnostics reported `callbackDelta:12` while `attributionDelta` was empty. The startup diagnostic also reported an empty `pendingBefore` list. This means the current attribution layer can no longer name internal safety deliveries after observer-safety moved from `requestAnimationFrame` to `setTimeout` / `queueMicrotask`; it tracks only rAF delivery scheduling and therefore has a measurement blind spot.
- No timeout, cadence threshold, callback threshold, actionability limit, gameplay assertion, or physical-device requirement was weakened.

## Diagnostic finding
The first factual blocker is still the 30-cycle callback gate, but the retained owner attribution is now incomplete rather than evidence for another semantic owner. `tests/observer-startup-attribution.spec.js` wraps `requestAnimationFrame` only, while `src/humans-performance.js` currently schedules first delivery through `queueMicrotask` and delayed redelivery through `setTimeout`. Therefore safety callbacks can execute during the quiet window with no corresponding scheduled/executed attribution delta.

## Bounded package in this checkpoint
- Extend startup observer attribution to wrap `setTimeout` and `queueMicrotask` in addition to `requestAnimationFrame` before application scripts load.
- Attribute scheduled/executed safety deliveries to the native observer owner through the existing `currentObserverId` / drained-owner mechanism.
- Record delivery-kind deltas (`requestAnimationFrame`, `setTimeout`, `queueMicrotask`) in snapshots, `pendingBefore`, retained artifact JSON and console output.
- This is diagnostic/test-only: no gameplay source, callback threshold, invalidation threshold or timeout is changed.

## Current blocker
Validate the improved attribution on exact Chromium/WebKit CI and use its retained `city-30-cycle-idle` payload to identify the first actual observer-safety owner of the 12 callbacks. Do not make a speculative source fix before that evidence exists. Chromium cadence **13 vs <=12** and WebKit `mouse.wheel` remain secondary until the callback owner is named.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — PR CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## NEXT ACTION
Inspect the automatically-triggered exact Chromium/WebKit CI for the commit containing this status. Do not push another source/test change while that run is in progress. If the 30-cycle callback gate still fails, inspect the retained `city-30-cycle-idle` delivery-kind attribution and fix only the first measured owner with one bounded source+regression package. If the callback gate is green on both engines, record the exact counts/SHA and target the first remaining factual failure without weakening thresholds.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
