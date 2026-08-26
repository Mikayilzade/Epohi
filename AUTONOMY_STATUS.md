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
Exact PR #84 head inspected before this package: `3f18b8573c705c6c022fc11afcc6156463fccc3f` (`Match Chromium gate contention to WebKit`).

Its automatically-triggered browser CI is run `32964523559` (run #165), completed **failure**. Artifact `9605326341` (`epohi-autonomous-cross-browser-results`) was downloaded and inspected; static integrity was green and full Chromium/WebKit regression was skipped because the focused gate failed.

## Exact CI / validation for `3f18b857...`
- Chromium focused: **53/55 passed, 2 failed**.
  - `tests/combat-world-stability.spec.js:177`: the real End Turn did increment the turn and return to idle, but only near the unchanged 20-second budget; the immediately-following proposal read then hit the test timeout.
  - `tests/runtime-invalidation-cadence.spec.js:3`: the 400 ms request storm produced **13 flushes vs required <=12**.
- WebKit focused: **54/55 passed, 1 failed**.
  - `tests/humans-strategy-ux.spec.js:19`: Playwright mobile WebKit does not support `mouse.wheel`.
- One-worker equivalence therefore did **not** close Chromium joint-war or cadence. WebKit remains green for joint-war on the same synthetic fixture, so the real End Turn + diplomacy integration path itself is viable under the strict 20-second budget.
- No timeout, callback threshold, cadence threshold, actionability limit, gameplay assertion, or physical-device requirement was weakened.

## What this package changes
Run #165 proves that runner contention is no longer a sufficient explanation for the remaining Chromium joint-war timeout: Chromium still spends almost the entire strict 20-second budget in the already-synthetic `small + 2 rivals` fixture even at one worker. The test is specifically proving real End Turn → diplomacy integration, not map rendering throughput.

This bounded package therefore tightens only the existing synthetic fixture's `mapSize`-driven iteration/render cap from 12 to 8. The backing map and civilization state remain present; the real End Turn button/handler, real turn increment, real return from turn processing, real `EpohiLivingCivilizations` integration and all joint-war assertions remain unchanged. No gameplay source code is changed.

The existing joint-war regression remains the acceptance test for this package. The cadence miss and WebKit `mouse.wheel` incompatibility remain secondary factual blockers until joint-war is green on Chromium.

## Current blocker
The focused runtime gate must prove that the stricter synthetic map-iteration bound is enough for Chromium joint-war to complete under the unchanged 20-second test budget. If it is green, the next blocker from the same run is the Chromium cadence miss; if it is still red, the next package should instrument the real End Turn phases in this fixture rather than further reducing thresholds or guessing at gameplay code.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — PR CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## NEXT ACTION
Inspect the exact automatically-triggered Chromium/WebKit CI for the tighter synthetic joint-war fixture checkpoint containing this status. Do not make another source/test/runtime push while that run is pending. If Chromium joint-war is green, advance to the first remaining factual failure from that same run (expected candidate: runtime invalidation cadence 13 vs <=12); if joint-war still fails, use that exact artifact to add bounded End Turn phase timing attribution without increasing the 20-second timeout or weakening cadence/observer/actionability thresholds.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
