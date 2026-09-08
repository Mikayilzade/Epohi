# AUTONOMY START HERE — «Эпохи»

Use this file only when Mikayil asks an agent to continue autonomously. The permanent lightweight entry point is `AGENTS.md`.

## Start

1. Follow `AGENTS.md` and send its one-line startup receipt.
2. Verify the actual repository, current branch/head, PR base, user scope, and latest relevant CI. Do not trust branch or PR numbers copied from old notes.
3. Read all of `CODEX_NEXT_TASK.md`.
4. Read only the newest checkpoint at the top of `AUTONOMY_STATUS.md`, stopping at the first `---` or “Historical checkpoints” marker.
5. Open `QUALITY_GATES.md`, `AGENT_TESTING_POLICY.md`, a checklist, or old handoff history only when the current task specifically needs it.

The current branch and PR are intentionally not hard-coded here because they change. Repository and CI state win over historical chat or documents.

## Work loop

- Complete one meaningful, bounded package from the current task.
- Diagnose from exact source/CI evidence; never guess a failed test's cause.
- Add or preserve regression coverage for real defects.
- Start with focused checks. Use the full cross-browser gate only at the appropriate gate.
- Do not spend a run repeatedly repairing an immutable temporary environment; follow `AGENT_TESTING_POLICY.md` when that problem actually occurs.
- Update only the compact current handoff needed by the next agent.
- Report briefly: result, blocker if any, and one next action.

## Stop or ask

Stop only for a real product choice not decided by current evidence, destructive/data-loss risk, unavailable credentials/service, explicit user-controlled merge/device gate, or a blocker with no safe path forward.

Do not request routine manual testing after small fixes. Do not merge or alter protected/integration branches without explicit user approval.
