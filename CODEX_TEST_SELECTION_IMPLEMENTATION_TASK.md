# CODEX TASK — Test selection implementation, phase 1

## Scope and safety
Work only on existing PR #93 / branch `codex/-full-webkit-camera-2.0`.

- Do not create another PR or branch.
- Do not merge.
- Read `AGENT_TESTING_POLICY.md`, `TEST_SUITE_INVENTORY.md`, `TEST_SELECTION_MATRIX.md`, `CODEX_NEXT_TASK.md`, and `AUTONOMY_STATUS.md` first.
- Keep the existing authoritative CI behavior unchanged during this phase.
- Do not weaken, skip, delete, rename, or rewrite existing tests/assertions merely to fit the selector.
- Do not mass-edit/tag all 187 cases across 39 files in this phase.

## Goal
Turn the reviewed human-readable inventory into a small machine-readable selection layer that can be tested in dry-run mode before CI depends on it.

The intended architecture is:

`changed source/semantic area -> ownership manifest -> selected focused specs/case overrides -> browser requirement -> escalation decision`

Unknown or ambiguous ownership must fail safe to Tier 3/full.

## Why this phase is deliberately narrow
The inventory is useful, but several classifications (especially cost/browser sensitivity) are still partly estimated. Editing every test or immediately replacing CI selection would create unnecessary churn and risk.

First prove that a compact manifest + selector can reproduce the reviewed matrix on representative changes. Only then should the authoritative workflow consume it.

## Required implementation

### 1. Machine-readable ownership/selection manifest
Create a compact repository file in an appropriate format (JSON/JS is preferred if it keeps validation simple) that records at least:

- semantic/source area identifier;
- source path/glob ownership;
- primary focused spec file(s);
- conditional neighbor spec file(s) with a short reason/condition;
- default browser requirement (`chromium`, `chromium+webkit`, or policy-driven);
- minimum policy tier / escalation hints;
- whether soak can become relevant;
- optional case-level selector override only where file-level execution is materially too broad.

Use `TEST_SELECTION_MATRIX.md` as the reviewed source of truth. Keep the manifest small enough for another agent to understand and maintain.

Do not encode estimated per-case cost as a hard CI budget yet.

### 2. Selector / dry-run utility
Add a small deterministic utility that can take representative changed paths (and, where necessary, an explicit semantic override) and output a plan such as:

- chosen risk tier;
- focused spec(s);
- conditional neighbor(s) included and why;
- Chromium/WebKit requirement;
- whether full regression is required;
- whether soak is relevant;
- fallback reason when ownership is unknown.

The utility must not launch Playwright in normal dry-run mode. Its purpose is selection planning and validation.

Prefer simple repository-native JavaScript/Node with no new dependency unless there is a strong reason otherwise.

### 3. Selector contract tests
Add cheap non-browser tests for the manifest/selector itself. Cover representative scenarios from the matrix, including at minimum:

- docs-only -> Tier 0 / no browser;
- camera/layout -> camera coverage + WebKit and correct escalation;
- isolated component/UI change -> focused owner, not full by default;
- pathfinding core -> high-risk/full according to policy;
- save/schema -> Tier 3/full;
- worker/population localized change -> focused owner + conditional neighbors only when implicated;
- CI/workflow change -> policy-specific infrastructure handling;
- unknown path -> fail-safe Tier 3/full;
- broad change (4+ runtime files) -> Tier 3/full;
- case-level smoke override can select the intended 0-AI startup case without selecting the other parameterized variants, if this can be represented safely without modifying the test source.

If the last case cannot be implemented robustly without changing test source, document that limitation instead of using a brittle line-number selector.

### 4. Historical/representative validation
Use repository history or representative synthetic change sets to compare selector output against `TEST_SELECTION_MATRIX.md`.

Record mismatches. Fix the selector/manifest when the matrix clearly defines the expected result. If the matrix itself is ambiguous, document the ambiguity rather than inventing policy.

Do not claim historical timing/failure evidence unless it was actually retrieved.

### 5. Timing evidence
Check whether existing Playwright/GitHub Actions reports already expose useful per-case/project timings.

- Reuse existing evidence if available.
- Do not trigger a fresh full Chromium/WebKit run solely to measure timings.
- If reliable timing history is unavailable, keep `cheap/medium/expensive` as documentation estimates and leave measured-cost automation for later.

## Explicit non-goals for this phase
Do not yet:

- modify `.github/workflows/playwright.yml` to consume the new selector;
- change the authoritative CI risk classifier;
- change Playwright config;
- mass-add annotations/tags to existing tests;
- alter full regression or soak composition;
- delete/consolidate overlap candidates;
- modify runtime/game code;
- merge PR #93.

## Documentation/checkpoint
Update `CODEX_NEXT_TASK.md` and `AUTONOMY_STATUS.md` when complete.

Document:

- files added/changed;
- manifest shape;
- selector behavior and fallback;
- contract-test results;
- representative validation results;
- timing evidence found or not found;
- unresolved ambiguities;
- recommended phase 2 (CI integration) only if phase 1 is sound.

## Completion criteria
Phase 1 is complete only when:

1. A machine-readable ownership/selection manifest exists.
2. A deterministic dry-run selector exists.
3. Cheap selector contract tests cover the required representative cases.
4. Unknown/broad changes fail safe to full coverage.
5. No runtime/game behavior or existing Playwright assertions are changed.
6. Authoritative CI workflow behavior remains unchanged.
7. Results are committed to the existing PR #93 branch.
8. Final report is short: what was added, contract-test result, any mismatches/limitations, and whether phase 2 is recommended.
