# Current State

> Status: Draft
>
> This document records what exists in the current playable prototype. It does not define the final vision of the game and does not automatically approve every current mechanic as permanent.

## Snapshot

- Repository: `Mikayilzade/Epohi`
- Current visible version: `v1.4.5.1-hotfix`
- Save schema: `4`
- Platform: browser-based mobile-first PWA
- Primary target: phone, including installation to the iPhone home screen
- Current state: playable vertical slice / early alpha

The prototype already contains a connected game loop: create a world, explore it, develop cities, research technologies, produce units, interact with points of interest, fight barbarians and rival civilizations, progress toward the current victory condition, and save or resume campaigns.

The project is no longer only an experiment, but its final identity, scale and long-term direction are not yet documented.

## Status labels

- **Implemented** — exists in the current build and is part of the playable loop.
- **Partial** — exists, but is simplified, incomplete or not yet deep enough.
- **Prototype** — useful for testing the idea, but likely to be replaced or substantially redesigned.
- **Missing** — planned or discussed, but not implemented.
- **Open question** — no final design decision has been made.

## 1. Platform and mobile experience

### Implemented

- Mobile-first layout.
- Safe-area support for modern phones.
- PWA manifest and service worker.
- Offline caching.
- Installation to the phone home screen.
- Main menu, new game screen, settings/wiki screens and in-game menu.
- Touch map controls: pan, pinch zoom and tile tapping.
- Dynamic Camera 2.0 scale bounds.
- Separate controls for zoom, centering on focus and showing the full map.
- Scrollable context card and mobile-friendly modals.

### Partial

- The interface is functional but still mostly built from text, emoji and compact utility panels.
- Accessibility has basic labels and semantic elements, but no complete accessibility review has been performed.
- Tablet and desktop layouts exist as extensions of the mobile layout rather than separately designed experiences.

### Open questions

- Final visual style.
- Portrait-only versus optional landscape support.
- How much information should remain permanently visible as the game becomes deeper.

## 2. World map

### Implemented

- Map sizes: 20×20, 28×28 and 36×36.
- Procedural terrain generation.
- Multiple smoothing passes to create regional terrain.
- Hill chains.
- Safe and deliberately shaped starting area.
- Fog of war.
- Separate explored information for rival civilizations.
- Terrain types:
  - plains;
  - forest;
  - hills;
  - coast/water;
  - desert/wasteland;
  - swamp;
  - dead lands.
- Tile features/resources:
  - fertile land/wheat;
  - ore;
  - gems;
  - fish;
  - ruins.
- Tile inspection with terrain and yield information.

### Partial

- Terrain movement differences are limited compared with the planned passability/autonomy concept.
- Climate, rivers, seasons, biomes and elevation are not simulated as connected systems.
- Map generation has regional shaping, but no strategic guarantee of balanced starts beyond the immediate starting area.
- Roads and transport networks do not exist.

### Prototype

- Emoji/symbol-based tile presentation.
- Current terrain yields and generation probabilities are early balancing values.

### Open questions

- Final map scale and typical campaign size.
- Whether the world should remain square-grid based.
- Whether impassable terrain should exist or only strongly reduce movement.
- Whether map geography should change between eras.

## 3. Resources and economy

### Implemented

- Four resources:
  - food;
  - production;
  - gold;
  - science.
- Food and production are local to cities.
- Gold and science are empire-wide.
- Resource view can switch between the entire empire and an individual city.
- Tile yields.
- Improvement yields.
- Building yields.
- City income calculation.
- City population growth from food.
- Stored city production when no queue item is active.
- Local production spending by workers.
- Upfront non-production costs for projects.

### Partial

- The economy is understandable and playable, but small.
- There is no trade network, logistics, resource transport, taxation, maintenance or debt.
- Population is a single number rather than a workforce with professions or needs.
- Gold and science are direct abstract totals.
- City specialization exists only indirectly through terrain and buildings.

### Prototype

- Current yield values, costs and growth thresholds.
- The exact split between local and global resources.

### Missing

- Trade between cities and civilizations.
- Supply chains.
- Strategic resources.
- Resource scarcity by era.
- Maintenance and administrative costs.

### Open questions

- How realistic the economy should become.
- Whether local resources should physically move between cities.
- Whether population should work individual tiles or sectors.

## 4. Cities, territory and population

### Implemented

- Player capital.
- Multiple player cities.
- Cities founded by settlers.
- Custom city naming through the current browser prompt flow.
- Separate city food, production, population, buildings and queue.
- City health.
- Capital flag.
- Young-city protection period.
- Local territory ownership.
- Minimum distance rules for founding cities.
- Rival cities and rival capitals.
- City inspection.
- City list/interface.

