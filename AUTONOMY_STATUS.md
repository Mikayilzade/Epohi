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
Exact PR #84 head inspected before this package: `6207d13418f2110dae64a3460a76d07482286083` (`Normalize cross-browser gate worker contention`).

Its automatically-triggered browser CI is run `32944068129` (run #163), completed **failure**. Artifact `9597752469` (`epohi-autonomous-cross-browser-results`) was downloaded and inspected; static integrity was green and full Chromium/WebKit regression was skipped because the focused gate failed.

## Exact CI / validation for `6207d134...`
- Chromium focused: **53/55 passed, 2 failed**.
  - `tests/runtime-invalidation-cadence.spec.js:3`: the 400 ms request storm produced **13 flushes vs required <=12**.
  - `tests/combat-world-stability.spec.js:177`: the allied joint-war real-turn regression reached the turn increment + idle condition only near the 20-second budget and then timed out on the following proposal read.
- WebKit focused: **53/55 passed, 2 failed**.
  - `tests/combat-world-stability.spec.js:177`: the same joint-war real-turn regression exhausted the unchanged 20-second budget while waiting for the real turn increment + return to `!isTurnProcessing()`.
  - `tests/humans-strategy-ux.spec.js:19`: Playwright mobile WebKit does not support `mouse.wheel`.
- Lower worker contention removed the unrelated hill-movement, three-rival culture, and open-city actionability timeouts from run #162, so the concurrency normalization was useful. It did **not** close joint-war on either engine.
- No timeout, callback threshold, cadence threshold, actionability limit, gameplay assertion, or physical-device requirement was weakened.

## What this package changes
The remaining joint-war timeout is still the canonical first blocker. Its behavior under test is diplomacy/end-turn integration, not 20×20 map rendering. The synthetic `small + 2 rivals` fixture therefore keeps the real End Turn button, real turn increment, real return from turn processing, real `EpohiLivingCivilizations.processTurn()` integration and all joint-war assertions, but caps only `mapSize`-driven iteration/render work at 12 cells for this already-synthetic multi-rival fixture. The backing map and civilization state remain present; no diplomacy processor is called directly and the 20-second timeout remains unchanged.

This is a test-fixture isolation package, not a product gameplay change. The existing joint-war regression remains the acceptance test and is intentionally unchanged.

## Current blocker
The joint-war real-turn regression must become green on both Chromium and WebKit under the unchanged 20-second budget before advancing to the remaining cadence or WebKit wheel failures.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — PR CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## NEXT ACTION
Inspect the exact automatically-triggered Chromium/WebKit CI for the synthetic micro-turn fixture checkpoint containing this status. Do not make another source/test/runtime push while that run is pending. If joint-war is green on both engines, advance to the first remaining factual focused-gate failure from that same run; if it still fails, use only that exact low-contention artifact to choose the next bounded fix without increasing the 20-second timeout or calling the diplomacy processor directly.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
