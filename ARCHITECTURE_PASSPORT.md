# Epohi architecture passport

Updated: 2026-09-28. Integration target: PR #103 / `codex-qgq4u5`.

## Current audit and completion criteria

The browser loads ordered classic scripts from `index.html`. `src/app.js` is a
2,469-line coordinator containing state creation/migration, save orchestration,
turn rules, AI, rendering and input. Later `humans-*` scripts augment it through
`window.__epohiDebug`, click handlers and DOM observation. `src/data.js` holds much
of the balance data; `src/storage.js` handles IndexedDB and `src/save-utils.js`
handles save records, but orchestration and migration still live in `app.js`.

Architecture cleanup is complete when:

1. A single structured game state owns gameplay truth. `city`/`cities[0]`, UI
   selection, history and overlays have documented roles and no divergent truth.
2. Turn rules, AI, economy, combat and movement accept state/data inputs and do
   not read the DOM, schedule animation, persist, or render.
3. UI dispatches player intent and consumes state/results. Presentation events
   inform UI, logs and sound; they are not needed to calculate game truth.
4. Balance values are grouped by domain and algorithms do not hide tunable
   numbers. Defaults remain immutable during runtime experiments.
5. Save migration, validation, slot rotation and serialization are outside the
   UI coordinator. Existing records remain readable, with format/rules identity.
   Every completed turn has a recoverable autosave at the new turn's start.
6. End Turn has one controlled pipeline and one required UI update path. Extra
   click hooks/observers and redundant full render or history scans are removed.
7. Focused tests cover the extracted systems; desktop Chromium integration and
   repeated-turn checks pass. End Turn timings and save size are compared to a
   baseline before performance claims.
8. No replaced legacy implementation remains active. The passport maps the
   final responsibilities, dependencies, tests and change points.

## Planned boundaries

| System | Inputs and outputs | Current home | Intended dependency |
| --- | --- | --- | --- |
| Game state and migration | snapshot -> valid current state | `state-schema.js`, `save-utils.js`; domain adapters in `app.js` | data definitions and domain migrations |
| Turn simulation | state + rules + random source -> result | `app.js`, `humans-*` | state, data, domain rules |
| World, AI, combat, economy | state slice -> state change/result | `app.js`, some `humans-*` | data and shared pure helpers |
| Save repository | snapshot + slot intent -> records | `storage.js`, `save-utils.js`, `save-service.js` | state migration, browser storage |
| Presentation | state/result -> DOM, animation | `app.js`, `humans-*` | read-only gameplay API |

## Initial risk and sequence checkpoint

- Preserve the current gameplay order and random consumption while extracting
  rules. Tests should compare observed state, not only screen text.
- Measure End Turn before changing render/observer scheduling. Separate CPU
  simulation, render, and save time to identify the actual bottleneck.
- First isolate snapshot creation from the asynchronous save queue and document
  version/slot behavior. Then extract turn phases and consolidate UI triggers.
- Keep the accepted hybrid direction: explicit state-changing operations return
  results; secondary presentation may consume events. A general event bus is
  unnecessary until a concrete cross-system use appears.
- Completion requires no material gameplay change, per-turn recovery, relevant
  focused plus integration tests, and no unexplained End Turn regression.

## Change map and tests

This section is updated after each architectural stage. Current save tests live
in `tests/prototype-baseline.spec.js` and `tests/turn-unlock.spec.js`; observer
and performance tests live in `tests/runtime-invalidation*.spec.js` and
`tests/humans-pathing-performance.spec.js`. `AGENT_TESTING_POLICY.md` sets scope.

### Stage 1: save request identity and shadowed rules

- `app.js` captures game state, campaign identity and parent-turn metadata when
  a save is requested. The asynchronous IndexedDB queue writes that snapshot,
  even if another turn starts before the write. `save-utils.js` now puts
  `gameVersion` beside `schemaVersion` on new records. Existing records retain
  their prior shape and remain loadable.
- Fourteen earlier top-level functions in `app.js` were shadowed by later
  declarations in the same strict IIFE. The earlier bodies were removed. The
  active later implementations remain, including AI, barbarians and production.
- `tests/save-snapshot.spec.js` checks that a delayed save retains the request
  turn, resources, schema and rules version. Desktop Chrome focused checks:
  28/28 across save snapshot, turn unlock, barbarian camps, and combat/world.
- Baseline desktop Chrome, small map, no rivals, three actual End Turn clicks:
  751/535/437 ms, snapshots 48,040-48,128 bytes. After Stage 1:
  663/351/319 ms, snapshots 48,004-48,092 bytes. These are single-run timings
  including browser scheduling/render; treat differences as noise until sampled
  repeatedly. No regression was observed in this short check.

The current UI still owns many gameplay mutations and multiple post-turn
listeners, so the completion criteria above remain open.

### Stage 2: save orchestration boundary

- `src/save-service.js` now owns snapshot capture, queued writes, campaign
  association and three-slot autosave rotation. It receives state and identity
  through explicit functions and emits status codes to the UI; it never reads
  the DOM. `app.js` retains player-facing save controls and maps status codes to
  messages. `storage.js` remains the IndexedDB adapter and `save-utils.js`
  remains the record/validation helper.
- The service is loaded after `save-utils.js` and before `app.js` in
  `index.html`. Save change points: record fields in `save-utils.js`, write and
  rotation policy in `save-service.js`, IndexedDB schema in `storage.js`, and
  UI controls in `app.js`.
