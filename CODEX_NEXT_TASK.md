# CODEX NEXT TASK

## Task ID
`RUN_246_RESIDUAL_REGRESSION_CLOSEOUT`

## Goal
Continue **in the existing PR #86 / existing task branch** and close the remaining cross-browser regression failures revealed by authoritative GitHub Actions run #246. Do not create a new feature branch or PR unless the existing branch is technically unavailable. Do not add features.

The previous RUN_240 repair materially improved the suite. Treat run #246 as the new source of truth and work only from the remaining factual failures.

## Mandatory source of truth
Read, in order:
1. `AUTONOMY_START_HERE.md`
2. `AGENT_TESTING_POLICY.md`
3. `AUTONOMY_STATUS.md`
4. `QUALITY_GATES.md`
5. this file
6. `CODEX_STABILIZATION_SPRINT.md`
7. PR #86 and authoritative GitHub Actions run #246 diagnostics/logs/artifacts

Repository and CI evidence win over chat/history.

## Branch / PR boundary
- Repository: `Mikayilzade/Epohi`.
- Existing review PR: **#86**.
- Current task branch: `codex/-run_240_regression_family_repair`.
- Run #246 head SHA: `592e42aefe1e0c42b387868390127764d46305f5`.
- PR #86 base: `codex/-codex_stabilization_sprint`.
- Keep working in PR #86. Do **not** open a replacement PR just for this residual pass.
- Do not touch `main`.
- Do not merge PR #86, PR #84, or `prototype/humans-v1`.

## Authoritative CI baseline — run #246
Workflow: `Epohi Autonomous Cross-Browser Gate`
Run number: **#246**
Run ID: `33631089383`
Head SHA: `592e42aefe1e0c42b387868390127764d46305f5`
Diagnostics artifact: `9848289407` (`epohi-autonomous-cross-browser-results`)

Results:
- dependency/browser installation: GREEN;
- static integrity: GREEN;
- focused mobile runtime Chromium + WebKit: **GREEN**;
- focused Chromium: **60/60 passed**;
- focused WebKit: **60/60 passed**;
- full Chromium: **174 passed / 6 failed**;
- full WebKit: **175 passed / 5 failed**;
- remaining unique failing scenarios: **7**.

Previous run #240 had 30 engine-failures (15 + 15) across 16 unique scenarios. Run #246 leaves 11 engine-failures across 7 unique scenarios. Preserve the already-fixed behavior; do not regress the focused gate.

## Remaining failure inventory
Classifications below are starting hypotheses only. Confirm against current runtime, screenshots/video, DOM/state semantics and current product rules before editing.

### R1 — same-type stacked units keep distinct selection/orders — Chromium only
`tests/combat-world-stability.spec.js:180`

Observed in run #246:
- test selects three same-type stacked units and issues separate destinations;
- one selected unit is expected to reach `[6,5]` but remains `[5,5]` after the route click;
- failure is a real state/interaction mismatch, not merely a selector timeout.

Classification: `RUNTIME_DEFECT_CANDIDATE`.

Action:
- reproduce/trace the canonical visible stack-selection and route-order flow;
- verify selected unit identity is preserved when issuing each order;
- determine whether route state, stack rebasing, movement availability, or a modal/selection side effect causes the first order to be ignored;
- if product flow is defective, fix production code regression-first;
- do not weaken the distinct-order assertion merely to pass.

### R2 — camp description scroll assertion — Chromium + WebKit
`tests/mobile-context.spec.js:12`

Observed in both engines:
- no two-line clamp assertion passes;
- `scrollHeight >= clientHeight` passes;
- forced scroll attempt leaves `scrollTop` unchanged (`after = before = 0`), while the test requires `after > before`.

Classification: likely `STALE_TEST` / behavior-assertion mismatch **unless** real content is clipped and should scroll.

Action:
- inspect the actual rendered card and dimensions from run #246;
- distinguish “content fully fits, therefore no scrolling is necessary” from “content is clipped but cannot scroll”;
- preserve the product requirement that the full description is reachable/readable;
- if all text fits, assert readability/no clipping rather than mandatory non-zero scrolling;
- if it is clipped, fix runtime/CSS rather than weakening the test.

### R3 — empty context containers collapse — Chromium + WebKit
`tests/mobile-context.spec.js:46`

Observed in both engines:
- `actions` area is 0;
- `tabs` area is 240 rather than the exact expected 0.

Classification: `STALE_TEST_OR_LAYOUT_DEFECT`.

Action:
- inspect whether the empty tabs container creates any meaningful visible blank strip, spacing, hit target, or layout shift;
- if visually/interaction-wise collapsed, replace the exact implementation-area assertion with a deterministic user-visible collapse requirement;
- if the empty surface genuinely occupies unwanted space, fix the CSS/runtime;
- do not use arbitrary pixel tolerances without explaining the product requirement.

### R4 — major world event panel remains hidden — Chromium only
`tests/player-feedback-treasury.spec.js:188`

Observed in run #246:
- `#feedbackWorldEvents` exists and has `data-signature="visible-event"`;
- it remains `aria-hidden="true"` and class is only `feedback-world-events`;
- expected `.show` never appears.

Classification: `RUNTIME_DEFECT_CANDIDATE`.

