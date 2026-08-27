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
Exact implementation/test head inspected before this package: `dfc3e5ef1bf068c69fd9fe09e7ad8e9342714de9` (`Attribute observer safety timer deliveries`).

Its automatically-triggered PR workflow is run `33033995448`, completed **failure**. Artifact `9631408038` (`epohi-autonomous-cross-browser-results`) was downloaded and inspected. Static integrity was green; full Chromium/WebKit regression was skipped because the focused gate failed.

## Exact CI / validation for `dfc3e5ef...`
- Chromium focused: **56/59 passed, 3 failed**.
  - `tests/mobile-performance-stability.spec.js:219`: 30 city open/close cycles left **12 observer callbacks vs required <=8**.
  - `tests/observer-startup-attribution.spec.js:293`: controlled 30-cycle diagnostic also measured **12 callbacks vs <=8**.
  - `tests/runtime-invalidation-cadence.spec.js:4`: invalidation request storm produced **13 flushes vs required <=12**.
- WebKit focused: **57/59 passed, 2 failed**.
  - `tests/humans-strategy-ux.spec.js:19`: Playwright mobile WebKit does not support `mouse.wheel`.
  - `tests/observer-startup-attribution.spec.js:293`: controlled 30-cycle diagnostic measured **12 callbacks vs <=8**.
- The improved attribution is now conclusive: immediately before the quiet window there are **12 pending observer-safety deliveries**, and all 12 execute once during that window. The owners are independent legacy observers, but every measured cohort contains a `#turnValue` registration; most observe only `#turnValue`, while PopulationWorkforce also observes its small explicit roots. No new native mutation callback/record is required during the quiet window for those queued deliveries to fire.
- No timeout, cadence threshold, callback threshold, actionability limit, gameplay assertion, or physical-device requirement was weakened.

## Diagnostic finding
The common source is the turn label itself rather than one modal owner. `app.js::renderTop()` unconditionally assigns `turnValue.textContent = String(state.turn)` on every render, even when the turn has not changed. Replacing an identical text node still emits a `childList` mutation, so any decorator/observer callback that causes another render can wake the whole `#turnValue` observer cohort again and leave one synchronized safety delivery per owner queued into the later quiet window.

## Bounded package in this checkpoint
- Add `src/humans-turn-label-stability.js`, loaded immediately after `humans-performance.js`, that makes only `#turnValue.textContent` idempotent: identical text writes are no-ops, while a real turn-number change still delegates to the native DOM setter.
- Add `tests/turn-label-idempotence.spec.js`: a real turn-label change must render, then 30 same-turn renders must preserve the same text node and text value.
- Add that regression to the focused Chromium/WebKit gate.
- This package does not suppress any semantic observer, change gameplay, or weaken any threshold; it removes the redundant DOM mutation that all 12 measured owners share.

## Current blocker
Validate this exact idempotent-turn-label package on Chromium and WebKit. The callback gate is still the first blocker until the new exact CI proves the 12 queued deliveries are gone or reduced within <=8. Chromium cadence **13 vs <=12** and WebKit `mouse.wheel` remain secondary until then.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — PR CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## NEXT ACTION
Inspect the automatically-triggered exact Chromium/WebKit CI for the commit containing this status. Do not push another source/test change while that run is in progress. If the 30-cycle callback gates are green on both engines, record exact counts/SHA and target the first remaining factual failure without weakening thresholds. If callback bounds still fail, inspect the retained attribution and fix only the first remaining measured feedback source with one bounded source+regression package.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
