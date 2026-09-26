# Orca worker worktrees

These rules apply when the user or an explicit Orca task header assigns a separate worker worktree/branch and names its integration PR/branch. The integration branch remains the primary target. The worker branch is a valid local execution context, not a replacement integration branch or a branch mismatch.

## Models

Use the following model and effort when assigning Orca roles, where available:

| Work | Model and effort |
| --- | --- |
| Lead/orchestrator | GPT-6 Sol Medium |
| Simple inventory, docs, git, status | GPT-6 Luna Low |
| Ordinary implementation | GPT-6 Sol Medium |
| Complex unknown root cause, race, architecture | GPT-6 Astra Medium |

Do not use Astra by default. Choose it for the complex cases above.

## Context and startup check

Start with `AGENTS.md` and the current task/checkpoint. Read additional documents only when the task requires them; do not reread the whole repository or its history without a reason. Before edits or tests:

1. Record the assigned worker branch and integration PR/branch from the current task. Do not infer either from the worktree directory name alone.
2. Confirm the current Git branch is the assigned worker branch and the working tree is clean. Inspect `git rev-parse HEAD` and `git log -1 --oneline`.
3. Verify that the worker is based on the integration branch's current known checkpoint: compare available local refs and commit ancestry, and use remote/PR metadata when accessible. A preloaded checkpoint may serve as evidence under the `AGENTS.md` sandbox rules. If the base cannot be verified, or the snapshot contradicts the task, stop before editing and report the mismatch. Do not switch branches or create a replacement branch.
4. In the first user-facing response, confirm the worker branch, integration PR/branch, and applicable publication restrictions. Then read only the task-specific files needed under the minimum-context rules in `AGENTS.md`.

## Worker boundaries

- Keep edits and tests inside the assigned worker worktree. Treat the integration branch/PR as the destination for later review, not as the checked-out branch.
- Do not switch to the integration branch, push, merge, or create a PR without explicit authorization in the current user instruction. Never create a replacement branch or PR to work around a failed fetch or publication problem.
- Leave a reviewable diff or a coherent local commit. Before committing or handing off, inspect the full intended diff and confirm it belongs to the assigned task.
- By default, workers do not edit the shared `AUTONOMY_STATUS.md` or `CODEX_NEXT_TASK.md`. The Lead/integrator updates them after accepting the worker result, unless the user specifically assigns that edit to the worker.

## Worktree mini-log

Maintain a worktree checkpoint or task comment with these fields:

`STATUS / GOAL / DONE / EVIDENCE / NEXT / BLOCKER`

Record the initial task state when work begins, then update it on meaningful progress, a blocker, and completion. Do not log when state has not changed or copy raw logs into it.

## Testing and platform

- Follow `AGENT_TESTING_POLICY.md`. Start with focused, cheap checks and widen by risk. Do not launch heavy CI blindly or weaken valid assertions/timeouts merely to get green results.
- PC with desktop Chrome/Chromium is the primary target. Mobile support is deferred and non-blocking for ordinary PC work; preserve mobile code and tests. A mobile failure matters when evidence shows shared runtime or desktop impact.
- Perform a separate performance audit before a large graphics or assets rework.

## Completion report

Report what was investigated or changed, the decision or root cause when applicable, checks actually run, remaining work or blockers, and whether the diff is ready for integration. Include the worker branch, base commit, and changed files. Preserve coherent local work if publication is unavailable.
