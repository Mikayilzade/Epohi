# Visual Polish V2 — checkpoint for human review

Branch: `rework/epohi-next`. Stable and gameplay rules were not changed.

## Reviewed changes

- City and capital inspection now set their own context portrait. Switching city → unit → tile → city clears the previous portrait first.
- Selection and inspection used to call `renderMap()` or `render()`, replacing all 784 tile buttons on a normal map. The visual decorator then rescanned the new board and reapplied raster/SVG classes. Selection now updates existing tile classes, the visible unit in a stack, and the context card. World mutations still use the authoritative full render. A browser regression checks node identity and unchanged sprite-registry rule count across the city/unit/tile cycle.
- Plains have four coordinate-stable treatments (one V1 and three V2 cutouts); swamps have two V2 cutouts and deterministic mirroring. Fish, gems, wheat and ore now have world-integrated SVG artwork.
- The existing ruins and farm art remain. V2 adds original cutouts for grove, old mine, depot, caravan, cave, tower, temple, lumber site, built mine, trading post and harbor. The old mine and built mine have distinct assets.
- Wiki now includes **Атлас юнитов** with eight visual IDs and status labels. It calls the same `EpohiHumansVisuals.decorateUnit()` registry as the map. Ordinary Wiki unit cards use that registry too. Worker and movement wording was corrected to match worker actions and fractional movement.
- Sixteen new transparent WebP assets total 1,198,132 bytes. Source PNGs were transcoded to 512-pixel WebP for mobile/offline cache size. The service worker cache name was bumped and its precache includes the new assets and atlas module.

## Intentionally carried forward

Forest, hill and water art, Scout and Warrior raster art, broad UI palette, logical map and game mechanics. Settler, Archer, Spearman, Barbarian and Rider are shown in the atlas for visual review. Rider remains explicitly **LEGACY**; Archer is visual only and marked **PLACEHOLDER**.

## Verification

- `node --check` for changed JavaScript and service worker; `git diff --check`.
- Desktop Chromium: 25/25 focused worker, movement, inspection, visual invalidation and V2 tests; 6/6 Open Map, art and observer tests.
- Mobile Chromium: 9/9 V2, Open Map, art and critical viewport tests.
- Normal desktop Chrome: opened the existing playable local game at `http://127.0.0.1:8000/`, inspected the Unit Atlas and resumed a 28×28 Open Map save. The live world showed V2 swamp, POI and improvement assets.
- Selection retains all map tile nodes, does not append sprite registry rules and stays below 100 map DOM mutations across a four-step city/unit/tile/city cycle in the 28×28 regression. This addresses the observed full-map redraw mechanism; no frame-time benchmark against V1 was available.

Next action is human visual review. No V3 art changes should be inferred from this checkpoint.
