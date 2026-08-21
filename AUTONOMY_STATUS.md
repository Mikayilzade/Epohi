# AUTONOMY STATUS — «Эпохи» Humans v1

## State
`IN_PROGRESS_AUTONOMOUS`

## Integration
- Repository: `Mikayilzade/Epohi`
- Active branch: `codex/coherence-capture-learning-v1`
- Draft PR: #84
- Base: `prototype/humans-v1`
- `main`: DO NOT TOUCH

## Last known code checkpoint before autonomy control-plane setup
`1388edfe751117abc3f52855e8be85ddf48cc2c3`

The branch now also contains the autonomy-control documents added after that code checkpoint. Always fetch the current branch/PR head before writing.

## Why manual QA is suspended
Latest physical iPhone/Safari smoke failed:
- phone heated quickly;
- UI froze and flickered;
- event decisions were clickable;
- opening a city repeatedly appeared to open/cancel and eventually became unusable.

The user should not test intermediate patches again. Next physical-device test is reserved for a Release Candidate after automated gates.

## Phase plan
- [x] Phase 0A — define autonomous control plane and quality gates.
- [ ] Phase 0B — make branch CI genuinely cross-browser/mobile (Chromium + WebKit) and reliable enough to drive the loop.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## Current blocker
The current architecture has accumulated multiple additive UI modules and broad DOM observers. Chromium-focused green tests have not predicted physical Safari behavior. Existing durable smoke workflow targets `main`, while the branch-specific temporary workflow has historically tested Chromium only.

## Current task
`MOBILE_RUNTIME_ARCHITECTURE_HARDENING_V1` — see `CODEX_NEXT_TASK.md`.

## NEXT ACTION
Upgrade the active branch CI/Playwright configuration so focused and full mobile suites can run on **both Chromium and WebKit**. Inspect the first resulting run; if WebKit exposes failures, diagnose exact logs and fold fixes into the runtime-hardening task. Do not ask the user to test.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
