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
Exact implementation/test head inspected before this package: `0397799753eed9be2fa5530e458f42fc5c95f482` (`Align autonomy UI regression with user context boundary`). PR #84 remains open/draft, mergeable, and targets `prototype/humans-v1`.

Its automatically-triggered PR workflow run `33114351208` completed **failure** on that exact SHA. Retained artifact `9665225504` (`epohi-autonomous-cross-browser-results`) was downloaded and inspected directly.

## Exact CI / factual blockers from run #193
- Static integrity: **green**.
- Focused Chromium: **60/60 passed**.
- Focused WebKit: **60/60 passed**.
- Full Chromium: **154/176 passed, 22 failed**.
- Full WebKit: **154/176 passed, 22 failed**.
- The first factual failure remains identical on both engines: `tests/humans-autonomy.spec.js:20`; `#autonomyReportBtn` is still absent after the added real starting-tile click and the unchanged **1 second** actionability window.
- The retained artifact therefore disproves the prior harness-only hypothesis: a real tile click does not reliably deliver the autonomy context-refresh lifecycle when the fresh-game starting unit/context is already settled.
- Source inspection shows `humans-autonomy.js` still relies on a `contextPanel` MutationObserver plus one startup RAF. It does not subscribe to the canonical explicit `epohi:humans-ui-settled` signal that the hardened runtime already emits after render/transition boundaries.

## Bounded package completed this run
- Fixed only the explicit lifecycle ownership for autonomy controls plus its first regression and this status checkpoint.
- `humans-autonomy.js` now subscribes `scheduleRefreshControls` to `epohi:humans-ui-settled`; fresh-game/render settlement can create/update the report control without requiring an incidental context DOM mutation.
- Strengthened `tests/humans-autonomy.spec.js:20`: after real fresh-game creation it now requires `#autonomyReportBtn` within the same **1 second** window **without any extra tile click or fabricated mutation**. This directly guards the explicit lifecycle contract.
- Kept the existing narrow context observer for legacy context-note/action refreshes; this package does not broaden observer scope, add polling, increase timeouts, relax callback/cadence/actionability thresholds, or change gameplay.

## Validation state
- Pre-package authority: run `33114351208` on exact head `03977997...`; static and focused gates green, full regression red at 154/176 on both engines with the same first autonomy lifecycle failure.
- The source/test/status change is being created as one coherent Git object from exact parent `03977997...`.
- The automatically-triggered Chromium/WebKit CI of the new checkpoint is the next authority. Do not claim this lifecycle blocker green until that exact run completes.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [x] Phase 1 focused runtime architecture hardening remains green in run #193.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Wait for the automatically-triggered Chromium/WebKit CI of this exact explicit-autonomy-lifecycle checkpoint. If `tests/humans-autonomy.spec.js:20` is green on both engines, inspect the first remaining factual full-suite failure on that exact SHA and fix only that blocker. If it still fails, inspect the retained artifact for whether the settled signal is emitted before or after fresh-game state availability; keep the 1-second actionability assertion unchanged and do not reintroduce broad observer-driven decoration.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
