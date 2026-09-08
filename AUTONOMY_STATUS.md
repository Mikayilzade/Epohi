# AUTONOMY STATUS — CURRENT

Updated: 2026-09-08 UTC.
State: REPAIR_IN_PROGRESS / LOCAL_TEST_INFRA_BLOCKER.

## Scope
- Existing PR #90 on local branch `work`; PR #89 is the base.
- No merge, new PR, review-thread closure, force push or base-branch update performed.

## Sequential stage checkpoint
1. **IN_PROGRESS:** outcome UI now has one owning action pair, continuation survives three real turns, Saga/goals reopen, and save/main-menu/continue is covered by the user-path regression. Awaiting Chromium + WebKit execution.
2. **IN_PROGRESS:** SVG registry/cache fix is covered by computed-style and zero-inline-data assertions. Mobile visual/pan/zoom acceptance still needs browser execution; real-iPhone risk remains.
3. **IN_PROGRESS:** cancel/confirm/current-game/reveal/save/reload and default-off setup now have a user-path regression. Awaiting both browsers.
4. **IN_PROGRESS:** no stack capacity exists, so own/allied occupants are passable; neutral occupants block; unknown planning does not inspect terrain and execution reveals/rejects hidden water. Added focused state/path regression; visible route/context scenarios remain to run.
5. **IN_PROGRESS:** worker panel now scrolls horizontally on mobile, preserves duration after the action is spent, separates game turns/movement points/worker actions, and shows project done/total/remaining/next step. The real click → build → intermediate UI → next-turn completion path is covered. The same user path saves/reloads intermediate project progress; eligible-city specialization coverage remains to execute.
6. **BLOCKED:** full final Chromium + WebKit gate and integrated scenario have not run; not `READY_FOR_FINAL_DEVICE_TEST`.

## Checks and blocker
- PASS: `node --check` on every changed JavaScript/spec file; `git diff --check`.
- `npx playwright install --with-deps chromium webkit` failed: package repositories return proxy HTTP 403, leaving Chromium without `libatk-1.0.so.0` and WebKit without its executable.
- PR/CI inspection failed through both `gh pr view 90` (no authentication) and the GitHub connector (HTTP 401).

## Exact next step
On the PR #90 head, run:
`npx playwright test tests/humans-outcomes.spec.js tests/humans-art-observer.spec.js tests/humans-pathing-performance.spec.js tests/resource-worker.spec.js tests/coherence-capture-learning.spec.js --project=chromium-mobile --workers=1`
then the same command with `--project=webkit-mobile --workers=1`. Fix real failures, then read and run `QUALITY_GATES.md` on the final SHA. Do not request device testing before both gates are green.
