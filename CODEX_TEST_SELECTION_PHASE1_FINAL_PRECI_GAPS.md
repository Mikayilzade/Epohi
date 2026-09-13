# CODEX TEST SELECTION — FINAL PHASE 1 GAPS BEFORE CI

## Scope
Work only on existing PR #93 / branch `codex/-full-webkit-camera-2.0`. Do not create another PR/branch and do not merge.

This is still Phase 1. Do not edit `.github/workflows/playwright.yml` yet.

## Why another small review pass is required
The previous review fixes are accepted, but before the selector becomes authoritative CI input there are still efficiency/safety gaps that should be closed in the selector itself.

### 1. Ordinary Playwright spec edits must not automatically become full regression
Current behavior: an ordinary changed `tests/*.spec.js` file is not counted as a runtime file, but because it has no path owner it falls through to unknown ownership and Tier 3/full.

That is safe but defeats the purpose of suite-based selection and contradicts `TEST_SELECTION_MATRIX.md`:
- a test-only edit should normally run the changed spec directly;
- Chromium by default;
- WebKit when that spec is browser/layout/input-sensitive or when uncertainty warrants cross-browser;
- shared helpers such as `tests/helpers.js` remain broad/high-risk Tier 3/full.

Implement a deterministic rule for changed Playwright spec files without mass-tagging all 187 cases. Prefer the smallest maintainable approach. Unknown ordinary `*.spec.js` should not silently run zero coverage; at minimum select that exact spec, and if browser sensitivity cannot be established safely, use Chromium + WebKit for that spec rather than the entire full suite.

Add contract tests for at least:
- one isolated Chromium-only spec edit;
- one known WebKit-sensitive spec edit such as `tests/camera-2.spec.js`;
- multiple ordinary spec edits remain focused and do not trigger the runtime-file threshold;
- `tests/helpers.js` still escalates to Tier 3/full.

### 2. Selector/tooling self-changes need an explicit non-browser policy
Once this selector is integrated, edits to:
- `scripts/select-tests.js`
- `scripts/test-selection-manifest.json`
- `tests/test-selection.contract.test.js`

must not be treated as unknown gameplay changes and trigger a full browser regression by default.

Add a clearly owned selector-tooling area or equivalent policy that:
- runs/declares the cheap selector contract validation;
- requires no gameplay browser by itself;
- cannot bypass validation of the manifest/selector;
- remains fail-safe if combined with runtime/game changes.

Do not modify the authoritative workflow in this phase. The plan/output should simply make this ownership explicit so Phase 2 can wire it correctly.

### 3. Browser-policy combination must be complete, not hard-coded to only Chromium vs Chromium+WebKit
The selector now accepts browser policies including `none`, `chromium`, `chromium+webkit`, and `policy-driven`, including condition effects. Ensure composition handles all supported policies consistently for matched areas and conditional effects.

In particular:
- `none` must remain `none` when there is no browser-requiring area;
- `chromium+webkit` must dominate Chromium;
- `policy-driven` must not be silently downgraded to Chromium;
- mixed plans must choose the safest applicable requirement deterministically.

Add cheap contract tests for these combinations.

### 4. Finish safety validation for the machine-readable manifest
The manifest is becoming safety-critical. Extend validation cheaply so malformed top-level/area structures fail before selection. At minimum validate:
- `runtimeFileThreshold` is a positive integer;
- `area.paths` is an array of non-empty strings;
- `area.fullRegression` and `area.soakRelevant` are booleans;
- optional `conditionalNeighbors` and `caseOverrides` are arrays when present;
- condition IDs are unique within an area;
- optional effect fields keep their declared types.

Do not over-engineer a schema library unless clearly useful; simple deterministic validation is preferred.

## Required validation
Run only cheap checks needed for this Phase 1 task:
- `node --check scripts/select-tests.js`
- `node --test tests/test-selection.contract.test.js`
- the existing 0-AI Playwright `--list` discovery check if still relevant
- `git diff --check`

Do not launch full/focused gameplay browsers merely for this review task unless a newly added selector rule cannot be validated without discovery. Do not change existing Playwright assertions/behavior.

## Stop condition
When these gaps are closed and the cheap contract suite is green:
- update `CODEX_NEXT_TASK.md` and `AUTONOMY_STATUS.md`;
- commit only to the existing PR #93 branch;
- stop before Phase 2 / CI integration;
- report any remaining ambiguity that could cause under-testing or unnecessary full-suite execution.