# CODEX NEXT TASK

## Scope
Work only on existing PR #93 / remote branch `codex/-full-webkit-camera-2.0` unless the user explicitly assigns a new scope. Do not create another PR/branch and do not merge.

## Current checkpoint
- PR #93 head before this status-only update: `8ae1ae9da6685218ae5dcd9e99deac151cd03df0`.
- Camera 2.0 WebKit race is fixed by waiting for the production `camera-smooth` lifecycle to finish before polling the existing exact fit predicate.
- No production camera/game logic was changed, no arbitrary sleep was added, and assertions/tolerances were not loosened.
- Authoritative verification on PR #93: GitHub Actions run `34682720551` (run #210), exact tested SHA `8ae1ae9da6685218ae5dcd9e99deac151cd03df0`.
- `Focused + full cross-browser regression` — GREEN.
- `Autonomous soak — Chromium long matrix` — GREEN.
- `Autonomous soak — WebKit representative matrix` — GREEN.
- The previously failing Camera 2.0 cases no longer fail in the full PR #93 gate.
- Duplicate PR #94 is closed. Its single commit had already been fast-forwarded onto the PR #93 branch, so no separate integration work is required.

## Root cause retained for reference
- The earlier `waitForMapFit` could accept the synchronous click-time fit before WebKit completed a later responsive layout pass.
- The viewport then changed by 13 px and the queued `ResizeObserver` reconciliation updated the fitted camera state.
- The two failures were the same race: 13 px in fit geometry and 6.5 px in vertical centering.

## NEXT ACTION
1. No more Camera 2.0 changes are required while PR #93 remains green.
2. Keep PR #93 unmerged until the user explicitly decides the integration/next development step.
3. If a future CI failure appears, first verify whether it reproduces on the same SHA before changing code or tests.
4. Await the next user-assigned task; do not create a new PR/branch on your own.
