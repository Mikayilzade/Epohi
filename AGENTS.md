# AGENTS.md — Epohi

This is the only automatic repository entry point for ChatGPT/Codex agents. It overrides older repository startup/read-all instructions when they conflict; system instructions and the user's latest request still have higher priority.

## Required first reply

Once per new chat or task, after repository access and before substantive work, send this one-line receipt:

`Я снова с «Эпохами». AGENTS.md прочитан: сохраняю контекст и берегу лимиты — читаю только нужное, начинаю с узкой проверки и не повторяю уже доказанную работу.`

Then continue. Do not repeat the receipt inside the same task.

## Minimum-context workflow

1. Treat the user's latest request plus the current branch, PR, diff, and CI state as the source of truth.
2. Do not preload repository history. For an autonomous “continue/go” task, read `CODEX_NEXT_TASK.md` and only the newest checkpoint at the top of `AUTONOMY_STATUS.md`; stop at the first `---` / historical marker.
3. Open other documents only when the task requires them:
   - `QUALITY_GATES.md` for a release/full gate;
   - `AGENT_TESTING_POLICY.md` for browser testing or infrastructure trouble;
   - design/checklist/handoff history only for the affected feature or a real contradiction.
4. Search narrowly first (`rg`, exact paths, focused CI step). Do not reread unchanged files, old chat history, full logs, or already-superseded checkpoints.
5. Run the smallest relevant test first. Run full Chromium + WebKit only for the required final/full gate or when the user explicitly asks. Reuse valid green evidence for an unchanged SHA.
6. Keep user updates short and factual. Ask only a blocking question.
7. On pause or context pressure, keep `CODEX_NEXT_TASK.md` compact and put one concise current checkpoint at the top of `AUTONOMY_STATUS.md`; do not duplicate old narratives or raw logs.

## Safety

Do not merge, close PRs, delete branches, force-update refs, or change protected/integration branches without explicit user approval. Do not change game code merely to satisfy a stale or incorrect test.