- `tests/save-snapshot.spec.js` also checks autosave slots 1/2/3 hold
  consecutive completed turns. Local desktop Chrome: save snapshot and slot
  tests 2/2; save/startup/turn suite 10/10. Three-click End Turn sample after
  extraction: 549/296/318 ms, snapshots 47,963-48,051 bytes. The baseline
  method and noise caveat above still apply.
- CI run `36261809991` at `5d96cc4`: Chromium, soak, static and other WebKit
  jobs passed; WebKit mobile shard 1 failed one camera viewport-fit assertion
  (`tests/camera-2.spec.js:195`, 6.5 px versus <0.01 px). No camera code was
  changed in Stage 2, and desktop impact is not shown. This mobile failure is
  tracked under the PC-first testing policy, not marked green.
- State migration still lives in `app.js`; move it to a versioned state module.

### Stage 3: atomic autosave rotation

- `storage.js` now rotates autosave slot records and writes the new snapshot in
  one IndexedDB readwrite transaction. A transaction abort cannot leave only
  part of a slot shift committed. `save-service.js` asks for rotation but no
  longer copies/deletes the slots itself.
- Local desktop Chrome: save/turn focused tests 6/6. The three consecutive
  autosave slots still contain turns 5, 4 and 3 after four End Turns. Three-click
  End Turn sample: 603/322/346 ms, snapshots 48,037-48,125 bytes, within the
  short-run baseline range. CI run `36262784864` passed all jobs.

### Stage 4: versioned state schema

- `state-schema.js` owns current state validation and normalization of legacy
  city, unit, resource and history fields. `STATE_VERSION` is declared in
  `config.js` and used for new games and migrated snapshots. `app.js` supplies
  the existing barbarian and civilization domain migrations through explicit
  callbacks, retaining their behavior without giving the schema DOM access.
- `city` remains an in-memory alias of the selected capital in `cities` after
  creation/migration. Stage 14 removed its duplicate serialized copy.
- `tests/state-schema.spec.js` checks a legacy scout/resource snapshot,
  versioning and repeat-migration idempotence. Local desktop Chrome: 15/15
  save, prototype and barbarian cases plus schema 1/1. End Turn samples after
  this stage: 1100/411/557 ms and 696/532/269 ms. The second run overlaps
  the prior range; these short samples show scheduling noise and do not prove
  a sustained regression or gain. CI run `36263454395` passed all jobs.

### Stage 5: remove history-driven event rollback

- The core turn used to grant a legacy random resource event; a later
  `humans-worker-learning.js` observer parsed newly added Russian history text
  and reversed that grant. This made the history log an input to gameplay and
  let a visual observer mutate resources after the autosave request.
- Removed the grant and its rollback together. The observed default outcome is
  unchanged: those legacy resource events were cancelled every normal turn.
  This also removes an unnecessary random draw and post-turn history scan.
- `tests/turn-unlock.spec.js` covers turn 5 with deterministic random input and
  an existing history line: the next turn must not manufacture another legacy
  resource event. Local desktop Chrome: turn/save focused checks 7/7 after
  changing the test's click to bypass an unrelated open decision modal.
- Remaining history and event-log readers, including worker-learning production
  experience, still need structured inputs rather than text parsing.

### Stage 6: explicit worker turn phase

- `app.js` calls `EpohiWorkerLearning.processTurn(state)` after resetting unit
  actions and before the single core render and autosave. The worker module
  advances projects and accounts for experience once per turn through this
  entry point. Its `turnValue` MutationObserver and second full core render
  were removed.
- The existing worker test now checks that a completed improvement and cleared
  project are present in autosave slot 1, rather than only in live state.
- Local Chrome: 20/21 desktop checks passed; the one desktop failure was an
  existing mobile-only `flex-wrap: nowrap` assertion exercised at 1280 px.
  The same worker/save test passed at a 390 px viewport. Desktop runtime
  cadence and save snapshot tests passed 4/4. No test or CSS was weakened.
- Other turn-label observers still mutate game state after autosave; their
  phases must move before the snapshot before this boundary is complete.

### Stage 7: urgent decision deadline phase

- `app.js` expires urgent decisions in the turn calculation before saving the
  new turn, then asks the stability view to update after the core render.
  `humans-combat-world-stability.js` no longer observes `turnValue` to mutate
  decisions or trigger a second full core render. The confirmation guard for
  unresolved decisions remains on the End Turn button.
- A focused integration test checks both `status: expired` and the expiration
  event inside the new autosave. Local desktop Chrome: combat/world plus save
  checks 18/18. Three End Turn click samples on a small no-rival map were
  620/313/225 ms versus original 751/535/437 ms; the short samples are noisy
  and include browser scheduling, so no speedup is claimed from them alone.
- CI at Stage 5 (`36264466699`) failed only the existing WebKit mobile camera
  viewport-fit assertion, also seen at Stage 2; 64 other tests in that shard
  passed. Stage 6 CI was still in progress when this checkpoint was written.

### Stage 8: explicit route-order turn phase

- `app.js` now advances route orders after new-turn movement reset and before
  worker projects, presentation and autosave. The capture-phase click hook
  still spends remaining movement before turn calculation. The pathing view's
  turn-label observer now schedules UI only; it no longer advances orders or
  requests another full core render.
- The route test compares saved coordinates and turn with the live unit after
  End Turn. Local desktop Chrome: pathing 8/8, save and runtime cadence 4/4.
