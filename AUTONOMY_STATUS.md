# AUTONOMY STATUS — CURRENT

Updated: 2026-09-21 UTC.
State: PR_102_CI_V2_RUN_258_ROOT_CAUSED / MINIMUM_TEST_FIX_READY / AUTHORITATIVE_CI_PENDING / NO_MERGE.

## Current scope
- Active work is existing PR #102 / branch `codex/-ci-v2`, stacked on PR #100.
- PR #102 was created accidentally during CI v2 work. Do not create another PR/branch. Do not merge or close #102 during this investigation.
- After CI v2 is proven green, transfer/cleanup back to PR #100 is a separate user-reviewed action.
- `AGENTS.md` now requires a startup handshake: before work, verify and explicitly name the exact PR/branch; if verification fails, stop instead of creating a replacement.

## CI v2 architecture now under authoritative validation
- Full non-soak regression runs browser × 3 shards, one worker each, `fail-fast: false`.
- Chromium soak runs five independent seeds: 10101, 20202, 30303, 40404, 50505.
- WebKit soak runs two independent seeds: 10101, 30303.
- First browser failures retain trace/screenshot/video and structured diagnostics/artifacts.

## Authoritative run #258
Run ID: `35623913602`
Head before checkpoint-doc commits: `983ff69648a0961389dd5096151d3edf30924cac`

Green:
- Classify CI scope
- Static integrity
- Full Chromium shards 1/3, 2/3, 3/3
- Full WebKit shards 2/3, 3/3
- all five Chromium soak seeds
- both WebKit soak seeds

Skipped:
- Focused browser regression, by classifier

Red:
- `Full — WebKit — shard 1/3`
- 63 passed, 2 failed

### Failure A — Camera 2.0
`tests/camera-2.spec.js:217`
`show entire map centers map and center control targets selected unit or capital`

Observed:
- expected centering error < 0.01
- received 6.5 px after 2000 ms
- the layout timeline identifies a late 13 px WebKit viewport-height change; fitting against the earlier height leaves the camera exactly 6.5 px from the final center.

### Failure B — manual hill movement
`tests/combat-world-stability.spec.js:134`
`manual hill movement uses the routed terrain cost and waits for the second turn`

Observed:
- timed out waiting for `[data-context-action="move"]`
- diagnostics indicate target tile (6,5) was presented as an attack target / attack action instead of move
- generated camp state occupied the hard-coded target tile, so the runtime correctly chose attack semantics; this is fixture isolation, not a pathing/combat regression.

Failed-job artifact:
- `epohi-full-webkit-shard-1`, artifact ID `10651331454`

## Exact next action
The two failures are test-boundary defects, not gameplay regressions:
- Camera: the final WebKit viewport height arrived 13 px after the fit sample. The camera remained centered for the old geometry, producing the exact half-delta (6.5 px) error. Waiting for the existing three-frame stable-layout boundary before clicking Fit makes the action consume final geometry; no tolerance or timeout changed.
- Movement: the generated world may place a hostile camp on the hard-coded `(6,5)` fixture tile. `canAttack` correctly prioritizes a camp on that adjacent tile, so the UI correctly exposed Attack rather than Move. The focused movement fixture now removes generated hostile camp/barbarian state from its route target; gameplay/pathing is unchanged.

Risk tier: Tier 2 test-only stabilization, browser/layout-sensitive. Local focused browser execution is blocked because Chromium lacks `libatk-1.0.so.0`, and WebKit installation is blocked by CDN HTTP 403. Static checks remain required. Publish the coherent test/status fix to existing PR #102 / `codex/-ci-v2`, run the exact two WebKit tests through authoritative Actions first, then allow the classifier-selected gate. Inspect any red job before another change; stop for review when final SHA is green. Do not merge.


---

## Previous checkpoint — 2026-09-12
State: PR_93_CAMERA_FIX_VERIFIED_GREEN / RISK_BASED_CI_FINALIZATION_PENDING_SINGLE_VALIDATION / NO_MERGE.

- Camera 2.0 fix was verified green in authoritative PR #93 run #210 at `8ae1ae9da6685218ae5dcd9e99deac151cd03df0`.
- Risk-based CI policy was finalized in `AGENT_TESTING_POLICY.md`.
- CI model classifies only the relevant pushed range, avoids duplicate feature-branch push runs, separates soak from ordinary regression, cancels superseded runs, and fails safe when scope is unknown.
- Camera root cause: WebKit could apply a later 13 px responsive viewport-height update after the synchronous fit; the fix waits for the production camera lifecycle to settle before checking exact fit.
- No arbitrary sleep, tolerance relaxation, or production camera/game-logic change was used.

---

## Historical note
Detailed pre-fix and intermediate CI-policy chronology is intentionally not duplicated here. Use git/Actions history only when a concrete investigation requires it.
