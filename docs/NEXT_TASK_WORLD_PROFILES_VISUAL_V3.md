# NEXT TASK — WORLD PROFILES + VISUAL COHERENCE V3
Date: 2026-10-04
Branch: rework/epohi-next
Human review follows Visual Polish V2.
Expected work window: ~2–3 focused hours.
Do not touch stable. Do not merge.

## 0. PURPOSE

This is not another broad visual redesign.

The first two visual passes proved the target art direction can work in the real web game.
V3 should make the world coherent enough that the art and the map-generation logic support
each other instead of fighting each other.

The user wants aggressive, useful progress today, but no filler and no speculative
gameplay redesign. Use the available model capacity on high-value architecture, map
generation, focused implementation and verification.

If Orca can delegate, Astra may be used selectively for:
- world-generation architecture review;
- nation/environment profile design;
- contradiction/risk review;
- difficult root-cause reasoning;
- final cross-system audit.

Do NOT spend Astra on trivial syntax edits, repetitive CSS or routine test execution.
Do not have multiple agents edit the same files concurrently.

---

# 1. HUMAN REVIEW — ACCEPTED / REJECTED

## KEEP / FREEZE

The user likes and wants to preserve:
- overall painterly miniature-world direction;
- current forests visually;
- current hills visually;
- current water visually;
- Scout art;
- Warrior art;
- Worker art itself;
- city/capital art added in V2;
- farm art;
- overall dark-green / cream / gold shell.

Do not restart those from scratch.

## USER-REPORTED PROBLEMS

1. Worker context/menu is awkward:
   - content can be clipped;
   - scrolling is poor;
   - at high zoom / short viewport the actions are hard to use;
   - card should open and scroll cleanly.

2. Some Wiki/Atlas icon treatment is inconsistent:
   - high-quality current Worker/Scout/Warrior art is good;
   - some other units remain crude LEGACY/PLACEHOLDER and visually do not belong;
   - ordinary Wiki prose still uses old simple semantic icons.
   User is not demanding that all inline Wiki icons become painterly art.

3. Current map has too much forest and too many hills.
   It is beautiful as a strong regional identity, but not acceptable as the neutral
   default for every nation.

4. The generator needs explicit support for nation/culture environment profiles,
   conceptually similar to games where each people has different terrain/resource
   occurrence preferences.

5. Current data calls every water cell "Побережье" (coast), which is semantically wrong.
   Inland water beside a city should normally read as lake/river rather than coast.

6. Gems still look too much like an ordinary stone/mineral lump.
   They need a clearer valuable-crystal identity without becoming a giant UI gem.

7. Dead lands need a full visual rework.

8. Swamp still does not belong convincingly to the forest/hill/water art family.

9. Fish must be understood as a feature/resource on water, not as a different terrain.
   Visual difference between water with and without fish should be subtle and world-integrated.

10. Repetition is visible in forest/hill art.
    User asked whether the visible variety is real art variety or just rotation/flips.

---

# 2. VERIFIED CURRENT IMPLEMENTATION FACTS

These are facts from the current code and should guide the work.

## 2.1 Current terrain definitions

src/data.js currently defines gameplay terrain IDs:

- plains
- forest
- hill
- water
- desert
- swamp
- dead

Gameplay movement/defense/yields are attached to these IDs.
Do NOT change those gameplay values in this visual/world-generation task.

Current water is one gameplay terrain:
- id: water
- display name: "Побережье"

That display model is too coarse.

## 2.2 Current features

Features are separate from terrain:
- wheat
- ore
- gems
- fish
- ruins

This is the correct conceptual direction.

Fish should remain:
terrain = water
feature = fish

Do not create "fish water" as a separate terrain type.

## 2.3 Current map generator is in app.js

Current generateMap(size):

Initial random distribution:
- water: ~16% interior, plus strong edge-water override;
- plains: ~29%;
- forest: ~21%;
- hill: ~16%;
- desert: ~12%;
- swamp: ~3%;
- dead: ~3%.

Then:
- 4 neighborhood-smoothing passes tend to grow dominant local terrain clusters;
- after smoothing, several long random walks forcibly paint hill cells;
- on a 28×28 map this creates multiple long highland chains;
- a fixed center/start pattern then overwrites the starting neighborhood;
- resources are placed by terrain probabilities;
- POIs are placed later.

This explains the human-observed forest/hill dominance.

Do not treat this as merely a sprite-density issue.

## 2.4 Current visible forest/hill art variation is weak

humans-canon-art.js has four procedurally generated SVG variants.

