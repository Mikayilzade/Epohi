# CODEX NEXT TASK

## Scope
Repository: `Mikayilzade/Epohi`.
Work only for existing PR #91 / remote branch `codex-tgmou0`.
Base is PR #90 branch `codex/work-on-existing-pr-and-follow-instructions`.
Do not create any NEW REMOTE branch, another PR, retarget a PR, force-push, or merge.

## Minimum-context rule
Do not broadly reread repository history or old chat context.
For this task, use only:
1. this file;
2. the top/current contents of `AUTONOMY_STATUS.md`;
3. the exact failing specs and directly relevant helpers/code;
4. current PR #91 diff/CI only when needed to verify the fix.

## CODEX SANDBOX GATE — MUST HAPPEN FIRST
Browser Codex can preload the requested branch while naming the local checkout `work`. Do not fetch/rename merely to make the local branch name match.

Before editing/testing:
1. Run `git status --short --branch` and require a clean working tree.
2. Record `git rev-parse HEAD` and `git log -1 --oneline`.
3. Confirm this file contains the current checkpoint below: run `34395162521`, Failure A = focused WebKit hill-movement timeout, Failure B = WebKit soak seed `30303` DOM-idle failure.
4. If the Codex task itself was launched on `codex-tgmou0` and this current checkpoint is present, treat the local `work` checkout as the sandbox alias for that requested snapshot and continue local diagnosis/testing even if `git fetch` returns `CONNECT tunnel failed, response 403`.
5. Do not create a replacement remote branch/PR. If later publication to the existing branch is blocked, preserve the local changes/commit and report the exact diff/commit plus the network blocker.

STOP only if the preloaded files do not match this checkpoint, the working tree is unexpectedly dirty before work, or there is evidence the snapshot belongs to a different branch/task.

## Known-good base
PR #90 SHA `2ac5522965db8bab8372632cbdd76f935f5ebd25` passed focused Chromium 60/60, focused WebKit 60/60, full Chromium 185/185, and full WebKit 185/185.

## Current checkpoint
The last authoritative CI failure is GitHub Actions run `34395162521`, exact tested SHA `042a4c89fc3c90c38c1ae7017211fac4e0632113`.

A local test-only commit is prepared but unpublished: the hill case uses the existing direct-DOM map helper, and the soak idle contract ignores mutation batches that leave `#gameApp` markup equivalent while reporting semantic mutation targets on failure. Local browser verification is blocked because WebKit download returns 403 and Chromium lacks `libatk-1.0.so.0`; static checks pass. Publication is blocked because this sandbox has no `origin` remote.

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

## Exact next task
1. Publish the preserved local commit only to existing `codex-tgmou0` from an environment with that remote.
2. Do not create a replacement remote, branch, or PR.
3. Let existing PR #91 CI run the two exact WebKit failures first, then the complete focused WebKit and representative soak gates.
4. If seed `30303` still fails, use the new semantic target diagnostic rather than relaxing the timeout.
5. Record the exact tested SHA/run. Do not create another branch/PR or merge.

## Stop conditions
- Preloaded snapshot/checkpoint mismatch or unexpected dirty tree before work.
- Do not create another PR or remote branch.
- Do not merge.
- Do not set `READY_FOR_FINAL_DEVICE_TEST` while CI is red/pending or before the complete PR #91 diff is independently reviewed against PR #90 and an immutable exact-SHA link is prepared.
