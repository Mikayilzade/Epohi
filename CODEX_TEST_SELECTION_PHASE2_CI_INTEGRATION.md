# CODEX TEST SELECTION — PHASE 2 CI INTEGRATION

## Scope
Work only on existing PR #93 / branch `codex/-full-webkit-camera-2.0`.
Do not create another PR or branch. Do not merge.

## Goal
Integrate the already-reviewed test selector into the authoritative GitHub Actions workflow so CI uses the smallest sufficient test scope while preserving all existing fail-safe guarantees.

Phase 1 is complete. The selector/manifest/contract-test model is the source of truth for ordinary PR change classification. This task is the first workflow integration step.

## Hard constraints
- Do not change game/runtime behavior.
- Do not weaken existing Playwright assertions, tolerances, or test semantics.
- Do not change Playwright config or dependencies unless absolutely required for the workflow integration; if such a change appears necessary, stop and document why before doing it.
- Do not mass-tag the 187 tests.
- Do not remove the existing full Chromium+WebKit gate or either soak job.
- Do not run arbitrary manifest-provided shell with `eval`, `bash -c`, or equivalent.
- Unknown, malformed, ambiguous, or selector-failure states must fail safe to a heavier gate, never to less coverage.

## Preserve current event/range semantics
The current workflow already has important behavior that must remain:
1. `push` to `main` and manual `workflow_dispatch` are final Tier 4 gates: full Chromium+WebKit + required soak.
2. Feature-branch pushes are not duplicated; the PR event is authoritative.
3. PR `synchronize` classifies only the newly pushed range, so a later docs/checkpoint commit does not inherit all old PR changes.
4. `opened`, `reopened`, and `ready_for_review` classify the whole PR.
5. Missing/unavailable base/head/range fails safe to Tier 3/full cross-browser and soak as currently intended.
6. Existing concurrency/cancel-in-progress behavior remains.

Do not regress any of these while replacing the ad-hoc filename classifier.

## Integration design
Use `scripts/select-tests.js` + `scripts/test-selection-manifest.json` for PR change selection.

### Changed paths
- Resolve the same base/head range as today.
- Collect changed paths deterministically.
- Pass paths to the selector safely as repeated CLI arguments or another structured mechanism.
- Do not construct an executable shell command from filenames.

### Selector failure
If any of these occurs:
- selector syntax/runtime failure;
- invalid manifest;
- invalid JSON/plan output;
- unsupported browser policy/tier;
- missing required fields;
- unexpected empty focused set for a plan that requires focused browser coverage;
then CI must emit a fail-safe Tier 3 plan with static + full Chromium+WebKit. If stability/soak applicability cannot be determined safely, prefer soak rather than silently skipping it.

### Output mapping
Translate selector output into the existing workflow jobs without duplicating browser work:
- Tier 0 docs-only: no browser jobs.
- Tier 0 selector-tooling: run the cheap selector/static contract checks, but no gameplay browser.
- Tier 1: static/minimal only if selector actually emits it.
- Tier 2: static + focused specs only.
  - `chromium` => focused Chromium.
  - `chromium+webkit` => focused Chromium + focused WebKit.
  - `policy-driven` must have an explicit deterministic mapping; never silently degrade it to Chromium.
  - `none` with browser-required Tier 2 is invalid and must fail safe.
- Tier 3/fullRegression: static + full Chromium+WebKit; do not also run the same focused matrix first.
- `soakRelevant: true` => run the existing soak gates according to policy.
- Tier 4: unchanged final full+soak behavior.

Keep case overrides supported by the plan, but do not introduce unsafe string interpolation. If no automatic CI path currently needs the 0-AI override, it may remain supported but unused by ordinary path-only classification.

## Cheap checks
`selector-tooling` currently declares required cheap checks. Do not execute arbitrary strings from the manifest.

Preferred safe implementation:
- keep workflow steps hard-coded/whitelisted;
- when selector-tooling/static validation is required, run at least:
  - `node --check scripts/select-tests.js`
  - `node --test tests/test-selection.contract.test.js`
- existing syntax/diff integrity checks should remain for normal runtime/test changes.

It is acceptable to convert manifest `checks` to stable identifiers if that makes the workflow safer, provided contract tests are updated and behavior stays equivalent.

