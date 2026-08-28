# AUTONOMY STATUS — «Эпохи» Humans v1

## State
`IN_PROGRESS_AUTONOMOUS`

## Integration
- Repository: `Mikayilzade/Epohi`
- Active branch: `codex/coherence-capture-learning-v1`
- Draft PR: #84
- Base: `prototype/humans-v1`
- `main`: DO NOT TOUCH

## Current checkpoint
Exact PR head inspected at the start of this run: `da3edc542175b013d9d934f9cfc07bde9e254dae` (`Record run 215 pathing checkpoint`). PR #84 was open/draft, unmerged, on `codex/coherence-capture-learning-v1`, targeting `prototype/humans-v1`.

Exact implementation head under validation: `6c53d11356143f90e11274b71c8057c4e067f9b2` (`Prevent status checkpoints from cancelling code CI`). This bounded package fixes the CI orchestration defect that allowed a docs/status-only synchronize event to enter the same `cancel-in-progress` concurrency group and cancel a still-valid source/test checkpoint before the in-job path detector could skip browser work.

## Exact CI / factual blocker inspected
- Workflow run `33209246218` (run #216) on exact code checkpoint `129b9bd4246be6e38f505002f70101f3efb9f244` completed **cancelled**, not pass/fail. GitHub recorded start at 2026-08-28T20:40:35Z and cancellation at 2026-08-28T20:41:31Z.
- The immediately following status-only head `da3edc542175b013d9d934f9cfc07bde9e254dae` created workflow run `33209291493` (run #217), which completed **success** after only checkout + `Detect meaningful source change`; Node setup, browser install, static checks, focused tests, full regression, and artifact upload were all skipped.
- Therefore #217 factually proves the old detector recognized the status-only commit, but recognition occurred only after the synchronize run had already joined concurrency and cancelled #216. No browser artifact exists from #216 to diagnose pathing or any later functional failure.
- Last completed browser evidence remains run `33205010586` (#215) on `2187cdea27177bf6019f1d83af7ab3adfbeacc65`: static green; focused Chromium + WebKit green; full Chromium 158/178; full WebKit 159/178.

## Bounded package completed
- Added `pull_request.paths` to `.github/workflows/diplomacy-activity-events-temp.yml` so only workflow/source/test/runtime paths create PR synchronize runs; docs/status-only changes no longer enter the concurrency group at all.
- Kept the existing in-job source-change detector as defense in depth and for explicit `workflow_dispatch` diagnostics.
- Added `tests/ci-push-gate.spec.js` regression coverage asserting the workflow keeps the required source/test/runtime path allowlist, excludes `AUTONOMY_STATUS.md` / broad Markdown patterns, and retains `cancel-in-progress: true` for genuinely superseded code checkpoints.
- Workflow + regression were committed together in one coherent implementation checkpoint `6c53d11356143f90e11274b71c8057c4e067f9b2`.

## Validation state
- Exact prior code CI #216: **cancelled** before a factual browser result because status-only run #217 superseded it.
- Exact status-only CI #217: **success**, browser/static steps skipped as intended by the old in-job detector.
- Exact implementation head `6c53d11356143f90e11274b71c8057c4e067f9b2`: workflow result pending at status-write time; do not push speculative source/test/runtime fixes while that checkpoint is validating.
- Gate B/C were green on the last completed browser run #215; Gate D remains unproven for the pointer-capture fix until the new exact checkpoint completes.
- No physical-device test is requested.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [x] Phase 1 focused runtime architecture hardening — focused Chromium + WebKit gate green on run #215.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage; exact new checkpoint pending.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Inspect the exact workflow result for implementation head `6c53d11356143f90e11274b71c8057c4e067f9b2`; verify that this status-only checkpoint did not cancel it, then use that run's exact retained logs/artifact to take only the first remaining factual full-suite failure as the next bounded package.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
