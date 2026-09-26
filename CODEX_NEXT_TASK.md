# CODEX NEXT TASK

## Current integration target

Use **only** PR #103 / branch `codex-qgq4u5`.

- PR #103 is OPEN / Draft.
- Base: `main`.
- Head: `codex-qgq4u5`.
- The older stacked PRs #69, #84, #85, #86, #89, #90, #91, #93, #99, #100 and #102 were reviewed and closed without merge on 2026-09-26.
- Their remote branches have **not** been deleted.
- Do not reopen or recreate the old PR stack unless a concrete missing commit is later proven necessary.
- Do not create a replacement PR for ordinary continuation work.
- Do not merge PR #103 without explicit user approval.

Accepted autonomy and architecture decisions are canonical in
`ARCHITECTURE_AUTONOMY_DECISIONS_2026-09-26.md`.

`DESIGN_INBOX_2026-09-23.md` remains an inbox for unresolved gameplay/product ideas and
must not be treated as accepted implementation work.

Follow `AGENTS.md` and `ORCA_HARNESS.md`.

## Why the old PRs were closed

Most old PR heads are direct ancestors of #103 and therefore their work is already contained
in the current integration history.

PR #85 and #86 had Git history that diverged from #103, so they were checked separately
before closure:

- #85's two unique commits only expanded a temporary cross-browser workflow for the old
  stabilization child branches. That temporary workflow no longer exists on #103 and is
  obsolete for the current one-PR workflow.
- #86's unique branch contained old run-240/run-246 checkpoint documents plus source/test
  repairs. The relevant runtime/test behavior is present or further evolved in #103
  (foreign-unit context handling, outcome controls, stack-picker tests, visible city/science
  flows, worker-time tests, etc.). The old status/task documents and temporary workflow
  wiring are historical, not missing current work.

Closing those PRs did not delete their branches or commits.

## Next large task

Start the autonomous Epohi architecture cleanup using
`ARCHITECTURE_AUTONOMY_DECISIONS_2026-09-26.md` as the working contract.

Lead should:

1. Audit the real current code and define Epohi-specific completion criteria.
2. Leave a short checkpoint describing the plan, major risks and expected module boundaries.
3. Continue automatically unless a meaningful gameplay/design decision, dangerous Git action
   or real blocker requires the user.
4. Refactor by logical responsibilities rather than arbitrary file-size targets.
5. Keep gameplay logic separate from UI/presentation and balance/config separate from
   algorithms.
6. Preserve intended gameplay behavior while allowing internal rewrites and obvious
   technical fixes.
7. Choose test depth by risk.
8. Trace and measure important runtime paths, especially End Turn, before/after relevant
   changes.
9. Maintain the living technical architecture passport.
10. Remove obsolete duplicate implementations before declaring the cleanup complete.

PC/desktop Chromium remains the primary current target. Preserve mobile code/tests.

Battle Simulator design remains separate and must not be implemented inside the Epohi
architecture cleanup while its gameplay questions remain unresolved.

## Publication rules

For the already-authorized current integration branch, Lead may make coherent commits and
push them to PR #103 after normal review/checks.

Do not:
- merge #103 without explicit user approval;
- force-push;
- delete important remote branches;
- create replacement PRs;
- reopen the old PR stack without evidence that current #103 is missing required work.

Stop only for a real blocker, a meaningful gameplay/design choice, a dangerous Git action,
or completion of the assigned goal.