- Stage 6 CI (`36264955266`) failed one Chromium mobile camera resize/pinch
  test; its other 64 tests in that shard passed. No camera code changed in that
  stage. The mobile camera instability remains tracked separately.

### Stage 9: explicit capture/research turn phase

- `EpohiCaptureState.processTurn(state)` applies captured technology insight
  and detects fallen cities after route orders, before worker projects and the
  autosave. The capture module no longer observes `turnValue` for gameplay.
  Its existing immediate research-click and capture hooks remain.
- A focused test checks that consumed insight and its event are present in
  autosave slot 1. Local desktop Chrome: 16/17 related checks passed on the
  first run; the new test initially read the prior turn's autosave, then passed
  after waiting for slot 1 to reach turn 2. No game-code failure was found.

### Stage 10: explicit coherence finalization phase

- `EpohiCoherenceFinalize.processTurn(state)` now resolves AI city-capture
  repair, experience, foreign building knowledge, invalid trade proposals and
  worker autonomy before autosave. The `turnValue` observer and deferred
  worker-autonomy repair were removed. Presentation refresh is requested after
  the core render.
- Local desktop Chrome: coherence/capture, save and turn tests 22/22.
- The living-world `processTurn` wrapper and general UI decorator still call
  some of these idempotent repairs. They must be replaced with direct action
  hooks or consolidated at the turn boundary to remove repeated log scans.

### Stage 11: immutable AI production cost calculation

- Removed the wrapper that temporarily overwrote shared
  `UNIT_DEFS[type].cost.production` and restored it in a microtask. The AI
  production queue now asks `EpohiCoherenceFinalize.unitProductionCost(civ,type)`
  for its cost. This keeps balance definitions stable while preserving the
  same 10% discount step.
- Also removed the living-turn wrapper's duplicate coherence pass. The
  explicit finalization phase is the turn owner; the general UI decorator
  still performs some compatibility repairs outside End Turn.
- Local desktop Chrome: coherence, combat/world and save checks 33/33, plus
  an AI queue check 1/1 confirming a cost of 31 while the shared warrior cost
  remains 34.

### Stage 12: outcome state before presentation

- `humans-outcomes.js` now exposes `evaluateState(state)` for game-state
  changes and `presentOutcome(state,result)` for modals and goals. Its public
  `evaluate` remains as a compatibility call for non-turn actions and tests.
- End Turn evaluates the outcome before autosave and presents it after the core
  render. The `turnValue` observer and generic click refresh for the End Turn
  button were removed. A new test reads a military victory from autosave slot
  1 after a completed turn.
- Local desktop Chrome: existing outcome/save/turn checks 15/15; new autosave
  check 1/1 after keeping fixture setup and End Turn click in the same browser
  task so an unrelated deferred outcome refresh cannot preempt the turn.
- Other action-specific outcome checks still use the compatibility `evaluate`
  path; a later pass should have their command handlers call state evaluation
  directly and leave presentation callbacks read-only.

### Stage 13: preserve successor capital on load

- `state-schema.js` no longer unconditionally makes `cities[0]` the capital.
  It selects the living city already marked capital, then the saved active
  city's id, then legacy fallbacks. The selected `city` reference aliases the
  matching object in `cities`, and other capital flags are cleared.
- This fixes a save/load defect after the outcome system transfers the capital
  to another city. Local desktop Chrome: schema, outcomes and saves 13/13,
  including a JSON snapshot round trip with a dead first city and a living
  second capital.
- The legacy `city` field still duplicates a city in serialized snapshots;
  a later schema update should make the active-capital id explicit and keep
  one serialized city collection.

### Stage 14: canonical serialized capital

- Save snapshots now store `cities` and `capitalCityId`; `city` is a runtime
  alias restored by `state-schema.js`. The state and save schema versions are
  6 and 5. Old snapshots with `city` still load, including successor capitals.
  An empty `cities` list retains the legacy city field so terminal saves can
  still be reopened.
- New games and successor-capital promotion maintain `capitalCityId`.
  `save-service.js`, record construction and legacy record import use the same
  serializer. Save request time identity and turn remain intact.
- Tier 3 local desktop Chrome: schema, save snapshot, baseline and outcome
  checks 18/18. Static syntax and diff checks passed. CI result pending push.
- The next architectural risk is gameplay mutation inside UI decorators and
  repeated history scanning. Inventory those call sites before changing the
  non-turn action path.

### Stage 15: coherence refresh is presentation only

- `humans-coherence-finalize.js` no longer runs AI experience accounting,
  foreign-building learning or trade invalidation from its UI decorator.
  Those rules run in its explicit pre-save turn phase. The decorator only
  restores and updates modal controls and suppresses overlapping toasts.
- Tier 3 desktop Chrome: coherence, diplomacy activity and living civilization
  checks 33/34 on the first pass; the new test used an incompatible small-map
  rival fixture. After correcting that fixture, the new test passed 1/1.
  Existing 33 checks had passed. CI pending publication.
- Stage 14 CI run `36304525399`: Chromium full 3/3, static and all soak jobs
  passed. WebKit mobile failed two camera viewport tests in shard 1 and one
  arrival-at-POI test in shard 3. Those paths were unchanged in Stage 14;
  desktop Chromium and state/save behavior passed. These failures are tracked
  under the PC-first policy rather than reported as green.

### Stage 16: structured production experience

