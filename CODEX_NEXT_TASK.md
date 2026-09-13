# CODEX NEXT TASK

## Scope
Work only on existing PR #100 / branch `codex/fix-github-actions-output-issue`.
Do not create another PR or branch. Do not merge. Keep the PR draft until the full gate is genuinely green.

## Current checkpoint
Authoritative GitHub Actions run: `34770696737` on head `f72dd40d375cd4e5b42ead15ecd72b216514b480`.

Current results:
- `Classify CI scope` — green.
- `Static integrity` — green.
- `Autonomous soak — Chromium long matrix` — green.
- `Focused browser regression` — skipped by classifier as expected; this is not a failure.
- `Full Chromium + WebKit regression` — **184 passed, 1 failed**.
  - Failure: `tests/ci-push-gate.spec.js:19`
  - Test: `permanent Playwright workflow uses PR risk classification and avoids duplicate feature-branch push gates`
  - This is the new CI contract test, not a gameplay regression. The earlier `$GITHUB_OUTPUT` newline fix appears to have progressed far enough for heavy jobs to run, but the contract assertion does not currently match the authoritative `playwright.yml` structure or is asserting the wrong thing.
- `Autonomous soak — WebKit representative matrix` — **1 passed, 1 failed**.
  - Stable failing seed: `30303`
  - Location: `tests/autonomous-soak.spec.js:300`
  - Chromium long matrix is green, so treat this as an independent WebKit-specific issue until proven otherwise.
- No checks are still pending.

## Next action
Resolve the two failures separately and by root cause. Do not use reruns as the fix.

### 1. CI push-gate contract failure
First inspect the exact failed assertion in `tests/ci-push-gate.spec.js:19` against the current authoritative `.github/workflows/playwright.yml`.

Determine precisely whether:
- the workflow is wrong, or
- the new contract test is checking an outdated/incorrect structural assumption, or
- the assertion is unnecessarily coupled to YAML formatting/ordering rather than intended CI behavior.

Make the smallest correct fix. Preserve the intended safety contract: PR risk classification must be authoritative and duplicate feature-branch push gates must not be reintroduced.

Do not weaken the test merely to get green. If the test is wrong, replace the wrong structural assertion with the narrow behavioral/semantic assertion that expresses the real contract.

### 2. WebKit autonomous soak seed 30303
Reproduce the WebKit failure for seed `30303` in isolation and identify the first real divergence/failure, not only the final timeout/assertion.

Establish whether the cause is:
- a real runtime/game regression,
- WebKit-specific timing/state progression,
- deterministic harness/test logic,
- or true nondeterministic flake.

Use diagnostics/state evidence. Do not add arbitrary sleeps, do not broaden timeouts blindly, and do not weaken assertions/tolerances just for green. Do not change gameplay behavior unless the evidence shows a real gameplay bug.

## Validation order
Keep validation cheap until both root causes are understood:
1. Run the exact `ci-push-gate` test(s) affected by the fix.
2. Run WebKit autonomous soak seed `30303` alone; repeat only as needed to prove stability/root cause.
3. Run the relevant focused suites for any files actually changed.
4. Only after targeted checks are green, run the authoritative full Chromium + WebKit regression plus the WebKit representative soak matrix.
5. Do not mark Ready for review until the authoritative required jobs are green.

## Guardrails
- Existing PR #100 only.
- No new PR/branch.
- No merge.
- No arbitrary sleeps.
- No assertion/tolerance weakening to hide failures.
- No broad refactor while debugging these two failures.
- Keep unrelated gameplay/runtime code untouched unless a demonstrated root cause requires a minimal fix.

## Finish
When the targeted fixes and authoritative CI are green, update this checkpoint and `AUTONOMY_STATUS.md` with:
- root cause of each failure,
- exact files/logic changed,
- tests run and results,
- authoritative Actions run ID,
- any remaining known issue.
Then stop for review; do not merge.
