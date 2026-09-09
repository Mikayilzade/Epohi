# CODEX NEXT TASK

## Scope
Repository: `Mikayilzade/Epohi`.
Work only in existing PR #91 / remote branch `codex-tgmou0`.
Base is PR #90 branch `codex/work-on-existing-pr-and-follow-instructions`.
Do not create any NEW REMOTE branch, another PR, retarget a PR, or merge.

## BRANCH GATE — MUST HAPPEN FIRST
The Codex checkout may start on local branch `work` and may have no `origin`. That is an environment detail, not a reason to work on `work`.

Before reading status files, editing, or running tests:
1. Run `git status --short --branch` and require a clean working tree.
2. Check `git remote -v`.
3. If `origin` is missing, add exactly this remote: `git remote add origin https://github.com/Mikayilzade/Epohi.git`.
4. Fetch the EXISTING remote branch: `git fetch origin codex-tgmou0`.
5. Switch to a LOCAL tracking branch named exactly `codex-tgmou0` based on `origin/codex-tgmou0`. Creating this local tracking branch is explicitly allowed; creating a new remote branch is forbidden.
6. Verify `git branch --show-current` is exactly `codex-tgmou0` and local `HEAD` equals `origin/codex-tgmou0` before any edits/tests.

If adding/fetching the remote is blocked by network/auth/403, STOP and report it. Do not run Gate G on `work`, do not create a replacement remote branch/PR, and do not modify files.

## Known good base
PR #90 SHA `2ac5522965db8bab8372632cbdd76f935f5ebd25` already passed focused Chromium 60/60, focused WebKit 60/60, full Chromium 185/185, and full WebKit 185/185.

PR #91 is the Gate G recovery PR. Its remote head may advance because instruction commits are being written directly to `codex-tgmou0`; always trust the fetched current remote head, not an old SHA from chat.

## Task after BRANCH GATE passes
1. Read the top current checkpoint of `AUTONOMY_STATUS.md` and only relevant Gate G/test files.
2. Reconstruct the same Gate G intent, not a redesign:
   - permanent Playwright GitHub Actions workflow;
   - autonomous soak test;
   - required helper changes;
   - required status/checkpoint updates;
   - preserve `package-lock.json` unless repository evidence proves it was unintended for Gate G.
3. Do not change unrelated game behavior or game code merely to satisfy stale tests.
4. Inspect full `git diff` and `git status`; confirm every intended Gate G file is present.
5. Run only relevant local validation that the environment supports. Browser dependency/network failures are infrastructure blockers, not product failures.
6. Commit all Gate G changes and push ONLY to the existing remote branch `codex-tgmou0`.
7. Report: new head SHA, complete changed-file list, checks/results, blockers. Then stop.

## Stop conditions
- Any fetch/push auth or network failure, including 403: stop; create nothing remotely.
- Do not set `READY_FOR_FINAL_DEVICE_TEST` yet. It requires green permanent CI, independent diff review, and an immutable exact-SHA link.
