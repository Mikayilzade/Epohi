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
Latest implementation head: `acb2b026e98ab4895960146e92b18c22412fa9d4` (`Remove broad context observers`).

The following status update is documentation-only and should not trigger branch CI. Always fetch PR #84 head before the next implementation write.

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
- `src/humans-player-feedback-stabilization.js` no longer creates broad `#victoryContent` or `#contextPanel` subtree observers.
- `src/humans-context-review-cleanup.js` version 3 removes both remaining broad context observers (`#contextPanel` subtree/characterData and `document.body` subtree). Context synchronization is now reached through explicit calls plus the bounded runtime invalidation scheduler.
- `tests/runtime-invalidation.spec.js` now enforces that the context cleanup module contains no `MutationObserver`, verifies context state changes settle through explicit invalidation, and keeps bounded callback/idle assertions.
- `sw.js` cache key was bumped to `epohi-v1-8-13-context-observers-removed-v1` so the new runtime asset is not hidden by stale cache.

## Current blocker
The exact cross-browser result for implementation `acb2b026e98ab4895960146e92b18c22412fa9d4` is pending. Broad visual observers in `humans-visuals.js` (`#map`, `#screenRoot`) remain the primary quarantined observer debt before the global observer-safety wrapper can be retired.

## Latest CI / validation
- PR #84 verified open, Draft, mergeable, base `prototype/humans-v1`; verified branch head before this package was documentation checkpoint `85ade5ff694316ed7ddc62b3d5ad905160ae5bd8`, whose parent implementation was `67526a2d224d89b1b2ff54c6c611921fed227308`.
- The push workflow for `67526a2d...` is confirmed `failed` by the GitHub notification generated for that exact SHA. The available GitHub connector does not expose that push-run through `fetch_commit_workflow_runs` or commit status endpoints, so no failure cause is inferred and no test threshold was weakened.
- Latest fully diagnosed focused run remains `c9db811...`: Chromium 46/49, WebKit 42/49, with shared symptoms including click instability and WebKit observer growth.
- This package removes a confirmed broad context observer source rather than guessing the inaccessible `67526a2d...` failure cause.
- New implementation checkpoint: `acb2b026e98ab4895960146e92b18c22412fa9d4`. CI/test result is pending and must be inspected before another source push.

## NEXT ACTION
Inspect the exact Chromium/WebKit workflow result for implementation SHA `acb2b026e98ab4895960146e92b18c22412fa9d4`. If focused regressions remain, fix the first concrete shared runtime/game failure without weakening responsiveness thresholds; if focused gates are green, remove the remaining broad `#map` / `#screenRoot` observers from `src/humans-visuals.js` and strengthen the runtime-invalidation regression accordingly.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
