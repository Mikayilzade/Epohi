# CI v2 — faster, more diagnostic Playwright gates

Status: planned work package. Do not implement merely because this file exists. Start only from an explicit user/Codex instruction.

## Why this exists
The current CI is safer than before, but it still has two practical weaknesses:
1. wall-clock time is dominated by a few large sequential jobs;
2. a red browser test can still report mostly a symptom (for example a timeout) instead of enough state to identify the real cause quickly.

The goal of CI v2 is therefore **not just more parallelism**. The goal is:
- keep or improve coverage;
- finish materially faster by splitting independent work;
- make every browser failure leave a useful diagnostic package;
- make the GitHub run UI itself point toward the failing browser/test/seed;
- avoid creating new flakes by introducing unsafe parallelism.

## Non-negotiable guardrails
- Do not weaken assertions, tolerances, timeouts, or gameplay behavior merely to obtain green CI.
- Do not add arbitrary sleeps.
- Do not reduce effective coverage without explicit evidence and documentation.
- Do not convert a deterministic test into a flaky/retry-only test.
- Do not create a new PR or branch unless the initiating prompt explicitly permits it.
- Preserve the risk-based classifier and the rule that feature-branch PR CI is authoritative (no duplicate heavy push gate).
- Keep `fail-fast: false` for diagnostic matrices where seeing all independent failures is useful.
- Prefer job-level parallelism first. Increase Playwright workers only after independence is demonstrated.
- If a phase exposes a real pre-existing product/test bug, do not hide it to continue the optimization.

## Adaptive phase rule
Codex may execute this entire plan in one work package and move from phase to phase automatically **only when the current phase exit criteria are satisfied**.

The exit criteria are engineering evidence, not ceremonial wording. If an exact criterion becomes impossible or nonsensical because the repository structure differs from the plan, Codex may replace it with the closest evidence-based equivalent, but must:
1. explain why the original criterion was not applicable;
2. preserve the intent (coverage, determinism, diagnostics, or speed);
3. record the substitute criterion and evidence in `AUTONOMY_STATUS.md`;
4. never use this flexibility to skip a genuine failure.

If an external infrastructure limit blocks a phase, follow `AGENT_TESTING_POLICY.md`: record the blocker, complete all safe local/static work, and use GitHub Actions where possible. Stop only when the next meaningful change cannot be evaluated safely.

---

# Phase 0 — baseline and inventory

## Objective
Understand the current wall-time, test layout, and bottlenecks before changing concurrency.

## Work
- Record current workflow/job structure and which jobs are sequential internally.
- Record approximate duration of the latest representative Tier 3/4 run(s), including the slowest job.
- Inventory Playwright suites/files and soak seeds.
- Identify tests/suites explicitly marked `serial` and why.
- Identify current artifact behavior: trace, screenshot, video, report, `test-results`, and whether CI actually uploads them on failure.
- Record current Playwright worker settings and `fullyParallel` setting.

## Exit criteria
- Baseline is written to `AUTONOMY_STATUS.md` or a short section in this file.
- No runtime/game behavior changed.
- Bottleneck(s) and safe first parallelization targets are named from evidence, not guesswork.

---

# Phase 1 — failure diagnostics foundation

## Objective
A browser failure should leave enough evidence to answer: **what failed, in which browser, during which action/state, and what the game looked like at that moment?**

## Work
Create a small reusable diagnostics layer for Playwright failures. Prefer a helper/reporter/fixture rather than duplicating logic in every test.

At minimum, failure evidence should identify when available:
- commit/SHA or CI context;
- browser/project;
- test file and full test title;
- seed for deterministic/soak tests;
- current turn;
- last meaningful action or phase;
- whether turn processing was active;
- victory/defeat/outcome state;
- visible blocking modal(s) / input owner;
- selected unit/city if relevant and cheaply available;
- console/page errors already captured by the test harness;
- compact game-state snapshot sufficient for diagnosis without dumping huge/private data.

Produce a machine-readable `failure.json` (or equivalent structured artifact) for failed tests when practical.

Change Playwright failure recording so a first failure is useful. `trace: 'on-first-retry'` with zero retries is insufficient; use an evidence-preserving policy such as `retain-on-failure` unless a better repository-specific mechanism is proven.

Ensure screenshots/video/traces/structured diagnostics are actually written to paths uploaded by Actions. Do not keep upload steps that routinely report "no files found" without understanding why.

