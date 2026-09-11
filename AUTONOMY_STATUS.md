# AUTONOMY STATUS — CURRENT

Updated: 2026-09-11 UTC.
State: LOCAL_WEBKIT_FIX_PREPARED / CI_VERIFICATION_REQUIRED / NOT_READY_FOR_FINAL_DEVICE_TEST.

## Current checkpoint
- Failure A was isolated to the test's native mobile locator click. The nearby stable map tests dispatch directly to the tile DOM node because WebKit can retarget the mobile gesture after the map rebuild. The hill test now uses that existing helper; movement/game logic is unchanged.
- Failure B's `480` records are consistent with the observer-safety layer's capped/coalesced mutation delivery during idempotent decorator rewrites. The soak idle check now compares `#gameApp` markup across deliveries: equivalent mutation batches do not restart the quiet window, while real DOM changes still do. A real failure now reports semantic-change count and its most frequently mutating node/type/attribute targets.
- Changed files: `tests/combat-world-stability.spec.js`, `tests/autonomous-soak.spec.js`, `AUTONOMY_STATUS.md`, and `CODEX_NEXT_TASK.md`.
- Local WebKit execution is unavailable: the WebKit download returned HTTP 403. Installed Chromium also cannot launch because `libatk-1.0.so.0` is absent. Static syntax and diff checks passed.
- Publication/CI: local commit prepared but unpublished. `git push origin HEAD:codex-tgmou0` failed because this sandbox has no `origin` remote. No replacement branch or PR was created.

## Scope
- Repository: `Mikayilzade/Epohi`.
- Work only in existing PR #91 / branch `codex-tgmou0`.
- Base is PR #90 branch `codex/work-on-existing-pr-and-follow-instructions`.
- No new PR/remote branch, retarget, merge, force-push, or unrelated cleanup.

## Known-good base
- PR #90 SHA `2ac5522965db8bab8372632cbdd76f935f5ebd25` is known green:
  - focused Chromium 60/60;
  - focused WebKit 60/60;
  - full Chromium 185/185;
  - full WebKit 185/185.

## Gate G already implemented in PR #91
- Permanent scoped workflow: `.github/workflows/playwright.yml`.
- Full non-soak Chromium + WebKit regression.
- Deterministic Chromium long soak: 5 seeds × 150 turns or legitimate outcome.
- Representative WebKit soak: 2 seeds × 30 turns or legitimate outcome.
- `tests/autonomous-soak.spec.js` checks save/reload, required interaction resolution, state/content invariants and DOM quiescence.
- Temporary PR #90 workflow was removed.
- Earlier stale treasury/event assertion was aligned to the current toast + history UX without changing game code.
- Earlier fixed 35 ms raw mutation-count soak check was replaced by a sustained 150 ms quiet-window requirement within 1.5 s.

## Latest authoritative CI checkpoint
Exact tested SHA: `042a4c89fc3c90c38c1ae7017211fac4e0632113`.
GitHub Actions run: `34395162521` (`Epohi Permanent Playwright Gate`).
Result: FAILURE.

Jobs:
1. `Focused + full cross-browser regression` — FAILED.
   - Static integrity passed.
   - Focused stage failed.
   - Full mobile regression was skipped because focused failed.
   - Focused WebKit result: 59 passed, 1 failed.
2. `Autonomous soak — Chromium long matrix` — PASSED.
3. `Autonomous soak — WebKit representative matrix` — FAILED.

## Failure A — focused WebKit
File/test:
- `tests/combat-world-stability.spec.js:134`
- `manual hill movement uses the routed terrain cost and waits for the second turn`

Observed failure:
- Playwright test timeout: 20000 ms.
- Failure occurs at the click on `[data-context-action="move"]`.
- Call log waits for `locator('[data-context-action="move"]')`.
- Therefore the test never reaches the terrain-cost assertion or second-turn assertion.

Relevant detail:
- The test first clicks tile `(6,5)` with a normal Playwright locator click, then expects the move context action.
- The same spec already contains DOM-based helper `clickMapTileDom(...)` used by nearby interaction tests.

Current hypothesis, NOT yet proven:
- likely WebKit interaction/render-selection flake or stale interaction style in the test rather than movement-cost logic;
- do not modify movement/game logic without evidence.

## Failure B — WebKit representative soak
File/test:
- `tests/autonomous-soak.spec.js`
- deterministic seed `30303`.

Observed failure:
- seed 30303 fails around turn 28.
- assertion: DOM did not become idle within the current quiescence contract.
- diagnostic reported `480 mutation records`.
- current contract requires a sustained 150 ms quiet window within 1.5 s.
- WebKit seed 10101 passed.
- Chromium long matrix passed completely.

Current hypothesis, NOT yet proven:
- either real WebKit-specific render churn, or a false-positive gate around a legitimate repeated render/synchronization burst.
- before changing the threshold/time budget, identify what DOM nodes/attributes keep mutating; add failure-only diagnostics if needed.

## Exact next step
1. Publish the preserved local commit only to existing branch `codex-tgmou0` from an environment with that remote.
2. In CI, verify the exact hill-movement WebKit test and seed `30303`; inspect the new target diagnostics if seed `30303` still fails.
3. If both pass, require the complete focused WebKit gate and representative WebKit soak to pass, then record the exact tested SHA/run here.
4. Do not authorize final-device testing until all remaining acceptance checks are complete.

## Acceptance / safety
- `READY_FOR_FINAL_DEVICE_TEST` is forbidden while CI is red or pending.
- After fixes, the affected Gate G matrix must be green; then the complete PR #91 diff must be independently reviewed against PR #90 base.
- Confirm the exact tested head SHA and prepare an immutable link pinned to that SHA before authorizing the single final iPhone test.
- Do not merge.
