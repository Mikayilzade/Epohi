# CODEX NEXT TASK

## Task ID
`MANUAL_STABILIZATION_SPRINT_2026_08_29`

## Goal
Execute `CODEX_STABILIZATION_SPRINT.md` from the exact current Humans v1 integration head and advance through its stages sequentially. The immediate priority is to audit and repair stale full-regression test debt using real canonical user flows, then close the remaining automated quality gates toward a Release Candidate.

## Mode
This is an explicitly user-started Codex sprint, not the slow hourly autonomous loop. The one-bounded-package-per-run rule in `AUTONOMY_START_HERE.md` is overridden for this session only: each stage/root-cause family is still a bounded coherent package, but Codex should continue automatically to the next stage until a documented stop condition is reached or the session ends.

## Mandatory source of truth
Read, in order:
1. `AUTONOMY_START_HERE.md`
2. `AUTONOMY_STATUS.md`
3. `QUALITY_GATES.md`
4. this file
5. `CODEX_STABILIZATION_SPRINT.md`
6. Draft PR #84 and latest exact CI/logs/artifacts

Repository state wins over chat/history.

## Branch / PR boundary
- Integration branch: `codex/coherence-capture-learning-v1`.
- Existing integration Draft PR: #84 -> `prototype/humans-v1`.
- Do not touch `main`.
- Do not merge #84 or `prototype/humans-v1`.
- Prefer a child Codex branch from the exact integration head. If creating a review Draft PR, target `codex/coherence-capture-learning-v1` as its BASE.

## Immediate start
Latest known baseline when this file was authored:
- integration head `071bd1b05f4e0a837b624fa39b991b8322a0ca45`;
- implementation checkpoint `5b21f1b2cb7fd6d7d3020552ba38fb7bc7bcd863`;
- workflow #240 / run `33243697618` completed **failure**;
- static integrity and focused Chromium+WebKit stages were green;
- full Chromium+WebKit regression was red;
- artifact `9712557281` contains cross-browser diagnostics.

Verify all of that against current GitHub state before acting. If newer, use newer state.

Start at Stage 0 of `CODEX_STABILIZATION_SPRINT.md`: inspect the COMPLETE current full-suite failure set and group every failure by root cause before modifying runtime code.

## Non-negotiable rules
- stale tests must be migrated to current canonical user flows, not silenced;
- no `force: true`, synthetic clicks, arbitrary sleeps, hidden legacy UI, or direct production-function calls as substitutes for a real user flow, except explicitly documented internal-compatibility tests;
- production/runtime changes require a proven current-flow defect and regression coverage;
- test both Chromium mobile and WebKit mobile;
- batch related fixes and avoid CI/source-push spam;
- no new features, balance rewrites, or unrelated cleanup before RC gates are green;
- do not request an intermediate physical-device test.

## Completion
Follow the runbook through Gates D/E/F/G/H/I as far as possible. When done, leave a reviewable Draft PR/branch and an exact factual handoff for independent ChatGPT review. Do not merge.