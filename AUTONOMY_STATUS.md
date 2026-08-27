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
Exact head inspected before this package: `d506b315ee8745e8e9577d8880c5f7acde157860` (`Modernize visual observer tests for current new-game UI`). PR #84 is open/draft and mergeable.

Automatically-triggered PR workflow run `33077881535` completed **failure** on that exact SHA. Static integrity was green. Focused Chromium mobile was **60/60 passed**. Focused WebKit mobile was **59/60 passed**; full regression was skipped because the focused gate failed.

## Exact factual blocker from run #187
The only focused failure was `tests/context-review-cleanup.spec.js:65` on WebKit: the activity-switcher military button first satisfied the test's enabled assertion, then became disabled before Playwright could click it. The retained element still represented two living military units (`aria-label ... 0/2`, `data-has-object=true`) while the legacy StrategyUX readiness refresh had restored its old `ready-count === 0 => disabled` semantics.

Source inspection isolated the ordering race. `EpohiRuntimeInvalidation.flush()` synchronously runs StrategyUX first and ContextReviewCleanup afterward, which is correct. However StrategyUX can schedule an additional identity-followup `requestAnimationFrame` from inside `refresh()` after mutating identity and re-rendering. That already-queued module-local RAF can run after the synchronous ContextReviewCleanup pass and re-disable the activity switcher.

## Bounded package completed this run
- RuntimeInvalidation now owns one coalesced **post-frame context tail sync**. It lets any already-queued StrategyUX identity-followup RAF run, then reapplies ContextReviewCleanup once, preserving the accepted activity-switcher semantics without adding a MutationObserver or relaxing any threshold.
- RuntimeInvalidation version is bumped to 14; stats expose `contextTailSyncs`, and `scheduled` includes the tail frame so quiet-window tests can still verify true quiescence.
- The existing activity-switcher regression is strengthened to deliberately delete `playerIdentity`, force the StrategyUX identity-followup branch through an explicit runtime flush, wait two frames, and then require the 0/N object switchers to remain enabled and clickable.
- No gameplay rule, timeout, callback threshold, cadence threshold, browser skip, or merge target was changed.

## Validation state
- Pre-package exact CI evidence: run `33077881535`, Chromium focused 60/60, WebKit focused 59/60 with the single readiness race above.
- New source/test checkpoint is being created from exact parent `d506b315...`; its automatically-triggered Chromium/WebKit CI is the next authority. Do not claim this repair green until that exact run completes.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [x] Phase 1 focused runtime architecture hardening structurally implemented; exact revalidation pending for the current package.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Wait for the automatically-triggered Chromium/WebKit CI of this exact source/test checkpoint. If focused gates are green, inspect the first full-suite failure and fix only that factual blocker. If the strengthened activity-switcher regression still fails, inspect the exact retained WebKit log/artifact and repair the measured ordering owner without weakening the test.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
