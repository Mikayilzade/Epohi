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
Latest implementation head: `4ea00a8c311d1bcccdb0ba9d145f57286f53a3cc` (`Narrow camera layout observer churn`).

The following status update is documentation-only and does not match the workflow trigger paths. Always fetch PR #84 head before the next implementation write.

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
- Broad observers have been removed from `humans-observer`, `humans-visuals`, context cleanup and broad player-feedback content polling.
- `src/humans-runtime-invalidation.js` remains the bounded explicit decorator scheduler.
- Exact run `32561012188` exposed an omitted native owner: `src/humans-camera-layout-guard.js` still observed the whole `#screenRoot` subtree and scheduled a double RAF for descendant churn.
- Implementation `4ea00a8c311d1bcccdb0ba9d145f57286f53a3cc` narrows that guard to direct `#screenRoot` child replacement plus `#gameApp` class changes, coalesces restoration to one RAF, updates `RUNTIME_OBSERVER_MAP.md`, bumps the service-worker cache, and adds `tests/camera-layout-guard-runtime.spec.js` to reject restoration of subtree polling and bound callbacks under descendant churn.
- Local syntax checks passed for the changed runtime/test/service-worker files before push.

## Current blocker
The focused Chromium/WebKit workflow for implementation `4ea00a8c311d1bcccdb0ba9d145f57286f53a3cc` is the only unresolved validation item for this package. No further source push is allowed until its exact result/artifacts are inspected.

## Latest CI / validation
- PR #84 was re-verified immediately before the implementation write: open, Draft, mergeable, base `prototype/humans-v1`, head `fdada02e81edd14d4ab95da40a8c65c92fcd963c`.
- Exact completed workflow for `fdada02e81edd14d4ab95da40a8c65c92fcd963c`: run `32561012188`, run #51, completed **failure**; static integrity passed and the focused gate failed, so full regression did not run.
- Chromium focused: **45/49 passed, 4 failed**. Exact failures: activity military switcher remained disabled after actions; runtime invalidation produced **16 flushes vs required <15**; physical `open-city` control detached before a 1-second click completed; 30-cycle city stress settled at **10 observer callbacks vs allowed <=8**.
- WebKit focused: **46/49 passed, 3 failed**. Exact failures: Playwright mobile WebKit does not support `mouse.wheel`; physical `open-city` control detached before a 1-second click completed; runtime invalidation timed out because `#menuBtn` remained not visible at the click step.
- Shared runtime signal from run #51: visual broad polling removal improved the gate materially, but descendant DOM activity was still waking an untracked whole-screen camera observer. That native owner is the bounded target of implementation `4ea00a8c311d1bcccdb0ba9d145f57286f53a3cc`.
- CI result for `4ea00a8c311d1bcccdb0ba9d145f57286f53a3cc`: **pending at this status checkpoint**.

## NEXT ACTION
Inspect the exact completed Chromium/WebKit workflow result and artifacts for implementation SHA `4ea00a8c311d1bcccdb0ba9d145f57286f53a3cc` before making any further source change.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