However the visible raster layer in styles/humans-art.css currently uses:
- ONE forest-cluster raster asset for forest;
- ONE hill-relief raster asset for hills;

and data-canon-variant mostly changes:
- horizontal flip;
- slight scale.

Therefore the user's "windmill / repeated rotated shape" observation is valid.

V3 must distinguish:
- logical terrain distribution;
- art-variant selection.

Do not solve one by abusing the other.

---

# 3. ARCHITECTURE PRINCIPLE — THREE SEPARATE LAYERS

V3 should establish or preserve three separate concepts.

## Layer A — gameplay terrain

Stable gameplay IDs:
- plains
- forest
- hill
- water
- desert
- swamp
- dead

These own:
- movement;
- passability;
- defense;
- yields;
- improvement eligibility.

Do not multiply gameplay terrain IDs merely for visual labels.

## Layer B — geographic / biome metadata

Optional metadata may refine meaning without changing gameplay rules.

Recommended examples:
- waterKind: lake | river | coast | sea
- environmentProfile: balanced | woodland | highland | coastal | marshland | arid
- visualVariant / visualSeed where useful

This layer may influence:
- label shown to player;
- art selection;
- generation;
- resource likelihood.

It must not silently change current movement/economy.

## Layer C — visual variant

Visual-only deterministic choice:
- terrain asset family;
- subvariant;
- small prop overlay;
- composition variant.

Visual variation must never modify gameplay data.

---

# 4. P0 — FIX WORKER CONTEXT PANEL FIRST

This is a usability bug and should be fixed before deeper generation work.

## Requirements

At desktop normal zoom and high browser/map zoom:
- Worker card must fit viewport or scroll internally.
- Header remains understandable.
- Project/progress text remains readable.
- Action buttons must remain reachable.
- Scrolling text must not scroll the whole game accidentally when pointer is over card.
- Avoid two tiny competing nested scrollbars.
- Do not let the action footer disappear below the viewport.

Preferred layout:
- fixed/limited card max-height based on viewport;
- scrollable content body;
- sticky or always-visible action footer where practical;
- responsive reduction of paddings at short heights.

Test at:
- normal desktop;
- 1280×720;
- browser/map view comparable to screenshots around 195–225%;
- narrow mobile portrait;
- short-height desktop.

Do not change Worker mechanics.

---

# 5. P1 — SEMANTIC ICONS VS WORLD ART

Do NOT force painterly miniature sprites into every tiny Wiki sentence.

Establish a deliberate dual-representation rule:

## Semantic UI icons

Use compact symbolic icons for:
- Wiki prose;
- inline stats;
- resource rows;
- tiny rules descriptions;
- compact buttons when appropriate.

They can remain simple if readable.

## World / showcase art

Use painterly canonical art for:
- map units;
- Unit Atlas;
- large context portraits;
- city portraits;
- world terrain/POI/improvements.

This prevents the Wiki from becoming visually noisy.

### Unit Atlas

Keep high-quality canonical art where it exists.

For units not yet redrawn in the correct style:
- DO NOT create another crude pseudo-painterly placeholder just to claim coverage;
- retain/mark LEGACY or PLACEHOLDER clearly;
- keep architecture ready for future art;
- no gameplay claim that a visual-only unit is recruitable.

The user prefers an honest legacy icon over a new asset that is visibly off-style.

---

# 6. P1 — VISUAL COHERENCE FIXES

## 6.1 Gems

Current result is too rock-like.

Desired:
- 2–4 exposed crystal points;
- partially embedded in rock/soil;
- restrained purple/violet/blue accent;
- slight highlight, almost no glow;
- still readable at ~85–100% map zoom;
- must not resemble a huge UI diamond.

Feature remains:
terrain + feature:gems

No gameplay change.

## 6.2 Fish

Fish remains a water feature.

Water without fish:
- normal water art.

Water with fish:
- subtle local cue such as:
  - small ripple;
  - 1–3 fish silhouettes;
  - tiny shoal;
  - slightly brighter disturbed surface.

Avoid a large sticker fish floating above the cell.

## 6.3 Dead lands

Redesign to clearly read as damaged/barren terrain.

Desired cues:
- ash / grey-brown soil;
- cracked ground;
- charred stump / dead root;
- occasional bone/stone;
- sparse/no healthy vegetation;
- low saturation.

Must not look like generic grey floor or a simplistic dead-tree icon.

Provide several deterministic variants if affordable.

## 6.4 Swamp

Bring it into the accepted painterly family.

