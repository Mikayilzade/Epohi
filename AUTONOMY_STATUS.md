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
Exact PR head inspected at the start of this run: `0dee80dd6bf2e55790f55646a50d7c0a44ccd9c4`. PR #84 was open/draft, unmerged, on `codex/coherence-capture-learning-v1`, targeting `prototype/humans-v1`.

Exact implementation head: `31f12e3a0592ed91d4956dc75372f3e797de5781` (`Use semantic unit clicks in stacked regression`). This bounded package changes only the stale stacked-unit regression interaction; production runtime/source behavior is unchanged.

## Exact CI / factual blocker inspected
- Workflow run `33238924950` (#236) validated implementation head `c1e10e8cc4a0c265ec8e6a6606932d76c749f755` and completed **failure**, not cancelled.
- #236 static gate: **green**.
- #236 did **not** reach the full-suite gate because the focused gate failed first.
- #236 focused Chromium: **59 passed / 60 total, 1 failed**.
- #236 focused WebKit: **59 passed / 60 total, 1 failed**.
- Exact artifact: `9710822493` (`epohi-autonomous-cross-browser-results`).
- The sole focused failure on both engines was `tests/combat-world-stability.spec.js:170` (`three same-type stacked units keep distinct selection and orders`), at the residual two-unit re-entry assertion: expected 2 stack-picker buttons, received 0.
- Exact artifact/screenshot context showed the regression had entered **tile** context (`Клетка`) rather than own-unit context after clicking `.piece.unit, .unit-count`. Those map decorations are intentionally non-interactive (`pointer-events: none` in `styles/app.css`), so locator-based physical hit testing is not a stable way to exercise the semantic unit-selection bridge. This is a stale regression interaction, not new evidence that the runtime re-entry fix itself failed.

## Bounded package completed
- Kept accepted gameplay/runtime semantics unchanged.
- Added `clickMapUnitSemanticDom()` to the focused combat regression: it dispatches the unit semantic click from the rendered own-unit marker itself instead of asking Playwright to physically hit a `pointer-events:none` decoration.
- Updated every stacked-unit re-entry in that regression to use the semantic helper while preserving the exact 3→2 stack-picker counts, selected unit IDs, canonical `Идти` route ownership, three distinct destinations, and stale-cancel assertion.

## Validation state
- Exact prior CI #236 on `c1e10e8cc4a0c265ec8e6a6606932d76c749f755`: static green; focused Chromium 59/60; focused WebKit 59/60; full suite not entered; overall **failure**.
- Exact implementation head `31f12e3a0592ed91d4956dc75372f3e797de5781`: pushed.
- Exact workflow run `33241507869` (#238) for `31f12e3a0592ed91d4956dc75372f3e797de5781` is **in progress**. Do not make another source/test/runtime change until this exact checkpoint completes.
- Current blocker: cross-browser validation of the corrected semantic stacked-unit regression is pending in #238; full regression is not yet green.
- No physical-device test is requested.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [x] Phase 1 focused runtime architecture hardening — focused Chromium + WebKit gate previously green before the stacked-unit regression chain.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Inspect the completed exact CI/artifact for implementation head `31f12e3a0592ed91d4956dc75372f3e797de5781`, then take only its first factual failure as the next bounded package.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
