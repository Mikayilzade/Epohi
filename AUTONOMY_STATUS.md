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
Exact PR head inspected at the start of this run: `6bf3976c9e5a60952a7555192799be138b80b57f` (`Align pathing fixture with explicit UI invalidation`). PR #84 remains open/draft and targets `prototype/humans-v1`.

Exact implementation payload for this bounded package: `16a3623c1cda9b87f679c64eea9b2d5725981736` (`Stabilize barbarian replacement camp fixture`). This payload is incorporated into the single coherent branch checkpoint pushed by this run together with this status update.

## Exact CI / factual blocker inspected
Workflow run `33167859169` (run #206) on exact head `6bf3976c9e5a60952a7555192799be138b80b57f` completed **failure**. Retained artifact `9685365548` was downloaded and inspected directly.

- Static integrity: **green**.
- Focused mobile runtime: **green**, **60/60** on Chromium and **60/60** on WebKit.
- Full Chromium: **158/177 passed, 19 failed**.
- Full WebKit: **159/177 passed, 18 failed**.
- First factual full-suite failure: `tests/barbarian-review-fixes.spec.js:46` (`replacement camp excludes the last destroyed tile when another candidate exists`) on Chromium only; the same regression passed on WebKit.
- Exact assertion: expected forced replacement at `{x:18,y:18}`, received `null`.
- Runtime validation requires a replacement tile to be passable, at least five tiles from every city, outside current vision, unoccupied, and reachable from civilized land. The regression hard-coded `{18,18}` and carved a one-direction path from a randomly placed capital, so depending on generated capital position the forced tile could legitimately be invalid before the `lastDestroyedCamp` rule was exercised. This was a nondeterministic fixture defect, not a gameplay defect.

## Bounded package completed
- Reworked only the replacement-camp regression fixture; no production/runtime code changed.
- The fixture now derives two interior corner candidates from the actual generated capital, choosing the two farthest positions instead of assuming fixed `{1,1}` and `{18,18}` semantics.
- It carves deterministic reachable land to both candidates and first asserts that both are valid with no destruction history.
- It then records one candidate as `lastDestroyedCamp`, asserts that only that old tile becomes invalid while the alternate remains valid, forces the replacement onto the alternate, and verifies exactly one active camp is created there.
- This directly strengthens regression coverage for the defect under test while removing random-capital coupling.

## Validation state
- Authority before package: run `33167859169` / artifact `9685365548` on `6bf3976c...`.
- Static and focused gates were green; artifact showed 158/177 Chromium and 159/177 WebKit, with the Chromium-only nondeterministic barbarian fixture as the earliest factual failure.
- New Chromium/WebKit CI for this coherent test+status checkpoint is the next authority; do not claim this regression green until that exact run completes.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [x] Phase 1 focused runtime architecture hardening — run #206 focused gate is green on both engines.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage; currently working through the first factual full-suite failure.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Wait for the automatically-triggered Chromium/WebKit CI of this deterministic barbarian replacement-fixture checkpoint; when it completes, inspect its retained artifact and act only on the first remaining factual full-suite failure on that exact SHA.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
