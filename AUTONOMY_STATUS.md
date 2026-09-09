# AUTONOMY STATUS — CURRENT

Updated: 2026-09-09 UTC.
State: REPAIR_IN_PROGRESS / LOCAL_TEST_INFRA_BLOCKER.

## Scope
- Existing PR #90 on local branch `work`; PR #89 is the base.
- No merge, new PR, review-thread closure, force push or base-branch update performed.

## Sequential stage checkpoint
1. **IN_PROGRESS:** stale outcome cleanup is fixed; CI run `34325857300` confirms the focused gate is 60/60 in both browsers. Full-gate follow-up fixes are pending rerun.
2. **IN_PROGRESS:** SVG registry/cache fix is covered by computed-style and zero-inline-data assertions. Mobile visual/pan/zoom acceptance still needs browser execution; real-iPhone risk remains.
3. **IN_PROGRESS:** cancel/confirm/current-game/reveal/save/reload and default-off setup now have a user-path regression. Awaiting both browsers.
4. **IN_PROGRESS:** the neutral-route failure was a test-map error: only a local three-row strip was water, so the valid router correctly found a longer path outside it. The fixture now makes the whole map water before opening one controlled corridor. The occupied-destination failure was also stale test semantics: allied/own stacking permits the adjacent scout to arrive immediately, so the assertion now verifies mover coordinates, completed (`null`) order, and retained selection.
5. **IN_PROGRESS:** price/progress now pass, but base render removes build actions once the worker acts. Contract is to retain the current command disabled with its duration and reason. Worker UI now recreates that disabled current-project command when absent, and RuntimeInvalidation runs worker decoration after pathing (the last context rebuilder). Decoration is idempotent to avoid observer churn.
6. **BLOCKED:** full final Chromium + WebKit gate and integrated scenario have not run; not `READY_FOR_FINAL_DEVICE_TEST`.

## Checks and blocker
- PASS: `node --check` on every changed JavaScript/spec file; `git diff --check`.
- `npx playwright install --with-deps chromium webkit` failed: package repositories return proxy HTTP 403, leaving Chromium without `libatk-1.0.so.0` and WebKit without its executable.
- Latest known CI: run `34325857300`, job `102382834903`; focused 60/60, full Chromium 183/185 and WebKit 184/185. Worker command lifecycle is fixed above. Chromium stack failure came from a random POI left at fixture coordinates; both controlled cells now clear POI/ruins/camp/improvement without force-clicking or disabling events. The selected mover remains selected until explicit picker selection. Live CI inspection remains unavailable locally.

## Exact next step
On the PR #90 head, first run:
`npx playwright test tests/resource-worker.spec.js tests/stack-reentry-selection.spec.js --project=chromium-mobile --project=webkit-mobile --workers=1`
then let the branch-push workflow run its unchanged full Chromium + WebKit gate. Fix real failures, then read and run `QUALITY_GATES.md` on the final SHA. Do not request device testing before both gates are green.
