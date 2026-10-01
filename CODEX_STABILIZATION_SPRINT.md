# CODEX STABILIZATION SPRINT — Humans v1

## Purpose
This is the execution runbook for the user-started Codex stabilization sprint. The goal is to move Humans v1 from the current Phase 2 regression state toward a real Release Candidate without returning to the old one-failure/one-push loop.

Repository: `Mikayilzade/Epohi`
Integration branch: `codex/coherence-capture-learning-v1`
Existing integration Draft PR: #84 -> `prototype/humans-v1`
`main`: DO NOT TOUCH.

## Session mode override
`AUTONOMY_START_HERE.md` describes the slow autonomous loop where one run performs one bounded package. For this explicitly user-started Codex sprint, execute the stages below sequentially. Each stage/root-cause family must still be a coherent bounded engineering package, but DO NOT stop merely because one package completed. Continue to the next stage until a stop condition is reached or the session ends.

Do not merge anything. Prefer working on a child Codex branch created from the exact current integration head. If a Draft PR is created for review, its BASE MUST be `codex/coherence-capture-learning-v1`, not `main` and not `prototype/humans-v1`. PR #84 remains the integration PR and must not be merged by Codex.

## Mandatory start procedure
1. Fetch the latest `codex/coherence-capture-learning-v1` and record its exact SHA.
2. Read `AUTONOMY_START_HERE.md`, `AUTONOMY_STATUS.md`, `QUALITY_GATES.md`, `CODEX_NEXT_TASK.md`, and this file.
3. Fetch Draft PR #84 and verify head/base/draft/unmerged state.
4. Inspect the latest relevant CI/workflow and exact logs/artifacts before changing code. At creation of this runbook, run #240 (`33243697618`) on implementation `5b21f1b2cb7fd6d7d3020552ba38fb7bc7bcd863` had completed failure: static and focused cross-browser gates were green, full regression was red. Treat repository/CI state at session start as authoritative if newer.
5. Do not make speculative production changes before failure classification.

# Stage 0 — Full failure inventory and classification
Goal: stop repairing full-suite failures one red line at a time.

Inspect the COMPLETE latest full Chromium + WebKit failure set, including logs, screenshots/traces where useful. Group failures by root cause and classify each group as exactly one of:
- `STALE_TEST`: accepted current product/UI/runtime superseded the old test interaction or assertion;
- `RUNTIME_DEFECT`: current canonical user flow is actually broken;
- `FIXTURE_NONDETERMINISM`: test setup/selection/race is unstable while product behavior is valid;
- `INFRA`: browser/runner/workflow failure not caused by product/test logic.

Create/update a concise section in `AUTONOMY_STATUS.md` with the grouped inventory. Do not alter production runtime in this stage.

Exit Stage 0 only when every current failure belongs to a root-cause group. Then continue automatically to Stage 1.

# Stage 1 — Repair stale regression debt using real canonical flows
Goal: tests must validate the current product, not hidden compatibility UI or obsolete lifecycle assumptions.

For every `STALE_TEST` root-cause family:
1. Determine the current accepted user flow from current source + existing product rules. Do not infer from chat memory.
2. Update all tests in that root-cause family together, not one test per CI cycle.
3. Preserve or strengthen the behavior assertions. Do not merely make the interaction succeed.
4. Prefer visible, user-reachable controls and semantic targets.
5. Before a normal Playwright click, assert that the target is visible/actionable where appropriate.
6. Do NOT use `force: true`, synthetic `dispatchEvent('click')`, direct calls into production functions, arbitrary sleeps, or hidden legacy controls to pretend a user flow works.
7. Exception: a test whose explicit purpose is compatibility/internal semantics may use a semantic helper, but it must say why and must not masquerade as a user-flow test.
8. Do not delete valid behavioral coverage because the UI changed; migrate the coverage to the canonical surface.

Known stale-pattern examples to audit across the suite, not just previously failing lines:
- physical clicks on hidden/transparent/negative-z compatibility controls;
- legacy inspect tabs instead of the visible map/context flow;
- hidden legacy city controls instead of map city -> canonical city sheet;
- obsolete proposal surfaces instead of the central canonical proposal modal;
- old route/context action selectors instead of current stacked-unit/canonical `Идти` flow;
- assumptions that DOM nodes survive rerender/re-entry when the current UI intentionally replaces them.

After each root-cause family, run the affected specs on BOTH `chromium-mobile` and `webkit-mobile` locally before moving on. Batch related fixes into coherent commits.

If a supposedly stale test reveals that the canonical visible flow itself fails, reclassify that group to `RUNTIME_DEFECT` and handle it in Stage 2.

# Stage 2 — Fix proven runtime defects, regression first
For every `RUNTIME_DEFECT` group:
1. Reproduce through the current canonical user flow.
2. Add or strengthen a regression that fails for the actual defect.
3. Fix the smallest underlying production cause, not the symptom.
4. Keep accepted gameplay/balance/design unchanged unless repository product rules require otherwise.
5. Run affected tests on Chromium + WebKit.

