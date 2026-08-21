# RUNTIME OBSERVER MAP — Humans v1

Phase 1 ownership inventory for the loaded Humans runtime. This file tracks only confirmed browser observers/schedulers; remaining loaded modules are still being audited before the global safety wrapper can be removed.

| Owner | Observed / scheduled surface | Writes / effect | Current disposition |
| --- | --- | --- | --- |
| `src/humans-performance.js` | monkey-patches global `MutationObserver`, wraps callbacks through RAF, wraps `requestAnimationFrame`/`setTimeout` while protected | disconnects/reconnects observers, coalesces records, suppresses body/map subtree observers, narrows modal subtree observers | **TEMPORARY DEBT.** Keep until native owners are bounded; remove before RC if regression gates prove unnecessary. |
| `src/humans-observer.js` v2 | `#turnValue` text only; `#menuModal` class only; coalesced explicit click/pageshow/visibility invalidation | open-map state, menu control injection, optional reveal/render | **REFACTORED THIS PASS.** Removed `screenRoot` subtree, map child-list and `menuContent` observers. Exposes `requestSync()` + runtime stats. `broadObservers = 0`. |
| `src/humans-visuals.js` | `#map` child list; `#screenRoot` child-list subtree; document click -> timeout -> RAF | decorates map tiles/pieces and tracks positions | **NEXT REFACTOR TARGET.** Screen subtree observer is polling-through-DOM; convert to explicit/bounded invalidation signal. |
| `src/humans-context-review-cleanup.js` | `#contextPanel` child-list subtree/character data; `document.body` child-list subtree | rebuilds stack picker/readiness/action layout and writes context DOM | **CRITICAL DEBT.** Body observer is currently suppressed by `humans-performance`; context observer can observe its own decorators. Replace with explicit context/readiness invalidation. |
| `src/humans-player-feedback-stabilization.js` | `#victoryContent` subtree; `#contextPanel` subtree/character data; journey/victory modal class; `#turnValue`; `ResizeObserver(#mapViewport)` -> RAF | removes recreated controls, mutates context sentinel/stack acknowledgement, modal/free-play guards, camera reapply | **MIXED.** Modal/turn/resize observers are bounded; context/victory-content subtree observers should be replaced/narrowed. |

## Confirmed feedback cycles

1. **Context cycle:** core/add-on render writes `#contextPanel` -> `humans-context-review-cleanup` observes subtree -> rewrites picker/readiness/context action DOM -> same observer can receive more records. The global safety wrapper currently contains this rather than eliminating it.
2. **Visual cycle:** core map rebuild -> `humans-visuals` map observer -> decorator RAF writes map children/styles; the map observer is not whole-subtree, but combined with the `screenRoot` subtree observer and click scheduling it creates redundant decorator passes.
3. **Modal/content cycle:** several add-ons render modal content -> stabilization/content observers rewrite descendants. `humans-performance` narrows known modal subtree observations to class-only, but content-specific observers remain separate debt.
4. **Observer-control cycle (removed here):** `humans-observer` previously watched `screenRoot`, map, turn and menu content while its `sync()` could call core render. That broad feedback path is removed in v2.

## Explicit invalidation direction

`EpohiHumansObserver.requestSync(reason)` is now the first bounded invalidation API for this cleanup. Its `sync()` is coalesced and emits `epohi:humans-ui-settled` after work completes. Follow-up packages should migrate visual/context decorators to explicit render/action hooks or this bounded signal instead of adding new broad observers.

## Remaining audit before safety-wrapper removal

Still audit every loaded Humans module for `MutationObserver`, `ResizeObserver`, recurring `requestAnimationFrame`, `setInterval`, and polling-like `setTimeout` loops. Highest-priority known targets are `humans-visuals.js`, `humans-context-review-cleanup.js`, and context/content observers in `humans-player-feedback-stabilization.js`.