Desired:
- dark desaturated greens;
- shallow muddy pools;
- reeds;
- moss;
- dead/leaning trees;
- wet ground;
- multiple variants;
- clearly distinct from forest and open water.

Avoid "forest with a filter".

---

# 7. P1/P2 — REAL ART VARIANTS, NOT ONLY FLIPS

The accepted forest/hill art is attractive, but repetition is obvious.

## Rule

Mirroring/scaling may supplement art variety.
It must not be the main source of variety.

For forest:
- create/use at least 3 genuinely different raster compositions if feasible:
  - dense broadleaf cluster;
  - mixed broadleaf/conifer cluster;
  - lower/open woodland cluster;
  - optional old-growth variant.

For hills:
- at least 3 genuinely different compositions if feasible:
  - low rolling rocky hill;
  - broken ridge;
  - high grass/rock shelf;
  - optional craggy transition.

Do not use 180-degree rotation of strongly lit art.
A fixed global light direction must remain believable.

Selection:
- deterministic coordinate/seed hash;
- stable across save/load and redraw;
- avoid identical adjacent variants where reasonably possible.

If producing genuinely good additional raster art cannot be done in the local environment,
do not replace good existing art with worse procedural approximations.
Implement registry support and leave exact asset slots documented.

---

# 8. P2 — WATER SEMANTICS WITHOUT BREAKING GAMEPLAY

Current problem:
all `terrain: water` displays as "Побережье".

Fix this without splitting gameplay terrain yet.

## Recommended compatibility model

Keep:
`tile.terrain = "water"`

Add optional:
`tile.waterKind`

Allowed values:
- coast
- sea
- lake
- river

Old saves without waterKind remain valid.

## Classification / generation logic

Minimum viable implementation:
- water component connected to map boundary = marine component;
- marine water adjacent to land = coast;
- marine water not adjacent to land = sea;
- enclosed water component = lake.

River:
- implement only if a coherent narrow connected generation rule can be added safely;
- otherwise establish schema/support and leave actual river generation for a later package.
Do not fake rivers by randomly relabeling isolated water.

## UI labels

Use:
- Побережье for coast;
- Море for sea;
- Озеро for lake;
- Река for river.

Gameplay movement/yields remain current water values for now.

## City/start sanity

A starting city should not describe a random inland water neighbor as "coast" unless that
water is actually marine.

Do not guarantee every city has water.
Do not change city rules in this package.

---

# 9. P2 — WORLD GENERATION REFACTOR

The current generator inside app.js has accumulated too many responsibilities.

Prefer extracting a pure world-generation module if it can be done safely.

Suggested boundaries:
- src/humans-world-profiles.js
- src/humans-world-generation.js

or equivalent names that fit the project.

app.js should orchestrate, not own all terrain algorithms.

## Generator pipeline

Prefer a staged pipeline:

1. choose profile/config;
2. generate land/water geography;
3. classify water bodies;
4. assign land terrain using profile weights;
5. shape/cluster terrain with controlled smoothing;
6. add limited highland ridges;
7. apply start-zone constraints;
8. place terrain-compatible resources;
9. place POIs;
10. validate playability and profile diagnostics.

Do not keep blindly applying four global majority smoothing passes if they create excessive
homogeneous blobs.

Do not keep painting long hill random walks with no profile limit.

---

# 10. NATION / CULTURE ENVIRONMENT PROFILES

The user explicitly wants infrastructure comparable in spirit to strategy games where
different nations/peoples have different terrain/resource occurrence biases.

Do NOT invent final lore/nation names yet.

Implement generic reusable environment profiles first.

Suggested provisional profiles:
- balanced
- woodland
- highland
- coastal
- marshland
- arid

These are architecture/test profiles, not final civilizations.

## Example concept

Each profile can centrally define:
- land terrain weights;
- water preference;
- cluster tendency;
- highland ridge count/length;
- forest cluster preference;
- swamp preference;
- resource modifiers;
- start-zone preference/avoidance;
- optional visual-biome family in future.

All values must be centralized data, not scattered conditionals.

## Current player

Keep current Ardena/default gameplay on BALANCED unless a user-facing nation choice already
exists and safely maps elsewhere.

Do not silently turn Ardena into woodland/highland.

## Rivals

Architecture should allow each rival civilization to carry a profile ID.

Do not materially rebalance rival gameplay in this task unless necessary to prove the
profile system.

A diagnostic/demo may generate maps for each profile separately.

---

# 11. STARTING HYPOTHESES FOR BALANCED PROFILE

These are reversible starting hypotheses, not final game-design decisions.

