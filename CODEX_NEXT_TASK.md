# CODEX NEXT TASK

## Scope
Work only on existing PR #93 / remote branch `codex/-full-webkit-camera-2.0` unless the user explicitly assigns a new scope. Do not create another PR/branch and do not merge.

## Current checkpoint
- Camera 2.0 WebKit race fix is verified green at `8ae1ae9da6685218ae5dcd9e99deac151cd03df0` in authoritative PR #93 Actions run #210.
- No game/runtime behavior changed after that verified fix; subsequent commits are CI-policy / agent-process work.
- Intermediate CI-policy runs #219/#220 are not the final policy state. Do not rerun them before checking the newest finalized policy run.
- Duplicate PR #94 is closed; PR #93 remains open/draft/unmerged.

## Permanent testing policy
Read `AGENT_TESTING_POLICY.md` whenever choosing test scope. Testing is risk-based, not “every commit = full suite”.

- Tier 0 — docs/checkpoint/instruction only: no heavy Playwright.
- Tier 1 — truly trivial isolated runtime edit: static/minimal focused only when useful. This is a semantic judgment; CI does not infer Tier 1 from filename alone.
- Tier 2 — localized feature/mechanic/UI/test change: static + directly relevant focused test(s). Chromium by default; add WebKit when browser/layout/input sensitive.
- Tier 3 — shared/high-risk or broad runtime change: static + full Chromium/WebKit; add relevant soak only for stability-sensitive areas.
- Tier 4 — final integration/merge/release/manual final gate: full Chromium/WebKit + required soak.
- Reuse valid green results for an unchanged SHA. Never rerun the entire expensive suite merely to “try again”.

## CI implementation
The permanent workflow is designed to enforce the above conservatively:

1. PR `synchronize` events classify only the newly pushed range. A docs-only status commit must not inherit older code changes from the PR.
2. New/reopened/ready PRs classify the whole PR range.
3. Docs/checkpoint-only -> Tier 0 classifier only.
4. Localized runtime/test changes -> Tier 2 static + focused coverage; changed test files / matching feature tests are selected automatically, with a small browser smoke fallback.
5. Browser-sensitive localized changes add WebKit; ordinary localized logic does not download/run WebKit automatically.
6. Known shared/high-risk paths or 4+ runtime files -> Tier 3 full Chromium + WebKit.
7. Soak jobs are separate and only run for stability-sensitive Tier 3 work or Tier 4.
8. A Tier 3 full CI does not duplicate the same focused browser matrix first; the full regression already subsumes it.
9. Feature-branch `push` runs are removed to prevent duplicate push + PR heavy runs. PR CI is authoritative for feature branches; `push` gating is reserved for `main`.
10. `workflow_dispatch` / relevant `main` push is Tier 4.
11. Superseded in-progress runs are cancelled for the same PR/ref.
12. Unknown/unavailable change range fails safe to Tier 3.
13. Batch checkpoint/status docs in one commit when practical.

## Camera root cause retained for reference
- The earlier `waitForMapFit` could accept the synchronous click-time fit before WebKit completed a later responsive layout pass.
- The viewport then changed by 13 px and queued ResizeObserver reconciliation updated the fitted camera state.
- The two failures were the same race: 13 px in fit geometry and 6.5 px in vertical centering.
- Fix waits for the production `camera-smooth` lifecycle to finish, then polls the existing exact fit predicate. No sleeps/tolerance weakening/production camera change.

## NEXT ACTION
1. Inspect only the newest Actions run produced by the finalized CI-policy commit.
2. One full validation is expected because the workflow itself changed. Do not manually start another full run first.
3. If green: update `CODEX_NEXT_TASK.md` + `AUTONOMY_STATUS.md` together in one docs-only commit and verify that only the lightweight classifier runs / heavy jobs skip.
4. If red: inspect the exact failed job/test and root cause. If evidence indicates a flake, rerun only the failed scope; otherwise make the minimal necessary fix and then validate that changed state.
5. Do not merge PR #93 until the user explicitly instructs it.
