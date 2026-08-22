# RUNTIME OBSERVER MAP — Humans v1

Phase 1 ownership inventory for the loaded Humans runtime. This file tracks confirmed browser observers/schedulers and explicit invalidation ownership before the global safety wrapper can be removed.

| Owner | Observed / scheduled surface | Writes / effect | Current disposition |
| --- | --- | --- | --- |
| `src/humans-performance.js` v7 | monkey-patches global `MutationObserver`, wraps callbacks through RAF, wraps `requestAnimationFrame`/`setTimeout` while protected | disconnects/reconnects observers, coalesces records, and temporarily suppresses legacy broad render roots including body/map/screen/context/menu/wiki/victory content | **TEMPORARY BRIDGE.** Run #32575460633 proved loaded legacy decorators still instantiate broad observers. This bridge now quarantines the exact remaining roots until their native registrations are removed. |
| `src/humans-observer.js` v3 | `#turnValue` text only; `#menuModal` class only; semantic new-game/open-map/pageshow/visibility signals | open-map state, menu control injection, optional reveal/render; emits `epohi:humans-ui-settled` | **REFACTORED.** `broadObservers = 0`; no global document-click loop. |
| `src/humans-runtime-invalidation.js` v5 | explicit `epohi:humans-ui-settled`, click, pageshow and visibility signals -> one coalesced RAF | calls visual decorate + context cleanup + player-feedback stabilization | **BOUNDED GLOBAL OWNER TARGET.** No DOM observers; legacy decorators below still have independent click/observer scheduling debt. |
| `src/humans-visuals.js` v2 | no DOM observers, no document click listener, no timeout/RAF polling loop | decorates map tiles/pieces and tracks positions when explicitly invoked | **REFACTORED.** Startup performs one direct decorate; subsequent refreshes come from runtime invalidation. |
| `src/humans-context-review-cleanup.js` v3 | no `#contextPanel` or body observer | rebuilds stack picker/readiness/action layout and writes context DOM | **REFACTORED.** Explicit invalidation and module-local action calls drive sync. |
| `src/humans-player-feedback-stabilization.js` v5+ | bounded journey/victory modal class, `#turnValue`, `ResizeObserver(#mapViewport)` -> RAF; no broad victory/context subtree observers | outcome/context guards and camera reapply | **NARROW/BONDED**, but its extra global player-feedback click invalidation remains debt to consolidate. |
| `src/humans-camera-layout-guard.js` v2 | direct `#screenRoot` child-list; `#gameApp` class; pageshow/visibility -> one RAF | restores persisted camera only while game app hidden | **NATIVE OBSERVER NARROWED**, but its direct screen child observer is temporarily suppressed by v7 bridge while legacy whole-screen decorators are being isolated. |
| `src/humans-strategy-ux.js` v2 | broad `#map`, `#contextPanel`; direct `#screenRoot`, `#menuContent`; turn/menu observers; global click -> timeout -> RAF; `ResizeObserver(#mapViewport)` | readiness, faction/context decoration, diplomacy/POI UI, camera stabilization | **CONFIRMED HIGH-PRIORITY DEBT FROM RUN #32575460633.** Broad roots are quarantined by v7 bridge; native observer registrations and independent click scheduler still need removal in the next package. |
| `src/humans-player-feedback.js` v1 | broad `#contextPanel` and `#map`; `#menuContent`, `#wikiContent`; modal class observers; global click -> timeout refresh | context commands, treasury/diplomacy/world-event/outcome decoration | **CONFIRMED HIGH-PRIORITY DEBT FROM RUN #32575460633.** Broad/content roots are quarantined by v7 bridge; native polling/click scheduling remains to be migrated. |

## Confirmed feedback cycles

1. **Context/visual cycles in refactored owners — removed:** visual/context cleanup modules no longer self-observe broad render roots.
2. **Legacy strategy cycle — contained, not removed:** `humans-strategy-ux` still observes map/context/screen/menu content and separately refreshes after every click. Its broad mutation roots are now suppressed while the native scheduler is queued for removal.
3. **Legacy base-feedback cycle — contained, not removed:** `humans-player-feedback` still observes map/context/content roots and separately refreshes after clicks. Its broad/content mutation roots are now suppressed while explicit invalidation replacement is prepared.
4. **Camera-layout cycle — narrowed natively:** subtree watching/double RAF were removed in v2; the remaining direct screen child observer is temporarily quarantined together with legacy whole-screen churn.
5. **Player-feedback stabilization broad content cycle — removed:** only narrow modal/turn/resize observers remain, though duplicate click invalidation is still consolidation debt.

## Exact signal from run 32575460633

Chromium focused: **45/49 passed, 4 failed**. WebKit focused: **41/49 passed, 8 failed**. Shared runtime failures include physical `open-city` instability. WebKit still recorded **18 observer callbacks vs <=6** in selected-worker idle and failed the 30-cycle city close interaction. Chromium runtime invalidation reached **15 flushes** where `<15` is required. Inspection after the run found the previously unlisted broad registrations in `humans-strategy-ux.js` and `humans-player-feedback.js`, matching the remaining callback/layout churn.

## Explicit invalidation direction

`EpohiRuntimeInvalidation` remains the target single decorator bridge. The v7 performance bridge is containment only: it prevents known legacy DOM-polling roots from waking while their useful action-driven behavior remains available. The next native refactor must remove the observer/click schedulers from `humans-strategy-ux.js` and `humans-player-feedback.js` and route their refresh work through explicit invalidation, then prove the safety suppressions can be reduced.

## Remaining audit before safety-wrapper removal

Do not remove the safety wrapper yet. First validate this exact containment package on Chromium/WebKit. If callback churn drops but `open-city` still detaches, the next bounded package is the native migration of `humans-strategy-ux` / `humans-player-feedback` click and observer schedulers, not a click-timeout increase.
