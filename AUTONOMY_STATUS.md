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
Latest implementation head: `c9db8113528c2f6ee678125cf6dc55b2c595ca12` (`Remove broad player feedback observers`).

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
- `src/humans-player-feedback-stabilization.js` no longer creates the broad `#victoryContent` subtree observer or the broad `#contextPanel` subtree/character-data observer. Outcome-button cleanup, movement explanation and stack-selection acknowledgement are now reached through explicit invalidation; stack acknowledgement is exported for the scheduler.
- Narrow semantic observers remain for journey-modal class, victory-modal class and turn-value changes; these are not whole-subtree polling substitutes.
- `tests/runtime-invalidation.spec.js` now verifies the feedback API is wired through the scheduler, churns outcome content 40 times, proves duplicate recreated outcome buttons are cleaned by explicit invalidation, bounds observer callback growth, and re-checks idle quiescence/no console errors.

## Current blocker
The global `humans-performance.js` MutationObserver wrapper remains temporary scaffolding because `humans-visuals.js` still creates broad observers on `#map` and `#screenRoot`, while `humans-context-review-cleanup.js` still creates broad observers on `#contextPanel` and `document.body`. These constructors are currently quarantined by the wrapper and must be removed directly before the wrapper itself can be retired.

## Latest CI / validation
- PR #84 was verified open, Draft, mergeable, base `prototype/humans-v1`; verified head before this implementation package was `6fa4e96498651e7c1529690b33b60d50f83c62d9`.
- The repaired push-run for `6fa4e964...` was not exposed by the available commit workflow/status endpoints at inspection time, so no green result is inferred.
- Latest fully diagnosed prior run remained the `6ba7e0c0...` cross-browser run whose only known failure was shallow checkout at `git diff --check HEAD^ HEAD`; that infrastructure defect was fixed by `6fa4e964...` using `fetch-depth: 2`.
- New coherent implementation+regression checkpoint is `c9db8113528c2f6ee678125cf6dc55b2c595ca12`. Its Chromium/WebKit result is pending and must be inspected exactly before further source changes.

## NEXT ACTION
Inspect the exact cross-browser workflow result/logs for implementation SHA `c9db8113528c2f6ee678125cf6dc55b2c595ca12`; fix any concrete Chromium/WebKit regression first, otherwise if green remove the broad observer constructors from `humans-visuals.js` and `humans-context-review-cleanup.js` while preserving the explicit invalidation scheduler and strengthening regression coverage accordingly.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
