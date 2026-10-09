# World generation pipeline research V1

Status: **DESIGN / RESEARCH NOTE — NOT IMPLEMENTATION INSTRUCTION**

Purpose: reduce uncertainty around future Epohi world generation by studying useful structural ideas from Polytopia without copying its map rules, visuals, fixed village model, or assets.

## Why this note exists

Epohi currently allows cities to be founded in many places rather than only on pre-authored village tiles. That means a Polytopia-style "place villages, then decorate around them" model cannot be copied directly.

However, the sequencing idea is valuable:

- generate large-scale geography first where appropriate;
- deliberately shape strategically meaningful regions;
- apply terrain/resource rules after those structural decisions;
- validate fairness/playability at the end;
- use nation/environment profiles as modifiers, not as ad-hoc hard-coded exceptions.

The Epohi adaptation proposed here is to generate **settlement suitability / settlement potential zones** rather than fixed city tiles.

These zones are hidden generation metadata. They do not force the player to build a city there and do not become visible markers by default.

---

# 1. Reference: useful Polytopia concepts

Publicly documented Polytopia map generation is not one universal pipeline.

Typical map generation is described as roughly:

1. capital spawns;
2. villages;
3. terrain;
4. resources;
5. ruins / starfish.

But map types differ.

For Pangea and Continents, large-scale land geography is generated before final village/capital selection. Pangea creates the main landmass first, places villages on valid land, then converts some villages into capitals using spacing and coastal preference. Continents likewise creates landmasses first, then villages, then capitals.

The useful design lesson is not the exact order or percentages. It is:

> Structural geography and strategic settlement logic can be generated in separate passes instead of treating every tile as an independent random choice.

Polytopia also distinguishes:
- map-type geography;
- base terrain ratios;
- tribe-specific terrain/resource modifiers;
- city-adjacent vs outer resource distribution;
- later special-object placement.

Epohi can use the same separation of responsibilities while keeping its own mechanics.

---

# 2. Epohi core difference: cities are not fixed village slots

In Epohi, future city placement should remain a player decision.

Therefore generation should NOT create mandatory hidden "city tiles".

Instead, create a scalar or categorical hidden layer:

`settlementSuitability[x][y]`

Possible conceptual range:

- 0.0–0.2: poor settlement region;
- 0.2–0.4: weak;
- 0.4–0.6: ordinary;
- 0.6–0.8: good;
- 0.8–1.0: excellent.

This value is generation metadata, not necessarily a gameplay stat.

The generator may then shape local terrain around a number of high-potential regions so the world contains plausible places where civilizations could naturally emerge.

The player may still ignore them and settle elsewhere.

---

# 3. Proposed Epohi generation pipeline

This is a design proposal, not final implementation.

## Stage A — world skeleton

Choose:
- map size;
- global map archetype;
- seed;
- broad climate/environment parameters.

Possible future map archetypes:
- balanced land;
- lakes;
- continental;
- pangea-like single landmass;
- archipelago;
- dry inland;
- river-heavy;
- highland basin;
- marsh delta.

Output:
- coarse land/water mask;
- major water bodies;
- broad elevation/noise fields;
- optional climate/moisture fields.

At this stage, do NOT place detailed forests/resources one tile at a time.

## Stage B — geographic structure

Derive meaningful geography from the skeleton:

- coast;
- sea;
- lake;
- future rivers;
- highland belts;
- lowlands;
- wet basins;
- arid areas;
- transition zones.

This should create coherent regions rather than scattered independent tiles.

Important future principle:

`terrain` remains the gameplay identity.

Additional metadata can describe geography and visuals without changing movement/defense rules.

Example:

- terrain = plains
- biome = temperate
- landform = lowland
- moisture = medium
- visualVariant = meadow_03

## Stage C — settlement-potential field

Before detailed terrain/resources are finalized, generate a target number of settlement-potential regions.

