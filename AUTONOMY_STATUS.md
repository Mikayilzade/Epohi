# AUTONOMY STATUS — CURRENT

Updated: 2026-09-13 UTC.
State: PR_100_SCOPED_AUTHORITATIVE_CI_GREEN / FULL_REGRESSION_SKIPPED_BY_CLASSIFIER / NO_MERGE.

## Current checkpoint
- Scope is existing PR #100 / `codex/fix-github-actions-output-issue`; no new branch/PR and no merge.
- CI contract root cause: the workflow contract test coupled workflow YAML to selector-owned reason strings. It now checks authoritative PR range-selection and selector-invocation behavior instead.
- WebKit seed `30303` root cause: the soak harness's 25 ms loop crossed the Playwright protocol for locator visibility on every poll. WebKit protocol overhead accumulated to the test timeout. Turn waiting is now a browser-side semantic wait that reports meaningful state transitions only.
- No gameplay/runtime code, assertion, tolerance, or arbitrary sleep changed.

## Authoritative PR #100 validation
Actions run `34775550869` / run #252 at head `d9b840232bee3dbbcd3bdd7b34359706247ce485` completed successfully for the classifier-selected scope:
- `Classify CI scope` — green.
- `Static integrity` — green.
- `Focused browser regression` — green in Chromium and WebKit.
- `Autonomous soak — Chromium long matrix` — green.
- `Autonomous soak — WebKit representative matrix` — green, 2/2. The job explicitly ran seed `30303`, which passed.
- `Full Chromium + WebKit regression` — skipped by the risk classifier; this is a skip, not a failure.

## PR cleanup
- Accidental child PR #101 contained one fix commit based on PR #100.
- That commit is now directly contained in PR #100.
- PR #101 is closed and is not an active work stream.

## Stop / recommended next action
- Keep PR #100 draft and unmerged while reviewing whether `AGENT_TESTING_POLICY.md` requires an explicit full Chromium + WebKit regression despite the classifier-selected run being fully green.
- Do not rerun CI blindly. If explicit full regression is required, trigger it deliberately under the testing policy; otherwise this checkpoint is ready for the next review decision.

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
