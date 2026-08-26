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
Exact implementation/test head inspected before this package: `7713791965cd29e67b5ed368ee76df919e9ad506` (`Bound observer redelivery feedback`).

Its automatically-triggered PR workflow is run `33011510176` (run #171), completed **failure**. Artifact `9622875854` (`epohi-autonomous-cross-browser-results`) was downloaded and inspected. Static integrity was green; full Chromium/WebKit regression was skipped because the focused gate failed.

## Exact CI / validation for `77137919...`
- Chromium focused: **55/57 passed, 2 failed**.
  - `tests/mobile-performance-stability.spec.js:219`: 30 city open/close cycles left **16 observer callbacks vs required <=8**. Retained attribution named two duplicate semantic owners on `#coherenceProposalModal`: `humans-coherence-finalize.js` and `humans-event-overlay-policy.js`.
  - `tests/runtime-invalidation-cadence.spec.js:4`: request storm produced **13 flushes vs required <=12**.
  - The previous joint-war Chromium starvation is green: the synthetic retained End Turn completed normally and queue-microtask volume fell from about 1.18 million to tens of calls.
- WebKit focused: **55/57 passed, 2 failed**.
  - `tests/humans-strategy-ux.spec.js:19`: Playwright mobile WebKit does not support `mouse.wheel`.
  - `tests/observer-startup-attribution.spec.js:253`: 30-cycle post-idle window produced **14 callbacks vs required <=8**; attribution again identified both `humans-coherence-finalize.js` and `humans-event-overlay-policy.js` observing `#coherenceProposalModal`.
- No timeout, cadence threshold, callback threshold, actionability limit, gameplay assertion, or physical-device requirement was weakened.

## Diagnostic finding
The redelivery floor fixed the browser-starvation defect. The first surviving factual runtime failure is now duplicate ownership of `#coherenceProposalModal`: `EventOverlayPolicy` needs its narrow class observer to enforce modal priority, while `CoherenceFinalize` does not decorate proposal contents at all. Its proposal-modal observer therefore wakes the full finalizer decorator for a semantic event already owned elsewhere and roughly doubles idle callback activity after repeated city/modal churn.

## Bounded package in this checkpoint
- Remove `coherenceProposalModal` from the `CoherenceFinalize` modal-observer list while retaining capture-choice, urgent-decision, strategy-diplomacy and turn triggers.
- Keep `EventOverlayPolicy` as the single owner of proposal-modal class changes.
- Bump `EpohiCoherenceFinalize.version` to 3.
- Strengthen `tests/legacy-observer-containment.spec.js` with an architecture regression that prevents proposal-modal observer ownership from being reintroduced in the finalizer.

## Current blocker
Validate the single-owner proposal-modal change on its exact Chromium/WebKit PR CI. Secondary known factual blockers remain Chromium invalidation cadence **13 vs <=12** and WebKit `mouse.wheel` support; do not touch either until the exact callback result for this package is known.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — PR CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## NEXT ACTION
Inspect the automatically-triggered exact Chromium/WebKit CI for the commit containing this status. Do not push another source change while that run is in progress. If the 30-cycle callback gates are green on both engines, record the exact counts/SHA and target the first remaining factual failure with one bounded package (Chromium cadence 13 vs <=12 before the WebKit-only `mouse.wheel` incompatibility). If callback bounds still fail, use retained attribution and fix only the first measured remaining observer owner.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
