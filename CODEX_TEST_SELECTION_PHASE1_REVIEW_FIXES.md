# CODEX TEST SELECTION — PHASE 1 REVIEW FIXES

## Scope
Work only on existing PR #93 / branch `codex/-full-webkit-camera-2.0`. Do not create a new PR/branch. Do not merge. Do not integrate the selector into the authoritative GitHub Actions workflow yet.

## Context
Phase 1 is useful and the basic dry-run selector is working, but review found several correctness/efficiency gaps that should be fixed before phase 2.

## Required fixes

### 1. Conditional rules must be able to change browser/tier/full/soak, not only add specs
Current `conditionalNeighbors` only add spec files. That is insufficient for rules whose condition changes required browser coverage or escalation.

At minimum fix these reviewed cases:
- `component-ui` + `layout` (or any responsive/touch/layout condition) must add WebKit as required by `TEST_SELECTION_MATRIX.md`; it must not remain Chromium-only.
- `worker-population` + `shared-schema` must escalate conservatively to Tier 3/full Chromium + WebKit because persisted schema is shared/high-risk.
- `worker-population` + `turn-yields` must escalate when the shared economy/end-turn tick is implicated, rather than merely adding `turn-unlock.spec.js`.

Prefer a small generic condition-effects shape in the manifest (for example optional `browsers`, `minimumTier`, `fullRegression`, `soakRelevant`) rather than hard-coded special cases in the selector.

### 2. Explicit semantic ownership must not be silently discarded by docs-only shortcut
Today, when all `changedPaths` are documentation, the selector returns Tier 0 before considering a supplied non-documentation `--semantic` override.

Required behavior:
- docs-only with no semantic runtime area => Tier 0;
- docs-only plus an explicit non-documentation semantic area => honor the semantic area and select its required plan, or fail safe; never silently return Tier 0.

Add a contract test proving this.

### 3. Do not count ordinary test-file edits as "runtime files" for the 4-file broad-runtime threshold
`RUNTIME_PATTERNS` currently includes `tests/**`, while the reviewed policy says the conservative threshold is for broad runtime changes. Four independent test-only edits should not automatically become Tier 3 solely because there are four test files.

Required behavior:
- count runtime/game/layout entry paths (`src/**`, `styles/**`, `index.html`, `sw.js`, etc.) for the runtime-file threshold;
- test-only edits should follow test-only/shared-helper policy and unknown ownership should still fail safe;
- `tests/helpers.js` remains Tier 3 through the manifest because it is shared test infrastructure.

Add a contract test showing four known test-only files do not trip the runtime threshold merely by count. If they are otherwise unowned, the fallback may still be Tier 3 for the correct reason; the test should distinguish the reason.

### 4. Add manifest integrity contract checks before CI integration
The selector manifest will become safety-critical. Add cheap Node checks for at least:
- unique area IDs;
- valid tier values;
- valid browser-policy values;
- every referenced primary/neighbor/case-override spec exists;
- duplicate or malformed case override IDs are rejected/detected;
- malformed/unknown condition effect fields fail clearly rather than being ignored.

Do not require browser launches for these checks.

## Preserve
- Unknown ownership must still fail safe to Tier 3/full Chromium + WebKit.
- `browser-smoke` 0-AI override must still select exactly one discovered case.
- Do not mass-tag/edit the 187 Playwright cases.
- Do not change game/runtime code, existing Playwright assertions/behavior, Playwright config, dependencies, or `.github/workflows/playwright.yml`.
- Keep full regression and soak gates available and unchanged.

## Validation
Run at least:
- `node --check scripts/select-tests.js`
- `node --test tests/test-selection.contract.test.js`
- the existing Playwright `--list` check proving the 0-AI grep resolves to exactly one case without launching a browser
- `git diff --check`

Add focused contract tests for every correction above. Do not start phase 2 after the fixes. Update `CODEX_NEXT_TASK.md` and `AUTONOMY_STATUS.md` with the final phase-1-reviewed state, then stop.