# PROJECT HANDOFF — «Эпохи»

This file is the durable handoff for continuing development in a new ChatGPT/Codex session. The repository and its latest Git history remain the source of truth if this document and code ever differ.

## 1. Project identity

- Working title: **Эпохи** (may be renamed later).
- Repository: `Mikayilzade/Epohi`.
- Current integrated development branch: `prototype/humans-v1`.
- Main integration PR: **#69 — Prototype: Эпохи — Люди v1**.
- PR #69 targets `main`, remains Draft, and must not be merged without explicit approval from Mikayil.
- Latest fully green baseline before the player-feedback/treasury package: `7d2514a85546664c64db31d572ab435cc1f242a0`.
- Baseline CI: Playwright Smoke Tests #176, **116 passed, 16 skipped**.

Always inspect the latest head of `prototype/humans-v1` and PR #69 before starting work; do not assume the baseline SHA above is still the newest commit.

## 2. Product direction

The game is a compact but systemic civilization strategy inspired by Civilization, built around:

- a world that keeps developing without the player;
- rival civilizations with identities, memory, diplomacy and autonomous goals;
- units that will eventually accept increasingly sophisticated conditional orders;
- a readable but non-trivial economy, science and territorial system;
- long-term progression from tribe to state and later eras;
- a mobile-friendly browser build, especially for iPhone playtesting.

The intended differentiator is not merely “small Civilization”. The long-term focus is **autonomous units and living states**: intelligence, discipline, intuition and initiative should eventually determine how complex an order a unit can understand and execute.

## 3. Current playable systems

### World and map

- Generated maps in multiple sizes.
- Terrain, yields, resources, fog of war and exploration.
- Camera pan, pinch zoom, desktop mouse-wheel zoom, fit-map and center controls.
- Responsive desktop/mobile layouts.
- Faction colors, symbols, city/unit markers and territory borders.
- Points of interest, ruins, camps and barbarian replacement logic.

### Player civilization

- Multiple cities with local food, local production and separate queues.
- Shared gold, science, technologies and artifacts.
- Workers, scouts, warriors and settlers.
- Buildings, improvements, research tree and growth.
- Multi-turn route orders, ETA, route overlays, dynamic target tracking and route combat.
- POI choices: study for science or salvage for production/gold.
- Readiness strip for idle military, idle workers, empty city queues and missing research.
- Statehood and military victory conditions, plus non-terminal recovery after losing a capital.

### Rivals and living world

- Up to three rivals in the current large-politics setup.
- Cultural profiles: Kaganate Zarr, League of Velmor, Union of Elaria and Varkesh profile support.
- AI goals, production choices, exploration, workers, settlers, cities, barbarians and wars.
- Diplomacy v2: trust, fear, grievances, memories and relationship explanations.
- Proposals: gifts, alliances, peace, threats, joint wars and trade.
- Reciprocal AI-to-AI wars, retaliation and shared action budgets.
- Allies can help against barbarians and shared enemies.
- World-event markers and chronicle entries.

### Saves and offline support

- Campaigns, manual saves, quicksave and rotating autosaves.
- IndexedDB storage and migrations for older saves.
- Service worker and installable/offline web-app assets.

## 4. Latest player-feedback package

The package following the first long human playthrough addresses these concrete findings:

1. A POI reached with the unit’s final movement point must open immediately rather than waiting for the next turn.
2. Inspecting a neutral/enemy unit must never leave commands for the previously selected player unit.
3. Terrain/path UI must explain the current rule honestly: all passable land currently costs one step; weighted terrain movement is not implemented yet.
4. Rival city food must produce actual population growth.
5. Trade must require the `trade` technology for both sides and should not be offered by hostile states.
6. Trade becomes an eight-turn route paying gold each turn, with cooldowns, rather than a one-off lump reward.
7. Repeated trade proposals are suppressed while a route/cooldown exists.
8. Gifts display their cost and diplomatic effect separately: `−10 gold, +14 trust`, with no double relationship update.
9. Major world events appear on the main game screen, not only inside the chronicle.
10. The faction marker around city population is repositioned to avoid visual overlap.
11. Victory/result buttons are hardened, and the player can continue in free-play mode after victory.
12. A separate **Treasury** UI creates meaningful gold sinks:
    - rotating mercenary market;
    - paid allied contingents for a fixed number of turns;
    - healing a selected unit;
    - funding local city production;
    - buying exploration maps;
    - active trade-route overview.

