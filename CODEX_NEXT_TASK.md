# CODEX NEXT TASK

## Current target

Repository: `Mikayilzade/Epohi`.
Branch: `rework/epohi-next`.

Do not:
- create another branch/PR;
- merge;
- force-push;
- change `stable`.

## Active task — 2026-10-04

Visual Polish V2 has been human-reviewed.

The next active package is:

`docs/NEXT_TASK_WORLD_PROFILES_VISUAL_V3.md`

Read that document in full and execute it in dependency order.

Key intent:
- fix Worker context-panel usability;
- preserve accepted forest/hill/water and good unit art;
- fix gems, dead lands, swamp and fish presentation;
- distinguish semantic UI icons from world/showcase art;
- reduce visible forest/hill art repetition with real variants where possible;
- refactor current over-dense map generation into a data-driven world/profile system;
- introduce backward-compatible water semantics (`waterKind`);
- build generic environment profiles for future nations without inventing final nation lore;
- keep current gameplay terrain IDs/rules/save compatibility;
- use diagnostics across many seeds rather than tuning one screenshot.

The user authorizes ~2–3 hours of active work today. Astra may be used selectively for high-value architecture, world-generation/profile reasoning, compatibility/risk audit, or a difficult blocker. Do not waste Astra or duplicate implementation.

Stop for human review at a coherent tested checkpoint. Do not touch `stable`.
