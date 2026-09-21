# CODEX NEXT TASK

## Scope
Work only on existing PR #102 / branch `codex/-ci-v2`.

PR #102 is an accidental child PR created during CI v2 work. For this task, finish the CI v2 investigation/fix inside this existing PR only. Do not create another branch or PR. Do not merge. Do not close PR #102. Cleanup/transfer back to PR #100 will be handled separately after this work is proven green.

Before any edits/tests, follow the mandatory startup handshake in `AGENTS.md`: verify the exact target and reply to the user with one concise confirmation naming PR #102 and branch `codex/-ci-v2`.

## Current authoritative result
GitHub Actions run #258 / `35623913602` for head `983ff69648a0961389dd5096151d3edf30924cac` completed with exactly one failed job:

`Full — WebKit — shard 1/3`

All other full shards and all soak seed jobs passed.

The failed WebKit shard had 63 passed and 2 failed tests:

1. `tests/camera-2.spec.js:217`
   `Camera 2.0 › show entire map centers map and center control targets selected unit or capital`
   - assertion expected centering error < 0.01
   - observed 6.5 px
   - wait timed out after 2000 ms
   - this resembles the historical 13 px WebKit viewport-late-resize signature, but that is only a hypothesis until proven from the current trace/state.

2. `tests/combat-world-stability.spec.js:134`
   `Combat, AI and world stability › manual hill movement uses the routed terrain cost and waits for the second turn`
   - timed out waiting to click `[data-context-action="move"]`
   - the new diagnostics artifact exists and contains screenshot/video/trace/failure evidence
   - observed evidence indicates the target tile was presented as an attack target and the UI offered attack rather than move; determine exactly why.

Artifact from the failed job:
`epohi-full-webkit-shard-1` (artifact ID `10651331454`).

## Task
Publish and validate the minimum root-caused test stabilization already prepared in the current snapshot.

### Camera root cause and fix
The diagnostic timeline shows the final WebKit viewport height arriving 13 px after the fit sample. The old center is therefore 6.5 px from the final center. Wait for the existing stable-layout boundary before clicking Fit; do not change tolerance or timeout.

### Combat movement root cause and fix
Random world generation may place a camp on hard-coded tile `(6,5)`. Attack is the correct UI semantic for that hostile target, so this is insufficient fixture isolation rather than a runtime/pathing regression. Clear camp/barbarian state from the focused route target; do not change gameplay.

## Guardrails
- No arbitrary sleep.
- Do not weaken assertions, tolerances, or timeouts.
- Do not hide a deterministic failure behind retries.
- Do not broadly refactor unrelated code.
- Do not rerun the whole matrix unchanged just to see whether red becomes green.
- Preserve CI v2 diagnostics and parallelization unless evidence shows a defect in them.

## Validation order
1. Run static checks on the prepared diff.
2. Run the two exact failing WebKit tests first through authoritative CI (local browser infrastructure is unavailable).
3. Run any directly affected neighboring tests required by the proven root cause.
4. Only then publish the coherent fix to this same PR #102 branch and use authoritative GitHub Actions.
5. Inspect any new red job before another edit/rerun.

## Completion criteria
- Both root causes are written down, not guessed.
- The minimum fix is justified by those root causes.
- Exact affected WebKit tests are green.
- Required authoritative CI for the final SHA is green, or a genuine blocker is precisely documented.
- Update `AUTONOMY_STATUS.md` with root cause, changes, tests, CI run/result, and exact next action.
- Update `CI_V2_PLAN.md` Phase 7/current status if authoritative evidence changes its completion state.
- Stop for user review. Do not merge.