The target count should depend on:
- map size;
- intended player count;
- map archetype;
- desired expansion density.

Each candidate region receives a suitability score based on nearby conditions.

Example positive factors for a generic balanced culture:

- fresh water nearby: river or lake;
- coast nearby but not occupying all surrounding land;
- some plains;
- some forest;
- some hills;
- room for territorial expansion;
- nearby resource diversity;
- connection to other land rather than tiny isolated pocket.

Example negative factors:

- almost entirely water;
- continuous mountains;
- huge swamp block;
- dead land concentration;
- tiny peninsula with no expansion space;
- too close to another high-value settlement region.

The generator should avoid producing only perfect sites. Use weighted randomness and a minimum spacing rule.

Conceptual target:

- a few excellent locations;
- more good/ordinary locations;
- many mediocre locations;
- some genuinely difficult regions.

This gives the world texture.

## Stage D — nation/environment affinity influence

Nation affinity should modify **preferences**, not magically rewrite the whole map after generation.

Example:

Balanced/default:
- likes fresh water;
- prefers mostly plains;
- tolerates some forest/hills;
- dislikes extreme swamp/dead land.

Woodland-oriented nation:
- forest penalty becomes smaller or forest becomes positive;
- good sites may contain considerably more forest;
- forest-resource weights increase locally.

Highland-oriented nation:
- hills/mountains become more acceptable;
- valleys next to highlands can score strongly.

Marsh-oriented nation:
- wetlands close to fresh water can become desirable instead of negative.

Coastal nation:
- coast adjacency becomes more valuable;
- sheltered bay / estuary patterns score highly.

Important:
A nation affinity should not necessarily own a completely separate generator.

Prefer:
`global geography + suitability evaluator(profile) + local modifiers`.

This keeps the architecture composable.

## Stage E — detailed terrain realization

Now turn coarse geography into actual gameplay tiles.

Examples:
- plains;
- forest;
- hill;
- desert;
- swamp;
- dead;
- water.

The settlement-potential map may influence local composition.

A high-value generic settlement region might deliberately receive:
- enough plains for early flexibility;
- limited but useful forest;
- limited hills;
- reliable freshwater access;
- resource diversity.

A woodland-oriented preferred zone may intentionally keep much more forest.

This is the Epohi equivalent of generating useful areas around villages/capitals without actually forcing a city tile.

## Stage F — resources / features

Resources should be generated after terrain because terrain constrains valid features.

But resource density should also consider settlement structure.

Possible model:

- background resources across the world;
- higher resource diversity around strong settlement-potential zones;
- nation-profile modifiers;
- scarcity bands / rare-resource regions;
- anti-clumping rules where needed.

Do not guarantee every ideal site every resource.

The goal is to create:
- reasons to settle;
- reasons to expand;
- reasons to trade/fight.

## Stage G — POIs / rare structures

After terrain and ordinary resources:

- ruins;
- caves;
- ancient sites;
- shrines;
- rare deposits;
- future wonders;
- special landmarks.

Placement can use spacing/exclusion rules and may deliberately pull players away from optimal settlement zones.

## Stage H — actual starting positions

Starting civilizations should be selected from or near high-suitability regions, but should not all receive identical starts.

Evaluation should consider:
- minimum distance between starts;
- reachable land;
- comparable opportunity rather than identical terrain;
- nation affinity;
- map archetype;
- nearby expansion possibilities.

A start may be slightly weaker in one dimension but stronger in another.

Do not optimize solely for symmetric fairness unless the game mode explicitly requires it.

## Stage I — final validation / repair

Run validators after all passes.

Examples:
- every start has enough reachable land;
- no start is trapped by water/mountains without intended mechanics;
- minimum distance between civilizations;
- freshwater access if the map/profile expects it;
- resource starvation checks;
- extreme terrain-cluster limits;
- city-potential distribution sanity;
- map connectivity metrics;
- profile-specific expectations.