The balanced default should visibly reduce current forest/hill dominance.

Target LAND composition after generation, approximate ranges rather than exact quotas:
- plains: 40–50%
- forest: 16–22%
- hill: 10–16%
- desert: 8–14%
- swamp: 2–6%
- dead: 1–4%

Water handled by geography separately.

The generator should not hard-force exact percentages.
Natural map structure matters more than quota precision.

Highland ridges:
- fewer and shorter than current implementation;
- avoid repeatedly crossing/boxing the start zone;
- use profile-specific ridge parameters.

Forest:
- clusters are good;
- giant near-continuous blankets are not the balanced default.

These numbers are provisional and should be easy to tune.

---

# 12. PROFILE EXAMPLES — PROVISIONAL

These values are design scaffolding. Keep them centralized and easy to change.

## balanced
- most plains;
- moderate forest;
- moderate/low hills;
- low swamp/dead;
- normal resources.

## woodland
- forest frequency and cluster size higher;
- grove chance higher;
- plains reduced;
- highlands normal or slightly reduced.

## highland
- hills/ridges higher;
- ore and gems modestly more likely;
- swamp reduced;
- plains still sufficient for playable cities.

## coastal
- stronger marine/water adjacency preference;
- fish higher;
- coastline starts more likely;
- hills somewhat reduced.

## marshland
- swamp and lake frequency higher;
- forest moderately high;
- dry desert/dead reduced.

## arid
- desert higher;
- open plains/steppe higher;
- forest/swamp lower;
- gems/ore can be somewhat higher depending later balance.

Do not overfit these now.
The main goal is data-driven support and visible differentiation.

---

# 13. MAP QUALITY CONSTRAINTS

Every generated normal map should satisfy basic sanity checks.

At minimum validate:
- player start is on passable land;
- useful reachable land exists around start;
- start is not enclosed by hills/forest/water into a tiny pocket;
- no absurd near-solid highland carpet around center on balanced;
- water components classify consistently;
- fish only on water;
- wheat only appropriate land;
- ore/gems obey allowed terrain;
- POIs are reachable or intentionally special;
- no generation loop hangs.

If a candidate map fails, regenerate/repair deterministically within a bounded attempt count.

---

# 14. SEEDED / DIAGNOSTIC GENERATION

For meaningful profile testing, deterministic generation is highly valuable.

If safe within scope:
- add an internal seedable PRNG for NEW map generation;
- use it only in generator code;
- same seed + same profile + same size => same map;
- old saved maps remain untouched.

Do not introduce a visible seed UI unless trivial and clearly useful.

At minimum expose debug/test generation by seed.

This allows:
- regression tests;
- screenshot comparison;
- profile statistics;
- reproducing user-reported bad maps.

---

# 15. GENERATION DIAGNOSTICS

Do not judge profile balance from one screenshot.

Add a lightweight diagnostic/test that generates many maps per profile.

Suggested:
- 100 seeds/profile for quick checks;
- optionally 500 if fast.

Report:
- mean terrain percentages;
- waterKind percentages;
- mean/max largest forest cluster;
- mean/max largest hill cluster;
- start-zone terrain counts;
- resource counts;
- invalid/regenerated maps.

No need for a huge external analytics framework.

The point is to prevent "looks okay on one seed" tuning.

---

# 16. VISUAL + GENERATION INTERACTION

Do not reduce forest/hill visual size just to hide overgeneration.

First fix logical frequency/cluster behavior.
Then tune art density if needed.

Conversely:
do not change logical terrain merely to hide repeated art.
Add true art variants.

Keep these concerns separate.

---

# 17. PERFORMANCE

V2 added raster assets.
V3 must not explode initial load size.

Rules:
- reuse WebP/optimized images;
- no 4K tile assets;
- no unique image file per map cell;
- deterministic registry reuse;
- avoid hundreds of new network assets;
- lazy/deferred load optional art if appropriate.

Measure:
- approximate new asset bytes;
- map render interaction sanity;
- city/unit/tile selection should keep V2 no-full-redraw behavior.

---

# 18. TEST PLAN

Use focused tests during implementation, then one meaningful regression at package end.

Minimum:
- node syntax/static checks;
- git diff --check;
- worker context layout/browser test;
- worker current mechanics regression;
- fractional movement regression;
- city/unit/tile selection no-full-redraw regression;
- water classification tests;
- old-save compatibility without waterKind/profile;
- generation determinism if seed added;
- profile distribution/sanity tests;
- 28x28 Open Map smoke;
- scenario smoke;
- desktop Chromium;
- critical mobile Chromium.

