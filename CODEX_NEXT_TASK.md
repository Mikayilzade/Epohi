# CODEX NEXT TASK

## Integration target

Work only in PR #103 / `codex-qgq4u5` -> `main`. It is the sole open integration PR and remains Draft. Do not create another branch/PR, merge, force-push, delete remote branches, or reopen the old PR stack. Follow `AGENTS.md`, `ORCA_HARNESS.md`, and `ARCHITECTURE_AUTONOMY_DECISIONS_2026-09-26.md`.

## Current checkpoint (2026-09-28)

The architecture cleanup has four broad packages. Stage 51 and packages 1-3 are published; package 4 is locally validated and awaiting publication/CI. The current ownership map, test evidence, performance samples and remaining debt are in `ARCHITECTURE_PASSPORT.md`; the newest `AUTONOMY_STATUS.md` checkpoint carries the immediate state.

Next: review the complete package-4 diff, commit and push it only to PR #103, verify the changed-file list and SHA, then inspect exact-SHA CI. Resolve any genuine desktop/shared regression. Keep the local Playwright configs, End Turn measurement spec and test results out of commits; preserve them as untracked local artifacts. The active desktop target is Chromium; mobile code/tests remain intact.

If CI is green, update the passport/checkpoint with exact-SHA evidence and report completion without merging. If a blocker appears, preserve work and report the concrete blocker. Battle Simulator design remains separate.