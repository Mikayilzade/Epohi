# AUTONOMY STATUS — CURRENT

Updated: 2026-09-11 UTC.
State: PR_93_CAMERA_WAIT_FIX_COMMITTED / CI_VERIFICATION_REQUIRED.

## Current checkpoint
- Scope is existing PR #93 / `codex/-full-webkit-camera-2.0`; local `work` is its Codex alias. Starting HEAD: `772e06afa99486c1bf317c398b20511507e1f9ed`.
- Run `34628187407`, rerun job `103378601679`: Full WebKit `183 passed, 2 failed`; focused suite and both soaks green. Only the two Camera 2.0 fit/center tests failed.
- Root cause is confirmed as a test synchronization race: the old `waitForMapFit` accepted the synchronous click-time fit before WebKit changed the viewport height by 13 px and the existing `ResizeObserver` reconciliation ran. The two failures encode the same change (13 px from scale geometry; 6.5 px from centering).
- Minimal change: wait for the production `camera-smooth` fit lifecycle to finish, then poll the original exact fit predicate. No sleep, production change, tolerance change, or weakened assertion.
- The fix is committed locally. Local WebKit verification is unavailable because `webkit-2359` is absent. Focused PR CI must run first.

## NEXT ACTION
1. Update only existing PR #93 with the prepared commit.
2. Run exactly `tests/camera-2.spec.js:188` and `tests/camera-2.spec.js:210` on `webkit-mobile`.
3. If green, run Full WebKit/CI and replace this checkpoint with the exact tested SHA/run/job/results.
4. Do not merge, create another PR/branch, or publish to `codex-tgmou0`.

---

## Historical checkpoint (superseded PR #91 material)

Updated: 2026-09-11 UTC.
State: CAMERA_2_TEST_FIX_PREPARED / CI_VERIFICATION_REQUIRED / NOT_READY_FOR_FINAL_DEVICE_TEST.

## Current checkpoint
- Scope remains existing PR #91 / remote branch `codex-tgmou0`; local `work` is the sandbox alias. No new branch/PR and no merge.
- Authoritative failing run before this change: Actions `34619598135`, source SHA `8e2ee5922a362f46c46ac1342e4ca2c14b412d6f`, Full WebKit `183/185` with only the two Camera 2.0 failures.
- Root cause: the assertions sampled between WebKit's post-click layout change and the existing `ResizeObserver` camera reconciliation. This is proven by the failure geometry, not floating-point tolerance: the large 36×36 short-screen map is 1619 px high (`36*44 + 35*1`), and `(0.1865348980852378 - 0.17850525015441632) * 1619 = 13.0 px`; the other failure's center moved 6.5 px, exactly half that 13 px viewport-height change. The later `bounds.min` therefore came from a viewport 13 px shorter than the viewport used by `showEntireMap()`.
- Production already observes `#mapViewport` resize and re-runs `showEntireMap(true)` when the camera was fit. The defect is test timing on WebKit, not `camera.js` or game logic.
- Minimal fix in `tests/camera-2.spec.js`: after the fit click, poll the semantic fitted state (scale equals current minimum and both axes are centered) before reading final assertions. No tolerance was broadened and no production code changed.
- Local browser execution is blocked by the environment: WebKit 1.63 download returns HTTP 403; installed Chromium cannot load `libatk-1.0.so.0`, and dependency installation also returns proxy HTTP 403.

## NEXT ACTION
1. Publish the current commit only to existing branch `codex-tgmou0`.
2. Run the two affected Camera 2.0 cases on WebKit and Chromium.
3. If both are green, run Full WebKit as explicitly requested; then run the full non-soak Chromium regression if the permanent gate does not already do so.
4. Record exact tested SHA/run and results here and in `CODEX_NEXT_TASK.md`. Do not merge or declare final-device readiness while CI is pending/red.
