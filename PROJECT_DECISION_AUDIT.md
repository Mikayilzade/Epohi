# Project decision and evidence index

Snapshot: 2026-09-23, local `orca/epohi-lead` at `2c6b2a1` (the same commit as
`origin/codex-qgq4u5`, the head of open PR #103). This audit distinguishes
repository/Git/GitHub evidence from historical **CHAT EVIDENCE supplied by
the user on 2026-09-23**. The old chat transcripts themselves were not available
to this repo-side audit. Commit `a29d33e` preserved the exact M01–M15 mapping
in a repository document that explicitly cites Mikayil's messages/screenshots;
that is chat-derived evidence preserved in Git. Preserve both accounts when
they disagree; see the PR #101 discrepancy below.

## How to use this index

- **Current task and branch:** [CODEX_NEXT_TASK.md](CODEX_NEXT_TASK.md), then the
  top checkpoint in [AUTONOMY_STATUS.md](AUTONOMY_STATUS.md). The current integration
  target is PR #103 / `codex-qgq4u5`; this Orca worktree is a local execution
  branch, not a replacement PR.
- **Agent and worker rules:** [AGENTS.md](AGENTS.md) and [ORCA_HARNESS.md](ORCA_HARNESS.md).
- **Testing and release rules:** [AGENT_TESTING_POLICY.md](AGENT_TESTING_POLICY.md)
  and [QUALITY_GATES.md](QUALITY_GATES.md). PC/desktop Chromium is the current
  development target; mobile-specific failures are deferred for ordinary PC work
  unless they show shared or desktop impact.
- **Product intent:** [PROTOTYPE_HUMANS.md](PROTOTYPE_HUMANS.md). This index records
  the evidence-backed status of its significant ideas. Source code and tests
  establish implementation; a historical checklist alone does not.
- **Unreviewed design inbox:** [DESIGN_INBOX_2026-09-23.md](DESIGN_INBOX_2026-09-23.md)
  records new ideas and questions. It is not canonical accepted design; an item
  becomes canonical only after a separate user decision.
- **Historical context:** [PROJECT_HANDOFF.md](PROJECT_HANDOFF.md), dated checklists,
  task briefs, and the archive below. Their old branch, PR, CI, and TODO language
  does not override the current sources above.

`IDEA` means proposed without a proven acceptance decision. `ACCEPTED` means a
documented direction or rule, not proof of delivery. `REJECTED` means a recorded
decision against an approach. `IMPLEMENTED` requires current code or test evidence.
`PARTIAL` means a narrower implementation exists than the stated outcome.
`DEFERRED` means explicitly postponed. `SUPERSEDED` means later policy or code
replaced a prior statement. `UNCLEAR`/`UNVERIFIED` means the available evidence
does not settle the claim. A code path or automated test does not prove that a
long real-device playthrough passed.

## Document map

The 29 tracked Markdown files at this snapshot are listed here. “Historical”
describes their role for the present PR, not whether an old PR is still open.

| Document | Purpose and decision categories | Use now |
| --- | --- | --- |
| [AGENTS.md](AGENTS.md) | Agent entry, target verification, branch safety, test scope | Current canonical process |
| [.github/codex/README.md](.github/codex/README.md) | Old one-task/one-new-Draft-PR automation protocol | Historical queue workflow; current target rules override it |
| [.github/codex/prompt-next-task.md](.github/codex/prompt-next-task.md) | Old prompt to branch from `main` and create a Draft PR | Historical task launcher; do not use for PR #103 |
| [.github/codex/task-queue.md](.github/codex/task-queue.md) | Eleven checked refactor/UX/camera queue tasks | Historical completed queue; not a current backlog |
| [ORCA_HARNESS.md](ORCA_HARNESS.md) | Orca worker branch, model, checkpoint and handoff rules | Current canonical worker process |
| [AUTONOMY_START_HERE.md](AUTONOMY_START_HERE.md) | Conditional autonomous continuation guide | Current pointer; defers to entry/task/status and the worker harness |
| [CODEX_NEXT_TASK.md](CODEX_NEXT_TASK.md) | Integration target and current next action | Current task pointer |
| [AUTONOMY_STATUS.md](AUTONOMY_STATUS.md) | Latest PR, CI and work checkpoint above `---` | Current status pointer; older material historical |
| [AGENT_TESTING_POLICY.md](AGENT_TESTING_POLICY.md) | Risk tiers, PC-first testing, mobile deferral, CI use | Current canonical testing policy |
| [QUALITY_GATES.md](QUALITY_GATES.md) | Release and platform gates, save/performance/soak | Current gate requirements; see coverage gap below |
| [PROJECT_HANDOFF.md](PROJECT_HANDOFF.md) | Product identity, architecture, past feedback and next-step proposals | Mixed-age historical handoff; old PR #69 instructions are not current for this task |
| [PROTOTYPE_HUMANS.md](PROTOTYPE_HUMANS.md) | Humans v1 scope, systems, autonomy, outcomes and non-goals | Canonical product intent; implementation checked below |
| [MANUAL_SMOKE_2026-09-08.md](MANUAL_SMOKE_2026-09-08.md) | Exact M01–M15 mapping of chat messages/screenshots, preserved by commit `a29d33e` | Authoritative historical chat-derived mapping; current device outcome unverified |
| [REPAIR_STAGES.md](REPAIR_STAGES.md) | Staged M01–M15 repair plan | Historical TODO plan; reconcile with later code before reusing |
| [GRAPHICS_REWORK_CHECKLIST.md](GRAPHICS_REWORK_CHECKLIST.md) | Illustrated map, markers, open-map mode and visuals | Historical checked implementation record; device/performance outcome unverified |
| [MOVEMENT_PERFORMANCE_CHECKLIST.md](MOVEMENT_PERFORMANCE_CHECKLIST.md) | Routes, worker controls and performance acceptance | Historical checked block; current behavior needs code/test evidence |
| [STRATEGY_UX_CHECKLIST.md](STRATEGY_UX_CHECKLIST.md) | Map/zoom, identity, diplomacy and readiness UX | Historical checked block; current behavior needs code/test evidence |
| [CI_V2_PLAN.md](CI_V2_PLAN.md) | CI diagnostics, shards, soak seeds, worker experiment | Historical phase plan; implementation and measured result are separate |
| [TEST_SUITE_INVENTORY.md](TEST_SUITE_INVENTORY.md) | Test ownership/count at pinned commit `75c6101` | Historical snapshot; do not reuse its exact counts as current |
| [TEST_SELECTION_MATRIX.md](TEST_SELECTION_MATRIX.md) | Change-to-suite and escalation design | Design reference; selector/workflow are runtime truth |
| [CODEX_TEST_SUITE_INVENTORY_TASK.md](CODEX_TEST_SUITE_INVENTORY_TASK.md) | Old suite-inventory assignment | Historical task, not a current TODO |
| [CODEX_TEST_SELECTION_IMPLEMENTATION_TASK.md](CODEX_TEST_SELECTION_IMPLEMENTATION_TASK.md) | Old selector implementation brief | Historical task, not a current TODO |
| [CODEX_TEST_SELECTION_PHASE1_REVIEW_FIXES.md](CODEX_TEST_SELECTION_PHASE1_REVIEW_FIXES.md) | Old semantic ownership/review constraints | Historical decision rationale |
| [CODEX_TEST_SELECTION_PHASE1_FINAL_PRECI_GAPS.md](CODEX_TEST_SELECTION_PHASE1_FINAL_PRECI_GAPS.md) | Old selector hardening gaps | Historical task; recheck code before reopening |
| [CODEX_TEST_SELECTION_PHASE2_CI_INTEGRATION.md](CODEX_TEST_SELECTION_PHASE2_CI_INTEGRATION.md) | Old workflow/range/fail-safe integration plan | Historical task; compare current workflow |
| [CODEX_STABILIZATION_SPRINT.md](CODEX_STABILIZATION_SPRINT.md) | PR #84 mobile/CI stabilization runbook | Historical; old RC and mobile gates do not set current PC work |
| [CODEX_TASK_COMBAT_AI_WORLD_STABILITY.md](CODEX_TASK_COMBAT_AI_WORLD_STABILITY.md) | PR #69 combat/AI/world milestone A–K | Historical implementation record; acceptance not proven by checkboxes |
| [RUNTIME_OBSERVER_MAP.md](RUNTIME_OBSERVER_MAP.md) | Observer ownership and old run #152 diagnosis | Historical technical evidence; old “NEXT VALIDATION” is not current |
| [docs/archive/AUTONOMY_STATUS_through_2026-09-06.md](docs/archive/AUTONOMY_STATUS_through_2026-09-06.md) | Archived PR/CI checkpoints | Historical only |

## Significant decisions and implementation status

Each row records the narrow conclusion supported by the cited repository or
GitHub evidence. A later code change or device result should update this one
register row, rather than adding another competing “current” status elsewhere.

| ID | Decision or claim | Status and evidence |
| --- | --- | --- |
| D01 | Continue on PR #103 / `codex-qgq4u5` | **ACCEPTED current target.** [Task](CODEX_NEXT_TASK.md); [PR #103](https://github.com/Mikayilzade/Epohi/pull/103) is open at `2c6b2a1`, based on `codex/-ci-v2` at audit time. No merge or new PR authorized. |
| D02 | Develop and manually playtest on PC/desktop Chromium | **ACCEPTED policy.** Commit `99ad7ef`, [testing policy](AGENT_TESTING_POLICY.md), [gates](QUALITY_GATES.md); user-supplied CHAT EVIDENCE confirms the 2026-09-23 decision. Desktop automation remains a gap in D23. |
| D03 | Defer mobile as an ordinary PC-work blocker but preserve mobile code/tests | **DEFERRED platform work / ACCEPTED rule.** Commit `99ad7ef`; [testing policy](AGENT_TESTING_POLICY.md). A shared or desktop regression still matters. |
| D04 | Audit performance before a large graphics/assets rewrite | **ACCEPTED prerequisite; audit UNVERIFIED.** [Gates](QUALITY_GATES.md) and user-supplied CHAT EVIDENCE agree on the rule; the chat evidence does not confirm that the audit was completed. |
| D05 | Deliver the finite Humans tribe-to-state prototype and alternate viable strategies | **PARTIAL.** Technologies, cities, rivals and outcomes exist in `src/app.js`, `src/data.js`, `src/humans-outcomes.js` and `tests/prototype-baseline.spec.js`; the proposed 60–180 minute/strategy experience in [prototype spec](PROTOTYPE_HUMANS.md) lacks campaign evidence here. |
| D06 | Weighted terrain movement | **IMPLEMENTED; old “all land costs one” statement SUPERSEDED.** `src/data.js:5-11`, `src/humans-pathing-core.js:133-178`, commit `e41c641`. [Handoff](PROJECT_HANDOFF.md) section 9 contradicts its own section 13 and current code. |
| D07 | Scout movement values and truthful movement UI | **IMPLEMENTED values, UX UNVERIFIED.** `src/data.js:84-99` gives scout 2 moves and warrior 1; `src/app.js:997,1177-1182` shows/uses terrain costs. Both baseline sight radii are 1; do not claim a larger scout radius. |
| D08 | Statehood/military victory, recoverable defeat and free play after victory | **IMPLEMENTED in code/tests.** `src/humans-outcomes.js:205-281,327-401,484-532`; `tests/humans-outcomes.spec.js:257-353`; repair commit `9bee0a9`. Long playthrough and post-save device behavior remain unverified. |
| D09 | Open-map test mode and saved choice | **IMPLEMENTED in code/tests.** `src/humans-observer.js:49-100`, `tests/humans-art-observer.spec.js:169-194`, commit `14697f6`; the original M02/M03 device experience was not rerun here. |
| D10 | Rival identities, diplomacy v2, proposals and allied action | **ACCEPTED historically; IMPLEMENTED core / PARTIAL strategic depth.** CHAT EVIDENCE says diplomacy already belonged to the game; current code in `src/humans-strategy-ux.js:150-166,232-301`, `src/humans-living-civilizations.js:64-171` and `tests/living-civilizations.spec.js` supplies separate implementation evidence. Full planner depth remains a [handoff](PROJECT_HANDOFF.md) limitation. |
| D11 | First autonomous scout/guard/worker orders and reports | **IMPLEMENTED.** `src/humans-autonomy.js:53-85,251-281,336-391,487-576`, `tests/humans-autonomy.spec.js`. |
| D12 | Deeper conditional autonomy, intelligence/intuition, army assembly and richer order reports | **IDEA / UNCLEAR final scope.** The [prototype spec](PROTOTYPE_HUMANS.md), [handoff](PROJECT_HANDOFF.md) and CHAT EVIDENCE propose these; D11 proves only the first order layer. No final acceptance or complete Autonomy v2 delivery is established here. |
| D13 | Later eras, rulers/other races, multiplayer or monetization | **IDEA / DEFERRED or UNCLEAR.** [Prototype non-goals](PROTOTYPE_HUMANS.md) defer some scope; no current approval or implementation was established for the rest. Confirm priority in chat before scheduling. |
| D14 | Illustrated map/units/POIs/improvements | **IMPLEMENTED as SVG/CSS assets; physical stability UNVERIFIED.** `src/humans-visuals.js:26-35,156-157,209-210,272-285`, `styles/humans-art.css`, `tests/humans-art-observer.spec.js:127-161`, commit `14697f6`. Historical checked graphics items do not close M01. |
| D15 | Trade routes, treasury and player-feedback package | **IMPLEMENTED feature code; balance PARTIAL.** `src/humans-player-feedback.js:116-230,509-674`, `tests/player-feedback-treasury.spec.js`; [handoff](PROJECT_HANDOFF.md) asks for further campaign balance evidence. |
| D16 | Save/offline support and migrations | **PARTIAL as release claim.** `src/storage.js`, `src/save-utils.js`, `sw.js` and save tests provide implementation; this audit did not run migration/device/RC gates. |
| D17 | Combat/AI/world milestone A–K | **IMPLEMENTED mostly at code level; full play acceptance UNVERIFIED.** `src/humans-combat-world-stability.js`, `src/humans-pathing-core.js`, `src/humans-player-feedback.js`, `tests/combat-world-stability.spec.js`; commit `e41c641` and later PR #74 fixes. [Milestone brief](CODEX_TASK_COMBAT_AI_WORLD_STABILITY.md) is historical, not a fresh task. |
| D18 | Semantic test selection and escalation | **IMPLEMENTED.** `scripts/select-tests.js`, `scripts/test-selection-manifest.json`, `scripts/map-ci-test-plan.js`, `tests/test-selection.contract.test.js`, `.github/workflows/playwright.yml`; commits `1d549eb`, `90f6d94`. The old task files are SUPERSEDED as assignments. |
| D19 | CI v2 diagnostics, browser shards and deterministic soak seeds | **IMPLEMENTED configuration.** `.github/workflows/playwright.yml`, `scripts/failure-diagnostics-reporter.js`, commit `983ff69`. Comparable speed improvement and complete green final gate are **UNVERIFIED** in this audit. |
| D20 | Increase CI workers to 2+ | **DEFERRED experiment.** [CI plan](CI_V2_PLAN.md) records a controlled experiment rather than a proven speed gain. |
| D21 | Global observer quarantine | **REJECTED / SUPERSEDED** by local ownership and bridge work. [Observer map](RUNTIME_OBSERVER_MAP.md), `src/humans-performance.js`, `tests/runtime-invalidation.spec.js`, commit `d08b3ff`. Old run #152 validation instructions are historical. |
| D22 | Physical iPhone test for a mobile release | **DEFERRED for ordinary PC work; retained mobile gate.** [Quality gates](QUALITY_GATES.md). Do not describe Playwright emulation as device proof. |
| D23 | Automated desktop Chromium coverage for the PC-first target | **PARTIAL policy / UNVERIFIED execution.** [Gates](QUALITY_GATES.md) require it, but `playwright.config.js:20-35` defines only `chromium-mobile` and `webkit-mobile`; `.github/workflows/playwright.yml` calls those projects. A green mobile-emulated Chromium job is not desktop proof. |
| D24 | Current CI/browser state of PR #103 | **KNOWN evidence, not a fresh gate.** [Run 35863161549](https://github.com/Mikayilzade/Epohi/actions/runs/35863161549) at `2c6b2a1` passed classifier only; browser jobs were skipped for docs-only changes. [Run 35634045850](https://github.com/Mikayilzade/Epohi/actions/runs/35634045850) remains the latest focused browser run and failed two WebKit-mobile camera tests. Neither validates desktop Chromium. |
| D25 | Old PR #69/#74/#84/#90 guidance as the current work stream | **SUPERSEDED for this task.** Current target is D01; [handoff](PROJECT_HANDOFF.md), [repair plan](REPAIR_STAGES.md) and [sprint](CODEX_STABILIZATION_SPRINT.md) retain historical instructions. PR #69 and #90 were still open when checked; their future integration role is UNCLEAR, not assumed closed. |
| D26 | Old Codex queue: one task, new branch and Draft PR from `main` | **SUPERSEDED as an instruction for this task.** `.github/codex/task-queue.md` has eleven checked items and no unchecked item; selectors/economy/territory/progression modules and `src/camera.js:137` show representative code delivery. Individual acceptance was not re-tested. [AGENTS.md](AGENTS.md) and D01 prohibit starting a replacement PR for the current work. |
| D27 | Equal start: player and each AI civilization begin with warrior and scout | **ACCEPTED in CHAT EVIDENCE; IMPLEMENTED as spawn logic in repo.** `src/app.js:397-413,1555` calls the same `placeStartingUnits` helper for player and rivals; the helper skips a unit if no valid starting spot exists. This does not establish equal long-term AI strength. |
| D28 | Difficulty and barbarian toggle | **Earlier CHAT EVIDENCE: DEFERRED. Later repo: barbarian toggle IMPLEMENTED, difficulty still UNCLEAR.** `src/app.js:1832-1835` offers low/normal/high/off barbarian activity and passes it to `createNewGame`; `tests/living-world.spec.js` and `tests/barbarian-review-fixes.spec.js` cover it. Do not carry the old deferral forward as the current barbarian status. |
| D29 | Turn-based map strategy and living-world identity instead of a card/event/Reigns-style replacement | **ACCEPTED identity / REJECTED replacement in CHAT EVIDENCE.** Current `src/app.js`, `src/humans-living-civilizations.js` and [prototype spec](PROTOTYPE_HUMANS.md) support the map/city/unit/AI direction; the rejection itself rests on chat evidence, not a repo artifact. |
| D30 | Inventory, hunting/food/trade details and a wider military roster | **IDEA / UNCLEAR final scope in CHAT EVIDENCE.** Money, food economy and trade have narrower current code evidence (D05, D15); that does not prove acceptance or delivery of an inventory, hunting loop or the proposed roster. |
| D31 | Extreme detailed zoom and richer tile presentation | **IDEA / PARTIAL underlying camera work.** CHAT EVIDENCE proposes the richer presentation; `src/camera.js:137-190` and the checked Camera 2.0 queue item show zoom controls, not proof of the proposed final detail level. |
| D32 | Early cautious Orca adoption: read-only first, one worktree/task, review before integration | **SUPERSEDED as operating procedure.** This is user-supplied CHAT EVIDENCE about the early-September plan; [ORCA_HARNESS.md](ORCA_HARNESS.md) and [AGENTS.md](AGENTS.md) now govern workers, context cost, review and merge safety. Retain the early plan as history, not a second canonical harness. |
| D33 | Deeper terrain and movement systems beyond the current weighted costs | **IDEA / UNCLEAR final scope in CHAT EVIDENCE.** D06 proves a later weighted-cost implementation; it does not establish acceptance or delivery of every proposed terrain and movement detail. |

## September 8 manual observations (M01–M15)

[The dated report](MANUAL_SMOKE_2026-09-08.md), added by commit `a29d33e`,
explicitly names Mikayil's chat messages/screenshots as its source and gives
the complete M01–M15 numbering. Use that mapping as authoritative preserved
chat-derived evidence for the reported iPhone playtest; the document itself
notes that the actually loaded JS/cache was not verified. The [repair plan](REPAIR_STAGES.md)
still says TODO in every stage; commit `9bee0a9` and other later code cover
several scenarios. The columns below separate implementation from a fresh
device outcome. Neither the supplied chat summary nor this audit establishes
a complete post-`9bee0a9` manual/device retest.

| ID | Current repository conclusion | Remaining evidence |
| --- | --- | --- |
| M01 | **UNVERIFIED** late-session missing icons/black warrior tiles; sprite code/test exists (D14). | CHAT EVIDENCE confirms black tiles could refresh after “выбор воинов” and icons could disappear with UI lag. Reproduce or confirm fixed on the intended build/device. |
| M02 | **IMPLEMENTED in code/tests** open-current-map path (D09). | Actual save/continue result on device UNVERIFIED. |
| M03 | **IMPLEMENTED in code/tests** new-game open-map choice (D09). | Current UI discoverability on device UNVERIFIED. |
| M04 | **PARTIAL:** mobile panel scroll CSS in `styles/humans-runtime.css:209-249`; `tests/resource-worker.spec.js:35-46`. | Physical touch/scroll result UNVERIFIED; mobile is deferred for ordinary PC work. |
| M05 | **IMPLEMENTED values** for scout/warrior (D07). | User comprehension of the UI UNVERIFIED. |
| M06 | **PARTIAL:** selection paths in `src/app.js:963-997`, `src/humans-player-feedback-stabilization.js:204-228`; `tests/combat-world-stability.spec.js:183-196`. | Screenshot does not prove a selection bug; current visual clarity UNVERIFIED. |
| M07 | **IMPLEMENTED entry path:** `src/humans-population-workforce.js:262-282,413-418`, `src/humans-journey-core.js:331-346`. | CHAT EVIDENCE says specialization was found through Goals but availability remained uncertain; current discoverability and no duplicate bonus on device UNVERIFIED. |
| M08 | **IMPLEMENTED worker-time/progress code:** `src/humans-worker-learning.js:264-311,365-415`, `tests/resource-worker.spec.js:35-77`. | Full turn-by-turn and save/load experience UNVERIFIED. |
| M09 | **IMPLEMENTED terminology/mechanics code** in the M08 paths. | User comprehension of “turn”, movement and worker action UNVERIFIED. |
| M10 | **IMPLEMENTED progress code** in the M08 paths. | Visibility and persistence in a full campaign UNVERIFIED. |
| M11 | **PARTIAL:** fog-route repair in `src/humans-pathing-core.js:119-178`, `tests/humans-pathing-performance.spec.js:55-87`. | No fresh 10-turn real-world no-stall result. |
| M12 | **PARTIAL:** allied traversal logic/test in the M11 paths. | Full stack-limit/route experience UNVERIFIED. |
| M13 | **PARTIAL:** stack-selection code/test in the M06 paths; CHAT EVIDENCE says warrior/worker switching on one tile worked. | CHAT EVIDENCE records an intended four-unit tile limit, but the screenshot does not prove a limit and this audit did not verify current capacity in code/device behavior. |
| M14 | **IMPLEMENTED in code/tests** durable free play and deduplicated actions (D08). | Post-victory save/load and physical-device retest UNVERIFIED. |
| M15 | **ACCEPTED preference** to preserve liked hiring/specialization/economy details. | Balance calculations and multi-campaign approval UNVERIFIED; avoid speculative rebalance. |

### CHAT EVIDENCE on the September 8 playtest

The user-supplied historical account also confirms: Create Game lacked an
open-map option; the fog-of-war action warned, returned to the menu and prevented
continuation; worker build/repair turn-versus-action semantics, price timing and
progress were unclear; a progress bar was requested; a scout order toward fog
could remain stuck for roughly ten turns; allied units were intended to be
traversable when capacity allows, while enemy/neutral units should block normal
routes; victory could be continued once but later actions reopened and duplicated
the modal. Hiring details were useful. These statements describe the old tested
build, not the current head.

The supplied CHAT EVIDENCE says commit `9bee0a9` added worker-command scrolling,
progress/work-unit visibility and clearer action units. Complete browser and
manual validation of all M01–M15 immediately after that commit was **not
confirmed**. A later ChatGPT-side historical audit reported green focused
Chromium/WebKit and full Chromium/WebKit browser validation on PR #90; the
supplied summary did not name exact run IDs. That is automated browser evidence
at its own PR/SHA, **not** a manual/device retest and not a current PR #103 PC
desktop gate. Keep the code-level statuses above separate from device acceptance.

## PR continuation history: chat account and GitHub state

The historical sequence below comes from the user-supplied CHAT EVIDENCE.
GitHub state was checked separately on 2026-09-23; an open PR is not a decision
to merge it. PR #103 remains the current work target.

| PR | CHAT EVIDENCE | GitHub evidence / unresolved point |
| --- | --- | --- |
| [#69](https://github.com/Mikayilzade/Epohi/pull/69) | Keep Draft on `prototype/humans-v1`; do not merge into `main` before explicit user testing/decision. | Still OPEN/Draft/unmerged. No final merge/close/supersession decision was recovered. |
| [#87](https://github.com/Mikayilzade/Epohi/pull/87), [#88](https://github.com/Mikayilzade/Epohi/pull/88) | Duplicate clones, closed without merge; #89 became the continuation. | Both CLOSED with no `mergedAt`; consistent with chat. |
| [#89](https://github.com/Mikayilzade/Epohi/pull/89) | Authoritative continuation after duplicate cleanup. | Still OPEN. “Authoritative” describes that historical phase, not the current PR #103 target. |
| [#90](https://github.com/Mikayilzade/Epohi/pull/90) | Continue in existing PR, not back in #89; no merge without explicit user decision. Later stabilization/Gate-G work and reported green browser validation. | Still OPEN/Draft/unmerged; final disposition unresolved. Browser green is not manual/device acceptance. |
| [#93](https://github.com/Mikayilzade/Epohi/pull/93) | Historical authority for later WebKit/camera repair; accidental child PRs were cleaned after useful work returned. | Still OPEN/Draft; this history does not replace PR #103. |
| [#100](https://github.com/Mikayilzade/Epohi/pull/100), [#101](https://github.com/Mikayilzade/Epohi/pull/101) | Says accidental #101 was closed after useful work was transferred to #100. | **CHAT↔GITHUB state discrepancy:** GitHub reports #101 **MERGED** on 2026-09-13, while #100 is OPEN/Draft. “Closed” might have been generic wording; whether it meant closed without merge and the exact transfer sequence remain unresolved. Preserve both accounts. |
| [#102](https://github.com/Mikayilzade/Epohi/pull/102), [#103](https://github.com/Mikayilzade/Epohi/pull/103) | At #102, do not create another replacement PR/branch or merge; later work continued in child PR #103. | Both OPEN/Draft/unmerged; #103 targets the #102 branch and is this task's explicit work target. Final disposition of #102 is unresolved. |

## Gaps and contradictions to prevent repeated work

1. [PROJECT_HANDOFF.md](PROJECT_HANDOFF.md) labels PR #69 and `prototype/humans-v1`
   as “current”, mandates every-commit full/mobile checks, and calls weighted
   movement absent. D01, D02 and D06 supersede those instructions for this task.
   Keep that handoff as a dated history source.
2. [REPAIR_STAGES.md](REPAIR_STAGES.md) remains all TODO after repair commit
   `9bee0a9`. Use the M01–M15 matrix above; do not reopen every item or mark
   every device observation fixed merely from code.
3. The PC-first policy has no desktop Playwright project at the audited SHA
   (D23). A docs-only green workflow is a scope-classification result, not a
   desktop or browser regression pass (D24).
4. [QUALITY_GATES.md](QUALITY_GATES.md) previously mixed deferred mobile gates
   with “all gates above green” and an old PR #84 RC reference. Apply only the
   gates for the release target and identify the actual PR/SHA before RC claims.
5. [CI_V2_PLAN.md](CI_V2_PLAN.md) calls its architecture implemented, while its
   speed target still needs comparable measured runs (D19). Test counts in
   [TEST_SUITE_INVENTORY.md](TEST_SUITE_INVENTORY.md) are pinned to an older SHA.
6. [RUNTIME_OBSERVER_MAP.md](RUNTIME_OBSERVER_MAP.md) has an old “NEXT VALIDATION”
   for run #152; later observer code/tests exist (D21), but fresh runtime health
   was not measured in this docs-only audit.
7. The long-term Autonomy v2/eras/other-races proposals in product/handoff docs
   lack a current accepted schedule. The next direction after review remains
   PC-first development, with feature priority to be chosen from evidence.
8. The hidden `.github/codex/` queue documents still instruct a new branch and
   Draft PR from `main`, but all eleven queue entries are checked and the
   current target is PR #103. Do not reactivate that queue by treating its
   historical launcher as the current next task.
9. Early CHAT EVIDENCE described cautious Orca adoption (read-only first,
   one worktree/task, review before integration, no merge and low context cost).
   [ORCA_HARNESS.md](ORCA_HARNESS.md) now supersedes that plan as worker policy;
   do not maintain both as concurrent instructions.
10. CHAT EVIDENCE describes PR #101 as closed after transfer; GitHub says
    MERGED. The PR table preserves the state discrepancy and possible wording
    ambiguity. Do not infer the transfer sequence from either account alone.

## CHAT_EVIDENCE_NEEDED

**None from the historical material audited here.** The exact M01–M15 mapping
is preserved in commit `a29d33e`. The ChatGPT-side audit found no preserved
complete manual/device retest after `9bee0a9` and no final user disposition
decision for old open PR #69/#90/#102. These are live validation and decision
gaps below, not claims that a missing old chat is known to contain an answer.

## Open decision and validation gaps

1. **User integration/cleanup decision needed:** PR #69/#90/#102 remain
   open, Draft and unmerged. Their interim no-merge/continue-in-place rules
   remain; do not infer a final close, merge or supersession instruction.
2. **Manual/device evidence needed:** M01–M15 have no recovered complete
   post-`9bee0a9` device retest. Later green PR #90 browser runs do not close
   this gap. Keep per-item device outcomes UNVERIFIED until an explicit later
   device result is found or performed.
3. **PR #101 history discrepancy:** chat describes cleanup/closure after work
   moved to #100; GitHub records #101 as merged. Preserve both until the
   transfer sequence is independently resolved.
4. **Performance audit:** no supplied chat or repo evidence confirms completion
   of the separate audit required before a major graphics/assets rewrite.

## Next action

Review this docs-only audit diff, including the PR #101 evidence conflict. Then
choose one concrete PC-first development item and add a desktop Chromium validation
path before calling a PC release gate satisfied. Keep existing mobile code/tests;
do not merge PR #103 without explicit approval.