The implementation module is `src/humans-player-feedback.js`; its regression suite is `tests/player-feedback-treasury.spec.js`.

## 5. Important architecture

The application is a static browser game using globals rather than a bundler.

### Base runtime

- `index.html` — DOM shell and script order.
- `src/app.js` — large legacy/core runtime: state, map, city, turn processing, AI, saves and UI.
- `src/data.js` — terrain, improvements, buildings, units, technologies and constants.
- `src/utils.js` — shared utility functions.
- `src/storage.js`, `src/save-utils.js` — persistence.
- `src/camera.js`, `src/camera-storage.js` — camera behavior.
- `src/economy.js`, `src/territory.js`, `src/progression.js`, `src/selectors.js` — extracted helpers.

### Human-prototype extension modules

- `src/humans-pathing-core.js` — travel orders and route combat.
- `src/humans-pathing-ui.js` — route controls, ETA and POI arrival UI.
- `src/humans-strategy-ux.js` — faction identity, diplomacy modal, readiness and three-rival campaign support.
- `src/humans-living-civilizations.js` — Diplomacy v2, proposals, personalities, allied help and event markers.
- `src/humans-outcomes.js` — statehood/military victory and defeat handling.
- `src/humans-autonomy.js`, `src/humans-autonomy-fix.js` — current autonomy layer.
- `src/humans-journey-*` — campaign/journey content.
- `src/humans-visuals.js`, `src/humans-observer.js`, `src/humans-performance.js` — visuals, observation and performance protections.
- `src/humans-player-feedback.js` — post-playtest integration layer for treasury, trade routes, rival growth and UI fixes.

### Debug/test API

`window.__epohiDebug()` exposes state and selected core methods for Playwright. Extension APIs include:

- `window.EpohiHumansPathing`
- `window.EpohiStrategyUX`
- `window.EpohiLivingCivilizations`
- `window.EpohiHumansOutcomes`
- `window.EpohiPlayerFeedback`

Do not casually remove or rename these APIs; many browser tests use them.

## 6. Development rules agreed with the user

- Never merge PR #69 or any prototype work into `main` without explicit approval.
- Work on a feature/stabilization branch based on `prototype/humans-v1`, then merge only into the prototype branch after review.
- Avoid GitHub Actions/email spam.
- Batch a meaningful finished milestone into one implementation commit and at most one stabilization commit.
- Run local syntax checks and Playwright where possible before pushing.
- Use PR #69 to trigger one integrated CI run after the package reaches `prototype/humans-v1`.
- If CI fails, inspect exact logs first; do not push repeated speculative fixes.
- Do not hide limitations or describe browser automation as physical iPhone testing.
- Preserve old saves or add explicit migrations when state changes.
- Keep the game playable after each integrated milestone.
- Prefer finite checklist-driven work over endless polishing.

## 7. GitHub history relevant to the current milestone

- PR #69: long-lived Draft integration PR, `prototype/humans-v1` → `main`.
- PR #70: Living Civilizations implementation, merged into `prototype/humans-v1`.
- PR #71: final Living Civilizations stabilization, merged into `prototype/humans-v1`.
- `main` remains untouched by the human-prototype branch unless Mikayil explicitly approves the final merge.

## 8. Testing expectations

Before calling a package complete:

1. Run `node --check` on every changed JavaScript file and test.
2. Run `git diff --check`.
3. Run the complete Playwright suite, not only the new file.
4. Confirm save/load and service-worker regressions still pass.
5. Check desktop and mobile viewport scenarios.
6. Report exact pass/skip/fail numbers.
7. Keep the PR description honest if a browser cannot run in the environment.