- `production-experience.js` owns the small state operation that increments
  production experience by completed project id. Both player and AI queue
  completion call it directly. The player legacy-building migration is also
  centralized there and remains idempotent. Production events still feed the
  chronicle, but no rule parses their localized text.
- Removed `processExperienceEvents` and `processAiExperience`, their
  per-turn/UI log scans, and their serialized processed-event lists. Old saves
  keep their existing experience counts and the serializer drops obsolete
  scan cursors. There is one active way to count new completions.
- Tier 3 local desktop Chrome: coherence/experience 18/18, save/startup 7/7;
  syntax and diff checks passed. A three-click small-map no-rival End Turn
  sample measured 225/410/183 ms and serialized state 47,609-47,660 bytes.
  The original pre-cleanup sample was 751/535/437 ms with about 48 KB saves;
  these short runs include scheduling noise and do not establish a stable gain.
- Next: eliminate the remaining post-AI city-capture repair that reconstructs
  ownership from a before-turn snapshot and battle log; route capture through
  the battle command instead.

### Stage 17: direct AI city capture

- AI combat now calls `EpohiCaptureState.captureAiCity` on the defeated city
  object. The existing faction-defeat compatibility hook uses that same state
  operation. It transfers the object, applies siege effects, transfers nearby
  territory, finalizes the defender and writes one capture event.
- Removed the before-turn clone of every rival city, the capture-phase End Turn
  listener and `repairAiCityCaptures`, which searched battle-log text/positions
  after the turn to reconstruct lost cities. Capture history is now an output,
  not an input to ownership. The compatibility hook remains for other callers
  of the legacy faction-defeat API; there is one active AI transfer operation.
- Tier 3 local desktop Chrome: battle, capture, diplomacy and outcomes 55/55;
  a randomized coordinate fixture for the new direct-battle check was fixed,
  then the check passed five consecutive runs. Static checks passed. Stage 16
  CI run `36305928887` passed all full Chromium/WebKit, soak and static jobs.
- Next: isolate the End Turn simulation from toast/render/timer/save controls
  while preserving phase order and random consumption.

### Stage 18: one visible turn boundary in the coordinator

- `app.js` now has a single `simulateTurn()` block for the ordered gameplay
  phases. `endTurn()` owns the delay, control lock, toast, render, outcome
  presentation and autosave. Phase order and random consumption are unchanged.
  Removed the unused `grew=false` presentation branch.
- Autosave is requested only when simulation returned successfully. Previously
  the `catch` path still saved a partially calculated turn. A focused browser
  check forces a simulation exception and verifies that controls unlock while
  no autosave request occurs.
- Tier 3 local desktop Chrome: save/outcome/coherence/turn checks 34/35 on the
  first run; the added test had been nested accidentally in a different test.
  After fixing test placement, turn suite 6/6 passed. Static checks passed.
- `simulateTurn()` is still in the app closure and some domain adapters still
  access browser globals. The next steps are to move concrete rules into
  state/data modules and make their presentation effects explicit.

### Stage 19: city economy rule and scenario form repair

- `economy.js` now calculates player-city income from state and balance data;
  `data.js` groups its base yields, young-city penalty, minimum production and
  settlement yield under `CITY_ECONOMY`. `app.js` delegates through its existing
  `cityIncome` API, so gameplay and UI read the same rule. Removed unused
  `rivalIncome` code from `app.js`.
- The new-game preset decorator used to reapply the default preset when it
  mounted, sometimes replacing a player's already selected small map with a
  normal map. Initial mount now reflects current controls; explicit preset
  changes still apply values. The affected scenario test passed five repeated
  runs after the fix, then the related economy/save suite passed 31/31.
- A WebKit mobile CI failure at Stage 18 read autosave slot 1 before the
  asynchronous new-turn write completed. Its test now waits for the turn-2
  record before inspecting the decision. The focused test passed five repeated
  local desktop runs. Stage 18 CI also failed known mobile camera cases; full
  desktop Chromium shards 2/3 passed, shard 1 failed only a mobile camera case.
- End Turn three-click small-map no-rival sample after this extraction:
  413/446/232 ms versus Stage 16's 225/410/183 ms and original baseline
  751/535/437 ms. One run per stage varies substantially; no performance
  gain or regression is claimed from these numbers.

### Stage 20: capture choice advances synchronously

- Resolving a captured city now checks for the next fallen city in the same
  explicit choice handler. Removed the `requestAnimationFrame` gameplay pass
  from `humans-capture-state.js`; no animation frame decides whether another
  capture becomes pending. Existing pathing and End Turn calls still invoke
  `checkFallen` directly at their command boundaries.
- Tier 3 local desktop Chrome capture/combat/diplomacy checks 42/42, including
  a new two-city capture chain that verifies the second decision is pending
  after resolving the first. Syntax and diff checks passed. CI run
  `36308402593` passed all Chromium and WebKit full shards, both soak matrices,
  and static integrity.
- Further work: move state normalization out of UI decorators and remove
  domain rules still embedded in `app.js`, especially combat and rival AI.

### Stage 21: normalize domains at game-state entry

- New games and migrated saves initialize player production experience and
  rival research before gameplay or presentation. The worker and diplomacy UI
  decorators now read state without invoking those migrations. Production
  discount reads also leave missing experience records untouched.
- This keeps the existing idempotent legacy-building migration and research
  repair, but runs them at state entry and at explicit gameplay commands/turns
  rather than during animation-frame UI refreshes.
- Tier 3 local desktop Chrome state, capture/learning and save checks 25/25;
  syntax and diff checks pass. CI pending publication.
