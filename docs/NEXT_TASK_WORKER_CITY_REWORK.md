# NEXT TASK — Worker + city-local development rework

Work only on branch:

`rework/epohi-next`

Do not modify or force-update `stable`.
Do not merge to `stable`.

Read first:

- `docs/REWORK_PLAN_2026-10-03.md`
- `PROTOTYPE_HUMANS.md`
- `src/worker-projects.js`
- `src/humans-worker-learning.js`
- worker-related parts of `src/app.js`
- `src/economy.js`
- `tests/resource-worker.spec.js`
- relevant context/mobile tests

## Goal

Complete one coherent package:

**Worker + city-local development rework**

Do not continue into map generation, rival AI or broad visual redesign in this task.

## Required behavior

### 1. One worker-project API

Manual worker actions and autonomous worker development must use one canonical worker
project service.

The service owns:

- target validation;
- responsible/payer city resolution;
- affordability;
- project duration;
- project start;
- project progress;
- completion;
- repair;
- cancellation state if already supported.

UI must not reproduce these rules.

### 2. Local city production

Worker improvements use the responsible city's local `production`.

Do not use empire/global production.

First reversible hypothesis:

- full production cost is deducted when project starts;
- insufficient local production blocks start;
- no automatic refund on cancel for this first experiment.

Centralize this payment policy so it can change later.

Repair should also have a local production cost defined in one place.

### 3. City responsibility

Resolve the responsible city deterministically:

1. explicit tile owner city when valid;
2. otherwise eligible territorial city according to canonical territory rule;
3. no silent nearest-city fallback if that would assign a tile outside legal ownership.

Expose payer/responsible city in project state.

### 4. Project state

A worker project should contain enough explicit state for save/replay/UI:

- type
- improvementId where relevant
- target x/y
- cityId
- total worker actions
- remaining worker actions
- started turn
- paid local production amount / cost snapshot

Do not derive historical paid cost from mutable future balance data.

Provide migration/defaulting for old `workerProject` saves.

### 5. Worker UI cleanup

Replace contradictory patch/decorator presentation with one coherent worker card.

When worker selected, show:

- worker name
- assigned/responsible city
- current/target tile
- action/movement state
- active project
- progress
- local production cost
- city production available
- build/repair choices
- exact disabled reason

Avoid tiny dense text walls.

Do not show base UI saying one thing and patch UI saying another.

Prefer removing/simplifying worker-specific DOM mutation from
`humans-worker-learning.js` rather than stacking another patch on top.

### 6. Actions

Manual actions should cover existing capabilities without regression:

- build valid improvement while standing on tile;
- build harbor through valid coastal rule;
- repair pillaged improvement;
- cannot start another project while one is active;
- cannot act twice in one turn;
- project progress consumes worker availability correctly.

### 7. Autonomous `Develop city`

Do not redesign the entire autonomy system.

Make the existing order use the same worker project API.

Priorities remain:

- food
- production
- gold
- balanced

It must:

- respect fog/known information;
- respect city ownership/territory;
- respect local production affordability;
- avoid invalid targets;
- avoid starting a project when city production must be protected for an important
  current queue according to a small centralized reserve policy;
- provide a readable stop/wait reason.

Do not give autonomous workers free actions.

### 8. Resource UI consistency

Keep existing:

`Вся империя ↔ город`

For city view, local food/production values must match what worker project logic uses.

Do not redesign gold/science in this task.

## Tests

Update/add focused tests for at least:

- manual improvement charges correct local city production;
- another city's production is untouched;
- global production is not used;
- insufficient payer-city production blocks project;
- project snapshot contains cityId and paid cost;
- project duration/progress still works across turns;
- repair uses same local rule;
- harbor uses same canonical validator;
- old save workerProject migrates safely;
- worker cannot double-act;
- manual/autonomous switching gives no free action;
- autonomous Develop city uses canonical API;
- autonomy does not use fogged target;
- reserve policy can make worker wait with a visible reason;
- city resource view displays the same local production value used by worker logic;
- selecting/inspecting worker does not lose selected unit unexpectedly.

Tests must target current canonical UI behavior, not obsolete hidden buttons or
decorator assumptions.

## Checks

Run:

- JS syntax/static checks used by repo;
- focused worker/resource/context tests;
- save/migration tests;
- smoke tests;
- only then broader Playwright suite if focused tests pass.

Do not weaken assertions to preserve obsolete behavior.

## Documentation

Add a concise checkpoint to a rework status doc describing:

- old worker behavior removed;
- canonical worker API;
- local production policy;
- migration;
- tests;
- remaining known UX issues.

## Git

Before editing:

- verify branch is `rework/epohi-next`;
- verify baseline matches the canonical stable snapshot ancestry;
- inspect git status.

After:

- inspect diff;
- commit only this package;
- push `rework/epohi-next`.

Suggested commit:

`feat: rework workers around city-local development`

Do not merge to `stable`.

## Final response

Short Russian report:

1. what worker logic changed;
2. what UI changed;
3. local production/payment rule;
4. save migration;
5. tests actually run/results;
6. commit SHA;
7. blocker if any;
8. what the next rework stage should be.
