# CODEX NEXT TASK

## Scope
Work only on existing PR #93 / remote branch `codex/-full-webkit-camera-2.0`. Do not create another PR/branch and do not merge.

## Current checkpoint — selector Phase 1 complete
- Ordinary changed `tests/*.spec.js` files now select themselves at Tier 2 instead of falling through to a full regression. Known browser-sensitive specs add WebKit; multiple spec-only edits remain focused; `tests/helpers.js` remains Tier 3/full.
- Selector/manifest/contract-test changes have explicit Tier 0 ownership, declare the selector static and contract checks, and require no gameplay browser unless combined with a stronger area.
- Browser-policy composition now preserves `none`, `chromium`, `policy-driven`, and `chromium+webkit` in deterministic strength order; full regression remains Chromium + WebKit.
- Manifest startup validation now covers the runtime threshold, area paths/booleans/optional arrays, per-area condition uniqueness, and optional effect/check types.
- All 27 selector contract tests, syntax validation, the existing one-case 0-AI Playwright discovery check, and diff whitespace validation are green.
- No authoritative workflow, runtime/game code, existing Playwright behavior, Playwright config, dependencies, or mass case metadata changed.

## NEXT ACTION — review before Phase 2
Stop for review. Phase 1 is complete; do not start Phase 2 or edit `.github/workflows/playwright.yml` without a new explicit instruction.

Remaining conservative behavior: a changed spec inherits WebKit sensitivity when it is referenced by any cross-browser manifest owner; genuinely unowned specs default to Chromium rather than zero coverage. Unknown non-spec paths still fail safe to Tier 3/full.
