# CODEX TASK — Test suite inventory and selection map

## Scope and safety
Work only in the existing PR #93 / branch `codex/-full-webkit-camera-2.0`.

- Do not create a new PR or branch.
- Do not merge.
- This task is analysis/documentation only.
- Do not modify game/runtime code, Playwright assertions, tolerances, test behavior, CI workflows, package dependencies, or test selection logic yet.
- Do not delete, skip, weaken, rename, or rewrite tests merely to make the map cleaner.
- Read `AGENT_TESTING_POLICY.md` first. This task adds the missing suite-based layer on top of the existing risk-based policy.

## Goal
Inventory the complete current browser-test surface and design a reliable map:

`type of change -> affected test suites -> cheapest sufficient validation`

The repository currently has roughly ~185 functional browser tests, but do not trust that number. Establish the actual current count.

The result must let a future agent choose focused coverage from evidence instead of defaulting to the whole regression suite.

## Required investigation
Inspect all current Playwright test files, Playwright config, relevant package scripts, GitHub Actions test workflow/configuration, `AGENT_TESTING_POLICY.md`, `QUALITY_GATES.md`, and any existing testing/checkpoint documentation.

Use `npx playwright test --list` if it is available without browser installation. If the local environment cannot run it, inventory statically from the test files and explicitly say so. Do not spend time trying to repair browser/system dependencies for this analysis task.

For every current test case, determine at least:

1. Primary functional suite/domain.
2. Optional secondary suite tags when behavior crosses domains.
3. Relative cost: `cheap`, `medium`, `expensive`, or `soak`.
4. Browser sensitivity: `browser-neutral`, `cross-browser`, or `WebKit-sensitive` (use evidence, not guesswork).
5. Main production areas/files/behaviors whose changes could make this test relevant.
6. Whether the test is suitable for a tiny smoke/core gate, focused feature validation, neighboring regression coverage, full-only coverage, or soak/stability validation.

## Initial suite taxonomy
Start from this taxonomy, but adjust it if the repository evidence shows a better boundary:

- `ci / infrastructure`
- `smoke / core`
- `camera / layout / mobile`
- `movement / pathfinding`
- `turn / state / save-load`
- `combat / world`
- `economy / population / worker`
- `diplomacy / strategy / UX`
- `observers / performance / runtime`
- `soak / stability`
- `full regression` as a gate/composition, not a functional domain

A test may have one primary domain plus multiple secondary tags. Avoid forcing genuinely shared tests into a misleading single theme.

## Cost classification
Do not classify cost only by file name. Use the test structure and any available timing evidence.

- `cheap`: seconds / small setup / narrow path
- `medium`: noticeable setup or multi-step scenario
- `expensive`: broad scenario, large map/state, cross-browser-heavy, or long-running path
- `soak`: repeated-turn/repeated-cycle stability checks

If timing is estimated rather than measured, mark it as estimated.

## Change-to-suite matrix
Design a practical selection matrix for future agents. It must cover both source-path and semantic risk.

Examples of the intended shape (do not copy blindly):

- camera/layout change -> camera/layout suite + relevant mobile/viewport coverage + WebKit when browser-sensitive
- pathfinding change -> movement/pathfinding + adjacent world/occupancy tests
- save/state change -> turn/state/save-load + any dependent feature tests
- simple text-only UI change -> one directly relevant UI/smoke test or no browser test when truly non-behavioral
- CI-policy/test-runner-only change -> CI/infrastructure validation, not gameplay regression by default
- shared app/state/global runtime change -> broad/full regression according to Tier 3 policy

The matrix must explain when neighboring suites are required and when escalation to full regression is justified.

## Deliverables
Create these documentation files on the same branch:

### 1. `TEST_SUITE_INVENTORY.md`
Include:
- actual current test count and how it was obtained;
- inventory grouped by primary suite;
- each test case represented in the inventory;
- cost and browser-sensitivity classification;
- important cross-domain relationships;
- obvious overlap/redundancy candidates, but do not remove anything yet;
- candidates for a minimal smoke/core set.

The inventory must reconcile to the actual total: every current test case is accounted for. If a test has several tags, count it once in the total and identify its primary suite.

### 2. `TEST_SELECTION_MATRIX.md`
Include:
- change type / source area;
- minimum focused suite(s);
- neighboring suite(s) when needed;
- Chromium/WebKit requirement;
- cost tier;
- conditions that escalate to full regression or soak.

Keep this usable by another agent without rereading every test file.

### 3. Checkpoint update
After the analysis is complete, update `CODEX_NEXT_TASK.md` with:
- actual test count;
- files created;
- key findings;
- unresolved ambiguities;
- recommendation for the next implementation step.

Update `AUTONOMY_STATUS.md` only if it is still the repository's active status/handoff document.

## Important constraints
This task stops at the design/documentation stage.

Do **not** yet:
- add tags to test source;
- split/move test files;
- change Playwright config;
- change GitHub Actions;
- create new scripts;
- remove duplicate tests;
- reduce full-gate coverage.

Any implementation should be a separate follow-up task after the user reviews the inventory and selection matrix.

## Completion criteria
The task is complete only when:

1. The actual current test count is established or a precise reason is documented why only a static count was possible.
2. Every current test case is represented in the inventory.
3. Suite, cost, and browser-sensitivity classification is documented.
4. A usable change-to-suite selection matrix exists.
5. No runtime/test/CI behavior was changed.
6. The docs are committed to the existing PR #93 branch.
7. The final report is short and states: actual test count, new docs, major findings, ambiguities, and recommended next step.
