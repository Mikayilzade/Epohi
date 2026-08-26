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
Exact PR #84 head inspected before this package: `4b5fe8272219d0a7b9122f83be46aba86c67daa0` (`Bound synthetic joint-war turn fixture`).

Its automatically-triggered browser CI is run `32959775485` (run #164), completed **failure**. Artifact `9603600991` (`epohi-autonomous-cross-browser-results`) was downloaded and inspected; static integrity was green and full Chromium/WebKit regression was skipped because the focused gate failed.

## Exact CI / validation for `4b5fe827...`
- Chromium focused: **53/55 passed, 2 failed**.
  - `tests/combat-world-stability.spec.js:177`: the real End Turn did increment the turn and return to idle, but only near the 20-second budget; the immediately-following proposal read then hit the unchanged 20-second test timeout.
  - `tests/runtime-invalidation-cadence.spec.js:3`: the 400 ms request storm produced **13 flushes vs required <=12**.
- WebKit focused: **54/55 passed, 1 failed**.
  - `tests/humans-strategy-ux.spec.js:19`: Playwright mobile WebKit does not support `mouse.wheel`.
- Crucially, the unchanged joint-war real-turn regression is now **green on WebKit** with the synthetic micro-turn fixture and one WebKit worker. That proves the fixture can satisfy the 20-second budget without bypassing real End Turn or calling the diplomacy processor directly.
- No timeout, callback threshold, cadence threshold, actionability limit, gameplay assertion, or physical-device requirement was weakened.

## What this package changes
Run #164 provides a clean contention comparison: WebKit at one worker passed joint-war, while Chromium at two workers still spent almost the entire 20-second budget in the same real-turn scenario and also missed the cadence limit by one flush. The earlier 4→2 Chromium reduction had already removed several unrelated timing failures. The next bounded step is therefore CI-equivalence, not another speculative gameplay/test-fixture rewrite.

This package changes only the temporary PR gate concurrency: focused and full Chromium are reduced from 2 workers to 1, matching WebKit. The strict 20-second per-test timeout, `<=12` cadence assertion, `<=6/<=8` observer thresholds, 1-second actionability limits, real End Turn path and all gameplay assertions remain unchanged.

## Current blocker
The focused runtime gate must prove the unchanged joint-war and cadence assertions under one-worker Chromium contention before any further source/test changes. The WebKit `mouse.wheel` incompatibility remains the next known browser-specific factual failure if the focused runtime assertions become green.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — PR CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## NEXT ACTION
Inspect the exact automatically-triggered Chromium/WebKit CI for the one-worker-equivalence checkpoint containing this status. Do not make another source/test/runtime push while that run is pending. If joint-war and cadence are green on Chromium, advance to the first remaining factual focused-gate failure from that same run (expected candidate: WebKit mouse-wheel incompatibility); otherwise use only that exact one-worker artifact to choose the next bounded fix without increasing the 20-second timeout or weakening cadence/observer/actionability thresholds.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
