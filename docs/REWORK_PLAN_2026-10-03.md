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

- workers and local city development;
- city-local food/production;
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

## Stage 1 — Worker + city-local development rework

This is the first implementation package.

### Problems in current canonical build

- worker presentation is patched by `humans-worker-learning.js` after the base context UI;
- base worker actions and patched worker actions can disagree;
- current worker UI says projects do not spend city production;
- ownership/payer logic exists in multiple places;
- worker project duration, city economy and improvement ownership are not expressed as one coherent rule;
- the worker card is dense and does not clearly answer:
  - what can I build here?
  - which city pays?
  - how much?
  - how long?
  - what happens next turn?
  - why is this action disabled?
- autonomous `Develop city` should use the same rules as manual worker actions.

### Working target

A worker operates for one specific city context at a time.

For a manual improvement project:

- target tile must belong to / be assigned to a player city;
- the responsible city is explicit and deterministic;
- improvement cost is paid from that city's **local production**, never from a global
  production pool;
- project duration is still expressed in worker actions/turns;
- cost and duration are separate concepts;
- exact payment timing (all at start vs reserved/paid in stages) is a reversible tuning
  decision and should be centralized;
- a worker cannot gain free extra actions by switching manual/autonomous mode;
- repair uses the same project framework;
- harbor/coastal special targeting uses the same validation path as other improvements.

### First reversible hypothesis for payment

Use **pay/reserve at project start** for the first experiment:

- project can start only when the city can afford it;
- local city production is deducted once when the project starts;
- canceling a project does not automatically refund in the first experiment;
- this rule is centralized so later partial refund/reservation can replace it.

Reason: it is easy to understand, easy to test, and prevents double spending.

This is a tuning/UX hypothesis, not permanent canon.

### Worker card / context UI

When a worker is selected, the context panel should show a coherent card:

- worker name and current city assignment;
- current tile / target tile;
- movement/action status;
- current project, if any;
- total worker actions and remaining actions;
- responsible city;
- city local production before/after project cost;
- available build/repair actions;
- exact disabled reason.

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
- considers local city production;
- should not spend production if doing so would block an important current city project;
- stops on danger or when no sensible target exists;
- explains why it stopped;
- never uses hidden/fogged information.

The exact "important city project reserve" threshold should be centralized and reversible.

## Stage 2 — City economy coherence

After workers:

- make city-local food and production the explicit source for city growth/build queues;
- keep gold/science empire-wide unless later design changes them;
- keep `Вся империя ↔ конкретный город` resource browsing;
- remove duplicate calculations and patch-only UI;
- ensure settlement ownership and improvement yields clearly feed the correct city;
- preserve save compatibility through explicit migration.

## Stage 3 — Map generation / terrain geography

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

## Stage 4 — Living world

Keep and strengthen the existing direction:

- barbarians interact with everyone, not only the player;
- civilizations fight each other;
- settlers found real cities;
- rivals grow cities, build units and improvements;
- different strategic tendencies become visible;
- AI should be capable of progressing toward its own goals, not merely obstructing the player.

## Stage 5 — Inspection and information UX

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

## Stage 6 — Turn report / autonomy clarity

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
