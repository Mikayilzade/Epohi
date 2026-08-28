# AUTONOMY STATUS — «Эпохи» Humans v1

## State
`IN_PROGRESS_AUTONOMOUS`

## Integration
- Repository: `Mikayilzade/Epohi`
- Active branch: `codex/coherence-capture-learning-v1`
- Draft PR: #84
- Base: `prototype/humans-v1`
- `main`: DO NOT TOUCH

## Current checkpoint
Exact PR head inspected at the start of this run: `cb0d9e24f28942f03cb4451c3a023fa831aafbc9` (`Normalize persisted camera regression boundary`). PR #84 remains open/draft and targets `prototype/humans-v1`.

Exact implementation payload for this bounded package: `445e84a67f46969c2a66c99b248bc16cd68c74f1` (`Align journey decision regression with blocking overlay`). This test payload is incorporated into the coherent branch checkpoint pushed by this run together with this status update.

## Exact CI / factual blocker inspected
Workflow run `33156269118` (run #203) on exact head `cb0d9e24f28942f03cb4451c3a023fa831aafbc9` completed **failure**. Retained artifact `9680901793` was downloaded and inspected directly.

- Static integrity: **green**.
- Focused mobile runtime: **green** on Chromium and WebKit.
- Full Chromium: **157/177 passed, 20 failed**.
- Full WebKit: **157/177 passed, 20 failed**.
- First common full-suite failure: `tests/humans-journey.spec.js:145` (`решение эпохи ожидает игрока и применяет выбранное последствие`).
- Exact failure on both engines: Playwright timed out clicking `[data-open-human-journey]` because the visible `#stabilityDecisionModal` intercepted pointer events.
- Retained error context shows that modal contains the same queued event, `Странствующий мастер`, including the canonical choice `Попросить обучить учеников` with the expected `+10 науки` consequence.
- `src/humans-event-overlay-policy.js` explicitly treats `stabilityDecisionModal` as a blocking higher-priority overlay, so the stale part was the regression trying to bypass the canonical decision surface, not a runtime pointer defect.

## Bounded package completed
- Updated the journey regression to assert that the queued event opens the canonical blocking `#stabilityDecisionModal` and that the lower-priority journey modal stays closed while the decision is pending.
- The regression now resolves `Странствующий мастер` through the real visible `Попросить обучить учеников` button, then keeps the original exact state assertions: science increases by 10, the event leaves `queuedEvents`, and enters `resolvedEvents`.
- No production/runtime code, gameplay semantics, timeout, browser threshold or worker count changed.

## Validation state
- Authority before package: run `33156269118` / artifact `9680901793` on `cb0d9e24...`.
- Artifact showed the same first blocking-overlay failure on Chromium and WebKit; full suites were both 157/177.
- New Chromium/WebKit CI for this coherent test+status checkpoint is the next authority; do not claim this journey regression green until that exact run completes.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [x] Phase 1 focused runtime architecture hardening — run #203 focused gate is green on both engines.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage; currently working through the first factual full-suite failure.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Wait for the automatically-triggered Chromium/WebKit CI of this journey-decision regression checkpoint; when it completes, inspect its retained artifact and act only on the first remaining factual full-suite failure on that exact SHA.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
