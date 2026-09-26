# CODEX NEXT TASK

## Target and constraints

Existing integration target: PR #103 / `codex-qgq4u5`.

Accepted autonomy and architecture decisions are now canonical in
`ARCHITECTURE_AUTONOMY_DECISIONS_2026-09-26.md`. Read that file before the next
architecture phase. `DESIGN_INBOX_2026-09-23.md` remains an inbox for unresolved
product/gameplay ideas and does not override accepted decisions.

Follow `AGENTS.md` and `ORCA_HARNESS.md`. PC/desktop Chromium remains the primary
current target; preserve mobile code/tests. Do not merge PR #103 without explicit user
approval.

## Current next actions

1. Finish review of the Git/PR/worktree cleanup audit. Do not delete/close ambiguous old
   PRs or branches until their unique work and ancestry are resolved.
2. Bring the accepted cleanup/workflow result into the current integration history.
3. Then start the large autonomous Epohi architecture cleanup using
   `ARCHITECTURE_AUTONOMY_DECISIONS_2026-09-26.md` as the working contract.
4. The architecture Lead should:
   - audit the real code and define Epohi-specific completion criteria;
   - leave a short checkpoint with plan/risks;
   - continue without waiting when no user decision is required;
   - refactor by logical system boundaries, preserving gameplay behavior;
   - choose test depth by risk;
   - trace/measure important runtime paths including End Turn;
   - update the living technical passport;
   - remove obsolete duplicate implementations before declaring completion.
5. Battle Simulator design remains separate and must not be implemented inside this
   architecture task while its gameplay questions are unresolved.

## Publication/autonomy

For the already-authorized current integration branch, Lead may create coherent commits
and push them to PR #103 after its normal review/checks. Do not merge, force-push, close
old PRs, delete important remote branches, or create replacement/new PRs except as allowed
by the repository safety rules and explicit user authorization.

## Known open Git decision

The previous audit found old open PRs including #69/#90/#102 and a stacked ancestry ending
at #103. Their final disposition is not yet assumed. Resolve with Git/GitHub evidence
before cleanup actions; do not infer that an old PR is disposable merely because a later
PR exists.

Stop only for a real blocker, a meaningful gameplay/design choice, a dangerous Git action,
or completion of the assigned goal.