Repair or regenerate only if invariants fail.

Diagnostics should record WHY a map was rejected.

---

# 4. Settlement potential is NOT a hidden bonus tile

Important design boundary:

The suitability field should initially affect **generation only**.

It should not automatically give:
- extra city income;
- construction speed;
- defense;
- population;
- invisible player bonuses.

It is a world-generation planning layer.

If later we want geography such as fertile valleys to have gameplay bonuses, that should be an explicit visible mechanic rather than a hidden settlement score.

---

# 5. Local settlement archetypes

Instead of one generic "ideal city", settlement candidates can belong to archetypes.

Examples:

### River valley
- fresh water;
- plains;
- farmland potential;
- some forest;
- occasional hills.

### Lake basin
- lake access;
- relatively open surrounding land;
- mixed resources.

### Coastal bay
- coast;
- inland expansion route;
- marine resources;
- limited defensive bottlenecks.

### Forest clearing
- central plains/open tile cluster;
- heavy forest ring;
- wood-rich development path.

### Highland valley
- plains/forest pocket;
- surrounding hills;
- ore potential;
- fewer easy expansion tiles.

### Marsh edge
- dry core;
- nearby wetlands;
- fresh water;
- special resource potential.

### Arid oasis
- mostly dry region;
- concentrated freshwater;
- rare fertile/resource pocket.

These archetypes can later be associated probabilistically with culture/environment profiles.

They should not force city placement.

---

# 6. Suggested deterministic data model

Future conceptual data:

```text
WorldGenerationConfig
  seed
  size
  mapArchetype
  climate
  playerCount

WorldProfile
  terrainWeights
  geographyPreferences
  resourceWeights
  settlementPreferences
  visualThemeId

SettlementCandidate
  center
  archetype
  baseSuitability
  profileSuitability[]
  nearbyWater
  nearbyTerrainHistogram
  expansionSpace
  resourceDiversity
```

Do not treat these names as final API.

---

# 7. Recommended philosophy for Epohi

Generate causes before effects.

Prefer:

1. geography;
2. regions;
3. plausible settlement opportunities;
4. terrain detail;
5. resources;
6. rare content;
7. starts;
8. validation;
9. visuals.

Avoid:

1. roll every tile independently;
2. smooth until it looks acceptable;
3. manually force a few resources around the capital;
4. patch broken starts afterward.

The first approach is more explainable and will eventually support:
- distinct nations;
- map archetypes;
- strategic geography;
- reproducible seeds;
- richer visual regional identity;
- better AI reasoning;
- meaningful player choice about where to found cities.

---

# 8. Open design questions — do not implement yet

1. Does fresh water become an explicit gameplay concept, or remain generation/visual metadata?
2. Should city founding itself have terrain restrictions beyond the existing rules?
3. How many high-potential settlement zones should exist per map size/player?
4. Should players ever be shown settlement suitability, perhaps indirectly through an advisor, or should it remain fully hidden?
5. How strongly should nation affinity change map generation versus merely starting-location selection?
6. Should maps be generated for all nations jointly, or should each civilization's regional influence affect nearby terrain during generation?
7. How much start inequality is desirable in normal play?
8. How should future rivers interact with movement, cities, bridges, irrigation and borders?
9. Should resources exist globally independent of settlement zones, or mostly concentrate around plausible civilization regions?
10. Should named local terrain variants ("pine forest", "old grove", "rocky woodland", etc.) be purely visual, or eventually carry small visible modifiers?

---

# 9. Immediate recommendation

Do NOT implement this pipeline yet.

First:
- compare it against current Epohi mechanics;
- decide which concepts are gameplay and which are generation metadata;
- define 2–3 map archetypes;
- define one BALANCED settlement evaluator;
- define one contrasting profile, e.g. WOODLAND or HIGHLAND;
- manually inspect several generated conceptual examples.

Only after that should implementation replace or extend the existing V1 profile generator.
