# AGENT TESTING POLICY — Codex / ChatGPT

This file is a permanent operating rule for autonomous agents working on this repository.

## Purpose
Do not stop useful development merely because the temporary local agent/container environment cannot launch Playwright browsers or install Linux system packages.

A local infrastructure limitation is not automatically a game-code failure.

## Browser-test execution policy
1. Run static and non-browser checks locally whenever available (`node --check`, `git diff --check`, unit/static checks).
2. Attempt focused Playwright tests locally when the environment already supports them.
3. If Chromium/WebKit cannot start because a Linux/system dependency is missing (for example `libatk-1.0.so.0`) or package installation is blocked by container permissions/network/proxy restrictions, classify this as `LOCAL_TEST_INFRA_BLOCKER`.
4. Do not repeatedly spend the work package trying to repair an immutable/temporary Codex container.
5. Do not weaken, skip, delete, or rewrite valid browser tests merely because the local container cannot launch the browser.
6. Push coherent code with the strongest checks that can actually run, then use GitHub Actions as the authoritative browser-test environment.
7. Full release gates still require Chromium + WebKit results in CI. A local infrastructure bypass does not mean the browser gate is passed.

## Preferred Playwright installation in CI
GitHub Actions should install browsers together with Linux dependencies, normally with:

`npx playwright install --with-deps chromium webkit`

If repository/package constraints require another equivalent supported Playwright setup, document the reason.

## CI feedback loop
Normal autonomous loop for browser-dependent work:

`inspect task -> implement -> local static/available tests -> push -> GitHub Actions browser tests -> inspect exact CI failure -> fix -> push again`

Do not guess a CI failure reason. Read the workflow/job/log when access is available.

## When GitHub/CI access is unavailable inside the agent shell
Failure of `gh`, `git fetch`, package mirrors, or GitHub API access from a restricted shell/container must not be confused with repository state.

- Use the platform-provided GitHub integration/connector when available.
- If the current agent truly cannot read CI but can still produce a coherent code change, record the limitation in `AUTONOMY_STATUS.md` and leave browser validation pending CI rather than declaring the implementation failed.
- Do not claim tests passed when they did not run.
- Do not claim development is blocked if useful implementation/static verification can continue safely.

## Stop condition for infrastructure
Infrastructure is a reason to stop only when the next meaningful engineering action genuinely depends on an unavailable capability and no safe CI/platform route exists.

Example that should NOT stop development:
- local Chromium fails to launch because `libatk-1.0.so.0` is absent and `apt`/Playwright dependency installation is blocked, while GitHub Actions can run Playwright.

Example that MAY stop development:
- the required CI environment itself is broken/unavailable and the next change cannot be evaluated safely by static/non-browser checks.

## Reporting
When this policy is used, record succinctly:
- checks that actually ran and their results;
- local infrastructure blocker, if any;
- CI run/result if available;
- exact next action.

Never turn an infrastructure failure into a false gameplay bug or a false green test result.
