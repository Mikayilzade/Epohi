# AUTONOMY STATUS — CURRENT

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
