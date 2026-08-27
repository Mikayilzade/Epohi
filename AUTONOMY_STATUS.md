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
Exact implementation/test head inspected this run: `b5e22ba0fee7fa5dd34d6de01e977df0535ce9dd` (`Make turn label renders idempotent`).

Its automatically-triggered PR workflow is run `33037010950`, completed **failure**. Static integrity was green; focused Chromium/WebKit gate failed; full mobile regression was correctly skipped. The run retained diagnostics artifact `9632475575` (`epohi-autonomous-cross-browser-results`, 1,437,637 bytes) and GitHub reports exactly **2 annotations** on check run `98401788863`.

## Exact CI / validation for `b5e22ba0...`
- Static integrity: **green**.
- Focused Chromium/WebKit gate: **failure**.
- Full Chromium/WebKit regression: **skipped because focused gate failed**.
- Diagnostics artifact: `9632475575`, retained until 2026-09-03.
- Exact check annotations/failure payload are not exposed by the currently available GitHub connector endpoint in this run, so no speculative source/test change was made.
- No timeout, cadence threshold, callback threshold, actionability limit, gameplay assertion, or physical-device requirement was weakened.

## Previous measured diagnosis
Before this checkpoint, improved attribution showed 12 pending observer-safety deliveries entering the quiet window, with `#turnValue` common to the measured cohort. `app.js::renderTop()` was unconditionally assigning the same `turnValue.textContent`, creating redundant child-list mutations. The `b5e22ba0...` package made only that turn-label write idempotent and added a focused cross-browser regression while preserving real turn changes.

## Current blocker
The idempotent-turn-label package did **not** make the focused cross-browser gate fully green. The exact two retained failures must be extracted before choosing the next implementation change. Chromium cadence `13 vs <=12` and WebKit `mouse.wheel` were the known secondary failures before this checkpoint, but they must not be assumed to be the current two failures without exact run evidence.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — PR CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## NEXT ACTION
Extract the exact two focused failures from run `33037010950` / diagnostics artifact `9632475575` using an available artifact/log path. Do not push a source/test fix until those failures are identified. Then fix only the first factual failure with one bounded source+regression package, without weakening thresholds.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
