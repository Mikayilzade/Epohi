# NEXT TASK — EPOHI VISUAL CANON V1: PLAYABLE WEB REWORK
Date: 2026-10-04
Status: ACTIVE MASTER BRIEF
Priority: HIGHEST for the next visual implementation package

Repository: Mikayilzade/Epohi
Working branch: rework/epohi-next

## ABSOLUTE SOURCE-OF-TRUTH ORDER

1. The THREE user-provided visual reference images attached to the Orca/Codex session.
2. This document.
3. Current accepted Epohi gameplay behavior on stable/rework baseline.
4. Existing CSS/SVG implementation details.

If an old visual note conflicts with the three current images, the current images win.

The user has already visually approved the direction represented by all three images and
said that essentially any of the shown variants would be acceptable. Do NOT restart art
direction discovery from zero. The goal now is to make the existing playable web Epohi
move credibly toward this exact visual family.

---

# 0. REQUIRED REFERENCE IMAGES

The session MUST contain three images.

IMAGE 1 — TERRAIN / LANDMARK CANON
A professional dark concept sheet titled approximately "Epohi — Terrain & Landmarks".
It contains:
- 4 plains/grassland variants;
- 4 forest variants;
- 4 hills variants;
- 4 mountain variants;
- 4 lake variants;
- 4 sea/water variants;
- ruins;
- mine;
- cave;
- farm;
- warehouse;
- city center.

IMAGE 2 — UNIT CANON
A professional dark concept sheet titled approximately "Epohi — Unit Explorations".
It contains rows of:
- Worker;
- Scout;
- Warrior;
- Archer;
- Settler;
- Barbarian Raider;
with approximately six original variants for each role.

IMAGE 3 — COMPOSITION / IN-GAME TARGET
A polished widescreen Epohi mock gameplay screen showing:
- large painterly/isometric miniature-world map;
- city center;
- farm;
- mine;
- cave;
- ruins;
- warehouse/harbor;
- forests, hills, mountains, water and coast;
- friendly human units;
- hostile raiders;
- dark green/gold top UI;
- compact dark contextual right panel;
- large green End Turn control;
- subtle grid;
- world occupying most of the screen.

If the three images are NOT actually visible to the agent, STOP before visual
implementation and say so. Do not hallucinate that you inspected them.

---

# 1. NON-NEGOTIABLE PROJECT SAFETY

- DO NOT modify branch `stable`.
- DO NOT merge to `stable`.
- Work only on `rework/epohi-next`.
- Pull latest before starting.
- Preserve current accepted worker behavior.
- Preserve current accepted fractional movement behavior.
- Preserve current combat, AI, scenario, city, save and economy behavior unless a
  presentation-only compatibility fix is strictly required.
- Do not redesign game rules in a visual task.
- Do not remove existing content merely because it is difficult to restyle.
- Do not hide broken functionality behind CSS.
- Do not weaken gameplay tests to make visual changes pass.
- Do not replace the web project with Godot, Canvas engine, Phaser, Pixi, Three.js or a
  new framework in this task.
- Do not create a new repository.
- Do not create an unnecessary PR.
- Do not force-push.
- Keep current save compatibility.

The current version is a user-approved playable checkpoint. Visual work must remain
reversible.

---

# 2. CORE VISUAL TARGET

The visual family is:

**stylized hand-painted / sprite-like 2.5D isometric fantasy strategy miniature world**

Desired emotional response:

> "This is a little living world I want to inspect and explore."

NOT:

> "This is a functional grid with prettier CSS."

The target must feel:
- warm;
- handcrafted;
- painterly;
- rich but readable;
- inhabited;
- miniature/diorama-like;
- premium enough to resemble finished game art rather than a debug prototype.

It must NOT primarily feel:
- flat;
- web-app-like;
- spreadsheet-like;
- emoji-driven;
- abstract;
- debug-like;
- sterile;
- military-simulator-like;
- photorealistic;
- neon mobile-RPG-like.

---

# 3. WHAT THE REFERENCES MEAN

## Image 1 is the TERRAIN/LANDMARK CANON