The user performs the final physical-device test and reports tactile issues, heating, scrolling and interaction confusion.

## 9. Current known limitations

- Terrain currently has no true weighted movement cost: passable land costs one movement step. Hills/forest affect defense, not speed. A weighted pathfinding/movement-point redesign is a future isolated milestone.
- The AI has growing cities and production but still lacks the depth of a full economic planner.
- Diplomacy remains an early system; treaties, obligations, negotiations and trade route geography can grow further.
- Treasury markets are an early gold-sink layer and need balance based on several full campaigns.
- Art, combat animation, sound and music are incomplete.
- The current human-era campaign is still much shorter and shallower than the intended full game.
- Autonomy is not yet the central deep mechanic envisioned for the final project.

## 10. Recommended next steps

After the player-feedback/treasury package is stable:

1. Perform another 30–50 turn real playthrough, including war, allied contingent use, treasury spending and trade expiration.
2. Apply one focused balance/stability pass from that playthrough.
3. Build **Autonomy v2** as the next major differentiator:
   - patrol/guard regions;
   - conditional exploration;
   - worker priorities;
   - threat interception;
   - army assembly;
   - clear reports explaining what autonomous units did and why.
4. Expand living states with negotiations, requests, obligations and more meaningful alliance behavior.
5. Only later deepen eras, victory paths, visuals, audio and public demo packaging.

## 11. New-chat continuation prompt

Use this prompt in a new chat inside the «Эпохи» project:

> Продолжаем разработку игры «Эпохи». Репозиторий: `Mikayilzade/Epohi`. Сначала прочитай `PROJECT_HANDOFF.md`, затем проверь текущий Draft PR #69 и последний head ветки `prototype/humans-v1`. Не трогай и не сливай `main` без моего прямого разрешения. Работай крупными законченными пакетами, не спамь GitHub Actions, сохраняй совместимость сохранений и подтверждай результат полным Playwright-прогоном.

## 12. Trust rule

When chat memory, this document and repository code disagree, use this order:

1. latest repository code and Git history;
2. latest comments/description in PR #69;
3. this handoff document;
4. remembered chat context.

This prevents an old conversation summary from overriding the actual game state.

## 13. Combat, AI and world stability integration (2026-08-02)

The `codex/combat-ai-world-stabilization-v1` package adds a centralized terrain contract in `src/data.js`: every current terrain declares movement cost, land passability, and numeric defense. `src/humans-pathing-core.js` now uses weighted Dijkstra routing and persists `travelOrder.movementBank`, so expensive terrain can require more than one turn without changing the displayed/executed route. Route badges are cumulative movement cost rather than tile ordinals.

`src/humans-combat-world-stability.js` owns migration defaults and shared campaign-stability operations. Its public `window.EpohiCombatWorldStability` API includes faction collapse, urgent decisions, administration expansion, proposal hygiene, and stable major-event rendering. Capital collapse transfers every surviving city, scatters all remaining units, clears proposals/routes/relations and rewrites obsolete territory ownership. Urgent decisions retain their source `cityId`, survive saves, expire after their creation turn, and cannot silently redirect local production to another city.

Player administration defaults to at least four cities (or the number already present in an older save). Settlement uses `state.cityCapacity`; Treasury expansion costs 60 gold initially and rises by 40 per purchase. Treasury production now requires an explicitly selected city. The service-worker cache is `epohi-v1-8-0-combat-world-stability` and includes the new module.

Local checks on 2026-08-02: all JavaScript syntax checks and `git diff --check` passed. The complete 121-test Playwright suite was invoked, but Chromium failed before test 1 because the image lacks `libatk-1.0.so.0`; installing browser dependencies also failed because the environment package proxy returned HTTP 403. Therefore the honest browser result is **0 passed, 0 skipped, 1 failed at browser launch, 120 did not run**, not a green run. Physical iPhone testing was not performed.