No speculative runtime cleanup in this stage. A production change requires a factual failing regression or an invariant violation.

For `FIXTURE_NONDETERMINISM`, make setup deterministic without weakening the behavioral assertion. For `INFRA`, repair/retry only the infrastructure issue; do not mutate product code to accommodate runner noise.

# Stage 3 — Close Gate D: complete cross-browser regression
Run the complete Playwright suite on:
- `chromium-mobile`
- `webkit-mobile`

Work locally through root-cause groups rather than pushing after every failure. Re-run affected specs first, then full suites. Goal: zero unexplained failures on both engines. Any intentional skip must be documented and justified against `QUALITY_GATES.md`.

Do not proceed to Stage 4 while Gate D is red unless the only blocker is a documented external infrastructure condition covered by the stop rules.

# Stage 4 — Close Gate E and revalidate Gate F
## Gate E: save/load/migration
Verify and add missing regression coverage for:
- new campaign save/load;
- autosave/quick-save path;
- an older compatible save migrating without corruption of city, unit, diplomacy, capture, worker, production-experience state;
- service-worker/cache behavior not serving stale runtime assets.

Do not break old compatible saves. If a format change is genuinely necessary, implement explicit migration and regression coverage.

## Gate F: runtime performance invariants
Re-run/strengthen the existing architecture/performance tests after the Stage 1-4 changes. Preserve the already-earned architecture hardening:
- no city flicker loop;
- readiness settles after repeated routes/selections;
- idle mutation/scheduler activity becomes bounded;
- repeated 30-50 action cycles do not progressively increase callback activity;
- no uncaught errors/unhandled rejections in critical flows.

Run applicable checks on both Chromium and WebKit.

# Stage 5 — Build and close Gate G: deterministic autonomous soak player
Implement a deterministic test driver if Gate G is not already complete.

Minimum requirements from `QUALITY_GATES.md`:
- >=5 deterministic seeds;
- >=150 turns per seed or legitimate victory/defeat;
- periodic save/reload;
- long matrix on Chromium; representative WebKit soak as CI time permits;
- assert turn returns to idle, single blocking input owner, valid capitals/ownership, finite resources, valid queues/content, resolvable required interactions, bounded runtime activity.

A soak failure is not permission to loosen an invariant. Classify and fix the underlying product/test-driver defect with regression coverage.

# Stage 6 — Close Gate H: automated mobile UX/layout smoke
At 390x844 mobile viewport verify major user-facing sheets either fit or scroll correctly:
- city;
- science;
- diplomacy;
- treasury/menu;
- capture choice;
- urgent decision;
- chronicle.

Use screenshots/traces for machine diagnosis on failure; do not ask the user to inspect routine screenshots.

# Stage 7 — Gate I Release Candidate cleanup
Only after Gates A-H are green:
- remove temporary diagnostics/dead workflow experiments;
- replace/remove temporary branch-only workflow as appropriate without losing useful durable gates;
- deliberately refresh service-worker/cache version if runtime assets changed;
- update PR #84 documentation and `AUTONOMY_STATUS.md` with exact RC SHA and exact test counts;
- prepare immutable URL/build for exact RC SHA;
- set status to `READY_FOR_FINAL_DEVICE_TEST`.

Do NOT perform the physical-device test and do not merge PR #84. That is the user's final gate.

# Commit / push / CI discipline
- No series of tiny source pushes. Repair a whole factual root-cause family, validate locally, then commit/push coherently.
- Prefer stage/root-cause commits that are reviewable and reversible.
- Do not push speculative fixes while CI for the same checkpoint is still running.
- Documentation/status-only commits must not be used to trigger CI.
- Preserve push-gated CI behavior for code/test/runtime paths.
- Never weaken thresholds/assertions merely to get green.
- Never hide a WebKit failure behind Chromium success.

# Required status bookkeeping
At the end of every stage, update `AUTONOMY_STATUS.md` with:
- exact starting/base SHA;
- exact implementation head SHA;
- stage completed;
- exact local test commands/results;
- exact CI run/result if available;
- remaining blocker(s);
- exactly one next stage/action.

Do not overwrite factual history with guesses.

# Stop conditions
Stop and ask for a user/product decision only if:
- two or more materially different product behaviors are reasonable and repo rules do not decide;
- a destructive/data-loss migration is required;
- credentials/payment/legal/external unavailable service is required;
- infrastructure cannot be bypassed after reasonable diagnostics;
- all gates A-I are green and status is `READY_FOR_FINAL_DEVICE_TEST`.

Ordinary test failures, browser differences, stale tests, fixture races, refactoring choices, and CI flakes are not user decisions.

# Final Codex handoff
When the session ends, do not merge. Leave a reviewable child branch/Draft PR targeting `codex/coherence-capture-learning-v1` and report:
- exact base SHA and final head SHA;
- stages completed;
- commit list and important files changed;
- exact Chromium/WebKit counts;
- exact CI links/run IDs and artifact IDs;
- any remaining factual blockers;
- exactly one next action.

The user will hand that Draft PR/result back to ChatGPT for independent review before anything is integrated into PR #84.