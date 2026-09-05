# CODEX NEXT TASK

## Task ID
`RUN_254_FOUR_RESIDUAL_CLOSEOUT`

## Goal
Close the four unique residual scenarios from authoritative GitHub Actions run #254 in existing PR #89. Full regression baseline: Chromium 178 passed / 2 failed; WebKit 176 passed / 4 failed.

## Boundaries
- Continue PR #89 only. Do not create or merge another PR, touch `main`, or touch closed duplicate PRs #87/#88.
- No force clicks, arbitrary sleeps, timeout increases, synthetic substitutes for visible flows, legacy-control revival, or weakened behavior coverage.

## Classified package
1. `mobile-context` empty compatibility container — `STALE_TEST`: retain empty, `aria-hidden`, opacity, pointer-events, and height checks without Playwright's geometry-based visibility matcher.
2. `stack-reentry-selection` — `RUNTIME_DEFECT`: infer a new own-unit inspection from an occupied tile even though `.piece` has `pointer-events:none`, except during route targeting; preserve repeated layer cycling.
3. `humans-pathing-performance` — `RUNTIME_DEFECT`: synchronously run the central UI invalidation path after canonical unit inspection rather than waiting only for observer/rAF convergence.
4. `camera-2` large-map fit — `FIXTURE_LAYOUT_RACE`: wait for stable viewport/context/map geometry across animation frames before invoking Show Entire Map; keep all strict fit and centering assertions.

## Completion rule
Run static integrity and the four focused scenarios on Chromium and WebKit. If focused gates are green, run each complete regression suite once. Push one coherent commit to PR #89, inspect the resulting Actions run once, and classify any remaining exact failure before another change.
