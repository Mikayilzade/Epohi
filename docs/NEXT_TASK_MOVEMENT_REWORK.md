# NEXT TASK — Fractional movement and pathing rework

Work only on branch:

`rework/epohi-next`

Do not modify or merge `stable`.

Read first:

- `docs/REWORK_PLAN_2026-10-03.md`
- `docs/REWORK_STATUS_2026-10-03.md`
- `src/data.js`
- `src/player-exploration.js`
- `src/humans-pathing-core.js`
- `src/humans-pathing-ui.js`
- movement/pathing-related tests

## Goal

Implement one coherent package:

**fractional movement costs with unchanged unit movement budgets**

## Fixed user decision for this experiment

Do NOT change unit `maxMoves`.

Current unit movement budgets remain:

- Worker = 1
- Warrior = 1
- Settler = 1
- Scout = 2

Change only terrain movement costs:

- Plains = **0.5**
- Forest = **1**
- Hill = **1**

For this first pass, keep all other terrain costs unchanged unless a correctness bug
forces a compatibility adjustment:

- Desert = 1
- Swamp = 3
- Dead land = 2
- Water remains impassable to normal land units

Do not invent road bonuses or new terrain rules in this task.

## Expected gameplay effect

With unchanged unit movement budgets:

- Worker / Warrior / Settler can traverse up to 2 plains tiles per turn;
- Scout can traverse up to 4 plains tiles per turn;
- Worker / Warrior / Settler can enter one forest or hill tile per turn;
- Scout can traverse up to two forest/hill tiles per turn;
- mixed path example for Scout:
  plains 0.5 + forest 1 + plains 0.5 = 2, so the whole path fits in one turn.

This is the exact first experiment to playtest.
Do not rebalance unit `maxMoves` yet.

## Core requirement: one movement-cost truth

Manual movement, path preview, travel orders and autonomous movement must all use the
same terrain movement-cost service.

Audit existing movement logic and remove/avoid duplicated assumptions such as:
- "one step = one movement point";
- integer-only movement;
- separate preview vs execution costs.

## Manual movement

Manual adjacent movement must:

- allow movement when remaining MP >= destination terrain cost;
- subtract the exact terrain cost;
- preserve fractional remainder such as 0.5;
- allow another legal move in the same turn while MP remains;
- reject movement when remaining MP is insufficient.

Do not round 0.5 values away.

## Pathing / travel orders

Long routes must:

- use the same 0.5 / 1 / 1 costs;
- choose lower-cost valid routes;
- estimate turns using total movement cost, not raw step count;
- preserve fractional movement bank/remainder safely;
- not grant or lose movement when a route is canceled/reassigned;
- not force a unit to stop after a single successful step if MP remains.

If the existing `movementBank` design makes fractional MP awkward or creates hidden
accumulation bugs, simplify it to a clear deterministic remaining-MP model rather than
adding another patch layer.

## Fog / unknown terrain

Current pathing may plan through unrevealed cells without reading hidden terrain.

Preserve that information rule.

When unknown terrain is revealed during execution and the real terrain cost differs
from the planning assumption:
- recalculate safely;
- never overspend movement;
- never use hidden terrain information before reveal.

Keep the current neutral planning assumption for unrevealed terrain unless a clear bug
requires another reversible value.

## Combat / actions

Do not redesign combat in this task.

Preserve existing rule that actions such as attack can consume/end remaining movement
where current combat design already does so.

Do not let fractional movement produce free attacks or extra actions.

## UI

Update movement display and route preview so fractional values are understandable.

At minimum:

- unit inspection may show values like `0.5 / 1` or remaining `0.5`;
- tile inspection displays the new terrain movement cost;
- route preview/ETA must match actual execution.

Avoid unnecessary decimals like `1.0`; display `1` when whole, `0.5` when fractional.

## Save compatibility

Existing saves with integer `moves` remain valid.

Fractional `moves` / route movement state must save and load without truncation.

If any migration is needed for pathing state, keep it backward compatible.

## Tests

Add/update focused coverage for at least:

- Worker/Warrior/Settler with 1 MP can move across two plains tiles in one turn;
- Scout with 2 MP can move across four plains tiles;
- 1 MP unit can enter one forest tile and then has 0 MP;
- 1 MP unit can enter one hill tile and then has 0 MP;
- Scout can execute plains 0.5 + forest 1 + plains 0.5 in one turn;
- a unit with only 0.5 remaining cannot enter forest/hill;
- manual movement preserves 0.5 remainder;
- path preview cost equals execution cost;
- travel order uses fractional costs correctly;
- travel order does not stop after first 0.5-cost step if MP remains;
- route ETA uses cost, not step count;
- cancel/reassign route gives no free movement;
- hidden terrain does not leak information and route recalculates on reveal;
- save/load preserves fractional movement;
- attack/action behavior does not gain extra actions from fractional MP;
- existing worker project behavior remains green.

## Checks

Run the repo's normal syntax/static checks first.

Then focused movement/pathing/exploration tests.

Then relevant smoke/mobile tests.

Run broader Playwright regression only after focused movement tests pass.

Do not weaken assertions just to preserve obsolete integer-only expectations.

## Documentation

Update `docs/REWORK_STATUS_2026-10-03.md` with:

- terrain movement values implemented;
- confirmation that unit maxMoves were unchanged;
- pathing model used after rework;
- any migration/state changes;
- exact tests run/results;
- known playtest questions.

Main playtest question:
**Does Scout movement at 4 plains tiles per turn feel too fast, or is the new open-vs-rough terrain contrast good?**

## Git

Before editing:
- verify branch is `rework/epohi-next`;
- pull latest;
- verify `stable` remains unchanged;
- inspect status.

After:
- inspect diff;
- run tests;
- commit only this movement package;
- push `rework/epohi-next`.

Suggested commit:

`feat: add fractional terrain movement costs`

Do not merge to `stable`.

## Final response

Short Russian report:

1. terrain costs changed;
2. unit maxMoves confirmation;
3. pathing/movement model;
4. UI/save changes;
5. tests/results;
6. commit SHA;
7. blocker if any;
8. what user should manually feel/check in playtest.
