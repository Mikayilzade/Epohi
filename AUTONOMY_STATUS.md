# AUTONOMY STATUS — «Эпохи» Humans v1

## State
`IN_PROGRESS_AUTONOMOUS`

## Integration
- Repository: `Mikayilzade/Epohi`
- Active branch: `codex/coherence-capture-learning-v1`
- Draft PR: #84
- Base: `prototype/humans-v1`
- `main`: DO NOT TOUCH

## Current branch checkpoint
Latest source-triggering implementation checkpoint: `7b0dd7d996d0d3d7a20813a4f28333bd90b809a8` (`Remove duplicate stabilization mutation observers`).

Before every further source push, fetch PR #84 head and inspect the exact Chromium/WebKit CI for this checkpoint. Documentation-only status commits are not implementation checkpoints.

## Why manual QA is suspended
Intermediate physical-device QA remains suspended until Release Candidate. Automated Chromium/WebKit gates own the stabilization loop.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — branch CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## Phase 1 progress
- StrategyUX broad DOM observers/global-click scheduling are gone; `EpohiRuntimeInvalidation` owns its explicit refresh.
- Capture outcome semantics were corrected: unresolved `capturePending` and surviving non-capital cities no longer produce premature military victory. Capture is green in the latest exact Chromium focused run.
- Rival identity regression was made deterministic for the two-rival marker scenario; that test is green on the latest exact Chromium focused run.
- `1e33e1178f2634794314238a1074abcc46d2fa49` removed duplicate player-feedback click invalidation from `humans-player-feedback-stabilization.js`. Exact run `32662365034` showed the selected-worker idle callback test turn green.
- `7b0dd7d996d0d3d7a20813a4f28333bd90b809a8` removed three remaining journey/victory/turn `MutationObserver` wake-ups from `humans-player-feedback-stabilization.js`; the central invalidation bridge already invokes the same stabilization functions explicitly. Thresholds were unchanged.
- Exact run `32662639793` for `7b0dd7d9…`: static integrity **success**; focused Chromium **47/51 passed, 4 failed**; focused WebKit **47/51 passed, 4 failed**; full regression skipped.
- The first factual Chromium failure is now city-sheet interaction: `#contextActions [data-context-action="open-city"]` is visible but is detached/replaced while Playwright is attempting the click. This is consistent with legacy `humans-player-feedback.js` refresh scheduling still rebuilding context commands asynchronously.
- Chromium worker-idle callback stability remains green, but the 30-cycle city open/close callback invariant is still narrowly red at **9 callbacks with threshold <=8**.
- Another Chromium failure is the three-rival campaign fixture waiting for all three rivals/culture identities; map generation can still produce fewer than three valid rival starts. Treat this as a deterministic-fixture issue, not evidence to change gameplay placement without a separate product decision.
- `runtime-invalidation.spec.js` still has a menu/setup visibility timeout.
- WebKit still includes the known Playwright mobile-WebKit `mouse.wheel` limitation plus city/runtime failures. Do not hide these behind Chromium success.
- `humans-player-feedback.js` remains the last major legacy feedback owner with a global click -> `setTimeout(refresh, 0)` and broad/narrow MutationObserver registrations even though `EpohiRuntimeInvalidation` already calls `EpohiPlayerFeedback.refresh()` explicitly.
- No valid threshold was weakened. No physical-device QA was initiated. PR #84 remains Draft and unmerged.

## Latest CI / validation
- Authoritative implementation checkpoint: `7b0dd7d996d0d3d7a20813a4f28333bd90b809a8`.
- Exact run: `32662639793`; job `97251023873`; artifact `9499196579`.
- Static integrity: **success**.
- Chromium focused: **47/51 passed, 4 failed** — city open button detachment; three-rival deterministic setup; 30-cycle callback count 9/8; runtime-invalidation menu/setup timeout.
- WebKit focused: **47/51 passed, 4 failed** — unsupported mobile-WebKit mouse wheel plus city/runtime failures.
- Full Chromium/WebKit regression was correctly skipped because the focused gate failed.

## NEXT ACTION
Refactor `src/humans-player-feedback.js` installation so its delegated click handler keeps only business/action handling while removing the legacy `setTimeout(refresh, 0)` scheduler and redundant DOM `MutationObserver` registrations. `EpohiRuntimeInvalidation` must remain the explicit owner of `EpohiPlayerFeedback.refresh()`. Do not change callback/click thresholds. Then run exact Chromium/WebKit CI and take the first factual failure from that checkpoint.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
