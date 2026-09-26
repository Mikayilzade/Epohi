# AUTONOMY STATUS — CURRENT

Updated: 2026-09-26 UTC. State: ARCHITECTURE_STAGE_9_LOCAL_VALIDATED.

## Current checkpoint
- **STATUS:** Stage 8 is published at `ce523e0`. Stage 9 is locally validated
  on Lead; PR #103 remains the only target.
- **GOAL:** Complete the architecture criteria in `ARCHITECTURE_PASSPORT.md`.
- **DONE:** Captured research insight and fallen-city detection now run before
  autosave through an explicit capture-state turn phase, without a turn-label
  gameplay observer.
- **EVIDENCE:** Local desktop Chrome 16/17 on the first pass; the new autosave
  test read turn 1 too early and passed on rerun after waiting for turn 2.
  Stage 7 CI pending.
- **NEXT:** Review/publish Stage 9; move coherence and outcomes gameplay
  mutations before save, then consolidate presentation invalidation.
- **BLOCKER:** None. No user decision needed for these technical stages.

---

## Historical checkpoint

Updated: 2026-09-26 UTC.
State: SINGLE_INTEGRATION_PR / ARCHITECTURE_CLEANUP_READY.

## Current target
- Repository: `Mikayilzade/Epohi`.
- Only active integration PR: **#103**.
- Branch: `codex-qgq4u5`.
- Base: `main`.
- PR #103 remains Draft and unmerged.
- Older stacked PRs #69, #84, #85, #86, #89, #90, #91, #93, #99, #100 and #102
  were reviewed and closed without merge on 2026-09-26.
- Their branches/commits were not deleted.

## Cleanup verification
- Heads of #69, #84, #89, #90, #91, #93, #99, #100 and #102 are ancestors of #103.
- #85 diverged by two old commits that only configured a temporary cross-browser workflow
  for obsolete stabilization child branches.
- #86 diverged by five old commits. Its runtime/test changes are present or further evolved
  in #103; its remaining unique content is historical checkpoint/task/workflow wiring.
- Therefore none of the closed PRs is currently required as a second active integration PR.

## Accepted architecture/autonomy contract
Use `ARCHITECTURE_AUTONOMY_DECISIONS_2026-09-26.md` as the current accepted working
contract for the next architecture phase.

Key direction:
- high Lead autonomy inside technical boundaries;
- finish separation of the existing monolith before major feature growth;
- canonical structured game state;
- UI separated from gameplay logic;
- balance/config separated from algorithms;
- saves/versioning isolated;
- risk-based testing;
- End Turn/runtime performance measured;
- living technical architecture passport;
- no duplicate legacy implementation left at architecture-cleanup completion.

## Next action
Start the large autonomous architecture audit/refactor described in `CODEX_NEXT_TASK.md`.
Lead leaves a short plan/risk checkpoint and continues without waiting unless a real
gameplay/design decision, dangerous Git operation or blocker appears.

PC/desktop Chromium is the primary current target. Preserve mobile code/tests.
Do not merge PR #103 without explicit user approval.

---

## Historical checkpoint
Earlier PR-stack, CI-v2, manual-smoke and audit checkpoints remain available in git history
and historical project documents. Consult them only when a concrete investigation requires
them; they are not active task instructions.
