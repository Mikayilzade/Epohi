# Playwright change-to-suite selection matrix

## How to use this map

1. Classify the change under `AGENT_TESTING_POLICY.md` first. Documentation-only work remains Tier 0; this matrix does not make it Tier 2 merely because test documentation mentions runtime files.
2. Select the row by **semantic behavior**, not filename alone. Run the minimum suite, then add only neighbors whose shared contract is actually touched.
3. For Tier 2, use Chromium by default. Add WebKit for geometry, responsive layout, CSS, touch/pointer/gesture, ResizeObserver/MutationObserver timing, animation lifecycle, or a known engine-specific regression.
4. Escalate shared/global/high-risk work to Tier 3 full non-soak Chromium + WebKit. Add soak only when repeated turns/cycles, persistence, observers, scheduling, or long-lived simulation can regress.
5. Tier 4 remains the complete cross-browser gate plus required soak from `QUALITY_GATES.md`; exact-SHA green evidence may be reused.

Suite names below refer to the primary domains in `TEST_SUITE_INVENTORY.md`. When a file is named, it is the current cheapest executable unit; future case tags could make the selection narrower.

## Selection matrix

| Change type / source or behavior | Minimum focused coverage | Add neighboring coverage when… | Browser requirement | Expected cost / policy tier | Escalate to full or soak when… |
|---|---|---|---|---|---|
| Documentation/checkpoint only (`*.md`) | Markdown/content checks; no Playwright | Never because of older unchanged runtime commits | None | Tier 0 | Only a separate final gate is explicitly requested |
| CI workflow risk classifier (`.github/workflows/playwright.yml`) | `ci-push-gate.spec.js`; shell/YAML review and static checks | Inspect `playwright.config.js`/scripts if command construction changes | No gameplay browser for pure classifier semantics | cheap, but policy treats workflow as Tier 3 | Current policy requires one full validation for workflow changes; soak if soak routing/commands change |
| Playwright config, package scripts, dependencies | `ci-push-gate.spec.js` plus discovery/list check | Tiny browser smoke if projects, web server, timeout, devices, or invocation changes | Chromium + WebKit | Tier 3 | Always full cross-browser; soak if projects/timeouts/environment for soak changed |
| App bootstrap / global entry (`index.html`, `src/app.js`, `src/config.js`) | smoke/core: `browser.spec.js`, `prototype-baseline.spec.js`, `new-game-settled-lifecycle.spec.js` | Turn/save and affected feature owner when startup state/schema changes | Chromium + WebKit | medium; Tier 3 | Global initialization, script order, state construction, service registration, or ≥4 runtime files |
| Service worker/cache (`sw.js`) | smoke/core load/init plus cache/version static review | Save/load only if storage/offline lifecycle is coupled | Chromium + WebKit | Tier 3 | Always full; release gate must also verify stale assets/migration |
| Pure non-behavioral text/help copy | Relevant UI case only if selectors/layout can change; otherwise no browser | Add layout case if wrapping, truncation, or accessible-name selector changes | Chromium; WebKit only for layout/wrapping | Tier 1 semantic judgment | Shared templates/global localization or selector changes |
| Global CSS, shared DOM, viewport shell (`styles/app.css`, shared `styles/humans*.css`) | camera/layout/mobile + `browser.spec.js:56` | Strategy/context/map inspection for changed component; runtime suite if observer geometry changes | Chromium + WebKit | medium/expensive; Tier 3 for global styles | Shared layout/map transform, multiple panels, global selectors, or responsive breakpoints |
| Component-scoped UI/CSS | Owning feature file and one relevant mobile/layout case | Add context/map inspection if stacking, overflow, hit targets, or selection UI is adjacent | Chromium; add WebKit for responsive/touch/layout | Tier 2 | Change crosses shared sheet/modal/toolbar primitives or global CSS |
| Camera transforms, bounds, storage (`src/camera.js`, `camera-storage.js`) | `camera-2.spec.js` | `humans-art-observer`, pathing explicit invalidation, stack/inspection when hit testing or centering changes; camera layout guard for resize observers | Chromium + WebKit; WebKit mandatory | medium + neighbors; Tier 3 | Shared camera lifecycle, resize/fit/animation, map geometry, or persisted normalization |
| Camera layout observer/guard | `camera-layout-guard-runtime.spec.js`, relevant `camera-2` resize/fit case | Runtime observer containment and mobile performance if observer ownership/cadence changes | Chromium + WebKit | medium; Tier 3 | Observer root/subtree, scheduling, repeated resizing; add stability coverage |
| Mobile context/activity/inspection UI | `mobile-context`, `context-review-cleanup`, or `map-inspection` according to owner | Stack re-entry/pathing when selection or route controls change; diplomacy when rival action changes | Chromium + WebKit for layout/input; otherwise Chromium | Tier 2 | Shared context renderer/selectors or global mobile layout |
| Touch/pointer/wheel/gesture/input | Exact camera/pathing/stack/strategy case | Neighbor that consumes the same event or selection state | Chromium + WebKit; WebKit mandatory | Tier 2 or 3 if shared input layer | Event delegation, pointer capture/retargeting, transforms, or shared map input |
| Pathfinding algorithm/terrain/occupancy (`humans-pathing-core`, `territory`) | movement/pathfinding + weighted-route/terrain cases in `combat-world-stability` | Combat/world for attack destinations; autonomy for AI orders; worker/POI cases for target completion | Chromium + WebKit under current Tier 3 policy | expensive; Tier 3 | Shared route cost, passability, occupancy, hidden tiles, or destination semantics |
| Pathing UI / route orders (`humans-pathing-ui`) | `humans-pathing-performance`, `pathing-explicit-invalidation`, `stack-reentry-selection` as implicated | Camera/inspection for centering or hit testing; combat/world for attack completion | Chromium; add WebKit for pointer/layout (normally yes) | medium/expensive; Tier 3 by current policy | Shared route state across turns, pointer retargeting, target ownership |
| Autonomous unit/worker orders (`humans-autonomy*`) | `humans-autonomy.spec.js` | Movement core, combat/world, or workforce according to order type | Chromium + WebKit under current Tier 3 policy | medium; Tier 3 | Shared action budget, end-turn integration, repeated autonomous scheduling; add soak when long-lived |
| Turn pipeline / end-turn lock | `turn-unlock.spec.js`, `browser.spec.js:103` | Every feature whose tick phase changed: diplomacy, world, workforce, autonomy, journey, outcomes; runtime cadence for phase/invalidation changes | Chromium + WebKit | expensive; Tier 3 | Shared phase order, async lock, exception handling, or global state mutation; soak for repeated turns |
| Save/load/autosave/migration (`storage`, `save-utils`, schema) | `browser.spec.js:125`, `turn-unlock`, and owning feature migration case | Camps/living-world/journey/diplomacy/outcomes/workforce for fields touched | Chromium + WebKit | expensive; Tier 3 | Shared serializer/version/migration or multiple schemas; soak when periodic reload changes |
| New-game/world-state construction (`data`, scenario config) | `prototype-baseline`, browser new-game variants, `new-game-settled-lifecycle` | Camps/map inspection/journey when AI count, map objects, scenario defaults, or settled lifecycle changes | Chromium + WebKit | expensive; Tier 3 | Global state shape, map generation, multiple runtime files |
| Victory/defeat/capital/capture state | `humans-outcomes`; relevant capture cases in `coherence-capture-learning`/`combat-world-stability` | Diplomacy/world when defeated ownership/relations change; UI feedback for post-victory actions | Chromium; WebKit for modal/free-play UI | Tier 2 if isolated, Tier 3 if shared outcome/state | Ownership cleanup, global outcome evaluator, capital transfer, save schema |
| Combat resolution / terrain defense / city capture | `combat-world-stability` | Movement/pathfinding for attack routes; outcomes/capture learning for ownership/defeat; diplomacy for memory/war | Chromium; WebKit when capture modal/map input changes | medium/expensive; Tier 2–3 | Shared combat/world coordinator, ownership cleanup, AI action budget |
| Barbarians/camps/world director | `barbarian-camps` or `barbarian-review-fixes` | `living-world` for integrated AI; pathfinding/inspection for visibility or occupancy; save cases for director fields | Chromium; WebKit for rendered inspection/layout | medium; Tier 2 | Shared world/AI turn loop, map generation, persistence; soak for repeated spawn cycles |
| Diplomacy model/AI/relations | `living-civilizations.spec.js` | Event-flow/player-feedback for proposal UI; combat/world for joint war; turn pipeline for AI phase | Chromium; WebKit for proposal/modal interaction | medium/expensive; Tier 2–3 | Shared diplomacy state/migration or end-turn action budget |
| Proposal/event/chronicle/modal UX | `diplomacy-activity-events`, relevant `player-feedback-treasury` | Mobile performance/observer containment if clickability or rerender ownership changes; capture UI if blocking-layer policy changes | Chromium + WebKit | medium; Tier 2 | Shared overlay ownership, event dispatch, global invalidation |
| Strategy UX / map inspection / activity | Owning one of `humans-strategy-ux`, `map-inspection`, `context-review-cleanup` | Mobile context, pathing/stack, camera depending on selection/hit-testing | Chromium + WebKit for input/layout | medium; Tier 2 | Shared selection model, common renderer, camera/map event changes |
| Economy/treasury/production | `player-feedback-treasury` and/or relevant `coherence-capture-learning` | Workforce for city yields; turn/state for tick processing; diplomacy for trade | Chromium; WebKit for treasury/sheet layout | medium; Tier 2 | Shared economy model/data schema, city tick, save state |
| Population/workforce/worker time | `population-workforce`, `resource-worker`, worker cases in `coherence-capture-learning` | Autonomy for worker orders; turn pipeline for yields; city UI for rendering | Chromium; WebKit for city/context layout | medium; Tier 2 | Shared economy/turn tick or persisted population schema |
| Journey/scenario/content/progression | `humans-journey`, affected `prototype-baseline` content case | Outcomes/economy/turn when rewards or decisions mutate those domains; layout for saga UI | Chromium; WebKit for decision/layout UI | medium; Tier 2 | Global content IDs/state schema, new-game defaults, shared progression |
| Visual/map art only | Relevant `humans-art-observer` visual case | Camera/mobile layout and browser stylesheet smoke when dimensions/classes change | Chromium + WebKit for layout/rendering contracts | medium; Tier 2 | Shared map DOM, transforms, responsive styles, observer roots |
| Runtime invalidation / observer ownership | `runtime-invalidation`, `legacy-observer-containment`, `explicit-legacy-refresh-bridge` | Delivery/cadence/startup attribution and owning UI consumer; camera guard when resize involved | Chromium + WebKit | expensive; Tier 3 | Shared scheduler/observer/flush, root ownership, global render cadence; add stability tests |
| Timing/cadence/performance counters | `observer-delivery-latency`, cadence files, startup attribution as directly implicated | `mobile-performance-stability` for real UI survival; turn label/camera guard for changed consumer | Chromium + WebKit | expensive; Tier 3 | Timer/rAF/microtask policy, repeated storms/30 cycles; add soak if turns/cycles accumulate |
| Turn-label render stability | `turn-label-idempotence.spec.js` | Runtime invalidation cadence if render scheduling changed; turn unlock if phase/lock changed | Chromium + WebKit | cheap + possible expensive neighbor; Tier 2–3 | Shared renderer/invalidation or turn pipeline |
| Test-only edit | Changed spec file via `--project=chromium-mobile` | Its mapped neighbors only if fixture/helper semantics changed | Add WebKit when the test/behavior is browser-sensitive | Tier 2 | `tests/helpers.js`, broad fixtures, assertions shared across domains, or ≥4 runtime/test areas |
| Shared test helper (`tests/helpers.js`) | Representative consumers from every helper path | Full suite when usage is broad or selection cannot prove containment | Chromium + WebKit | Tier 3 | Default: full, because helper blast radius is broad |
| Soak driver/invariants (`autonomous-soak.spec.js`) | Short representative soak in changed browser | Non-soak owner suite when invariant/action implementation changes | Chromium long + WebKit short per gate | soak; Tier 2 test-only or Tier 3 runtime | Long matrix for driver/global invariant changes or Tier 4 |
| Final integration/merge/release | Full non-soak suite + required autonomous soak | Quality Gate E migration/cache checks and manual-only evidence as specified | Chromium + WebKit | Tier 4 | Always; reuse exact-SHA valid green evidence rather than rerunning |

