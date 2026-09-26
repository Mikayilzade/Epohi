# RUNTIME OBSERVER MAP — Humans v1

Phase 1 ownership inventory for the loaded Humans runtime. This file tracks confirmed browser observers/schedulers and explicit invalidation ownership before the temporary safety bridge can be removed.

| Owner | Observed / scheduled surface | Writes / effect | Current disposition |
| --- | --- | --- | --- |
| `src/humans-performance.js` v8 safety | temporary coalesced `MutationObserver` wrapper; owner-captured RAF/timeouts | coalesces callbacks; while an observer callback/deferred decorator runs, disconnects and drains **only that observer**, then restores only its registrations | **TEMPORARY OBSERVER-LOCAL BRIDGE.** Global all-observer quarantine is forbidden because WebKit turns it into N-observer delivery fan-out. |
| `src/humans-observer.js` v3 | narrow `#turnValue` / `#menuModal` semantic signals | open-map/menu sync; emits `epohi:humans-ui-settled` | **NARROW/BONDED.** No broad observer or generic click loop. |
| `src/humans-runtime-invalidation.js` v11 | explicit settled/click/pageshow/visibility signals -> one throttled RAF | StrategyUX, base PlayerFeedback, visuals, context cleanup and stabilization | **CENTRAL OWNER.** Explicit flushes do not enter observer quarantine. City-modal toggle clicks are intentionally excluded. |
| `src/humans-visuals.js` | no DOM observer/polling | map decoration | **REFACTORED.** Explicit invalidation only. |
| `src/humans-context-review-cleanup.js` | module-local RAF queue only | stack picker/readiness/action layout | **REFACTORED.** |
| `src/humans-player-feedback-stabilization.js` | `ResizeObserver(#mapViewport)` plus semantic hooks | outcome/context guards, stack acknowledgement, camera reapply | **REFACTORED.** Duplicate global click and journey/victory/turn MutationObservers removed. |
| `src/humans-camera-layout-guard.js` v2 | narrow `#screenRoot` direct-child + `#gameApp` class observers | camera persistence/restore | **NARROW/BONDED.** Does not observe city content. |
| `src/humans-strategy-ux.js` | explicit scheduling/resize only | readiness, faction/context decoration, diplomacy/POI UI | **REFACTORED.** Legacy broad map/context/screen/menu observers removed. |
| `src/humans-player-feedback.js` v1 | no remaining broad observer/global refresh scheduler | treasury/diplomacy/world-event/outcome decoration | **REFACTORED.** `EpohiRuntimeInvalidation` owns `refresh()`. |
| `src/humans-event-overlay-policy.js` v11 | narrow class observers for priority overlays + turn semantic observer | mandatory overlay ordering/toast normalization | **NARROW BUT STILL OBSERVER-BASED.** City-modal open/close clicks no longer schedule this work. |
| `src/humans-coherence-finalize.js` v2 | turn semantic observer; overlay class/descendant registrations normalized by safety wrapper; toast observer | patches population copy, urgent decisions, capture capacity and overlapping toast state | **CITY DESCENDANT LOOP REMOVED.** No `cityModal` subtree observer remains; continue replacing remaining decorator observers with explicit lifecycle signals when reproduced. |

## Confirmed feedback-cycle status

1. Visual/context cleanup self-observation — removed.
2. StrategyUX broad observer/click cycle — removed; explicit central invalidation owns refresh.
3. Player-feedback stabilization duplicate click invalidation — removed.
4. Player-feedback stabilization journey/victory/turn MutationObservers — removed.
5. Base PlayerFeedback observer/global-click refresh cycle — removed; RuntimeInvalidation owns refresh.
6. Event-overlay generic city-toggle scheduling — removed at implementation checkpoint `61bed59005207b05f3f3c44dbeaf8345ff2385ad`.
7. CoherenceFinalize broad `cityModal` subtree observer — removed; explicit/local post-open path owns population copy.
8. Global safety bridge all-observer pause/drain/reconnect — **root cause identified and replaced with observer-local protection in this checkpoint.**

## Latest exact signal before observer-local fix

Run `32880813423` (run #152) for checkpoint `fe5c2fdb93550de113d0dd49edaff9b66d46037f`, artifact `9575845637`:
- static integrity: success;
- Chromium focused: **51/53 passed, 2 failed**;
- WebKit focused: **46/53 passed, 7 failed**;
- full regression skipped because focused gate remained red.

Chromium startup attribution is quiet (`selected-worker-idle callbackDelta=0`, no pending deliveries). Its two failures were the previously intermittent third-rival campaign readiness timeout and the architecture test still expecting the retired RuntimeInvalidation `protectedFlushes > 0` contract.

WebKit reproduces the factual callback blocker exactly:
- selected-worker idle: **16 callbacks vs unchanged `<=6`**;
- 30-cycle post-idle: **12 callbacks vs unchanged `<=8`**;
- startup attribution shows exactly 16 / 12 already-scheduled safety delivery RAFs before the corresponding quiet windows, spread across many distinct observer owners; each pending delivery then executes during the measured window.

Therefore the fan-out is created by `src/humans-performance.js` itself: one observer callback globally pauses/drains/reconnects every registered observer. It is not a single bad observer and it is not caused only by `EpohiRuntimeInvalidation`.

## Explicit invalidation direction

`EpohiRuntimeInvalidation` remains the single normal decorator bridge and must stay outside observer quarantine. Observer protection is now owner-local: an observer can be disconnected across its own callback/deferred decorator so it cannot directly self-observe, while unrelated observers stay connected. Do not restore global observer quarantine, broad polling, or weaken callback/click/actionability thresholds.

## NEXT VALIDATION

Validate the observer-local safety checkpoint on the exact SHA in Chromium + WebKit. The unchanged decisive invariants are selected-worker idle `<=6`, 30-cycle post-idle `<=8`, bounded RuntimeInvalidation callback deltas, and existing 1-second actionability limits. If callback fan-out disappears, move to the first remaining factual focused failure rather than broadening the safety wrapper again. Unsupported mobile-WebKit `mouse.wheel` remains a separate automation-compatibility item.
