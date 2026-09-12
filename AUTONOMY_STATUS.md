# AUTONOMY STATUS — CURRENT

Updated: 2026-09-12 UTC.
State: PR_93_CAMERA_FIX_VERIFIED_GREEN / AWAITING_NEXT_TASK.

## Current checkpoint
- Active scope: existing PR #93 / `codex/-full-webkit-camera-2.0`.
- Camera 2.0 fix commit verified in CI: `8ae1ae9da6685218ae5dcd9e99deac151cd03df0`.
- Authoritative PR #93 Actions run: `34682720551` (run #210).
- `Focused + full cross-browser regression` — GREEN, job `103524208430`.
- `Autonomous soak — Chromium long matrix` — GREEN, job `103524208440`.
- `Autonomous soak — WebKit representative matrix` — GREEN, job `103524208475`.
- The two previously stable Full WebKit Camera 2.0 failures are resolved in the complete PR #93 gate.

## Confirmed root cause and fix
- The earlier `waitForMapFit` could complete on the synchronous click-time fit before WebKit's later responsive layout pass.
- WebKit then changed the effective viewport height by 13 px; the queued production `ResizeObserver` reconciliation updated the camera afterwards.
- The first failure encoded the 13 px fit-geometry change; the second encoded the corresponding 6.5 px vertical-center shift.
- Minimal fix: synchronize the test with the production `camera-smooth` lifecycle before polling the existing exact fit predicate.
- No arbitrary sleep, production camera/game-logic change, weakened assertion, or broadened tolerance was introduced.

## Repository / PR housekeeping
- The fix was fast-forwarded onto the existing PR #93 branch.
- Duplicate PR #94 is closed. Its single commit was already present on the PR #93 branch, so no separate integration work remains.
- PR #93 remains unmerged by instruction.

## NEXT ACTION
1. No further Camera 2.0 work while the permanent gate remains green.
2. Await the user's next task or integration decision.
3. Do not create a new PR/branch or merge without explicit instruction.
4. For any future CI red on this area, first establish reproducibility on the exact same SHA before editing code/tests.

---

## Historical note
Earlier PR #91 / `codex-tgmou0` Camera 2.0 checkpoints are superseded by the verified PR #93 state above. Consult git history if the detailed pre-fix chronology is needed.
