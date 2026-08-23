# RUNTIME OBSERVER MAP — Humans v1

Phase 1 ownership inventory for the loaded Humans runtime. This file tracks confirmed browser observers/schedulers and explicit invalidation ownership before the global safety wrapper can be removed.

| Owner | Observed / scheduled surface | Writes / effect | Current disposition |
| --- | --- | --- | --- |
| `src/humans-performance.js` v7 | temporary global `MutationObserver` safety wrapper; protected RAF/timeouts | coalesces callbacks and suppresses legacy broad roots | **TEMPORARY BRIDGE.** Keep until the remaining legacy player-feedback observers are removed and focused gates remain stable. |
| `src/humans-observer.js` v3 | narrow `#turnValue` / `#menuModal` plus semantic lifecycle signals | open-map/menu sync; emits `epohi:humans-ui-settled` | **REFACTORED.** No broad observer or global click loop. |
| `src/humans-runtime-invalidation.js` v7 | explicit settled/click/pageshow/visibility signals -> one coalesced protected RAF | synchronizes StrategyUX, base PlayerFeedback, visuals, context cleanup and stabilization | **CENTRAL OWNER.** Normal DOM decoration refresh belongs here. |
| `src/humans-visuals.js` v2 | no DOM observer/polling | map decoration | **REFACTORED.** Explicit invalidation only. |
| `src/humans-context-review-cleanup.js` v3 | no broad observer; module-local RAF queue only | stack picker/readiness/action layout | **REFACTORED.** Does not recreate ordinary context action buttons. |
| `src/humans-player-feedback-stabilization.js` v7 | `ResizeObserver(#mapViewport)` only for real layout changes; pointer/action hooks | outcome/context guards, stack acknowledgement, camera reapply | **REFACTORED FURTHER.** Duplicate global click invalidation and journey/victory/turn `MutationObserver`s were removed in `1e33e117…` and `7b0dd7d9…`; stabilization work is invoked explicitly by RuntimeInvalidation. |
| `src/humans-camera-layout-guard.js` v2 | narrow screen/app visibility/layout signals | camera persistence/restore | **NARROW/BONDED.** Revisit after legacy feedback removal. |
| `src/humans-strategy-ux.js` v3 | viewport resize + module-local explicit schedule only | readiness, faction/context decoration, diplomacy/POI UI, camera stabilization | **REFACTORED.** Legacy broad map/context/screen/menu observers and click scheduler are gone. |
| `src/humans-player-feedback.js` v1 | broad `#contextPanel`/`#map`; content/modal observers; global click -> `setTimeout(refresh, 0)` | context command cleanup, treasury/diplomacy/world-event/outcome decoration | **LAST MAJOR LEGACY FEEDBACK OWNER.** RuntimeInvalidation already calls `EpohiPlayerFeedback.refresh()` explicitly, so its refresh scheduler/observer registrations are redundant and are the next removal target. |

## Confirmed feedback-cycle status

1. Visual/context cleanup self-observation — removed.
2. StrategyUX broad observer/click cycle — removed; explicit central invalidation owns refresh.
3. Player-feedback stabilization duplicate click invalidation — removed in `1e33e1178f2634794314238a1074abcc46d2fa49`.
4. Player-feedback stabilization journey/victory/turn MutationObservers — removed in `7b0dd7d996d0d3d7a20813a4f28333bd90b809a8`.
5. Base `humans-player-feedback.js` observer/global-click refresh cycle — **still present and now the primary native cleanup target**.

## Latest exact signal

Exact run `32662639793` for implementation checkpoint `7b0dd7d996d0d3d7a20813a4f28333bd90b809a8`:
- static integrity: success;
- Chromium focused: **47/51 passed, 4 failed**;
- WebKit focused: **47/51 passed, 4 failed**;
- full regression skipped because focused gate remained red.

Chromium selected-worker idle callback stability is now green. The first factual Chromium failure is city-sheet opening: the visible `open-city` context button is detached/replaced while Playwright attempts the click. The 30-cycle city test is also still narrowly red at 9 observer callbacks versus the unchanged <=8 threshold. These symptoms are consistent with the remaining asynchronous base PlayerFeedback refresh path, not with `ContextReviewCleanup.syncActionLayout()`, which only decorates/layouts existing action buttons.

## Explicit invalidation direction

`EpohiRuntimeInvalidation` is the single decorator bridge. It explicitly synchronizes `EpohiStrategyUX.refresh()` and `EpohiPlayerFeedback.refresh()` in the same protected RAF as visuals/context/stabilization. Do not restore broad observer polling and do not weaken callback/click thresholds.

## NEXT NATIVE CLEANUP

In `src/humans-player-feedback.js`, keep the delegated document click handler only for its actual business actions, but remove the trailing `setTimeout(refresh, 0)` and redundant DOM `MutationObserver` registrations. Let RuntimeInvalidation own refresh. Validate that exact implementation SHA on Chromium + WebKit before any further source push.
