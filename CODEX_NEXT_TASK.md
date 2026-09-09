# CODEX NEXT TASK

## Scope
Repository: `Mikayilzade/Epohi`.
Work only in existing PR #91 / branch `codex-tgmou0`.
PR #91 is based on PR #90 branch `codex/work-on-existing-pr-and-follow-instructions`.
Do not create a branch, create another PR, retarget a PR, or merge.

## Known state
PR #90 SHA `2ac5522965db8bab8372632cbdd76f935f5ebd25` already passed focused Chromium 60/60, focused WebKit 60/60, full Chromium 185/185, and full WebKit 185/185.

PR #91 originally published only `package-lock.json` at SHA `25b6030320e193399f80527f95e87c00bc9e5bbe`. Repository instruction/status commits may have advanced the PR #91 head since then; resolve and use the current remote `codex-tgmou0` head rather than assuming that old SHA.

The previously prepared Gate G local changes were lost from a later Codex workspace. Recover the same Gate G intent, not a new redesign.

## Task
1. Read only the current checkpoint at the top of `AUTONOMY_STATUS.md` plus relevant Gate G/test files.
2. Get onto the existing remote branch `codex-tgmou0`. Never create a replacement branch. If fetch/checkout is blocked by the environment, stop and report it.
3. Reconstruct the previously prepared Gate G from earlier task context and repository evidence:
   - permanent Playwright GitHub Actions workflow;
   - autonomous soak test;
   - related helper changes;
   - related status/checkpoint changes;
   - preserve the existing lockfile.
4. Do not redesign unrelated game behavior and do not change game code merely to satisfy stale tests.
5. Before commit, inspect `git status`, current branch, and the complete `git diff`; confirm all intended Gate G files are present.
6. Run the smallest relevant validation available locally. Do not treat an environment/network/browser-install failure as a product failure.
7. Commit all remaining Gate G changes and push only to `codex-tgmou0`.
8. After push, report only: new head SHA, complete changed-file list, local checks run/results, and any blocker. Then stop.

## Stop conditions
- On another network/fetch/push 403 or inability to access `codex-tgmou0`: stop; create nothing.
- Do not set `READY_FOR_FINAL_DEVICE_TEST` yet. That state requires green permanent CI, independent diff review, and an immutable link to the exact tested SHA.