## Validation
- Static/syntax checks for diagnostics code.
- Add cheap contract/unit coverage for serialization/helper logic where possible.
- Prove artifact path/configuration correctness without permanently committing a deliberately failing gating test.
- If a safe temporary/manual diagnostic probe is used, remove it before finishing the phase.

## Exit criteria
- A future first browser failure will retain trace/evidence without requiring a retry.
- CI upload paths match the files Playwright/diagnostics actually produce.
- Structured diagnostics do not themselves make passing tests materially slower.
- No gameplay assertions were weakened.

---

# Phase 2 — split soak by seed

## Objective
Remove the long serial soak tail and make a soak failure immediately attributable to one browser + one seed.

## Work
Refactor CI orchestration so independent deterministic soak seeds run as separate matrix jobs (or equivalent independent jobs).

Initial intended shape:
- Chromium long soak: one job per existing long seed (`10101`, `20202`, `30303`, `40404`, `50505`).
- WebKit representative soak: one job per existing representative seed (`10101`, `30303`).

The test itself may remain deterministic and serial inside a single seed. Do not run multiple seeds in one process merely for convenience.

Job names should make the failure obvious, for example:
`Soak — WebKit — seed 30303`.

Use `fail-fast: false` so one failed seed does not hide whether other independent seeds pass.

## Validation
- Prove that the set of seeds executed is identical to the pre-change intended coverage.
- All existing seeds pass in authoritative CI, or any red seed is investigated as a real failure rather than bypassed.
- Confirm no seed is accidentally duplicated or omitted.

## Exit criteria
- Each soak seed is independently visible in GitHub Actions.
- Coverage is equivalent or stronger.
- The wall-clock soak duration is governed mainly by the slowest seed rather than the sum of all seeds, subject to runner availability.

---

# Phase 3 — split full regression by browser and shard

## Objective
Replace one long full-regression train with several independent, bounded jobs while keeping the same test set.

## Work
- Separate Chromium and WebKit into independent matrix dimensions/jobs so one browser never waits for the other to finish first.
- Split the non-soak full suite into a conservative initial number of shards. Start around 3 shards per browser unless baseline data strongly justifies another number.
- Prefer Playwright's supported sharding (`--shard=x/y`) or another deterministic partitioning mechanism over hand-maintained arbitrary test lists.
- Keep soak excluded from full-regression shards exactly as before.
- Use `fail-fast: false` so independent shard failures remain visible.
- Give jobs clear names, e.g. `Full — Chromium — shard 2/3`.

Do **not** jump to 50–100 jobs. Setup/download overhead and runner concurrency can erase the benefit.

## Coverage equivalence check
Add or document a cheap way to prove that the union of full-regression shards equals the intended pre-shard test set with no omissions. Duplicates should be avoided unless Playwright requires them for setup semantics.

## Exit criteria
- Chromium and WebKit are no longer sequential inside one job.
- Full non-soak coverage is preserved.
- All shards green in authoritative CI, or any red shard is root-caused.
- A failure immediately identifies browser + shard + exact Playwright test in logs/artifacts.

---

# Phase 4 — controlled worker experiment

## Objective
Gain additional speed only if tests are truly independent inside a job.

## Work
After Phases 1–3 are stable, evaluate raising Playwright workers from `1` to `2` for full-regression shards.

Do not change soak worker behavior unless evidence shows it is safe and useful.

Compare:
- wall-clock time;
- new flakes/races;
- shared state/server/storage interference;
- artifact clarity.

If `workers=2` introduces instability or ambiguous failures, revert that part and keep the job-level parallelism from previous phases.

Only consider `workers=3/4` if `workers=2` is demonstrably stable and runner resources make it worthwhile.

## Exit criteria
One of these is acceptable:
- workers increased with evidence of stable improvement; or
- workers intentionally remain at 1, with the reason recorded.

**A higher worker count is not itself a success criterion. Stability wins.**

---

# Phase 5 — faster root-cause localization

## Objective
Reduce "red test -> speculation" into "red test -> small evidence set -> specific subsystem/action".

## Work
For long/stateful tests (especially soak), ensure the diagnostic context is updated at meaningful boundaries, not on every millisecond poll. Examples:
- game created;
- standing orders assigned;
- before End Turn;
- after turn transition;
- blocking interaction detected/resolved;
- save started/completed;
- reload started/completed;
- outcome reached.

On failure, report the last successful boundary and first failed expectation/transition.

Where a test currently ends with a generic timeout, prefer waiting for a **semantic state transition** and include the observed state in the failure message. Do not widen the timeout unless evidence proves the operation legitimately needs more time.

