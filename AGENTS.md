# AGENTS.md — Epohi

This is the only automatic repository entry point for ChatGPT/Codex agents. It overrides older repository startup/read-all instructions when they conflict; system instructions and the user's latest request still have higher priority.

## Minimum-context workflow

1. Treat the user's latest request plus `CODEX_NEXT_TASK.md`, the current branch/PR, diff, and CI state as the source of truth.
2. For an autonomous “continue/go” task, read `CODEX_NEXT_TASK.md` and only the newest checkpoint at the top of `AUTONOMY_STATUS.md`; stop at the first `---` / historical marker.
3. Do not preload repository history. Open other documents only when the task requires them:
   - `QUALITY_GATES.md` for a release/full gate;
   - `AGENT_TESTING_POLICY.md` for browser testing or infrastructure trouble;
   - design/checklist/handoff history only for the affected feature or a real contradiction.
4. Search narrowly first (`rg`, exact paths, focused CI step). Do not reread unchanged files, old chat history, full logs, or already-superseded checkpoints.
5. Run the smallest relevant test first. Run full Chromium + WebKit only for the required final/full gate or when the user explicitly asks. Reuse valid green evidence for an unchanged SHA.
6. Keep user updates short and factual. Ask only a blocking question.
7. On pause or context pressure, keep `CODEX_NEXT_TASK.md` compact and put one concise current checkpoint at the top of `AUTONOMY_STATUS.md`; do not duplicate old narratives or raw logs.

## Codex sandbox / branch handling

1. Browser Codex may show the requested remote branch in the task header while the local checkout itself is named `work`. This local `work` name can be a sandbox alias; do not require a network fetch or branch rename solely because of that name.
2. Before edits/tests, require a clean working tree and inspect `git rev-parse HEAD`, `git log -1 --oneline`, and the current `CODEX_NEXT_TASK.md` checkpoint.
3. If the task was explicitly launched on the branch named in `CODEX_NEXT_TASK.md` and the preloaded files contain that current checkpoint, it is allowed to inspect, edit, and test the preloaded snapshot even when `git fetch` is blocked by the Codex network tunnel.
4. A fetch/push 403 is a publication/network limitation, not by itself a reason to discard useful local diagnosis or test work. Continue local diagnosis/testing when the preloaded snapshot is clearly the requested checkpoint.
5. Never create a replacement remote branch or PR to work around network failure. If publication to the existing branch is unavailable, keep the local changes intact and report the exact local commit/diff and the blocker.

## Branch / PR safety

1. Work only for the branch and PR named in `CODEX_NEXT_TASK.md` or in the user's latest instruction; a Codex-local `work` alias does not authorize a different remote target.
2. Never create a new remote branch or PR as a workaround for a missing local branch, failed fetch/push, network error, lost workspace, or uncertainty.
3. Create a branch or PR only when the user's latest instruction explicitly asks for it.
4. Before commit/publication, inspect the complete intended diff and confirm it belongs only to the requested PR scope.
5. Do not publish only a partial subset of an intended multi-file change. After successful publication, verify the resulting commit SHA and changed-file list.
6. Do not merge, close PRs, delete branches, force-update refs, or change protected/integration branches without explicit user approval.
7. Do not change game code merely to satisfy a stale or incorrect test.
8. If the preloaded snapshot does not contain the checkpoint described by `CODEX_NEXT_TASK.md`, stop and report the mismatch instead of guessing.
