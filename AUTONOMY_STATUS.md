# AUTONOMY STATUS — CURRENT

Updated: 2026-09-13 UTC.
State: PR_100_SCOPED_AUTHORITATIVE_CI_GREEN / CI_V2_PLAN_RECORDED / NO_MERGE.

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

## CI v2 plan recorded
`CI_V2_PLAN.md` now defines the next optional work package: faster CI plus stronger first-failure diagnostics.

Planned phases:
0. baseline/inventory;
1. failure diagnostics foundation (`failure.json`/equivalent, first-failure trace/evidence, correct artifact paths);
2. split soak by browser/seed;
3. split full regression by browser and conservative shards;
4. controlled worker-count experiment only after independence is demonstrated;
5. improve root-cause localization for stateful/soak failures;
6. audit classifier/workflow integration and preserve risk-based coverage;
7. authoritative final validation with measured before/after wall time and coverage equivalence.

The plan includes adaptive exit criteria: if exact wording becomes inapplicable, Codex may use the closest evidence-based equivalent only when it preserves the intent and records the rationale. It may not use flexibility to bypass a genuine red test, weaken assertions, or hide coverage loss.

## Stop / recommended next action
- CI v2 is **planned but not started**. Start only from an explicit user prompt.
- Keep PR #100 draft and unmerged while reviewing whether `AGENT_TESTING_POLICY.md` requires an explicit full Chromium + WebKit regression despite the classifier-selected run being fully green.
- Do not rerun CI blindly.
- When CI v2 is explicitly started, `CI_V2_PLAN.md` supports either one-phase-at-a-time execution or a full autonomous pass through all phases.

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
