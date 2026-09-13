# CODEX NEXT TASK

## Scope
Work only on existing PR #93 / remote branch `codex/-full-webkit-camera-2.0`. Do not create another PR/branch and do not merge.

## Current checkpoint — selector phase 1 review fixes complete
- Phase 1 now supports generic conditional effects for browser policy, minimum tier, full regression, and soak relevance as well as neighboring specs.
- Reviewed layout, shared-schema, and turn-yields conditions now escalate to their required coverage.
- Documentation-only paths no longer suppress an explicit runtime semantic override.
- The four-file broad-runtime threshold excludes ordinary `tests/**` edits; `tests/helpers.js` remains explicitly Tier 3.
- Startup validation rejects invalid manifest tiers/browser policies, missing referenced specs, duplicate/malformed case-override IDs, and malformed/unknown condition effects.
- 19 selector contract tests and required static/discovery checks are green.
- PR #97 was an accidental child PR; its commit is now contained in the existing PR #93 branch. Continue only in PR #93.
- No authoritative workflow, runtime/game code, existing Playwright behavior, Playwright config, dependencies, or mass case metadata changed.

## Final review finding before Phase 2
A final pre-CI pass is required because ordinary changed Playwright spec files still fall through as unknown ownership and therefore trigger Tier 3/full. This is safe but unnecessarily expensive and contradicts the reviewed test-only policy. Selector/tooling self-changes also need an explicit no-gameplay-browser policy, browser-policy composition should fully support all declared policy values, and manifest validation should cover the remaining safety-critical structure.

## NEXT ACTION — final Phase 1 gaps
Read and fully execute:

`CODEX_TEST_SELECTION_PHASE1_FINAL_PRECI_GAPS.md`

Do not start Phase 2 and do not edit `.github/workflows/playwright.yml`.
Do not change game/runtime code, existing Playwright assertions/behavior, Playwright config, or dependencies.
Do not mass-tag the 187 tests.

When complete, update this file and `AUTONOMY_STATUS.md`, commit only to the existing PR #93 branch, and stop for review before CI integration.