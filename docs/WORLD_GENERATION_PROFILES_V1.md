# World generation profiles V1

Implemented on `rework/epohi-next` in `src/humans-world-generation.js`. These are generic environment test profiles, not nation lore. Ardena and the normal New Game flow use `balanced`.

## Contract

- `EpohiWorldGeneration.generate({ size, seed, profileId, poiIds })` returns `{ map, seed, profileId, rng, diagnostics }`. The same seed, size, profile, and POI IDs yield the same map. If no seed is supplied, a new one is chosen and stored in `state.mapSeed`.
- `createNewGame(size, rivals, barbarianActivity, worldOptions)` keeps its original first three arguments. `worldOptions` may contain `seed` and `profileId`; it stores `environmentProfile` and `mapSeed` in new state. Camp placement uses the generator's RNG, so the initial map including camps is reproducible for a fixed setup.
- `terrain` IDs and their movement, defense, and economy rules remain unchanged. `waterKind` is optional metadata on `terrain: "water"`: boundary-connected water touching land is `coast`, other boundary-connected water is `sea`, and enclosed water is `lake`. Connectivity and shore adjacency use four directions. No rivers are generated; `river` is reserved for coherent future generation and preserved on loaded saves.
- Legacy saves are migrated in place: missing `waterKind` values are inferred without regenerating terrain, resources, POIs, cities, or units. Existing valid water kinds remain intact. `mapSeed: 0` is preserved by save metadata.
- Fish remains `feature: "fish"` on water. Other resource features keep their terrain restrictions. The previously unreachable hill Gems branch is now reachable.
- The generated start keeps a playable plains capital and known nearby worker/resource terrain, without forcing a water tile beside every capital. Limited short ridges avoid the immediate start zone.
- Profile values live in one frozen registry. They define land weights, marine blobs, inland lakes, short ridge count/length, forest patches, and resource scale. `balanced`, `woodland`, `highland`, `coastal`, `marshland`, and `arid` are available. Rivals retain current gameplay; future nation affinity can refer to a profile ID without changing their current starts.

## Cheap diagnostics and preview

Run `node tools/world-profile-diagnostics.cjs 100` (or a larger count). It reports land percentages, water share and kinds, largest forest/hill clusters, center 5×5 composition, resource and POI counts, center-reachable land, invalid maps, and regenerated maps. The current generator does not retry: `regenerated: 0` is explicit.

For a visual test without permanent setup controls, open `http://localhost:8000/?worldProfile=woodland&worldSeed=42` and create a New Game. Change `worldProfile` among the six IDs; remove both query parameters for the normal BALANCED experience. The console API `EpohiWorldGeneration.generate({size:28, seed:42, profileId:'balanced'})` allows read-only inspection.

## Multi-seed reference (1000 seeds/profile, 28×28)

Percentages below are land-only except the water column. Counts are per map averages.

| Profile | Water % of map | Plains % | Forest % | Hill % | Desert % | Swamp % | Dead % | Largest forest | Largest hill | Reachable land | Invalid |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| balanced | 23.0 | 49.5 | 20.7 | 11.9 | 12.3 | 3.8 | 1.9 | 11.0 | 5.1 | 602.1 | 0 |
| woodland | 22.8 | 38.0 | 35.6 | 10.7 | 8.4 | 4.6 | 2.7 | 24.4 | 4.8 | 603.8 | 0 |
| highland | 21.4 | 41.0 | 17.8 | 26.4 | 9.3 | 2.8 | 2.7 | 9.5 | 14.9 | 614.7 | 0 |
| coastal | 34.6 | 48.6 | 22.0 | 10.5 | 11.4 | 4.7 | 2.8 | 11.0 | 4.1 | 510.1 | 0 |
| marshland | 31.1 | 43.6 | 26.1 | 9.5 | 6.7 | 11.3 | 2.8 | 13.1 | 3.6 | 536.7 | 0 |
| arid | 18.0 | 48.2 | 11.2 | 14.7 | 19.3 | 1.9 | 4.7 | 6.6 | 7.0 | 641.5 | 0 |

BALANCED averages per map: `coast 51.6`, `sea 111.3`, `lake 17.4`; center 5×5: plains 10.6, forest 5.7, hill 4.4, desert 2.6, swamp 0.5, dead 0.2, water 0.8; resources: wheat 38.4, fish 32.4, ore 13.5, gems 7.7; POIs 20.0. All six profiles had zero invalid or regenerated maps in 1000 seeds each. These are tuning baselines, not promised quotas.

## Boundary and future work

Generation is deterministic for the new map and initial camps. Later AI turns and gameplay still use their existing randomness. Profile definitions are infrastructure only; nation links, true rivers, and further visual tuning need separate design review. The current map renderer and no-full-redraw inspection path are unchanged.
