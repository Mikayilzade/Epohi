# AUTONOMY STATUS — «Эпохи» Humans v1

## State
`IN_PROGRESS_AUTONOMOUS`

## Integration
- Repository: `Mikayilzade/Epohi`
- Active branch: `codex/coherence-capture-learning-v1`
- Draft PR: #84
- Base: `prototype/humans-v1`
- `main`: DO NOT TOUCH

## Current source checkpoint
This status is committed together with the narrow population/workforce observer fix. Its parent implementation/diagnostic head is `e04ca1c9fa395fa321b6e03027a73d1cb723e599` (`Trace WebKit observer callback ownership`). On the next run, fetch PR #84 first and treat its exact head SHA as the immutable checkpoint for the CI result.

## Exact diagnostic result
Exact automatically-triggered PR CI run `32712294600` for `e04ca1c9fa395fa321b6e03027a73d1cb723e599` completed **failure**:
- Static integrity: **success**.
- Chromium focused: **51/51 passed**.
- WebKit focused: **46/51 passed, 5 failed**.
- Full regression: skipped because focused WebKit remained red.
- Known WebKit `mouse.wheel` failure remains an automation/API incompatibility, not evidence of a gameplay regression.

The diagnostic attribution in the 30-cycle city stability regression identified the first reproducible runtime owner instead of requiring another speculative observer removal:
- aggregate post-cycle idle callback delta: **13** against unchanged threshold **<=8**;
- attributed observer: `src/humans-population-workforce.js`, install path around its observer registration;
- registrations included `#gameApp`, `#cityContent`, `#turnValue`, and `#resourceScope` with subtree/character-data watching;
- observed idle mutation targets were overwhelmingly journey/decorator descendants under `#gameApp` (`span.journey-emblem`, `small`, `strong`, `span`, `span.journey-alert`) plus `#zoomValue`;
- attribution for that observer recorded **27 native callbacks / 132 records** over the diagnostic lifetime.

Other WebKit failures in the same run were consistent with the same churn class: selected-worker idle recorded **16 callbacks vs <=6**, and physical Playwright clicks on the diplomacy answer and `open-city` control timed out during actionability despite the controls resolving visible/enabled/stable. These are not being fixed speculatively in this checkpoint; first remove the proven descendant wake-ups and inspect the exact result.

## Fix in this checkpoint
`src/humans-population-workforce.js` keeps its existing semantic UI sync but sharply narrows its observer registrations:
- `#gameApp`: **class attributes only**, no descendant child/text observation;
- `#cityContent`, `#wikiContent`, `#turnValue`, `#resourceScope`: **direct child-list only**;
- no `subtree: true` or `characterData: true` registrations remain in this owner.

This preserves population/workforce behavior while preventing journey/map descendant decoration from waking the workforce sync loop. Existing `mobile-performance-stability.spec.js` retains the unchanged callback limits and observer-attribution diagnostic, so this exact defect is already covered by the failing regression that identified it. `sw.js` cache name is bumped so the runtime change cannot be hidden behind an older cached source file.

No gameplay threshold, click timeout, or assertion was weakened. No workflow dispatch/rerun was used. No physical-device QA was initiated. PR #84 remains Draft and unmerged.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — PR CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## NEXT ACTION
Fetch PR #84 and the exact automatically-triggered Chromium/WebKit CI for the current PR head created by this checkpoint. Do **not** make another source push until that exact run and its artifacts are complete and inspected.

First determine whether the unchanged WebKit runtime thresholds are now green, especially:
1. selected-worker idle `<=6` callbacks;
2. 30-cycle city post-idle `<=8` callbacks;
3. diplomacy-answer and `open-city` Playwright actionability.

If runtime churn is still above threshold, use the retained attribution diagnostic to name the next exact observer owner/target and make only one narrow coherent fix. If the callback gates are green but the physical Playwright clicks still time out, verify the synchronous handler path and then isolate the WebKit actionability test interaction without weakening the modal/state assertions. Handle unsupported mobile-WebKit `mouse.wheel` separately as an automation compatibility issue while preserving Chromium wheel coverage.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
