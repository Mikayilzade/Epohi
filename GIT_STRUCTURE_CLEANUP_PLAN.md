# Git structure and cleanup plan — 2026-09-24

> Historical audit snapshot. Its proposed actions and PR status are superseded by
> `CODEX_NEXT_TASK.md` and the current top checkpoint in `AUTONOMY_STATUS.md`.
> The old PR stack was subsequently reviewed and closed without merge on
> 2026-09-26; PR #103 remains the sole integration target. Retained here for
> audit evidence, not as a current cleanup task.

This is a **review plan**, not permission to close a PR, delete a branch, change
a PR base, or merge. Current integration target: [PR #103](https://github.com/Mikayilzade/Epohi/pull/103),
`codex-qgq4u5`. At this snapshot GitHub reports it OPEN/Draft at `0049ed8`;
the docs commit was pushed to that existing branch. `main` remains at `e7fd3fc`.

Evidence: `gh pr list --state open --json number,headRefName,baseRefName,isDraft`,
`gh pr view 103 --json headRefOid`, `git ls-remote --heads origin`,
`git merge-base --is-ancestor`, `git rev-list`, `git cherry`, `git worktree list
--porcelain`, and `orca worktree list --json`, checked 2026-09-24. Counts and
open states are a dated snapshot. Recheck remote heads and PR bases immediately
before any future cleanup.

## The short version for Mikayil

| Term | In Epohi |
| --- | --- |
| Repository | The whole Epohi project and its Git history. A future Battle Simulator could be a separate repository after its design is agreed. |
| Commit | A saved change. `0049ed8` saved the docs audit on the current integration branch. |
| Branch | A named line of commits. `main` is the stable line; `codex-qgq4u5` holds the current development line. |
| PR | A GitHub request to review changes from one branch into another. #103 currently proposes `codex-qgq4u5` into `codex/-ci-v2`, **not** directly into `main`. |
| Worktree | Another local folder showing the same repository on another branch. The permanent Orca Lead folder is separate from `C:\Users\User\Documents\Epohi`. |
| Integration branch | `codex-qgq4u5`: the current destination for reviewed work, represented by PR #103. |
| Worker branch | A temporary branch/worktree for one bounded task. It is not a new integration PR. |

Opening a new Codex chat does not require a new branch. A PR can be closed
without merging its code; a branch must not be deleted merely because its PR
was closed, especially if another open PR uses it as its base.

## Open PR map

There are **12 open PRs**. #89 is non-Draft; the other 11 are Draft. The arrow
means the GitHub PR base, not a promise that the base tip is an ancestor of its
head. `Outside #103` counts commits reachable from that PR head but not from
`codex-qgq4u5` at this snapshot.

| PR | Head → base | Outside #103 | Action now |
| --- | --- | ---: | --- |
| [#69](https://github.com/Mikayilzade/Epohi/pull/69) | `prototype/humans-v1` → `main` | 0 | KEEP pending explicit prototype/main decision. |
| [#84](https://github.com/Mikayilzade/Epohi/pull/84) | `codex/coherence-capture-learning-v1` → `prototype/humans-v1` | 0 | KEEP as part of open stack. |
| [#85](https://github.com/Mikayilzade/Epohi/pull/85) | `codex/-codex_stabilization_sprint` → `codex/coherence-capture-learning-v1` | 2 | NEEDS REVIEW: two late commits affect an old temporary CI workflow. |
| [#86](https://github.com/Mikayilzade/Epohi/pull/86) | `codex/-run_240_regression_family_repair` → `codex/-codex_stabilization_sprint` | 5 | NEEDS REVIEW: sibling of #89 with a non-ancestor repair commit. |
| [#89](https://github.com/Mikayilzade/Epohi/pull/89) | `codex/-run_240_regression_family_repair-2mvfa1` → `codex/-codex_stabilization_sprint` | 0 | KEEP until stack disposition is decided. |
| [#90](https://github.com/Mikayilzade/Epohi/pull/90) | `codex/work-on-existing-pr-and-follow-instructions` → `codex/-run_240_regression_family_repair-2mvfa1` | 0 | KEEP; old no-merge instruction and final disposition unresolved. |
| [#91](https://github.com/Mikayilzade/Epohi/pull/91) | `codex-tgmou0` → `codex/work-on-existing-pr-and-follow-instructions` | 0 | KEEP as open stack base. |
| [#93](https://github.com/Mikayilzade/Epohi/pull/93) | `codex/-full-webkit-camera-2.0` → `codex-tgmou0` | 0 | KEEP as open stack base. |
| [#99](https://github.com/Mikayilzade/Epohi/pull/99) | `codex/update-pr-#93-according-to-integration-guidelines` → `codex/-full-webkit-camera-2.0` | 0 | KEEP as open stack base. |
| [#100](https://github.com/Mikayilzade/Epohi/pull/100) | `codex/fix-github-actions-output-issue` → `codex/update-pr-#93-according-to-integration-guidelines` | 0 | KEEP as open stack base. |
| [#102](https://github.com/Mikayilzade/Epohi/pull/102) | `codex/-ci-v2` → `codex/fix-github-actions-output-issue` | 0 | KEEP: it is #103's current base branch. |
| [#103](https://github.com/Mikayilzade/Epohi/pull/103) | `codex-qgq4u5` → `codex/-ci-v2` | 0 | KEEP: only current integration/work PR. |

For #69, #84, #89, #90, #91, #93, #99, #100 and #102, Git confirms each head
is an ancestor of #103. That proves commit reachability, **not** permission to close those PRs,
proof of manual acceptance, or a merge into `main`. `main` remains behind the
prototype and the current stack.

The branch tip for #85 gained commits `3293856` and `e9da24d` after #86/#89
split from it. Thus #85's current tip is **not** an ancestor of #86 or #89,
even though GitHub still names it as their base. Those two commits edit only
`.github/workflows/diplomacy-activity-events-temp.yml`, which is absent from
#103. #86 has five commits outside #103: two old temporary-workflow changes,
two stale task/status updates, and `a701a29` touching outcome/pathing/runtime
tests. Later #103-side commits cover related behavior, but patch identity does
not prove all behavior or test intent is equivalent. Preserve #86 until that
specific comparison is accepted.

[PR #87](https://github.com/Mikayilzade/Epohi/pull/87) and
[#88](https://github.com/Mikayilzade/Epohi/pull/88) are already CLOSED without
merge. [#101](https://github.com/Mikayilzade/Epohi/pull/101) is MERGED into
#100's branch (GitHub `mergedAt` 2026-09-13); the older chat description of
"closed after transfer" remains a recorded conflict in
[PROJECT_DECISION_AUDIT.md](PROJECT_DECISION_AUDIT.md).

## Branch and worktree inventory

GitHub has **60 remote branches** (`git ls-remote --heads origin`): 43 heads are
ancestors of #103 and 17 have commits outside #103. The latter are **not**
automatically unique *content*: `git cherry` finds patch-equivalent commits
for four tips. No remote branch was deleted.

| Remote branch with commits outside #103 | Count | Preserve/review reason |
| --- | ---: | --- |
| `codex/-codex_stabilization_sprint` | 2 | #85 head; old temporary workflow. |
| `codex/-run_240_regression_family_repair` | 5 | #86 head; includes runtime/test repair `a701a29`. |
| `codex/-run_240_regression_family_repair-bgx16a`, `codex/-run_240_regression_family_repair-prh7oc` | 1 each | #87/#88 closed; each tip is patch-equivalent to work in #103, but deletion still needs a branch decision. |
| `fix/player-feedback-ci-stabilization`, `fix/player-feedback-treasury` | 1 each | `git cherry` reports patch-equivalent commits. |
| `docs/project-foundation` | 2 | **Protect:** adds `CURRENT_STATE.md` and `notes/monetization-and-series-ideas.md`, absent from #103. Review these before any branch cleanup or design consolidation. |
| `codex/-pull-request-v1.4.2` | 3 | Earlier worker/resource and smoke changes; content comparison needed. |
| `codex/combat-ai-world-stabilization-v1` | 1 | Historical combat brief; comparison needed. |
| `codex/continue-development-of-combat-ai-milestone` | 5 | Combat/diplomacy fixes; semantic comparison needed. |
| `codex/implement-living-civilizations-in` | 5 | Living-civilizations code; semantic comparison needed. |
| `codex/mobile-review-layout-v2` | 22 | Includes layout work plus add/remove placeholder commits; inspect final content before cleanup. |
| `stabilize/ci180-final`, `stabilize/ci181-final`, `stabilize/ci182-modal-layer`, `stabilize/combat-world-ci179`, `stabilize/living-ci-final` | 2, 3, 2, 2, 4 | Old stabilization branches with non-ancestor fixes/tests/cache commits; compare final behavior before deletion. |

The other **43 ancestor branch names** are recorded here to make the inventory
complete. This group includes `main`, #103, and nine other open-PR heads, so
ancestry alone is not a deletion list:

<details><summary>43 remote heads already reachable from #103</summary>

```text
codex-5f8unm  codex-91i8uk  codex-9iqgxo  codex-jvxgl6
codex-mupwvc  codex-p5r9w8  codex-qbdnke  codex-qgq4u5  codex-tgmou0
codex/-1.4.1  codex/-ci-v2  codex/-codex_test_selection_phase1_review_fixes
codex/-full-webkit-camera-2.0  codex/-phase2-ci-integration
codex/-phase2-placeholder-avoid  codex/-playwright
codex/-playwright-workflow-main  codex/-pr-#93  codex/-pr-#93-0tlimy
codex/-run_240_regression_family_repair-2mvfa1  codex/-tmp-do-not-use
codex/-v1.3  codex/coherence-capture-learning-v1
codex/context-review-cleanup-v1  codex/continue-task-from-codex_next_task
codex/diplomacy-activity-events-v3  codex/fix-four-bugs-for-v1.4.2-alpha
codex/fix-github-actions-output-issue
codex/fix-playwright-smoke-test-for-campaign-loading
codex/investigate-ci-failures-on-webkit-tests
codex/investigate-ci-test-failures-in-pr-#100  codex/population-workforce-v1
codex/update-pr-#93-according-to-integration-guidelines
codex/work-on-existing-pr-and-follow-instructions  main
prototype/humans-v1  prototype/humans-v1-backup-before-journey
prototype/humans-v1-checkpoint  prototype/humans-v1-do-not-use
prototype/humans-v1-staging-journey  prototype/humans-v1-staging-safe
prototype/humans-v1-working-copy  scratch/pathing-local-check
```

</details>

Local branches/worktrees at the snapshot:

| Worktree | Branch / head | Cleanup state |
| --- | --- | --- |
| `C:\Users\User\Documents\Epohi` | `codex-qgq4u5` / `0049ed8`, clean | KEEP integration checkout. |
| `C:\Users\User\orca\workspaces\Epohi\epohi-lead` | `orca/epohi-lead` / `175b8ec` before this plan, clean | KEEP permanent Lead. Its docs commit is patch-equivalent to `0049ed8`, with a different SHA because of cherry-pick. |
| `C:\Users\User\orca\workspaces\Epohi\setup-orca-harness` | `orca/setup-orca-harness` / `f09c820`, plus untracked `ORCA_REVIEW.txt` | **DO NOT REMOVE now.** Harness patch is equivalent to later `2c6b2a1`, but the untracked review artifact has not been preserved or discarded by user decision. |

There is also a local `main` branch at the same `e7fd3fc` as `origin/main`;
it has no separate worktree.

## Cleanup actions

| Category | Concrete item and evidence | Safe next condition |
| --- | --- | --- |
| KEEP | `main`, PR #103 / `codex-qgq4u5`, integration checkout, permanent `orca/epohi-lead`. | Keep current work target and stable history distinct. |
| KEEP | Every branch used as the base of an open child PR, especially `codex/-ci-v2` (#102 → #103). | Do not delete or retarget while its child PR remains open without a reviewed migration plan. |
| CLOSE | **None immediately.** #69/#90/#102 and the intervening open PRs are candidates for a later deliberate stack disposition, not automatically obsolete. | User chooses the route to `main` and confirms which historical review records to retain. |
| DELETE AFTER CLOSE | Closed #87/#88 branch tips and obvious duplicate aliases (six `prototype/humans-v1-*` refs at `cbe6256`, four selector aliases at `ddf6e7c`), plus other ancestor-only non-PR refs. | First verify current remote SHA, no open PR base/head use, no protected/backup intent, and explicit deletion approval. Do not delete here. |
| ARCHIVE/HISTORICAL | Closed #87/#88 and merged #101 PR records; old task/checkpoint docs. | Keep their GitHub/Git history as evidence. |
| NEEDS USER DECISION | Final disposition of #69, #90, #102 and the wider open stack; whether/how #103 should eventually be reviewed against `main`. | No recovered final merge/close instruction. Current #103 is based on #102, not `main`. |
| NEEDS REVIEW | #85/#86 divergence, 17 non-ancestor remote heads (especially `docs/project-foundation`), and `ORCA_REVIEW.txt` in setup worktree. | Prove content preservation before branch/worktree cleanup. |

## Recommended future workflow

1. Keep `main` as the stable history until user testing and an explicit
   integration decision. Continue present work only in PR #103.
2. Keep one permanent Orca Lead worktree. For a bounded task, use a temporary
   child worktree only when isolation helps; use Luna for inventory and Sol for
   judgment. A worker does not open a new long-lived PR by default.
3. Review each child result; transfer its complete intended change into the
   existing integration branch with a normal commit or cherry-pick. Verify the
   resulting SHA, changed files and clean status. Then remove that child only
   after its task is done, changes are integrated or intentionally discarded,
   and no unique/untracked material remains.
4. Keep the existing PR stack and all required base branches until the user
   chooses a consolidation route. A later cleanup can close historical PRs and
   delete unneeded refs in a separate, reviewed operation. Never force-push or
   silently retarget #103 to make the graph look simpler.
5. Treat Battle Simulator as a separate repository only after its design and
   repository choice are decided; the design inbox is not that decision.

**Next decision:** after reviewing this map, choose how the historical PR stack
should relate to `main` and which old Draft PRs to close. The audit recommends
no PR closures, branch deletions, worktree removals, base changes, or merges now.
