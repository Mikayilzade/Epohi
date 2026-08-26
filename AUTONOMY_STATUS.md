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
Exact implementation/test head before this status update: `a06ec6a5272b357bcd3e9b8a881c47d7ff6c7a97` (`Attribute synthetic end-turn phase timing`).

Its automatically-triggered PR workflow is run `32981622581` (run #167), completed **failure**. Artifact `9611963795` (`epohi-autonomous-cross-browser-results`) was downloaded and inspected. Static integrity was green; full Chromium/WebKit regression was skipped because the focused gate failed.

## Exact CI / validation for `a06ec6a5...`
- Chromium focused: **53/55 passed, 2 failed**.
  - `tests/combat-world-stability.spec.js:177`: real End Turn reached turn increment + idle only near the unchanged 20-second budget; the immediately-following proposal read timed out.
  - `tests/runtime-invalidation-cadence.spec.js:3`: request storm produced **13 flushes vs required <=12**.
- WebKit focused: **54/55 passed, 1 failed**.
  - `tests/humans-strategy-ux.spec.js:19`: Playwright mobile WebKit does not support `mouse.wheel`.
- Observer/quiet-window regressions stayed bounded in this run (Chromium worker/city callback deltas 0; WebKit selected-worker 0 and city-cycle callback delta 2).
- No timeout, cadence threshold, callback threshold, actionability limit, gameplay assertion, or physical-device requirement was weakened.

## Diagnostic finding
The fixture wrappers added at `a06ec6a5...` instrument `EpohiLivingCivilizations.processTurn` and `processAlliedActions`, but run #167's retained focused logs contain **no `[fixture-phase]` lines** because browser console output is not forwarded into the Playwright line reporter by this test. Therefore the diagnostic plumbing did not yet produce attributable phase evidence; making a gameplay/source change now would be speculative.

## Current blocker
Capture the existing synthetic joint-war End Turn timing into retained CI output under the same strict 20-second budget. The diagnostic must expose total End Turn wall time plus the already-wrapped living-civilization phase timings. Only after that evidence names or excludes those phases should the next source/test package target a measured owner. Chromium cadence 13 vs <=12 and WebKit `mouse.wheel` remain secondary factual blockers.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — PR CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## NEXT ACTION
Make exactly one test-only diagnostic checkpoint that forwards `[fixture-phase]` browser console entries into retained Playwright output and records total synthetic joint-war End Turn wall time while preserving the real End Turn path and unchanged 20-second timeout. Inspect its exact Chromium/WebKit CI before any gameplay/source fix; if living-civilization phases are cheap, instrument the next measured End Turn owner instead of shrinking the fixture or weakening thresholds.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
