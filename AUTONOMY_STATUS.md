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
Exact implementation/test head inspected before this package: `3ba8abd9a7f490de60eaafd87a37bdc3de1ae7fd` (`Stabilize legacy camp migration fixture`). PR #84 remains open/draft, mergeable, and targets `prototype/humans-v1`.

Its automatically-triggered PR workflow run `33104523271` completed **failure** on that exact SHA. Retained artifact `9661339291` (`epohi-autonomous-cross-browser-results`) was downloaded and inspected directly.

## Exact CI / factual blockers from run #192
- Static integrity: **green**.
- Focused Chromium + WebKit mobile runtime gate: **green**.
- Full Chromium: **154/176 passed, 22 failed**.
- Full WebKit: **154/176 passed, 22 failed**.
- The legacy barbarian-camp migration regression repaired by the previous checkpoint is no longer the first blocker.
- The first factual failure is identical on both engines: `tests/humans-autonomy.spec.js:20`, where the test waits for `#autonomyReportBtn` immediately after direct fresh-game state readiness and receives zero elements.
- Source inspection shows the report control is still created by the autonomy context-refresh path; the failing assertion depended on old implicit observer-driven decoration before any user context action. This belongs to the stale/direct-state harness cluster already identified in run #191 rather than a newly demonstrated gameplay defect.

## Bounded package completed this run
- Updated only the first stale autonomy regression plus this status checkpoint.
- The module/state assertions remain unchanged.
- The UI assertion now crosses the real user boundary by clicking the starting unit's rendered map tile, which renders unit context and gives the autonomy UI its actual lifecycle signal; `#autonomyReportBtn` must then appear within **1 second**.
- This does not fabricate DOM mutations, call hidden decorators, increase test timeout, relax callback/cadence/actionability thresholds, change gameplay, or alter production source.

## Validation state
- Pre-package authority: run `33104523271` on exact head `3ba8abd9...`; static and focused gates green, full regression red at 154/176 on both engines.
- This package is test/status-only and is being created as one coherent Git commit from exact parent `3ba8abd9...`.
- The automatically-triggered Chromium/WebKit CI of the new checkpoint is the next authority. Do not claim the autonomy failure green until that exact run completes.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [x] Phase 1 focused runtime architecture hardening remains green in run #192.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Wait for the automatically-triggered Chromium/WebKit CI of this exact autonomy user-boundary regression checkpoint. If `tests/humans-autonomy.spec.js:20` is green on both engines, inspect the first remaining factual full-suite failure on that exact SHA and fix only that blocker. If it still fails, use the retained artifact to determine whether the real tile click fails to deliver the autonomy context refresh within the unchanged 1-second actionability window; do not weaken that assertion.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