Extract these qualities:
- shallow 2.5D/isometric terrain blocks;
- natural irregular detail inside each logical tile;
- believable grass, flowers, stones and dirt;
- forests made from groups of trees and undergrowth, not a single tree symbol;
- hills visibly elevated by rocks/slopes;
- mountains with clear vertical mass;
- lake/sea surfaces with painterly waves and shoreline cues;
- structures embedded into the world;
- warm natural palette;
- soft directional light;
- compact contact shadows;
- strong silhouette readability.

Do NOT literally copy exact tiles from the reference.
Create original Epohi equivalents in the same broad visual family.

## Image 2 is the UNIT CANON

Extract:
- miniature people, not abstract counters;
- slightly stylized/chunky proportions;
- expressive silhouettes;
- readable tools/weapons;
- painterly clothing;
- compact footprint;
- role immediately visible from pose/equipment;
- small ground/contact shadow;
- characters remain identifiable at tactical zoom.

Worker:
- labor/tool identity;
- axe, pick, logs, basket, cart or similar work cues.

Scout:
- lighter traveler/ranger;
- cloak, pack, staff, bow, lantern or similar exploration cues.

Warrior:
- stronger melee silhouette;
- shield/sword/spear/axe;
- defensive or disciplined posture.

Archer:
- bow must remain obvious at normal zoom;
- lighter ranged silhouette;
- visible quiver where possible.

Settler:
- civilian traveler;
- pack, basket, map, supplies;
- expansion/migration feel rather than combat feel.

Barbarian:
- clearly hostile rough silhouette;
- furs, crude shield/axe/spear;
- visually distinct without becoming grotesque or horror-themed.

## Image 3 is the COMPOSITION CANON

This image has the highest authority for how pieces work together.

Important qualities:
- map dominates the viewport;
- world feels continuous despite underlying logical cells;
- grid is subtle, not dominant;
- forests visually overlap cell boundaries while hitboxes remain understandable;
- mountains and city structures rise above ground;
- waterways/coasts feel like geographic shapes rather than blue spreadsheet cells;
- small humans remain readable without giant labels;
- faction banners/markers are secondary identity aids, not the unit itself;
- dark UI frames the world instead of competing with it;
- right-side contextual panel is compact and premium;
- top resource bar is restrained;
- green/gold/cream UI palette harmonizes with map;
- the full screen reads as a game, not as a web prototype.

---

# 4. EXISTING ARCHITECTURE TO BUILD ON

Inspect before editing:

- `src/humans-visuals.js`
- `styles/humans-art.css`
- `styles/humans.css`
- `styles/humans-responsive.css`
- `src/humans-camera-layout-guard.js`
- `src/humans-strategy-ux.js`
- `src/humans-observer.js`
- current tile/unit rendering code
- relevant visual/context/camera tests

The current code already has a useful separation:
- gameplay state/rules;
- generated SVG visual sprites;
- CSS presentation.

Preserve and strengthen this separation.

The visual renderer must NOT become the owner of gameplay truth.

---

# 5. IMPLEMENTATION STRATEGY: VERTICAL SLICE FIRST

Do NOT attempt a giant uncontrolled "redesign everything" commit.

Implement in ordered stages.

## STAGE A — VISUAL INFRASTRUCTURE

Create/clean a visual-canon layer so assets can be changed without rewriting gameplay.

Requirements:
- stable visual IDs;
- terrain visual registry;
- unit visual registry;
- landmark/improvement visual registry;
- faction presentation variables;
- selection/state overlays remain separate from sprite art;
- logical terrain/unit IDs remain unchanged.

Prefer extending/refactoring `humans-visuals.js` rather than adding another independent
patch/decorator layer.

If splitting it improves maintainability, use a small clear structure such as:
- humans-visuals-terrain.js
- humans-visuals-units.js
- humans-visuals-landmarks.js
- humans-visuals-registry.js

But do NOT split files simply for appearance.

## STAGE B — ONE PLAYABLE REPRESENTATIVE VIEW

Before converting every obscure map object, produce a real playable map view that
credibly approximates Image 3 using current gameplay.

