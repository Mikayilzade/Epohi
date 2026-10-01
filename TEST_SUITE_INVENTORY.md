# Playwright test-suite inventory

## Scope, method, and reconciliation

At commit `75c6101282db6858f5708535fe80b4f304893ce4`, `npx playwright test --list --project=chromium-mobile` discovers **187 functional test cases in 39 files**. The unfiltered two-project listing reports **374 project executions** (187 × Chromium mobile and WebKit mobile), not 374 distinct functional cases. `tests/smoke.spec.js` is a comment-only placeholder and discovers no case.

The static source count is 185 `test(...)` declarations. Two parameterized declarations expand to four cases: three rival-count variants in `browser.spec.js` and two seeds in `autonomous-soak.spec.js`; therefore 185 − 2 + 3 + 2 = 187. There are no discovered skips in the list. This inventory counts each functional case once under one primary domain; secondary tags do not increase totals.

All cost labels below are **structural estimates**, because this docs-only task used discovery rather than timed browser execution. `cheap` means narrow setup/assertion, `medium` means a state fixture or multi-step UI flow, `expensive` means broad/repeated/large-state behavior, and `soak` means repeated autonomous turns. Browser sensitivity is evidence-based: geometry/viewport/touch/pointer/observer-timing cases are WebKit-sensitive; ordinary DOM/event lifecycle cases are cross-browser; state-heavy in-page evaluations without browser-specific geometry are browser-neutral. “Browser-neutral” does not mean unit-test-only: these are still Playwright cases.

Gate labels mean: **smoke/core** = candidate for the tiny gate; **focused feature** = direct feature validation; **neighboring regression** = run when an adjacent shared contract changes; **full-only coverage** = too broad/costly for routine focus unless directly implicated; **soak/stability** = repeated-cycle gate.

### Reconciled totals

| Primary domain | Cases |
|---|---:|
| ci / infrastructure | 2 |
| smoke / core | 13 |
| camera / layout / mobile | 21 |
| movement / pathfinding | 16 |
| turn / state / save-load | 19 |
| combat / world | 35 |
| economy / population / worker | 19 |
| diplomacy / strategy / UX | 42 |
| observers / performance / runtime | 18 |
| soak / stability | 2 |
| **Total** | **187** |

### File-level index

