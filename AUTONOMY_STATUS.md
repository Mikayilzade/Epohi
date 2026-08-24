# AUTONOMY STATUS — «Эпохи» Humans v1

## State
`IN_PROGRESS_AUTONOMOUS`

## Integration
- Repository: `Mikayilzade/Epohi`
- Active branch: `codex/coherence-capture-learning-v1`
- Draft PR: #84
- Base: `prototype/humans-v1`
- `main`: DO NOT TOUCH

## Current implementation checkpoint
`61bed59005207b05f3f3c44dbeaf8345ff2385ad` — overlay-policy invalidation skips `#cityBtn` / `[data-close="cityModal"]` toggles.

The PR head was verified at this exact SHA before inspection. No further source push has been made after it.

## Exact validation
Authoritative rerun of the same implementation SHA: workflow run `32671505187`, latest artifact `9502328774`.

- Static integrity: **success**.
- Chromium focused: **50/51 passed, 1 failed**.
- WebKit focused: **46/51 passed, 5 failed**.
- Full regression: skipped because the focused gate remained red.

The earlier one-off Chromium failure around creating a third rival did **not** reproduce and is treated as a generation/CI flake rather than the next source target.

The first reproduced factual Chromium failure is still the 30-cycle city open/close idle invariant in `tests/mobile-performance-stability.spec.js`: observer callback delta was **21** against the unchanged `<=8` threshold. WebKit reproduces the same invariant at **15** callbacks. Thresholds remain unchanged.

Other WebKit failures in the rerun:
- mobile WebKit does not support Playwright `mouse.wheel`;
- stacked-unit locator click actionability timeout;
- selected-worker idle callback delta `16` vs `<=6`;
- opening-city locator click actionability timeout.

## Runtime hardening progress
- StrategyUX broad DOM observers/global-click scheduling are gone; `EpohiRuntimeInvalidation` owns explicit refresh.
- Duplicate player-feedback invalidation and journey/victory/turn observers were removed from stabilization.
- Legacy base `humans-player-feedback.js` observer/global refresh scheduling has been removed; RuntimeInvalidation owns its refresh.
- Event overlay policy no longer schedules normalization for city-modal open/close clicks.
- Reinspection after the exact `61bed590…` rerun found a remaining broad observer cycle in `src/humans-coherence-finalize.js`: it observes `cityModal` (and several other modals) with `{attributes:true, childList:true, subtree:true}` and schedules a RAF decorator. This directly watches the city sheet whose repeated mutation is the reproduced callback-invariant failure.
- `humans-coherence-finalize.js` also has a turn observer and toast observer; these are not yet changed.
- No physical-device QA was initiated. PR #84 remains Draft and unmerged.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — branch CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## NEXT ACTION
Before any source push, re-check the current PR head and retain `61bed59005207b05f3f3c44dbeaf8345ff2385ad` run `32671505187` as the exact previous implementation evidence. Then make one narrow native fix in `src/humans-coherence-finalize.js`: remove the broad `cityModal` subtree observer as a polling/decorator trigger (prefer explicit RuntimeInvalidation ownership; at minimum narrow the city observer to the modal root semantic class transition without observing child/subtree mutations). Preserve the 30-cycle `<=8` callback threshold and all gameplay assertions. Run exact Chromium/WebKit focused CI for that implementation SHA before any additional source push, and take the first reproduced factual failure.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