### Partial

- Territory is based on simple radius/ownership rules.
- Population growth is automatic.
- Cities do not have happiness, loyalty, classes, housing or internal politics.
- Capturing cities is simplified.
- Rival cities use a reduced version of the player city model.

### Prototype

- Current city radius formula.
- Maximum practical number of cities.
- Current city founding restrictions.
- Current victory link to the Palace.

### Missing

- City specialization system.
- Districts or internal city layout.
- Migration.
- Rebellion and loyalty.
- Local governance.
- Civilian population groups.

### Open questions

- Whether the player manages cities directly forever or delegates them as government develops.
- Whether cities remain primary actors or eventually become provinces/regions.

## 5. Buildings and improvements

### Implemented buildings

- Monument.
- Granary.
- Workshop.
- Library.
- Market.
- Aqueduct.
- Palace.

### Implemented tile improvements

- Lumber camp.
- Farm.
- Mine.
- Trading post.
- Harbor.

### Implemented behavior

- Technology requirements.
- Production and other resource costs.
- Yield bonuses.
- Worker construction on the current tile.
- Improvement ownership.
- Barbarian pillaging.
- Worker repair.

### Partial

- Building choices are currently a short linear catalogue.
- Improvements have no upgrade levels, workers, maintenance or adjacency systems.
- There are no wonders.
- There is no construction time for workers beyond immediate resource payment/action.

### Open questions

- Whether construction should take several turns.
- Whether workers represent people, teams or administrative capacity.
- Whether buildings should use slots, districts or free lists.

## 6. Units

### Implemented unit types

- Worker.
- Scout.
- Warrior.
- Settler.

### Implemented unit properties

- Type.
- Position.
- Movement points.
- Health and maximum health.
- Attack.
- Defense.
- Population cost.
- Production/resource cost.
- Stable generated name for player units.
- Selection and inspection.
- Multiple own units on one tile.
- Previous/next navigation inside a friendly unit stack.

### Implemented actions

- Manual movement.
- Exploration and fog reveal.
- Attack.
- Found city.
- Build improvement.
- Repair improvement.

### Partial

- Unit roles are clear but very limited.
- Unit training is represented only by production cost.
- Units do not gain experience, promotions or injuries.
- Most player units require direct manual control.
- Generated names are permanent, but manual renaming is absent.

### Missing — central future concept

- Unit attributes such as intelligence and intuition.
- Training-quality sliders.
- Configurable behavior algorithms.
- Autonomous player-unit orders.
- Limits on order complexity based on intelligence.
- Terrain preferences and avoidance rules.
- Autonomous reports and intervention rules.
- Experience, morale, discipline and specialization.

### Open questions

- Final list of unit attributes.
- Whether attributes belong to individuals, formations, commanders or all three.
- How much manual movement remains available after autonomy is introduced.
- How the cost of highly trained units scales.

## 7. Technology and eras

### Implemented technologies

- Agriculture.
- Mining.
- Writing.
- Trade.
- Engineering.
- Statehood.

### Implemented behavior

- Science accumulation.
- Prerequisites.
- Unlocking buildings, improvements and units.
- Era label calculation in a dedicated progression module.

### Partial

- The technology tree is small and mostly linear.
- Eras currently work mainly as labels and progression thresholds.
- There are no alternative technological paths, discoveries, institutions or knowledge diffusion.

### Prototype

- Current technology costs and prerequisite graph.
- Palace/Statehood as the current final objective.

### Missing

- Full multi-era progression.
- Cultural or institutional development.
- Obsolescence and upgrading.
- Technology exchange or espionage.
- Different development paths for civilizations.

### Open questions

- Number and historical scope of eras.
- Whether technologies are selected directly or emerge from civilization activity.
- How the player's role changes between eras.

## 8. Points of interest and artifacts

### Implemented points of interest

- Ancient ruins.
- Abandoned depot.
- Sacred grove.
- Old mine.
- Lost caravan.
- Cave.
- Ancient mage tower.
- Ruined temple.

### Implemented outcomes

- Resource rewards.
- Healing.
- Map reveal.
- Chance to receive a worker.
- Ambushes.
- Artifacts.

### Implemented artifact bonuses

- Science income.
- Gold income.
- Production income.
- Scout sight.
- Health of new military units.

### Partial

- Events are mostly one-time random rewards.
- Choice presentation uses simple browser confirmation flows in some cases.
- Artifacts are passive permanent bonuses with limited narrative identity.

### Open questions

- Whether points of interest become longer event chains.
- Whether discoveries depend on unit skills and knowledge.
- Whether artifacts remain magical/fantasy elements in the final setting.

