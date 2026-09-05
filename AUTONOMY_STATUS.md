# PR #89 — narrow immediate pathing refresh — 2026-09-05

## Current scope and evidence
- Existing PR: Mikayilzade/Epohi#89; branch: codex/-run_240_regression_family_repair-2mvfa1. Baseline head: e3b9cb2f45748b3caa4815dff9b37eeabe2c3d53.
- Authoritative baseline: Actions run 33983712540, job 101353359808: Chromium focused 60 passed / 0 failed, exit 0; WebKit focused 59 passed / 1 failed, exit 1. Full regression skipped by focused gate. Sole CI failure: diplomacy-activity-events.spec.js:28, total test timeout 20000ms, without a semantic assertion failure.
- Confirmed runtime overhead: refreshPathingNow synchronously called the entire EpohiRuntimeInvalidation.flush pipeline after canonical unit inspection. Instrumenting only the existing readiness scenario on Windows WebKit 26.6 (Playwright 1.63.0) recorded three explicit global flush calls of 84ms, 117ms and 90ms (291ms total); nested pathing work took 2ms, 0ms and 1ms. Call stacks show diplomacy-event-flow.focusUnit -> tile/piece click -> context-review-cleanup -> refreshPathingNow -> global flush. This scenario uses the diplomacy-event-flow interceptor, not strategy-ux.focusUnit's stack loop.
- Evidence limit: the baseline 20s CI timeout did not reproduce locally: original scenario passed (16.9s runner total with trace); instrumented baseline passed (13.0s runner total). These measurements prove avoidable synchronous global work, but do NOT establish that those 291ms alone explain the CI timeout, or prove a repeatable end-to-end speedup. Authoritative timeout closure remains unverified.

## Change
- refreshPathingNow now immediately calls EpohiHumansPathingUI.refresh after canonical context installation. It does not call global flush and adds no observer/rAF dependency or delayed workaround.
- Post-change timing recorded three immediate pathing calls, each 0ms at browser clock resolution, with no explicit global flush calls from selection. Normal scheduled global invalidation remains available.
- Only runtime file changed: src/humans-context-review-cleanup.js. No tests, assertions, timeouts, route targeting checks, layer cycling, camera behavior or legacy controls changed.

## Exact local verification (Windows; one worker)
- diplomacy:28, WebKit, strict 20000ms: initial post-change attempt 0 passed / 1 failed BEFORE readiness flow (small-map fixture created 28x28 instead of 20x20); repeat with trace 1 passed / 0 failed (14.5s runner total). Separate post-change timing run: 1 passed / 0 failed (18.3s runner total; overlapped the tail of stack diagnostics, so not a speed comparison).
- diplomacy:28, Chromium, strict 20000ms: 1 passed / 0 failed (8.9s runner total).
- humans-pathing-performance:89, Chromium + WebKit: 2 passed / 0 failed (15.1s runner total). Existing <=1000ms start-action visibility and measured actionability assertion passed in both engines; visible route assignment and subsequent turn assertions passed.
- stack-reentry-selection:10, Chromium + WebKit: 0 passed / 2 failed. Selected unit rebased correctly; canonical picker expected 2 entries, received 0 (line 46).
- Baseline comparison for that stack failure: restored original runtime from exact head e3b9cb2 and ran the same scenario on both browsers: 0 passed / 2 failed at the identical picker assertion. Then restored the narrow fix. This failure predates this change; no broader stack repair was made under the residual-only scope.
- Full focused Chromium/WebKit gate: NOT RUN because the required stack prerequisite was red. Full Chromium/WebKit regression: NOT RUN. No green gate or aggregate full-suite counts are claimed.
- Static verification: node --check for the changed runtime and git diff --check passed. Temporary instrumentation is excluded from the commit.

## Remaining failures and validation limits
- Existing stack picker failure blocks the requested local verification chain in both engines.
- One local small-map setup failure was observed and is retained above, not hidden by the successful repeat.
- CI diplomacy timeout closure is still pending; exact total-budget root cause is not claimed beyond the measured global-flush overhead.

## NEXT ACTION
Inspect the PR #89 CI result for this narrow refresh commit and reconcile the baseline stack-picker failure before resuming the gated full focused and full regression checks.

---
Historical checkpoints below are superseded by the current report above.

# AUTONOMY STATUS — «Эпохи» Humans v1

