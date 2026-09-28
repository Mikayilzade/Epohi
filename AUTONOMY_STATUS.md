# AUTONOMY STATUS — CURRENT

Updated: 2026-09-28 UTC. State: FINAL_PACKAGE_LOCAL_VALIDATED.

## Current checkpoint
- **STATUS:** Stage 51 and architecture packages 1-3 published through
  `f69228b`; final package locally validated, uncommitted. PR #103 remains
  the only target.
- **DONE:** Domain rules and structured journal have explicit owners; End Turn,
  saga, camera, overlay and stability paths were consolidated. Duplicate
  observer safety and shadowed faction-defeat code were removed. The live
  architecture map and residual debt are in `ARCHITECTURE_PASSPORT.md`.
- **EVIDENCE:** Latest desktop run 225/226; the one stale raw-event fixture
  was corrected and passed focused. Final short soak 2 seeds x 30 turns,
  static syntax 119 files and contracts 35/35 passed. Five End Turns emitted
  one full render, invalidation flush and observer sync each; timings remain
  within noise.
- **NEXT:** Review, commit and push final package to #103; check exact-SHA CI,
  fix real regressions, then record gate result and report completion.
- **BLOCKER:** None.

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