Action:
- determine why event data/signature is created while visibility state is not activated;
- check event-overlay policy, invalidation/render sequencing, duplicate suppression and any engine/timing sensitivity;
- fix product code if a major event that should be shown can remain hidden;
- retain/strengthen regression coverage for actual visible user feedback, not only internal event creation.

### R5 — rival/barbarian inspection fixture cannot find barbarian marker — Chromium + WebKit
`tests/resource-worker.spec.js:46`

Observed in both engines:
- test reaches camp inspection successfully;
- then waits for `.tile[data-x="13"][data-y="14"] .barbarian-marker` or `.piece.unit` until timeout;
- expected barbarian object is not rendered at the fixture coordinates.

Classification: `FIXTURE_OR_RUNTIME_DEFECT`.

Action:
- compare fixture state coordinates with actual rendered/state barbarian position and current spawn/render rules;
- determine whether the fixture became stale, the barbarian moved due to simulation timing, or rendering is wrong;
- make the test deterministic using current semantics without bypassing the visible map interaction;
- if state says a visible barbarian is on the tile but DOM omits it, fix runtime;
- do not replace the user-flow click with a direct production-function call.

### R6 — stack re-entry after selected unit moves away — Chromium + WebKit
`tests/stack-reentry-selection.spec.js:10`

Observed in Chromium:
- map tap rebases selected unit to the remaining unit;
- canonical stack picker then contains **0** entries instead of the expected two remaining units.

Observed in WebKit:
- before re-entry can complete, visible `#routePoiModal.modal.show` intercepts the map tap for the remaining stack for the full timeout.

Classification: `RUNTIME_DEFECT_CANDIDATE`, potentially two symptoms of one route/selection lifecycle problem.

Action:
- trace route modal cleanup, selected-unit rebasing, stack composition and context rendering after the first unit leaves the stack;
- a completed/abandoned route interaction must not leave a blocking modal that prevents normal map taps;
- tapping the remaining own stack must expose/select the actual remaining own units consistently in both engines;
- fix coherent root cause rather than adding click force, modal auto-dismiss hacks in the test, or browser-specific branches.

### R7 — camera centering delta — WebKit only
`tests/camera-2.spec.js:177`

Observed in run #246:
- current assertion requires center delta `< 0.2px`;
- WebKit settles at about `6.499984741px`;
- Chromium passes.

Classification: `CROSS_BROWSER_GEOMETRY_OR_RUNTIME_DEFECT`.

Action:
- inspect screenshot/video and camera math after layout settles;
- identify whether ~6.5px comes from real incorrect centering, viewport/safe-area/layout geometry, transform rounding, or a deterministic engine-specific half-cell/pixel offset;
- do not blindly raise tolerance;
- if visibly/functionally centered and the offset is harmless engine geometry, replace `<0.2px` with a product-meaningful deterministic criterion justified by actual tile/viewport dimensions;
- if center targeting is visibly wrong or compounds across actions, fix camera runtime.

## Repair strategy
1. Start from exact current PR #86 head and confirm no newer authoritative run supersedes #246.
2. Classify all seven residual scenarios before broad edits.
3. Repair by **root-cause family**, not one red line / one push.
4. Treat R1/R4/R6 as highest-priority runtime candidates.
5. Resolve R2/R3/R5/R7 evidence-first; change tests only when current product behavior is correct and the assertion/fixture is obsolete or nondeterministic.
6. Run affected specs in both mobile projects locally when browsers are available.
7. If the Codex container cannot launch browsers because of `libatk`, apt/proxy 403, or equivalent local infra, follow `AGENT_TESTING_POLICY.md`: run static checks, commit/push one coherent checkpoint, and rely on GitHub Actions for authoritative browser validation. Do not stop the task solely due local browser infrastructure.
8. Trigger/inspect **one** full authoritative Chromium + WebKit CI after the coherent repair package. Avoid repeated one-failure pushes.
9. If CI still has residual failures, classify them from that new run and continue in PR #86 until Gate D is fully green or a genuine blocker is documented.
10. Once full cross-browser regression is green, update status and move to the next stabilization gate (save/migration) according to `CODEX_STABILIZATION_SPRINT.md`; do not merge.

## Required validation
At minimum before handoff:
- `git diff --check`;
- static JS syntax checks for changed JS files plus `sw.js` / `playwright.config.js` when relevant;
- affected Playwright specs in both `chromium-mobile` and `webkit-mobile` when local runtime supports them;
- authoritative GitHub Actions full mobile regression if push/CI is available.

A task is **not complete** just because focused tests are green. The target for this task is full Chromium + WebKit regression green, unless a precisely evidenced blocker remains.

## Non-negotiable rules
- No `force: true` clicks to hide interaction bugs.
- No synthetic/direct production calls as substitutes for canonical visible user flows, except explicitly documented internal compatibility tests.
- No arbitrary sleeps.
- No weakening/removing coverage just to get green.
- Do not mutate production code for a stale test.
- Production changes require a proven canonical-flow defect and regression coverage.
- No new features, balance rewrites, or unrelated cleanup.
- Do not ask for an intermediate physical iPhone test.
- Do not touch `main`.
- Do not merge.

## Handoff
At the end of the Codex run:
1. update `AUTONOMY_STATUS.md` with exact classification for R1-R7;
2. list files changed and why;
3. record exact local checks and exact GitHub Actions run/result if available;
4. state remaining failures/blockers with evidence;
5. leave exactly one next action;
6. keep all work reviewable in existing PR #86.