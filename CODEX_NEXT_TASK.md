# CODEX NEXT TASK

## Scope
Work only on existing PR #93 / remote branch `codex/-full-webkit-camera-2.0`. Do not create another PR/branch and do not merge.

## Current checkpoint — selector phase 1 implemented, review fixes required
- Phase 1 added `scripts/test-selection-manifest.json`, `scripts/select-tests.js`, and `tests/test-selection.contract.test.js`.
- The basic design is accepted: deterministic dry-run selection, fail-safe unknown ownership, compact manifest, no CI integration yet.
- 10 original selector contract tests passed, and the 0-AI smoke grep was discovery-validated to exactly one case.
- Current authoritative CI is still unchanged.
- Accidental child PR #96 is no longer an active work stream; its phase-1 commit was moved into the existing PR #93 branch. Continue only in PR #93.

## Review findings before phase 2
Review found correctness/efficiency gaps that must be fixed before CI integration:
1. conditional rules currently add specs but cannot escalate browsers/tier/full/soak;
2. a docs-only path shortcut can ignore an explicit non-doc semantic override;
3. `tests/**` currently count toward the four-runtime-file broad threshold, causing avoidable over-escalation;
4. the safety-critical manifest needs cheap structural/integrity contract checks.

## NEXT ACTION — finish phase 1 review fixes
Read and fully execute:

`CODEX_TEST_SELECTION_PHASE1_REVIEW_FIXES.md`

Do not start phase 2 and do not edit `.github/workflows/playwright.yml`.
Do not change game/runtime code, existing Playwright assertions/behavior, Playwright config, or dependencies.
Do not mass-tag the 187 tests.

When the review fixes and their contract tests are green, update this checkpoint and `AUTONOMY_STATUS.md`, commit only to the existing PR #93 branch, and stop for review.