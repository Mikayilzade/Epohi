# RUNTIME OBSERVER MAP — Humans v1

Phase 1 ownership inventory for the loaded Humans runtime. This file tracks confirmed browser observers/schedulers and explicit invalidation ownership before the global safety wrapper can be removed.

| Owner | Observed / scheduled surface | Writes / effect | Current disposition |
| --- | --- | --- | --- |
| `src/humans-performance.js` | monkey-patches global `MutationObserver`, wraps callbacks through RAF, wraps `requestAnimationFrame`/`setTimeout` while protected | disconnects/reconnects observers and coalesces records | **TEMPORARY BRIDGE.** Keep until focused Chromium/WebKit runtime gates prove native owners remain bounded without relying on suppression. |
| `src/humans-observer.js` v3 | `#turnValue` text only; `#menuModal` class only; semantic new-game/open-map/pageshow/visibility signals | open-map state, menu control injection, optional reveal/render; emits `epohi:humans-ui-settled` | **REFACTORED.** `broadObservers = 0`; no global document-click loop. |
| `src/humans-runtime-invalidation.js` v5 | explicit `epohi:humans-ui-settled`, click, pageshow and visibility signals -> one coalesced RAF | calls visual decorate + context cleanup + player-feedback stabilization | **BOUNDED GLOBAL OWNER.** No DOM observers; exposes request/flush/stats including visual sync counts. |
| `src/humans-visuals.js` v2 | no DOM observers, no document click listener, no timeout/RAF polling loop | decorates map tiles/pieces and tracks positions when explicitly invoked | **REFACTORED THIS PACKAGE.** Startup performs one direct decorate; subsequent refreshes come from runtime invalidation. |
| `src/humans-context-review-cleanup.js` v3 | no `#contextPanel` or body observer | rebuilds stack picker/readiness/action layout and writes context DOM | **REFACTORED.** Explicit invalidation and module-local action calls drive sync. |
| `src/humans-player-feedback-stabilization.js` v5+ | bounded journey/victory modal class, `#turnValue`, `ResizeObserver(#mapViewport)` -> RAF; no broad victory/context subtree observers | removes recreated controls, mutates context sentinel/stack acknowledgement, modal/free-play guards, camera reapply | **NARROW/BONDED.** Broad modal/content polling removed; bounded observers remain intentional. |

## Confirmed feedback cycles

1. **Context cycle — removed:** core/add-on render writes `#contextPanel`; cleanup no longer watches and rewrites that subtree reactively. One bounded runtime invalidation flush owns the synchronization pass.
2. **Visual cycle — removed this package:** core map/screen rebuild previously triggered two visual `MutationObserver` instances plus a document-click timeout/RAF path. `humans-visuals.js` now has none of those registrations; visual decoration is reached through the central runtime invalidation scheduler.
3. **Modal/content cycle — removed from broad polling:** player-feedback stabilization no longer watches `#victoryContent` or `#contextPanel` subtrees; remaining modal/turn/resize observers are narrow.
4. **Observer-control cycle — removed earlier:** `humans-observer` no longer watches screenRoot/map/menuContent and no longer uses broad DOM polling or a generic click sync.

## Explicit invalidation direction

`EpohiHumansObserver.requestSync(reason)` is the semantic state invalidation API. Its coalesced sync emits `epohi:humans-ui-settled`. `EpohiRuntimeInvalidation.request(reason)` is the single decorator bridge: it coalesces semantic/user-action signals into one protected RAF that refreshes visuals, context cleanup and player feedback. `EpohiHumansVisuals.decorate()` is now a pure explicit render/decorate entry point rather than a self-scheduling observer owner.

## Remaining audit before safety-wrapper removal

The performance wrapper is still scaffolding even though the known broad visual/context/player-feedback observers have been removed from their native modules. Do not remove it speculatively. First run the focused Chromium/WebKit runtime suite and repeated city/idle regressions on this checkpoint. If callback and city stability gates are green, the next bounded package should exercise a test variant without suppression, identify any remaining native broad owner, and only then retire or narrow the global wrapper.
