# CODEX NEXT TASK

## Task ID
`RUN_253_EIGHT_RESIDUAL_CLOSEOUT`

## Goal
Close the eight unique residual scenarios from authoritative GitHub Actions run #253 in existing PR #89. Focused Chromium and WebKit were green; the full regression result was Chromium 175 passed / 5 failed and WebKit 172 passed / 8 failed.

## Boundaries
- Continue existing PR #89 only; do not create another PR, merge, or touch `main`.
- Treat PR #87 and PR #88 as closed duplicates.
- Preserve visible canonical interaction flows, strict camera centering, meaningful outcome requirements, and the explicit invalidation deadline.
- Do not force-click, add arbitrary sleeps, revive hidden stack navigation, or change runtime code for stale assertions.

## Classified closeout package
1. `mobile-context` camp scrolling — `STALE_TEST`: only require positive scrolling when content actually overflows; always retain full-text and unclamped readability checks.
2. `mobile-context` empty compatibility containers — `BRITTLE_TEST`: assert visual/inert containment and negligible height rather than exact zero geometry.
3. `camera-2` viewport helper — `STALE_TEST`: calculate content dimensions from computed CSS padding and retain the strict centering tolerance.
4. `player-feedback-treasury` ownership restore — `BRITTLE_FIXTURE`: replace artificial shared-coordinate state with rival inspection followed by a visible own-unit inspection.
5. `resource-worker` barbarian inspection — `STALE_SELECTOR` plus `RUNTIME_DEFECT`: tap `.piece.enemy` and make semantic layer detection classify it as a unit.
6. `stack-reentry-selection` — `RUNTIME_DEFECT`: a visible own-stack tap explicitly establishes own-unit inspection before the canonical stack picker is rendered.
7. `humans-outcomes` blocked palace victory — `SEMANTIC_SETTLE_RACE`: wait for completed turn processing and the stable reconciliation notice/state, without a timer or weaker victory rules.
8. `pathing-explicit-invalidation` — `BRITTLE_HIT_TARGET`: start with the visible `.piece.unit`; preserve the viewport-retarget assertion and one-second actionability bound.

## Completion rule
Run static integrity, then the eight affected specs in Chromium and WebKit. Push one coherent commit to PR #89 and inspect its complete Actions run once. If failures remain, record the exact scenario, assertion, and classified root cause before another change.
