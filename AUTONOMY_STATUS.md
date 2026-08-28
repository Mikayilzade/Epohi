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
Exact PR head inspected at the start of this run: `bdae9de06ab912e840cad10f0ceeff944266a1ad` (`Stabilize barbarian replacement camp fixture`). PR #84 remained open/draft and targeted `prototype/humans-v1`.

Exact implementation head for this bounded package: `3526b8cc9d37d985f024cb4dd25dd74af8b1837a` (`Stabilize AI finite POI fixture`). Only `tests/combat-world-stability.spec.js` changed in the implementation checkpoint; production/runtime code was not changed.

## Exact CI / factual blocker inspected
Workflow run `33176506529` (run #209) on exact implementation head `3526b8cc9d37d985f024cb4dd25dd74af8b1837a` completed **failure**. Retained artifact `9688003399` was downloaded and inspected directly.

- Static integrity: **green**.
- Focused Chromium: **60/60 passed**.
- Focused WebKit: **59/60 passed, 1 failed**.
- The stabilized finite-POI regression passed in the checkpoint; the prior Chromium-only POI fixture failure did not reproduce.
- Full Chromium/WebKit regression: **skipped** because the focused gate failed.
- First remaining factual failure: `tests/combat-world-stability.spec.js:98` (`enemy selected from the map exposes and resolves a visible unit attack`) on WebKit only.
- Exact assertion at line 108: expected the attacked enemy unit to be absent (`false`) after the visible attack action; received `true`. Chromium passed the same regression in the same run.
- No source fix for this new blocker was attempted in this run; its exact runtime/fixture cause remains to be established from the retained WebKit diagnostics before changing code or test semantics.

## Bounded package completed
- Stabilized only the finite-POI regression fixture identified by run #208; no gameplay/runtime source changed.
- Reset the rival exploration map to a deterministic single known finite POI instead of inheriting random generated `civ.explored` entries that could legitimately outrank the intended target.
- Relocated the rival capital away from the exercised target tile and normalized that capital tile, removing random occupancy coupling from `canRivalEnter`.
- Kept the unrelated distant barbarian so the regression still proves a scout chooses its known finite POI before an irrelevant barbarian target.
- Strengthened the regression to assert the exact AI scout position on the POI after the turn, in addition to one-time consumption, resource gain, event logging, and post-consumption target semantics.
- Run #209 confirms this bounded fixture repair is green on Chromium and WebKit; the gate now stops on an earlier independent WebKit-only visible-attack regression.

## Validation state
- Authority before package: run `33172013955` / artifact `9686111458` on `bdae9de0...`: static green, focused Chromium 59/60, focused WebKit 60/60, full suite skipped; first factual blocker was the finite-POI regression on Chromium.
- Authority after package: run `33176506529` / artifact `9688003399` on exact implementation head `3526b8cc...`: static green, focused Chromium 60/60, focused WebKit 59/60, full suite skipped.
- Current blocker is the WebKit-only visible enemy attack regression described above. No physical-device test is requested.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [ ] Phase 1 focused runtime architecture hardening — latest exact checkpoint still has one WebKit focused failure.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage; blocked until focused gate is green again.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Inspect the retained WebKit diagnostics for run `33176506529` / artifact `9688003399` around `tests/combat-world-stability.spec.js:98`, determine whether the adjacent visible-attack failure is a fixture synchronization issue or a runtime defect, and implement exactly one regression-backed bounded fix for that first factual blocker.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
