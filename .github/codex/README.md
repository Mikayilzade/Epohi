# Codex workflow for Epohi

This folder defines the semi-automatic Codex workflow for the Epohi project.

The goal is to let Codex take the next small safe task from the queue, create one Draft PR, run checks, and stop.

Codex must never merge automatically.

## Human control points

A human must still decide:

- when a Draft PR is ready for review;
- when to merge;
- when to delete the branch;
- when to pause the queue;
- when to change project direction;
- when a task is too risky or too broad.

## Basic cycle

1. Read `.github/codex/task-queue.md`.
2. Pick the first unchecked task.
3. Follow `.github/codex/prompt-next-task.md`.
4. Create exactly one branch.
5. Create exactly one Draft PR.
6. Run checks.
7. Report PR number, branch, commit SHA, changed files, and test result.
8. Stop.

## Important rule

One task = one small PR.

Do not batch unrelated refactors.
Do not continue to the next task automatically.
Do not merge.
