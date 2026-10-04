# CODEX NEXT TASK

## Current target

Repository: `Mikayilzade/Epohi`.
Branch: `rework/epohi-next`.

Do not:
- create another branch/PR;
- merge;
- force-push;
- change `stable`.

## Current checkpoint — 2026-10-04

World Profiles / Visual V3 implementation is complete on this branch and is awaiting human visual review. See `docs/VISUAL_POLISH_STATUS_V3.md` and `docs/WORLD_GENERATION_PROFILES_V1.md` for implementation, diagnostics and test evidence. The current normal Chrome review scene is a fresh BALANCED 28×28 Open Map game at `http://127.0.0.1:8000/?worldProfile=balanced&worldSeed=339`.

Do not begin another visual pass, merge, or tune profile values without the review decision. River generation and nation bindings are deliberately deferred. Preserve current worker-action, fractional-movement, save and no-full-map-redraw behavior.
