# AUTONOMY STATUS — «Эпохи» Humans v1

## State
`IN_PROGRESS_AUTONOMOUS`

## Integration
- Repository: `Mikayilzade/Epohi`
- Active branch: `codex/coherence-capture-learning-v1`
- Draft PR: #84
- Base: `prototype/humans-v1`
- `main`: DO NOT TOUCH

## Current branch checkpoint
Cross-browser autonomy setup head: `2f65131216a0404a2f07f8160e5ab4a31e5858ed`.

Always fetch the current branch/PR head before writing; this SHA is a checkpoint, not permission to overwrite newer work.

## Why manual QA is suspended
Latest physical iPhone/Safari smoke failed:
- phone heated quickly;
- UI froze and flickered;
- event decisions were clickable;
- opening a city repeatedly appeared to open/cancel and eventually became unusable.

The user should not test intermediate patches again. Next physical-device test is reserved for a Release Candidate after automated gates.

## Phase plan
- [x] Phase 0A — define autonomous control plane and quality gates.
- [x] Phase 0B — configure branch CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## Current blocker
The current architecture has accumulated multiple additive UI modules and broad DOM observers. Chromium-focused green tests did not predict physical Safari behavior. The new branch workflow now installs both Chromium and WebKit and runs focused + full mobile suites; its first run must be inspected before architecture work is considered validated.

## Current task
`MOBILE_RUNTIME_ARCHITECTURE_HARDENING_V1` — see `CODEX_NEXT_TASK.md`.

## Latest CI
Workflow `Epohi Autonomous Cross-Browser Gate`, run #39, is running for checkpoint `2f65131216a0404a2f07f8160e5ab4a31e5858ed`; browser installation had started when this status was written.

## NEXT ACTION
Inspect run #39 and exact logs. Fix any CI/config/WebKit failures first. Once the gate itself is reliable, execute `MOBILE_RUNTIME_ARCHITECTURE_HARDENING_V1`: inventory observer/scheduler ownership, replace broad feedback-loop observers with explicit bounded UI invalidation, and strengthen repeated city/route/overlay quiescence tests. Do not ask the user to test.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
