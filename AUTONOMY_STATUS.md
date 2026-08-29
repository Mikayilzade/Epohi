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
Exact PR head inspected at the start of this run: `9b56b28309138339bf515d1230c09b2d5e4f3164`. PR #84 was open/draft, unmerged, on `codex/coherence-capture-learning-v1`, targeting `prototype/humans-v1`.

Exact implementation head: `c6dec095ee2160ddd720d893760e2445c52c19c7` (`Reopen stacked unit context after each move`). This bounded package changes only regression interaction semantics; no production runtime/source file was changed.

## Exact CI / factual blocker inspected
- Workflow run `33234302587` (#232) validated implementation head `13ef90c1b9bb8eb3a62e9681707f4481c7b7268b` and completed **failure**, not cancelled.
- #232 static gate: **green**.
- #232 did **not** reach the full-suite gate because the focused gate failed first on both engines.
- #232 focused Chromium: **59 passed / 60 total, 1 failed**.
- #232 focused WebKit: **59 passed / 60 total, 1 failed**.
- Exact artifact: `9709498957` (`epohi-autonomous-cross-browser-results`).
- The sole focused failure on both engines remained `tests/combat-world-stability.spec.js:170` (`three same-type stacked units keep distinct selection and orders`).
- Exact failure: the first stacked scout moved successfully, which correctly rerendered/followed the moved unit context. The regression then tried to click `stack-scout-1` through the old stack-picker context without reopening the original stack tile. Chromium waited for an element that was no longer present; WebKit briefly resolved the old button and then reported it detached from the DOM. This is a stale multi-step test interaction, not evidence of a runtime gameplay defect.

## Bounded package completed
- Kept accepted stacked-unit/runtime behavior unchanged.
- Strengthened the regression so every subsequent unit is selected through a fresh semantic click on the original stacked tile after the previous unit moves away.
- Asserted the stack picker shrinks from 3 to 2 entries after the first move; the final remaining unit is selected directly from its semantic map target rather than relying on a non-existent one-item stack picker.
- Preserved exact unit-selection, canonical `Идти` route ownership, distinct destination, and stale-cancel assertions for all three scouts.
- No production code was changed because #232 exposed stale test state after a legitimate rerender.

## Validation state
- Exact prior CI #232 on `13ef90c1b9bb8eb3a62e9681707f4481c7b7268b`: static green; focused Chromium 59/60; focused WebKit 59/60; full suite not entered; overall **failure**.
- Exact implementation head `c6dec095ee2160ddd720d893760e2445c52c19c7`: pushed.
- Exact workflow run `33236602471` (#234) for `c6dec095ee2160ddd720d893760e2445c52c19c7` is **in progress**. Do not make another source/test/runtime change until this exact checkpoint has a completed CI result.
- Current blocker: cross-browser validation for the refreshed stacked-unit interaction is pending in #234; full regression is not yet green.
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
Inspect the completed exact CI/artifact for implementation head `c6dec095ee2160ddd720d893760e2445c52c19c7`, then take only its first factual failure as the next bounded package.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
