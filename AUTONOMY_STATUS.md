# AUTONOMY STATUS — CURRENT

Updated: 2026-09-13 UTC.
State: PR_93_TEST_SUITE_INVENTORY_REVIEWED / IMPLEMENTATION_PENDING / NO_MERGE.

## Current checkpoint
- Active scope remains existing PR #93 / `codex/-full-webkit-camera-2.0`.
- Playwright discovery establishes 187 functional cases in 39 files (374 project executions across Chromium mobile and WebKit mobile).
- `TEST_SUITE_INVENTORY.md` reconciles all 187 cases and is accepted as the current human-readable inventory.
- `TEST_SELECTION_MATRIX.md` is accepted as the current selection design: semantic change -> minimum suite(s) -> conditional neighbors -> browser/escalation rules.
- Documentation-only CI classification was verified: run #225 completed green with only `Classify CI scope`; static, focused, full regression, and both soak jobs were skipped.
- No runtime code, test behavior, Playwright config, CI workflow, or dependencies changed in the inventory work.
- PR #93 remains open/draft/unmerged.

## Review notes
- The 187 count is well-supported: 185 static `test(...)` declarations expand to 187 functional cases because of parameterized declarations.
- The main value of the inventory is the cross-domain map; filename-only selection is insufficient for several shared mechanics.
- Cost labels are estimates, not measured timings. Do not hard-code CI budgets from them yet.
- Browser-sensitivity labels are a useful first pass, but some file-level classifications are intentionally conservative and need real CI history/timing evidence before becoming automatic policy.
- `tests/smoke.spec.js` is currently a zero-test placeholder; the actual smoke candidates live mainly in `browser.spec.js`.
- Overlap candidates are not proven duplicates. Do not delete/consolidate tests merely because scenarios look similar.

## Implementation direction after review
1. Do not immediately edit/tag all 187 cases across 39 files; that would create large churn before the selector design is proven.
2. First create a small machine-readable ownership/selection manifest derived from the reviewed inventory: source/semantic areas -> primary suites/files, conditional neighbors, browser sensitivity, and escalation rules. Allow case-level overrides only where file-level selection is too broad (for example 0-AI smoke).
3. Add a selector/dry-run utility that reports what would run for representative change sets, without changing the authoritative CI gate yet.
4. Validate the manifest/selector against representative historical changes and the matrix. Unknown ownership must fail safe to Tier 3/full.
5. Reuse existing timing evidence if available. Do not start a new full cross-browser run solely to measure timings; collect measured timings when a full run is naturally required.
6. Only after dry-run review should CI consume the selector. Keep the existing full cross-browser and soak gates available throughout migration.
7. Consider source-level test annotations/tags later only where they materially improve case-level selection; avoid mass tagging for its own sake.

---

## Previous checkpoint — 2026-09-12
State: PR_93_CAMERA_FIX_VERIFIED_GREEN / RISK_BASED_CI_FINALIZATION_PENDING_SINGLE_VALIDATION / NO_MERGE.

- Camera 2.0 fix was verified green in authoritative PR #93 run #210 at `8ae1ae9da6685218ae5dcd9e99deac151cd03df0`.
- Risk-based CI policy was finalized in `AGENT_TESTING_POLICY.md`.
- CI model classifies only the relevant pushed range, avoids duplicate feature-branch push runs, separates soak from ordinary regression, cancels superseded runs, and fails safe when scope is unknown.
- Camera root cause: WebKit could apply a later 13 px responsive viewport-height update after the synchronous fit; the fix waits for the production camera lifecycle to settle before checking exact fit.
- No arbitrary sleep, tolerance relaxation, or production camera/game-logic change was used.

---

## Historical note
Detailed pre-fix and intermediate CI-policy chronology is intentionally not duplicated here. Use git/Actions history only when a concrete investigation requires it.
