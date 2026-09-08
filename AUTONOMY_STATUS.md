# AUTONOMY STATUS — CURRENT

Updated: 2026-09-08 UTC.
State: REPAIR_IMPLEMENTED / LOCAL_TEST_INFRA_BLOCKER.

## Scope
- Existing PR #89; local branch `work`, repair code SHA `a21afcd0e5bde2eeb198e9591eb4c16564f6e2d6`.
- No merge, PR/thread closure, protected-branch update, force push or new PR performed.

## Stages
1. **BLOCKED (implementation complete):** continued outcomes are now terminally suppressed before every recalculation; the regression waits through delayed sync and explicitly rechecks state/modal after a turn. Browser acceptance, three turns, Saga/goals and save/load remain pending.
2. **BLOCKED (implementation complete):** generated SVG data is registered once in a stylesheet instead of copied into every map node; service worker is network-first with a new cache. Visual pan/zoom/mobile checks and screenshots remain pending, including real-iPhone risk.
3. **BLOCKED (implementation complete):** reveal-map remains in the current game, persists `openMapMode`, and now requests an immediate save; existing default-off new-game option and legacy migration were source-audited. Browser save/reload checks remain pending.
4. **BLOCKED (implementation complete):** source has no tile stack-capacity rule, so own/allied units no longer block routes; unknown cells use neutral planning cost without reading hidden terrain/occupants. Browser route, attack, fog and context checks remain pending.
5. **BLOCKED (implementation complete):** retained worker-time balance (1–4 worker turns, repair 1) and added specialization selection directly to eligible city UI with truthful population copy. Browser progress/save/reopen checks remain pending.
6. **BLOCKED:** full Chromium + WebKit gate and integrated scenario cannot run locally; not `READY_FOR_FINAL_DEVICE_TEST`.

## Changed files
`src/app.js`, `src/humans-observer.js`, `src/humans-outcomes.js`, `src/humans-pathing-core.js`, `src/humans-population-workforce.js`, `src/humans-visuals.js`, `sw.js`, `tests/humans-outcomes.spec.js`.

## Checks and exact blocker
- PASS: `node --check` for every changed JavaScript file; `git diff --check`.
- Chromium launch blocked by missing `libatk-1.0.so.0`.
- WebKit launch blocked because `/root/.cache/ms-playwright/webkit-2359/pw_run.sh` is absent.
- GitHub/CI inspection blocked because `gh` has no authentication in this environment.

## Exact next step
Push the committed repair to the existing PR #89 branch, run the focused Chromium + WebKit specs listed in the latest commit/checkpoint, fix any real failures, then run `QUALITY_GATES.md`; only after both projects and the integrated scenario pass may the status become `READY_FOR_FINAL_DEVICE_TEST`.
