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
Latest implementation checkpoint remains `6273417945b098fefa9cd3c3a10c63c7238bf438` (`Stabilize joint-war real-turn regression`).

Current PR head before this status-only update was `1d04d5a06acfc28ac9657e273695ae77e9bebc2d`; its run `32897857005` (run #158) completed success only because the latest commit was documentation-only, so browser/static steps were correctly skipped. It is **not** evidence that the implementation checkpoint is green.

The exact implementation CI is run `32897820336` (run #157), attempt #2, for `6273417945b098fefa9cd3c3a10c63c7238bf438`. Attempt #2 completed **failure** after a real browser execution. Artifact `9583469380` (`epohi-autonomous-cross-browser-results`) was downloaded and inspected.

## Exact CI / validation for `62734179...`
- Static integrity: **success**.
- Chromium focused: **52/55 passed, 3 failed**.
  - `tests/combat-world-stability.spec.js:177`: the allied joint-war real-turn regression still exhausted the 20-second test budget. The turn increment / idle wait completed, but the test timed out immediately afterward while reading the generated proposal, showing that the real two-rival turn consumed essentially the whole budget.
  - `tests/humans-strategy-ux.spec.js:113`: the three-rival political-campaign scenario timed out waiting for all rivals to have populated `cultureKey`.
  - `tests/runtime-invalidation.spec.js:4`: bounded invalidation produced **16 flushes vs required <15** under this run.
- WebKit focused: **52/55 passed, 3 failed**.
  - `tests/combat-world-stability.spec.js:177`: the same joint-war scenario timed out while waiting for the real turn to increment and return to idle.
  - `tests/humans-strategy-ux.spec.js:19`: Playwright mobile WebKit does not support `mouse.wheel`.
  - `tests/mobile-performance-stability.spec.js:190`: physical `open-city` Playwright click did not become actionable within the unchanged 1-second timeout.
- Full Chromium/WebKit regression: skipped because the focused gate failed.
- The observer/callback hardening remains materially improved: startup attribution in WebKit recorded the 30-cycle quiet window at `callbackDelta: 2`, inside the `<=8` requirement.

## What this run established
The previous joint-war fixture reduction (clearing rival unit arrays and barbarians) was insufficient to keep a genuine two-rival end-turn inside the focused 20-second budget on both engines. The failure is still inside the intended real-turn regression, so it remains the first blocker from the current `NEXT ACTION`; do not skip it or replace it with a direct `EpohiLivingCivilizations.processTurn()` call, because that would stop proving end-turn integration.

The next bounded test change should reduce only irrelevant world-generation/render workload by running this specific real-turn regression on the already-supported `small` map fixture while retaining: two rivals, the actual End Turn button, a real turn increment, return to `!isTurnProcessing()`, generation of the pending `jointWar` proposal, and rejection of a repeated proposal after the target is already at war. This is fixture isolation, not a timeout/behavior weakening.

## Current blocker
The joint-war integration regression is still not green on either browser. Do not advance to the WebKit `mouse.wheel`, city actionability, invalidation-flush, or three-rival campaign failures until one bounded joint-war fixture-isolation checkpoint has exact Chromium/WebKit evidence.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — PR CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## NEXT ACTION
Make one test-only bounded fixture-isolation checkpoint for `tests/combat-world-stability.spec.js:177`: run only the allied joint-war real-turn scenario on `createGame(..., 2, 'small')` (or an equivalent local helper parameter) while preserving the actual End Turn interaction and every existing diplomacy assertion. Do not increase the 20-second test timeout and do not call the diplomacy processor directly. Then inspect the exact automatically-triggered Chromium/WebKit CI before any further source/test/runtime push.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