- Remaining: move combat, rival AI and turn rules out of `app.js`; remove
  remaining gameplay wrappers and observer-driven presentation duplication;
  complete a stable End Turn performance comparison and final system map.

### Stage 22: one combat calculation module

- `src/combat-rules.js` now owns damage and terrain-defense calculations.
  `src/data.js` names the existing direct, guard-order, and route profiles;
  the three profiles retain their distinct accepted variance and defense
  values. The old formula bodies are gone from `app.js`, autonomy, and pathing.
- Combat stays a state/data calculation. Callers still own target choice,
  casualty effects, event records and presentation; no combat mechanics or
  random-draw order changed.
- Tier 3 local desktop Chrome combat, stability, autonomy and pathing 23/23,
  including deterministic profile/terrain values; syntax and diff checks pass.
  CI pending publication.
- Remaining: extract combat application and rival AI from `app.js`, resolve
  presentation coupling in pathing, and remove redundant End Turn refreshes.

### Stage 23: rival strategic goal boundary

- `src/ai-strategy.js` selects and records each rival's strategic goal from
  state, map knowledge, unit strength and an optional personality adjustment.
  The long goal-scoring body and its hidden thresholds left `app.js`;
  `src/data.js` now holds the named AI goal balance values.
- The app supplies only its existing camp-knowledge predicate, map size and
  personality adapter. Goal ordering, tie resolution, threat recording and
  decision history remain unchanged.
- Tier 3 local desktop Chrome strategy/camp/diplomacy/combat 35/35 plus static
  checks pass. CI pending publication.
- Remaining: move rival action selection and combat application out of
  `app.js`; shrink the End Turn presentation fan-out and compare timings.

### Stage 24: explicit pre-turn player actions

- `simulateTurn()` now runs autonomous orders, route orders and workforce
  preparation in the same order they previously ran through End Turn capture
  listeners. The existing post-increment route pass remains a distinct phase,
  preserving its current two-pass movement behavior until that mechanic is
  deliberately reviewed.
- Scout movement draining was folded into the autonomy owner. Removed the
  obsolete `humans-autonomy-fix.js` wrapper and four gameplay click hooks,
  including the extra full render before the timed turn calculation.
- Declining the urgent-decision confirmation now leaves pre-turn state intact;
  previously capture listeners could mutate it before the confirmation.
- Tier 3 local desktop Chrome combat, autonomy, workforce, pathing and turn
  checks 37/37; static checks pass. Three End Turn clicks on a small no-rival
  map measured 423/296/167 ms, serialized state 47,657 bytes. Stage 19's
  comparable single run was 413/446/232 ms; variance is too large to claim a
  performance gain. CI pending publication.
- Stage 23 CI desktop Chromium and all soak jobs passed; one WebKit full shard
  failed the mobile camera viewport test (`camera-2.spec.js`), outside this AI
  goal change. Mobile remains nonblocking under `AGENT_TESTING_POLICY.md`.

### Stage 25: chronicle assembly leaves diplomatic redraws

- The diplomacy presentation scheduler no longer repairs state or walks the
  event log to rebuild history on every refresh. New/load state initializes
  its diplomacy event-flow fields at the state boundary.
- `simulateTurn()` synchronizes the chronicle once after all game phases and
  before autosave. Explicit event commands and opening the chronicle still
  synchronize immediately; direct `syncEvents()` calls retain their previous
  contract. UI refresh only decorates panels and shows the latest toast.
- Tier 3 local desktop Chrome diplomacy/chronicle/save checks 18/18,
  including a refresh-versus-turn boundary regression; syntax and diff checks
  pass. CI pending publication.
- Remaining: eliminate remaining command/observer state repair, split rival
  action/combat application from `app.js`, and consolidate UI invalidation.

### Stage 26: workforce changes at gameplay boundaries

- Population/workforce reconciliation now runs when a game is created or
  loaded, after growth in the turn simulation, and immediately after accepting
  refugees. The workforce UI observer and income labels only read state.
  Removed `ensureCity()` mutation from city-panel and displayed-income paths.
- Assignment events remain structured state changes. The notification is a
  separate presentation call after turn render or the refugee decision.
- Tier 3 local desktop Chrome workforce 5/5 and neighboring journey/combat/
  save 25/25, plus syntax/diff checks pass. Small no-rival End Turn sample is
  388/421/192 ms and 47,689 serialized bytes versus Stage 24's
  423/296/167 ms and 47,657 bytes. Both are noisy single runs; no speedup or
  regression is claimed. CI pending publication.
- Stage 25 CI desktop Chromium and soak passed. WebKit mobile shards had
  intermittent new-game setup failures where `#partySize` was absent after
  the screen transition, plus a camera failure. Cause is under investigation;
  these failures are recorded separately from the workforce change.

### Stage 27: new-game screen independent of name storage latency

- `openNewGameScreen()` now renders its form immediately. The asynchronous
  IndexedDB query only updates the suggested campaign name when the same
  form is still open. If storage stalls, map size and the Create action remain
  available. A fallback name keeps the existing optional-name flow usable.
- This addresses the observed WebKit CI setup failure where `#partySize` was
  absent after opening the new-game screen; the previous code did not render
  that element until the campaign-name query resolved. Final WebKit evidence
  remains pending CI.
- Tier 3 local desktop Chrome menu/game creation/journey checks 15/15,
  including a regression that checks form presence before the name promise
  can settle. Syntax and diff checks pass.

