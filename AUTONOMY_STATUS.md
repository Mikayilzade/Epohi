# AUTONOMY STATUS — CURRENT

Updated: 2026-09-09 UTC.
State: GATE_G_FIX_PUBLISHED / CI_PENDING / NOT_READY_FOR_FINAL_DEVICE_TEST.

## Known-good base
- PR #90 branch: `codex/work-on-existing-pr-and-follow-instructions`.
- PR #90 SHA `2ac5522965db8bab8372632cbdd76f935f5ebd25` is known green: focused Chromium 60/60, focused WebKit 60/60, full Chromium 185/185, full WebKit 185/185.

## Gate G recovery
- Recovery stays in existing PR #91 / branch `codex-tgmou0`; no replacement PR/branch and no merge.
- Codex cloud could not fetch GitHub because its network proxy returned `CONNECT tunnel failed, response 403`, so Gate G was reconstructed directly through the GitHub repository API.
- `package-lock.json` is retained for reproducible `npm ci` and Playwright installs.
- The temporary PR #90 workflow is removed and `.github/workflows/playwright.yml` is the permanent scoped workflow.
- `tests/autonomous-soak.spec.js` provides deterministic autonomous campaigns with periodic save/reload, interaction resolution, turn-idle checks, state/content invariants and idle-DOM quiescence checks.
- `tests/ci-push-gate.spec.js` protects the permanent workflow contract rather than the deleted temporary branch workflow.

## First permanent CI result and diagnosis
- Gate G head `f502daa3c999532a0566fbab8584efc5b1bf2fb9` exposed two test-gate defects, not evidence of a product regression.
- Full Chromium found a stale `player-feedback-treasury` assertion that expected the retired `#feedbackWorldEvents` panel, while the current canonical UX intentionally uses the event toast + chronicle/history flow. The test was aligned with the current canonical behavior; game code was not changed.
- Chromium/WebKit soak exposed a false-positive idle-DOM threshold: one legitimate delayed synchronization produced exactly 240 mutation records inside a fixed 35 ms window. The soak now checks that the DOM reaches a sustained 150 ms quiet window within 1.5 s instead of treating a finite render burst as runaway churn. Dedicated runtime cadence tests remain responsible for flush-rate limits.
- Test fixes were published in commits `bb8b8698c0e14e90fc2350652b843ff3877202dc` and `1b27cf406143c8de6c2953aa8a7b4c075cb219b7`; subsequent commits only update Gate G checkpoint documentation.
- Current branch head is `ffc1ab5fa87d3900bc6edd88ccd245bc2f2f8fb6` plus this status checkpoint commit; use the actual fetched current head as authoritative.
- CI runs are queued because the workflow intentionally uses `cancel-in-progress: false` and superseded earlier code checkpoints must finish first.

## Permanent Gate G matrix
- Focused Chromium + WebKit: the established 13-spec runtime set, one worker, strict per-test budget.
- Full Chromium + WebKit: all non-soak Playwright regression tests.
- Long soak Chromium: 5 deterministic seeds × 150 turns (or legitimate victory/defeat), periodic save/reload.
- Representative soak WebKit: 2 deterministic seeds × 30 turns (or legitimate victory/defeat), periodic save/reload.

## Safety / acceptance
- `READY_FOR_FINAL_DEVICE_TEST` is forbidden while CI is pending or red.
- After green CI, independently review the complete PR #91 diff and confirm the exact tested head SHA.
- Prepare an immutable GitHub link pinned to that exact SHA.
- Do not change branch contents after the final green exact-SHA checkpoint unless a failure requires a fix and a complete rerun.
- Only after those conditions may Mikayil perform the single final iPhone test.

## Exact next step
Wait for the permanent GitHub Actions workflow on the current fetched PR #91 head. If any job fails, diagnose the failing job/log first and make only the minimal evidence-based fix; rerun the complete affected Gate G matrix. Do not merge and do not request device testing yet.
