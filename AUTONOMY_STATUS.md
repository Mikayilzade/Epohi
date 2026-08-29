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
Exact PR head inspected at the start of this run: `372a67e0499090df7a7756d8e7d776a8f247a6b5`. PR #84 was open/draft, unmerged, on `codex/coherence-capture-learning-v1`, targeting `prototype/humans-v1`.

Exact implementation head: `13ef90c1b9bb8eb3a62e9681707f4481c7b7268b` (`Exercise stacked units through semantic unit click`). This bounded package changes only regression interaction semantics; no production runtime/source file was changed.

## Exact CI / factual blocker inspected
- Workflow run `33231928852` (#230) validated implementation head `d80a91f26442909f5615acb96875c2356a9f5c9b` and completed **failure**, not cancelled.
- #230 static gate: **green**.
- #230 did **not** reach the full-suite gate because the focused gate failed first on both engines.
- #230 focused Chromium: **59 passed / 60 total, 1 failed**.
- #230 focused WebKit: **59 passed / 60 total, 1 failed**.
- Exact artifact: `9708810720` (`epohi-autonomous-cross-browser-results`).
- The sole focused failure on both engines was `tests/combat-world-stability.spec.js:170` (`three same-type stacked units keep distinct selection and orders`).
- Exact failure: after the regression invoked a raw `.tile.click()` at the stacked coordinate, `[data-context-stack-picker] .context-stack-unit` remained at count 0. The current context-review contract derives the semantic inspection layer from the clicked DOM target; a raw tile target intentionally selects the `tile` layer, while the stack picker is rendered only in an own-unit `unit` context.

## Bounded package completed
- Kept the accepted stacked-unit product/runtime behavior unchanged.
- Corrected the regression entry point to click the rendered unit semantic target (`.piece.unit` / `.unit-count`) on the stacked tile instead of bypassing semantic targeting with a raw tile click.
- Preserved the strengthened assertions from the prior checkpoint: all three stack entries must appear; each exact unit ID must become selected; canonical `Идти` route ownership must match that unit; each unit must reach its distinct target; no stale cancel action remains.
- No production code was changed because #230 exposed a stale regression interaction, not a runtime defect.

## Validation state
- Exact prior CI #230 on `d80a91f26442909f5615acb96875c2356a9f5c9b`: static green; focused Chromium 59/60; focused WebKit 59/60; full suite not entered; overall **failure**.
- Exact implementation head `13ef90c1b9bb8eb3a62e9681707f4481c7b7268b`: pushed.
- Exact workflow run `33234302587` (#232) for `13ef90c1b9bb8eb3a62e9681707f4481c7b7268b` was **queued** at the immediate post-push check. Do not make another source/test/runtime change until this exact checkpoint has a completed CI result.
- Current blocker: cross-browser validation for the corrected semantic stacked-unit regression is pending in #232; full regression is not yet green.
- No physical-device test is requested.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [x] Phase 1 focused runtime architecture hardening — focused Chromium + WebKit gate previously green before the stale stacked-unit regression interaction.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Inspect the completed exact CI/artifact for implementation head `13ef90c1b9bb8eb3a62e9681707f4481c7b7268b`, then take only its first factual failure as the next bounded package.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
