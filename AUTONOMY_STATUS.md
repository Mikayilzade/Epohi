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
`5bb31217e5093f335eab441ff1c911910c776173` — the stacked-unit regression no longer relies on Playwright native map-tile actionability while the mobile map is under its short CSS camera transform. The test now uses deterministic DOM `click()` on the exact rendered tile nodes and keeps every gameplay assertion unchanged. No callback threshold or gameplay assertion was weakened.

Before this source push, PR head was re-verified as `0a33fe5a21090a4fb02de091936d37426180b415`. The factual previous gameplay baseline was exact run `32691163962` / artifact `9507360860` for `f7fd3b9225b845d748a81f0c68c0d811882b22bf`: Chromium **51/51**, WebKit **46/51**. Its first WebKit failure was the stacked-unit map-tile stability wait.

## Exact current validation
Exact implementation run `32694392057` for `5bb31217e5093f335eab441ff1c911910c776173`, artifact `9508405623`:

- Static integrity: **success**.
- Chromium focused: **51/51 passed**.
- WebKit focused: **47/51 passed, 4 failed**.
- Full regression: skipped because focused WebKit remained red.

The stacked-unit failure is gone. Current factual WebKit failures in CI order:
1. `enemy selected from the map exposes and resolves a visible unit attack` — the attack action becomes available and is clicked, but the enemy with `hp=1` still exists afterward. Failure screenshot shows the enemy remains selected at **1/60 HP** and the attack is then unavailable. This is now the first factual blocker and must be diagnosed as stale/detached action handling vs combat-resolution state before another source push.
2. Mouse-wheel zoom — `mouse.wheel` is unsupported by mobile WebKit; known automation limitation, not the next source target.
3. `opening city sheet stays open and heavy observers are quarantined` — still red on WebKit.
4. `observer sync is bounded and city sheet survives 30 explicit open-close cycles` — still red on WebKit.

No physical-device QA was initiated. PR #84 remains Draft and unmerged.

## CI / notification containment
- Final CI-policy checkpoint `5b0832ee9715c5c4f1ca7b831ee0b1f29150d5f1` removes the redundant branch `push` trigger, limits automatic CI to one `pull_request:synchronize` run per branch update, and pins checkout to the exact PR head SHA rather than GitHub's synthetic merge ref.
- After checkout, `HEAD^..HEAD` is the actual latest branch commit. Only meaningful workflow/config/package/source/tests/index/service-worker changes install browsers and run Chromium/WebKit Playwright. Status/docs-only commits stop after the cheap detector.
- `workflow_dispatch` is not used by the autonomous loop. Identical-SHA reruns are reserved only for clear infrastructure/no-result failures.
- Gmail is not used by the automation; its email/push notification channels are disabled.

## Runtime hardening progress
- StrategyUX broad DOM observers/global-click scheduling are gone; `EpohiRuntimeInvalidation` owns explicit refresh.
- Duplicate player-feedback invalidation and journey/victory/turn observers were removed from stabilization.
- Legacy base `humans-player-feedback.js` observer/global refresh scheduling has been removed; RuntimeInvalidation owns its refresh.
- Event overlay policy no longer schedules normalization for city-modal open/close clicks.
- `src/humans-coherence-finalize.js` no longer registers its broad `cityModal` subtree observer.
- Temporary observer safety suppresses heavy `cityModal` descendant registrations while semantic root signals remain allowed.
- CoherenceFinalize no longer schedules its decorator for every document click; city closing is quiescent on that path.
- Chromium focused runtime/coherence/capture/diplomacy gate remains fully green at exact checkpoint `5bb31217…`.
- The prior stacked-unit WebKit actionability blocker is closed without changing gameplay semantics or thresholds.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — branch CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## NEXT ACTION
Treat `5bb31217e5093f335eab441ff1c911910c776173` as the latest gameplay implementation checkpoint and exact run `32694392057` / artifact `9508405623` as the factual baseline. Before another source push, re-verify the current PR head.

Investigate the first current WebKit failure: `enemy selected from the map exposes and resolves a visible unit attack`. Trace the exact click/action handler and combat resolver from target selection through `[data-context-action="attack"]` to state mutation. Determine whether WebKit is clicking a stale/detached action node, whether a post-click rerender clears/changes the selected attacker before resolution, or whether combat resolution itself can leave a 1-HP target alive despite this fixture. Fix the native owner of the problem or, only if the handler is correct and the failure is purely Playwright actionability/detachment, change the automation interaction to an equivalent deterministic DOM action while preserving the existing enemy-removal assertion. Do not weaken any thresholds/assertions and do not rerun the same SHA merely to see whether it disappears. Then validate the exact new SHA once on Chromium + WebKit before any further source push.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
