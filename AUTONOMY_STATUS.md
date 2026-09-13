# AUTONOMY STATUS — CURRENT

Updated: 2026-09-13 UTC.
State: PR_93_TEST_SELECTOR_PHASE_1_COMPLETE / PHASE_2_NOT_STARTED / NO_MERGE.

## Current checkpoint
- Active scope remains existing PR #93 / `codex/-full-webkit-camera-2.0`; PR remains unmerged.
- Selector phase 1 is complete: compact JSON ownership manifest, deterministic Node dry-run selector, and 10 cheap non-browser contract tests.
- Plans report tier, focused specs, included conditional neighbors/reasons, browser requirement, full-regression decision, soak relevance, matched areas, and fail-safe reason.
- Unknown/ambiguous ownership and four or more runtime files resolve to Tier 3/full Chromium + WebKit.
- A stable title grep was discovery-validated to select only the generated 0-AI browser smoke case. Existing Playwright sources were not modified.
- Synthetic matrix scenarios all matched. Historical sets `14a3ec1` (bootstrap/save/service worker) and `bf2a26d` (workflow) both produced the expected Tier 3/full plan; no mismatch was found.
- No reliable stored timing artifacts were found in the tree or reachable Git filename history, so estimated cost bands were not automated.
- No runtime/game code, existing Playwright assertions/behavior, Playwright config, dependency, or authoritative workflow changed.

## Files and validation
- Added: `scripts/test-selection-manifest.json`, `scripts/select-tests.js`, `tests/test-selection.contract.test.js`.
- Updated: `CODEX_NEXT_TASK.md`, `AUTONOMY_STATUS.md`.
- Green: `node --check scripts/select-tests.js`.
- Green: `node --test tests/test-selection.contract.test.js` (10/10).
- Green: Playwright `--list` with the manifest smoke grep (exactly 1 case, no browser launch).
- Green: `git diff --check`.

## Stop / recommended next action
- Stop before phase 2. Phase 1 is sound enough to recommend a separately assigned CI-integration review.
- Do not change the authoritative workflow yet. Preserve the existing full cross-browser and soak gates.
- Keep `soakRelevant` advisory until phase 2 defines explicit conditions (notably workflow command/routing changes).
- Do not mass-tag all 187 cases; add case-level metadata later only where it materially narrows execution.

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
