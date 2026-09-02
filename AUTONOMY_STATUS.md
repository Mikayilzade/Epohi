# AUTONOMY STATUS — «Эпохи» Humans v1

## State
`IN_PROGRESS_MANUAL_CODEX_SPRINT`

Hourly ChatGPT autonomy remains disabled by the user. Current execution mode is a user-started Codex sprint followed by independent ChatGPT review.

## Integration / safety boundary
- Repository: `Mikayilzade/Epohi`
- Integration Draft PR: #84 (`codex/coherence-capture-learning-v1` -> `prototype/humans-v1`)
- Current repair/review Draft PR: **#86**
- Current task branch: `codex/-run_240_regression_family_repair`
- PR #86 base: `codex/-codex_stabilization_sprint`
- `main`: **DO NOT TOUCH**
- Do not merge #86, #84, or `prototype/humans-v1` automatically.

## Latest authoritative checkpoint — run #246
Workflow: `Epohi Autonomous Cross-Browser Gate`

- Run number: **#246**
- Run ID: `33631089383`
- Head SHA: `592e42aefe1e0c42b387868390127764d46305f5`
- Branch: `codex/-run_240_regression_family_repair`
- PR: #86
- Status: **completed / failure**
- Dependency + browser installation: **green**
- Static integrity: **green**
- Focused mobile runtime Chromium + WebKit: **green**
- Focused Chromium: **60/60 passed**
- Focused WebKit: **60/60 passed**
- Full Chromium regression: **174 passed / 6 failed**
- Full WebKit regression: **175 passed / 5 failed**
- Unique residual failing scenarios: **7**
- Diagnostics artifact: `9848289407` (`epohi-autonomous-cross-browser-results`)

This supersedes run #240 as the current CI source of truth.

## Progress since run #240
Run #240 baseline was 165 passed / 15 failed in Chromium and 165 passed / 15 failed in WebKit: 30 engine-failures across 16 unique scenarios.

Run #246 leaves 11 engine-failures across 7 unique scenarios. Therefore the RUN_240 repair removed **19 of 30 engine-failures** and reduced the unique failure inventory from **16 to 7**, while keeping the focused cross-browser runtime gate fully green.

The previous local `libatk-1.0.so.0` / package-manager proxy limitation is not the current project blocker. `AGENT_TESTING_POLICY.md` remains authoritative: if a Codex container lacks browser system libraries, that is local infrastructure; GitHub Actions is the authoritative browser-ready validator.

## Residual run #246 inventory
Concrete details and execution contract are now in `CODEX_NEXT_TASK.md` task `RUN_246_RESIDUAL_REGRESSION_CLOSEOUT`.

1. **Chromium-only stacked-unit distinct order** — one of three same-type stacked units does not reach its separately assigned destination. `RUNTIME_DEFECT_CANDIDATE`.
2. **Camp description scroll assertion, both engines** — readable/no-clamp checks pass, but mandatory `scrollTop` movement does not. Likely stale behavior assertion unless content is actually clipped.
3. **Empty context tabs container, both engines** — actions collapse to zero, tabs retain area 240. Determine whether this is real visible spacing or an obsolete exact-area assertion.
4. **Chromium-only major world event visibility** — event signature exists but `#feedbackWorldEvents` remains `aria-hidden=true` without `.show`. `RUNTIME_DEFECT_CANDIDATE`.
5. **Rival/barbarian inspection, both engines** — fixture expects a barbarian marker at coordinates that never renders. Determine fixture drift vs runtime rendering defect.
6. **Stack re-entry, both engines** — Chromium rebases selection but canonical stack picker has zero entries; WebKit has `routePoiModal` intercepting the re-entry tap. `RUNTIME_DEFECT_CANDIDATE` with likely shared lifecycle root cause.
7. **WebKit-only camera centering** — exact `<0.2px` assertion settles at about `6.5px`; classify real visible centering defect vs deterministic cross-browser geometry before changing tolerance.

## Current engineering policy
- Work the seven residual scenarios as root-cause families, not one failure / one push.
- R1/R4/R6 are the highest-priority runtime candidates.
- Change a test only when current product behavior is correct and the assertion/fixture is proven stale or nondeterministic.
- Do not weaken behavior coverage for green CI.
- Do not use force-clicks, arbitrary sleeps, hidden legacy UI, or direct production calls to bypass canonical user interactions.
- Preserve the already-green focused mobile runtime gate.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [x] Phase 1 — focused runtime architecture hardening; focused cross-browser gate green.
- [ ] Phase 2 — close complete cross-browser regression and save/migration coverage.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Continue **in existing PR #86** with `CODEX_NEXT_TASK.md` task `RUN_246_RESIDUAL_REGRESSION_CLOSEOUT`: classify and repair the seven run #246 residual scenarios as one coherent package, then run/inspect one authoritative full Chromium + WebKit CI. Do not create a replacement PR and do not merge.

## Historical checkpoint — RUN_240_REGRESSION_FAMILY_REPAIR
The prior sprint migrated stale legacy-control tests to current visible flows, updated worker-time mechanics coverage, fixed foreign-unit action leakage and duplicate victory return controls, and reached implementation checkpoint later validated through PR #86 CI. Local browser execution in the Codex shell was blocked by missing `libatk-1.0.so.0`, but static checks passed and the work was correctly moved to GitHub Actions for authoritative browser validation.

## Completion signal
Set state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable Gates A-I in `QUALITY_GATES.md` are green and an exact immutable RC is prepared. Do not merge; the final physical iPhone playthrough remains the user's gate.