### Stage 28: rival production rules and city creation repair

- `src/ai-production.js` now applies rival emergency healing, queue choice,
  city income, defensive rush and unit completion from explicit state and
  collaborators. `app.js` only wires the turn's state and domain functions.
  The previous algorithm body is removed. `AI_PRODUCTION_RULES` in `data.js`
  owns its thresholds and prices. The existing order and event text remain.
- Founding a player city initializes its workforce immediately, before the
  first render. Stage 27 CI exposed the missing command boundary as a
  `workforce.food` page error in two founding tests. The CI Chromium failures
  came from this defect; Stage 27's form fix did not cause it.
- The service worker cache list now matches every script in `index.html` and
  no longer requests deleted `humans-autonomy-fix.js`. Its cache version was
  advanced for clients with an earlier incomplete precache.
- Tier 3 local desktop Chrome: rival production/coherence/living civilization
  33/33 and founding/workforce/production 9/9. Static script checks pass.
  Stage 27 CI still has WebKit camera timeouts; mobile remains deferred by
  `AGENT_TESTING_POLICY.md` while shared runtime failures are addressed.
- Remaining: rival action/combat application in `app.js`, presentation
  observers, End Turn render invalidation and final integration gate.

### Stage 29: rival combat application boundary

- `src/rival-combat.js` applies rival attacks against rival units/cities,
  player units and camps. The module receives state and collaborators;
  `app.js` retains turn ordering, target choice, presentation event dispatch
  and the capture/reward calls. The replaced damage and death branches were
  removed from the coordinator. Existing random draws and damage profiles
  remain in the same order. `AI_COMBAT_RULES` owns the former inline defaults.
- Tier 3 local desktop Chrome barbarian/capture/combat/living civilization
  tests 56/56, plus syntax/diff checks. Stage 28 CI passed all three desktop
  Chromium shards and every soak matrix; the only failure was WebKit mobile
  `camera-2.spec.js` large-map viewport, outside this combat change.
- Next: isolate action selection and barbarian combat, then remove duplicate
  presentation invalidation and complete final architecture review.

### Stage 30: rival action selection returns an intent

- `src/ai-actions.js` chooses the next rival intent from state and read-only
  world queries. It owns the former `rivalWarTarget` search and the exact
  priority of rival war, adjacent player, camp, barbarian, city guard,
  settlement and travel. `processRivals()` remains the executor that spends
  the shared AI budget and applies state changes. The old selection branches
  were removed. Guard distances/counts live in `AI_ACTION_RULES`.
- Tier 3 desktop Chrome barbarian/combat/living civilization tests 36/36,
  syntax and diff checks pass. A deterministic one-rival, small-map End Turn
  comparison routed the prior `264163b` app script against the new script
  with the same random seed. Serialized state byte counts matched after each
  of three turns: 50,845 / 50,965 / 51,733. Timings including browser UI
  were 696/203/214 ms before and 291/223/204 ms after. The first turn is
  warm-up sensitive; no performance gain is claimed.
- Stage 29 CI passed all desktop Chromium shards, every Chromium/WebKit soak
  and two WebKit full shards. WebKit mobile camera-2 large-map viewport was
  the only failing shard and is being tracked separately.
- Remaining: turn executor and barbarian rules in `app.js`, broad map redraw
  and independent UI observers, final passport/gate.

### Stage 31: workforce presentation uses explicit render signals

- `renderTop()`, `openCity()` and `openWiki()` emit `epohi:ui-rendered` after
  rebuilding their UI. Workforce presentation listens to that signal and
  coalesces updates on the next frame. Its prior MutationObserver watched
  five unrelated DOM surfaces; that observer is removed. Gameplay state is
  still changed only by explicit workforce commands.
- Tier 3 local desktop Chrome browser/living-world/workforce 19/19, plus a
  new wiki-decoration regression 1/1. Syntax/diff checks pass. A seeded
  one-rival three-turn comparison routed both previous scripts from
  `4f9fe26`: serialized state lengths matched exactly (50,596 / 51,029 /
  51,725 bytes). Before timings were 706/189/185 ms; after 207/234/232 ms.
  These short browser samples are noisy and do not support a speed claim.
- Stage 30 CI is entirely green: static, all Chromium and WebKit full shards,
  and every soak matrix. This is the current broad integration evidence.
- Remaining: other independent UI observers and repeated map/panel redraws,
  further world/turn separation and final architecture completion gate.

### Stage 32: chronicle writes at event creation

- `simulateTurn()` no longer reconstructs history by scanning `eventLog` at
  every turn. Rival living-world and diplomacy-flow events now add their
  history lines when created. Capture and diplomacy-coherence events already
  did so; their extra full `syncChronicle()` calls were removed. The full
  scan remains available on explicit chronicle opening and legacy repair.
- Tier 3 local desktop Chrome diplomacy/capture/living civilization 39/39,
  including new checks that rival events immediately enter history and raw
  legacy events are backfilled only when opening the chronicle. Syntax and
  diff checks pass. A seeded three-turn, one-rival comparison against
  `672bd2a` counted cumulative public full-scan calls: 2/4/5 before and
  1/1/1 after. The remaining call followed event presentation. Timings were
  734/213/211 ms before and 243/217/203 ms after; warm-up and browser noise
  prevent a speed claim. Serialized state bytes were 50,313/50,736/51,431
  before and 50,313/50,722/51,397 after.
