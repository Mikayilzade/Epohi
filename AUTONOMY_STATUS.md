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
The exact validated parent checkpoint before this implementation package is `a5cf39e1de60399d697da4ff13810e28aaff778f` (`Stabilize WebKit city modal stress fixture`).

Exact run `32670902813` for that SHA:
- static integrity: **success**;
- Chromium focused: **50/51 passed, 1 failed**;
- WebKit focused: **49/51 passed, 2 failed**;
- full regression skipped because focused gate remained red.

The shared factual Chromium/WebKit runtime failure is the 30-cycle city open/close idle invariant: observer callback delta remains above the unchanged `<=8` threshold. WebKit also has the known Playwright mobile-WebKit `mouse.wheel` limitation.

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
- StrategyUX broad DOM observers/global-click scheduling are gone; `EpohiRuntimeInvalidation` owns its explicit refresh.
- Capture outcome semantics and deterministic two-rival marker coverage are stable in focused Chromium runs.
- `1e33e1178f2634794314238a1074abcc46d2fa49` removed duplicate player-feedback click invalidation from `humans-player-feedback-stabilization.js`.
- `7b0dd7d996d0d3d7a20813a4f28333bd90b809a8` removed the remaining journey/victory/turn MutationObserver wake-ups from `humans-player-feedback-stabilization.js`.
- Subsequent implementation removed the legacy base `humans-player-feedback.js` refresh scheduler/MutationObservers; `EpohiRuntimeInvalidation` is now the explicit base PlayerFeedback refresh owner.
- `a5cf39e1…` exact CI reduced the focused failures to one Chromium runtime invariant plus the same WebKit runtime invariant and the WebKit wheel limitation.
- Root-cause inspection found `humans-event-overlay-policy.js` still scheduling overlay normalization after **every document click**, including `#cityBtn` and `[data-close="cityModal"]`. Thirty city open/close cycles therefore enqueue overlay-policy work unrelated to city UI and keep observer callbacks alive after the stress sequence.
- This package makes the overlay-policy delegated click scheduler ignore city-modal open/close toggles. Mandatory-decision protection and overlay class observers remain intact; gameplay thresholds are unchanged.
- No physical-device QA was initiated. PR #84 remains Draft and unmerged.

## Latest CI / validation
- Authoritative completed implementation checkpoint before this package: `a5cf39e1de60399d697da4ff13810e28aaff778f`.
- Exact run: `32670902813`; job `97271488760`; artifact `9501391413`.
- Static integrity: **success**.
- Chromium focused: **50/51 passed, 1 failed** — 30-cycle city callback invariant.
- WebKit focused: **49/51 passed, 2 failed** — the same city callback invariant plus unsupported mobile-WebKit mouse wheel behavior.
- Full Chromium/WebKit regression was correctly skipped because the focused gate failed.

## NEXT ACTION
Run the exact Chromium/WebKit gate for the implementation commit that skips overlay-policy invalidation on city-modal toggles. Do not push further source until that exact result is inspected. If the city 30-cycle invariant is green, take the first remaining factual failure; do not weaken callback/click thresholds and do not treat the WebKit `mouse.wheel` automation limitation as a gameplay fix target without separate evidence.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
