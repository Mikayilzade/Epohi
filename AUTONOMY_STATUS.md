# AUTONOMY STATUS — CURRENT

Updated: 2026-09-08 UTC.
State: MANUAL_SMOKE_FAILED / REPAIR_PLAN_READY.

## Scope
- Mikayilzade/Epohi, existing PR #89.
- Branch: codex/-run_240_regression_family_repair-2mvfa1.
- Base: codex/-codex_stabilization_sprint.
- Manual preview link: 5ac110c8bc71dfd9f512b7e256897fbef9ea3592; actual loaded assets/cache not yet verified.
- This handoff changes documentation only. No fixes or new browser tests performed.
- No merge, PR/thread closure, protected branch update or force push authorized.

## Current evidence
Mikayil completed iPhone testing through turn 51 and victory.
Blocking observations: victory reopens after continuation and duplicates controls; frequent disappearing icons; reveal-map action exits to menu and continuation fails.
Other findings and positive feedback: MANUAL_SMOKE_2026-09-08.md (M01–M15).
Specialization was found in Saga: accessibility/copy issue, not proven missing mechanic.
Worker production spending is NOT confirmed; display changes after spent action.

## Execution
Owner: Codex implementation; ChatGPT independent review; Mikayil final device test.
Stages 1–6 in REPAIR_STAGES.md: all TODO.
NEXT ACTION: Codex starts stage 1 (victory lifecycle), records root cause and focused regression evidence, then continues stages.
Update this compact checkpoint with stage/status, code SHA, changed files, checks/evidence, remaining blocker and next action.
Do not mark VERIFIED without meeting stage criteria.

---
## Prior evidence / housekeeping
Game/test head 07b01517d8880d167419109ac83d5707fc5a66d1 passed run 34053192225 attempt 4; previously reported focused 60/60 per engine and full 182/182 per engine.
That CI evidence remains historical; it does not negate the new manual failures.
Later harness commits were docs-only; detector success is not gameplay validation.
Unresolved review threads last observed: r3922240515 (outcome), r3922240522 (outdated worker test). Do not resolve before review/closeout is requested.
Earlier history: docs/archive/AUTONOMY_STATUS_through_2026-09-06.md; do not preload.