- Stage 31 CI is fully green across static, Chromium, WebKit and soak jobs.
- Remaining: unify event writers under one owned chronicle boundary, remove
  other presentation observers, and separate world/turn execution further.

### Stage 33: barbarian target selection and repeated map scans

- `src/barbarian-targeting.js` owns visible target collection and priority.
  It builds the candidate list once per barbarian action; the prior
  `nearestBarbarianTarget()` rebuilt it for adjacency and again for each
  priority kind, repeatedly walking the whole map. Sight, home sight,
  priority and wander choices are in `BARBARIAN_TARGET_RULES`.
- The target order, stable distance ties and two random draws for wandering
  are preserved. The old target selection functions left `app.js`; only a
  state/random adapter remains. Tier 3 local desktop Chrome target/camp/
  combat/world tests 32/32 and syntax/diff checks pass.
- A seeded three-turn, one-rival comparison with eight injected barbarians
  against `5a46dd2` gave identical barbarian positions, event types and
  serialized state sizes on repeat: 51,971 / 53,456 / 55,225 bytes. End Turn
  timings were 804/220/206 ms before and 251/299/205 ms after; no speed
  claim follows from these short, warm-up-sensitive samples.
- Stage 32 CI passed static and all desktop Chromium shards. WebKit mobile
  `camera-2.spec.js` large-map viewport failed again; soak was skipped by
  the CI gate after that failure. Stage 31 remains the latest full green CI.
- Remaining: barbarian action application, broader turn/world separation,
  UI invalidation and final architecture gate.

### Stage 34: barbarian action application boundary

- `src/barbarian-actions.js` now owns camp spawning and raider attack, pillage
  and movement for a turn. It receives game state and explicit combat, event,
  death and random collaborators. `app.js` retains a thin turn adapter; the
  replaced action bodies and movement helper were removed. Camp population
  limits and target scaling are declared in `BARBARIAN_ACTION_RULES`.
- Local desktop Chrome camp, targeting, living-world and combat checks passed
  32/32. A seeded eight-barbarian comparison against `870fd5a` after three
  End Turns found the same gameplay state, positions, health and event order.
  The only state difference was the wall-clock suffix in the test party name.
  End Turn samples were 465/198/259 ms before and 315/217/224 ms after;
  browser scheduling makes these insufficient to claim a speed change.
- Stage 33 CI passed static, soak and five of six browser shards. Chromium
  mobile `camera-2.spec.js:261` failed a stored camera scale assertion (99
  expected, 1.3 observed), outside the barbarian change. The latest full
  green integration run remains Stage 31.
- Remaining: consolidate UI turn invalidation, extract other gameplay bodies
  from the coordinator, and run the final architecture gate.

### Stage 35: explicit render signal and visual map deduplication

- `humans-observer.js` now listens to `epohi:ui-rendered`, already emitted by
  `app.js`, instead of observing `turnValue` text mutations. It still observes
  menu visibility for its menu control. `humans-visuals.js` records the first
  tile of the decorated map tree and skips further full-map decoration until
  `renderMap()` replaces that tree. Unit arrival history advances only when
  the map changes.
- A focused regression checks zero visual tile scans for two flushes on an
  unchanged map and one scan after a fresh render. Routing the Stage 34 visual
  script through the same check produced two scans on the unchanged map.
  Local desktop Chrome art, runtime and mobile stability checks passed 11/11.
  Two obsolete assertions that `openMapMode` did not exist were removed from
  the Show Map test; the fog behavior assertion and separate open-map test
  remain.
- Seeded one-rival, three-turn comparison against Stage 34 preserved turns and
  event order. Visual tile scans were 2/2/2 before and 1/1/1 after. End Turn
  timings were 580/329/281 ms before and 409/275/298 ms after; short browser
  samples do not establish a sustained speed gain.
- Stage 34 CI passed static, all desktop Chromium shards and other browser
  shards, but WebKit mobile `camera-2.spec.js:195` failed its short-viewport
  centering assertion (6.5 px). Camera instability remains separately tracked.
- Remaining: presentation observers beyond this owner, broad map rebuilding,
  further game rule extraction and final integration gate.

### Stage 36: one render-time lookup pass for map actors

- `app.js` builds temporary tile indexes for player cities, settlements,
  player units, rival cities/units and barbarians before constructing map DOM.
  It preserves first-match ordering and stacked player units. The previous
  render walked these actor arrays for every tile. The selected unit is read
  once. `canAttack()` now rejects distant and ineligible tiles before looking
  for targets; attack behavior and target precedence are unchanged.
- Local desktop Chrome browser, combat and visual coverage passed 32/32.
  A seeded two-rival comparison against `25eecf3` found identical decorated
  map HTML at creation and after two End Turns, with matching turn numbers and
  event types. On a large three-rival map, five explicit render samples were
  8/6/6/6/5 ms before and 7/5/5/4/4 ms after. The difference is small and
  the samples are too short to claim a sustained gain.
- Stage 35 CI passed static and all soak jobs. Mobile camera assertions failed
  in Chromium and WebKit; WebKit mobile pathing explicit invalidation timed out.
  That pathing scenario passed in local desktop Chrome. Mobile failures remain
  open under the PC-first policy, and no full-green result is claimed.
- Remaining: consolidate other presentation observers, split further turn
  rules from the coordinator, and complete the final gate.

### Stage 37: diplomatic validity leaves the stability renderer