It must include, where the current game state permits:
- plains;
- forest;
- hills;
- water;
- city;
- worker/scout/warrior or equivalent;
- at least one POI/improvement;
- selected state;
- route/movement state;
- right context panel;
- normal top/bottom UI.

The user should be able to launch the existing game and immediately judge the direction.

Do not build a separate fake screenshot-only page as the main deliverable.

## STAGE C — EXPAND COVERAGE

Once the representative slice is coherent:
- remaining terrain types;
- remaining unit roles;
- rivals/barbarians;
- POIs;
- improvements;
- cities/outposts;
- fog;
- pillaged state;
- selected/attack/route state;
- mobile layout.

---

# 6. TERRAIN: DETAILED RULES

## Plains / grassland

Must read as open traversable ground.

Use:
- painted grass mass;
- tiny flowers;
- sparse stones;
- occasional dirt;
- low-height vegetation;
- multiple variants to reduce repetition.

Avoid:
- a flat green rectangle;
- obvious procedural noise;
- one repeated grass glyph.

Target: visually closest to Image 1 grassland family.

## Forest

Must feel like actual woodland.

Use:
- 3–7 tree masses/silhouettes per logical presentation area when scale permits;
- mixed canopy sizes;
- trunk hints;
- shrubs/rocks;
- darker center values;
- multiple forest variants.

Important:
- selected units must remain visible;
- unit may render above some canopy;
- selected unit may get subtle local clearing/outline;
- do NOT solve readability by turning forest back into one icon.

## Hills

Must visibly communicate elevation.

Use:
- exposed rock;
- short slopes/ledges;
- grassy tops;
- soft shadow on lower edge;
- irregular shape.

Hill must not look like mountain.

## Mountains

Use:
- stronger vertical silhouette;
- layered rock;
- occasional snow only where stylistically appropriate;
- trees at base;
- range/ridge-compatible visual language.

Do not make every mountain a gigantic decorative object that hides adjacent units.

## Water

Must look alive:
- wave rhythm;
- tonal variation;
- soft highlights;
- shoreline cues where possible.

Keep animation subtle and cheap.

## Desert / swamp / dead land

Bring them into the same painterly family.
They must differ through:
- value;
- material;
- vegetation;
- silhouette;
not just a background hex/RGB color.

## Terrain repetition

A large map must not reveal a single repeated stamp immediately.

Provide visual variants selected deterministically from coordinate/seed/state.
Do not use nondeterministic Math.random visual changes that make screenshots/replays
visually unstable.

---

# 7. TILE SHAPE / ISOMETRIC ILLUSION

The underlying game may keep square logical coordinates and square hitboxes.

Do NOT rewrite pathfinding or map topology for visual isometry.

Preferred first experiment:
- preserve logical rectangular grid;
- visually reduce hard grid dominance;
- use sprite art with stronger 2.5D perspective;
- allow trees, structures, mountains and people to extend beyond their logical cell;
- use consistent z-index / row ordering;
- introduce subtle diamond/isometric visual cues where they do not break interaction.

A full mathematical isometric projection is NOT required for V1 if it risks gameplay.

What matters is matching the **perceptual result**:
- depth;
- miniature-world feeling;
- terrain continuity;
- vertical objects;
- soft grid.

Do NOT rotate the entire DOM board 45 degrees as a cheap trick if text, hitboxes and
interaction become awkward.

---

# 8. UNIT VISUAL RULES

Units must no longer read primarily as tiny generic symbols.

Each core role needs an original miniature-person SVG/sprite family.

At normal desktop zoom:
- role silhouette must be recognizable;
- tool/weapon must be visible;
- unit must occupy meaningful visual area but not hide the entire tile.

Use:
- consistent light direction;
- consistent ground contact;
- shared painterly outline/shadow logic;
- faction accent;
- state overlay separate from base art.

Do not identify units primarily through letters.

Faction marker/badge can remain as a secondary layer.

## Selected
Use:
- warm soft ground ring;
- gold rim;
- slight sprite lift/glow.

Avoid:
- huge fluorescent box.

## Exhausted / acted
Use:
- modest desaturation;
- pose/overlay/badge;
- never make the unit look dead unless dead.

## Route assigned
Use a compact route-state cue without covering character art.

---

