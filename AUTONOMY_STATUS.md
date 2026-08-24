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
Latest diagnostic implementation head: `6cd0c229589d3596c1528e65a427382b964a98ff` (`Trace observer records drained by safety wrapper`).

This status commit is documentation-only. Before any source/test write, fetch PR #84 again and inspect the exact CI for `6cd0c229589d3596c1528e65a427382b964a98ff`.

## Exact CI / validation
The prior test-only diagnostic checkpoint `90df33a6b0cdc8f8b048beb82fd913e59ff622a4` completed in run `32780715758` (run #148) with **failure**:
- Chromium focused: **53/53 passed**.
- WebKit focused: **47/53 passed, 6 failed**.
- Existing WebKit blockers remained: unsupported mobile-WebKit `mouse.wheel`, diplomacy-answer actionability, `open-city` actionability, selected-worker idle **16 callbacks vs <=6**, and 30-cycle post-idle **12 callbacks vs <=8**.
- The new startup attribution reproduced the same 16/12 callback deltas on WebKit, but `attributionDelta` was empty there.
- On Chromium the attribution did identify a retained observer constructed in `src/humans-coherence-finalize.js` around the `#toast` observer, proving the startup hook itself works.

Inspection of `src/humans-performance.js` explains the WebKit diagnostic blind spot: the safety wrapper calls the captured observer `takeRecords()` while pausing observers inside protected tasks, appends those records to its own pending queue, and later increments `__epohiObserverSafetyStats.callbacks` when it delivers that pending queue. The original startup diagnostic counted only native observer callbacks, so records drained through `takeRecords()` could produce safety-wrapper callback increments with no native attribution delta.

Checkpoint `6cd0c229589d3596c1528e65a427382b964a98ff` repairs only that diagnostic gap. `tests/observer-startup-attribution.spec.js` now records `takeRecords()` drains (`drainedBatches`, `drainedRecords`) and their mutation target/type per observer while preserving the existing `<=6` and `<=8` thresholds. No gameplay/source behavior, timeout, or threshold changed.

Automatically-triggered exact CI for `6cd0c229589d3596c1528e65a427382b964a98ff`: run `32781292098` (run #149) is currently **in progress**. Do not push another source/test checkpoint until it completes and its artifact is inspected.

## Current blocker
The remaining WebKit callback churn is confirmed. The current task is now to use run #149's `drainedRecords` attribution to name the exact observer owner/target responsible for the 16/12 safety-wrapper deliveries. Do not remove another observer speculatively.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — PR CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## NEXT ACTION
Wait for exact run `32781292098` for `6cd0c229589d3596c1528e65a427382b964a98ff` to complete, inspect `epohi-autonomous-cross-browser-results`, and use the selected-worker / city-cycle `drainedRecords` attribution to name the first concrete observer owner and mutation target. Then make at most one narrow coherent source fix with regression coverage, without weakening `<=6`, `<=8`, or the 1-second actionability thresholds. Handle unsupported WebKit `mouse.wheel` separately as an automation-compatibility issue only after the runtime callback blocker is resolved.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