## 9. Barbarians and neutral threats

### Implemented

- Configurable activity: off, low, normal and high.
- Barbarian camps.
- Stable camp IDs.
- Camp health and spawning timers.
- Raiders linked to an origin camp.
- Per-camp and global raider limits.
- Grace period before activity.
- Target selection across player and rival civilizations.
- Attacks on civilians and military units.
- Pillaging of improvements.
- Rival AI response to barbarians.
- Camp destruction rewards.
- Delayed replacement of destroyed camps.
- Spawn validation that avoids owned, visible and occupied locations.
- Camp discovery tracked separately for player and rivals.
- Save migration for the living-camp system.

### Partial

- Barbarians use one general raider type.
- Their society, goals and escalation are not modeled.
- Threat difficulty is controlled mainly by counts and timers.

### Prototype

- Respawning camps as the long-term neutral-threat model.
- Current rewards and activity formulas.

### Open questions

- Whether barbarians remain generic enemies or become tribes, factions and minor powers.
- Whether neutral groups can negotiate, migrate, trade or become states.

## 10. Rival civilizations and AI

### Implemented

- Selection of 0–2 rival civilizations at new-game creation.
- Separate civilization names, colors and symbols.
- Separate units, cities, resources and explored map.
- Basic AI goal selection using weighted priorities.
- Exploration.
- Worker actions.
- Unit production.
- City founding.
- Response to barbarians.
- Camp expeditions.
- Basic military action.
- Discovery/contact.
- Structured event log.
- Civilization panel.

### Partial

- Rivals share one broad behavior model.
- Personality differences are minimal.
- AI city management is simplified.
- Long-term planning is limited.
- The current action system can produce functional but not always human-like behavior.

### Prototype

- AI weights and limits.
- Maximum of two rivals.
- Maximum city/unit counts used for current performance and simplicity.

### Missing

- Distinct personalities and strategic doctrines.
- Memory of agreements, betrayals and grievances.
- Internal AI economy comparable to the final player economy.
- Advanced military coordination.
- Alliances and coalitions.

### Open questions

- Whether rival civilizations use exactly the same rules as the player.
- Whether AI should also use the future unit-intelligence/autonomy system.

## 11. Diplomacy

### Implemented

- Unknown civilization state.
- Neutral relation.
- War.
- Simple peace interaction.
- Early protective period before ordinary wars.
- Diplomacy access from inspected rival objects and the civilizations panel.

### Partial

- Diplomacy currently functions mainly as a war-state switch.
- There are no treaties, trade agreements, demands, influence or reputation systems.

### Prototype

- Current relation labels and direct war/peace controls.

### Missing

- Negotiation.
- Trade.
- Borders and access rights.
- Alliances.
- Vassalage.
- Diplomatic victory or influence.

## 12. Combat

### Implemented

- Adjacent attacks.
- Attack and defense values.
- Health.
- Terrain defense bonuses.
- Improvement/outpost defense bonuses.
- Randomized damage within a narrow range.
- Counterattack behavior in parts of the combat flow.
- Unit death.
- Barbarian and rival targets.
- Camp attacks.
- City attacks and simplified defeat/capture behavior.
- Pillaging and repair.

### Partial

- Combat is a compact early model rather than a complete tactical system.
- There are few unit types and no combined-arms interaction.
- No formations, ranged attacks, siege, zones of control, supply or morale.
- Combat preview and explanation are limited.

### Prototype

- Current damage formula.
- Terrain bonus values.
- City defeat/capture rules.

### Open questions

- Desired tactical depth.
- Whether battles occur directly on the world map or in a separate resolution layer.
- Whether units represent individuals, groups or armies.

## 13. Turn loop, events and victory

### Implemented

- Player action phase.
- End-turn processing.
- Rival phase indicator.
- Rival civilization actions.
- Barbarian actions.
- Production and growth.
- Event log/chronicle.
- Structured events with actor and location information.
- Victory and defeat flags.
- Current Palace-based victory path.
- Protection against the interface remaining locked during slow autosave.

### Partial

- The current turn loop works, but the final player decision rhythm has not been designed explicitly.
- Event reporting can inform the player, but there is no full turn-summary or priority inbox.
- Victory represents the end of the current prototype rather than the final game.

### Open questions

- Final core loop.
- Number of meaningful decisions per turn.
- How autonomous-unit reports should be integrated.
- Multiple victory and failure conditions.

## 14. Saving, campaigns and persistence

### Implemented