# 9. CITY / BUILDINGS / IMPROVEMENTS / POI

These must look like WORLD OBJECTS.

## City
Target:
- cluster of 2–5 building masses;
- warm roofs;
- central structure;
- tiny banner;
- footprint can extend beyond tile visually;
- population badge remains readable but secondary.

Do not leave city as one flat temple emoji-like symbol.

## Farm
- crop rows/field;
- fence;
- small work prop;
- golden/green cultivated identity.

## Lumber
- stacked logs;
- stump;
- frame/saw/workbench suggestion;
- visually readable as labor site.

## Mine
- rock mouth;
- timber support;
- warm interior light;
- cart/ore hints if scale permits.

## Trading post
- crates;
- canopy/cart/stall;
- exchange/merchant identity.

## Harbor
- pier;
- ropes/crates;
- boat/sail cue;
- actual relation to water.

## Ruins
- broken stone columns/arch;
- vegetation;
- clear ancient-site silhouette.

## Cave
- rock opening;
- dark interior;
- restrained warm glow.

## Warehouse/depot
- building + stacked crates;
- logistical identity.

Do not use pasted UI icons as the final world representation.

---

# 10. UI SHELL

Image 3 is the target mood.

## Top bar
Keep:
- game identity;
- turn/state;
- resources;
but reduce web-dashboard feeling.

Use:
- dark green/black-green base;
- thin warm gold/cream borders;
- restrained shadows;
- serif display heading only where useful;
- clean readable data typography.

## Right context card
Aim for:
- compact;
- dark or parchment variant consistent with target;
- strong selected-unit visual;
- stats in a clean hierarchy;
- terrain context integrated;
- actions clearly separated.

Do NOT overload with raw explanatory text in default state.

Worker verbose help may remain available but should become scannable.

## Bottom action / End Turn
Keep it strong and obvious.
Image 3 green/gold control is a useful direction.

## Panels
Avoid generic browser/web-card look.
Do not add gratuitous gradients/borders everywhere.
Use one coherent material language.

---

# 11. SCALE AND RESPONSIVENESS

The current user tests:
- wide desktop;
- phone;
- map zoom roughly 77% to ~200%.

Visual rework MUST remain useful across this range.

Test at minimum:
- 1280x720;
- 1600x900 or similar wide desktop;
- narrow mobile portrait;
- one short-height viewport.

At 85–100% map zoom:
- terrain class readable;
- city readable;
- units distinguishable.

At ~150–200%:
- art must not look like crude stretched emoji;
- detail should reward zoom.

On mobile:
- do not preserve desktop art by making controls microscopic;
- contextual card must remain usable;
- map remains primary.

---

# 12. PERFORMANCE RULES

Do not trade playability for decoration.

Avoid:
- huge inline SVG duplicated thousands of times;
- expensive blur/filter on every tile every frame;
- continuous per-frame JS redraw;
- massive DOM growth;
- high-cost animations across the full map.

Reuse cached SVG URLs/classes as current code already does.

Prefer:
- sprite registry;
- deterministic variants;
- CSS transforms;
- limited animation on active/selected objects only.

Measure before/after on a typical 28x28 map.

No major interaction lag regression is acceptable.

---

# 13. ASSET POLICY

The three images are references, NOT asset sheets to crop and ship.

Do not:
- crop characters from reference images;
- use the concept board itself as a texture;
- trace exact commercial-game assets;
- download similar copyrighted sprites and insert them;
- claim approximate procedural shapes are "the same assets".

Create original Epohi visual assets.

If you cannot create art of sufficient fidelity:
1. improve renderer/layout to the maximum credible level;
2. create original procedural SVG placeholders in the exact required scale/style family;
3. produce an asset gap list;
4. explicitly state which external/generated art assets are needed next.

Never fake completion.

---

# 14. NO-DRIFT RULES

Stop and self-correct if the implementation starts looking like:
- current grid with slightly different gradients;
- emoji replacement exercise;
- a new dashboard;
- debug board;
- abstract token game;
- medieval parchment everywhere with no world depth;
- giant cartoon units covering tiles;
- realistic 3D;
- pixel art;
- unrelated Civilization clone;
- unrelated Polytopia clone.

