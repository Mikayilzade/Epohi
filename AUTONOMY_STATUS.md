# AUTONOMY STATUS — CURRENT

Updated: 2026-09-13 UTC.
State: PR_93_TEST_SELECTOR_PHASE_1_REVIEW_FIXES_COMPLETE / PHASE_2_NOT_STARTED / NO_MERGE.

## Current checkpoint
- Active scope remains existing PR #93 / `codex/-full-webkit-camera-2.0`; PR remains unmerged.
- Selector phase 1 review fixes are complete: conditions can generically affect browser policy, minimum tier, full regression, and soak relevance in addition to adding specs.
- Component layout now requires WebKit; worker shared-schema and turn-yields conditions escalate to Tier 3/full Chromium + WebKit with soak relevance.
- Explicit runtime semantics are honored for documentation-only paths. Ordinary test files no longer count toward the four-runtime-file threshold; unknown ownership still fails safe and `tests/helpers.js` remains Tier 3.
- The manifest is validated for unique areas, tiers, browser policies, referenced specs, case-override IDs, and supported/well-formed condition effects.
- A stable title grep was discovery-validated to select only the generated 0-AI browser smoke case. Existing Playwright sources were not modified.
- No runtime/game code, existing Playwright assertions/behavior, Playwright config, dependency, or authoritative workflow changed.

## Files and validation
- Updated: `scripts/test-selection-manifest.json`, `scripts/select-tests.js`, `tests/test-selection.contract.test.js`, `CODEX_NEXT_TASK.md`, `AUTONOMY_STATUS.md`.
- Green: `node --check scripts/select-tests.js`.
- Green: `node --test tests/test-selection.contract.test.js` (19/19).
- Green: Playwright `--list` with the manifest smoke grep (exactly 1 case, no browser launch).
- Green: `git diff --check`.

## Stop / recommended next action
- Stop for review before phase 2. Do not change the authoritative workflow without a new explicit instruction.
- Preserve the existing full cross-browser and soak gates, and do not mass-tag the 187 cases.

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
