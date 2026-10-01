# CODEX NEXT TASK

## Integration target

Work only in PR #103 / `codex-qgq4u5` -> `main`. It is the sole open integration PR and remains Draft. Do not create another branch/PR, merge, force-push, delete remote branches, or reopen the old PR stack. Follow `AGENTS.md`, `ORCA_HARNESS.md`, and `ARCHITECTURE_AUTONOMY_DECISIONS_2026-09-26.md`.

## Current checkpoint (2026-09-28)

The architecture cleanup is complete through runtime/test SHA `8202775`. The exact-SHA full CI gate passed in run `36455024050`. The current ownership map, test evidence, performance samples and remaining debt are in `ARCHITECTURE_PASSPORT.md`; the newest `AUTONOMY_STATUS.md` checkpoint carries the immediate state.

No architecture implementation is pending. The local Playwright configs, End Turn measurement spec and test results are untracked local artifacts; keep them out of commits and preserve them unless their owner explicitly requests cleanup. The active desktop target is Chromium; mobile code/tests remain intact.

PR #103 remains Draft/Open; merge requires explicit user approval. Battle Simulator design remains separate.
