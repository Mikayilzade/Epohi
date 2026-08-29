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
Exact integration head verified before preparing the Codex sprint: `071bd1b05f4e0a837b624fa39b991b8322a0ca45` (`Record run 238 diagnosis and checkpoint 240`).

Exact implementation checkpoint validated by the latest CI: `5b21f1b2cb7fd6d7d3020552ba38fb7bc7bcd863` (`Use semantic inspect-layer activation in legacy map regression`). The integration head differs because of status/documentation-only history.

PR #84 is open, Draft, unmerged, head `codex/coherence-capture-learning-v1`, base `prototype/humans-v1`.

## Latest exact CI
- Workflow: `Epohi Autonomous Cross-Browser Gate`
- Run number: #240
- Run ID: `33243697618`
- Exact implementation SHA: `5b21f1b2cb7fd6d7d3020552ba38fb7bc7bcd863`
- Status: **completed / failure**
- Static integrity: **green**
- Focused mobile runtime Chromium + WebKit: **green**
- Full mobile regression Chromium + WebKit: **failure**
- Diagnostics artifact: `9712557281` (`epohi-autonomous-cross-browser-results`)

The next sprint must inspect the complete #240 logs/artifact and any newer exact CI before changing runtime. Do not assume every remaining full-suite failure is a runtime defect: recent work has proven that some failures are stale tests using intentionally hidden legacy UI, while other groups may still be genuine runtime defects or nondeterministic fixtures.

## Current engineering policy
The old one-failure/one-push autonomous loop is paused. For the manual Codex sprint, classify the entire current failure set, repair related root-cause families together, validate locally on Chromium + WebKit, and then push coherent checkpoints. Production changes require factual current-flow defects plus regression coverage.

The detailed execution contract is `CODEX_STABILIZATION_SPRINT.md`.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [x] Phase 1 — focused runtime architecture hardening; focused cross-browser gate green in #240.
- [ ] Phase 2 — close complete cross-browser regression and save/migration coverage.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Restore authenticated GitHub and package-repository access, install the missing Playwright system libraries, and resume Stage 0 by downloading and classifying the complete latest Chromium + WebKit failure set.

## Codex stabilization sprint checkpoint — 2026-08-29
- Starting/base SHA: `eb54903009cb248515d83731e06915862f18a399` (the locally fetched `codex/coherence-capture-learning-v1` tip recorded in `.git/FETCH_HEAD`).
- Implementation head: unchanged; no runtime or test changes were made because Stage 0 could not obtain or execute the authoritative failure set.
- Stage reached: Stage 0 diagnostics, blocked before failure classification by external infrastructure.
- GitHub verification: `git fetch https://github.com/Mikayilzade/Epohi.git codex/coherence-capture-learning-v1:refs/remotes/origin/codex/coherence-capture-learning-v1` failed with proxy HTTP 403; `gh pr view 84` and `gh run view 33243697618` could not run because this environment has no GitHub authentication.
- Local Chromium result: `npx playwright test --project=chromium-mobile --reporter=line` discovered 180 tests, but the browser could not start because `libatk-1.0.so.0` is absent. This is an `INFRA` result, not a product/test failure inventory.
- Dependency remediation: `npx playwright install-deps chromium webkit` failed because every configured Ubuntu/package endpoint was rejected by the environment proxy with HTTP 403.
- WebKit was not run because the same unavailable system-dependency installation blocks a valid cross-browser result.
- Remaining blocker: the authoritative CI artifact/logs are inaccessible and neither local browser engine can be validated until external access or a browser-ready runner is provided. The runbook's infrastructure stop condition therefore applies.
- Next action: restore authenticated GitHub and package-repository access, install Playwright dependencies, then resume Stage 0 from this exact checkpoint and continue sequentially through the remaining stages.

## Completion signal
Set state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable Gates A-I in `QUALITY_GATES.md` are green and an exact immutable RC is prepared. Do not merge; the final physical iPhone test is the user's gate.
