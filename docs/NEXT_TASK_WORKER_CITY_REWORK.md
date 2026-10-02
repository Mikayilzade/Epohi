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

**Worker action/turn based development rework**

Do not continue into map generation, rival AI or broad visual redesign in this task.

## Required behavior

### 1. One worker-project API

Manual worker actions and autonomous worker development must use one canonical worker
project service.

The service owns:

- target validation;
- legal territory/target resolution;
- explicit worker-action project cost/duration;
- project start;
- project progress;
- completion;
- repair;
- cancellation state if already supported.

UI must not reproduce these rules.

### 2. Worker actions, NOT city production

Worker improvements must not spend local or global city production.

Required rule:

- building/repair progress is paid in **worker actions/turns**;
- each improvement has an explicit data-driven `workerActions` value;
- do not derive worker duration dynamically from production cost after this rework;
- for the first pass, preserve the current effective durations by snapshotting them into
  explicit worker-action values where practical;
- a worker contributes at most one project action per game turn;
- city production remains available for city queues/buildings/units.

Repair must use the same project framework with its own explicit worker-action duration.

### 3. Territory / city assignment context

The worker may be assigned to a city for the autonomous `Develop city` order, but
that city is **not a payer** for the improvement.

Resolve legal territory deterministically:

1. explicit tile owner city when valid;
2. otherwise canonical eligible player territory rule;
3. no silent nearest-city ownership assignment outside legal territory.

Expose city/territory context in project state when useful for autonomy and UI, but do
not use it to charge production.



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
- cityId / assigned city context when relevant
- total worker actions
- remaining worker actions
- started turn
- worker-action cost snapshot/version where needed

Do not store or charge a local production payment for worker improvements.

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
- total/remaining worker actions
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
- avoid invalid targets;
- spend only worker actions/turns for improvement progress;
- never consume city production for improvement projects;
- provide a readable stop/wait reason.

Do not give autonomous workers free actions.

### 8. Resource UI consistency

Keep existing:

`Вся империя ↔ город`

Do not redesign city economy, gold or science in this task.

Important: worker improvement buttons must not be disabled because a city has low
production. City production shown in the resource UI belongs to city economy/queues,
not worker improvement payment.

## Tests

Update/add focused tests for at least:

- manual improvement does not charge local city production;
- global/empire production is not used;
- zero city production does not block an otherwise legal worker project;
- project state contains explicit total/remaining worker actions;
- worker action cost is data-driven and no longer dynamically derived from production cost;
- project duration/progress works across turns;
- repair uses the same worker-action project rule;
- harbor uses the same canonical validator;
- old save workerProject migrates safely;
- worker cannot double-act;
- manual/autonomous switching gives no free action;
- autonomous Develop city uses canonical worker-project API;
- autonomy does not use fogged target;
- autonomy does not consume city production;
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
- worker-action cost/duration policy;
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

`feat: rework workers around action-based projects`

Do not merge to `stable`.

## Final response

Short Russian report:

1. what worker logic changed;
2. what UI changed;
3. worker-action project rule;
4. save migration;
5. tests actually run/results;
6. commit SHA;
7. blocker if any;
8. what the next rework stage should be.
