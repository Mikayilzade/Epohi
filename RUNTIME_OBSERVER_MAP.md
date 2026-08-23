# RUNTIME OBSERVER MAP — Humans v1

Phase 1 ownership inventory for the loaded Humans runtime. This file tracks confirmed browser observers/schedulers and explicit invalidation ownership before the global safety wrapper can be removed.

| Owner | Observed / scheduled surface | Writes / effect | Current disposition |
| --- | --- | --- | --- |
| `src/humans-performance.js` v7 | monkey-patches global `MutationObserver`, wraps callbacks through RAF, wraps `requestAnimationFrame`/`setTimeout` while protected | disconnects/reconnects observers, coalesces records, and temporarily suppresses legacy broad render roots including body/map/screen/context/menu/wiki/victory content | **TEMPORARY BRIDGE.** Keep until the legacy modules below lose their native broad registrations and the focused gates stay green without suppression. |
| `src/humans-observer.js` v3 | `#turnValue` text only; `#menuModal` class only; semantic new-game/open-map/pageshow/visibility signals | open-map state, menu control injection, optional reveal/render; emits `epohi:humans-ui-settled` | **REFACTORED.** `broadObservers = 0`; no global document-click loop. |
| `src/humans-runtime-invalidation.js` v6 | explicit `epohi:humans-ui-settled`, click, pageshow and visibility signals -> one coalesced protected RAF | calls strategy refresh + base player-feedback refresh + visual decorate + context cleanup + stabilization | **CENTRAL BRIDGE EXTENDED THIS PACKAGE.** The useful work of the two quarantined legacy decorators is now reachable from one bounded invalidation owner instead of depending on their broad observer roots. |
| `src/humans-visuals.js` v2 | no DOM observers, no document click listener, no timeout/RAF polling loop | decorates map tiles/pieces and tracks positions when explicitly invoked | **REFACTORED.** Startup performs one direct decorate; subsequent refreshes come from runtime invalidation. |
| `src/humans-context-review-cleanup.js` v3 | no `#contextPanel` or body observer | rebuilds stack picker/readiness/action layout and writes context DOM | **REFACTORED.** Explicit invalidation and module-local action calls drive sync. |
| `src/humans-player-feedback-stabilization.js` v5+ | bounded journey/victory modal class, `#turnValue`, `ResizeObserver(#mapViewport)` -> RAF; no broad victory/context subtree observers | outcome/context guards and camera reapply | **NARROW/BONDED**, but its extra global player-feedback click invalidation remains debt to consolidate. |
| `src/humans-camera-layout-guard.js` v2 | direct `#screenRoot` child-list; `#gameApp` class; pageshow/visibility -> one RAF | restores persisted camera only while game app hidden | **NATIVE OBSERVER NARROWED**, but its direct screen child observer is temporarily suppressed by v7 bridge while legacy whole-screen decorators are being isolated. |
| `src/humans-strategy-ux.js` v2 | broad `#map`, `#contextPanel`; direct `#screenRoot`, `#menuContent`; turn/menu observers; global click -> timeout -> RAF; `ResizeObserver(#mapViewport)` | readiness, faction/context decoration, diplomacy/POI UI, camera stabilization | **LEGACY REGISTRATIONS STILL PRESENT, USEFUL WORK NOW BRIDGED.** v6 central invalidation calls `refresh()` explicitly; next native package can remove the observers/click scheduler without losing behavior. |
| `src/humans-player-feedback.js` v1 | broad `#contextPanel` and `#map`; `#menuContent`, `#wikiContent`; modal class observers; global click -> timeout refresh | context commands, treasury/diplomacy/world-event/outcome decoration | **LEGACY REGISTRATIONS STILL PRESENT, USEFUL WORK NOW BRIDGED.** v6 central invalidation calls `refresh()` explicitly; next native package can remove the observers/click scheduler without losing behavior. |

## Confirmed feedback cycles

1. **Context/visual cycles in refactored owners — removed:** visual/context cleanup modules no longer self-observe broad render roots.
2. **Legacy strategy cycle — quarantined with replacement path:** the broad roots are suppressed by the temporary bridge, while `EpohiRuntimeInvalidation` v6 now invokes the useful strategy refresh explicitly. The anonymous click/observer registrations remain source debt, not functional ownership.
3. **Legacy base-feedback cycle — quarantined with replacement path:** broad/content roots are suppressed, while `EpohiRuntimeInvalidation` v6 invokes the useful player-feedback refresh explicitly. The anonymous click/observer registrations remain source debt.
4. **Camera-layout cycle — narrowed natively:** subtree watching/double RAF were removed in v2; the remaining direct screen child observer is temporarily quarantined together with legacy whole-screen churn.
5. **Player-feedback stabilization broad content cycle — removed:** only narrow modal/turn/resize observers remain, though duplicate click invalidation is still consolidation debt.

## Exact signal from run 32577245212 (`faecc620…`)

Static integrity passed. Focused Chromium finished **45/50**, WebKit **42/50**; full regression was skipped. Chromium failures included capture-choice not opening, strategy faction markers missing, physical city open/close instability, and runtime invalidation. WebKit additionally retained selected-worker callback churn, treasury/stack scenarios and the known unsupported mobile-WebKit `mouse.wheel` path. The marker regression is direct evidence that containment removed a broad observer wake-up that still carried useful strategy refresh work; runtime/city failures show the useful work must move to explicit invalidation rather than restoring polling.

## Explicit invalidation direction

`EpohiRuntimeInvalidation` is the target single decorator bridge. Version 6 explicitly synchronizes `EpohiStrategyUX.refresh()` and `EpohiPlayerFeedback.refresh()` in the same protected RAF as visuals/context/stabilization. `tests/explicit-legacy-refresh-bridge.spec.js` requires those syncs to occur and remain coalesced under 30 requests. The performance wrapper remains containment only.

## Remaining audit before safety-wrapper removal

Validate the v6 explicit bridge on Chromium/WebKit first. If useful behavior returns and callback/city stability improves, the next native package is to delete the now-redundant MutationObserver/global-click schedulers from `humans-strategy-ux.js` and `humans-player-feedback.js`, then reduce the matching safety suppressions. Do not weaken click or callback thresholds.
