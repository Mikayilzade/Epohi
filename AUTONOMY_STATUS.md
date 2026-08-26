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
Exact implementation/test head inspected before this package: `09b87550e70d7be8ffd95dd7e915ea8f3fc049f5` (`Attribute post-turn async callback owners`).

Its automatically-triggered PR workflow is run `33001430579` (run #170), completed **failure**. Artifact `9618930823` (`epohi-autonomous-cross-browser-results`) was downloaded and inspected. Static integrity was green; full Chromium/WebKit regression was skipped because the focused gate failed.

## Exact CI / validation for `09b87550...`
- Chromium focused: **54/56 passed, 2 failed**.
  - `tests/combat-world-stability.spec.js:177`: joint-war real-turn scenario exhausted the unchanged 20-second budget after End Turn.
  - `tests/runtime-invalidation-cadence.spec.js:192`: the retained synthetic joint-war diagnostic also stalled after End Turn.
- WebKit focused: **55/56 passed, 1 failed**.
  - `tests/humans-strategy-ux.spec.js:19`: Playwright mobile WebKit does not support `mouse.wheel`.
- No timeout, cadence threshold, callback threshold, actionability limit, gameplay assertion, or physical-device requirement was weakened.

## Diagnostic finding
Run #170 identified the measured Chromium starvation owner. The synthetic joint-war trace produced about **1.18 million `queueMicrotask` deliveries** from `src/humans-performance.js:161/180`: one stack originated in the coalesced `MutationObserver` callback and the other in `restoreObserver -> scheduleDelivery` after protected work. The callback bodies themselves were cheap; the browser was monopolized by an unbounded microtask feedback chain between observer deliveries. WebKit did not reproduce that starvation and reached the same scenario normally.

## Bounded package in this checkpoint
- Keep the first observer delivery as a microtask so ordinary mutation latency remains before the next animation frame.
- Add a per-observer **64 ms redelivery floor** after a delivery; feedback-generated pending records are coalesced into one deferred native timer instead of recursively monopolizing the microtask queue.
- Cancel any deferred delivery on client disconnect and bump the safety/performance versions.
- Strengthen `tests/observer-delivery-latency.spec.js` with a two-observer cross-feedback regression that requires a normal timer to run and bounds callback growth, while retaining the original before-next-frame latency assertion.

## Current blocker
Validate the bounded observer-redelivery fix on the exact Chromium/WebKit CI for the commit containing this status. Secondary known blockers remain WebKit `mouse.wheel` support and any factual failures that survive after the Chromium starvation is removed.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — PR CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## NEXT ACTION
Inspect the automatically-triggered exact Chromium/WebKit CI for the commit containing this status. Do not push another source change while that run is in progress. If the joint-war Chromium starvation and new cross-observer feedback regression are green, record the exact counts/SHA and target the first remaining factual failure (expected candidate: WebKit `mouse.wheel`) with one bounded package; otherwise fix only the first measured failure from that exact run.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
