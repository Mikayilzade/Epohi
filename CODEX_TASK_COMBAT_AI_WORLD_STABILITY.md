# Codex milestone — Combat, AI and World Stability

Repository: `Mikayilzade/Epohi`

Work branch: `codex/combat-ai-world-stabilization-v1`

Base branch: `prototype/humans-v1`

Long-lived integration PR: #69 (`prototype/humans-v1` → `main`, Draft)

## Non-negotiable workflow

1. Read this file, `PROJECT_HANDOFF.md`, PR #69, the current architecture, and all relevant tests before changing code.
2. Work only on `codex/combat-ai-world-stabilization-v1`.
3. Do not modify, rebase, merge, or target `main`.
4. Do not merge into `prototype/humans-v1`; leave a Draft PR for review.
5. Do not push intermediate broken work. Run local syntax checks and Playwright repeatedly in the Codex environment; push only after the complete milestone is locally green.
6. Prefer one implementation commit and at most one stabilization commit.
7. Do not add permanent polling loops, high-frequency timers, expensive broad MutationObservers, or continuous animations.
8. Preserve save compatibility. Add explicit migration/defaulting for every new state field.
9. Do not hide incomplete work behind debug-only APIs or tests that directly fabricate the final state. Tests must exercise real user/game flows wherever practical.
10. Update this checklist, `PROJECT_HANDOFF.md`, and the Draft PR description honestly with exact test results. Do not claim physical-device testing.

## Milestone goal

Turn the current promising 60+ turn prototype into a coherent playable war/expansion loop. This is a stabilization and integration milestone, not an invitation to expand scope into later eras, espionage, audio, or visual redesign.

The latest real playthrough showed that diplomacy and allied wars can create an interesting living world, but several core systems remain unclear or inconsistent: movement chooses unintuitive routes, terrain numbers are hidden, stacked armies cannot be commanded reliably, enemy targets lack attack actions, defeated factions remain active, AI states are too weak, city/treasury actions use the wrong city, urgent events can wait forever, and world-event UI can become unclosable.

## A. Weighted movement and readable terrain rules

Replace the current equal-step land routing with one centralized terrain movement/defense model.

Required behavior:

- Add a single source of truth for every terrain type's movement cost, passability, and defense modifier. Reuse existing data fields if they already exist; do not maintain divergent tables in multiple modules.
- Route calculation must minimize total movement cost, not merely tile count. Use Dijkstra/A* or an equivalent weighted algorithm.
- Movement points must be consumed by terrain cost. If a unit lacks enough points for the next tile, it waits and continues next turn.
- A route may contain more tiles when it is cheaper than crossing hills/forest/swamp. The route shown to the player must be the route actually executed.
- Preserve dynamic targets, route combat, POI arrivals, save/load, and ETA behavior.
- Show exact numbers in the selected-cell panel and Wiki/help:
  - movement cost for the selected unit;
  - defense modifier as a numeric percentage or equally unambiguous value;
  - impassable conditions;
  - relevant unit exceptions.
- Route UI must show total remaining movement cost and a correct approximate turn ETA. Numbered route markers should follow cumulative movement, not raw tile count.
- Do not invent terrain names. Inspect `src/data.js` and current map generation first.

Acceptance tests must prove that a unit chooses a longer flat route when its total cost is lower than a shorter hill/forest route, and that displayed cost/ETA match execution over multiple turns.

## B. Reliable stacked-unit selection and orders

Fix the stale-selection bug when several player units occupy one tile.

Required behavior:

- Clicking a stack must provide a clear deterministic way to select each unit on the tile (stack list, cycling controls, or another compact mobile-safe solution).
- The context panel, highlighted unit, health, movement, route, and commands must always belong to the currently selected unit ID.
- Switching units immediately replaces the previous unit's order controls; no stale `Идти`, `Охранять`, route, or cancel controls may remain.
- Issuing an order to one unit must not prevent selecting and commanding the next unit in the same stack during the same turn.
- Selecting an enemy/neutral unit must clear or safely suspend player-unit commands. Commands must never be sent to the last selected friendly unit while an enemy is displayed.
- Preserve per-unit `acted`, `moves`, routes, guard state, and save/load behavior.

Add a real browser regression with at least three friendly units on one tile: give different legal orders to each in sequence and verify the correct unit state changed each time.

## C. Combat actions against enemy units and cities

At war, selecting an enemy must not show only Diplomacy.

Required behavior:

- When a player unit is selected and a hostile unit/city is a legal target, show an explicit attack/move-to-attack action.
- Support adjacent attacks and existing route-based attacks without creating two divergent combat systems.
- Clearly explain why attack is unavailable: no selected unit, already acted, no movement, out of range, blocked route, not at war, or invalid target.
- Never expose friendly commands while an enemy target is selected.
- City combat/capture, unit cleanup, diplomacy memories, world events, action budget, and victory/defeat checks must use shared resolution helpers.
- Tests must cover attacking an enemy unit selected from the map and attacking/capturing a hostile city through the visible UI.

