# AUTONOMY STATUS — «Эпохи» Humans v1

## State
`IN_PROGRESS_MANUAL_CODEX_SPRINT`

Hourly ChatGPT autonomy was explicitly disabled by the user on 2026-08-29. Current execution mode is a user-started Codex sprint followed by independent ChatGPT review.

## Integration
- Repository: `Mikayilzade/Epohi`
- Integration branch: `codex/coherence-capture-learning-v1`
- Existing integration Draft PR: #84
- Base: `prototype/humans-v1`
- `main`: DO NOT TOUCH
- Codex should preferably work on a child branch and, if creating a review Draft PR, target `codex/coherence-capture-learning-v1` as its base. Do not merge automatically.

## Current checkpoint
Exact integration head recorded before the previous Codex sprint: `071bd1b05f4e0a837b624fa39b991b8322a0ca45` (`Record run 238 diagnosis and checkpoint 240`).

Exact implementation checkpoint validated by CI run #240: `5b21f1b2cb7fd6d7d3020552ba38fb7bc7bcd863` (`Use semantic inspect-layer activation in legacy map regression`). The integration head differs because of status/documentation-only history.

PR #84 is open, Draft, unmerged, head `codex/coherence-capture-learning-v1`, base `prototype/humans-v1`.

The current task/inventory documentation lives on child branch `codex/-codex_stabilization_sprint`; verify exact current branch heads before writing code.

## Latest exact CI baseline inventoried
- Workflow: `Epohi Autonomous Cross-Browser Gate`
- Run number: #240
- Run ID: `33243697618`
- Exact implementation SHA: `5b21f1b2cb7fd6d7d3020552ba38fb7bc7bcd863`
- Status: **completed / failure**
- Static integrity: **green**
- Focused mobile runtime Chromium + WebKit: **green**
- Full Chromium regression: **165 passed / 15 failed**
- Full WebKit regression: **165 passed / 15 failed**
- Unique failing scenarios across engines: **16** (14 shared, one Chromium-only stack scenario, one WebKit-only camera scenario)
- Diagnostics artifact: `9712557281` (`epohi-autonomous-cross-browser-results`)

This authoritative failure set has now been recovered and inspected. Stage 0 is no longer blocked by lack of local Chromium/WebKit libraries. `AGENT_TESTING_POLICY.md` applies: local missing `libatk`, package-manager/proxy 403, or an equivalent browser-container limitation is `INFRA`; GitHub Actions is the authoritative browser-ready validation environment and local browser absence by itself must not stop coherent engineering work.

## Run #240 grouped inventory
Detailed test names, evidence, repair order, and guardrails are in `CODEX_NEXT_TASK.md` task `RUN_240_REGRESSION_FAMILY_REPAIR`.

Current root-cause families:
1. **Legacy inspection controls** — expected `STALE_TEST`: hidden/obsolete inspect tabs used by `mobile-context` and `resource-worker` tests.
2. **Legacy city/science toolbar controls** — expected `STALE_TEST`: tests click hidden `#cityBtn` / old `#scienceBtn` instead of canonical visible flows.
3. **Old diplomacy proposal surface** — expected `STALE_TEST` unless canonical central proposal accept flow proves broken.
4. **Stack navigation/selection** — mixed/needs factual classification: old selectors may be stale, but a canonical visible stack re-entry failure would be a real runtime defect.
5. **Context CSS/layout implementation assertions** — expected `STALE_TEST`/deterministic assertion update: preserve collapse/usability behavior, not obsolete exact CSS values.
6. **Worker resource accounting** — confirmed `STALE_TEST`: old test expects worker construction to spend city production; current accepted mechanics use worker time and do not spend city production.
7. **Foreign-unit context keeps `Идти`** — `RUNTIME_DEFECT_CANDIDATE`: determine whether this is a legitimate current enemy action or leaked own-unit movement command.
8. **Two `#outcomeMapBtn` elements** — `RUNTIME_DEFECT_CANDIDATE`: duplicate DOM ID/control should be investigated rather than hidden with `.first()`.
9. **WebKit camera center delta ~6.5px vs `<0.2` expectation** — `FIXTURE_NONDETERMINISM` / cross-browser assertion candidate until screenshot/runtime semantics prove a true centering defect.

## Current engineering policy
Do not repair the full suite one red line at a time. Finish classification by root-cause family, migrate stale tests to current user-reachable flows, and make production changes only for proven current-flow defects with regression coverage. Validate related families together and avoid CI/source-push spam.

The detailed execution contract is `CODEX_STABILIZATION_SPRINT.md`. The concrete next package is `CODEX_NEXT_TASK.md`.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [x] Phase 1 — focused runtime architecture hardening; focused cross-browser gate green in #240.
- [ ] Phase 2 — close complete cross-browser regression and save/migration coverage.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Run `RUN_240_REGRESSION_FAMILY_REPAIR` from `CODEX_NEXT_TASK.md`: verify no newer relevant CI, finish factual classification of the nine run #240 root-cause families, repair confirmed stale-test families in coherent batches, fix production only for proven canonical-flow defects, and use GitHub Actions for Chromium+WebKit validation if the local Codex environment cannot launch browsers.

## Historical Codex infrastructure checkpoint — 2026-08-29
The previous Codex container could not fetch GitHub through its shell or install Playwright system libraries because of proxy/auth limitations; local Chromium failed at browser launch due missing `libatk-1.0.so.0`. No runtime/test changes were made in that blocked sprint. This remains useful diagnostic history but is **not the current project blocker**: run #240 logs/artifact are now inventoried externally and browser validation can proceed through GitHub Actions under `AGENT_TESTING_POLICY.md`.

## Completion signal
Set state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable Gates A-I in `QUALITY_GATES.md` are green and an exact immutable RC is prepared. Do not merge; the final physical iPhone test is the user's gate.
