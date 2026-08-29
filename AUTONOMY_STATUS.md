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
Exact PR head inspected at the start of this run: `3c57672258b2c8c87b1b907b159e71f086858066`. PR #84 was open/draft, unmerged, on `codex/coherence-capture-learning-v1`, targeting `prototype/humans-v1`.

Exact implementation head: `09500af25148929a65f90c0153b772138b350eff` (`Harden new-game map-size regression fixture`). This bounded package addresses only the first remaining Chromium failure retained by run #222 after the camp-destruction regression became green. No production runtime/source file was changed.

## Exact CI / factual blocker inspected
- Workflow run `33221559792` (#222) validated implementation head `49bab29dc899e53077d14389fb0e0d71ad1f108b` and completed **failure**, not cancelled.
- #222 static gate: **green**.
- #222 focused Chromium + WebKit gate: **green**.
- The strengthened camp-destruction regression from `49bab29d…` passed; it is no longer the first failure.
- #222 full Chromium: **161 passed / 179 total, 18 failed**.
- #222 full WebKit: **161 passed / 179 total, 18 failed**.
- First Chromium failure: `tests/browser.spec.js:93` (`creates a new game with 0 AI and starts the map`). Exact assertion expected 400 `#map .tile` nodes but received 784, i.e. the requested `small` setup rendered a 28×28 map in that run.
- The same 0-AI small-map smoke passed in WebKit in #222, and repository config still defines `small: 20`, `normal: 28`, `large: 36`; therefore no speculative production fix was made from one Chromium-only occurrence.

## Bounded package completed
- Strengthened shared `createGame` setup so the selected `partySize` and `rivalCount` are explicitly verified before pressing `Создать мир`, removing ambiguity about a stale/replaced setup form.
- Added post-creation assertions against the debug game state: requested map size must equal the configured dimension and the backing map row count must match it before any synthetic fixture mutation.
- Existing browser smoke still asserts the rendered tile count, so the regression now distinguishes setup-selection loss from backing-state generation/render defects instead of reporting only the final DOM count.
- Exactly one test helper changed; no production runtime/source file was touched.

## Validation state
- Exact prior CI #222 on `49bab29dc899e53077d14389fb0e0d71ad1f108b`: static green; focused Chromium + WebKit green; full Chromium 161/179; full WebKit 161/179; overall **failure**.
- Exact implementation head `09500af25148929a65f90c0153b772138b350eff`: no PR workflow run had appeared yet when this status was written immediately after push. Do not make another source/test/runtime change until this checkpoint has an exact CI result.
- Current blocker: cross-browser full regression is not green; the next package must use the exact retained CI/artifact for `09500af25148929a65f90c0153b772138b350eff` and take only its first factual failure.
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
Inspect the exact CI run for implementation head `09500af25148929a65f90c0153b772138b350eff`; use the new map-size assertions to classify the first failure precisely, then take only that first factual full-suite failure as the next bounded package.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
