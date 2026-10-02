# Epohi rework plan — 2026-10-03

> Branch: `rework/epohi-next`
>
> Canonical fallback: `stable` at `f27fb61aa791a22d2b12420c8e2ed42c234b9b96`
> with tag `stable-2026-10-03-pre-rework`.
>
> `stable` is not modified during rework. New work becomes canonical only after
> explicit visual/playtest approval.

## Why this rework exists

The current canonical build is playable and familiar, but several systems grew through
patch/decorator layers and now feel harder to understand than they should.

The rework goal is not to replace Epohi with a new game. It is to keep the current
visual/game identity while making the core loop more coherent, especially:

- workers and territorial development through worker actions, not city-production spending;
- movement-point terrain costs and pathing clarity;
- city-local food/production for city growth/build queues;
- clear unit/city/tile/camp inspection;
- autonomous orders that reduce repetitive clicks;
- living civilizations and barbarians;
- map generation that creates readable geography rather than accidental terrain blobs;
- UI that reflects the actual rules instead of patching over them.

## Product direction already established

Epohi remains a strategy game about guiding a civilization rather than moving every
piece manually forever.

Target player loop:

1. inspect world, cities, resources and threats;
2. make a few meaningful decisions;
3. choose research, production and territorial development;
4. move important units manually or assign persistent orders;
5. end turn;
6. rivals, barbarians and autonomous units act;
7. receive a concise report of important consequences;
8. adjust plans.

The player should not have to micromanage every unit every turn.

## Stage 1 — Worker action-based development rework

This is the first implementation package.

### Problems in current canonical build

- worker presentation is patched by `humans-worker-learning.js` after the base context UI;
- base worker actions and patched worker actions can disagree;
- current worker UI says projects do not spend city production;
- ownership/payer logic exists in multiple places;
- worker project duration is still indirectly derived from improvement production cost, even though the intended rule is that workers spend their own actions/turns rather than city production;
- improvement ownership/territory and worker project state are not expressed as one coherent rule;
- the worker card is dense and does not clearly answer:
  - what can I build here?
  - how many worker actions will it take?
  - how long?
  - what happens next turn?
  - why is this action disabled?
- autonomous `Develop city` should use the same rules as manual worker actions.

### Working target

A worker develops territory by spending **worker actions / turns**, not city production.

For a manual improvement project:

- target tile must be a legal known tile under the player's territorial rules;
- starting or progressing an improvement does **not** deduct local or global production;
- every improvement has an explicit, data-driven `workerActions` cost;
- a worker contributes at most one project action per game turn;
- the project occupies the worker while in progress;
- a worker cannot gain free extra actions by switching manual/autonomous mode;
- repair uses the same project framework with its own explicit worker-action cost;
- harbor/coastal special targeting uses the same validation path as other improvements.

### First reversible hypothesis for action costs

Do **not** keep deriving build time from mutable production cost.

For the first experiment:

- snapshot the current effective worker-project durations into explicit
  `workerActions` values in data so the rework changes the rule cleanly without
  unnecessarily changing pacing at the same time;
- repair keeps its current explicit action duration unless tests/design reveal a reason
  to change it;
- later balance passes may tune these action counts independently from city-production
  prices used by other systems.

The important rule is fixed for this rework: **worker improvements cost worker actions,
not city production**.

### Worker card / context UI

When a worker is selected, the context panel should show a coherent card:

- worker name;
- current tile / target tile;
- movement/action status;
- current project, if any;
- total worker actions and remaining actions;
- available build/repair actions;
- exact disabled reason.

Do not show or check a city-production payment for worker improvements.

Do not append a second contradictory worker UI through mutation/decorator patches.

The goal is one source of truth for worker presentation.

### Manual and autonomous worker rules

Manual and autonomous workers call the same validator and project-start API.

Autonomous order: **Develop city**

Player selects:

- city;
- priority:
  - food;
  - production;
  - gold;
  - balanced.

Worker then:

- looks only at known/eligible city territory;
- chooses a valid improvement through the same project API;
- spends only its own worker action for project progress;
- does not consume the city's production stock;
- stops on danger or when no sensible target exists;
- explains why it stopped;
- never uses hidden/fogged information.

