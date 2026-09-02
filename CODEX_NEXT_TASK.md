# CODEX NEXT TASK

## Task ID
`RUN_240_REGRESSION_FAMILY_REPAIR`

## Goal
Resume the Humans v1 stabilization sprint from the exact CI evidence already recovered from workflow run #240. Do **not** restart by trying to install local browser libraries. `AGENT_TESTING_POLICY.md` applies: a browser-less Codex container is an infrastructure limitation, while GitHub Actions is the authoritative browser-ready runner.

The immediate job is to finish Stage 0 classification from the concrete run #240 inventory, then repair the stale-test/root-cause families coherently. Do not add features.

## Mandatory source of truth
Read, in order:
1. `AUTONOMY_START_HERE.md`
2. `AGENT_TESTING_POLICY.md`
3. `AUTONOMY_STATUS.md`
4. `QUALITY_GATES.md`
5. this file
6. `CODEX_STABILIZATION_SPRINT.md`
7. Draft PR #84 and latest exact CI/logs/artifacts

Repository/CI state wins over chat/history.

## Branch / PR boundary
- Repository: `Mikayilzade/Epohi`.
- Integration branch: `codex/coherence-capture-learning-v1`.
- Integration Draft PR: #84 -> `prototype/humans-v1`.
- Current review/task branch may be `codex/-codex_stabilization_sprint` or a fresh child branch from the exact current integration head.
- Do not touch `main`.
- Do not merge #84 or `prototype/humans-v1`.
- If creating a review Draft PR, BASE must be `codex/coherence-capture-learning-v1`.

## Authoritative baseline recovered from CI
Workflow #240 / run `33243697618`, implementation SHA `5b21f1b2cb7fd6d7d3020552ba38fb7bc7bcd863`:
- static integrity: GREEN;
- focused mobile runtime Chromium + WebKit: GREEN;
- full Chromium: **165 passed / 15 failed**;
- full WebKit: **165 passed / 15 failed**;
- diagnostics artifact: `9712557281` (`epohi-autonomous-cross-browser-results`).

There are 16 unique failing scenarios across both engines: 14 shared, one Chromium-only stack scenario, one WebKit-only camera scenario.

Before changing anything, verify there is no newer relevant code CI. If there is, use the newer failure set. Otherwise use #240.

## Stage 0 failure families from run #240
Treat the classifications below as evidence-backed starting hypotheses. Confirm each against current source/canonical UI before editing. Reclassify when evidence contradicts the hypothesis.

### Family A — hidden/legacy inspection controls — expected `STALE_TEST`
Failures:
- `tests/mobile-context.spec.js:12` camp description clicks hidden/legacy `#contextTabs .inspect-tab[data-inspect-layer="camp"]`.
- `tests/mobile-context.spec.js:33` unit description clicks hidden/legacy inspect tab.
- `tests/resource-worker.spec.js:36` inspection toggles `[data-inspect-layer="tile"]` / camp tabs.

Current runbook explicitly identifies legacy inspect tabs as stale-pattern candidates. Migrate these tests to the visible canonical map/context flow while preserving the behavioral assertions.

### Family B — hidden legacy city/science toolbar controls — expected `STALE_TEST`
Failures:
- `tests/population-workforce.spec.js:22` clicks `#cityBtn`, which resolves `aria-hidden="true"`.
- `tests/population-workforce.spec.js:48` same hidden city button.
- `tests/prototype-baseline.spec.js:128` clicks legacy `#scienceBtn` rather than the current visible science surface.

Open city/science through the current user-reachable controls. Preserve the population/workforce/content assertions.

### Family C — old diplomacy proposal surface — expected `STALE_TEST`, unless canonical proposal itself is broken
Failure:
- `tests/player-feedback-treasury.spec.js:43` resolves a trade `Принять` button but cannot click the old `[data-proposal=...][data-answer=yes]` surface.

Migrate to the central canonical proposal modal/decision flow. If the canonical visible accept action cannot resolve the proposal, reclassify as `RUNTIME_DEFECT` and fix regression-first.

### Family D — old stack navigation/selection assumptions — classify carefully
Failures:
- Chromium-only `tests/combat-world-stability.spec.js:180`: stack-picker button resolves but click times out.
- shared `tests/mobile-context.spec.js:75`: old `stack-next-unit` action resolves but click times out.
- shared `tests/stack-reentry-selection.spec.js:10`: after re-entry, old stack-picker expectation sees 0 entries.