## Neighbor rules

Add a neighboring suite only when at least one of these is true:

- the change alters a shared state field read or written by the neighbor;
- the change alters event ordering, ownership, selectors, DOM geometry, hit testing, or lifecycle on which the neighbor relies;
- the direct scenario crosses the neighbor’s boundary (for example route → attack → capture → outcome);
- a regression or historical failure demonstrates that browser/neighbor sensitivity;
- the focused test fails in a way that implicates the neighbor rather than the test environment.

Do **not** add neighbors simply because two specs share setup helpers, both open the same panel, or the PR contains older unrelated changes already validated at the same SHA/range.

## Full-regression escalation rules

Escalate to Tier 3/full Chromium + WebKit when any one is true:

- a known shared/high-risk path from the testing policy changes;
- semantic blast radius crosses several primary domains and cannot be bounded confidently;
- app bootstrap, shared state/save schema, global DOM/CSS, common selectors/helpers, Playwright config, dependencies, or service worker changes;
- camera/map layout, pathfinding core, turn flow, global observers/invalidation, or broad AI/world coordination changes;
- four or more runtime files change, matching the conservative CI rule;
- the available change range or ownership evidence is incomplete;
- focused evidence reveals a systemic rather than local failure.

Full regression means all **non-`@soak`** cases in both configured projects. It is a gate composition, not a primary functional suite.

