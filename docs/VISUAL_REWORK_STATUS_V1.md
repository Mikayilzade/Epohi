# Epohi visual canon V1 — working checkpoint

## Starting architecture (2026-10-04, `564b118`)

- `src/app.js` owns the 28×28 logical map, tile buttons, hit targets, object spans, selection and context actions. Its `renderMap()` rebuilds the board without changing terrain or movement rules.
- `src/humans-runtime-invalidation.js` calls `EpohiHumansVisuals.decorate()` after a map render. `src/humans-visuals.js` maps stable gameplay IDs to generated SVG, caches SVG data URLs and CSS sprite classes, and assigns those classes to existing tile/object elements. No extra observer is needed.
- Current visual groups are terrain (`plains`, `forest`, `hill`, `water`, `desert`, `swamp`, `dead`), units, features, improvements, POIs and city/camp/outpost objects. Tile variation currently rotates one stamp across four coordinate variants. Several objects still have a small emblem silhouette.
- `styles/app.css` defines square hitboxes and the CSS grid. `styles/humans.css`, `styles/humans-art.css`, `styles/humans-runtime.css` and the short-screen responsive sheet layer the visuals. The painted terrain currently sits in `.tile::after`; units/buildings are child spans. Selection and route classes come from gameplay/pathing code and remain separate from the sprite art.
- `src/camera.js` and `src/app.js` control pan/zoom through a transform on `#map`; `src/humans-camera-layout-guard.js` restores saved camera state across screen changes. Desktop moves the context card beside the board at 1100px; mobile keeps it below. These coordinates and hitboxes will stay intact.
- Core scope for the first playable slice: terrain depth and continuity, human silhouettes for worker/scout/warrior, city and common landmark silhouettes, subtle selection/routes, and a restrained green/gold UI shell. Remaining art must be listed honestly for review.

## Progress

- Inspected all three reference images in the user-specified order; Image 3 is the composition target.
- Pulled `rework/epohi-next` to `564b118`; working tree was clean before edits.
- Baseline screenshot was captured before edits at `test-results/visual-baseline.png` (local, ignored). The original board had prominent separated square cells and tiny symbolic units.
- Added `src/humans-canon-art.js`: original SVG terrain, unit and landmark registries, with four coordinate-stable variants per terrain. `humans-visuals.js` resolves those assets by existing gameplay IDs, then adds cached raster cutouts for the first slice. A tile still has one logical hitbox; no path or game state reads artwork.
- Added eight original transparent raster cutouts in `assets/visual-canon-v1/` (13.44 MB total): grass, forest group, raised hill, city, farm, worker, scout and warrior. The SVG registry remains a fallback and a path for unpainted objects. Art is referenced through classes so it can be replaced without changing gameplay code.
- The slice now has overlapping forest/hill silhouettes, sparse meadow details, continuous-base water with shoreline highlights, miniature people/city/farm, a restrained dark-green/gold shell, compact unit portrait in the context card, and slimmer route/selection accents. `sw.js` precaches the new assets under a new cache name.
- Fixed the New Game setup transition so its existing Open Map checkbox appears in a fresh browser. Added a focused test for selecting it before creation.
- Live 28x28 map smoke: 784 tiles, no page errors at 1600x900, 1280x720, 1920x1080, 390x844 and 900x500; no horizontal overflow. Five warmed desktop map renders, including one animation frame, took 24.3, 32.8, 86.5, 59.1 and 67.7 ms in local headless Chromium. This is a responsiveness sanity check, not a before/after benchmark; the pre-edit screenshot was captured without timing. The eight image files add 13.44 MB of cold-transfer payload but are shared among tiles, not duplicated per cell.
- Local checks: JS syntax and `git diff --check`; desktop Chromium 15/15 art/open-map/fractional-movement tests plus 19/19 worker/save/browser smoke; Chromium mobile 13/13 art/context tests. WebKit mobile could not launch because its Playwright executable is not installed locally (infrastructure limitation).
- First vertical slice is ready for human visual review. This is not final art approval.

## After visual review (not started)

- Replace or expand the repeated forest, hill and meadow cutouts with more distinct variants and organic tile transitions if the user approves this direction. The current low-zoom board still shows repeated clumps, especially in dense hill ranges.
- Make original painterly assets for mountains (if/when the map gains a distinct terrain ID), desert, swamp, dead land, other improvements/POIs, archer, settler, spearman, barbarian and rivals. Those use original SVG fallback today; some rare world objects retain small emblem silhouettes.
- Assess offline payload reduction and deeper mobile/short-height polish after art review. Do not revise gameplay or stable to pursue these.
