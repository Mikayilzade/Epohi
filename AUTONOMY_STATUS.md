# AUTONOMY STATUS — CURRENT

Updated: 2026-10-04. State: VISUAL_POLISH_V2_AWAITING_HUMAN_REVIEW.

## Current checkpoint
- **TARGET:** `rework/epohi-next`; `stable` untouched.
- **DONE:** Visual Polish V2 addresses city context art, selection redraw, plains/swamp/features, POIs/improvements and the Wiki Unit Atlas. See `docs/VISUAL_POLISH_STATUS_V2.md`.
- **EVIDENCE:** Desktop Chromium 25/25 focused tests plus 6/6 Open Map/art tests; mobile Chromium 9/9 relevant tests; six V2 desktop/mobile tests after final selection optimization. Syntax and diff checks passed. Normal Chrome preview open at `http://127.0.0.1:8000/`.
- **NEXT:** Wait for human visual review; do not start V3 or change gameplay/stable.

---

## Historical checkpoint

Updated: 2026-09-28 UTC. State: ARCHITECTURE_CLEANUP_COMPLETE.

## Current checkpoint
- **STATUS:** Stage 51 and all four architecture packages are published to
  PR #103. Runtime/test head `8202775` has a green final gate; PR remains
  Draft/Open and unmerged.
- **DONE:** Domain rules and structured journal have explicit owners; End Turn,
  saga, camera, overlay and stability paths were consolidated. Duplicate
  observer safety and shadowed faction-defeat code were removed. The live
  architecture map and residual debt are in `ARCHITECTURE_PASSPORT.md`.
- **EVIDENCE:** Exact runtime/test SHA `8202775`, CI run `36455024050`:
  desktop Chromium 3/3, mobile Chromium 3/3, WebKit 3/3, Chromium soak 5/5,
  WebKit soak 2/2, static green. Local short soak 2 x 30 turns, syntax for
  119 JS files and contracts 35/35 passed. Five End Turns emitted one full
  render, invalidation flush and observer sync each; timing remains noisy.
- **NEXT:** Only optional follow-up work and the user-controlled merge remain.
  See `ARCHITECTURE_PASSPORT.md` for ownership and residual technical debt.
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