- IndexedDB storage.
- Separate campaign metadata and save snapshots.
- Three manual saves per campaign.
- Quicksave.
- Three rotating autosaves.
- Serialized save writes.
- Save validation.
- Multiple migration paths from earlier schemas and localStorage.
- Save/load UI shared between main menu and active game.
- Camera persistence.
- Campaign naming and metadata.
- Offline persistence through PWA infrastructure.

### Partial

- Migration logic is extensive and remains concentrated around the main application flow.
- No cloud synchronization.
- No export/import file workflow.
- No replay system.

### Open questions

- Long-term save compatibility policy during major redesigns.
- Whether old alpha saves should remain supported indefinitely.

## 15. Testing and delivery

### Implemented

- Playwright smoke-test infrastructure.
- Mobile viewport testing.
- Tests split by feature areas.
- GitHub Actions workflow for pull requests and pushes to `main`.
- Playwright report and test-result artifacts.
- JavaScript syntax checks used during Codex tasks.
- Semi-automatic Codex task workflow.
- Rule: one small task, one branch, one Draft PR, no automatic merge.

### Partial

- Tests are mainly browser smoke/integration tests.
- No dedicated unit-test framework for game rules.
- No linting or formatting command.
- No deterministic long-running simulation tests.
- Many game systems rely on `Math.random`, making precise regression testing harder.

### Missing

- Balance simulations.
- Performance budgets.
- Save-fixture test catalogue.
- Automated visual regression testing.

## 16. Code structure

### Current runtime modules

- `src/config.js`
- `src/data.js`
- `src/utils.js`
- `src/storage.js`
- `src/save-utils.js`
- `src/camera-storage.js`
- `src/camera.js`
- `src/selectors.js`
- `src/territory.js`
- `src/economy.js`
- `src/progression.js`
- `src/app.js`

### Strengths

- Large static data and several pure helpers have been extracted from the original monolithic file.
- Storage, camera, selectors, territory, economy and progression now have dedicated modules.
- Runtime dependencies are loaded in an explicit order.
- Existing refactors generally preserve behavior and save compatibility.

### Risks

- `src/app.js` still owns most gameplay systems and UI behavior.
- State mutation is distributed through many functions.
- Browser-global modules are simple for the current project but may become difficult to manage as systems multiply.
- Game rules, UI rendering and turn processing remain strongly connected.
- The debug object exposes a large surface because tests depend on internal application functions.

### Likely future extraction areas

- World generation.
- Units and movement.
- Combat.
- Cities and production.
- Barbarians.
- Rival AI.
- Events/chronicle.
- Save migration.
- Rendering and UI controllers.

No extraction should be performed only to make more files. New modules should follow approved feature boundaries and include tests.

## 17. Existing documentation

### Implemented

- `README.txt` with old installation notes and an earlier feature summary.
- `.github/codex/README.md`.
- `.github/codex/prompt-next-task.md`.
- `.github/codex/task-queue.md`.
- Pull request history with detailed descriptions of implemented changes.

### Problems

- `README.txt` is outdated relative to the current build.
- There is no repository-level `README.md`.
- There is no `VISION.md`.
- There is no `ROADMAP.md`.
- There is no feature design library.
- There is no approved glossary or decision log.
- The current Codex queue contains no unfinished task.

## 18. Major systems not yet implemented

These items are not automatically approved; they are important gaps between the current prototype and previously discussed ambitions.

- Player-unit intelligence and autonomy.
- Unit training quality and configurable attributes.
- More complete era progression.
- Government and delegation.
- Internal civilization systems.
- Trade and logistics.
- Deep diplomacy.
- Distinct rival personalities.
- Expanded warfare.
- Meaningful cultural development.
- Better event and report handling.
- Final victory structure.
- Final art direction and audio.

## 19. Current temporary assumptions

The following exist in the prototype but must not be treated as permanent without design review:

- Four fixed unit types.
- Six technologies.
- Seven buildings.
- Five improvements.
- Four resources.
- Square maps up to 36×36.
- Maximum of two rival civilizations.
- Radius-based territory.
- Direct manual unit movement as the default control model.
- Respawning barbarian camps.
- Palace as the final victory objective.
- Emoji-based visual language.
- Browser prompts/confirms for some interactions.

## 20. Immediate project need

The next priority is not another large gameplay feature. The project first needs a documented direction that answers:

1. What is the final fantasy and identity of **Epohi**?
2. Which parts of the current prototype belong in that future game?
3. Which current mechanics are temporary scaffolding?
4. What is the intended core player loop?
5. What makes the game meaningfully different from a smaller Civilization clone?
6. What should be built in the next playable milestone?

The answers belong in `VISION.md`, `features/README.md` and `ROADMAP.md`. Only approved and sufficiently detailed designs should later become new Codex queue tasks.
