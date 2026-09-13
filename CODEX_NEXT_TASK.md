# CODEX NEXT TASK

## Scope
Work only on existing PR #93 / remote branch `codex/-full-webkit-camera-2.0` unless the user explicitly assigns a new scope. Do not create another PR/branch and do not merge.

## Current checkpoint — suite inventory complete
- Baseline inspected: `75c6101282db6858f5708535fe80b4f304893ce4`.
- `npx playwright test --list --project=chromium-mobile` establishes **187 functional cases in 39 files**. The two configured projects produce 374 executions; 185 static declarations expand to 187 cases through two parameterized declarations.
- Created `TEST_SUITE_INVENTORY.md`: every case is assigned once to a primary domain and classified by secondary relationships, estimated cost, browser sensitivity, production relationship, and gate role.
- Created `TEST_SELECTION_MATRIX.md`: source/semantic change types map to minimum suites, conditional neighbors, browser coverage, cost/tier, and full/soak escalation.
- No runtime code, test behavior/assertions/tolerances, Playwright config, workflow, or dependencies changed.

## Key findings
- Current suites are cross-domain; filename matching alone cannot reliably select sufficient focused coverage.
- `tests/smoke.spec.js` contains no tests; the actual smoke surface is chiefly `browser.spec.js` (8 discovered cases).
- Strong overlap clusters exist around worker production, camps, POI completion, stack selection, outcomes, and observer containment, but their scenarios are not proven duplicates.
- Camera/layout/input and observer timing have the strongest evidence for WebKit sensitivity. Full regression remains a gate composition, not a functional domain; soak remains separate.

## Ambiguities
- Cost bands are structural estimates because no per-case historical timing artifact exists in the repository.
- Browser-neutral/cross-browser boundaries lack aggregated failure history; they should be calibrated with CI timing and failure evidence.
- A minimal smoke gate needs case-level selection to choose only the 0-AI parameterized startup case.

## Recommended next action
After user review, implement machine-readable case tags plus a reviewed source/semantic ownership manifest, collect per-project timings, and then teach CI to select by that map while failing safe to Tier 3. Keep full cross-browser and soak gates unchanged during migration. Do not merge PR #93 without explicit approval.
