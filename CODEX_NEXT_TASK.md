# CODEX NEXT TASK

## Scope
Work only on existing PR #93 / remote branch `codex/-full-webkit-camera-2.0`. Do not create another PR/branch and do not merge.

## Current checkpoint — selector Phase 1 complete
- Ordinary changed `tests/*.spec.js` files select themselves at Tier 2 instead of falling through to a full regression. Known browser-sensitive specs add WebKit; multiple spec-only edits remain focused; `tests/helpers.js` remains Tier 3/full.
- Selector/manifest/contract-test changes have explicit Tier 0 ownership, declare the selector static and contract checks, and require no gameplay browser unless combined with a stronger area.
- Browser-policy composition preserves `none`, `chromium`, `policy-driven`, and `chromium+webkit` deterministically; full regression remains Chromium + WebKit.
- Manifest startup validation covers the runtime threshold, area paths/booleans/optional arrays, per-area condition uniqueness, optional effect/check types, referenced specs, and override IDs.
- All 27 selector contract tests, syntax validation, the existing one-case 0-AI Playwright discovery check, and diff whitespace validation are green.
- No runtime/game code, existing Playwright assertions/behavior, Playwright config, dependencies, or mass case metadata changed in Phase 1.
- Accidental child PR #98 is no longer an active work stream; its Phase 1 commit is contained in the existing PR #93 branch. Continue only in PR #93.

## Review decision
Phase 1 is accepted as ready for controlled CI integration.

The main remaining safety issue is not the selector itself but path-only CI integration: optional conditional rules that can raise browsers/tier/full/soak must never be silently omitted just because CI has no human `--condition` input.

## NEXT ACTION — Phase 2 CI integration
Read and fully execute:

`CODEX_TEST_SELECTION_PHASE2_CI_INTEGRATION.md`

Integrate the selector into the authoritative workflow while preserving current event/range/fail-safe behavior. Audit every escalation-capable conditional rule and give it deterministic conservative CI behavior before trusting path-only selection.

Do not create a new PR/branch. Do not merge PR #93.
Do not change game/runtime behavior, Playwright assertions/tolerances, or mass-tag the 187 tests.

The workflow change itself must receive authoritative heavy CI validation. After a fully green result, update this checkpoint and `AUTONOMY_STATUS.md` with the run ID/results and stop for review.
