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
Exact PR head inspected before this package: `5b75911c624ea04e3740c90bdc4d3a869923f1a6` (`Align autonomous worker regression with worker-time projects`). PR #84 remains open/draft and targets `prototype/humans-v1`.

Its automatically-triggered workflow run `33133462763` (run #198) completed **failure** on that exact SHA. Retained artifact `9671211987` was downloaded and inspected directly.

## Exact CI / factual blocker from run #198
- Static integrity: **green**.
- Focused Chromium: **60/60 passed**.
- Focused WebKit: **59/60 passed, 1 failed**.
- Full Chromium/WebKit regression: **skipped** because the focused WebKit gate failed.
- Sole focused failure: `tests/context-review-cleanup.spec.js:71` — activity-switcher regression expected military readiness `0/2`, but WebKit settled at `0` for the full 10 s assertion window.
- The runtime ordering owner uses StrategyUX `RAF(schedule) -> RAF(refresh)` followed by ContextReviewCleanup. Source inspection found a real overlap hole: `scheduleContextTailSync()` returned immediately whenever any older context tail was pending. If that older tail had already advanced to its second RAF, a newer identity repair could queue a later StrategyUX refresh after the old cleanup, leaving StrategyUX as the final writer. Chromium timing passed; WebKit exposed the ordering loss.

## Bounded package for this run
- Fix only context-tail ownership in `src/humans-runtime-invalidation.js`: a newer identity repair now cancels/re-arms any pending older context tail so cleanup is ordered after the newest two-frame StrategyUX follow-up.
- Strengthen `tests/context-review-cleanup.spec.js` to deterministically reproduce the overlap: advance one identity tail by one frame, trigger a second identity repair while the old final cleanup is pending, then require runtime quiescence and the unchanged strict `0/N` actionable switcher contract.
- No gameplay semantics, timeouts, callback thresholds, cadence limits, or browser worker counts were changed.

## Validation state
- Pre-package authority: run `33133462763` on `5b75911c...`; static green, Chromium focused 60/60, WebKit focused 59/60 with only the activity-switcher ordering failure.
- Artifact `9671211987` showed `Expected: "0/2"`, `Received: "0"` at `context-review-cleanup.spec.js:95`.
- The next authority is the automatically-triggered Chromium/WebKit CI for this single coherent source+regression+status checkpoint. Do not claim the blocker green before that exact run completes.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [ ] Phase 1 focused runtime architecture hardening — run #198 reopened one WebKit ordering blocker; this package addresses that exact owner.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Wait for the automatically-triggered Chromium/WebKit CI of this context-tail re-arm checkpoint. If focused Chromium and WebKit are both green, inspect and fix only the first remaining factual full-suite failure on that exact SHA. If the deterministic overlap regression still fails, inspect the retained artifact and runtime scheduler stats before changing any additional owner or timing rule.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