The reference images define a specific cozy/painterly miniature-world family.

---

# 15. VISUAL ACCEPTANCE GATES

Do not call V1 successful unless a real playable screen satisfies ALL:

1. Map occupies most visual attention.
2. Plains looks like land, not flat fill.
3. Forest looks like a group of trees.
4. Hill visibly has relief.
5. Water feels materially different from land.
6. City looks like a settlement/building cluster.
7. At least Worker/Scout/Warrior are recognizable as people by silhouette.
8. Player/rival/barbarian identity remains readable.
9. Selected unit is obvious.
10. Route/path is obvious.
11. Terrain remains readable beneath overlays.
12. Context panel looks deliberate and cohesive with map.
13. Normal map view no longer feels primarily like a spreadsheet.
14. At least 85% zoom remains readable.
15. At least 150% zoom still looks attractive.
16. Mobile is not broken.
17. Existing gameplay still works.
18. No significant performance regression.
19. Visuals are original and swappable.
20. Stable branch remains untouched.

---

# 16. FIRST HUMAN REVIEW CHECKPOINT

Do NOT disappear for hours implementing the entire universe before showing a result.

After the first coherent playable vertical slice is ready:
- run it locally;
- open normal Chrome window;
- capture/leave visible one representative gameplay state;
- report to user that visual review is ready.

At that checkpoint, do NOT yet spend time polishing every rare POI.

The user must be able to say:
- yes, continue;
- terrain good, units bad;
- too dense;
- too flat;
- scale wrong;
etc.

Then continue based on feedback.

---

# 17. TESTING

Before changes:
- inspect git status;
- confirm `rework/epohi-next`;
- pull latest.

During/after:
- syntax/static checks;
- focused visual/render tests;
- worker tests;
- movement/path tests;
- save/load smoke;
- scenario/open-map smoke;
- desktop Chromium canonical flow;
- mobile critical flow;
- performance sanity.

Do not spend time running irrelevant historical heavy suites after every tiny CSS edit.
Use dependency-appropriate focused checks, then full regression at package completion.

Do not weaken assertions merely because appearance changed.
Update tests only where they assert obsolete presentation rather than behavior.

---

# 18. DOCUMENTATION

Create/update:

`docs/VISUAL_REWORK_STATUS_V1.md`

Record:
- architecture changes;
- files touched;
- visual IDs/registries;
- terrain coverage;
- unit coverage;
- landmark coverage;
- UI coverage;
- performance notes;
- tests actually run;
- visual gaps;
- human-review questions.

If new generated/original assets are added, document their origin and role.

---

# 19. GIT DISCIPLINE

Work only on:
`rework/epohi-next`

Do not touch:
`stable`

Before commit:
- inspect diff;
- ensure no unrelated files;
- git diff --check;
- run required focused tests.

Prefer coherent commits, e.g.:
- `refactor: prepare visual canon renderer`
- `feat: add painterly terrain visual pass`
- `feat: rework miniature unit presentation`
- `feat: align game shell with visual canon`

Do not merge.

Push working branch after each safe coherent checkpoint.

---

# 20. FINAL GOAL OF THIS TASK

The task is NOT:
"make a few colors nicer."

The task is:
**make the existing real playable Epohi begin to look like the supplied Image 3, using
Image 1 and Image 2 as terrain/unit art direction, while preserving the accepted game
underneath.**

A user opening the branch should immediately notice:
- richer world;
- more depth;
- more human units;
- better terrain;
- better landmarks;
- more cohesive fantasy UI;
- less spreadsheet/debug feeling.

If exact concept-art fidelity is impossible using code-generated SVG alone, say exactly
where the limit is and leave a clean asset-ready renderer instead of pretending the
target was reached.

---

# 21. FINAL RESPONSE FORMAT — RUSSIAN, SHORT AND FACTUAL

Report:
1. branch;
2. commits;
3. what visually changed;
4. what remains placeholder;
5. tests run/results;
6. performance impact if measured;
7. exact local command/path to view it;
8. whether a human visual review is now required;
9. any blocker;
10. next visual package only if this checkpoint is approved.
