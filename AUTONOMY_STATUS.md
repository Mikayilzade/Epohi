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
Exact PR head inspected at the start of this run: `2187cdea27177bf6019f1d83af7ab3adfbeacc65` (`Invalidate pathing after mobile map taps`). PR #84 remained open/draft and targeted `prototype/humans-v1`.

Exact implementation head under validation: `129b9bd4246be6e38f505002f70101f3efb9f244` (`Handle pointer-captured map tap invalidation`). This bounded package broadens the explicit post-map pointer lifecycle from tile-only targeting to the whole `#mapViewport`/composed path so pointer-captured `pointerup` events cannot bypass pathing refresh ownership. `tests/pathing-explicit-invalidation.spec.js` now explicitly regresses a `pointerup` retargeted to `#mapViewport` and keeps the strict <=1 s post-interaction actionability check.

## Exact CI / factual blocker inspected
Workflow run `33205010586` (run #215) on exact prior implementation head `2187cdea27177bf6019f1d83af7ab3adfbeacc65` completed **failure**; retained artifact `9700415857` was downloaded and inspected directly.

- Static integrity: **green**.
- Focused Chromium + WebKit gate: **green**.
- Full Chromium regression: **158/178 passed, 20 failed**.
- Full WebKit regression: **159/178 passed, 19 failed**.
- The bounded target from the prior NEXT ACTION still reproduced in the full suite: Chromium `tests/humans-pathing-performance.spec.js:89` could not find `[data-path-action="start"]` within the strict 1000 ms window, and WebKit `tests/pathing-explicit-invalidation.spec.js:10` exposed the same lifecycle with an invalid 2157 ms wall-clock measurement that included Playwright gesture dispatch time.
- Artifact evidence plus the current runtime hook showed the explicit pointer invalidation filtered only `#map .tile`; mobile pointer capture can retarget `pointerup` to `#mapViewport`, leaving the rebuilt selected-unit context dependent on observer delivery.
- Run #215 also has earlier/unrelated full-suite failures (for example Chromium `browser.spec.js:93` map-size expectation and WebKit `camera-2.spec.js:177`). They are not shotgun-fixed in this package and must be handled only after this checkpoint is validated.

## Bounded package completed
- Fixed the pointer-capture ownership gap in `EpohiRuntimeInvalidation` without adding a broad observer or polling loop.
- Strengthened the dedicated pathing regression to assert that a `pointerup` targeted at `#mapViewport` still increments the explicit map-action signal and produces a pathing sync.
- Preserved the accepted <=1 s actionability boundary after the user interaction completes; the test no longer counts Playwright's own gesture-dispatch latency as game UI latency.
- Source and regression were committed together in one coherent implementation checkpoint.

## Validation state
- Exact prior CI: run `33205010586` / artifact `9700415857` on `2187cdea...`: static green; focused Chromium + WebKit green; full Chromium 158/178; full WebKit 159/178.
- Exact implementation head `129b9bd4246be6e38f505002f70101f3efb9f244` is awaiting its own workflow result; do not push speculative source/test fixes while that checkpoint is running.
- Gate B/C focused runtime were green before this bounded change; Gate D remains unproven until the exact new checkpoint completes.
- No physical-device test is requested.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [x] Phase 1 focused runtime architecture hardening — focused Chromium + WebKit gate green on run #215.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage; exact new checkpoint pending.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Inspect the exact workflow result for implementation head `129b9bd4246be6e38f505002f70101f3efb9f244`; if it is still running, make no source/test/runtime push, and when complete use its retained logs/artifact to take only the first remaining factual full-suite failure as the next bounded package.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
