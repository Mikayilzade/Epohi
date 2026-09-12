# AUTONOMY STATUS — CURRENT

Updated: 2026-09-12 UTC.
State: PR_93_CAMERA_FIX_VERIFIED_GREEN / CI_POLICY_OPTIMIZED / AWAITING_NEXT_TASK.

## Current checkpoint
- Active scope: existing PR #93 / `codex/-full-webkit-camera-2.0`.
- Camera 2.0 fix commit verified in CI: `8ae1ae9da6685218ae5dcd9e99deac151cd03df0`.
- Authoritative PR #93 Actions run: `34682720551` (run #210).
- `Focused + full cross-browser regression` — GREEN, job `103524208430`.
- `Autonomous soak — Chromium long matrix` — GREEN, job `103524208440`.
- `Autonomous soak — WebKit representative matrix` — GREEN, job `103524208475`.
- The two previously stable Full WebKit Camera 2.0 failures are resolved in the complete PR #93 gate.
- Commits after the verified Camera fix are process/CI-policy/documentation changes only; no additional game/runtime behavior has been changed.

## Confirmed Camera 2.0 root cause and fix
- The earlier `waitForMapFit` could complete on the synchronous click-time fit before WebKit's later responsive layout pass.
- WebKit then changed the effective viewport height by 13 px; the queued production `ResizeObserver` reconciliation updated the camera afterwards.
- The first failure encoded the 13 px fit-geometry change; the second encoded the corresponding 6.5 px vertical-center shift.
- Minimal fix: synchronize the test with the production `camera-smooth` lifecycle before polling the existing exact fit predicate.
- No arbitrary sleep, production camera/game-logic change, weakened assertion, or broadened tolerance was introduced.

## Permanent testing/CI policy now in repository
- `AGENT_TESTING_POLICY.md` defines risk-based tiers instead of “every commit = full suite”.
- Docs/checkpoint/instruction-only updates require no heavy Playwright.
- Small/localized changes start with static/focused tests and widen only when justified.
- Shared/high-risk systems require focused tests followed by full Chromium + WebKit and relevant soak coverage.
- Final integration/merge/release gates require the full gate regardless of the last change size.
- Valid green evidence for an unchanged SHA should be reused rather than rerunning expensive identical suites without a reason.
- `AGENTS.md` points every future agent to this policy when deciding test scope.
- `.github/workflows/playwright.yml` now classifies the newly pushed PR synchronization range: docs-only changes skip heavy regression/soak jobs; runtime/test/CI changes run them; ambiguous scope fails safe to heavy.
- Superseded runs for the same PR/ref are cancelled so only the newest SHA consumes the expensive gate.

## Repository / PR housekeeping
- The Camera fix was fast-forwarded onto the existing PR #93 branch.
- Duplicate PR #94 is closed; its single commit was already present on the PR #93 branch, so no separate integration work remains.
- PR #93 remains unmerged by instruction.

## NEXT ACTION
1. Confirm the new classifier behavior once: workflow-change commit gets a full gate; subsequent docs-only commit(s) should show only the lightweight classifier with heavy jobs skipped.
2. If confirmed, no further Camera 2.0 or CI-policy work is needed.
3. Await the user's next task or integration decision.
4. Do not create a new PR/branch or merge without explicit instruction.

---

## Historical note
Earlier PR #91 / `codex-tgmou0` Camera 2.0 checkpoints are superseded by the verified PR #93 state above. Consult git history if the detailed pre-fix chronology is needed.