## Stage 2 — Movement-point and pathing rework

The previously agreed movement direction is:

- plains / field-like open ground: **0.5 movement points**;
- forest: **1 movement point**;
- hills: **1 movement point**.

This is intended to make open terrain meaningfully faster and allow units with a
multi-point movement budget to cross several open tiles in one turn.

Requirements for the movement package:

- movement budgets and terrain costs support fractional values safely;
- path preview and actual movement use the same cost calculation;
- UI shows remaining movement clearly enough that `0.5` steps are understandable;
- manual movement and autonomous/path orders use the same path-cost service;
- no free movement from route cancellation/reselection;
- save/load handles fractional remaining movement;
- tests cover mixed paths such as plains -> plains -> hill/forest.

Other terrain costs (desert, swamp, dead land, roads, water/embarkation) are **not yet
user-fixed**. Audit current rules and choose reversible hypotheses in that later package
rather than silently treating them as settled.

## Stage 3 — City economy coherence

After workers:

- make city-local food and production the explicit source for city growth/build queues;
- keep gold/science empire-wide unless later design changes them;
- keep `Вся империя ↔ конкретный город` resource browsing;
- remove duplicate calculations and patch-only UI;
- ensure settlement ownership and improvement yields clearly feed the correct city;
- preserve save compatibility through explicit migration.

## Stage 4 — Map generation / terrain geography

Current map generation creates terrain by:

1. per-cell random terrain;
2. four smoothing passes;
3. several random-walk hill chains.

This tends to generate very large accidental hill/mountain blobs.

Rework map generation as a separate package after economy/worker coherence.

Target qualities:

- recognizable plains/forest/hill/desert/water regions;
- mountains/hills form intentional ridges, not half-map blobs;
- water forms understandable coast/lake/sea shapes;
- enough passable corridors;
- starting positions remain playable;
- multiple map "personalities" can exist later.

Do not couple visual terrain art to map-generation rules.

## Stage 5 — Living world

Keep and strengthen the existing direction:

- barbarians interact with everyone, not only the player;
- civilizations fight each other;
- settlers found real cities;
- rivals grow cities, build units and improvements;
- different strategic tendencies become visible;
- AI should be capable of progressing toward its own goals, not merely obstructing the player.

## Stage 6 — Inspection and information UX

Keep the useful layer model:

- Unit
- City
- Camp
- Tile

Improve it so selecting/inspecting does not lose the active unit unexpectedly.

Tile inspection should be able to show:

- coordinates;
- terrain;
- owner;
- yield;
- movement cost;
- defense modifier;
- feature;
- improvement;
- point of interest.

City inspection should show local economy and queue.
Camp inspection should show threat/reward information the player is allowed to know.

## Stage 7 — Turn report / autonomy clarity

Turn report should prioritize meaningful changes:

- research completed;
- city project completed;
- city growth;
- important discovery;
- autonomous order completed/stopped;
- attacks/deaths;
- pillage/repair;
- diplomacy change;
- victory/defeat progress.

Avoid movement spam.

Persistent orders must always explain why they stopped.

## Architecture rule for the rework

The previous architecture cleanup direction remains binding:

- gameplay systems separated from UI;
- balance/data separated from algorithms;
- UI renders state and calls explicit system APIs;
- reduce observer/decorator/mutation layers;
- focused tests per system;
- no hidden old UI behavior kept alive only for stale tests;
- tests follow canonical user flows.

Do not rewrite everything at once. Replace one system boundary at a time.

## Validation strategy

Every stage should include:

- focused Playwright tests for canonical user flow;
- save/load/migration coverage when state changes;
- static/syntax checks;
- full smoke before a stage is considered done;
- real visual test on desktop/mobile-sized viewport before promotion to `stable`.

## Promotion rule

`stable` always remains the last user-approved canonical build.

Rework flow:

`stable` -> `rework/epohi-next` -> manual playtest -> approve -> advance `stable`

If a stage is disliked, keep `stable` unchanged and revise/revert the working branch.
