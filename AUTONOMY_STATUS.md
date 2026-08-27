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
Exact implementation/test head inspected before this package: `a079afe92348ba500eff2b6e51160fcc4cccacac` (`Wire autonomy controls to explicit settled lifecycle`). PR #84 remains open/draft, mergeable, and targets `prototype/humans-v1`.

Its automatically-triggered PR workflow run `33120089470` completed **failure** on that exact SHA. Retained artifact `9667253720` (`epohi-autonomous-cross-browser-results`) was downloaded and inspected directly.

## Exact CI / factual blockers from run #194
- Static integrity: **green**.
- Focused Chromium: **60/60 passed**.
- Focused WebKit: **60/60 passed**.
- Full Chromium: **153/176 passed, 23 failed**.
- Full WebKit: **153/176 passed, 23 failed**.
- `tests/humans-autonomy.spec.js:20` still fails identically on both engines: `#autonomyReportBtn` remains absent inside the unchanged **1 second** actionability window.
- The previous package proved that merely subscribing autonomy to `epohi:humans-ui-settled` is insufficient. The lifecycle signal is not reliably delivered after fresh-game state becomes readable.
- Runtime inspection identified the concrete race: `humans-runtime-invalidation.js` owns the capture-phase `#createParty` transition hook, but it only queued an invalidation request after creation. It did not emit the canonical settled event at that post-transition boundary. The autonomy listener therefore had no reliable explicit signal after state installation.

## Bounded package completed this run
- Fixed only the fresh-game explicit lifecycle race plus a dedicated regression and this status checkpoint.
- `humans-runtime-invalidation.js` now emits `epohi:humans-ui-settled` from its existing zero-delay `#createParty` post-transition callback **only after `__epohiDebug().state` is readable**. This is a single bounded event, not polling or a broad observer.
- Bumped `EpohiRuntimeInvalidation.version` from 16 to 17.
- Added `tests/new-game-settled-lifecycle.spec.js`: it installs the lifecycle probe before creating the campaign, requires a `new-game-created-post-transition` settled signal with real state already present, and then keeps the existing **1 second** `#autonomyReportBtn` actionability contract.
- No gameplay rules, callback/cadence limits, timeouts, observer scope, save format, or physical-device policy were changed.

## Validation state
- Pre-package authority: run `33120089470` on exact head `a079afe9...`; static and focused gates green, full regression red at 153/176 on both engines.
- This source/test/status package is being created as one coherent Git commit from exact parent `a079afe9...`.
- The automatically-triggered Chromium/WebKit CI of the new checkpoint is the next authority. Do not claim the autonomy lifecycle blocker green until that exact run completes.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [x] Phase 1 focused runtime architecture hardening remains green in run #194.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Wait for the automatically-triggered Chromium/WebKit CI of this exact fresh-game settled-lifecycle checkpoint. If both the new lifecycle regression and `tests/humans-autonomy.spec.js:20` are green, inspect the first remaining factual full-suite failure on that exact SHA and fix only that blocker. If either still fails, inspect the retained artifact for the observed settled probe/state ordering; keep the 1-second actionability assertion unchanged and do not add polling or reintroduce broad observer-driven decoration.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
