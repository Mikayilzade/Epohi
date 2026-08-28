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
Exact implementation/test head inspected before this package: `606a6bf55275b9b91ec812f0a436b9b531e4d89f` (`Emit settled lifecycle after fresh game state`). PR #84 remains open/draft, mergeable, and targets `prototype/humans-v1`.

Its automatically-triggered PR workflow run `33127087517` completed **failure** on that exact SHA. Retained artifact `9668895090` (`epohi-autonomous-cross-browser-results`) was downloaded and inspected directly.

## Exact CI / factual blocker from run #195
- Static integrity: **green**.
- Focused Chromium: **60/60 passed**.
- Focused WebKit: **59/60 passed, 1 failed**.
- Full Chromium/WebKit regression: **skipped** because the focused WebKit gate failed.
- The fresh-game settled lifecycle/autonomy blocker is therefore no longer the first failure in focused CI.
- The sole focused WebKit failure is `tests/combat-world-stability.spec.js:147` — `AI claims a known finite POI first and the player cannot collect it twice`; `claimed.used` remained `false` after the real end-turn.
- Source inspection confirms the effective `processRivals` already prioritizes `nearestKnownFinitePoi` for scouts before barbarians/unknown exploration. The regression fixture, however, reused randomly generated map/runtime state at `(6,5)` and only replaced terrain/reveal/POI; it did not normalize a pre-existing camp/feature or other rival-unit occupancy. Chromium happened to pass while WebKit did not, making the fixture itself non-deterministic across generated worlds.

## Bounded package for this run
- Fix only the deterministic setup of the known-POI priority regression; do not change AI/gameplay logic, route rules, timeouts, or thresholds.
- Normalize the scout and target cell before the end-turn: keep only the tested rival scout, clear camp/feature on the POI target, make the target plain/passable/revealed/known to that civ, keep the unrelated barbarian far away, and leave a separate adjacent plain tile unknown to preserve a real competing exploration choice.
- Keep all original product assertions unchanged: the POI must become used, it must no longer be targetable as a POI, the civ must gain resources, and `point-of-interest-resolved` must be logged.
- This status checkpoint is intentionally doc-only; the immediately following test-only commit is the single source/test change for this package.

## Validation state
- Pre-package authority: exact run `33127087517` on `606a6bf...`; static green, Chromium focused 60/60, WebKit focused 59/60, full suite skipped.
- No source/gameplay change has been made while diagnosing the artifact.
- The next authority is the automatically-triggered Chromium/WebKit CI of the deterministic POI-fixture test commit. Do not claim the blocker green before that exact run completes.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [ ] Phase 1 focused runtime architecture hardening — currently blocked only by the deterministic POI regression on WebKit in run #195.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Wait for the automatically-triggered Chromium/WebKit CI of the deterministic known-POI fixture checkpoint. If focused Chromium and WebKit are both green, inspect the first remaining factual full-suite failure on that exact SHA and fix only that blocker. If the POI test still fails, inspect the retained artifact for the scout position, target occupancy and civ exploration state after the single real turn before changing any gameplay code.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.