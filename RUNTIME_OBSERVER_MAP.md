# RUNTIME OBSERVER MAP — Humans v1

Phase 1 ownership inventory for the loaded Humans runtime. This file tracks confirmed browser observers/schedulers and explicit invalidation ownership before the global safety wrapper can be removed.

| Owner | Observed / scheduled surface | Writes / effect | Current disposition |
| --- | --- | --- | --- |
| `src/humans-performance.js` | temporary global `MutationObserver` safety wrapper; protected RAF/timeouts | coalesces callbacks and suppresses legacy feedback loops | **TEMPORARY BRIDGE.** Keep until native observer/decorator cycles are removed and focused gates remain stable. |
| `src/humans-observer.js` v3 | narrow `#turnValue` / `#menuModal` semantic signals | open-map/menu sync; emits `epohi:humans-ui-settled` | **NARROW/BONDED.** No broad observer or generic click loop. |
| `src/humans-runtime-invalidation.js` v10 | explicit settled/click/pageshow/visibility signals -> one throttled RAF | StrategyUX, base PlayerFeedback, visuals, context cleanup and stabilization | **CENTRAL OWNER.** Ordinary DOM decoration refresh belongs here. City-modal toggle clicks are intentionally excluded. |
| `src/humans-visuals.js` | no DOM observer/polling | map decoration | **REFACTORED.** Explicit invalidation only. |
| `src/humans-context-review-cleanup.js` | module-local RAF queue only | stack picker/readiness/action layout | **REFACTORED.** |
| `src/humans-player-feedback-stabilization.js` | `ResizeObserver(#mapViewport)` plus semantic hooks | outcome/context guards, stack acknowledgement, camera reapply | **REFACTORED.** Duplicate global click and journey/victory/turn MutationObservers removed. |
| `src/humans-camera-layout-guard.js` v2 | narrow `#screenRoot` direct-child + `#gameApp` class observers | camera persistence/restore | **NARROW/BONDED.** Does not observe city content. |
| `src/humans-strategy-ux.js` | explicit scheduling/resize only | readiness, faction/context decoration, diplomacy/POI UI | **REFACTORED.** Legacy broad map/context/screen/menu observers removed. |
| `src/humans-player-feedback.js` v1 | no remaining broad observer/global refresh scheduler | treasury/diplomacy/world-event/outcome decoration | **REFACTORED.** `EpohiRuntimeInvalidation` owns `refresh()`. |
| `src/humans-event-overlay-policy.js` v11 | narrow class observers for priority overlays + turn semantic observer | mandatory overlay ordering/toast normalization | **NARROW BUT STILL OBSERVER-BASED.** City-modal open/close clicks no longer schedule this work. |
| `src/humans-coherence-finalize.js` v1 | `#turnValue`; broad `{attributes,childList,subtree}` observers on `cityModal`, capture/decision/proposal/diplomacy modals; broad toast observer | schedules RAF decorator (`decorate`) that patches city population text, urgent decisions, capture capacity and overlapping toast state | **CURRENT FIRST NATIVE CLEANUP TARGET.** The broad `cityModal` subtree observer directly overlaps the reproduced 30-cycle city-sheet callback failure. |

## Confirmed feedback-cycle status

1. Visual/context cleanup self-observation — removed.
2. StrategyUX broad observer/click cycle — removed; explicit central invalidation owns refresh.
3. Player-feedback stabilization duplicate click invalidation — removed.
4. Player-feedback stabilization journey/victory/turn MutationObservers — removed.
5. Base PlayerFeedback observer/global-click refresh cycle — removed; RuntimeInvalidation owns refresh.
6. Event-overlay generic city-toggle scheduling — removed at implementation checkpoint `61bed59005207b05f3f3c44dbeaf8345ff2385ad`.
7. CoherenceFinalize broad `cityModal` subtree observer — **still present and now the first reproduced native feedback target**.

## Latest exact signal

Exact rerun `32671505187` for implementation checkpoint `61bed59005207b05f3f3c44dbeaf8345ff2385ad` (latest artifact `9502328774`):
- static integrity: success;
- Chromium focused: **50/51 passed, 1 failed**;
- WebKit focused: **46/51 passed, 5 failed**;
- full regression skipped because focused gate remained red.

The first reproduced Chromium failure is `observer sync is bounded and city sheet survives 30 explicit open-close cycles`: idle observer callback delta **21** versus unchanged `<=8`. WebKit reproduces the same invariant at **15**. The earlier third-rival Chromium failure did not reproduce on the exact rerun and is not the next source target.

## Explicit invalidation direction

`EpohiRuntimeInvalidation` is the single normal decorator bridge. Do not restore broad observer polling and do not weaken callback/click thresholds. Module-specific observers should remain only where they represent a true semantic state transition that cannot be emitted directly.

## NEXT NATIVE CLEANUP

In `src/humans-coherence-finalize.js`, stop observing the `cityModal` child/subtree as a decorator trigger. Prefer explicit RuntimeInvalidation ownership of CoherenceFinalize decoration; if a local observer must temporarily remain, restrict it to the city modal root class transition only. Keep the 30-cycle `<=8` invariant unchanged. Validate the exact implementation SHA on Chromium + WebKit before another source push.
