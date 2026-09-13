# AUTONOMY STATUS — CURRENT

Updated: 2026-09-13 UTC.
State: PR_100_TWO_FAILURES_FIXED_LOCALLY / AUTHORITATIVE_CI_PENDING / NO_MERGE.

## Current checkpoint
- Scope is existing PR #100 / `codex/fix-github-actions-output-issue`; no branch/PR creation and no merge.
- CI contract root cause: the workflow contract test coupled workflow YAML to reason strings owned by the selector. It now checks the authoritative range-selection and selector-invocation behavior instead.
- WebKit seed 30303 root cause: the harness's 25 ms loop crossed the Playwright protocol for locator visibility on every poll. WebKit protocol overhead accumulated to the test timeout. Turn waiting is now a browser-side semantic wait that reports only meaningful state transitions.
- No gameplay/runtime code, assertion, tolerance, or arbitrary sleep changed.

## Files and validation
- Updated: `tests/ci-push-gate.spec.js`, `tests/autonomous-soak.spec.js`, `CODEX_NEXT_TASK.md`, `AUTONOMY_STATUS.md`.
- Green: syntax checks for both changed specs.
- Green: focused CI contract suite (2/2) and `git diff --check`.
- Local WebKit is blocked because browser download returns HTTP 403. Cached Chromium is blocked by missing `libatk-1.0.so.0`.

## Stop / recommended next action
- Publish to existing PR #100 and use its Actions environment for isolated WebKit seed 30303, full Chromium + WebKit regression, and the representative WebKit soak matrix.
- Keep the PR draft until those authoritative jobs are green. Do not merge.

---

## Previous checkpoint — 2026-09-12
State: PR_93_CAMERA_FIX_VERIFIED_GREEN / RISK_BASED_CI_FINALIZATION_PENDING_SINGLE_VALIDATION / NO_MERGE.

- Camera 2.0 fix was verified green in authoritative PR #93 run #210 at `8ae1ae9da6685218ae5dcd9e99deac151cd03df0`.
- Risk-based CI policy was finalized in `AGENT_TESTING_POLICY.md`.
- CI model classifies only the relevant pushed range, avoids duplicate feature-branch push runs, separates soak from ordinary regression, cancels superseded runs, and fails safe when scope is unknown.
- Camera root cause: WebKit could apply a later 13 px responsive viewport-height update after the synchronous fit; the fix waits for the production camera lifecycle to settle before checking exact fit.
- No arbitrary sleep, tolerance relaxation, or production camera/game-logic change was used.

---

## Historical note
Detailed pre-fix and intermediate CI-policy chronology is intentionally not duplicated here. Use git/Actions history only when a concrete investigation requires it.
