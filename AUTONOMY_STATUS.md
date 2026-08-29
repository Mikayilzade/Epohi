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
Exact PR head inspected at the start of this run: `af8e7938dc9638b36a3c21b427beb41c997212c5`. PR #84 was open/draft, unmerged, on `codex/coherence-capture-learning-v1`, targeting `prototype/humans-v1`.

Exact implementation head: `766e66a94126f967f0e668d16044619929fd2659` (`Stabilize new-game setup selection across rerenders`). This bounded package changes only the shared browser test fixture; no production runtime/source file was changed.

## Exact CI / factual blocker inspected
- Workflow run `33223946771` (#224) validated implementation head `09500af25148929a65f90c0153b772138b350eff` and completed **failure**, not cancelled.
- #224 static gate: **green**.
- #224 focused Chromium + WebKit gate: **green**.
- #224 full Chromium: **161 passed / 179 total, 18 failed**.
- #224 full WebKit: **159 passed / 179 total, 20 failed**.
- The original 0-AI `small` browser smoke that had rendered 28×28 in #222 passed in #224, so that exact occurrence was not reproduced.
- The new setup assertions did expose the same class of fixture instability more precisely in WebKit camera coverage: `tests/camera-2.spec.js:140` requested `rivalCount=0`, but the live `#rivalCount` had returned to `1`; `tests/camera-2.spec.js:155` requested `large`, but the created backing state was 28×28. Repository code has no secondary writer for `partySize` / `rivalCount` after the new-game form is rendered, so this checkpoint hardens the test fixture against transient document/form replacement instead of making a speculative gameplay change.

## Bounded package completed
- Added `configureNewGameSetup` to set `partySize`, `rivalCount`, and party name as one coherent setup operation.
- The fixture now re-reads all three fields from the current live document after both selects have fired and crosses a short stability boundary before submitting.
- If the form was replaced/reset, the fixture retries the setup on the current DOM up to a bounded four attempts; if it still does not stabilize, it fails with the exact expected/observed setup instead of silently creating the default world.
- Existing post-creation map-size/backing-row assertions remain strict, so the regression still fails if the submitted setup genuinely produces the wrong world.

## Validation state
- Exact prior CI #224 on `09500af25148929a65f90c0153b772138b350eff`: static green; focused Chromium + WebKit green; full Chromium 161/179; full WebKit 159/179; overall **failure**.
- Exact implementation head `766e66a94126f967f0e668d16044619929fd2659`: workflow run `33226981642` (#226) is **queued**. Do not make another source/test/runtime change until this exact checkpoint has a completed CI result.
- Current blocker: cross-browser full regression is not green, and the implementation checkpoint is still awaiting its exact CI verdict.
- No physical-device test is requested.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [x] Phase 1 focused runtime architecture hardening — focused Chromium + WebKit gate green.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Inspect the completed exact CI/artifact for implementation head `766e66a94126f967f0e668d16044619929fd2659` (#226), then take only its first factual full-suite failure as the next bounded package.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
