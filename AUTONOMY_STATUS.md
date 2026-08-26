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
Exact implementation/test head inspected before this package: `504274ee5a2de272607c682e0303356b9ac8b3c2` (`Remove duplicate proposal observer ownership`).

Its automatically-triggered PR workflow is run `33021191609` (run #172), completed **failure**. Artifact `9626696530` (`epohi-autonomous-cross-browser-results`) was downloaded and inspected. Static integrity was green; full Chromium/WebKit regression was skipped because the focused gate failed.

## Exact CI / validation for `504274ee...`
- Chromium focused: **58/58 passed**. The 30-cycle callback gate, invalidation cadence gate, joint-war real-turn regression and observer redelivery regressions are green on this engine.
- WebKit focused: **56/58 passed, 2 failed**.
  - `tests/mobile-performance-stability.spec.js:219`: 30 city open/close cycles left **13 observer callbacks vs required <=8**. Retained attribution now names only one native semantic registration: `humans-event-overlay-policy.js` observing `#coherenceProposalModal` class changes. Duplicate `CoherenceFinalize` ownership is gone.
  - `tests/humans-strategy-ux.spec.js:19`: Playwright mobile WebKit does not support `mouse.wheel`; this remains secondary until the callback gate is green.
- The retained proposal attribution had `callbackDelta:13` but only one native callback/record on the remaining proposal owner, which points to repeated hidden-modal class writes being magnified by observer-safety redelivery on WebKit rather than duplicate semantic ownership.
- No timeout, cadence threshold, callback threshold, actionability limit, gameplay assertion, or physical-device requirement was weakened.

## Diagnostic finding
The single-owner package worked on Chromium and removed duplicate proposal ownership on WebKit. The remaining measured owner is the proposal modal itself. `EpohiDiplomacyCoherence.renderProposal()` currently calls `modal.classList.remove("show")` every time there is no pending proposal, even when the modal is already hidden. During repeated city/render churn this creates unnecessary proposal-class mutation records on WebKit, waking `EventOverlayPolicy` and the protected observer delivery chain although the semantic visibility state did not change.

## Bounded package in this checkpoint
- Make proposal hiding class-idempotent in `src/humans-diplomacy-coherence-v2.js`: remove `show` only when it is actually present, both for the no-pending render path and stale/invalid proposal-answer path.
- Preserve `EventOverlayPolicy` as the single semantic proposal-priority owner; do not remove its priority protection.
- Strengthen `tests/legacy-observer-containment.spec.js` with a cross-browser runtime regression: 30 repeated hidden proposal renders must produce zero proposal class mutations and leave the modal hidden.

## Current blocker
Validate this idempotent proposal-hide change on its exact Chromium/WebKit PR CI. Do not touch the WebKit-only `mouse.wheel` incompatibility until the 30-cycle callback gate is green on both engines.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — PR CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## NEXT ACTION
Inspect the automatically-triggered exact Chromium/WebKit CI for the commit containing this status. Do not push another source change while that run is in progress. If the 30-cycle callback gates are green on both engines and the new hidden-proposal idempotence regression is green, record the exact counts/SHA and target the first remaining factual failure with one bounded package (expected candidate: WebKit `mouse.wheel` incompatibility). If callback bounds still fail, use retained attribution and fix only the first measured remaining owner.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.