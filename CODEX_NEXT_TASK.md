# CODEX NEXT TASK

## Scope
Work only on existing PR #93 / remote branch `codex/-full-webkit-camera-2.0`. Do not create another PR/branch and do not merge.

## Current checkpoint — selector phase 1 complete
- Added `scripts/test-selection-manifest.json`: compact path/semantic ownership, primary specs, conditional neighbors, browser policy, minimum tier/full escalation, soak relevance, and one stable-title 0-AI smoke override.
- Added `scripts/select-tests.js`: a deterministic Node dry-run planner accepting changed paths plus optional `--semantic` and `--condition` inputs. It never launches Playwright.
- Unknown paths/semantic areas and missing ownership fail safe to Tier 3/full Chromium + WebKit. Four or more runtime files also fail safe to Tier 3/full.
- Added 10 cheap Node contract tests covering every required representative scenario. All pass.
- Playwright discovery confirmed the smoke grep selects exactly the generated 0-AI case without changing its parameterized source.
- Synthetic cases match `TEST_SELECTION_MATRIX.md`. Historical change sets `14a3ec1` (bootstrap/save/service worker) and `bf2a26d` (workflow policy) also resolve to Tier 3/full as expected. No mismatch was found.
- No reliable stored per-case/project timing artifact was found in the working tree or reachable Git filename history. Cost labels remain documentation estimates and are not encoded as budgets.
- Ambiguity retained explicitly: `soakRelevant` reports that soak may apply; phase 1 does not infer whether a workflow edit changed soak routing, nor alter CI behavior.
- No runtime/game code, existing Playwright behavior/assertions, Playwright config, dependencies, or authoritative workflow changed.

## Next action — stop before phase 2
Phase 1 is sound and phase 2 CI integration can be recommended, but do not integrate the selector into `.github/workflows/playwright.yml` until explicitly assigned. Keep the authoritative full cross-browser and soak gates unchanged.