| File | Cases | Primary domain | Default production relationship |
|---|---:|---|---|
| `tests/autonomous-soak.spec.js` | 2 | soak / stability | src/**; whole-game invariants; periodic save/reload |
| `tests/barbarian-camps.spec.js` | 8 | combat / world | src/humans-living-civilizations.js, src/data.js, src/save-utils.js; camp director |
| `tests/barbarian-review-fixes.spec.js` | 7 | combat / world | src/humans-living-civilizations.js, src/humans-pathing-core.js; camps/fog/AI |
| `tests/browser.spec.js` | 8 | smoke / core | index.html, src/app.js, src/storage.js, styles/**; startup/basic flow |
| `tests/camera-2.spec.js` | 5 | camera / layout / mobile | src/camera.js, src/camera-storage.js, styles/**; resize/pinch/fit |
| `tests/camera-layout-guard-runtime.spec.js` | 1 | observers / performance / runtime | src/humans-camera-layout-guard.js; ResizeObserver ownership |
| `tests/ci-push-gate.spec.js` | 2 | ci / infrastructure | .github/workflows/playwright.yml, playwright.config.js; classifier contract |
| `tests/coherence-capture-learning.spec.js` | 14 | economy / population / worker | src/humans-coherence-finalize.js, humans-capture-state.js, humans-worker-learning.js, economy/data; coherence rules |
| `tests/combat-world-stability.spec.js` | 15 | combat / world | src/humans-combat-world-stability.js, territory.js, pathing/core, diplomacy; combat/world rules |
| `tests/context-review-cleanup.spec.js` | 4 | diplomacy / strategy / UX | src/humans-context-review-cleanup.js, humans-strategy-ux.js, styles/**; context/activity UI |
| `tests/diplomacy-activity-events.spec.js` | 6 | diplomacy / strategy / UX | src/humans-diplomacy-event-flow.js, humans-chronicle-ui.js, humans-capture-state.js; overlays/events |
| `tests/explicit-legacy-refresh-bridge.spec.js` | 1 | observers / performance / runtime | src/humans-runtime-invalidation.js, humans-strategy-ux.js, humans-player-feedback.js |
| `tests/humans-art-observer.spec.js` | 5 | camera / layout / mobile | src/humans-visuals.js, humans-observer.js, camera.js, styles/**; map visuals/layout |
| `tests/humans-autonomy.spec.js` | 5 | movement / pathfinding | src/humans-autonomy.js, humans-autonomy-fix.js, humans-pathing-core.js; autonomous orders |
| `tests/humans-journey.spec.js` | 6 | turn / state / save-load | src/humans-journey-*.js, humans-content.js, humans-visuals.js; saga/scenario state |
| `tests/humans-outcomes.spec.js` | 8 | turn / state / save-load | src/humans-outcomes.js, humans-capture-state.js, storage/save-utils; victory/defeat |
| `tests/humans-pathing-performance.spec.js` | 8 | movement / pathfinding | src/humans-pathing-core.js, humans-pathing-ui.js, camera.js, styles/**; routes/targets |
| `tests/humans-strategy-ux.spec.js` | 5 | diplomacy / strategy / UX | src/humans-strategy-ux.js, humans-diplomacy-*.js, camera.js; strategic interactions |
| `tests/iphone-bugfixes.spec.js` | 4 | camera / layout / mobile | styles/**, src/humans-pathing-*.js, humans-living-civilizations.js; iPhone regressions |
| `tests/legacy-observer-containment.spec.js` | 3 | observers / performance / runtime | src/humans-observer.js, humans-coherence-finalize.js, humans-runtime-invalidation.js |
| `tests/living-civilizations.spec.js` | 11 | diplomacy / strategy / UX | src/humans-living-civilizations.js, humans-diplomacy-*.js, autonomy; diplomacy AI |
| `tests/living-world.spec.js` | 5 | combat / world | src/humans-living-civilizations.js, storage/save-utils, economy.js; AI/barbarians/cities |
| `tests/map-inspection.spec.js` | 7 | diplomacy / strategy / UX | src/humans-strategy-ux.js, selectors.js, humans-visuals.js; inspection/selection |
| `tests/mobile-context.spec.js` | 7 | camera / layout / mobile | src/humans-strategy-ux.js, humans-player-feedback.js, styles/**; mobile context/stack UI |
| `tests/mobile-performance-stability.spec.js` | 4 | observers / performance / runtime | src/humans-observer.js, humans-runtime-invalidation.js, humans-performance.js, layout guard; mutation stability |
| `tests/new-game-settled-lifecycle.spec.js` | 1 | turn / state / save-load | src/app.js, humans-runtime-invalidation.js; new-game settled lifecycle |
| `tests/observer-delivery-latency.spec.js` | 2 | observers / performance / runtime | src/humans-observer.js; mutation delivery/yielding |
| `tests/observer-startup-attribution.spec.js` | 2 | observers / performance / runtime | src/humans-observer.js, humans-performance.js; startup/30-cycle attribution |
| `tests/pathing-explicit-invalidation.spec.js` | 1 | movement / pathfinding | src/humans-pathing-ui.js, humans-runtime-invalidation.js; pointer retargeting |
| `tests/player-feedback-treasury.spec.js` | 9 | diplomacy / strategy / UX | src/humans-player-feedback*.js, economy.js, diplomacy/event flow; treasury/toasts |
| `tests/population-workforce.spec.js` | 3 | economy / population / worker | src/humans-population-workforce.js, economy.js; population/jobs/yields |
| `tests/prototype-baseline.spec.js` | 5 | smoke / core | src/app.js, data.js, progression.js, outcomes.js; prototype contract |
| `tests/resource-worker.spec.js` | 2 | economy / population / worker | src/economy.js, humans-population-workforce.js, humans-strategy-ux.js; worker/resources |
| `tests/runtime-invalidation-cadence.spec.js` | 2 | observers / performance / runtime | src/humans-runtime-invalidation.js, humans-performance.js; flush/turn phase timing |
| `tests/runtime-invalidation-repeat-cadence.spec.js` | 1 | observers / performance / runtime | src/humans-runtime-invalidation.js, humans-performance.js; repeated storms |
| `tests/runtime-invalidation.spec.js` | 1 | observers / performance / runtime | src/humans-runtime-invalidation.js, humans-visuals.js; bounded flushes |
| `tests/stack-reentry-selection.spec.js` | 2 | movement / pathfinding | src/humans-pathing-ui.js, humans-strategy-ux.js; stack selection/route target |
| `tests/turn-label-idempotence.spec.js` | 1 | observers / performance / runtime | src/humans-turn-label-stability.js, humans-runtime-invalidation.js; DOM identity |
| `tests/turn-unlock.spec.js` | 4 | turn / state / save-load | src/app.js, storage.js, save-utils.js; end-turn/autosave locking |

## Case-by-case inventory

Format: `file:line` and discovered title; **secondary** tags; **cost** (estimated); **browser** sensitivity; **gate role**. Production relationships are stated once in each group and refined by each title.

### ci / infrastructure — 2 cases

#### `tests/ci-push-gate.spec.js` — 2

Production relationship: .github/workflows/playwright.yml, playwright.config.js; classifier contract.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `ci-push-gate.spec.js:19` — permanent Playwright workflow uses PR risk classification and avoids duplicate feature-branch push gates | risk policy | cheap | browser-neutral | focused feature |
| `ci-push-gate.spec.js:59` — permanent workflow maps risk tiers to static, focused, full and soak gates | risk policy | cheap | browser-neutral | focused feature |

### smoke / core — 13 cases

#### `tests/browser.spec.js` — 8

Production relationship: index.html, src/app.js, src/storage.js, styles/**; startup/basic flow.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `browser.spec.js:10` — Epohi browser smoke › main menu loads without unhandled console errors | turn/state, save-load, layout | cheap | cross-browser | smoke/core |
| `browser.spec.js:19` — Epohi browser smoke › external game script loads and initializes the application | turn/state, save-load, layout | cheap | cross-browser | smoke/core |
| `browser.spec.js:56` — Epohi browser smoke › external stylesheet is loaded and main layout keeps computed styles | turn/state, save-load, layout | cheap | WebKit-sensitive | smoke/core |
| `browser.spec.js:93` — Epohi browser smoke › creates a new game with 0 AI and starts the map | turn/state, save-load, layout | cheap | cross-browser | smoke/core |
| `browser.spec.js:93` — Epohi browser smoke › creates a new game with 1 AI and starts the map | turn/state, save-load, layout | cheap | cross-browser | smoke/core |
| `browser.spec.js:93` — Epohi browser smoke › creates a new game with 2 AI and starts the map | turn/state, save-load, layout | cheap | cross-browser | smoke/core |
| `browser.spec.js:103` — Epohi browser smoke › completes one full turn and opens in-game menu, chronicle, and save manager | turn/state, save-load, layout | medium | cross-browser | smoke/core |
| `browser.spec.js:125` — Epohi browser smoke › saves and then loads the current campaign | turn/state, save-load, layout, save-load | medium | cross-browser | smoke/core |

#### `tests/prototype-baseline.spec.js` — 5

Production relationship: src/app.js, data.js, progression.js, outcomes.js; prototype contract.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `prototype-baseline.spec.js:20` — Эпохи: Люди — базовый контракт прототипа › новая обычная партия создаёт связное стартовое состояние | turn/state, economy, outcomes | medium | browser-neutral | neighboring regression |
| `prototype-baseline.spec.js:59` — Эпохи: Люди — базовый контракт прототипа › настройки сценария реально меняют создаваемый мир | turn/state, economy, outcomes | medium | browser-neutral | neighboring regression |
| `prototype-baseline.spec.js:82` — Эпохи: Люди — базовый контракт прототипа › контент не содержит сломанных технологических ссылок | turn/state, economy, outcomes | medium | browser-neutral | neighboring regression |
| `prototype-baseline.spec.js:128` — Эпохи: Люди — базовый контракт прототипа › новые технологии, здания и юниты доступны через обычный интерфейс | turn/state, economy, outcomes | medium | browser-neutral | neighboring regression |
| `prototype-baseline.spec.js:162` — Эпохи: Люди — базовый контракт прототипа › государственная победа достижима после создания устойчивого государства | turn/state, economy, outcomes | medium | browser-neutral | neighboring regression |

### camera / layout / mobile — 21 cases

#### `tests/camera-2.spec.js` — 5

Production relationship: src/camera.js, src/camera-storage.js, styles/**; resize/pinch/fit.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `camera-2.spec.js:180` — Camera 2.0 › fit scale shows whole map and dynamic bounds vary by map size | smoke/core, input, storage | medium | WebKit-sensitive | focused feature |
| `camera-2.spec.js:195` — Camera 2.0 › large map can fit short portrait and landscape viewports below legacy minimum | smoke/core, input, storage | medium | WebKit-sensitive | focused feature |
| `camera-2.spec.js:200` — Camera 2.0 › deep max zoom exceeds old 200% limit and plus/minus respect bounds | smoke/core, input, storage | medium | WebKit-sensitive | focused feature |
| `camera-2.spec.js:217` — Camera 2.0 › show entire map centers map and center control targets selected unit or capital | smoke/core, input, storage | medium | WebKit-sensitive | focused feature |
| `camera-2.spec.js:256` — Camera 2.0 › stored scale normalizes safely across reload, pinch stays bounded, resize reclamps, and tile click still works | smoke/core, input, storage | medium | WebKit-sensitive | focused feature |

#### `tests/humans-art-observer.spec.js` — 5

Production relationship: src/humans-visuals.js, humans-observer.js, camera.js, styles/**; map visuals/layout.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `humans-art-observer.spec.js:30` — Визуальная демка и режим наблюдения › авторазведчик использует оба очка движения за один ход | movement/pathfinding, strategy UX | medium | WebKit-sensitive | focused feature |
| `humans-art-observer.spec.js:77` — Визуальная демка и режим наблюдения › показать всю карту меняет обзор камеры, но не отключает туман войны | movement/pathfinding, strategy UX | medium | WebKit-sensitive | focused feature |
| `humans-art-observer.spec.js:115` — Визуальная демка и режим наблюдения › карта использует рисованные фигурки и различимые находки вместо эмодзи | movement/pathfinding, strategy UX | medium | WebKit-sensitive | focused feature |
| `humans-art-observer.spec.js:169` — Визуальная демка и режим наблюдения › открытая карта отменяется без изменений и сохраняется в текущей партии после подтверждения | movement/pathfinding, strategy UX | medium | WebKit-sensitive | focused feature |
| `humans-art-observer.spec.js:196` — Визуальная демка и режим наблюдения › визуальная панель и карта помещаются на экран iPhone | movement/pathfinding, strategy UX | medium | WebKit-sensitive | focused feature |

#### `tests/iphone-bugfixes.spec.js` — 4

Production relationship: styles/**, src/humans-pathing-*.js, humans-living-civilizations.js; iPhone regressions.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `iphone-bugfixes.spec.js:10` — v1.4.2-alpha manual iPhone bugfixes › resources do not overlap the map zone on small mobile viewports | combat/world, movement/pathfinding | medium | WebKit-sensitive | focused feature |
| `iphone-bugfixes.spec.js:28` — v1.4.2-alpha manual iPhone bugfixes › player can found a city through the real context UI button | combat/world, movement/pathfinding | medium | WebKit-sensitive | focused feature |
| `iphone-bugfixes.spec.js:66` — v1.4.2-alpha manual iPhone bugfixes › small 20x20 maps with active barbarians always receive a valid camp | combat/world, movement/pathfinding | medium | WebKit-sensitive | focused feature |
| `iphone-bugfixes.spec.js:88` — v1.4.2-alpha manual iPhone bugfixes › AI scout resets unreachable exploration target and keeps moving on land | combat/world, movement/pathfinding | medium | WebKit-sensitive | focused feature |

#### `tests/mobile-context.spec.js` — 7

Production relationship: src/humans-strategy-ux.js, humans-player-feedback.js, styles/**; mobile context/stack UI.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `mobile-context.spec.js:12` — v1.4.5 mobile context card and AI notices › camp description is complete and internally scrollable without two-line clamp | strategy UX, movement, events | medium | WebKit-sensitive | focused feature |
| `mobile-context.spec.js:38` — v1.4.5 mobile context card and AI notices › unit description exposes the final AI relation text above action buttons | strategy UX, movement, events | medium | WebKit-sensitive | focused feature |
| `mobile-context.spec.js:50` — v1.4.5 mobile context card and AI notices › inspect tabs and actions use separate containers and empty containers collapse | strategy UX, movement, events | medium | WebKit-sensitive | focused feature |
| `mobile-context.spec.js:89` — v1.4.5 mobile context card and AI notices › two own units never create duplicate select buttons and navigate the stack without spending movement | strategy UX, movement, events | medium | WebKit-sensitive | focused feature |
| `mobile-context.spec.js:173` — v1.4.5 mobile context card and AI notices › AI unit entering vision creates one unit-spotted notice and visible movement does not repeat | strategy UX, movement, events | medium | WebKit-sensitive | focused feature |
| `mobile-context.spec.js:184` — v1.4.5 mobile context card and AI notices › hidden AI movement outside current vision does not enter player chronicle | strategy UX, movement, events | medium | WebKit-sensitive | focused feature |
| `mobile-context.spec.js:192` — v1.4.5 mobile context card and AI notices › mobile 390x844 layout keeps context, toolbar, and horizontal scrollers usable | strategy UX, movement, events | medium | WebKit-sensitive | focused feature |

### movement / pathfinding — 16 cases

#### `tests/humans-autonomy.spec.js` — 5

Production relationship: src/humans-autonomy.js, humans-autonomy-fix.js, humans-pathing-core.js; autonomous orders.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `humans-autonomy.spec.js:20` — Автономные приказы людей › модуль загружается и создаёт журнал отчётов | economy/worker, combat/world, turn/state | medium | browser-neutral | focused feature |
| `humans-autonomy.spec.js:46` — Автономные приказы людей › разведчик самостоятельно идёт к границе известного мира и открывает клетки | economy/worker, combat/world, turn/state | medium | browser-neutral | focused feature |
| `humans-autonomy.spec.js:93` — Автономные приказы людей › охранный приказ уничтожает известную угрозу рядом с воином | economy/worker, combat/world, turn/state | medium | browser-neutral | focused feature |
| `humans-autonomy.spec.js:142` — Автономные приказы людей › рабочий по приказу развивает город рабочим временем без расхода производства | economy/worker, combat/world, turn/state | medium | browser-neutral | focused feature |
| `humans-autonomy.spec.js:233` — Автономные приказы людей › приказ можно отменить и он не выполняется после отмены | economy/worker, combat/world, turn/state | medium | browser-neutral | focused feature |

#### `tests/humans-pathing-performance.spec.js` — 8

Production relationship: src/humans-pathing-core.js, humans-pathing-ui.js, camera.js, styles/**; routes/targets.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `humans-pathing-performance.spec.js:54` — Маршруты, desktop-карта и производительность › маршрут проходит через своих и союзников без лимита стека, но не через нейтрала или скрытую воду | camera/layout, combat/world, economy/worker | expensive | cross-browser | neighboring regression |
| `humans-pathing-performance.spec.js:90` — Маршруты, desktop-карта и производительность › desktop-карта крупная, а постоянные водные анимации отключены | camera/layout, combat/world, economy/worker | expensive | cross-browser | neighboring regression |
| `humans-pathing-performance.spec.js:125` — Маршруты, desktop-карта и производительность › кнопка Идти назначает маршрут, показывает шаги и переносит приказ между ходами | camera/layout, combat/world, economy/worker | expensive | cross-browser | neighboring regression |
| `humans-pathing-performance.spec.js:204` — Маршруты, desktop-карта и производительность › движущаяся цель пересчитывается без ошибки, исчезнувшая завершает приказ | camera/layout, combat/world, economy/worker | expensive | cross-browser | neighboring regression |
| `humans-pathing-performance.spec.js:254` — Маршруты, desktop-карта и производительность › маршрут к находке открывает выбор и применяет результат | camera/layout, combat/world, economy/worker | expensive | cross-browser | neighboring regression |
| `humans-pathing-performance.spec.js:294` — Маршруты, desktop-карта и производительность › атака лагеря центрирует камеру и завершает приказ | camera/layout, combat/world, economy/worker | expensive | WebKit-sensitive | neighboring regression |
| `humans-pathing-performance.spec.js:340` — Маршруты, desktop-карта и производительность › рабочий выбирает приоритет четырьмя кнопками без текстового prompt | camera/layout, combat/world, economy/worker | expensive | cross-browser | neighboring regression |
| `humans-pathing-performance.spec.js:375` — Маршруты, desktop-карта и производительность › мобильная компоновка остаётся в пределах iPhone-экрана | camera/layout, combat/world, economy/worker | expensive | WebKit-sensitive | neighboring regression |

#### `tests/pathing-explicit-invalidation.spec.js` — 1

Production relationship: src/humans-pathing-ui.js, humans-runtime-invalidation.js; pointer retargeting.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `pathing-explicit-invalidation.spec.js:10` — Pathing explicit invalidation bridge › unit tile tap restores route controls even when pointerup is retargeted to the map viewport | observers/runtime, input, strategy UX | medium | WebKit-sensitive | focused feature |

#### `tests/stack-reentry-selection.spec.js` — 2

Production relationship: src/humans-pathing-ui.js, humans-strategy-ux.js; stack selection/route target.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `stack-reentry-selection.spec.js:10` — tapping a remaining own-unit stack rebases selection after the previously selected unit moved away | strategy UX, input | medium | WebKit-sensitive | focused feature |
| `stack-reentry-selection.spec.js:60` — route targeting owns an occupied destination before its own unit is inspected | strategy UX, input | medium | WebKit-sensitive | focused feature |

### turn / state / save-load — 19 cases

#### `tests/humans-journey.spec.js` — 6

Production relationship: src/humans-journey-*.js, humans-content.js, humans-visuals.js; saga/scenario state.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `humans-journey.spec.js:23` — Сага Ардены, сценарии и визуальный слой › сага запускается без блокирующего окна и показывает текущую главу | strategy UX, economy, layout | medium | cross-browser | focused feature |
| `humans-journey.spec.js:51` — Сага Ардены, сценарии и визуальный слой › готовые сценарии меняют настройки нового мира и сохраняются в партии | strategy UX, economy, layout | medium | cross-browser | focused feature |
| `humans-journey.spec.js:88` — Сага Ардены, сценарии и визуальный слой › глава завершается один раз и награда не дублируется | strategy UX, economy, layout | medium | cross-browser | focused feature |
| `humans-journey.spec.js:145` — Сага Ардены, сценарии и визуальный слой › решение эпохи ожидает игрока и применяет выбранное последствие | strategy UX, economy, layout | medium | cross-browser | focused feature |
| `humans-journey.spec.js:177` — Сага Ардены, сценарии и визуальный слой › специализация города начисляет бонус только один раз за новый ход | strategy UX, economy, layout | medium | cross-browser | focused feature |
| `humans-journey.spec.js:207` — Сага Ардены, сценарии и визуальный слой › новый визуальный слой украшает карту и остаётся пригодным на iPhone-размере | strategy UX, economy, layout | medium | WebKit-sensitive | focused feature |

#### `tests/humans-outcomes.spec.js` — 8

Production relationship: src/humans-outcomes.js, humans-capture-state.js, storage/save-utils; victory/defeat.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `humans-outcomes.spec.js:39` — Победа, поражение и восстановление цивилизации › государственная победа требует дворец, два города и общее население 8 | combat/world, strategy UX | medium | browser-neutral | neighboring regression |
| `humans-outcomes.spec.js:98` — Победа, поражение и восстановление цивилизации › один дворец больше не завершает неустойчивую цивилизацию | combat/world, strategy UX | medium | browser-neutral | neighboring regression |
| `humans-outcomes.spec.js:144` — Победа, поражение и восстановление цивилизации › падение столицы передаёт управление другому живому городу | combat/world, strategy UX | medium | browser-neutral | neighboring regression |
| `humans-outcomes.spec.js:186` — Победа, поражение и восстановление цивилизации › без городов, но с поселенцем цивилизация остаётся в изгнании | combat/world, strategy UX | medium | browser-neutral | neighboring regression |
| `humans-outcomes.spec.js:213` — Победа, поражение и восстановление цивилизации › потеря всех городов без поселенца завершает партию поражением | combat/world, strategy UX | medium | browser-neutral | neighboring regression |
| `humans-outcomes.spec.js:236` — Победа, поражение и восстановление цивилизации › победа над всеми соперниками фиксируется как военная | combat/world, strategy UX | medium | browser-neutral | neighboring regression |
| `humans-outcomes.spec.js:256` — Победа, поражение и восстановление цивилизации › transient outcome actions preserve goals and enable post-victory free play | combat/world, strategy UX | medium | browser-neutral | neighboring regression |
| `humans-outcomes.spec.js:357` — Победа, поражение и восстановление цивилизации › цели партии доступны из игрового меню | combat/world, strategy UX | medium | browser-neutral | neighboring regression |

#### `tests/new-game-settled-lifecycle.spec.js` — 1

Production relationship: src/app.js, humans-runtime-invalidation.js; new-game settled lifecycle.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `new-game-settled-lifecycle.spec.js:4` — Fresh-game explicit settled lifecycle › settled signal is delivered only after the new campaign state exists | observers/runtime, smoke/core | cheap | cross-browser | neighboring regression |

#### `tests/turn-unlock.spec.js` — 4

Production relationship: src/app.js, storage.js, save-utils.js; end-turn/autosave locking.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `turn-unlock.spec.js:12` — v1.4.5.1 turn unlock hotfix › turn 130 advances to 131 | save-load, runtime | expensive | cross-browser | focused feature |
| `turn-unlock.spec.js:25` — v1.4.5.1 turn unlock hotfix › rejected autosave does not leave the end turn button disabled | save-load, runtime, save-load | medium | cross-browser | focused feature |
| `turn-unlock.spec.js:36` — v1.4.5.1 turn unlock hotfix › pending autosave does not prevent the next turn after calculation finishes | save-load, runtime, save-load | medium | cross-browser | focused feature |
| `turn-unlock.spec.js:50` — v1.4.5.1 turn unlock hotfix › canSaveNow returns true after turn calculation while autosave is still pending | save-load, runtime, save-load | medium | cross-browser | focused feature |

### combat / world — 35 cases

#### `tests/barbarian-camps.spec.js` — 8

Production relationship: src/humans-living-civilizations.js, src/data.js, src/save-utils.js; camp director.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `barbarian-camps.spec.js:12` — v1.4.4 living barbarian camps › new 20x20 map has exactly one active valid camp | turn/state, save-load | medium | browser-neutral | focused feature |
| `barbarian-camps.spec.js:18` — v1.4.4 living barbarian camps › destroyed camp schedules delayed replacement and does not respawn early | turn/state, save-load | medium | browser-neutral | focused feature |
| `barbarian-camps.spec.js:24` — v1.4.4 living barbarian camps › replacement candidate excludes occupied, improved, resource, territory, city and visible tiles | turn/state, save-load | medium | browser-neutral | focused feature |
| `barbarian-camps.spec.js:31` — v1.4.4 living barbarian camps › no valid tile postpones next camp check by three turns | turn/state, save-load | medium | browser-neutral | focused feature |
| `barbarian-camps.spec.js:37` — v1.4.4 living barbarian camps › maintenance is idempotent in a single turn and respects target count | turn/state, save-load | medium | browser-neutral | focused feature |
| `barbarian-camps.spec.js:43` — v1.4.4 living barbarian camps › camp produces at most two living barbarians and reopens after one dies | turn/state, save-load | medium | browser-neutral | focused feature |
| `barbarian-camps.spec.js:49` — v1.4.4 living barbarian camps › save/load preserves director timing and does not duplicate camps | turn/state, save-load, save-load | medium | browser-neutral | focused feature |
| `barbarian-camps.spec.js:55` — v1.4.4 living barbarian camps › legacy migration handles saves with and without camps without duplicates | turn/state, save-load, save-load | medium | browser-neutral | focused feature |

#### `tests/barbarian-review-fixes.spec.js` — 7

Production relationship: src/humans-living-civilizations.js, src/humans-pathing-core.js; camps/fog/AI.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `barbarian-review-fixes.spec.js:12` — v1.4.4 review fixes for living camps › barbarian activity off keeps target zero and never creates camps | movement/pathfinding, visibility | medium | browser-neutral | focused feature |
| `barbarian-review-fixes.spec.js:26` — v1.4.4 review fixes for living camps › hidden replacement camp on previously revealed tile is not rendered or inspectable until current vision returns | movement/pathfinding, visibility | medium | browser-neutral | focused feature |
| `barbarian-review-fixes.spec.js:38` — v1.4.4 review fixes for living camps › AI ignores a previously explored but currently undiscovered hidden camp | movement/pathfinding, visibility | medium | browser-neutral | focused feature |
| `barbarian-review-fixes.spec.js:46` — v1.4.4 review fixes for living camps › replacement camp excludes the last destroyed tile when another candidate exists | movement/pathfinding, visibility | medium | browser-neutral | focused feature |
| `barbarian-review-fixes.spec.js:81` — v1.4.4 review fixes for living camps › initial camp creation mutates only the passed newState director, not the current global state | movement/pathfinding, visibility | medium | browser-neutral | focused feature |
| `barbarian-review-fixes.spec.js:87` — v1.4.4 review fixes for living camps › initial camps respect all capitals and replacement nextSpawn uses normal interval only | movement/pathfinding, visibility | medium | browser-neutral | focused feature |
| `barbarian-review-fixes.spec.js:93` — v1.4.4 review fixes for living camps › player and AI camp destruction paths record last destroyed camp and preserve existing barbarians | movement/pathfinding, visibility | medium | browser-neutral | focused feature |

#### `tests/combat-world-stability.spec.js` — 15

Production relationship: src/humans-combat-world-stability.js, territory.js, pathing/core, diplomacy; combat/world rules.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `combat-world-stability.spec.js:29` — Combat, AI and world stability › weighted route prefers a longer cheap route and reports its cost | movement/pathfinding, diplomacy, economy, turn/state | medium | browser-neutral | neighboring regression |
| `combat-world-stability.spec.js:45` — Combat, AI and world stability › terrain rules expose exact movement, defense and impassability | movement/pathfinding, diplomacy, economy, turn/state | medium | browser-neutral | neighboring regression |
| `combat-world-stability.spec.js:55` — Combat, AI and world stability › visible capital attack opens capture choice and only annexes the defeated city | movement/pathfinding, diplomacy, economy, turn/state | medium | browser-neutral | neighboring regression |
| `combat-world-stability.spec.js:93` — Combat, AI and world stability › turn-driven era decision is immediate, mandatory and city-bound | movement/pathfinding, diplomacy, economy, turn/state | medium | browser-neutral | neighboring regression |
| `combat-world-stability.spec.js:108` — Combat, AI and world stability › enemy selected from the map exposes and resolves a visible unit attack | movement/pathfinding, diplomacy, economy, turn/state | medium | browser-neutral | neighboring regression |
| `combat-world-stability.spec.js:124` — Combat, AI and world stability › Treasury visibly expands administration with an escalating price | movement/pathfinding, diplomacy, economy, turn/state | medium | browser-neutral | neighboring regression |
| `combat-world-stability.spec.js:134` — Combat, AI and world stability › manual hill movement uses the routed terrain cost and waits for the second turn | movement/pathfinding, diplomacy, economy, turn/state | medium | browser-neutral | neighboring regression |
| `combat-world-stability.spec.js:147` — Combat, AI and world stability › a blocked route does not accumulate movement credit | movement/pathfinding, diplomacy, economy, turn/state | medium | browser-neutral | neighboring regression |
| `combat-world-stability.spec.js:153` — Combat, AI and world stability › Treasury funding follows the selected non-capital city and stays live | movement/pathfinding, diplomacy, economy, turn/state | medium | browser-neutral | neighboring regression |
| `combat-world-stability.spec.js:163` — Combat, AI and world stability › AI claims a known finite POI first and the player cannot collect it twice | movement/pathfinding, diplomacy, economy, turn/state | medium | browser-neutral | neighboring regression |
| `combat-world-stability.spec.js:183` — Combat, AI and world stability › three same-type stacked units keep distinct selection and orders | movement/pathfinding, diplomacy, economy, turn/state | medium | browser-neutral | neighboring regression |
| `combat-world-stability.spec.js:209` — Combat, AI and world stability › the sole city defender stays home before distant AI goals | movement/pathfinding, diplomacy, economy, turn/state | medium | browser-neutral | neighboring regression |
| `combat-world-stability.spec.js:216` — Combat, AI and world stability › legacy major events receive stable unique IDs | movement/pathfinding, diplomacy, economy, turn/state | medium | browser-neutral | neighboring regression |
| `combat-world-stability.spec.js:222` — Combat, AI and world stability › allied joint-war proposal is generated by a real turn only before either side joins | movement/pathfinding, diplomacy, economy, turn/state | medium | browser-neutral | neighboring regression |
| `combat-world-stability.spec.js:233` — Combat, AI and world stability › Diplomacy shows an active trade route and its remaining duration | movement/pathfinding, diplomacy, economy, turn/state | medium | browser-neutral | neighboring regression |

#### `tests/living-world.spec.js` — 5

Production relationship: src/humans-living-civilizations.js, storage/save-utils, economy.js; AI/barbarians/cities.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `living-world.spec.js:11` — v1.4.1 living world checks › barbarian activity selector starts normal game and grace period blocks raids | turn/state, save-load, economy | medium | browser-neutral | neighboring regression |
| `living-world.spec.js:31` — v1.4.1 living world checks › barbarians and AI interact: raider targets AI, AI attacks raider and can clear camp | turn/state, save-load, economy | medium | browser-neutral | neighboring regression |
| `living-world.spec.js:63` — v1.4.1 living world checks › two AI civilizations can enter war after turn 20 | turn/state, save-load, economy | expensive | browser-neutral | neighboring regression |
| `living-world.spec.js:72` — v1.4.1 living world checks › player settler founds a city with its own queue and local production | turn/state, save-load, economy | medium | browser-neutral | neighboring regression |
| `living-world.spec.js:132` — v1.4.1 living world checks › save/load supports multiple cities and legacy outpost shape | turn/state, save-load, economy, save-load | medium | browser-neutral | neighboring regression |

### economy / population / worker — 19 cases

#### `tests/coherence-capture-learning.spec.js` — 14

Production relationship: src/humans-coherence-finalize.js, humans-capture-state.js, humans-worker-learning.js, economy/data; coherence rules.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `coherence-capture-learning.spec.js:44` — Рабочие, опыт производства, дипломатия и захват городов › рабочий строит улучшение рабочим временем без городского производства | combat/world, diplomacy, turn/state, UX | medium | browser-neutral | focused feature |
| `coherence-capture-learning.spec.js:80` — Рабочие, опыт производства, дипломатия и захват городов › автоприказ рабочего не остаётся на паузе из-за старого требования производства | combat/world, diplomacy, turn/state, UX | medium | browser-neutral | focused feature |
| `coherence-capture-learning.spec.js:98` — Рабочие, опыт производства, дипломатия и захват городов › здания и юниты дешевеют от собственного опыта по согласованным ступеням | combat/world, diplomacy, turn/state, UX | medium | browser-neutral | focused feature |
| `coherence-capture-learning.spec.js:131` — Рабочие, опыт производства, дипломатия и захват городов › ИИ получает ту же скидку на тип войск после каждых десяти произведённых | combat/world, diplomacy, turn/state, UX | medium | browser-neutral | focused feature |
| `coherence-capture-learning.spec.js:150` — Рабочие, опыт производства, дипломатия и захват городов › падение столицы не уничтожает государство, пока остаётся другой город | combat/world, diplomacy, turn/state, UX | medium | browser-neutral | focused feature |
| `coherence-capture-learning.spec.js:188` — Рабочие, опыт производства, дипломатия и захват городов › последний город уничтожает фракцию, а оставшиеся отряды становятся бандитами с тем же процентом здоровья | combat/world, diplomacy, turn/state, UX | medium | browser-neutral | focused feature |
| `coherence-capture-learning.spec.js:216` — Рабочие, опыт производства, дипломатия и захват городов › разграбление даёт 20% знаний неизвестной технологии и опыт увиденного здания | combat/world, diplomacy, turn/state, UX | medium | browser-neutral | focused feature |
| `coherence-capture-learning.spec.js:239` — Рабочие, опыт производства, дипломатия и захват городов › при заполненном лимите захваченный город требует сначала расширить администрацию за золото | combat/world, diplomacy, turn/state, UX | medium | browser-neutral | focused feature |
| `coherence-capture-learning.spec.js:260` — Рабочие, опыт производства, дипломатия и захват городов › ИИ-город выбирает специализацию при населении 3 | combat/world, diplomacy, turn/state, UX | medium | browser-neutral | focused feature |
| `coherence-capture-learning.spec.js:275` — Рабочие, опыт производства, дипломатия и захват городов › невозможное торговое предложение отменяется, если технология торговли отсутствует | combat/world, diplomacy, turn/state, UX | medium | browser-neutral | focused feature |
| `coherence-capture-learning.spec.js:294` — Рабочие, опыт производства, дипломатия и захват городов › дипломатия показывает изученные технологии и текущее исследование соперника | combat/world, diplomacy, turn/state, UX | medium | browser-neutral | focused feature |
| `coherence-capture-learning.spec.js:314` — Рабочие, опыт производства, дипломатия и захват городов › срочное решение показывает последствия каждого варианта | combat/world, diplomacy, turn/state, UX | medium | browser-neutral | focused feature |
| `coherence-capture-learning.spec.js:334` — Рабочие, опыт производства, дипломатия и захват городов › требование населения для юнита показано точным числом | combat/world, diplomacy, turn/state, UX | medium | browser-neutral | focused feature |
| `coherence-capture-learning.spec.js:349` — Рабочие, опыт производства, дипломатия и захват городов › при полностью открытой карте повторная покупка карты отключается | combat/world, diplomacy, turn/state, UX | medium | browser-neutral | focused feature |

#### `tests/population-workforce.spec.js` — 3

Production relationship: src/humans-population-workforce.js, economy.js; population/jobs/yields.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `population-workforce.spec.js:31` — Население и рабочая сила › каждая община после первой получает занятие и видна в городе | turn/state, city UI | medium | browser-neutral | focused feature |
| `population-workforce.spec.js:57` — Население и рабочая сила › направление роста назначает следующую общину, не убирая прежний доход | turn/state, city UI | medium | browser-neutral | focused feature |
| `population-workforce.spec.js:101` — Население и рабочая сила › конец хода заменяет старый скрытый бонус еды выбранным доходом населения | turn/state, city UI | medium | browser-neutral | focused feature |

#### `tests/resource-worker.spec.js` — 2

Production relationship: src/economy.js, humans-population-workforce.js, humans-strategy-ux.js; worker/resources.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `resource-worker.spec.js:11` — v1.4.2 resource, worker, and inspection checks › worker uses worker time without spending local city production | strategy UX, combat/world | medium | browser-neutral | focused feature |
| `resource-worker.spec.js:81` — v1.4.2 resource, worker, and inspection checks › visible rival objects and barbarian camps can be inspected without losing own unit | strategy UX, combat/world | medium | browser-neutral | focused feature |

### diplomacy / strategy / UX — 42 cases

#### `tests/context-review-cleanup.spec.js` — 4

Production relationship: src/humans-context-review-cleanup.js, humans-strategy-ux.js, styles/**; context/activity UI.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `context-review-cleanup.spec.js:37` — Применение ревью контекстного интерфейса › убраны крупные переключатели, нижние город и наука, а также вкладки осмотра | camera/layout/mobile, movement | medium | WebKit-sensitive | focused feature |
| `context-review-cleanup.spec.js:73` — Применение ревью контекстного интерфейса › экран активности остаётся переключателем объектов после их действий | camera/layout/mobile, movement | medium | WebKit-sensitive | focused feature |
| `context-review-cleanup.spec.js:124` — Применение ревью контекстного интерфейса › юниты в одной клетке выбираются напрямую списком без стрелок | camera/layout/mobile, movement | medium | WebKit-sensitive | focused feature |
| `context-review-cleanup.spec.js:169` — Применение ревью контекстного интерфейса › на мобильном наука открывается сверху, а приказы не перекрываются и не остаются смещёнными | camera/layout/mobile, movement | medium | WebKit-sensitive | focused feature |

#### `tests/diplomacy-activity-events.spec.js` — 6

Production relationship: src/humans-diplomacy-event-flow.js, humans-chronicle-ui.js, humans-capture-state.js; overlays/events.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `diplomacy-activity-events.spec.js:28` — Дипломатия, выбор объектов и события › категория сначала выбирает готовый отряд и сбрасывает при переходе к городу | turn/state, combat/world | medium | cross-browser | focused feature |
| `diplomacy-activity-events.spec.js:69` — Дипломатия, выбор объектов и события › игрок может предложить торговый путь, когда технология хранится в technologies | turn/state, combat/world | medium | cross-browser | focused feature |
| `diplomacy-activity-events.spec.js:105` — Дипломатия, выбор объектов и события › предложения открываются в центре и показывают последствия принятия и отказа | turn/state, combat/world | medium | cross-browser | focused feature |
| `diplomacy-activity-events.spec.js:127` — Дипломатия, выбор объектов и события › события попадают в летопись, старые окна скрыты, сообщение исчезает | turn/state, combat/world | medium | cross-browser | focused feature |
| `diplomacy-activity-events.spec.js:152` — Дипломатия, выбор объектов и события › крупное событие не блокирует экран и остаётся в летописи | turn/state, combat/world | medium | cross-browser | focused feature |
| `diplomacy-activity-events.spec.js:170` — Дипломатия, выбор объектов и события › присоединённый город сохраняет специализацию после выбора судьбы | turn/state, combat/world | medium | cross-browser | focused feature |

#### `tests/humans-strategy-ux.spec.js` — 5

Production relationship: src/humans-strategy-ux.js, humans-diplomacy-*.js, camera.js; strategic interactions.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `humans-strategy-ux.spec.js:19` — Стратегический UX › wheel-событие масштабирует карту к курсору | camera/layout, movement, combat/world | medium | WebKit-sensitive | focused feature |
| `humans-strategy-ux.spec.js:47` — Стратегический UX › прибытие к руинам сразу открывает выбор без дополнительного клика | camera/layout, movement, combat/world | medium | cross-browser | focused feature |
| `humans-strategy-ux.spec.js:94` — Стратегический UX › государства получают разные имена, цвета и маркеры | camera/layout, movement, combat/world | medium | cross-browser | focused feature |
| `humans-strategy-ux.spec.js:122` — Стратегический UX › три соперника создают политическую кампанию с союзником | camera/layout, movement, combat/world | medium | cross-browser | focused feature |
| `humans-strategy-ux.spec.js:159` — Стратегический UX › панель активности переключает города и открывает науку | camera/layout, movement, combat/world | medium | cross-browser | focused feature |

#### `tests/living-civilizations.spec.js` — 11

Production relationship: src/humans-living-civilizations.js, humans-diplomacy-*.js, autonomy; diplomacy AI.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `living-civilizations.spec.js:18` — Living Civilizations › мигрирует дипломатию v1 и объясняет доверие, страх и обиды | combat/world, turn/state, movement, save-load | medium | browser-neutral | focused feature |
| `living-civilizations.spec.js:34` — Living Civilizations › ИИ предлагает торговлю, дар, союз, мир, угрозу и совместную войну | combat/world, turn/state, movement | medium | browser-neutral | focused feature |
| `living-civilizations.spec.js:46` — Living Civilizations › принятое торговое предложение меняет отношения и открывает маршрут | combat/world, turn/state, movement | medium | browser-neutral | focused feature |
| `living-civilizations.spec.js:66` — Living Civilizations › союзник идёт к варварам и вступает в войну игрока | combat/world, turn/state, movement | medium | browser-neutral | focused feature |
| `living-civilizations.spec.js:79` — Living Civilizations › дипломатический ИИ выполняется внутри обычного завершения хода | combat/world, turn/state, movement | medium | browser-neutral | focused feature |
| `living-civilizations.spec.js:92` — Living Civilizations › обычный ИИ и союзная помощь делят единый бюджет действий | combat/world, turn/state, movement | medium | browser-neutral | focused feature |
| `living-civilizations.spec.js:108` — Living Civilizations › война ИИ взаимна, а атакованная сторона отвечает | combat/world, turn/state, movement | medium | browser-neutral | focused feature |
| `living-civilizations.spec.js:120` — Living Civilizations › принятая совместная война немедленно взаимна | combat/world, turn/state, movement | medium | browser-neutral | focused feature |
| `living-civilizations.spec.js:128` — Living Civilizations › союзник удаляет уничтоженный отряд противника из состояния игры | combat/world, turn/state, movement | medium | browser-neutral | focused feature |
| `living-civilizations.spec.js:141` — Living Civilizations › личности меняют реальный выбор производства | combat/world, turn/state, movement | medium | browser-neutral | focused feature |
| `living-civilizations.spec.js:149` — Living Civilizations › маршрутная атака создаёт память и видимый знак события | combat/world, turn/state, movement | medium | browser-neutral | focused feature |

#### `tests/map-inspection.spec.js` — 7

Production relationship: src/humans-strategy-ux.js, selectors.js, humans-visuals.js; inspection/selection.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `map-inspection.spec.js:18` — v1.4.3 map object inspection › renders a second player city once with population | camera/layout, combat/world | cheap | cross-browser | focused feature |
| `map-inspection.spec.js:26` — v1.4.3 map object inspection › renders two AI cities with distinct capital and town markers | camera/layout, combat/world | cheap | cross-browser | focused feature |
| `map-inspection.spec.js:33` — v1.4.3 map object inspection › shows unit, city, and tile tabs when a unit stands in a city | camera/layout, combat/world | cheap | cross-browser | focused feature |
| `map-inspection.spec.js:45` — v1.4.3 map object inspection › tile inspection shows coordinates yields and fades only selected objects | camera/layout, combat/world | cheap | cross-browser | focused feature |
| `map-inspection.spec.js:58` — v1.4.3 map object inspection › active unit remains selected while inspecting tile layer | camera/layout, combat/world | cheap | cross-browser | focused feature |
| `map-inspection.spec.js:68` — v1.4.3 map object inspection › diplomacy button opens existing civilizations screen for inspected rival | camera/layout, combat/world | cheap | cross-browser | focused feature |
| `map-inspection.spec.js:77` — v1.4.3 map object inspection › new game starts player and every AI with one scout and one warrior on valid land | camera/layout, combat/world | cheap | cross-browser | focused feature |

#### `tests/player-feedback-treasury.spec.js` — 9

Production relationship: src/humans-player-feedback*.js, economy.js, diplomacy/event flow; treasury/toasts.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `player-feedback-treasury.spec.js:11` — Player feedback stabilization and treasury › дар списывает 10 золота и добавляет доверие один раз | economy, combat/world, outcomes | medium | cross-browser | focused feature |
| `player-feedback-treasury.spec.js:43` — Player feedback stabilization and treasury › торговля требует технологии и создаёт договор на восемь ходов | economy, combat/world, outcomes | medium | cross-browser | focused feature |
| `player-feedback-treasury.spec.js:86` — Player feedback stabilization and treasury › торговое предложение недоступно без технологии или при враждебности | economy, combat/world, outcomes | medium | cross-browser | focused feature |
| `player-feedback-treasury.spec.js:110` — Player feedback stabilization and treasury › города соперников расходуют еду и растут | economy, combat/world, outcomes | medium | cross-browser | focused feature |
| `player-feedback-treasury.spec.js:125` — Player feedback stabilization and treasury › находка открывается сразу при прибытии последним очком хода | economy, combat/world, outcomes | medium | cross-browser | focused feature |
| `player-feedback-treasury.spec.js:147` — Player feedback stabilization and treasury › осмотр чужого юнита не оставляет приказы выбранного отряда | economy, combat/world, outcomes | medium | cross-browser | focused feature |
| `player-feedback-treasury.spec.js:181` — Player feedback stabilization and treasury › казна нанимает отряд без городской очереди | economy, combat/world, outcomes | medium | cross-browser | focused feature |
| `player-feedback-treasury.spec.js:199` — Player feedback stabilization and treasury › крупные события показываются текущим toast и остаются в истории | economy, combat/world, outcomes | medium | cross-browser | focused feature |
| `player-feedback-treasury.spec.js:214` — Player feedback stabilization and treasury › кнопка возвращения к карте разрешает продолжить после победы | economy, combat/world, outcomes | medium | cross-browser | focused feature |

### observers / performance / runtime — 18 cases

#### `tests/camera-layout-guard-runtime.spec.js` — 1

Production relationship: src/humans-camera-layout-guard.js; ResizeObserver ownership.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `camera-layout-guard-runtime.spec.js:3` — camera layout guard does not observe the whole screen subtree | camera/layout | cheap | WebKit-sensitive | neighboring regression |

#### `tests/explicit-legacy-refresh-bridge.spec.js` — 1

Production relationship: src/humans-runtime-invalidation.js, humans-strategy-ux.js, humans-player-feedback.js.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `explicit-legacy-refresh-bridge.spec.js:3` — central invalidation owns useful strategy and player-feedback refresh work | strategy UX | cheap | browser-neutral | neighboring regression |

#### `tests/legacy-observer-containment.spec.js` — 3

Production relationship: src/humans-observer.js, humans-coherence-finalize.js, humans-runtime-invalidation.js.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `legacy-observer-containment.spec.js:6` — legacy decorator roots stay quarantined while explicit invalidation owns UI refresh | diplomacy UX | cheap | cross-browser | neighboring regression |
| `legacy-observer-containment.spec.js:49` — coherence finalizer does not duplicate proposal-modal observer ownership | diplomacy UX | cheap | cross-browser | neighboring regression |
| `legacy-observer-containment.spec.js:61` — hidden coherence proposal rerenders do not rewrite the modal class | diplomacy UX | cheap | cross-browser | neighboring regression |

#### `tests/mobile-performance-stability.spec.js` — 4

Production relationship: src/humans-observer.js, humans-runtime-invalidation.js, humans-performance.js, layout guard; mutation stability.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `mobile-performance-stability.spec.js:127` — Mobile runtime stability › pending diplomacy proposal becomes idle and remains clickable | camera/layout, diplomacy, worker | expensive | WebKit-sensitive | full-only coverage |
| `mobile-performance-stability.spec.js:157` — Mobile runtime stability › selected worker context does not keep mutating every animation frame | camera/layout, diplomacy, worker | expensive | WebKit-sensitive | full-only coverage |
| `mobile-performance-stability.spec.js:190` — Mobile runtime stability › opening city sheet stays open and heavy observers are quarantined | camera/layout, diplomacy, worker | expensive | WebKit-sensitive | full-only coverage |
| `mobile-performance-stability.spec.js:224` — Mobile runtime stability › observer sync is bounded and city sheet survives 30 explicit open-close cycles | camera/layout, diplomacy, worker | expensive | WebKit-sensitive | full-only coverage |

#### `tests/observer-delivery-latency.spec.js` — 2

Production relationship: src/humans-observer.js; mutation delivery/yielding.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `observer-delivery-latency.spec.js:3` — observer safety drains a queued mutation before the next animation frame | event-loop timing | medium | cross-browser | neighboring regression |
| `observer-delivery-latency.spec.js:30` — observer safety yields under cross-observer feedback instead of starving timers | event-loop timing | medium | cross-browser | neighboring regression |

#### `tests/observer-startup-attribution.spec.js` — 2

Production relationship: src/humans-observer.js, humans-performance.js; startup/30-cycle attribution.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `observer-startup-attribution.spec.js:268` — startup attribution names selected-worker idle observer owners | worker, camera/layout | expensive | WebKit-sensitive | full-only coverage |
| `observer-startup-attribution.spec.js:293` — startup attribution names 30-cycle post-idle observer owners | worker, camera/layout | expensive | WebKit-sensitive | full-only coverage |

#### `tests/runtime-invalidation-cadence.spec.js` — 2

Production relationship: src/humans-runtime-invalidation.js, humans-performance.js; flush/turn phase timing.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `runtime-invalidation-cadence.spec.js:4` — runtime invalidation request storm stays below near-frame-rate flush cadence | turn/state, diplomacy | expensive | cross-browser | full-only coverage |
| `runtime-invalidation-cadence.spec.js:192` — synthetic joint-war End Turn emits retained phase timing | turn/state, diplomacy | expensive | cross-browser | full-only coverage |

#### `tests/runtime-invalidation-repeat-cadence.spec.js` — 1

Production relationship: src/humans-runtime-invalidation.js, humans-performance.js; repeated storms.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `runtime-invalidation-repeat-cadence.spec.js:3` — runtime invalidation cadence stays bounded across consecutive storms | stability | expensive | cross-browser | full-only coverage |

#### `tests/runtime-invalidation.spec.js` — 1

Production relationship: src/humans-runtime-invalidation.js, humans-visuals.js; bounded flushes.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `runtime-invalidation.spec.js:4` — runtime invalidation replaces broad visual/context polling with bounded flushes | strategy UX | medium | cross-browser | neighboring regression |

#### `tests/turn-label-idempotence.spec.js` — 1

Production relationship: src/humans-turn-label-stability.js, humans-runtime-invalidation.js; DOM identity.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `turn-label-idempotence.spec.js:4` — unchanged turn renders preserve the turn label text node | turn/state, UI | cheap | cross-browser | neighboring regression |

### soak / stability — 2 cases

#### `tests/autonomous-soak.spec.js` — 2

Production relationship: src/**; whole-game invariants; periodic save/reload.

| Case | Secondary tags | Cost | Browser | Gate role |
|---|---|---|---|---|
| `autonomous-soak.spec.js:300` — @soak deterministic autonomous player › seed 10101 survives 30 turns or reaches a legitimate outcome | turn/state, save-load, combat/world, economy, diplomacy, observers/runtime | soak | cross-browser | soak/stability |
| `autonomous-soak.spec.js:300` — @soak deterministic autonomous player › seed 30303 survives 30 turns or reaches a legitimate outcome | turn/state, save-load, combat/world, economy, diplomacy, observers/runtime | soak | cross-browser | soak/stability |

## Cross-domain relationships and selection implications

- **Camera/layout ↔ pathing/selection:** map transforms, viewport dimensions, and pointer retargeting affect route controls, stack selection, inspection, and POI/camp centering. Camera changes therefore need the camera suite plus the relevant pathing/input neighbors.
- **Turn/state ↔ nearly every simulation domain:** end-turn dispatch drives diplomacy AI, barbarian maintenance, population yield, autonomous orders, outcomes, saga progression, and runtime invalidation. A change to the shared turn pipeline is Tier 3 rather than a union of a few hand-picked cases.
- **Save/load ↔ feature-owned schema:** `browser`, `turn-unlock`, `living-world`, camp, journey, outcome, diplomacy, worker, and soak cases exercise persisted or migrated state. Schema changes require the state suite plus every feature whose owned fields changed.
- **Observers/runtime ↔ layout/UX:** observer containment and invalidation cadence protect city/context stability, diplomacy proposal clickability, turn-label identity, and camera layout guards. Observer changes require runtime coverage plus the UI owner that consumes the invalidation.
- **Combat/world ↔ pathfinding/diplomacy/outcomes:** occupancy and terrain determine routes; attacks update diplomatic memory and can trigger capture or final outcomes. Changes to combat resolution need those neighbors when ownership, defeat, or route completion is touched.
- **Economy/population ↔ city/worker/turn:** production learning, workforce yields, worker time, treasury actions, city specialization, and end-turn processing share state but are not interchangeable; choose the narrow owner plus turn/save neighbors only when the shared schema or tick is touched.

## Smoke/core candidates

A proposed tiny gate should remain intentionally small and is a composition, not a new functional domain:

1. `browser.spec.js:10` — menu boot and console health.
2. `browser.spec.js:19` — external script/application initialization.
3. `browser.spec.js:56` — stylesheet and computed-layout wiring (add WebKit for CSS/layout changes).
4. `browser.spec.js:93` with **0 AI only** — minimum new-game/map startup; the 1/2-AI variants are neighboring world-generation coverage.
5. `browser.spec.js:103` — one turn and access to menu/chronicle/save UI.
6. `browser.spec.js:125` — basic save/load round trip.
7. `new-game-settled-lifecycle.spec.js:4` — shared fresh-game lifecycle when app/state/invalidation startup changes.

The first six are only eight discovered cases today because the rival-count declaration expands into three cases. Implementing a literal “0 AI only” smoke selection would require source tags or a title filter; this document does not change selection logic.

## Overlap/redundancy candidates (review, do not remove)

- Worker-time-without-city-production appears in `resource-worker`, `coherence-capture-learning`, and `humans-autonomy`; they differ by manual action, coherence regression, and autonomous order, so factor shared setup before considering deletion.
- Camp creation/validity appears in `barbarian-camps`, `barbarian-review-fixes`, `iphone-bugfixes`, and `living-world`; boundaries are director invariants, review regressions, small-map UI-era regression, and integrated AI world behavior.
- Route-to-POI immediate resolution appears in `humans-pathing-performance`, `humans-strategy-ux`, and `player-feedback-treasury`; compare fixtures and last-movement-point behavior before consolidating.
- Stack selection appears in `combat-world-stability`, `mobile-context`, `context-review-cleanup`, and `stack-reentry-selection`; these cover distinct order preservation, rendered controls, direct-list UX, and re-entry/target ownership.
- Outcome/capital transfer is distributed across `coherence-capture-learning`, `humans-outcomes`, and `combat-world-stability`; retain domain-specific capture and UI paths even if pure state setup can be shared.
- Observer containment/cadence tests overlap in mechanism but intentionally cover different failure modes (broad observer ownership, latency/yield, single storm, repeated storms, startup attribution, and UI survival). Do not collapse them based only on shared counters.

## Ambiguities and evidence gaps

- No per-case historical duration artifact is stored in the repository, so all costs are estimated from setup, loops, and scenario breadth; CI timing should be captured before hard-coding cost budgets.
- Every project uses the same 390×844 mobile/touch context even for a test named “desktop-map”; the test changes viewport internally. “Browser-neutral” therefore describes expected engine sensitivity, not a currently separate non-browser runner.
- WebKit-sensitive classification is strongest for explicit viewport/touch/pointer/resize/observer timing tests. Cross-browser labels for generic DOM lifecycle are conservative; historical failure data could promote or demote individual cases.
- `tests/smoke.spec.js` is a zero-test placeholder, while actual smoke coverage lives in `browser.spec.js`; future tagging should avoid selecting the placeholder as if it were a suite.
- Existing CI selects exact filename matches plus a `browser.spec.js` fallback; source ownership does not align one-to-one with several cross-domain files, which is why the semantic matrix is needed.
