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
Exact implementation/test head inspected before this bounded package: `6b0c4567632ffe79e976b2f5cca3737e3b3dea3d` (`Make context review tests explicit and deterministic`). PR #84 was confirmed still open/draft with this exact head before writing.

Its automatically-triggered PR workflow run `33050819901` completed **failure**. Static integrity was green; focused Chromium/WebKit gate failed; full mobile regression was correctly skipped. Artifact `9637650560` (`epohi-autonomous-cross-browser-results`) was downloaded and inspected directly.

## Exact CI / validation for `6b0c4567...`
- Chromium focused: **58/60 passed, 2 failed**.
  - `tests/context-review-cleanup.spec.js:148`: mobile layout test expected `contextActions.scrollLeft` to become positive, but the fixture appended only four fake buttons and they fit the current 393px layout, so `shifted` was `0`. This is a deterministic test-precondition failure, not evidence that reset behavior failed.
  - `tests/runtime-invalidation-cadence.spec.js:4`: invalidation request storm produced **13 flushes vs required ≤12**.
- WebKit focused: **58/60 passed, 2 failed**.
  - the same `tests/context-review-cleanup.spec.js:148` overflow-precondition failure;
  - `tests/humans-strategy-ux.spec.js:19`: Playwright mobile WebKit does not support `mouse.wheel`.
- The prior stack-picker synchronization and top-science readiness failures are gone in this exact run.
- Callback churn remains inside limits in this exact run; no callback threshold was weakened.
- No timeout, cadence threshold, actionability limit, gameplay assertion, or physical-device requirement was weakened.

## First factual failure and bounded package
The first common failure is a **test-fixture overflow precondition defect**. The regression intends to prove that context-action horizontal scroll is reset to zero after a context fingerprint change, but four synthetic action buttons no longer guarantee overflow at the active mobile layout.

This bounded package changes only the test fixture plus this status:
- create twelve synthetic action buttons rather than four;
- give each synthetic button a test-only `96px` fixed flex basis so the 393px container is guaranteed to overflow;
- explicitly record and assert `scrollWidth - clientWidth > 0` before asserting that the fixture can shift and that `EpohiContextReviewCleanup.sync()` resets `scrollLeft` to `0`.

No production source, gameplay behavior, timeout, callback/cadence threshold, or WebKit input workaround is changed.

## Current blocker
Validate this deterministic overflow regression on Chromium and WebKit. The known Chromium cadence `13 > 12` and WebKit `mouse.wheel` incompatibility remain secondary and must not be changed in this same package.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — PR CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## NEXT ACTION
Inspect the automatically-triggered exact Chromium/WebKit CI for this two-file bounded package. Do not push another source/test change while that run is in progress. If the context-review-cleanup mobile layout regression is green on both engines, record the exact SHA/counts and fix only the first remaining factual failure from that exact run (Chromium cadence if still first; otherwise the exact earliest failure), without weakening thresholds. If the context-review regression still fails, inspect its exact artifact/log and fix that first.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
