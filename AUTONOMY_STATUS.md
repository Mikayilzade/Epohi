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
Exact PR head inspected at the start of this run: `cb17a76d2dfbc606b5c45de12808ac2d1163b217`. PR #84 was open/draft, unmerged, on `codex/coherence-capture-learning-v1`, targeting `prototype/humans-v1`.

Exact implementation head: `c1e10e8cc4a0c265ec8e6a6606932d76c749f755` (`Rebase stacked-unit selection on tapped stack`). This bounded package fixes residual-stack re-entry in the production context-selection bridge and adds a dedicated regression.

## Exact CI / factual blocker inspected
- Workflow run `33236602471` (#234) validated implementation head `c6dec095ee2160ddd720d893760e2445c52c19c7` and completed **failure**, not cancelled.
- #234 static gate: **green**.
- #234 did **not** reach the full-suite gate because the focused gate failed first.
- #234 focused Chromium: **59 passed / 60 total, 1 failed**.
- #234 focused WebKit: **58 passed / 60 total, 2 failed**.
- Exact artifact: `9710154965` (`epohi-autonomous-cross-browser-results`).
- First factual failure on Chromium was `tests/combat-world-stability.spec.js:170` (`three same-type stacked units keep distinct selection and orders`): after the first scout moved away, tapping the original two-unit stack left the moved scout as `selectedUnitId`; `renderStackPicker()` therefore derived stack membership from the moved scout's new coordinate and returned 0 buttons instead of 2.
- WebKit reproduced the same stacked-unit failure and also had a later capital-capture failure; per the one-failure rule, only the stacked-unit defect is addressed in this package.

## Bounded package completed
- Kept route/movement semantics unchanged.
- Updated the map semantic-click bridge so a tap on an own-unit stack always rebases selection to a living unit on the tapped tile when the previously selected unit is elsewhere; when the selected unit is already on that tile, its identity is preserved.
- Bumped `EpohiContextReviewCleanup.version` from 3 to 4 for the changed selection contract.
- Added `tests/stack-reentry-selection.spec.js`, which moves the selected scout away, taps the residual stack, verifies selection rebases to a remaining unit, and verifies both residual stack entries are rendered.

## Validation state
- Exact prior CI #234 on `c6dec095ee2160ddd720d893760e2445c52c19c7`: static green; focused Chromium 59/60; focused WebKit 58/60; full suite not entered; overall **failure**.
- Exact implementation head `c1e10e8cc4a0c265ec8e6a6606932d76c749f755`: pushed.
- Exact workflow run `33238924950` (#236) for `c1e10e8cc4a0c265ec8e6a6606932d76c749f755` is **queued**. Do not make another source/test/runtime change until this exact checkpoint has a completed CI result.
- Current blocker: cross-browser validation for the residual-stack re-entry runtime fix is pending in #236; full regression is not yet green.
- No physical-device test is requested.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [x] Phase 1 focused runtime architecture hardening — focused Chromium + WebKit gate previously green before the stacked-unit regression surfaced the re-entry defect.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Inspect the completed exact CI/artifact for implementation head `c1e10e8cc4a0c265ec8e6a6606932d76c749f755`, then take only its first factual failure as the next bounded package.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.