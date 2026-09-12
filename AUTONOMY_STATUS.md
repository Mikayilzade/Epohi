# AUTONOMY STATUS — CURRENT

Updated: 2026-09-12 UTC.
State: PR_93_CAMERA_FIX_VERIFIED_GREEN / RISK_BASED_CI_FINALIZATION_PENDING_SINGLE_VALIDATION / NO_MERGE.

## Current checkpoint
- Active scope: existing PR #93 / `codex/-full-webkit-camera-2.0`.
- Camera 2.0 game/test fix commit verified green in authoritative PR #93 run #210: `8ae1ae9da6685218ae5dcd9e99deac151cd03df0`.
- No game/runtime behavior has been changed after that verified Camera fix; subsequent work is CI policy + agent/process documentation only.
- Intermediate CI-policy runs #219/#220 are superseded for decision-making. Do not rerun them before the finalized policy commit is validated.
- PR #93 remains open, draft, and unmerged by instruction.

## Permanent risk-based testing model
- `AGENT_TESTING_POLICY.md` is the source of truth for test scope.
- Tier 0: docs/checkpoint-only -> no heavy Playwright.
- Tier 1: genuinely trivial isolated runtime edit -> static/minimal focused only when useful; CI does not guess Tier 1 from filenames.
- Tier 2: localized feature/test change -> static + directly relevant focused Playwright; add WebKit only for browser/layout/input-sensitive work.
- Tier 3: shared/high-risk or broad runtime change -> static + full Chromium/WebKit; relevant soak only for stability-sensitive areas.
- Tier 4: final integration/merge/release/manual gate -> full Chromium/WebKit + required soak.
- Reuse valid green evidence for an unchanged SHA. Do not full-rerun unchanged work without a reason.

## CI efficiency model being finalized
- PR synchronize events classify only the newly pushed range, so a later docs-only commit does not inherit older game-code changes from the PR.
- Localized runtime changes no longer automatically mean the entire browser suite.
- Known shared/high-risk paths and 4+ runtime-file changes escalate automatically to Tier 3.
- Focused Tier 2 coverage auto-selects changed test files / matching feature tests, with a small browser fallback.
- Browser-sensitive Tier 2 changes add WebKit; ordinary localized logic defaults to Chromium focused coverage.
- Full Tier 3 CI does not duplicate the same focused matrix before the full suite.
- Soak is separated from ordinary full regression and runs only when stability risk warrants it (or Tier 4).
- Feature-branch `push` CI duplication is removed: an open PR gets one authoritative PR run; automatic push gating is reserved for `main`.
- Superseded in-progress runs for the same PR/ref are cancelled.
- Status/checkpoint edits should be batched into one commit where practical.
- If scope cannot be determined safely, CI fails safe to a heavier gate.

## Camera 2.0 retained reference
- Root cause: the old wait could accept synchronous click-time fit before WebKit's later 13 px responsive viewport-height update and ResizeObserver reconciliation.
- Fix: wait for the production `camera-smooth` lifecycle to settle, then poll the existing exact fit predicate.
- No arbitrary sleep, tolerance relaxation, or production camera/game-logic change.

## NEXT ACTION
1. Validate only the newest finalized CI-policy commit/run. Do not rerun #219/#220 first.
2. Because the finalized change touches the workflow itself, one Tier 3/full validation is expected. This should be the last required heavy run for the policy change.
3. If the newest run is green, update this checkpoint and `CODEX_NEXT_TASK.md` together in one docs-only commit; that update must skip heavy Playwright.
4. If the newest run is red, inspect the exact failed test/job first. Rerun only the failed scope if a flake is suspected; do not blindly rerun the whole suite.
5. Do not create a new PR/branch and do not merge without explicit user instruction.

---

## Historical note
Detailed pre-fix and intermediate CI-policy chronology is intentionally not duplicated here. Use git/Actions history only when a concrete investigation requires it.
