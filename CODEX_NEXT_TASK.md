# CODEX NEXT TASK

## Scope
Work only on existing PR #93 / remote branch `codex/-full-webkit-camera-2.0`. Do not create another PR/branch and do not merge.

## Current checkpoint — selector phase 1 review fixes complete
- Phase 1 now supports generic conditional effects for browser policy, minimum tier, full regression, and soak relevance as well as neighboring specs.
- Reviewed layout, shared-schema, and turn-yields conditions now escalate to their required coverage.
- Documentation-only paths no longer suppress an explicit runtime semantic override.
- The four-file broad-runtime threshold excludes ordinary `tests/**` edits; unknown test ownership still fails safe, and `tests/helpers.js` remains explicitly Tier 3.
- Startup validation rejects invalid manifest tiers/browser policies, missing referenced specs, duplicate/malformed case-override IDs, and malformed/unknown condition effects.
- 19 selector contract tests and the required static/discovery checks are green. The 0-AI grep still discovers exactly one Chromium case without launching a browser.
- No workflow, runtime/game code, existing Playwright behavior, Playwright config, dependencies, or mass case metadata changed.

## NEXT ACTION — review before phase 2
Stop for review of the completed phase 1 fixes. Do not start phase 2 and do not edit `.github/workflows/playwright.yml` without a new explicit instruction.
