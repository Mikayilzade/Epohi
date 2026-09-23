# CODEX NEXT TASK

## Scope
Work only on existing PR #103 / branch `codex-qgq4u5`.

Do not create another branch or PR. Do not merge. Do not close PR #103.

Before edits, follow the mandatory startup handshake in `AGENTS.md` and confirm that the local checkout is this branch (or a verified local alias of it).

## Current project decision — PC-first development
The user has explicitly changed the active platform priority:

- Primary development target: PC / desktop Chrome/Chromium.
- Main manual playtesting: local desktop build on the user's PC.
- Mobile support is deferred and non-blocking for ordinary game development.
- Existing mobile code and tests must not be deleted merely because mobile is deferred.
- Mobile-specific failures must not block ordinary PC gameplay development unless they reveal a shared/runtime regression that also affects the PC target.
- Before any large graphics/assets rewrite, perform a separate performance audit; do not assume that adding image assets alone will improve performance.
- GitHub remains the source of history/PR/CI/backup, while day-to-day development and manual testing now happen locally.

## Task
Documentation/policy update only.

Read the existing project/policy docs and record this PC-first / mobile-deferred decision in the smallest appropriate set of existing files. Prefer updating existing documents such as `AGENT_TESTING_POLICY.md`, `QUALITY_GATES.md`, `PROJECT_HANDOFF.md`, or another clearly appropriate existing policy/status document rather than creating a new file.

Also update `AUTONOMY_STATUS.md` so future chats/agents see this decision immediately.

Do not change gameplay/runtime code in this task.
Do not delete mobile tests.
Do not weaken existing assertions just to obtain green.
Do not rerun heavy browser CI for a docs-only change unless the repository policy explicitly requires it.

## Context about PR #103
PR #103 currently contains the previous WebKit-focused test fixes and its latest authoritative focused run #262 / `35634045850` is red in two `webkit-mobile` camera tests. Under the new PC-first decision, those mobile-specific failures are not automatically blockers for ordinary PC development. Do not continue fixing them in this docs-only task unless analysis proves they indicate a shared PC/runtime regression.

## Completion criteria
- PC-first / mobile-deferred policy is documented clearly.
- Existing mobile code/tests remain intact.
- `AUTONOMY_STATUS.md` reflects the new active priority.
- Report exactly which docs changed and why.
- Stop for user review. No merge.