- `src/stability-rules.js` owns the existing proposal-validity algorithm and
  cancellation pass. Game initialization/migration reconciles loaded
  proposals; the End Turn pipeline reconciles after diplomacy; declaring war
  reconciles immediately. `EpohiCombatWorldStability.render()` no longer
  cancels proposals while building its panel. Its public `proposalValid`
  name delegates to the sole rule implementation for compatibility.
- Tier 3 local desktop Chrome diplomacy, capture, stability and coherence
  checks passed 46/46. A new regression verifies that rendering an invalid
  pending joint-war proposal does not change state and the next turn cancels
  it before autosave. Static syntax/diff checks pass. This moves the existing
  rule to state transitions without changing proposal-validity criteria.
- Stage 36 CI passed static and all soak jobs; Chromium and WebKit mobile
  camera shards failed separate fit/centering assertions.
- Remaining: other state writes in presentation (`migrate`, modal receipt
  markers), event ownership and broad observer consolidation, then final gate.

### Stage 38: stability migration at state initialization

- `initializeGameSystems()` invokes the stability domain migration once on
  new and loaded states. `EpohiCombatWorldStability.render()` now reads that
  normalized state instead of running migration and walking `eventLog` on
  every panel refresh. The explicit migration API remains for old snapshots
  and direct legacy import tests.
- Tier 3 local desktop Chrome state-schema, save and combat/stability checks
  passed 24/24. A regression confirms new games already have stability
  version, city capacity and urgent-decision shape, while two explicit UI
  renders make zero `eventLog.forEach` passes. The previous render called
  migration once per invocation, so it made two full passes in that setup.
  Syntax/diff checks pass; no wall-time gain is claimed from this small scan.
- Stage 37 CI was still in progress at this checkpoint.
- Remaining: clarify persisted presentation receipts versus gameplay state,
  consolidate further observer/render paths and complete the final gate.

### Stage 39: diplomacy panels follow completed UI render

- `humans-diplomacy-coherence-v2.js` and `humans-diplomacy-event-flow.js`
  listen to `epohi:ui-rendered` instead of observing `turnValue` mutations.
  Their End Turn click hooks no longer schedule a refresh before turn
  simulation. Other proposal, modal and diplomacy action signals remain.
- Local desktop Chrome diplomacy/runtime/mobile stability checks passed
  13/13. A seeded one-rival three-turn comparison against `e947e9e` found
  identical turn and event sequences. Registered observers of `turnValue`
  fell from five to three. End Turn samples were 299/224/282 ms before and
  231/180/222 ms after; these short timings do not prove a sustained gain.
- Stage 38 CI exposed a WebKit mobile test harness issue: a proposal modal
  could cover the End Turn button in the new stability rule test. That test
  now invokes the same turn pipeline directly, avoiding its unrelated button
  actionability race. The recurring WebKit mobile camera assertion also
  failed. The game rule and other button coverage were not changed.
- Remaining: three other turn-text observers, broad click invalidation and
  UI wrappers, then the final architecture gate.

### Stage 40: remove the remaining turn-text observers

- Journey UI and overlay priority now react to the explicit
  `epohi:ui-rendered` signal. Pathing UI follows its existing map and
  context changes plus the own-unit context-ready signal, so its separate
  turn-text observer was removed. No module now registers a MutationObserver
  on `turnValue`.
- Tier 3 local desktop Chrome journey, outcome, combat and pathing checks
  passed 33/33. A seeded one-rival three-turn comparison against `1ad51af`
  preserved turns and event order; registered `turnValue` observers fell
  from three to zero. End Turn samples were 688/173/205 ms before and
  250/192/324 ms after. These are too noisy for a performance claim.
- Stage 39 CI was still running at this checkpoint.
- Remaining: broad click and modal observers, presentation wrappers and
  remaining turn/gameplay separation, then final integration gate.

### Stage 41: player city production and growth rule boundary

- `src/player-production.js` now owns per-turn player city income application,
  queue completion, unit creation, growth, reveal and their gameplay events.
  It takes state and explicit callbacks, with no DOM, storage or animation work.
  The population limit is in `PLAYER_CITY_RULES` in `src/data.js`.
  `app.js` keeps thin UI-facing adapters; its old shadowed queue completion and
  dead growth function have been removed.
- A focused desktop Chrome regression covers simultaneous building completion
  and population growth in an actual End Turn, including experience and event
  order. The related local suite passed 18/18 after correcting event filtering.
  A seeded three-turn comparison against `b0d09f6`, starting from the same
  complete snapshot, matched the full game state after each turn. End Turn
  samples were 223/362/168 ms before and 179/174/171 ms after; this short run
  is too noisy to establish a speed change.
- Remaining: research, rival and player action rules in `app.js`, broad UI
  click/overlay invalidation, then final integration gate.

### Stage 42: player research rules in progression

- `src/progression.js` now owns technology prerequisite checks, selection and
  End Turn completion, alongside era calculation. It takes state and tech data;
  `app.js` retains UI feedback and delegates gameplay mutations to this module.
  The prior research bodies were removed from `app.js`.
- Local desktop Chrome research, production, baseline and turn-unlock checks
  passed 13/13. The new regression checks a rejected locked technology,
  successful selection and completion through an actual End Turn, including
  the existing history text. Syntax and diff checks pass. The local Playwright
  package initially lacked its matching bundled browser; rerunning against
  the installed system Chrome succeeded. No performance claim is made for
  this small extraction.
- Remaining: rival/player action rules and presentation invalidation, then
  the final integration gate.
