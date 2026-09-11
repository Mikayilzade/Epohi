# CODEX NEXT TASK

## Scope
Work only on existing PR #91 / remote branch `codex-tgmou0` (local `work` may be its sandbox alias). Base is PR #90 branch `codex/work-on-existing-pr-and-follow-instructions`. Do not create/retarget another branch or PR, force-push, merge, or change production game logic without new evidence.

## Current checkpoint
- Pre-fix authoritative run: GitHub Actions `34619598135`, source SHA `8e2ee5922a362f46c46ac1342e4ca2c14b412d6f`.
- Focused Chromium `60/60`, focused WebKit `60/60`, Full Chromium `185/185`, Chromium long soak PASS, WebKit representative soak PASS.
- Full WebKit `183/185`; only `tests/camera-2.spec.js` cases “large map can fit short portrait and landscape viewports below legacy minimum” and “show entire map centers map…” failed.

## Root cause and fix
The WebKit failures sampled camera state after the effective viewport had changed but before the existing `ResizeObserver` reconciliation completed.

Geometry proof:
- Short-screen large map is 36×36 with 44 px tiles and 1 px gaps: `36*44 + 35 = 1619 px` high.
- Failed click-time scale `0.1865348980852378`; later current minimum `0.17850525015441632`.
- Their difference times 1619 is exactly `13.0 px`, proving the fit used a viewport 13 px taller than the viewport underlying the later bound.
- The second failure's vertical center discrepancy is exactly `6.5 px`, half of the same 13 px height change.
- `src/humans-player-feedback-stabilization.js` already observes `#mapViewport` and re-runs `showEntireMap(true)` for a fitted camera. Therefore this is WebKit test timing around post-click layout/observer delivery, not a `camera.js` defect.

Minimal change: `tests/camera-2.spec.js` now polls until scale equals the current bound and x/y match the current viewport's centered fit after the two affected fit clicks. No production code or broad assertion tolerance changed.

## Local verification limitation
- `npx playwright test ... --project=webkit-mobile ...`: cannot launch because WebKit 1.63 is absent.
- `npx playwright install webkit`: HTTP 403 from all Playwright download endpoints.
- Chromium browser is present but cannot launch because `libatk-1.0.so.0` is absent.
- `npx playwright install-deps chromium`: package sources return proxy HTTP 403.

## NEXT ACTION
1. Publish the prepared commit only to existing `codex-tgmou0`.
2. Run exactly the two affected tests on `webkit-mobile` and `chromium-mobile`.
3. If green, run Full WebKit. Then ensure the full non-soak Chromium regression is green (reuse valid same-SHA CI evidence if available).
4. Update this file and the top checkpoint of `AUTONOMY_STATUS.md` with exact SHA/run/results.
5. Do not merge and do not declare `READY_FOR_FINAL_DEVICE_TEST` until permanent CI is green and the complete PR #91 diff is reviewed against PR #90.
