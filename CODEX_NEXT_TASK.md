# CODEX NEXT TASK

## Scope
Work only on existing PR #93 / remote branch `codex/-full-webkit-camera-2.0` unless the user explicitly assigns a new scope. Do not create another PR/branch and do not merge.

## Current checkpoint
- Camera 2.0 WebKit race fix is verified green at commit `8ae1ae9da6685218ae5dcd9e99deac151cd03df0`.
- Authoritative verification on PR #93: GitHub Actions run `34682720551` (run #210): focused + full cross-browser GREEN, Chromium soak GREEN, WebKit soak GREEN.
- The previously failing Camera 2.0 cases no longer fail in the full PR #93 gate.
- Subsequent commits after `8ae1ae9` are process/CI-policy/documentation changes, not game/runtime changes.
- Duplicate PR #94 is closed; its single fix commit was already fast-forwarded onto PR #93.

## Permanent testing policy added after the Camera fix
- `AGENT_TESTING_POLICY.md` now defines risk-based test tiers. Do not default to a full browser suite after every change.
- Tier 0 docs/checkpoint/instruction-only: no heavy Playwright.
- Small/localized changes: static + focused affected tests first; widen only when risk/evidence requires it.
- Shared/high-risk systems (camera, map/layout, movement, turn flow, state/save-load, observers, global DOM/CSS/helpers, dependencies/CI): focused first, then full Chromium + WebKit and relevant soak coverage.
- Final integration/merge/release gate: full cross-browser gate regardless of last change size.
- Reuse valid green evidence for an unchanged SHA; do not rerun an identical expensive suite without a reason.

## CI efficiency change
- `.github/workflows/playwright.yml` now classifies each PR synchronization by the newly pushed change range.
- Docs/checkpoint-only synchronizations should skip the heavy regression/soak jobs.
- Runtime/test/CI changes still run the heavy gate.
- Opening/reopening/ready-for-review and manual runs establish/run a full baseline.
- Concurrent superseded runs for the same PR/ref are cancelled so only the newest SHA consumes the full gate.
- If change scope cannot be determined safely, CI fails safe by running the heavy gate.

## Root cause retained for reference
- The earlier `waitForMapFit` could accept the synchronous click-time fit before WebKit completed a later responsive layout pass.
- The viewport then changed by 13 px and the queued `ResizeObserver` reconciliation updated the fitted camera state.
- The two failures were the same race: 13 px in fit geometry and 6.5 px in vertical centering.

## NEXT ACTION
1. Verify the new CI classifier once: the workflow-change commit should receive a normal full gate; later docs-only synchronization(s) should run only the lightweight classifier and skip heavy Playwright jobs.
2. If that behavior is confirmed, no more Camera 2.0 or CI-policy work is required.
3. Keep PR #93 unmerged until the user explicitly decides the integration/next development step.
4. Await the next user-assigned task; do not create a new PR/branch on your own.
