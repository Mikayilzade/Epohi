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
Exact PR head inspected at the start of this run: `1b2851f9e18d784d34be141a8e1cb45ce364e2c3` (`Bridge pathing UI into explicit invalidation`). PR #84 remained open/draft and targeted `prototype/humans-v1`.

Exact implementation head under validation: `1b2851f9e18d784d34be141a8e1cb45ce364e2c3`. That checkpoint adds pathing UI refresh ownership to `EpohiRuntimeInvalidation` plus `tests/pathing-explicit-invalidation.spec.js`; no new source/test/runtime change was pushed in this run because the exact CI checkpoint had already completed and needed factual full-suite diagnosis before another engineering change.

## Exact CI / factual blocker inspected
Workflow run `33190892349` (run #213) on exact implementation head `1b2851f9e18d784d34be141a8e1cb45ce364e2c3` completed **failure**. Retained artifact `9694971588` was downloaded and inspected directly.

- Static integrity: **green**.
- Focused Chromium + WebKit gate: **green**.
- Full Chromium regression: **159/178 passed, 19 failed**.
- Full WebKit regression: **161/178 passed, 17 failed**.
- First Chromium full-suite failure: `tests/humans-pathing-performance.spec.js:89` (`кнопка Идти назначает маршрут, показывает шаги и переносит приказ между ходами`). Exact failure: `[data-path-action="start"]` was absent/not visible within the required 1000 ms actionability window.
- The new `tests/pathing-explicit-invalidation.spec.js` regression also failed later in the Chromium full suite on the same route-start visibility contract even though it passed in the focused gate. This is evidence of a remaining full-suite pathing lifecycle/timing defect; do not weaken the 1 s gate without proving the accepted actionability contract changed.
- First WebKit full-suite failure was independently in `tests/camera-2.spec.js:177`; later WebKit failures include several hidden-action/time-out cases. They have not been assumed to share the Chromium pathing cause.
- Artifact diagnostics show many later failures, so this run deliberately did not shotgun-fix the 36 failing cases or infer a common cause from counts alone.

## Bounded package completed
- Closed the prior `1b2851f9...` checkpoint with exact CI/artifact inspection rather than guessing from workflow status.
- Confirmed the explicit pathing invalidation bridge is sufficient for the focused matrix but not yet deterministic under the complete Chromium suite.
- Identified the earliest bounded engineering target and preserved the existing strict route actionability regression as the acceptance boundary.
- No speculative source/test push was made after CI; this status-only checkpoint must not trigger browser CI under the push-gated workflow policy.

## Validation state
- Run `33190892349` / artifact `9694971588` on `1b2851f9...`: static green; focused Chromium + WebKit green; full Chromium 159/178; full WebKit 161/178.
- Gate B/C focused runtime are green at this checkpoint.
- Gate D complete regression remains blocked by the exact failures above.
- No physical-device test is requested.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [x] Phase 1 focused runtime architecture hardening — exact run #213 focused gate is green on both engines.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage; full suite is not green yet.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Inspect and reproduce the first Chromium full-suite blocker from run `33190892349` around `tests/humans-pathing-performance.spec.js:89`, together with the same-run recurrence in `tests/pathing-explicit-invalidation.spec.js`, determine why route controls can miss the strict 1 s actionability contract after normal unit-tile selection, and implement exactly one regression-backed bounded fix without weakening accepted pathing semantics or the actionability gate.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
