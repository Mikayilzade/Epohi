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
Exact implementation/test head inspected before this package: `71a482d911d325759f5d48be29ff3aa58e306dde` (`Stabilize activity switcher after strategy follow-up RAF`). PR #84 is open/draft and mergeable.

Its automatically-triggered PR workflow run `33083997573` completed **failure** on that exact SHA. Retained artifact `9651524665` (`epohi-autonomous-cross-browser-results`) was downloaded and inspected directly.

## Exact CI / factual blocker from run #188
- Static integrity: **green**.
- Focused Chromium mobile: **59/60 passed**.
- Focused WebKit mobile: **58/60 passed**.
- First/common failure on both engines: `tests/context-review-cleanup.spec.js:71` — after deliberately deleting `playerIdentity`, forcing `EpohiRuntimeInvalidation.flush()` and waiting two frames, the military activity counter was `0` instead of accepted context-review semantics `0/2`.
- Separate WebKit-only failure: `tests/runtime-invalidation.spec.js:4` — after an explicit context invalidation and 120 ms settle window, `EpohiRuntimeInvalidation.stats().scheduled` remained `true`. Do not mix this secondary failure into the current package unless it is naturally closed by the ordering repair.

Exact source inspection explains why the previous one-frame tail was insufficient. When StrategyUX repairs missing identity, `refresh()` synchronously re-renders and calls `requestAnimationFrame(schedule)`. That first RAF does not refresh readiness: `schedule()` itself queues a second `requestAnimationFrame(refresh)`. RuntimeInvalidation's one-frame context tail therefore ran between those two legacy frames, and the second StrategyUX refresh subsequently overwrote `0/N` with the old ready-only count.

## Bounded package completed this run
- RuntimeInvalidation remains the single ordering owner, but its coalesced context tail now waits through the measured two-frame StrategyUX identity chain (`RAF(schedule) -> RAF(refresh)`) before reapplying `EpohiContextReviewCleanup.sync()`.
- RuntimeInvalidation version is bumped to 15. `scheduled` continues to include the context tail; no quiet-window accounting is hidden.
- The already-strengthened activity-switcher regression is intentionally left strict: it forces the real identity-followup branch, waits two frames, and still requires exact `0/N`, enabled/clickable object switching. The exact CI failure proves this regression catches the ordering defect, so no assertion, timeout, or threshold was weakened.
- No gameplay rule, callback/cadence threshold, browser skip, timeout, merge target, observer, or polling loop was added or relaxed.

## Validation state
- Pre-package authority: run `33083997573` on exact head `71a482d9...`, with the failures above.
- New source/status checkpoint is being created from exact parent `71a482d9...`; its automatically-triggered Chromium/WebKit CI is the next authority. Do not claim the two-frame ordering repair green until that exact run completes.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [x] Phase 1 focused runtime architecture hardening structurally implemented; exact revalidation pending for the current package.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Wait for the automatically-triggered Chromium/WebKit CI of this exact two-frame ordering checkpoint. If the activity-switcher regression is green, inspect the first remaining factual failure (including whether the prior WebKit `scheduled === true` failure remains) and fix only that blocker. If the activity-switcher regression still fails, inspect the retained exact artifact and identify the next measured writer/order owner without weakening the `0/N` assertion or adding timing slack.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