Audit the current canonical stacked-unit flow. The sprint runbook already warns that old route/context selectors may be stale. If current visible stack selection works, migrate the whole family together. If tapping a visible occupied stack genuinely fails to expose/select remaining own units, this is a `RUNTIME_DEFECT` and needs a regression-first product fix.

### Family E — obsolete context CSS/layout assertions — expected `STALE_TEST` or deterministic assertion update
Failures:
- `tests/mobile-context.spec.js:44`: empty containers are empty, but exact computed `display: none` assertion no longer matches.
- `tests/mobile-context.spec.js:174`: exact `overflow: auto` assertion no longer matches current mobile context styling.

Validate the actual product requirement: empty surfaces must collapse and mobile controls must remain usable/scrollable. Assert user-visible behavior instead of obsolete implementation-specific CSS values.

### Family F — worker resource accounting from pre-learning mechanics — confirmed `STALE_TEST`
Failure:
- `tests/resource-worker.spec.js:11` expects `{ capProduction: 4, improvement: 'lumber' }`, but run #240 receives `{ capProduction: 14, improvement: null }`.

The accepted PR #84/current product rule is that workers build improvements using worker time and **do not spend city production**. The test title/assertion still says worker spends local production and is obsolete. Rewrite coverage for the current worker-time/build lifecycle and local resource scope; do not restore the old production-spending mechanic merely to satisfy this test.

### Family G — foreign-unit context action leakage — `RUNTIME_DEFECT_CANDIDATE`
Failure:
- `tests/player-feedback-treasury.spec.js:145`: after inspecting a foreign unit, `#contextActions` still contains `Идти`; `Охранять` and `Отменить` are absent as expected.

Determine what the visible `Идти` action currently targets. If it is a stale/renamed valid enemy interaction, update the assertion to the canonical semantics. If it represents a previously selected own unit's movement order leaking into enemy inspection, classify `RUNTIME_DEFECT` and fix production code regression-first.

### Family H — duplicate victory return control — `RUNTIME_DEFECT_CANDIDATE`
Failure:
- `tests/player-feedback-treasury.spec.js:197`: strict locator `#outcomeMapBtn` resolves to **two DOM elements** with the same ID.

Duplicate IDs/duplicate active controls are suspicious product behavior, not something to silence with `.first()` by default. Inspect why both exist. If one is obsolete compatibility markup, remove/rename/contain it without breaking migration; if both are intentionally present, expose a unique canonical visible control and test that. Prefer fixing the DOM contract over weakening the test.

### Family I — WebKit camera centering tolerance — `FIXTURE_NONDETERMINISM` / cross-browser assertion candidate until proven otherwise
Failure:
- WebKit-only `tests/camera-2.spec.js:177`: centering delta expected `<0.2`, received about `6.5px`; Chromium passes.

Inspect screenshot/video and camera calculation. Decide whether 6.5px is a real visible centering defect or normal WebKit/mobile layout rounding/timing. Do not blindly loosen tolerance. If camera settles incorrectly, fix runtime; if it is harmless engine geometry/rounding, make the assertion deterministic and product-meaningful.

## Repair order
1. Finish classification for all families above and record it in `AUTONOMY_STATUS.md`.
2. Repair confirmed `STALE_TEST` families A/B/C/E/F together using current visible user flows.
3. Resolve D/G/H/I based on factual reproduction/current source semantics; production code only for proven runtime defects.
4. Run affected specs on both `chromium-mobile` and `webkit-mobile` when the local environment supports browsers.
5. If local browsers are blocked by missing `libatk`, apt/proxy 403, or equivalent infra, do static checks and push one coherent checkpoint so GitHub Actions performs the cross-browser validation. Do not stop merely because the local browser cannot launch.
6. Inspect the resulting CI once, classify any remaining failures by family, and continue. Avoid one-failure/one-push churn.
7. When Gate D is green, continue sequentially to Gate E save/migration per `CODEX_STABILIZATION_SPRINT.md`.

## Non-negotiable rules
- No `force: true`, synthetic clicks, arbitrary sleeps, hidden legacy UI, or direct production-function calls as substitutes for user flows, except explicitly documented internal-compatibility tests.
- Do not delete or weaken behavior coverage just to get green.
- Do not mutate production code for a stale test.
- Runtime changes require a proven canonical-flow defect plus regression coverage.
- No new features, balance rewrites, or unrelated cleanup.
- Do not ask for an intermediate physical iPhone test.
- Do not merge.

## Handoff
At the end of the Codex run, update `AUTONOMY_STATUS.md` with exact classification, files changed, exact checks/CI results, remaining blockers, and exactly one next action. Leave work reviewable on a child branch/Draft PR targeting `codex/coherence-capture-learning-v1`.