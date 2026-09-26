# Epohi — accepted autonomy and architecture decisions

Date: 2026-09-26

This file records explicit user decisions made after the design inbox and Git audit.
These are **accepted working decisions** for the next Epohi architecture phase unless a
later user decision supersedes them.

## 1. Lead autonomy

- Lead works autonomously through technical tasks and does not stop after each stage.
- Lead may choose implementation details, code structure, obvious technical bug fixes,
  tests, and small UI/UX details.
- Small UI/UX decisions should be easy to change later; avoid coupling them to unrelated
  game systems.
- Ask the user before changing meaningful gameplay mechanics, balance, removing a feature,
  choosing between materially different game-design directions, or making a major
  look/feel decision.
- If a task contains no such decision, continue until the goal is complete or a real
  blocker is reached.
- Leave short checkpoints at meaningful milestones, blockers, and completion; a checkpoint
  is visibility, not a request for approval.
- For a major architecture task, first audit and leave a short plan/risk checkpoint, then
  continue automatically if no user decision is required.

## 2. Git and workers

- Lead may create coherent commits and push to the already-authorized current integration
  branch/PR.
- Lead may create and remove temporary worker worktrees when their work is integrated or
  proven unnecessary.
- Do not merge, force-push, delete important remote branches, close old PRs, or create a
  replacement/new PR without the authorization required by AGENTS.md / ORCA_HARNESS.md.
- Prefer at most two workers at once:
  - Luna Low for cheap inventory/search/docs/status work;
  - Sol Medium for ordinary implementation and reasoning;
  - Astra Medium only for a genuinely hard blocker/root-cause/architecture problem.
- Ask before materially expanding orchestration (more than two concurrent workers, broad
  Astra use, unusually heavy test runs, or a genuinely new large workstream).

## 3. Testing policy

- Lead chooses test depth according to the risk of each change.
- Do not weaken assertions, increase tolerances/timeouts without a demonstrated cause,
  delete valid tests, or change gameplay merely to obtain green CI.
- Ambiguous failures that may represent a gameplay/design question must be surfaced rather
  than silently redefined.
- Architecture work should be checkpointed with logical commits so a bad stage can be
  reverted without discarding unrelated successful work.
- Final architecture validation must include relevant integration coverage and a
  before/after check that important runtime paths such as End Turn did not regress.

## 4. Architecture cleanup is a priority

Before major new Epohi feature development, finish the architectural cleanup rather than
only gradually touching the old monolith.

Goals:

- Split by real responsibilities, not arbitrary file-size quotas.
- Separate gameplay rules from UI/rendering.
- Separate balance/configuration data from algorithms.
- Keep save/load/version migration as its own responsibility.
- Keep systems independently understandable and testable.
- Avoid both extremes: one huge monolith and hundreds of meaningless tiny files.
- File size alone is not a rule; cohesion and dependency direction matter more.
- New work should not re-create a monolith.
- After several large systems or noticeable growth, run another architecture review and
  split modules again only where evidence justifies it.

Lead may rewrite internals during the cleanup instead of merely moving old code. External
gameplay behavior should remain the same unless an explicitly accepted gameplay change is
being implemented. Obvious technical defects may be fixed; ambiguous behavior is a user
decision.

At the end there must not be two parallel implementations of the same system. Old code may
remain temporarily when risk justifies it, but obsolete paths must be removed before the
cleanup is declared complete.

## 5. State model and End Turn

Use one structured canonical current-game state with independent systems operating on clear
parts of that state.

- The current game state is the source of truth.
- Full history is **not** replayed to reconstruct every normal turn.
- UI reads game state; UI must not become a second source of game truth.
- A system should not directly trigger unrelated rendering, audio, persistence, AI, and
  other systems as side effects.
- End Turn must be traced and optimized: calculate only what is required, update only
  affected UI/state, avoid repeated observers/global rerenders, and avoid rereading full
  history.
- Measure important End Turn/runtime behavior before and after the architecture work.

History uses a hybrid model:

- current state plus a small recent-history tail may stay readily available;
- full history may be appended/stored separately;
- old history must not participate in every turn calculation;
- exact in-memory history depth should be chosen by measurement, not an arbitrary number.

## 6. Commands and events — preferred hypothesis, not dogma

Current preference is a hybrid:

- primary game-state changes use explicit commands/results and controlled state application;
- secondary reactions such as UI, animation, sound, logs, and statistics may consume events.

Example: an attack calculates a result and changes canonical state; an `ATTACK_RESOLVED`
event may then inform presentation/logging systems.

Confidence in this exact pattern is **medium**. Before implementing it broadly, Lead should
inspect the real Epohi code and may recommend a simpler/better pattern. Do not silently
replace the decision; explain the alternative briefly when it materially differs.

## 7. Strict UI/gameplay separation and animations

Gameplay logic must not depend on HTML/widgets/animations.

