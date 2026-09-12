# AGENT TESTING POLICY — Codex / ChatGPT

This file is a permanent operating rule for autonomous agents working on this repository.

## Purpose
Do not stop useful development merely because the temporary local agent/container environment cannot launch Playwright browsers or install Linux system packages.

A local infrastructure limitation is not automatically a game-code failure.

## Core testing principle: test by risk, not by habit
Do not run the entire browser suite after every change just because a commit exists. Choose the smallest test set that is strong enough for the actual blast radius, then widen only when the risk or gate requires it.

### Tier 0 — docs / checkpoint / agent-instruction only
Examples: `*.md`, handoff/status files, planning notes, comments that cannot affect runtime.

- No heavy Playwright run is required.
- CI may perform only lightweight classification.
- Do not spend browser time merely because a PR already contains older code changes.

### Tier 1 — trivial isolated runtime change
Examples: wording, label/help text, non-behavioral presentation detail, or another very small isolated edit whose behavior/dependencies/selectors are unchanged.

- Run static checks.
- Run the smallest directly relevant focused test only when it adds value.
- Full Chromium + WebKit is not automatic.
- Tier 1 is a semantic engineering judgment. CI must not guess it from a filename alone; the automatic classifier conservatively treats runtime changes it cannot prove trivial as Tier 2.

### Tier 2 — localized feature/mechanic/UI change
Examples: one mechanic, one panel, one bounded interaction, one feature-specific path, or a test-only change.

- Run static checks.
- Run the directly affected focused tests.
- Add neighboring regression tests only when the change can affect adjacent behavior.
- Use WebKit as well as Chromium when the affected behavior is browser/layout/input sensitive.
- Do not escalate to the full suite unless evidence or risk justifies it.

### Tier 3 — shared/high-risk system change
Examples: camera, map/layout, movement/pathfinding, turn flow, state/save-load, shared runtime observers, global DOM/layout, global CSS, common helpers, broad app entry points, Playwright config, dependencies, service worker, or a change spanning several runtime files.

- Run focused tests first locally/in the agent when practical for fast feedback.
- CI may go directly to the full Chromium + WebKit regression because the full gate already subsumes the focused coverage; do not duplicate the same browser work merely for ceremony.
- Run relevant soak/performance/observer stability coverage when the touched system can fail over time or repeated turns.

### Tier 4 — final integration / merge / release gate
Before a user-approved merge into the final/integration target, release, or other explicit final gate:

- Require the full cross-browser gate regardless of how small the last individual change was.
- Include relevant soak/stability coverage required by `QUALITY_GATES.md`.
- Reuse valid green evidence for the exact unchanged SHA; do not rerun identical expensive suites without a reason.
- `workflow_dispatch` is the explicit manual route for a Tier 4 gate when a fresh final gate is needed.

## Automatic GitHub Actions mapping
The permanent Playwright workflow implements the policy conservatively:

- Tier 0: docs/checkpoint-only synchronization -> classifier only; no static/browser/soak jobs.
- Tier 1: not inferred automatically from filenames. Agents may use Tier 1 locally when the edit is genuinely trivial, but pushed runtime changes default to Tier 2 unless they match a higher-risk rule.
- Tier 2: localized runtime/test change -> static checks + directly relevant focused Playwright. Chromium is the default; browser/layout/input-sensitive changes also add WebKit.
- Tier 3: known shared/high-risk paths or a runtime change spanning 4+ files -> static checks + full Chromium/WebKit. Soak runs only for CI/runtime/observer/performance/stability-sensitive paths.
- Tier 4: manual workflow dispatch or a relevant push to `main` -> static + full Chromium/WebKit + both soak jobs.
- If the classifier cannot establish a safe change range, it fails safe to Tier 3 instead of silently skipping coverage.

The path classifier is intentionally conservative. Agents still own the semantic risk judgment and should mention the chosen tier in their report.

## CI efficiency rules
- A docs/checkpoint-only PR synchronization must not rerun heavy Playwright jobs, even when older commits in the same PR changed game code.
- PR `synchronize` classification must use only the newly pushed commit range; PR open/reopen/ready classification may use the whole PR range.
- Feature-branch pushes with an open PR must not also start a duplicate heavy `push` run. PR CI is authoritative for feature branches; automatic `push` gating is reserved for `main`.
- Rapid successive commits should cancel superseded in-progress CI for the same PR/ref so only the newest SHA consumes the expensive gate.
- Batch related checkpoint/status documentation edits into one commit when practical.
- Do not rerun the same unchanged red/green full suite merely to "try again" unless investigating a suspected flake or explicitly requested.
- Prefer rerunning only the failed job/test when that is enough to answer the current question.
- When a full regression already contains the focused tests, do not run a duplicate focused browser matrix in the same CI unless the focused stage has a specific diagnostic purpose.
- If workflow/classifier logic itself changes, validate the final version once; do not repeatedly full-test each intermediate CI-policy edit.

## Browser-test execution policy
1. Run static and non-browser checks locally whenever available (`node --check`, `git diff --check`, unit/static checks).
2. Attempt focused Playwright tests locally when the environment already supports them.
3. If Chromium/WebKit cannot start because a Linux/system dependency is missing (for example `libatk-1.0.so.0`) or package installation is blocked by container permissions/network/proxy restrictions, classify this as `LOCAL_TEST_INFRA_BLOCKER`.
4. Do not repeatedly spend the work package trying to repair an immutable/temporary Codex container.
5. Do not weaken, skip, delete, or rewrite valid browser tests merely because the local container cannot launch the browser.
6. Push coherent code with the strongest checks that can actually run, then use GitHub Actions as the authoritative browser-test environment.
7. Full release gates still require Chromium + WebKit results in CI. A local infrastructure bypass does not mean the browser gate is passed.

## Preferred Playwright installation in CI
GitHub Actions should install only the browsers required by the selected tier/job, using `npx playwright install --with-deps ...`.

Do not install Chromium + WebKit for a docs-only/static job. A localized Tier 2 Chromium-only check should not download WebKit unless the classifier marks the change browser-sensitive.

## CI feedback loop
Normal autonomous loop for browser-dependent work:

`inspect task -> classify risk -> implement -> local static/available focused tests -> push coherent change -> let CI run only the required tier -> inspect exact failure -> fix -> verify`

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
- risk tier chosen and why;
- checks that actually ran and their results;
- local infrastructure blocker, if any;
- CI run/result if available;
- exact next action.

Never turn an infrastructure failure into a false gameplay bug or a false green test result.
