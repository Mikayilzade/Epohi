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
`6c9d4029a69b9d7313a068f9760332338b40fedf` — the temporary observer-safety bridge now suppresses legacy heavy `cityModal` child/subtree observation entirely instead of narrowing it to a class observer. Semantic root-class observers remain allowed. No threshold or gameplay assertion was weakened.

PR head was re-verified as `7dca064880a6d1147e10b05ca408ca9c79ce229d` immediately before this source push.

## Exact previous validation
Authoritative rerun of implementation checkpoint `7dca064880a6d1147e10b05ca408ca9c79ce229d`: workflow run `32680817099`, latest artifact `9505153758`.

- Chromium focused: **48/51 passed, 3 failed**.
- WebKit focused: **46/51 passed, 5 failed**.
- Full regression: skipped because focused remained red.

Reproduced factual failures from that exact rerun:
- Chromium: runtime invalidation flushes **15** vs required `<15`; 30-cycle city-sheet idle callbacks **20** vs `<=8`; third-rival initialization timed out (previously non-reproducible generation flake).
- WebKit: stacked-unit move button stayed unstable until timeout; unsupported mobile `mouse.wheel`; selected-worker idle callbacks **16** vs `<=6`; opening-city actionability timeout; 30-cycle city-sheet idle callbacks **14** vs `<=8`.

The prior one-off WebKit stacked-unit timeout therefore reproduced. More importantly, both engines still reproduce observer/city idle churn, so the next fix remains architectural rather than a test relaxation.

## Runtime hardening progress
- StrategyUX broad DOM observers/global-click scheduling are gone; `EpohiRuntimeInvalidation` owns explicit refresh.
- Duplicate player-feedback invalidation and journey/victory/turn observers were removed from stabilization.
- Legacy base `humans-player-feedback.js` observer/global refresh scheduling has been removed; RuntimeInvalidation owns its refresh.
- Event overlay policy no longer schedules normalization for city-modal open/close clicks.
- `src/humans-coherence-finalize.js` no longer registers its broad `cityModal` subtree observer.
- Exact rerun after that removal still showed city-sheet callback churn in both engines, proving at least one legacy heavy city observer path remains elsewhere.
- Checkpoint `6c9d4029…` suppresses heavy `cityModal` descendant registrations at the temporary safety bridge while preserving semantic root-class observation, to isolate/remove that remaining polling path without changing thresholds.
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
Treat the next branch head containing `6c9d4029a69b9d7313a068f9760332338b40fedf` as the new implementation checkpoint and run/inspect its exact Chromium + WebKit focused CI before any further source push. If the 30-cycle city-sheet callback invariant is still red, inspect the first remaining MutationObserver registration that targets `cityModal` or a parent surface and remove/narrow that native owner rather than changing the `<=8` threshold. If city churn is green, take the first reproduced factual failure in CI order, with priority to the reproduced stacked-unit/context action instability over known unsupported WebKit `mouse.wheel` automation behavior.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