## State
`IN_PROGRESS_MANUAL_CODEX_SPRINT`

Hourly ChatGPT autonomy was explicitly disabled by the user on 2026-08-29. Current execution mode is a user-started Codex sprint followed by independent ChatGPT review.

## Integration
- Repository: `Mikayilzade/Epohi`
- Integration branch: `codex/coherence-capture-learning-v1`
- Active continuation PR: #89 (PR #87 and PR #88 are closed duplicates)
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

## Historical next action (superseded)
Push the RUN_253 eight-residual closeout as one coherent commit to existing PR #89, then inspect its complete Chromium + WebKit Actions run once and classify any remaining exact assertion before further changes.

## RUN_246_RESIDUAL_REGRESSION_CLOSEOUT checkpoint — 2026-09-02
- Implementation checkpoint: `a7bd902fddc3d14606572df1d789f0d443d73c3f` (`Close residual run 246 regression causes`) on task branch `work`; `main` was not checked out or modified.
- The task is the seven-residual closeout reported for CI #246. The current shell could not fetch GitHub or the then-active PR (`CONNECT tunnel failed, response 403`), so it cannot truthfully reproduce the remote log, push, or claim an authoritative browser result.
- Classified the WebKit camera residual as a runtime geometry defect: deriving every tile center from the first grid track accumulates engine-specific fractional-track rounding. Camera focus now uses the target tile's rendered offset geometry, while retaining the computed fallback before tiles exist.
- Hardened the foreign-unit fix around the canonical context ownership text. Coordinate-only rival detection could incorrectly suppress movement for an own-unit context when units share a coordinate.
- Removed the arbitrary wait from the foreign inspection regression: it now clicks the visible rival piece and waits for the ownership contract before asserting that own-unit route commands do not leak.
- Migrated the affected city-content helpers from the conditional readiness shortcut to the visible capital map piece and canonical `open-city` action. The readiness bar remains covered independently.
- Local browser launch remains blocked by missing Linux libraries; dependency installation also returned proxy HTTP 403. Per `AGENT_TESTING_POLICY.md`, this is `LOCAL_TEST_INFRA_BLOCKER`, and no Chromium/WebKit pass is claimed.

## RUN_240_REGRESSION_FAMILY_REPAIR checkpoint — 2026-09-01
- Starting task-branch SHA: `f0fb25e2de01e2f485e890ac49e756ab605e6ff9`; implementation checkpoint: `edbf74a55e7786f02a0ee5b6eb1436aeb35fba09`.
- GitHub CLI was unauthenticated, so no newer workflow could be queried from this shell; run #240 remains the latest exact CI evidence available here and newer-CI verification is pending the platform/GitHub integration.
- Final classification: A/B/C/E/F are `STALE_TEST`; D is `STALE_TEST` for hidden previous/next controls while the visible stack picker is the canonical flow; G and H are confirmed `RUNTIME_DEFECT`; I remains `FIXTURE_NONDETERMINISM` pending authoritative WebKit geometry evidence.
- Repaired A/B/C/E/F tests as coherent canonical-flow migrations: visible map pieces for inspection, visible readiness/city actions, the central proposal modal, behavior-level collapse/scroll assertions, and the worker-time project lifecycle without city-production spending.
- Migrated the remaining mobile stack navigation assertion in D to the visible stack picker. Existing `stack-reentry-selection` and combat stack coverage already use the canonical picker on this branch.
- Fixed G by preventing route UI from identifying a foreign same-type unit as the selected player's unit; the existing foreign-inspection regression now covers the leaked `Идти` command.
- Fixed H by removing duplicate outcome IDs from transient outcome markup while retaining the single stable visible `#outcomeMapBtn`; strengthened the regression with a uniqueness assertion.
- Static checks passed: `find src tests -name '*.js' -print0 | xargs -0 -n1 node --check`, `node --check sw.js`, `node --check playwright.config.js`, and `git diff --check`.
- Focused Chromium execution was attempted for 27 affected tests but every browser launch hit missing `libatk-1.0.so.0`; classified `LOCAL_TEST_INFRA_BLOCKER` under `AGENT_TESTING_POLICY.md`. No browser result is claimed, and Chromium/WebKit validation remains pending CI.