Do not burn time on irrelevant historical heavy suites after every small CSS change.

---

# 19. ORCA / MULTI-MODEL ORCHESTRATION

The user authorizes active work for roughly 2–3 hours today.

Use the time strongly but intelligently.

## Sol / normal coding agent

Best for:
- implementation;
- CSS/UI fixes;
- extraction/refactor;
- tests;
- debugging;
- Git hygiene.

## Astra — use where it adds real value

Astra may be invoked for one or more bounded high-reasoning subproblems:
1. review the proposed world-generation architecture before major edits;
2. critique profile data model and water semantics;
3. inspect the existing generator for hidden compatibility risks;
4. after implementation, audit whether generation/profile logic is internally coherent;
5. diagnose a stubborn root cause if Sol becomes stuck.

Astra output should be concise and actionable.
Store any durable architecture decisions in docs/code, not only chat.

Do NOT:
- run multiple models on the same implementation concurrently;
- have Astra rewrite the entire project;
- duplicate work merely to consume quota;
- spend expensive reasoning on trivial CSS.

If one task is blocked, move to another independent task rather than idle.

---

# 20. TIMEBOX / ORDER FOR TODAY

Suggested order for a 2–3 hour session:

## Block A — ~20–30 min
- pull/check branch;
- Worker panel usability;
- semantic icon vs world-art cleanup;
- focused browser verification;
- commit.

## Block B — ~30–45 min
- gems;
- dead lands;
- swamp;
- fish cue;
- art-variant registry improvement;
- avoid degrading accepted art;
- commit.

## Block C — ~60–90 min
- Astra architecture review if useful;
- extract/refactor world generation;
- environment profile model;
- balanced profile;
- waterKind classification;
- seeded diagnostics if safe;
- tests;
- commit.

## Block D — remaining time
- run generation diagnostics;
- tune only obvious pathologies;
- update docs;
- full focused regression;
- open representative Chrome state for human review.

If Block C is larger than the remaining time:
complete a coherent architecture + balanced-profile slice, document what remains, and stop.
Do not leave half-migrated map generation.

---

# 21. HUMAN REVIEW DELIVERABLE

At the end leave the game open in normal Chrome with:
- a fresh BALANCED map;
- visible plains/forest/hills/water/swamp if possible;
- at least one correctly labelled inland/marine water example if generated;
- Worker panel usable;
- gems/deadland visible if practical;
- no full-map repaint regression.

Also provide a way to inspect profile examples:
- debug command;
- simple internal dev selector;
- test artifact/screenshots;
whichever is cheapest and does not become permanent UI debt.

Do not add a polished user-facing nation selector yet unless it already exists.

---

# 22. DOCUMENTATION TO UPDATE

Create/update:
- docs/WORLD_GENERATION_PROFILES_V1.md
- docs/VISUAL_POLISH_STATUS_V3.md

Record:
- old generator behavior;
- new pipeline;
- profile schema;
- provisional balanced numbers;
- waterKind semantics;
- art variant strategy;
- exact files changed;
- tests;
- asset size impact;
- known gaps.

Update CODEX_NEXT_TASK.md at the end with the next true checkpoint.

---

# 23. GIT

Work only on:
rework/epohi-next

stable must remain untouched.

Before each commit:
- inspect diff;
- git diff --check;
- no unrelated files.

Use several coherent commits rather than one giant opaque commit where practical.

Push after each safe package.

Do not merge.

---

# 24. STOP CONDITIONS

Stop and report rather than invent filler if:
- implementation would require changing core gameplay rules;
- save migration becomes risky;
- river semantics cannot be implemented coherently in the timebox;
- good accepted art would need to be replaced by lower-quality placeholders;
- remaining work is purely speculative until user reviews profile feel.

No USER DECISION NEEDED is currently blocking the infrastructure work.

---

# 25. FINAL REPORT — RUSSIAN, CONCISE BUT COMPLETE

Report:
1. branch and final SHA;
2. commits/packages completed;
3. Worker panel fix;
4. visual fixes (gems/dead/swamp/fish/variants);
5. generator architecture changes;
6. profile model and current BALANCED behavior;
7. waterKind behavior;
8. diagnostics/statistics from generated maps;
9. tests actually run and results;
10. asset/performance impact;
11. local URL / exact way to inspect;
12. what remains;
13. whether any genuine user decision is now needed.

Most important:
Do not optimize for quota consumption.
Use the available capacity to produce durable, tested progress.