## Soak escalation rules

Add stability/soak separately when the change can accumulate failure across turns or cycles: autonomous decisions, save/reload repetition, observer/timer/rAF cadence, turn processing, AI/world maintenance, memory/state cleanup, or blocking-layer ownership. Use Chromium long matrix and WebKit representative short matrix as currently defined. Do not use soak as a substitute for focused functional assertions or ordinary full regression.

## Recommended implementation sequence (after review)

1. Add machine-readable primary/secondary tags to cases without renaming or weakening them.
2. Add a small manifest or selector utility mapping source paths and semantic labels to tags; keep semantic override/escalation explicit.
3. Establish CI timing artifacts per case/project, then replace estimated costs with measured bands.
4. Implement and validate the tiny smoke composition, including a way to select only the 0-AI parameterized case.
5. Update the classifier to consume the reviewed map, falling safe to Tier 3 when ownership is unknown.
6. Preserve the existing full cross-browser and separate soak gates throughout migration.
## Automatic CI composition

The workflow passes NUL-delimited Git paths as separate arguments to the selector's deterministic CI mode. CI automatically applies every conditional neighbor that can raise tier, browser policy, full regression, or soak coverage; non-escalating neighbors remain available for explicit semantic planning. This intentionally means component UI uses Chromium + WebKit in CI, while worker/population ownership conservatively selects full cross-browser regression and soak because a path alone cannot distinguish layout, turn-yield, or persisted-schema risk.

Selector output is mapped by a fixed JavaScript adapter rather than executed as shell. Invalid selector output, invalid manifests, missing ranges, unsupported policies, and inconsistent focused/full plans route to static checks plus full Chromium + WebKit and both soak jobs. The `policy-driven` browser value maps conservatively to Chromium + WebKit when focused coverage is requested. Tier 3/full plans never also schedule the focused matrix.