## Historical Codex infrastructure checkpoint — 2026-08-29
The previous Codex container could not fetch GitHub through its shell or install Playwright system libraries because of proxy/auth limitations; local Chromium failed at browser launch due missing `libatk-1.0.so.0`. No runtime/test changes were made in that blocked sprint. This remains useful diagnostic history but is **not the current project blocker**: run #240 logs/artifact are now inventoried externally and browser validation can proceed through GitHub Actions under `AGENT_TESTING_POLICY.md`.

## Completion signal
Set state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable Gates A-I in `QUALITY_GATES.md` are green and an exact immutable RC is prepared. Do not merge; the final physical iPhone test is the user's gate.

## RUN_253_EIGHT_RESIDUAL_CLOSEOUT — 2026-09-05
- Active continuation is existing PR #89; PR #87 and PR #88 are closed duplicates. The user-provided remote head before this package is `8fb45dfc077545590a16148563a9900f1bfcf267`; `main` is out of scope.
- Authoritative run #253 evidence: focused Chromium + WebKit green; full Chromium 175 passed / 5 failed; full WebKit 172 passed / 8 failed; eight unique residual scenarios.
- Classified test-only causes: conditional camp overflow, exact-zero compatibility-container geometry, hard-coded camera padding, artificial shared-coordinate ownership fixture, obsolete barbarian selector, outcome reconciliation settle timing, and raw-tile initial pathing hit target.
- Classified runtime defects: `.piece.enemy` was missing from semantic unit-layer detection; and a visible remaining-own-stack tap needed an explicit unit-inspection transition after the prior selected unit left the stack.
- The coherent patch preserves full camp text, strict camera tolerance, visible piece interactions, actual barbarian context, canonical stack picker, stable incomplete-statehood reconciliation, and the existing one-second invalidation requirement. It adds no force click, sleep, hidden-control revival, or weakened product rule.
- Local cross-browser execution remains subject to `AGENT_TESTING_POLICY.md`: installed Chromium lacks `libatk-1.0.so.0`, and WebKit is not installed. Static checks are the strongest locally available gate; authoritative browser verification remains the next PR #89 Actions run.
- Historical next action (superseded): push this single closeout commit to PR #89 and inspect the resulting complete Chromium + WebKit run once; if anything fails, record exact scenario + assertion + root cause before another change.
- Local verification result: all JavaScript syntax checks and `git diff --check` passed. The seven affected spec files (covering all eight residual scenarios) were attempted on both `chromium-mobile` and `webkit-mobile`; Chromium could not load `libatk-1.0.so.0`, and the WebKit executable is absent. The full suite was therefore not run locally and no browser-green claim is made.

## RUN_254_FOUR_RESIDUAL_CLOSEOUT — 2026-09-05
- Scope remains existing PR #89 only; `main` and closed duplicates #87/#88 are untouched.
- Authoritative run #254 baseline: Chromium 178 passed / 2 failed; WebKit 176 passed / 4 failed; four unique residual scenarios.
- `mobile-context` visibility was a stale matcher assumption: the compatibility surface remains empty, `aria-hidden`, fully transparent, pointer-inert, and at most 2px high, without requiring Playwright to call its nonzero geometry invisible.
- `camera-2` was classified as a fixture/layout-settle race: the large-map helper now waits for stable map viewport, context, and map geometry across consecutive animation frames before Show Entire Map. Strict scale, fit, and centering assertions remain unchanged.
- Confirmed runtime defects were own-stack re-entry and pathing invalidation latency. A newly inspected tile containing a live own unit now enters unit inspection even when CSS retargets the piece tap to the tile, while route targeting and repeated layer cycling retain ownership of their clicks. Canonical inspection immediately invokes the central runtime invalidation flush so path actions do not depend on delayed observer/rAF convergence.
- Historical next action (superseded): push the coherent RUN_254 commit to PR #89 and inspect its complete Chromium + WebKit Actions run once; if failures remain, record the exact scenario, assertion, and root cause before any further change.
- Local RUN_254 verification: static integrity passed. All four focused scenarios were attempted on both mobile projects; Chromium launches were blocked by missing `libatk-1.0.so.0`, and WebKit launches by the absent `webkit-2359` executable. Per testing policy these are `LOCAL_TEST_INFRA_BLOCKER` results, not scenario failures. Focused green and full-suite results remain pending authoritative PR #89 CI.
