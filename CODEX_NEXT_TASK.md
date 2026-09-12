# CODEX NEXT TASK

## Scope
Work only on existing PR #93 / remote branch `codex/-full-webkit-camera-2.0` (local `work` is the Codex sandbox alias). Base/head for this investigation was `772e06afa99486c1bf317c398b20511507e1f9ed`. Do not create another branch or PR, publish to `codex-tgmou0`, or merge.

## Current checkpoint
- Authoritative rerun before this change: Actions run `34628187407`, rerun job `103378601679`.
- Full WebKit result: `183 passed, 2 failed`; focused suite and both soak jobs were green.
- The only failures were `tests/camera-2.spec.js:188` (large map fit in short portrait/landscape) and `tests/camera-2.spec.js:210` (show-entire-map centering).

## Confirmed root cause and minimal fix
- `waitForMapFit` added in `772e06a` could accept the synchronous click-time fit immediately, before WebKit's later responsive layout pass.
- The failed large-map scale was based on a viewport 13 px taller than the viewport used by the subsequent assertion: `(0.1865348980852378 - 0.17850525015441632) * 1619 = 13.0`.
- The other failure's 6.5 px vertical-center discrepancy is exactly half of that same 13 px viewport-height change.
- Production's `ResizeObserver` already queues a reconciliation frame and re-runs `showEntireMap(true)` for a fitted camera. No `camera.js` or game-logic defect is indicated.
- The test now waits for the fit action's production `camera-smooth` lifecycle to finish before polling the unchanged exact fit predicate. This is a state-based synchronization point, not an arbitrary sleep; no assertion or tolerance was weakened.

## Verification status
- Local focused WebKit launch is blocked because Playwright WebKit 1.63 (`webkit-2359`) is not installed in this environment.
- `node --check tests/camera-2.spec.js` and `git diff --check` passed; the scoped diff was reviewed before commit.

## NEXT ACTION
1. Run the two affected tests on `webkit-mobile` for the resulting commit in PR #93.
2. If green, run Full WebKit/CI and record the exact SHA, run, job, and results here and at the top of `AUTONOMY_STATUS.md`.
3. Do not merge or create/retarget a PR or branch.
