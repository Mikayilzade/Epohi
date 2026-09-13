# CODEX NEXT TASK

## Scope
Work only on existing PR #93 / remote branch `codex/-full-webkit-camera-2.0` unless the user explicitly assigns a new scope. Do not create another PR/branch and do not merge.

## Current checkpoint — inventory reviewed
- Playwright discovery establishes **187 functional cases in 39 files**. Two configured projects produce 374 project executions; this is not 374 distinct tests.
- `TEST_SUITE_INVENTORY.md` reconciles all 187 cases.
- `TEST_SELECTION_MATRIX.md` maps semantic/source changes to minimum focused coverage, conditional neighbors, browser needs, and full/soak escalation.
- Inventory review is accepted as a strong working map, with two important cautions: cost bands are estimates, and some browser-sensitivity labels are conservative until supported by timing/failure history.
- `tests/smoke.spec.js` contains no cases; real smoke candidates live mainly in `browser.spec.js`.
- Documentation-only classifier behavior was verified green in run #225: only classification ran; static, focused, full regression, and soak jobs were skipped.
- The accidental inventory PR #95 is no longer an active work stream; its inventory commit is now contained in the existing PR #93 branch. Continue only in PR #93.
- PR #93 remains open/draft/unmerged.

## Review decision
Do **not** immediately mass-tag/edit all 187 cases or switch CI to the new map.

The safer next step is a small machine-readable manifest plus a deterministic dry-run selector. Prove selection behavior first; only then integrate it into authoritative CI.

Do not hard-code estimated cost bands into CI yet. Reuse existing timing evidence if available, but do not start a fresh full cross-browser run only to collect timings.

## NEXT ACTION — selector phase 1
Read and fully execute:

`CODEX_TEST_SELECTION_IMPLEMENTATION_TASK.md`

This phase may add the ownership manifest, a dry-run selector, and cheap non-browser selector contract tests. It must **not** change runtime/game code, existing Playwright assertions/behavior, Playwright config, or the authoritative GitHub Actions workflow.

Unknown/ambiguous ownership must fail safe to Tier 3/full. Keep existing full cross-browser and soak gates unchanged.

When complete, update this file and `AUTONOMY_STATUS.md` together with the result. Do not create another PR/branch and do not merge PR #93.
