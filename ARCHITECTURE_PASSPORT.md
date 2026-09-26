# Epohi architecture passport

Updated: 2026-09-26. Integration target: PR #103 / `codex-qgq4u5`.

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
| Game state and migration | snapshot -> valid current state | `app.js`, `save-utils.js` | data definitions only |
| Turn simulation | state + rules + random source -> result | `app.js`, `humans-*` | state, data, domain rules |
| World, AI, combat, economy | state slice -> state change/result | `app.js`, some `humans-*` | data and shared pure helpers |
| Save repository | snapshot + slot intent -> records | `storage.js`, `save-utils.js`, `app.js` | state migration, browser storage |
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
- Remaining save debt: rotation performs several IndexedDB transactions and
  should become one atomic transaction before calling the save path complete.
  State migration still lives in `app.js`; move it to a versioned state module.
