# NEXT TASK — VISUAL POLISH V2 AFTER HUMAN REVIEW
Date: 2026-10-04
Branch: rework/epohi-next
Base visual commit reviewed by user: 1124158c59efba6619891d84fe5f2f43b9056aba

## PURPOSE

This is a focused second visual pass based on direct human review of the first playable visual canon slice.

Do NOT restart the art direction.
Do NOT redesign already-approved successful pieces.
Do NOT change gameplay rules.
Do NOT touch stable.

The user likes the direction and explicitly approves the current visual treatment of:
- forests;
- hills;
- water;
- scout;
- warrior;
- overall direction of units.

Those elements are now the reference baseline for V2 and should not be casually redesigned.

---

## USER-OBSERVED ISSUES TO FIX

### 1. City context card has no proper city thumbnail

When selecting a city, the right-side context panel does not show a proper city miniature.
In at least one reviewed state, the card visually reused a human/warrior-like portrait instead of a city/settlement miniature.

Required:
- city context card must display the correct city/capital artwork;
- it must not reuse the selected unit portrait;
- if capital and normal city have distinct art, use the correct one;
- preserve existing city actions and data;
- presentation-only fix.

Acceptance:
- select a city;
- card shows city art;
- select a unit;
- card shows unit art;
- switch back to city;
- correct city art remains.

---

### 2. Selecting city then unit causes visible map repaint/redraw

The user notices a visible map repaint when switching selection:
city -> unit
and possibly other context-selection transitions.

This should be investigated rather than hidden.

Goal:
- selecting a different entity should update selection/context state without visually rebuilding/repainting the whole map unless the map state itself changed.

Required investigation:
- identify whether app.renderMap() is unnecessarily called;
- identify whether humans visual decoration is re-running on the full board;
- identify whether raster/SVG class assignment is being reapplied to all 784 tiles;
- verify whether image loading or CSS class recreation causes flashing/repaint.

Preferred fix:
- minimal invalidation;
- update selection/context only;
- redecorate only changed entity/tile where possible;
- preserve gameplay behavior.

Do NOT introduce fragile DOM caching that causes stale state.

Acceptance:
- clicking city -> unit -> tile -> city should not visibly flash/repaint the map;
- no stale selection;
- route/selection overlays remain correct;
- no performance regression.

---

### 3. Plains are too weak / visually underprocessed

The user likes forest/hills/water but feels plains/fields still look much closer to the old game.

Improve plains toward the approved terrain reference:
- richer grass texture;
- small clusters of flowers/grass;
- subtle dirt variation;
- small rocks;
- 3–4 visibly different deterministic variants;
- still visually quiet enough to contrast with forest/hills;
- do not overload them.

Important:
plains must remain the visual resting space of the map.
Do not make them as dense as forest.

Acceptance:
- plains clearly belong to the same art family as current forest/hills/water;
- repeated 28x28 map does not immediately expose one repeated plains stamp.

---

### 4. Swamp does not fit the new forest/hill family

Current swamp remains visually inconsistent.

Redesign swamp in the same painterly miniature-world language.

Desired cues:
- darker desaturated green;
- shallow muddy pools;
- reeds;
- dead/half-dead trees;
- moss/low vegetation;
- slightly misty/wet feel;
- readable separately from forest and water.

Avoid:
- flat teal/green fill;
- simplistic dead-tree icon as the primary identity.

Provide several deterministic variants if practical.

---

### 5. Fish and gems visually break the art direction

Current fish and gem feature symbols are too icon-like and stand out against the painterly world.

Replace with original world-integrated feature art.

Fish:
- small group / ripple / subtle fish silhouettes near water;
- should look like a resource present in the world, not an emoji/sticker;
- do not make it large enough to dominate water.

Gems:
- small mineral outcrop / exposed crystal cluster;
- integrate into terrain;
- use glow very sparingly;
- avoid giant UI-gem appearance.

Also review:
- wheat;
- ore;
- any other feature that still reads as old iconography.

Goal:
all map features should share the same world-art language.

---

### 6. POIs / world landmarks need the visual-canon pass

User explicitly noticed that objects such as grove and mine still look old / unprocessed.

Review ALL current POI types:
- ruins;
- depot / abandoned warehouse;
- grove;
- old mine;
- caravan;
- cave;
- tower;
- temple.

The first pass already has good ruins direction.
Expand the same treatment.

