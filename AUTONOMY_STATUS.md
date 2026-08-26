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
Latest product/test-fixture implementation checkpoint before this CI-infrastructure package is `bac05072b5fb1a41b0b4045bd77575fc32b896f4` (`Quiesce synthetic small multi-rival fixtures`). PR #84 was re-fetched immediately before this package and its exact head was that SHA.

The exact automatically-triggered browser CI for `bac05072...` is run `32934870950` (run #162), completed **failure**. Artifact `9594617880` (`epohi-autonomous-cross-browser-results`) was downloaded and inspected; static integrity was green and the full regression was skipped because the focused gate failed.

## Exact CI / validation for `bac05072...`
- Chromium focused: **52/55 passed, 3 failed**.
  - `tests/combat-world-stability.spec.js:121`: manual hill movement timed out waiting for the visible `move` action click.
  - `tests/humans-strategy-ux.spec.js:113`: three-rival political campaign timed out waiting for all rivals to populate `cultureKey`.
  - `tests/combat-world-stability.spec.js:177`: joint-war real-turn reached turn completion but exhausted the 20-second test budget immediately before reading the generated proposal.
- WebKit focused: **52/55 passed, 3 failed**.
  - `tests/combat-world-stability.spec.js:177`: joint-war real-turn exhausted the same unchanged 20-second budget while waiting for turn increment + idle.
  - `tests/humans-strategy-ux.spec.js:19`: mobile WebKit does not support Playwright `mouse.wheel`.
  - `tests/mobile-performance-stability.spec.js:190`: `open-city` actionability exceeded the unchanged 1-second click limit.
- The joint-war test still uses the actual End Turn button, real turn increment, `!isTurnProcessing()` return, real `jointWar` proposal generation and duplicate/war rejection. Its timeout was not increased and the diplomacy processor is not called directly.

## What this run established
The prior small-map + synthetic-rival fixture reductions did not make the focused gate deterministic under the current GitHub runner concurrency. Run #162 is also important because the same Chromium execution timed out in two unrelated scenarios, while WebKit hit another strict actionability timeout. That is evidence that the focused gate is making timing-sensitive mobile tests compete for a shared 2-core GitHub runner, rather than evidence for another speculative product-code rewrite.

This package therefore changes only CI execution concurrency: focused/full Chromium workers are reduced from 4 to 2 and WebKit workers from 2 to 1. The **20-second per-test timeout, observer thresholds, 1-second actionability limit, assertions, gameplay code and test scenarios remain unchanged**. This is intended to make existing strict timing gates measure the application instead of runner oversubscription; it does not weaken any acceptance threshold.

## Current blocker
The runtime hardening phase is not green until the lower-contention CI checkpoint proves the unchanged joint-war integration test and the rest of the focused gate on both engines. The WebKit `mouse.wheel` incompatibility remains a known secondary factual failure and must be addressed after the first blocker is resolved.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — PR CI for Chromium + WebKit mobile projects and full regression.
- [ ] Phase 1 — runtime/UI architecture hardening; remove observer/decorator feedback cycles.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — autonomous soak player; deterministic multi-seed long-run campaigns.
- [ ] Phase 4 — automated balance/UX/layout pass from soak telemetry and screenshots.
- [ ] Phase 5 — RC cleanup, exact immutable build, one physical iPhone playthrough.

## NEXT ACTION
Inspect the exact automatically-triggered Chromium/WebKit CI for the concurrency-normalization checkpoint containing this status. Do not make another source/test/runtime push while that run is pending. If the unchanged joint-war test is green, advance to the first remaining factual focused-gate failure from that same run; if it still fails, use its exact low-contention trace/artifact to identify the next bounded fix without increasing the 20-second timeout.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after all applicable gates in `QUALITY_GATES.md` are green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
