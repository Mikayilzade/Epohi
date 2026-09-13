# CODEX NEXT TASK

## Scope
Work only on existing PR #100 / branch `codex/fix-github-actions-output-issue`. Do not create another PR/branch and do not merge.

## Current checkpoint
The two failures from Actions run `34770696737` (head `f72dd40d375cd4e5b42ead15ecd72b216514b480`) were diagnosed and fixed locally.

- `tests/ci-push-gate.spec.js:19`: the workflow was correct. The test incorrectly required selector-owned reason labels (`docs-or-checkpoint-only` and `new-pr-sync-range`) to occur literally in `playwright.yml`. It now asserts the actual workflow behavior: synchronize events use `before/after`, other PR events use PR base/head, and both ranges are passed to `map-ci-test-plan.js`.
- WebKit soak seed `30303`: `advanceTurn` polled every 25 ms and performed a separate Playwright locator count/visibility round trip on every poll. Under WebKit this accumulated protocol latency until the test-level timeout even though Chromium's faster protocol path completed. It now waits in the page for a semantic transition (outcome, completed turn, or idle/blocking state) and returns one snapshot per transition; no gameplay code, arbitrary sleep, tolerance, or assertion was changed.

## Validation
Green locally:
- `node --check tests/autonomous-soak.spec.js`
- `node --check tests/ci-push-gate.spec.js`
- `npx playwright test tests/ci-push-gate.spec.js --project=chromium-mobile --reporter=line --workers=1` (2/2)
- `git diff --check`

Local browser validation is infrastructure-blocked: WebKit revision 2359 is absent and its download endpoints return HTTP 403; the cached Chromium cannot launch because `libatk-1.0.so.0` is absent. Per `AGENT_TESTING_POLICY.md`, do not weaken tests or repeatedly repair this container.

## Next action
Publish the coherent fix to the existing PR #100 and inspect its authoritative Actions run. Required before Ready for review:
1. isolated WebKit seed `30303` green;
2. full Chromium + WebKit regression green;
3. WebKit representative soak matrix green.

If CI is red, inspect the exact first failure and diagnostics; do not rerun blindly. Stop for review when green. Do not merge.
