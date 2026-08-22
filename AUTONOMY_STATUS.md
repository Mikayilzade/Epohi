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
Latest implementation head: `67526a2d224d89b1b2ff54c6c611921fed227308` (`Protect explicit runtime invalidation flushes`).

This status update is documentation-only and does not trigger the branch CI path filter; always fetch PR #84 head before the next implementation write.

## Why manual QA is suspended
Latest physical iPhone/Safari smoke failed with rapid heat, UI freeze/flicker and unstable city opening. The user should not test intermediate patches again. Next physical-device test is reserved for a Release Candidate after automated gates.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — branch CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## Phase 1 progress
- `RUNTIME_OBSERVER_MAP.md` records confirmed ownership/cycle inventory and explicit debt.
- `src/humans-observer.js` no longer performs broad DOM polling; it emits `epohi:humans-ui-settled`.
- `src/humans-runtime-invalidation.js` owns one coalesced RAF invalidation path for visuals, context cleanup and player-feedback synchronization.
- `src/humans-player-feedback-stabilization.js` no longer creates the broad `#victoryContent` subtree observer or the broad `#contextPanel` subtree/character-data observer.
- Implementation `67526a2d...` exposes the observer-safety protected transaction and executes every explicit invalidation flush inside it. This pauses narrow observers while the scheduler performs its own visual/context/feedback DOM writes, preventing those writes from recursively waking observer callbacks.
- `tests/runtime-invalidation.spec.js` now requires the protected bridge, verifies protected flush accounting, drives 30 coalesced render requests and bounds observer callback growth across that transaction.
- `sw.js` cache key was bumped so the protected runtime pair cannot be masked by a stale service-worker cache.

## Current blocker
The exact cross-browser result for implementation `67526a2d224d89b1b2ff54c6c611921fed227308` is pending. Separately, broad observer constructors in `humans-visuals.js` (`#map`, `#screenRoot`) and `humans-context-review-cleanup.js` (`#contextPanel`, `document.body`) remain quarantined transitional debt and still need direct removal after concrete regressions are green.

## Latest CI / validation
- PR #84 verified open, Draft, mergeable, base `prototype/humans-v1`; source checkpoint before this package was `c9db8113528c2f6ee678125cf6dc55b2c595ca12`.
- Exact push workflow for `c9db811...`: run `32549595554`, conclusion `failure`; static integrity completed, focused cross-browser tests ran, full regression was skipped because focused tests failed.
- Chromium focused result: **46/49 passed, 3 failed**. Failures were: activity-switcher second military selection stuck because the button became disabled; rival-identity test saw only one rival instead of two; city-context `open-city` physical click did not become stable within 1 second.
- WebKit focused result: **42/49 passed, 7 failed**. The strongest runtime signal was selected-worker idle observer growth **20 callbacks vs allowed ≤6**; city open and repeated city close physical clicks also failed to become stable within 1 second. Additional failures were capture-choice modal not opening, missing administration card after treasury action, stacked-unit interaction timeout, plus one harness-specific incompatibility because Playwright mobile WebKit does not support `mouse.wheel`.
- The new package targets the shared runtime symptom rather than weakening click/observer thresholds: explicit scheduler flushes are now observer-protected render transactions. New implementation SHA: `67526a2d224d89b1b2ff54c6c611921fed227308`.
- No green result is inferred for `67526a2d...`; inspect its exact Chromium/WebKit artifact before another source change.

## NEXT ACTION
Inspect the exact cross-browser workflow result and artifacts for implementation SHA `67526a2d224d89b1b2ff54c6c611921fed227308`. If any focused Chromium/WebKit regression remains, fix the first concrete shared runtime/game regression without weakening responsiveness thresholds; if focused gates are green, proceed to remove the quarantined broad observer constructors from `humans-visuals.js` and `humans-context-review-cleanup.js` and strengthen regression coverage.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