Required visual identity:
- GROVE: sacred/beautiful cluster of trees, possibly light/glow cue, not a plain symbol;
- OLD MINE: old rock/timber entrance distinct from worker-built mine improvement;
- DEPOT: abandoned crates/building;
- CARAVAN: broken/lost wagon/supplies;
- CAVE: rock opening;
- TOWER: ruined/ancient magical tower;
- TEMPLE: visibly different ancient religious ruin.

Do not change POI gameplay behavior.

---

### 7. Improvements need coverage

Review current improvements:
- lumber;
- farm;
- mine;
- trading post;
- harbor.

Any improvement still falling back to old symbolic SVG/icon treatment should receive V1-canon compatible art.

Important:
- worker-built Mine must be visually distinct from POI Old Mine;
- Harbor must read as a waterside construction;
- Lumber must read as an active work site;
- Trading Post must read as commerce, not generic building.

---

## UNIT VISUAL REVIEW / ATLAS

### 8. Add a Unit Atlas to Wiki / visual reference UI

The user wants a place to inspect all unit art without waiting for units to spawn in gameplay.

Current Wiki uses old icons from earlier versions and is not suitable for visual review.

Add a dedicated section inside Wiki/Rules, or a clearly linked visual subview:
**Unit Atlas / Атлас юнитов**

Purpose:
- visual inspection;
- not gameplay modification;
- reusable for future art reviews.

For each known visual type, show:
- large current canonical miniature;
- Russian name;
- internal visual ID;
- status badge:
  - CANON / in gameplay
  - PLACEHOLDER / future
  - LEGACY
- optional one-line role.

At minimum include current player gameplay units:
- Worker / Рабочий;
- Scout / Разведчик;
- Warrior / Воин;
- Settler / Поселенец.

Also show existing visual/future/AI types where present:
- Archer / Лучник;
- Spearman / Копейщик;
- Barbarian / Варвар;
- Rider / Всадник, if current code still contains a rider visual.

Do NOT pretend visual-only units are currently recruitable if they are not.

If Rider still exists only in legacy art, label it LEGACY until redesigned.

The Atlas should use the exact same art source/registry as the map.
Do not duplicate image definitions just for Wiki.

---

### 9. Update Wiki unit illustrations

The normal Wiki unit descriptions currently show obsolete emoji/old visual indicators.

Without rewriting gameplay text:
- replace old unit icons/illustrations with current canonical unit art where practical;
- do not remove useful rule explanations;
- ensure Worker text reflects the current accepted worker-project behavior if the Wiki is outdated.

Any gameplay-text correction must match current implementation; do not invent new rules.

---

## DO NOT REDESIGN THESE IN V2

Unless a bug requires a tiny technical adjustment, preserve:
- current forest art;
- current hill art;
- current water art;
- current Scout art;
- current Warrior art;
- current broad UI palette;
- current movement/worker behavior.

Worker art may be reviewed in the Atlas, but do not redesign it automatically before the user has actually inspected it.

Same for Settler/Archer/Spearman/Rider/Barbarian:
show first where possible, then let user judge.

---

## PERFORMANCE / INVALIDATION

Because the user observed redraw while changing selected entities, performance/invalidation is part of this pass.

Add focused regression coverage for:
- selecting city then unit does not force unnecessary full-world visual regeneration, where testable;
- visual decorators do not append duplicate style/sprite registry state;
- context portrait switches correctly.

Do not optimize blindly.
Measure enough to identify the actual redraw cause.

---

## REVIEW CHECKPOINT

After these changes:
- launch normal Chrome;
- leave a representative map open;
- open Unit Atlas once and verify art;
- test city -> unit selection transitions;
- show plains, swamp, fish/gems and at least several updated POIs.

STOP for human review.

Do not continue into a third art redesign autonomously.

---

## REQUIRED TESTS

At minimum:
- JS/static syntax;
- git diff --check;
- focused visual tests;
- map render smoke;
- city context;
- unit context;
- unit atlas;
- worker smoke;
- fractional movement smoke;
- open map;
- desktop Chromium;
- mobile Chromium critical path.

Do not touch stable.

---

## FINAL REPORT — RUSSIAN, SHORT

Report:
1. branch;
2. commits;
3. fixes completed;
4. which elements are intentionally unchanged;
5. Unit Atlas location;
6. redraw root cause/fix;
7. tests/results;
8. local URL;
9. anything still placeholder;
10. stop for human review.