## D. Complete faction defeat and territorial cleanup

Capital destruction/capture is currently treated as a minor event and can leave red territory, surviving diplomacy, peace offers, and joint-war proposals against an already defeated faction.

For this prototype use one explicit collapse rule:

- Capturing/destroying a rival capital eliminates that rival state.
- All surviving rival cities transfer to the captor and recalculate ownership/territory.
- Remaining rival military/civilian units are removed as surrendered/scattered. Record a concise event rather than leaving ghost armies.
- All active proposals, joint wars, alliances, trade routes, cooldowns, and war relations involving that rival are cancelled/closed safely.
- Defeated rivals are excluded from every AI turn, proposal generator, diplomacy list action, alliance-help target list, treasury contingent list, and world simulation loop.
- No state may propose peace, trade, alliance, or joint war with/against a defeated rival.
- The defeated color border/territory must disappear or transfer immediately after resolution and remain correct after save/load.
- Capital fall is a major modal event with the victor, defeated state, transferred cities, and collapsed forces. It must also remain in the chronicle.
- The player must be able to close the modal and continue the campaign.

Use a single shared defeat-resolution function for player-vs-AI and AI-vs-AI capture. Add migration/defaulting and end-to-end tests including reload after defeat.

## E. World-events UI stability

Required behavior:

- The `События мира` panel close button must always work before and after victory, free play, capital collapse, modal openings, zoom changes, and long sessions.
- Closing the panel must not delete the history. Provide a stable way to reopen it from the menu or an event indicator.
- Major events (capital fall, state creation, victory, major treaty) should open a dedicated modal once. Routine attacks/growth remain in the compact feed.
- Do not use an observer that continuously recreates controls. Prefer stable DOM ownership and event delegation.
- Limit visible feed items sensibly while preserving full chronicle history.

Add browser regressions for closing/reopening after a rival's defeat and after continuing from an outcome screen.

## F. Urgent era decisions

`Странствующий мастер` and similar decisions are currently buried in the Saga and can wait for dozens of turns, allowing rewards to be stockpiled for future cities.

Required behavior:

- When an urgent decision is created, immediately show a dedicated decision modal above the map.
- Closing the modal leaves a prominent persistent `Требуется решение` indicator that reopens it.
- The event is bound to the city that generated it. Local production rewards must always apply to that city, not to a city founded later or currently selected later.
- The decision expires at the end of the current turn. On End Turn, either require a decision or show a clear confirmation that the visitor/event will leave with no reward.
- Resolved/expired decisions disappear from the urgent UI and remain as history.
- Place unresolved urgent decisions above ordinary Saga goals if Saga is opened.
- Apply the same lifecycle to every current urgent era decision, not only one hard-coded event.

Tests must prove immediate visibility, city binding, expiration, end-turn confirmation, and save/load persistence.

## G. City selection, production, and administration capacity

Required behavior:

- Treasury `Финансировать мастерские` must apply to the currently selected city and name that city in the button/description/event. If no valid city is selected, require the player to choose one.
- Diagnose and fix cases where a non-capital city cannot open or use its production queue despite having valid options/resources.
- Every city must maintain an independent queue and local production. Switching cities must update all controls immediately.
- Replace the hidden hard four-city limit with visible administrative capacity:
  - show `cities used / capacity` in city and settler UI;
  - explain why founding is blocked;
  - derive capacity from existing political progression/era where possible;
  - add a Treasury `Расширить администрацию` purchase that raises capacity by one with an escalating gold cost;
  - preserve a finite soft balance constraint rather than allowing silent unlimited expansion.
- Red/enemy former territory alone must not block settlement after the former state has collapsed; normal terrain/distance/capacity rules still apply.

Add tests for funding city 2/3 rather than the capital, independent queues, and increasing capacity before founding another city.

## H. Treasury and recruitment balance

Required behavior:

- A permanent unit must cost meaningfully more than a ten-turn contingent. As a default balance rule, permanent purchase price should be at least about twice the temporary equivalent unless a unit has a documented exception.
- Display `permanent` versus `N turns` prominently, including remaining duration after hire.
- Temporary units must expire/return cleanly without corrupting stacks, routes, selection, or saves.
- Allied contingent offers must regenerate on a cooldown rather than becoming permanently empty. Availability should still reflect alliance, trust, ally survival, and military condition.
- Do not let a critically threatened ally sell its last defender. Conversely, a healthy ally should eventually restock.
- Keep healing as a valid gold sink. Ensure one click performs one purchase on the currently selected damaged unit and cannot accidentally repeat each turn.
- AI states must use their own gold for emergency healing, military recruitment, and production acceleration through explicit turn-based decisions, not cheats.

