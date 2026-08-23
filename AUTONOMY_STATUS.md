# AUTONOMY STATUS — «Эпохи» Humans v1

## State
`IN_PROGRESS_AUTONOMOUS`

## Integration
- Repository: `Mikayilzade/Epohi`
- Active branch: `codex/coherence-capture-learning-v1`
- Draft PR: #84
- Base: `prototype/humans-v1`
- `main`: DO NOT TOUCH

## Current branch checkpoint
Latest source-triggering implementation checkpoint: `8fb8b7dd0fbd64214ac2953a3f7c9156869a9ede` (`Bump cache for explicit legacy refresh bridge`). The package also includes runtime bridge `6d2ce75ecc1683142f92adef9e2d0c981ae26998`, focused regression `1dbfe0b2dee535b3c1d2a45480fb0d17ce03568f`, and workflow inclusion `491a25909df0b33a03a2d18f833be7947310bf10`.

Subsequent observer-map/status commits are documentation-only. Always fetch PR #84 head before the next implementation write.

## Why manual QA is suspended
Intermediate physical-device QA remains suspended until Release Candidate. Automated Chromium/WebKit gates own the stabilization loop.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — branch CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## Phase 1 progress
- Broad observers have been removed natively from `humans-observer`, `humans-visuals`, context cleanup and broad stabilization content polling.
- `src/humans-performance.js` v7 temporarily quarantines remaining legacy broad roots while native registrations are migrated.
- Exact run `32577245212` for containment checkpoint `faecc620468ea174f921ea1338cc96d5384ffe28` completed failure: static integrity passed; focused Chromium **45/50**, WebKit **42/50**; full regression skipped.
- The containment run restored callback isolation but exposed the missing replacement path: useful strategy/player-feedback decorator work had still depended on their suppressed observer wake-ups. Chromium faction-marker failure is direct evidence of that gap; city/runtime failures remained on both engines.
- `src/humans-runtime-invalidation.js` v6 now explicitly invokes `EpohiStrategyUX.refresh()` and `EpohiPlayerFeedback.refresh()` inside the same protected coalesced RAF as visual/context/stabilization work.
- `tests/explicit-legacy-refresh-bridge.spec.js` drives 30 invalidation requests and requires both legacy refreshes to execute through bounded central flushes; the focused workflow now runs it on Chromium and WebKit.
- `RUNTIME_OBSERVER_MAP.md` records this replacement path. No click/callback threshold was weakened.

## Current blocker
The exact Chromium/WebKit workflow for source checkpoint `8fb8b7dd0fbd64214ac2953a3f7c9156869a9ede` is now the only unresolved validation item. Do not make another source push until its exact run/artifact is inspected.

## Latest CI / validation
- PR #84 was re-verified before this implementation package: open, Draft, mergeable, base `prototype/humans-v1`, head at that point `3e916f502c668d694ba7a67243d680373476b2a0`.
- Exact containment run `32577245212` (`faecc620…`): static integrity **success**; focused gate **failure**; full suite **skipped**.
- Chromium focused: **45/50 passed, 5 failed** — capture choice did not open, faction marker scenario failed, city open and 30-cycle city stress remained unstable, runtime invalidation failed.
- WebKit focused: **42/50 passed, 8 failed** — capture choice, treasury non-capital selection, stacked units, unsupported `mouse.wheel`, selected-worker callback churn, city open/close stress, runtime invalidation.
- This package moves the useful strategy/base-feedback refresh behavior to central invalidation before attempting deletion of their anonymous legacy observer/click registrations.
- CI result for `8fb8b7dd0fbd64214ac2953a3f7c9156869a9ede`: **pending at this status checkpoint**.

## NEXT ACTION
Inspect the exact Chromium/WebKit workflow and artifact for source checkpoint `8fb8b7dd0fbd64214ac2953a3f7c9156869a9ede`. If the explicit bridge regression passes and useful UI scenarios recover, remove the now-redundant native broad MutationObserver/global-click schedulers from `humans-strategy-ux.js` and `humans-player-feedback.js` in the next bounded package; if not, fix the first exact bridge failure without restoring polling or weakening thresholds.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