Gradually move pure logic checks out of expensive browser journeys when a deterministic unit/contract test can test the same logic more precisely. Keep browser coverage for integration behavior; do not replace integration coverage blindly.

## Exit criteria
- Stateful/soak failures report a useful last-action/state context.
- At least the known long-running soak path has structured boundary diagnostics.
- No broad refactor is required just to satisfy this phase; improve the highest-value paths first.

---

# Phase 6 — classifier and workflow integration audit

## Objective
Make sure CI v2 remains risk-based and does not multiply work unnecessarily.

## Work
Verify/update classifier/workflow contracts so:
- Tier 0 still avoids heavy browser work;
- Tier 2 still runs focused tests only as appropriate;
- Tier 3 runs the new full/sharded structure when required;
- soak matrices run only for paths/risk that actually require soak;
- Tier 4/manual final gate runs the complete required cross-browser + stability coverage;
- docs/checkpoint pushes do not retrigger heavy jobs;
- feature branches do not get duplicate push + PR heavy runs;
- superseded runs cancel cleanly;
- matrix job names remain diagnostic.

Update contract tests to check behavior/semantics rather than brittle YAML formatting.

## Exit criteria
- Classifier contract tests green.
- No duplicate heavy gate is introduced.
- Tier behavior still matches `AGENT_TESTING_POLICY.md`.

---

# Phase 7 — final validation and measured result

## Objective
Prove that CI v2 is both faster and at least as trustworthy.

## Work
Run the strongest appropriate authoritative gate for the final CI changes.

Record:
- before/after total wall-clock duration for representative comparable runs;
- slowest job before/after;
- number of parallel jobs/shards;
- coverage equivalence evidence;
- whether any flakes appeared;
- what failure artifacts are now guaranteed;
- any runner-concurrency/setup-overhead limitation that prevents further useful splitting.

## Success definition
Hard requirements:
- no intentional coverage reduction;
- required authoritative jobs green;
- diagnostics are stronger than before;
- independent work is meaningfully more parallel than before;
- no known new flakiness caused by concurrency.

Speed is a measured outcome, not a brittle fixed gate. A 2x+ wall-clock improvement is desirable, but **do not fake, weaken, or over-shard the system to hit a numeric target**. If improvement is smaller, record the measured bottleneck and stop at the best safe design.

Update `AGENT_TESTING_POLICY.md` if the permanent execution model changed.
Update `AUTONOMY_STATUS.md` with the final architecture, evidence, CI run IDs, and any remaining limitation.

Then stop for user review. Do not merge unless explicitly instructed.

---

# Autonomous execution protocol

When explicitly told to execute this whole plan in one Codex work package:

1. Read `CI_V2_PLAN.md`, `AGENT_TESTING_POLICY.md`, `AUTONOMY_STATUS.md`, and the current workflow/config before editing.
2. Stay on the exact PR/branch named by the initiating prompt. Never create a replacement PR/branch unless explicitly allowed.
3. Work phase-by-phase in order.
4. After each phase, run the cheapest sufficient validation first.
5. Commit/push coherent checkpoints only when useful; avoid tiny ceremonial commits that retrigger expensive CI.
6. Use authoritative GitHub Actions when local browser infrastructure is unavailable.
7. If a phase causes a red CI, inspect the exact first failure and diagnostics; fix/root-cause it before widening the run.
8. Do not blindly rerun unchanged failures.
9. Update `AUTONOMY_STATUS.md` after meaningful phase transitions so a new chat/agent can resume without reconstructing history.
10. Stop immediately if continuing would require weakening a valid test, changing gameplay merely for green, or guessing about a failure that can be inspected.
11. On final green evidence, update the permanent docs/checkpoint and stop for review. Do not merge.

# Short-prompt modes

## One phase at a time
User can say:
`Прочитай CI_V2_PLAN.md. Выполни только Phase N на текущем PR/ветке. После exit criteria обнови AUTONOMY_STATUS.md и остановись. Не merge.`

## Continue from checkpoint
User can say:
`Прочитай CI_V2_PLAN.md и AUTONOMY_STATUS.md. Продолжай с первой незавершённой фазы до её exit criteria. Потом остановись. Не merge.`

## Full autonomous pass
User can say:
`Прочитай CI_V2_PLAN.md, AGENT_TESTING_POLICY.md и AUTONOMY_STATUS.md. Выполни CI v2 целиком по фазам, автоматически переходя дальше только после exit criteria. Следуй adaptive phase rule. Не создавай новый PR/ветку и не merge.`
