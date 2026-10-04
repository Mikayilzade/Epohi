# Visual Polish V3 — checkpoint for human review

Branch: `rework/epohi-next`. `stable` was not changed or merged. This pass keeps the accepted game rules and V1/V2 visual direction.

## Completed

- Worker context panel: removed the late `!important` layout conflict. Description now scrolls inside the card, while action buttons stay reachable at 1280×720, 1280×500, 390×844 and 390×600. Worker mechanics remain unchanged.
- Ordinary Wiki unit rows again use compact semantic icons. The Unit Atlas still shares the detailed map art.
- Terrain/resource art: original transparent WebP cutouts add two distinct forest compositions, two distinct hill compositions, one additional swamp composition and two dead-land compositions. Accepted V1 forest/hill art stays as the base. Three genuine forest and hill compositions now precede any supplementary mirroring. Gems have three exposed crystal points embedded in a rocky base; Fish is a smaller, subdued ripple/shoal cue on ordinary water.
- Service worker cache name and precache include all V3 assets and the world-generation module. Seven new 512px WebP assets total 643,870 bytes. No per-cell unique assets, extra map elements, continuous redraws, or new gameplay framework were introduced.
- World generation is extracted into `src/humans-world-generation.js`, with six generic environment profiles and a deterministic seed. BALANCED is the default. Four majority-smoothing passes and long hill walks are gone; restrained forest patches and short profile-specific ridges replace them. The initial 28×28 BALANCED map averages 49.5% plains, 20.7% forest and 11.9% hill **of land**, plus 23.0% water **of all cells** across 1000 seeds.
- Water remains `terrain: "water"`; optional `waterKind` is `coast`, `sea`, or `lake` in generated maps. `river` is reserved and preserved in existing saves, but not randomly generated. Loading old saves infers only missing water semantics. Normal movement, yields, defense and saved terrain IDs are unchanged.
- Seed and profile are recorded on new game state. The URL query `?worldProfile=balanced&worldSeed=339` is a development preview route through normal New Game setup; there is no permanent profile selector in player UI.

## Validation

- `node --check` on changed JavaScript and service worker; `git diff --check`.
- 1000 seeds for each of six profiles: zero invalid maps under terrain/resource/water/start reachability checks, zero regeneration attempts. Detailed per-profile statistics are in `docs/WORLD_GENERATION_PROFILES_V1.md`; run `node tools/world-profile-diagnostics.cjs 100` to repeat.
- Generator-only speed sanity: 100 seeded BALANCED 28×28 maps in about 70 ms in local Node; this is not a browser frame-time benchmark.
- Desktop Chromium (one worker): 24/24 Worker, fractional movement, save, V2 art/inspection and world-generation tests; 7/7 map inspection and basic smoke; 4/4 V2 art/invalidation; 6/6 scenario tests; 10/10 combined desktop/mobile variant and no-full-redraw checks.
- Mobile Chromium (one worker): 19/20 Open Map, scenario, art, Worker layout and profile tests initially passed. The one failure was an obsolete presentation assertion looking for art on the tile base instead of the `::before`/`::after` art layers; that assertion was deliberately updated and passed in isolation. The desktop scenario file then passed 6/6. No gameplay assertion was weakened.
- Initial six-worker desktop run overloaded the local web server and several tests timed out before the start menu. The same 24-test group passed 24/24 with one worker. A separate desktop scenario specialization test passed on rerun and the complete scenario file later passed 6/6.
- Normal Chrome: fresh BALANCED 28×28 Open Map game created at `http://127.0.0.1:8000/?worldProfile=balanced&worldSeed=339`, showing city, units, plains, woods, hills, water, swamp, Gems and dead lands. Leave that review scene open.

## Review boundaries

Please judge terrain density, variety and material coherence in the open Chrome game, especially at approximately 100% zoom. No further art tuning or nation assignment is implied without the human review. River geography, final nation profile bindings and future rare-object art remain separate work. The current review game begins with Scout and Warrior; Worker context was verified in browser fixtures and can be inspected after producing a Worker in the game.
