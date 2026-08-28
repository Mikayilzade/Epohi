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
Exact PR head inspected at the start of this run: `952bfe32a4f814d88ba2e5c38f1765ba01996d8b` (`Record CI cancellation guard checkpoint`). PR #84 was open/draft, unmerged, on `codex/coherence-capture-learning-v1`, targeting `prototype/humans-v1`.

Exact implementation head under validation: `c6bb622a4d163fe18d4a1c2a65b33ee61c900515` (`Prevent status runs from cancelling code CI`). This bounded package fixes the factual control-plane defect exposed by runs #218/#219: branch-local `pull_request.paths` did not prevent the status-only synchronize event from being created, and the shared `cancel-in-progress: true` concurrency group allowed that detector-only run to cancel the still-validating code checkpoint before any browser result existed.

## Exact CI / factual blocker inspected
- Workflow run `33213493797` (run #218) on exact implementation checkpoint `6c53d11356143f90e11274b71c8057c4e067f9b2` completed **cancelled**. It started at 2026-08-28T21:39:26Z and was cancelled during `Install Chromium and WebKit` at 2026-08-28T21:40:09Z; static, focused, and full regression steps never ran.
- Status-only head `952bfe32a4f814d88ba2e5c38f1765ba01996d8b` then created workflow run `33213529250` (run #219), which completed **success** after checkout + `Detect meaningful source change`; all Node/browser/static/test/artifact steps were skipped.
- Therefore the prior assumption that adding `pull_request.paths` inside this Draft PR branch was sufficient was false for this live control plane: the status-only synchronize event was still created and entered concurrency before the branch workflow could skip it in-job.
- Last completed browser evidence remains run `33205010586` (#215) on `2187cdea27177bf6019f1d83af7ab3adfbeacc65`: static green; focused Chromium + WebKit green; full Chromium 158/178; full WebKit 159/178.

## Bounded package completed
- Preserved the source/test/runtime-only `pull_request.paths` allowlist as the intended durable trigger policy once the workflow definition is on the PR base / replaced durably.
- Changed the temporary PR gate concurrency to `cancel-in-progress: false`, so a status/docs detector-only synchronize event cannot invalidate an already-running source/test checkpoint.
- Kept the in-job `Detect meaningful source change` guard, so status/docs runs remain cheap and skip Node, browser install, static, focused, full regression, and artifacts.
- Strengthened `tests/ci-push-gate.spec.js` to regress both requirements: the allowlist excludes status/docs paths, and the temporary branch-only gate cannot cancel an in-flight validating code run.
- Workflow + regression were committed together in one coherent implementation checkpoint `c6bb622a4d163fe18d4a1c2a65b33ee61c900515`.

## Validation state
- Exact prior code CI #218: **cancelled**, no browser result.
- Exact status-only CI #219: **success**, detector-only; browser/static steps skipped.
- Exact implementation head `c6bb622a4d163fe18d4a1c2a65b33ee61c900515`: workflow run `33217629039` (#220) is **in progress** at status-write time. Do not push speculative source/test/runtime fixes while it validates.
- Gate B/C were green on the last completed browser run #215; Gate D remains unproven for the pointer-capture fix until #220 completes.
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
Inspect exact run `33217629039` (#220) for implementation head `c6bb622a4d163fe18d4a1c2a65b33ee61c900515`; first verify that any status-only synchronize checkpoint did not cancel it, then use only #220's retained logs/artifact to take the first remaining factual full-suite failure as the next bounded package.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
