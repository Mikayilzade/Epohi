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
Exact PR head inspected at the start of this run: `4331d88e14920896f60462899b4524231444baa5`. PR #84 was open/draft, unmerged, on `codex/coherence-capture-learning-v1`, targeting `prototype/humans-v1`.

Exact implementation head: `5b21f1b2cb7fd6d7d3020552ba38fb7bc7bcd863` (`Use semantic inspect-layer activation in legacy map regression`). This bounded package changes only stale map-inspection regression interaction; production runtime/source behavior is unchanged.

## Exact CI / factual blocker inspected
- Workflow run `33241507869` (#238) validated implementation head `31f12e3a0592ed91d4956dc75372f3e797de5781` and completed **failure**, not cancelled.
- #238 static gate: **green**.
- #238 focused Chromium: **60/60 passed**.
- #238 focused WebKit: **60/60 passed**.
- #238 full Chromium: **164 passed / 180 total, 16 failed**.
- #238 full WebKit: **162 passed / 180 total, 18 failed**.
- Exact artifact: `9711908491` (`epohi-autonomous-cross-browser-results`).
- First factual full-suite failure was `tests/map-inspection.spec.js:38` (`tile inspection shows coordinates yields and fades only selected objects`). The legacy test attempted a physical Playwright click on `.inspect-tab[data-inspect-layer="tile"]`, but `humans-context-review-cleanup.js` intentionally keeps `#contextTabs` as a 2px, transparent, `pointer-events:none`, negative-z compatibility surface. Exact failure logs reported `<body ...> intercepts pointer events`; the failure screenshot showed the canonical visible unit context with no user-facing inspect tabs. This is a stale regression interaction, not a product/runtime defect.

## Bounded package completed
- Kept accepted gameplay/runtime semantics unchanged.
- Added `clickInspectLayerSemanticDom()` to `tests/map-inspection.spec.js` so compatibility-layer inspection is exercised semantically rather than by physically clicking an intentionally non-interactive legacy control.
- Updated both tile-layer regression paths to use that semantic bridge while preserving coordinate/yield assertions, tile fade state, unit-layer restoration, and selected-unit identity.

## Validation state
- Exact prior CI #238 on `31f12e3a0592ed91d4956dc75372f3e797de5781`: static green; focused Chromium 60/60; focused WebKit 60/60; full Chromium 164/180; full WebKit 162/180; overall **failure**.
- Exact implementation head `5b21f1b2cb7fd6d7d3020552ba38fb7bc7bcd863`: pushed.
- Exact workflow run `33243697618` (#240) for `5b21f1b2cb7fd6d7d3020552ba38fb7bc7bcd863` is **in progress**. Do not make another source/test/runtime change until this exact checkpoint completes.
- Current blocker: cross-browser validation of the corrected legacy map-inspection regression is pending in #240; full regression is not yet green.
- No physical-device test is requested.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [x] Phase 1 focused runtime architecture hardening — focused Chromium + WebKit gate is green in #238.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Inspect the completed exact CI/artifact for implementation head `5b21f1b2cb7fd6d7d3020552ba38fb7bc7bcd863`, then take only its first factual failure as the next bounded package.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
