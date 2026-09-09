# CODEX NEXT TASK

## Scope
Repository: `Mikayilzade/Epohi`.
Work only in existing PR #91 / branch `codex-tgmou0`.
Base is PR #90 branch `codex/work-on-existing-pr-and-follow-instructions`.
Do not create a branch, create another PR, retarget a PR, or merge.

## BRANCH GATE — MUST HAPPEN FIRST
Before reading status files, editing, or running tests:
1. `git status --short --branch`
2. fetch `origin codex-tgmou0`
3. switch/check out the EXISTING `codex-tgmou0` branch, tracking `origin/codex-tgmou0` if needed; do not create any differently named branch.
4. verify local branch name is exactly `codex-tgmou0` and local HEAD equals the current remote head.

At the time this instruction was written the GitHub PR #91 head was `4d03d661d73f77d6574ab4a1a0e3d40b72f63b9a` (instruction commits may advance it later). The previously reported local HEAD `e39606203fe0407b5d87d46f749519eb7dc41938` is NOT the PR #91 GitHub head and must not be used as the work base.

If fetch/checkout/network is blocked, STOP immediately and report the blocker. Do not run tests on a stale checkout and do not create anything as a workaround.

## Known good base
PR #90 SHA `2ac5522965db8bab8372632cbdd76f935f5ebd25` already passed focused Chromium 60/60, focused WebKit 60/60, full Chromium 185/185, and full WebKit 185/185.

PR #91 preserved `package-lock.json`, but the previously prepared local Gate G changes were lost from a later workspace.

## Task after BRANCH GATE passes
1. Read the top current checkpoint of `AUTONOMY_STATUS.md` and only relevant Gate G/test files.
2. Reconstruct the same Gate G intent, not a redesign:
   - permanent Playwright GitHub Actions workflow;
   - autonomous soak test;
   - required helper changes;
   - required status/checkpoint updates;
   - preserve `package-lock.json`.
3. Do not change unrelated game behavior or game code merely to satisfy stale tests.
4. Inspect full `git diff` and `git status`; confirm every intended Gate G file is present.
5. Run only relevant local validation that the environment supports. Browser dependency/network failures are infrastructure blockers, not product failures.
6. Commit all Gate G changes and push ONLY to existing `codex-tgmou0`.
7. Report: new head SHA, complete changed-file list, checks/results, blockers. Then stop.

## Stop conditions
- Any fetch/checkout/push 403 or inability to use existing `codex-tgmou0`: stop; create nothing.
- Do not set `READY_FOR_FINAL_DEVICE_TEST` yet. It requires green permanent CI, independent diff review, and immutable exact-SHA link.