## Critical conditional-neighbor safety review
Before trusting path-only CI, audit every `conditionalNeighbors` entry that can increase any of:
- browsers;
- minimumTier;
- fullRegression;
- soakRelevant.

The workflow only knows changed paths automatically. It must not silently omit a required condition because no human passed `--condition`.

For each escalation-capable condition:
1. establish a deterministic path-based CI trigger, OR
2. make the baseline owner conservative enough for automatic CI, OR
3. fail safe to the heavier plan when the condition cannot be determined.

Do not inspect natural-language diffs with heuristic keyword guessing and do not rely on an LLM in CI.

Add contract tests proving the automatic CI-mode behavior for every escalation-capable condition. In particular review at least:
- component UI / layout => WebKit requirement;
- worker/population `turn-yields`;
- worker/population `shared-schema`;
- any other condition currently capable of raising browser/tier/full/soak.

If a small `--ci` mode or explicit manifest field for conservative automatic conditions is the cleanest solution, it is allowed, but keep it deterministic and documented.

## Required workflow/contract coverage
Add or update cheap tests so the CI classifier behavior is proven for at least:
1. docs/checkpoint-only change => no browser;
2. selector-tooling-only change => syntax/contract checks, no gameplay browser;
3. one ordinary Chromium-only `tests/*.spec.js` edit => exactly that focused spec, Chromium only;
4. known WebKit-sensitive spec edit => exact focused spec on Chromium+WebKit;
5. multiple test-only spec edits => focused, not broad full merely due count;
6. `tests/helpers.js` => Tier 3/full;
7. isolated component UI change => reviewed focused policy;
8. component UI layout-risk condition/path => WebKit not silently omitted;
9. worker/population ordinary localized change => focused policy;
10. worker shared-schema/turn-yields risk => required full/cross-browser/soak escalation;
11. camera/layout shared change => full cross-browser and required soak policy;
12. save/schema change => full cross-browser and soak policy;
13. workflow/config/dependency/global entry-point change => Tier 3/full and appropriate soak;
14. unknown non-spec path => Tier 3/full fail-safe;
15. 4+ runtime source files => Tier 3/full broad-change fail-safe;
16. selector crash/invalid manifest/invalid plan => fail-safe, not skipped coverage;
17. missing/unavailable Git range => existing fail-safe behavior;
18. push to main/manual dispatch => Tier 4 full+soak;
19. PR synchronize still classifies only the new pushed range.

Prefer extending the existing CI-policy tests rather than creating a second independent classifier implementation in tests.

## Validation strategy
Do not blindly run all 187 tests locally just because the workflow file changed.

Before commit, run cheap validation:
- selector syntax;
- selector contract tests;
- workflow/static policy tests relevant to the classifier;
- `git diff --check`;
- any non-browser workflow parsing/contract tests already present.

Because this task changes the authoritative workflow/routing itself, the resulting PR #93 CI run is expected to be the authoritative heavy validation. The workflow change should classify itself conservatively and run the required full cross-browser gate; if soak routing is changed or marked relevant, the existing soak gates must also run.

Do not add arbitrary sleeps, loosen test assertions, or rerun successful heavy jobs without a reason.

## Acceptance criteria
Phase 2 integration is complete only when:
- `.github/workflows/playwright.yml` consumes the selector for PR path classification instead of duplicating the old ad-hoc source/test mapping logic;
- current event/range/fail-safe semantics are preserved;
- no selector failure can reduce coverage;
- Tier 0 selector-tooling avoids gameplay browser work while still running its cheap checks;
- focused Tier 2 plans run only selected specs/browser(s);
- Tier 3 does not duplicate focused + full work;
- full and soak gates remain available and correctly routed;
- every escalation-capable conditional rule has deterministic safe CI behavior;
- cheap classifier/selector contract tests are green;
- authoritative PR #93 workflow validation is green.

## After implementation
Update `CODEX_NEXT_TASK.md` and `AUTONOMY_STATUS.md` with:
- exact integration design used;
- safety fallback behavior;
- which classifier/contract tests were added;
- authoritative CI run ID and results per job;
- whether any ambiguity remains.

If the authoritative run is fully green, stop for review. Do not merge PR #93.
