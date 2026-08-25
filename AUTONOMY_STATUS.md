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
Run `32781292098` (run #149) for diagnostic checkpoint `6cd0c229589d3596c1528e65a427382b964a98ff` completed **failure**. The current commit extends only diagnostic attribution; no gameplay semantics, callback thresholds, or actionability timeouts are changed.

## Exact CI / validation
Run #149 artifact `9575206156` was inspected.
- Chromium focused: **53/53 passed**.
- WebKit focused: **46/53 passed, 7 failed**.
- WebKit runtime failures still reproduce selected-worker idle at **16 callbacks vs <=6** and 30-cycle post-idle at **12 callbacks vs <=8**.
- The existing unsupported WebKit `mouse.wheel`, diplomacy-answer actionability, and `open-city` actionability failures remain.
- Both startup attribution tests reproduced the same 16/12 safety-wrapper callback deltas, but both `attributionDelta` arrays were still empty even after recording `takeRecords()` drains.

The empty attribution is now explained more precisely: `src/humans-performance.js` can queue a per-observer delivery on `requestAnimationFrame` before the measured quiet window, then increment `__epohiObserverSafetyStats.callbacks` when that already-scheduled delivery executes inside the quiet window. Native callback / `takeRecords()` counters may therefore remain unchanged during the measured interval.

## Diagnostic change in this checkpoint
`tests/observer-startup-attribution.spec.js` now instruments `requestAnimationFrame` from page startup before `humans-performance.js` captures it. It associates safety-wrapper delivery RAFs with the originating tracked MutationObserver, records scheduled/executed delivery counts, and emits `pendingBefore` plus per-observer delivery deltas. Drained-record owner IDs are carried forward into restore-time delivery scheduling when possible.

This is a test-only diagnostic checkpoint. The valid `<=6`, `<=8`, and 1-second actionability limits remain unchanged. No physical-device QA, merge, workflow dispatch, or rerun is requested.

## Current blocker
The remaining WebKit callback churn is confirmed, but run #149 still did not name the observer whose already-queued safety delivery executes during the quiet window. The new delivery-level attribution is intended to close exactly that gap without another speculative source removal.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — PR CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## NEXT ACTION
Fetch PR #84 and wait for the exact automatically-triggered Chromium/WebKit CI for this test-only diagnostic checkpoint. Inspect `EPOHI_STARTUP_OBSERVER_ATTRIBUTION` / artifact JSON, especially `pendingBefore`, `executedDeliveries`, observer registrations, and construct/observe stacks. Name the first concrete WebKit observer owner whose safety delivery accounts for the 16/12 quiet-window callbacks; only then make one narrow coherent source fix with regression coverage. Do not weaken `<=6`, `<=8`, or the 1-second actionability thresholds. Handle unsupported mobile-WebKit `mouse.wheel` separately only after the callback blocker is resolved.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
