# RUNTIME OBSERVER MAP — Humans v1

Phase 1 ownership inventory for the loaded Humans runtime. This file tracks confirmed browser observers/schedulers and explicit invalidation ownership before the global safety wrapper can be removed.

| Owner | Observed / scheduled surface | Writes / effect | Current disposition |
| --- | --- | --- | --- |
| `src/humans-performance.js` | monkey-patches global `MutationObserver`, wraps callbacks through RAF, wraps `requestAnimationFrame`/`setTimeout` while protected | disconnects/reconnects observers and coalesces records | **TEMPORARY BRIDGE.** Keep until focused Chromium/WebKit runtime gates prove native owners remain bounded without relying on suppression. |
| `src/humans-observer.js` v3 | `#turnValue` text only; `#menuModal` class only; semantic new-game/open-map/pageshow/visibility signals | open-map state, menu control injection, optional reveal/render; emits `epohi:humans-ui-settled` | **REFACTORED.** `broadObservers = 0`; no global document-click loop. |
| `src/humans-runtime-invalidation.js` v5 | explicit `epohi:humans-ui-settled`, click, pageshow and visibility signals -> one coalesced RAF | calls visual decorate + context cleanup + player-feedback stabilization | **BOUNDED GLOBAL OWNER.** No DOM observers; exposes request/flush/stats including visual sync counts. |
| `src/humans-visuals.js` v2 | no DOM observers, no document click listener, no timeout/RAF polling loop | decorates map tiles/pieces and tracks positions when explicitly invoked | **REFACTORED.** Startup performs one direct decorate; subsequent refreshes come from runtime invalidation. |
| `src/humans-context-review-cleanup.js` v3 | no `#contextPanel` or body observer | rebuilds stack picker/readiness/action layout and writes context DOM | **REFACTORED.** Explicit invalidation and module-local action calls drive sync. |
| `src/humans-player-feedback-stabilization.js` v5+ | bounded journey/victory modal class, `#turnValue`, `ResizeObserver(#mapViewport)` -> RAF; no broad victory/context subtree observers | removes recreated controls, mutates context sentinel/stack acknowledgement, modal/free-play guards, camera reapply | **NARROW/BONDED.** Broad modal/content polling removed; bounded observers remain intentional. |
| `src/humans-camera-layout-guard.js` v2 | direct `#screenRoot` child-list only; `#gameApp` class only; pageshow/visibility -> one coalesced RAF | restores persisted camera only while the game app is hidden | **NARROWED THIS PACKAGE.** The old whole-`#screenRoot` subtree observer and double-RAF scheduling were removed; descendant game/context/map churn no longer wakes this guard. |

## Confirmed feedback cycles

1. **Context cycle — removed:** core/add-on render writes `#contextPanel`; cleanup no longer watches and rewrites that subtree reactively. One bounded runtime invalidation flush owns the synchronization pass.
2. **Visual cycle — removed:** core map/screen rebuild previously triggered two visual `MutationObserver` instances plus a document-click timeout/RAF path. `humans-visuals.js` now has none of those registrations; visual decoration is reached through the central runtime invalidation scheduler.
3. **Modal/content cycle — removed from broad polling:** player-feedback stabilization no longer watches `#victoryContent` or `#contextPanel` subtrees; remaining modal/turn/resize observers are narrow.
4. **Observer-control cycle — removed earlier:** `humans-observer` no longer watches screenRoot/map/menuContent and no longer uses broad DOM polling or a generic click sync.
5. **Camera-layout cycle — narrowed this package:** the camera guard previously watched the full `#screenRoot` subtree and scheduled two RAFs for every descendant mutation even while gameplay was visible. It now observes only direct screen replacement plus `#gameApp` visibility and coalesces restoration into one RAF.

## Explicit invalidation direction

`EpohiHumansObserver.requestSync(reason)` is the semantic state invalidation API. Its coalesced sync emits `epohi:humans-ui-settled`. `EpohiRuntimeInvalidation.request(reason)` is the single decorator bridge: it coalesces semantic/user-action signals into one protected RAF that refreshes visuals, context cleanup and player feedback. `EpohiHumansVisuals.decorate()` is now a pure explicit render/decorate entry point rather than a self-scheduling observer owner.

## Remaining audit before safety-wrapper removal

The performance wrapper is still scaffolding. The exact run for `fdada02e81edd14d4ab95da40a8c65c92fcd963c` exposed a previously unlisted native broad owner in `humans-camera-layout-guard.js`; this package narrows it and adds a regression against subtree restoration. Re-run the focused Chromium/WebKit runtime gate before attempting any safety-wrapper removal. If city-action replacement remains after callback churn drops, diagnose the first renderer that recreates `#contextActions` rather than weakening click timeouts.
