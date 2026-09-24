# CODEX NEXT TASK

## Target and constraints

Existing integration target: PR #103 / `codex-qgq4u5`. The assigned Orca Lead
worktree `orca/epohi-lead` was clean and verified at `2c6b2a1`, matching the PR
head at the start of the 2026-09-23 audit. The docs audit and design inbox are
recorded locally for review. Before later edits, inspect their history and
re-verify the branch, base and PR head under `AGENTS.md` / `ORCA_HARNESS.md`.

Do not create a replacement branch or PR, push, merge or close PR #103 without
new explicit authorization. Preserve existing mobile code/tests. PC/desktop
Chromium is the active development target; mobile remains deferred for ordinary
PC work unless a failure has shared or desktop impact. Audit performance before
a large graphics/assets rewrite.

## Current next action

1. Review and preserve `DESIGN_INBOX_2026-09-23.md` as an unreviewed inbox, not
   canonical accepted design.
2. Resolve Git/PR/worktree cleanup choices before changing that structure.
3. Do a short Git-for-beginners orientation.
4. Begin Battle Simulator design discussion. No implementation while substantive
   design questions remain.

The completed repository audit remains in `PROJECT_DECISION_AUDIT.md` and the
top of `AUTONOMY_STATUS.md`. The inbox preserves a separate user-note order
that puts Git orientation before cleanup; confirm the order when planning it.

The user has since supplied a historical ChatGPT-side summary. The audit marks
it as CHAT EVIDENCE, separate from repo/GitHub evidence; it also records a
CHAT↔GITHUB discrepancy over PR #101's disposition. Commit `a29d33e`
preserves the exact M01–M15 chat-derived mapping. No historical
`CHAT_EVIDENCE_NEEDED` items remain from this audit; open questions now require
a new user decision on PR #69/#90/#102, manual/device evidence after `9bee0a9`,
or further GitHub investigation of #101. No old chat transcripts were accessed
and no game code changed. Do not treat historical TODO files or inbox ideas as
newly assigned implementation work.

## CI evidence at audit start

At head `2c6b2a1`, GitHub run `35863161549` passed the docs-only scope
classifier; browser jobs were skipped. Run `35634045850` remains the latest
focused browser run and failed two WebKit-mobile camera tests. Neither run
establishes desktop Chromium coverage. Do not rerun heavy browser CI for this
docs-only review unless the testing policy requires it.

Stop for user review. No push, merge or PR creation without new authorization.
