# CODEX NEXT TASK

## Task ID
`RUN_246_RESIDUAL_REGRESSION_CLOSEOUT`

## Goal
Close the seven residual failures reported by authoritative Chromium + WebKit CI
run #246 after the RUN_240 family repair. Preserve canonical, visible UI flows;
classify each failure before changing runtime code or test expectations.

## Boundaries
- Continue existing PR #86; do not create another PR.
- Do not touch `main`, merge, force-click, use arbitrary sleeps, or revive hidden
  legacy controls.
- Follow `AGENT_TESTING_POLICY.md`; local missing browser libraries are
  `LOCAL_TEST_INFRA_BLOCKER`, not product failures.

## Closeout package
1. Use actual rendered grid-track geometry for camera focus centering; computed
   first-track multiplication is not authoritative in WebKit.
2. Identify foreign-unit context from the rendered ownership contract rather
   than merely finding any rival on the inspected coordinate.
3. Keep the foreign-unit regression on a visible unit click and wait for a
   semantic context result, not a timer.
4. Open a capital through its visible map piece in city-content regressions so
   the test does not depend on whether the readiness shortcut is enabled.
5. Validate static integrity locally and Chromium + WebKit in authoritative CI.

## Completion rule
After the coherent checkpoint is pushed to PR #86, inspect the complete
Chromium + WebKit result. If Gate D is green, proceed to Gate E; otherwise the
single next action is to classify the exact remaining CI failures together.
