# CODEX NEXT TASK

## Scope
Repository: `Mikayilzade/Epohi`.
Work only in existing PR #91 / remote branch `codex-tgmou0`.
Base is PR #90 branch `codex/work-on-existing-pr-and-follow-instructions`.
Do not create any NEW REMOTE branch, another PR, retarget a PR, or merge.

## Current checkpoint
Gate G has been reconstructed and published in PR #91. The first permanent CI run exposed two test-gate defects rather than a demonstrated game regression:
- a stale treasury/event test still expected the retired world-event panel instead of the canonical toast + chronicle/history flow;
- the soak used a brittle raw mutation-count threshold over 35 ms and treated a finite delayed render burst as runaway DOM churn.

Both were corrected without changing game code. The current branch head may advance with documentation-only checkpoint commits; always trust the fetched current remote head rather than an older SHA written in chat.

## BRANCH GATE — MUST HAPPEN FIRST
The Codex checkout may start on local branch `work` and may have no `origin`. That is an environment detail, not a reason to work on `work`.

Before reading status files, editing, or running tests:
1. Run `git status --short --branch` and require a clean working tree.
2. Check `git remote -v`.
3. If `origin` is missing, add exactly this remote: `git remote add origin https://github.com/Mikayilzade/Epohi.git`.
4. Fetch the EXISTING remote branch: `git fetch origin codex-tgmou0`.
5. Switch to a LOCAL tracking branch named exactly `codex-tgmou0` based on `origin/codex-tgmou0`. Creating this local tracking branch is explicitly allowed; creating a new remote branch is forbidden.
6. Verify `git branch --show-current` is exactly `codex-tgmou0` and local `HEAD` equals `origin/codex-tgmou0` before any edits/tests.

If adding/fetching the remote is blocked by network/auth/403, STOP and report it. Do not create a replacement remote branch/PR and do not modify files.

## Known good base
PR #90 SHA `2ac5522965db8bab8372632cbdd76f935f5ebd25` passed focused Chromium 60/60, focused WebKit 60/60, full Chromium 185/185, and full WebKit 185/185.

## Exact next task
1. Read the top checkpoint of `AUTONOMY_STATUS.md`.
2. Inspect the permanent GitHub Actions result for the current PR #91 head.
3. If any job is red, diagnose its exact test/log first. Fix only an evidence-based gate/test/product defect; do not alter game behavior merely to make a stale test pass.
4. If all permanent Gate G jobs are green, independently review the complete PR #91 diff against the PR #90 base and verify that no unrelated game behavior changed.
5. Confirm the exact tested head SHA and prepare an immutable GitHub link pinned to that SHA.
6. Only after green CI + independent diff review + immutable exact-SHA link may `AUTONOMY_STATUS.md` be changed to `READY_FOR_FINAL_DEVICE_TEST`.
7. Do not merge. Stop after reporting whether the single final iPhone test is authorized.

## Stop conditions
- Any fetch/push auth or network failure, including 403: stop; create nothing remotely.
- Do not create another PR or remote branch.
- Do not set `READY_FOR_FINAL_DEVICE_TEST` while CI is pending/red or before the independent diff review and immutable exact-SHA link exist.
