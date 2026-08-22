# RUNTIME OBSERVER MAP — Humans v1

Phase 1 ownership inventory for the loaded Humans runtime. This file tracks only confirmed browser observers/schedulers; remaining loaded modules are still being audited before the global safety wrapper can be removed.

| Owner | Observed / scheduled surface | Writes / effect | Current disposition |
| --- | --- | --- | --- |
| `src/humans-performance.js` | monkey-patches global `MutationObserver`, wraps callbacks through RAF, wraps `requestAnimationFrame`/`setTimeout` while protected | disconnects/reconnects observers, coalesces records; now suppresses broad body, map, screenRoot and contextPanel child-list observers; narrows modal subtree observers | **TEMPORARY BRIDGE.** Heavy visual/context polling is now quarantined while explicit invalidation owns their useful work. Remove this wrapper only after remaining native owners are refactored and gates stay green. |
| `src/humans-observer.js` v2 | `#turnValue` text only; `#menuModal` class only; coalesced explicit click/pageshow/visibility invalidation | open-map state, menu control injection, optional reveal/render; emits `epohi:humans-ui-settled` | **REFACTORED.** `broadObservers = 0`. |
| `src/humans-runtime-invalidation.js` | explicit `epohi:humans-ui-settled`, click, pageshow and visibility signals -> one coalesced RAF | calls visual decorate + context cleanup sync | **NEW BOUNDED OWNER.** No DOM observers; exposes request/flush/stats. |
| `src/humans-visuals.js` | legacy `#map` child list; legacy `#screenRoot` subtree; document click -> timeout -> RAF | decorates map tiles/pieces and tracks positions | **LEGACY OBSERVERS QUARANTINED.** Both broad registrations are suppressed by performance bridge; explicit invalidation and its existing click hook drive decoration. Native removal from this module remains debt. |
| `src/humans-context-review-cleanup.js` | legacy `#contextPanel` subtree/character data; legacy `document.body` subtree | rebuilds stack picker/readiness/action layout and writes context DOM | **LEGACY OBSERVERS QUARANTINED.** Both registrations are suppressed; explicit invalidation plus module-local action calls drive sync. Native removal remains debt. |
| `src/humans-player-feedback-stabilization.js` | `#victoryContent` subtree; `#contextPanel` subtree/character data; journey/victory modal class; `#turnValue`; `ResizeObserver(#mapViewport)` -> RAF | removes recreated controls, mutates context sentinel/stack acknowledgement, modal/free-play guards, camera reapply | **NEXT HIGH-PRIORITY DEBT.** Context/victory-content subtree observers should be replaced/narrowed; modal/turn/resize observers are bounded. |

## Confirmed feedback cycles

1. **Context cycle — contained this pass:** core/add-on render writes `#contextPanel` -> cleanup observer rewrites picker/readiness/action DOM -> same observer can receive more records. The legacy broad observer is now suppressed and `EpohiRuntimeInvalidation` performs one coalesced sync from semantic signals.
2. **Visual cycle — contained this pass:** core map rebuild -> visual map/screen observers -> decorator RAF writes map/style state -> redundant passes. Both observer registrations are now suppressed and the decorator is driven by action / `epohi:humans-ui-settled` invalidation.
3. **Modal/content cycle:** several add-ons render modal content -> stabilization/content observers rewrite descendants. This remains for the next package.
4. **Observer-control cycle — removed earlier:** `humans-observer` no longer watches screenRoot/map/menuContent and no longer uses broad DOM polling.

## Explicit invalidation direction

`EpohiHumansObserver.requestSync(reason)` is the semantic state invalidation API. Its coalesced sync emits `epohi:humans-ui-settled`. `EpohiRuntimeInvalidation.request(reason)` is the decorator bridge: it coalesces those semantic signals into a single RAF that refreshes visuals and context cleanup without observing broad DOM subtrees.

## Remaining audit before safety-wrapper removal

The performance wrapper is still scaffolding because the legacy modules still instantiate the now-suppressed broad observers. Next: migrate context/content observers in `humans-player-feedback-stabilization.js`, then remove the legacy observer registrations from `humans-visuals.js` and `humans-context-review-cleanup.js` directly when an editing pass can preserve those large modules safely. After that, re-run Chromium/WebKit idle and repeated-action gates with the wrapper disabled in a test variant.
