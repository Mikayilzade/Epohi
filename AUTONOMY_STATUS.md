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
Latest implementation head: `6ef0d6288fb10db741b657bcd5dbb529e1b12c66` (`Narrow workforce observer roots`).

This file update is status/documentation only and follows that implementation checkpoint; it must not trigger branch CI. Always fetch PR #84 head again before the next code/test write.

## Exact CI / validation
Exact automatically-triggered PR workflow for implementation `6ef0d6288fb10db741b657bcd5dbb529e1b12c66`: run `32713946219` (run #145), job `97391127255`, completed **failure**.

- Static integrity: **success**.
- Chromium focused: **50/51 passed, 1 failed**. The remaining failure was `tests/humans-strategy-ux.spec.js:113` (`три соперника создают политическую кампанию с союзником`): the test timed out waiting for three rivals with populated `cultureKey`.
- WebKit focused: **47/51 passed, 4 failed**.
  - `tests/humans-strategy-ux.spec.js:19`: Playwright mobile WebKit does not support `mouse.wheel`.
  - `tests/mobile-performance-stability.spec.js:157`: selected-worker idle produced **16 observer callbacks vs required <=6**.
  - `tests/mobile-performance-stability.spec.js:190`: physical `open-city` Playwright click did not become actionable within the unchanged 1-second timeout.
  - `tests/mobile-performance-stability.spec.js:219`: 30 explicit city open/close cycles settled at **12 observer callbacks vs required <=8**.
- Full Chromium/WebKit regression: **skipped** because the focused gate failed.
- Diagnostics artifact: `9515413269` (`epohi-autonomous-cross-browser-results`).

## What the implementation proved
The preceding diagnostic run `32712294600` attributed all 13 measured post-cycle callbacks to the broad `#gameApp` registration owned by `src/humans-population-workforce.js`. Implementation `6ef0d6288fb10db741b657bcd5dbb529e1b12c66` removed that descendant registration and kept only `#gameApp` class observation plus narrow local-content signals.

The exact run #145 proves that this owner was real but not sufficient to close WebKit churn: selected-worker idle is still 16 callbacks and the 30-cycle test is still 12. The retained post-cycle attribution log for run #145 reports `callbackDelta: 12` with an empty `attributionDelta`, so the remaining callbacks are not attributable by the current late-installed diagnostic hook. That means another source removal would currently be speculative.

No callback threshold, click timeout, or gameplay assertion was weakened. No physical-device QA was requested. PR #84 remains Draft and unmerged.

## Current blocker
The remaining WebKit callback churn is confirmed, but its exact observer owner is not yet named by the current attribution instrumentation because the failing callbacks come from an observer outside the hook's captured set (for example an observer created before the diagnostic hook or delivery through the safety wrapper). The shared `open-city` actionability failure remains secondary until the callback owner is identified.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — PR CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## NEXT ACTION
Extend the existing observer-attribution regression so it captures the remaining WebKit callbacks from startup/observer construction through the selected-worker idle and 30-cycle scenarios, then run exactly one test-only diagnostic checkpoint and use its named owner/target for the next bounded source fix; do not weaken the `<=6`, `<=8`, or 1-second actionability thresholds.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
