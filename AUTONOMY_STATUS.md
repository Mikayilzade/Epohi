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
Exact PR head inspected at the start of this run: `6f8c7b27142ecd0d19a42c781b03316cdd47ea16`. PR #84 was open/draft, unmerged, on `codex/coherence-capture-learning-v1`, targeting `prototype/humans-v1`.

Exact implementation head: `d80a91f26442909f5615acb96875c2356a9f5c9b` (`Align stacked-unit regression with canonical route flow`). This bounded package changes only regression coverage; no production runtime/source file was changed.

## Exact CI / factual blocker inspected
- Workflow run `33229538674` (#228) validated implementation head `6e5fa316551cdc6523f4aa6c6ab82c79b9a99e09` and completed **failure**, not cancelled.
- #228 static gate: **green**.
- #228 focused Chromium + WebKit gate: **green**.
- #228 full Chromium: **162 passed / 179 total, 17 failed**.
- #228 full WebKit: **162 passed / 179 total, 17 failed**.
- Exact artifact: `9708448169` (`epohi-autonomous-cross-browser-results`).
- First Chromium full-suite failure: `tests/combat-world-stability.spec.js:170` timed out waiting for legacy `[data-context-action="move"]` while exercising three same-type stacked units.
- Current accepted route UI is `#contextActions [data-path-action="start"]` (`Идти`) followed by target selection; `EpohiContextReviewCleanup` exposes the explicit stack picker and `selectStackUnit` flow. The stale regression was still depending on the superseded destination-then-`move` interaction.

## Bounded package completed
- Reworked the stacked-unit regression to assert all three stack-picker entries are present.
- Each unit is now selected explicitly by its `data-unit-id`, with an assertion that `getSelectedUnitId()` matches the intended stack member before routing.
- The regression uses the canonical `data-path-action="start"` route flow, asserts `data-route-unit-id` ownership, selects the destination, and verifies the exact intended unit moved to its distinct target.
- Existing final uniqueness and no-stale-cancel assertions remain.
- No production code was changed.

## Validation state
- Exact prior CI #228 on `6e5fa316551cdc6523f4aa6c6ab82c79b9a99e09`: static green; focused Chromium + WebKit green; full Chromium 162/179; full WebKit 162/179; overall **failure**.
- Exact implementation head `d80a91f26442909f5615acb96875c2356a9f5c9b`: pushed.
- Exact workflow run `33231928852` (#230) for `d80a91f26442909f5615acb96875c2356a9f5c9b` was **queued** at the immediate post-push check. Do not make another source/test/runtime change until this exact checkpoint has a completed CI result.
- Current blocker: cross-browser full regression is not green; factual validation for the new stacked-unit regression is pending in #230.
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
Inspect the completed exact CI/artifact for implementation head `d80a91f26442909f5615acb96875c2356a9f5c9b`, then take only its first factual full-suite failure as the next bounded package.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