Add balance assertions and lifecycle tests for permanent vs temporary prices, contingent restock, expiry, and selected-unit healing.

## I. Stronger AI defense and real competition for world sites

Required behavior:

- AI cities must assess nearby barbarian/enemy threat and prioritize defenders when under-defended.
- AI military units should defend capitals/cities, intercept nearby barbarians, and avoid sending every unit away.
- AI should use available gold and production to recover from losses.
- Preserve personalities, but survival takes priority over flavor when a capital is threatened.
- AI rivals and barbarians must be able to claim relevant finite POIs/sites (ruins, abandoned warehouses, groves, artifacts, camps where appropriate) using the same one-time consumption rules as the player.
- Claimed sites disappear/resolve globally; the player cannot collect an already claimed reward.
- If the claim occurs in explored/known territory, produce a readable world event. Unknown claims may remain undisclosed until later.
- Avoid omniscient pathing beyond the AI's intended knowledge model.

Add deterministic tests for AI defending a threatened city and an AI beating the player to a finite POI.

## J. Diplomacy, trade visibility, and proposal hygiene

Required behavior:

- Do not generate a joint-war request when the recipient is already at war with the target, the proposer already joined that war, or the target is defeated.
- Do not repeat the same unresolved/recent joint-war proposal every few turns.
- Trade proposals require both sides to have `trade`, valid relations, no active route, and no cooldown. Ensure AI research priorities can actually reach trade.
- Diplomacy should show non-secret known information for met states:
  - alive/defeated status;
  - city count and total known population;
  - rough army strength category;
  - whether Trade is known;
  - active treaty/trade-route status.
- This is not a full espionage system. Do not add spies in this milestone.
- When a hostile state reacts to expansion, phrase it as fear/respect/concern rather than `liked expansion`. Keep trust, fear, grievances, and relationship score semantically consistent.
- Ensure AI peace offers are suppressed after defeat and are reasonable during an active war.

Add real turn-driven tests for proposal suppression and trade eligibility rather than directly forcing only the final modal state.

## K. Save, offline, and performance requirements

- Migrate all new fields from older saves and the latest baseline save.
- Save/load must preserve routes, stacks, selected city/unit safely, city capacity, urgent decisions, faction defeat, transferred territory, temporary contracts, POI consumption, and event-panel state where appropriate.
- Bump service-worker cache exactly once in the finished package and include every new runtime file.
- No permanent `setInterval`, recursive animation loop, or sub-second polling.
- Avoid rendering the entire map repeatedly for small modal changes unless current architecture requires it and profiling shows it is acceptable.

## Required test matrix

At minimum add/update Playwright coverage for:

1. Weighted terrain route chooses lower total cost and executes correctly across turns.
2. Movement/defense numbers appear in cell UI and Wiki/help.
3. Three stacked units receive three distinct orders in one turn.
4. Enemy unit selection exposes a legal attack and resolves it.
5. Enemy city capture eliminates the faction, transfers territory/cities, closes diplomacy, and survives reload.
6. World-event panel closes/reopens after collapse and free-play continuation.
7. Urgent decision appears immediately, binds to its source city, and expires/blocks End Turn correctly.
8. Treasury production applies to selected non-capital city.
9. Administrative capacity is visible, expandable, and gates settlement clearly.
10. Permanent and temporary recruitment prices/lifecycles are meaningfully different.
11. Allied contingent market restocks under valid conditions.
12. AI defends a threatened city and spends resources without cheating.
13. AI claims a finite POI before the player and the reward cannot be collected twice.
14. Duplicate/invalid joint-war proposals are suppressed.
15. Trade eligibility/status is visible and produces proposals under real conditions.
16. Existing save, camera, mobile, route, diplomacy, outcome, treasury, and service-worker regressions remain green.

Run:

- `node --check` on every changed JavaScript and test file;
- `git diff --check`;
- the complete Playwright suite.

Record exact passed/skipped/failed counts in the Draft PR. A new test file passing while the full suite is unrun is not completion.

## Completion protocol

When locally green:

1. Update this document with checked completion boxes and any deliberate deviations.
2. Update `PROJECT_HANDOFF.md` with architecture/state changes and remaining limitations.
3. Push the finished branch once.
4. Open one Draft PR with base `prototype/humans-v1` and head `codex/combat-ai-world-stabilization-v1`.
5. In the PR body include:
   - player problems addressed;
   - implementation summary;
   - migrations;
   - files/modules added;
   - exact local test result;
   - honest untested physical-device areas.
6. Do not merge the PR and do not retarget it to `main`.
