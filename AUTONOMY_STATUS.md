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
Exact implementation/test head inspected before this bounded package: `1162ca0d0a1029e60c6d1f16055980888403dd34` (`Make wheel zoom regression cross-browser deterministic`). PR #84 was confirmed open/draft with this exact head before writing.

Its automatically-triggered PR workflow run `33059394360` completed **failure**. Static integrity was green; focused Chromium/WebKit gate failed; full mobile regression was correctly skipped. Artifact `9641197429` (`epohi-autonomous-cross-browser-results`) was downloaded and inspected directly.

## Exact CI / validation for `1162ca0d...`
- Chromium focused: **59/60 passed, 1 failed**.
  - `tests/runtime-invalidation-cadence.spec.js:4`: a 400 ms request storm produced **13 flushes vs required ≤12**.
- WebKit focused: **59/60 passed, 1 failed**.
  - `tests/context-review-cleanup.spec.js:65`: the readiness units control was enabled at the explicit readiness assertion, but became disabled before Playwright could complete the subsequent click, timing out at 20 s. This remains secondary for this package.
- The deterministic mobile overflow regression is green on both engines.
- The DOM `WheelEvent` zoom regression is green on both engines; the prior Playwright WebKit `mouse.wheel` incompatibility is gone.
- Callback churn remains inside limits; no callback threshold, timeout, actionability limit, or gameplay assertion was weakened.

## First factual failure and bounded package
The first remaining factual failure is the Chromium runtime-invalidation cadence. The scheduler used `MIN_FLUSH_INTERVAL_MS = 32`, but a 400 ms storm can legitimately contain an immediate flush plus twelve 32 ms intervals (0, 32, ..., 384 ms), i.e. **13 flushes**. The implementation therefore did not mathematically guarantee the existing `≤12` gate.

This bounded package:
- raises the production minimum invalidation interval from **32 ms to 36 ms**, capping sustained scheduler work below ~28 Hz while remaining far inside the 1 s actionability gates;
- bumps `EpohiRuntimeInvalidation.version` to 13;
- adds `tests/runtime-invalidation-repeat-cadence.spec.js`, which runs two consecutive 400 ms request storms and requires each to stay `≤12` with no scheduled tail, so the fix is covered against stateful drift as well as a single burst.

No timeout, callback/cadence threshold, gameplay assertion, or browser-specific skip is changed.

## Current blocker
Validate the 36 ms cadence bound on exact Chromium/WebKit CI. The WebKit readiness-button transition timeout from run `33059394360` remains the next known secondary failure and must not be changed in this same package.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — PR CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## NEXT ACTION
Inspect the automatically-triggered exact Chromium/WebKit CI for this cadence package. Do not push another source/test change while that run is in progress. If the cadence regression is green, record exact counts and fix only the first remaining factual failure from that exact run (expected next candidate: the WebKit readiness units control transition if it reproduces). If cadence still fails, inspect its exact artifact/log and repair that first without weakening the `≤12` threshold.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
