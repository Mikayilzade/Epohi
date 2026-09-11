# CODEX NEXT TASK

## Scope
Repository: `Mikayilzade/Epohi`.
Work only in existing PR #91 / remote branch `codex-tgmou0`.
Base is PR #90 branch `codex/work-on-existing-pr-and-follow-instructions`.
Do not create any NEW REMOTE branch, another PR, retarget a PR, force-push, or merge.

## Minimum-context rule
Do not broadly reread repository history or old chat context.
For this task, use only:
1. this file;
2. the top/current contents of `AUTONOMY_STATUS.md`;
3. the exact failing specs and directly relevant helpers/code;
4. current PR #91 diff/CI only when needed to verify the fix.

## BRANCH GATE — MUST HAPPEN FIRST
The Codex checkout may start on local branch `work` and may have no `origin`. That is an environment detail, not permission to work on `work`.

Before editing or testing:
1. `git status --short --branch` — require a clean working tree.
2. `git remote -v`.
3. If `origin` is missing, add exactly: `git remote add origin https://github.com/Mikayilzade/Epohi.git`.
4. Fetch the EXISTING branch: `git fetch origin codex-tgmou0`.
5. Switch/create only the LOCAL tracking branch `codex-tgmou0` from `origin/codex-tgmou0`.
6. Verify `git branch --show-current` is exactly `codex-tgmou0` and local HEAD equals `origin/codex-tgmou0` before any edits.

If fetch/auth/network is blocked, including 403: STOP and report it. Do not create another remote branch/PR and do not modify files.

## Known-good base
PR #90 SHA `2ac5522965db8bab8372632cbdd76f935f5ebd25` passed focused Chromium 60/60, focused WebKit 60/60, full Chromium 185/185, and full WebKit 185/185.

## Current failing checkpoint
The authoritative tested checkpoint is GitHub Actions run `34395162521`, exact SHA `042a4c89fc3c90c38c1ae7017211fac4e0632113`.

Run summary:
- `Focused + full cross-browser regression`: FAILED in focused stage; full regression skipped.
- `Autonomous soak — Chromium long matrix`: PASSED.
- `Autonomous soak — WebKit representative matrix`: FAILED.

### Failure A — focused WebKit
`tests/combat-world-stability.spec.js:134`
Test: `manual hill movement uses the routed terrain cost and waits for the second turn`

Observed:
- 59 focused WebKit tests passed, 1 failed.
- Test timeout 20000 ms.
- It times out waiting to click `[data-context-action="move"]`.
- It never reaches the movement-bank / hill-cost assertion.
- The test first clicks map tile `(6,5)` with a normal locator click.
- The same spec already has `clickMapTileDom(...)` used by nearby robust interaction tests.

Task:
- reproduce the exact WebKit case;
- compare with nearby robust map interaction patterns;
- determine whether the missing move action is caused by test interaction, render/selection timing, or a real product defect;
- do NOT change movement/game logic merely to make the test pass.

### Failure B — WebKit representative soak
`tests/autonomous-soak.spec.js`
Seed: `30303`, failure around turn 28.

Observed:
- current idle contract requires a sustained 150 ms quiet window within 1.5 s;
- failure says DOM did not become idle and reports `480 mutation records`;
- WebKit seed 10101 passed;
- Chromium long soak passed completely.

Task:
- reproduce seed 30303;
- before relaxing timeout/threshold, identify which DOM nodes/attributes continue mutating;
- add failure-only diagnostics if needed;
- determine whether this is real WebKit render churn or a gate false positive around legitimate synchronization/render work.

## Required execution order
1. Read the current top of `AUTONOMY_STATUS.md`.
2. Diagnose only Failure A and Failure B first.
3. Make the smallest evidence-based fix.
4. Run the two exact failing WebKit cases first.
5. If both pass, run the complete focused WebKit gate and the representative WebKit soak.
6. Push only to existing `codex-tgmou0`.
7. Update `AUTONOMY_STATUS.md` with:
   - root cause of each failure;
   - files changed;
   - exact tests/results;
   - exact pushed SHA;
   - new GitHub Actions run.
8. Keep this file compact and rewrite `Exact next task` for whatever remains.

## Stop conditions
- Any fetch/push auth/network failure, including 403: stop and create nothing remotely.
- Do not create another PR or remote branch.
- Do not merge.
- Do not set `READY_FOR_FINAL_DEVICE_TEST` while CI is red/pending or before the complete PR #91 diff is independently reviewed against PR #90 and an immutable exact-SHA link is prepared.