- Rules such as movement cost, attack legality, damage, production, etc. live outside UI.
- UI presents state and sends player intent; it does not own game rules.
- Animations are presentation only and never determine gameplay completion.
- Future settings should support:
  - one global "disable all animations" control;
  - separate animation-category toggles where useful.
- With animations disabled, the game should skip animation waiting work rather than merely
  hide visuals. The goal includes real performance benefit.

## 8. Balance and tuning architecture

Expect balance to change frequently.

- Keep tunable game data in a clear data/config layer, grouped by domain (units, terrain,
  combat, economy, buildings, AI, etc.).
- Do not bury balance constants throughout algorithms.
- The architecture should support a future internal tuning panel with live controls/sliders.
- A tuning value may expose useful metadata such as default, min, max, and step where that
  helps tools.
- The future tuning tool should support:
  - temporary runtime changes;
  - named presets;
  - import/export of presets;
  - immutable/default canonical values that experiments cannot accidentally overwrite.
- The tuning panel itself is not required as part of the immediate architecture cleanup;
  the cleanup should make it straightforward to add later.

## 9. Saves: slots, versions, and future history

Current target per game/campaign:

- 3 rotating autosave slots;
- 3 manual save slots;
- each game/campaign owns its own six slots.

This is the current practical target, not a permanent commercial limit. Lead should first
verify what is already implemented.

Autosaves:

- one recovery point for every completed turn is mandatory;
- autosave represents the **start of the player's new turn**, after AI, production, effects,
  and previous-turn processing have completed;
- the three autosave slots rotate automatically;
- no separate "undo turn" button is needed now;
- saving must be lightweight enough not to make End Turn feel slow; if a full snapshot
  eventually becomes expensive, Lead may use a lightweight per-turn recovery mechanism
  plus heavier background/periodic persistence while preserving a per-turn recovery point.

Manual saves:

- the player chooses one of three manual slots;
- saving into an occupied manual slot requires an overwrite confirmation;
- manual slots are never automatically overwritten.

Useful presentation context may be saved (camera position/zoom, selected unit/city, similar
stable context). Temporary confirmation dialogs, transient tooltips, hover state, etc.
should not be restored.

## 10. Save compatibility and historical game versions

Build the foundation now without implementing a full historical-version museum.

Each save should be able to identify at least:

- save-format version;
- game/rules version or equivalent release identifier;
- stable game/save identity suitable for future cloud synchronization.

The game may later support two paths for an old save:

1. migrate/open it in a newer game version when a reasonable converter exists;
2. open it with the historical game build that created it.

Historical builds should be release-level milestones, not every commit. Do not promise
eternal migration of every ancient save if the cost becomes unreasonable.

Saves are local for now. There are no servers yet. Structure them so cloud sync can be
added later without redesigning the game-state model.

## 11. Randomness and reloads

For normal offline play, reloading may produce a different random result. Save-scumming /
experimentation is allowed; this is not treated as a defect.

Automated tests may and should use deterministic/fixed randomness where reproducibility is
needed.

## 12. Multiplayer

A future multiplayer mode is desirable, but the current priority is a complete offline
game.

- Do not build multiplayer infrastructure now.
- Avoid architecture choices that make multiplayer unnecessarily impossible later.
- Keep game rules independent enough from a particular UI/client that future command
  transport/synchronization remains possible.

## 13. Current technology / possible Godot experiment

Epohi remains on its current stack for now. Do not migrate the main game merely because a
game engine may be attractive.

A later separate Battle Simulator may be used as a practical Godot experiment. Any decision
to migrate the main Epohi should follow an actual comparison, not theory.

## 14. Living technical passport

Maintain a living architecture map for major systems. For each important system, keep enough
information for a new agent to quickly know:

- responsibility;
- inputs/outputs;
- important dependencies;
- related tests;
- common change points.

Update it after major architectural changes so future agents do not repeatedly reread the
whole repository.

## 15. Definition of architecture-cleanup completion

Lead must first inspect the real repository and define Epohi-specific completion criteria,
then work through them autonomously.

Mandatory minimum:

- logical system separation;
- strict UI/gameplay separation;
- balance/config separated from algorithms;
- save/versioning responsibility separated;
- major systems have appropriate focused tests;
- dependency structure is understandable and avoids obvious cycles/cross-system coupling;
- important runtime paths such as End Turn are not slower without justification;
- living technical passport is current;
- obsolete duplicate implementations are gone.

Lead may add criteria when the real repository justifies them. Do not invent cleanup work
solely to make the architecture theoretically perfect.

## 16. Deferred ideas

Do **not** currently add an extra "skill-building" project or spend time creating custom
agent skills merely to perfect the harness. If recurring agent failures later reveal a
specific need, revisit that idea then.

The Battle Simulator and its gameplay design remain separate from this architecture task.
Do not implement unresolved Battle Simulator mechanics as part of Epohi cleanup.
