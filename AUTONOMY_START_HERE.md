# AUTONOMY START HERE — «Эпохи»

This file is the entry point for autonomous ChatGPT/Codex work on the current Humans v1 stabilization package.

## Mission
Deliver a real **Release Candidate** of the Humans v1 prototype that survives automated cross-browser and long-run testing before Mikayil is asked to test it on a physical iPhone again.

The user is no longer the routine QA loop. Do not ask for manual testing after small fixes.

## Current integration boundary
- Repository: `Mikayilzade/Epohi`
- Active work branch: `codex/coherence-capture-learning-v1`
- Active Draft PR: **#84**
- PR base: `prototype/humans-v1`
- `main` is out of bounds.
- Do not merge PR #84 or update `prototype/humans-v1` without explicit user approval after the final device gate.

## Source-of-truth order
1. Latest code/Git history on the active branch.
2. `AUTONOMY_STATUS.md`.
3. `QUALITY_GATES.md`.
4. `CODEX_NEXT_TASK.md`.
5. PR #84 description/comments.
6. `PROJECT_HANDOFF.md`.

If an older handoff or chat memory disagrees with current repository state, the repository wins.

## Autonomous loop
Every run must:
1. Read this file, `AUTONOMY_STATUS.md`, `QUALITY_GATES.md`, and `CODEX_NEXT_TASK.md`.
2. Fetch PR #84 and verify the current branch head before writing.
3. Inspect the latest relevant CI result/logs. Never guess why CI failed.
4. Execute **one meaningful bounded package** from `NEXT ACTION` / `CODEX_NEXT_TASK.md` (target 30–60 minutes of engineering work, not a cosmetic micro-commit).
5. Add or strengthen regression coverage for every defect fixed.
6. Run the strongest available local/browser checks; push only coherent work.
7. Update `AUTONOMY_STATUS.md` with exact SHA/results/blocker and a single next action.
8. Keep the user-facing report short: `в процессе`, `нужен ответ: ...`, or `готово к финальному тесту` plus one sentence of substance.

## Stop / escalation conditions
Stop autonomous implementation only when one of these is true:
- a genuine product/design choice has multiple reasonable answers and repository context does not decide it;
- a destructive migration or data-loss risk needs approval;
- credentials, payment, legal acceptance, or an unavailable external service is required;
- the project reached `READY_FOR_FINAL_DEVICE_TEST`;
- an infrastructure failure cannot be bypassed after a reasonable retry/diagnostic attempt.

Ordinary test failures, browser differences, refactors, flaky CI, and implementation choices are **not** reasons to ask the user to test or decide.

## Physical-device policy
A physical iPhone test happens only at the final RC gate. Every issue discovered there must first become an automated regression before another device build is offered.

## Commit / CI policy
- Prefer one implementation commit plus at most one stabilization commit per package.
- Do not push no-op commits just to rerun CI.
- Avoid GitHub/email spam.
- Do not weaken or delete a valid test merely to make CI green; update stale tests only when current accepted product rules clearly supersede them.
- Preserve save compatibility or add explicit migration coverage.
