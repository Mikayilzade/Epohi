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
Exact implementation/test head inspected before this package: `e081704b45c1c0b15a55dbdc519299033b593d5c` (`Refresh visuals explicitly in direct-state art regression`). PR #84 is open, draft, mergeable, and still targets `prototype/humans-v1`.

Its automatically-triggered PR workflow run `33099456679` (#191) completed **failure** on that exact SHA. Retained artifact `9659289543` (`epohi-autonomous-cross-browser-results`) was downloaded and inspected directly.

## Exact CI / factual blockers from run #191
- Static integrity: **green**.
- Focused Chromium + WebKit mobile runtime gate: **green**.
- Full cross-browser regression: **red**.
- The previously repaired explicit Humans visuals regression is no longer the first blocker; focused runtime hardening remains green.
- Full Chromium still contains a broad stale/direct-state cluster, including the first Chromium failure `tests/humans-autonomy.spec.js:20` where `#autonomyReportBtn` is absent after fresh-game creation, plus later pathing/context/diplomacy/UI failures. These remain separate blockers and are intentionally not mixed into this package.
- Full WebKit's first factual failure is `tests/barbarian-camps.spec.js:55`: the legacy migration fixture expected exactly one pre-migration camp but captured **4** live camps before stripping legacy IDs. The migration itself still returned valid IDs; the fixture was depending on asynchronous live-map maintenance having exactly one camp at capture time.

## Bounded package completed this run
- Hardened only the legacy barbarian-camp migration regression fixture.
- Before constructing the legacy save, the test now snapshots the current live camps, retains exactly one real camp, removes any additional asynchronously maintained camps, removes that camp's legacy-missing `campId`, and then exercises migration.
- The no-camp migration branch is still tested from the same normalized legacy base and remains required to produce zero camps and stable director timing across repeated migration.
- Added an explicit `sourceCount > 0` assertion so the regression cannot pass by manufacturing a camp-less fixture; the migrated one-camp save still must produce exactly one camp with an assigned ID.
- No gameplay source, camp spawning rules, target counts, timeouts, browser skips, runtime thresholds, merge target, or CI cadence was changed.

## Validation state
- Pre-package authority: run `33099456679` on exact head `e081704b...`; static + focused cross-browser gates green, full regression red.
- This package is test/status-only and is being committed as one coherent Git object from exact parent `e081704b...`.
- The automatically-triggered Chromium/WebKit CI of the new checkpoint is the next authority. Do not claim the WebKit legacy-migration regression green until that exact run completes.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [x] Phase 1 focused runtime architecture hardening is currently green in run #191.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Wait for the automatically-triggered Chromium/WebKit CI of this exact deterministic legacy-camp fixture checkpoint. If the WebKit migration regression is green, inspect the first remaining factual full-suite failure on that exact SHA and fix only that blocker; do not mix in unrelated stale/direct-state failures before the new artifact establishes their current order.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
