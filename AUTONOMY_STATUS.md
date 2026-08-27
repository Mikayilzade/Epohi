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
Exact implementation/test head inspected before this package: `cc229d984f767b0554426d563518c62f449b9b35` (`Order context cleanup after full strategy identity tail`). PR #84 is open/draft and mergeable.

Its automatically-triggered PR workflow run `33089589838` completed **failure** on that exact SHA. Retained artifact `9653947475` (`epohi-autonomous-cross-browser-results`) was downloaded and inspected directly.

## Exact CI / factual blockers from run #189
- Static integrity: **green**.
- Focused Chromium mobile: **59/60 passed**.
- Focused WebKit mobile: **59/60 passed**.
- The activity-switcher regression that motivated the previous package is now green on both engines: the two-frame identity ordering repair preserved exact `0/N` context-review semantics.
- WebKit failure: `tests/runtime-invalidation.spec.js:4` — after an ordinary explicit context invalidation and the existing 120 ms settle window, `EpohiRuntimeInvalidation.stats().scheduled` was still `true`.
- Chromium failure: `tests/combat-world-stability.spec.js:155` — the three same-type stacked-unit scenario timed out waiting for `[data-context-action="move"]` during its movement loop. This is a separate blocker and is intentionally not mixed into the current bounded package.

Source inspection isolated the WebKit scheduler failure. `EpohiRuntimeInvalidation.flush()` was scheduling the two-frame context tail **for every flush**, even though that tail exists only to outrun StrategyUX's special identity-repair chain (`RAF(schedule) -> RAF(refresh)`). Ordinary explicit invalidations already run ContextReviewCleanup synchronously; on slower WebKit frame pacing the unnecessary blind two-frame tail could still be pending at the quiet-window assertion and falsely keep runtime invalidation non-quiescent.

## Bounded package completed this run
- RuntimeInvalidation now fingerprints the identity/culture state around `EpohiStrategyUX.refresh()` and schedules the two-frame context tail only when StrategyUX actually mutated identity state and therefore queued its identity follow-up render chain.
- Ordinary explicit invalidations no longer create a blind post-frame tail; their synchronous ContextReviewCleanup pass remains the final writer.
- RuntimeInvalidation version is bumped to 16. `scheduled` still honestly includes real frame/timer/context-tail work; no accounting is hidden.
- `tests/runtime-invalidation.spec.js` is strengthened: the ordinary context-explicit-sync regression now records `contextTailSyncs` and requires it to remain unchanged while still requiring exact action-count update and `scheduled === false` inside the existing 120 ms window. This catches both the old unnecessary tail and any future regression that merely hides its scheduled state.
- No gameplay rule, timeout, callback/cadence threshold, browser skip, merge target, observer, or polling loop was added or relaxed.

## Validation state
- Pre-package authority: run `33089589838` on exact head `cc229d98...`, with the two focused failures above.
- New source/test/status checkpoint is being created from exact parent `cc229d98...`; its automatically-triggered Chromium/WebKit CI is the next authority. Do not claim the WebKit quiescence repair green until that exact run completes.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [x] Phase 1 focused runtime architecture hardening structurally implemented; exact revalidation pending for the current package.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Wait for the automatically-triggered Chromium/WebKit CI of this exact selective-tail checkpoint. If the WebKit runtime-invalidation regression is green, inspect the first remaining factual failure and fix only that blocker; the known Chromium stacked-unit movement timeout is the expected next candidate if it reproduces. If WebKit still reports `scheduled === true`, inspect the exact retained artifact and identify which real `frame`, `timer`, or identity-tail owner remains pending without weakening the existing 120 ms assertion.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
