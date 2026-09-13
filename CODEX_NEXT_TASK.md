# CODEX NEXT TASK

## Scope
Work only on existing PR #100 / branch `codex/fix-github-actions-output-issue`. Do not create another PR/branch and do not merge.

## Current checkpoint — authoritative scoped CI green
The two failures originally seen in Actions run `34770696737` were diagnosed, fixed, and verified in the authoritative PR #100 Actions environment.

- CI contract failure: `tests/ci-push-gate.spec.js` no longer couples workflow YAML to selector-owned reason strings. It checks the actual PR range-selection and selector-invocation contract.
- WebKit soak seed `30303`: the 25 ms cross-protocol polling loop was replaced with a browser-side semantic wait. No gameplay/runtime code, assertion, tolerance, or arbitrary sleep was changed.

## Authoritative validation
PR #100 Actions run `34775550869` / run #252 at head `d9b840232bee3dbbcd3bdd7b34359706247ce485` completed successfully for the classifier-selected scope:
- `Classify CI scope` — green.
- `Static integrity` — green.
- `Focused browser regression` — green in Chromium and WebKit.
- `Autonomous soak — Chromium long matrix` — green.
- `Autonomous soak — WebKit representative matrix` — green, 2/2; this explicitly includes seed `30303` and it passed.
- `Full Chromium + WebKit regression` — skipped by the risk classifier, not failed.

A prior child PR #101 was accidental. Its single fix commit is now contained directly in PR #100; #101 is closed and is not a separate work stream.

## Next action
Stop for review. Do not rerun CI blindly and do not merge.

Before marking PR #100 Ready for review, make one explicit policy decision: whether the successful classifier-selected authoritative run is sufficient, or whether an explicit full Chromium + WebKit regression is still required despite the classifier skipping it. If a full run is required, trigger it deliberately according to `AGENT_TESTING_POLICY.md`; do not weaken tests or change scope merely to force green.
