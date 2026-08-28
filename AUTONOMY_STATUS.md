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
Exact PR head inspected at the start of this run: `40bc5ab1eef97ee5e9fae1c366870dacdd3b1d03`. PR #84 was open/draft, unmerged, on `codex/coherence-capture-learning-v1`, targeting `prototype/humans-v1`.

Exact implementation head: `49bab29dc899e53077d14389fb0e0d71ad1f108b` (`Stabilize camp destruction regression fixture`). This bounded package addresses only the first factual Chromium full-suite failure retained by run #220. No runtime/source behavior was changed.

## Exact CI / factual blocker inspected
- Workflow run `33217629039` (#220) validated implementation head `c6bb622a4d163fe18d4a1c2a65b33ee61c900515` and completed **failure**, not cancelled. This confirms the previous CI orchestration package worked: the later status-only synchronize checkpoint did not invalidate the in-flight code run.
- #220 static gate: **green**.
- #220 focused Chromium + WebKit gate: **green**.
- #220 full Chromium: **160 passed / 179 total, 19 failed**.
- #220 full WebKit: **161 passed / 179 total, 18 failed**.
- The first factual Chromium failure was `tests/barbarian-review-fixes.spec.js:93` (`player and AI camp destruction paths record last destroyed camp and preserve existing barbarians`). Exact assertion: expected `r.player.count === 0`, received `3`.
- Artifact inspection showed the test intended to exercise destruction of one initial camp but used a randomly generated world without removing additional generated camps. Therefore `campReward` correctly removed the selected camp while unrelated camps remained; the failure was a nondeterministic regression-fixture defect, not evidence of a runtime camp-destruction defect.

## Bounded package completed
- Strengthened the existing camp-destruction regression fixture so it snapshots the generated active camps, retains the selected first camp, and explicitly removes all other generated camps before executing the player-destruction path.
- The assertion `r.player.count === 0` is preserved unchanged, so the regression still proves that the tested camp is removed; it no longer accidentally asserts a random world-generation camp count.
- Existing assertions for replacement timing, `lastDestroyedCamp`, preservation of an existing barbarian, and the AI destruction path remain intact.
- Exactly one test file changed; no production runtime/source file was touched.

## Validation state
- Exact prior CI #220 on `c6bb622a4d163fe18d4a1c2a65b33ee61c900515`: static green; focused Chromium + WebKit green; full Chromium 160/179; full WebKit 161/179; overall **failure**.
- Exact implementation head `49bab29dc899e53077d14389fb0e0d71ad1f108b`: new PR CI had not appeared yet at status-write time immediately after push. Do not make another source/test/runtime fix until this checkpoint has an exact CI result.
- Current blocker: cross-browser full regression is not green; the next factual blocker must come only from the retained logs/artifact for implementation head `49bab29dc899e53077d14389fb0e0d71ad1f108b`.
- No physical-device test is requested.

## Phase plan
- [x] Phase 0A — autonomous control plane and quality gates.
- [x] Phase 0B — Chromium + WebKit mobile PR CI.
- [x] Phase 1 focused runtime architecture hardening — focused Chromium + WebKit gate green.
- [ ] Phase 2 — complete cross-browser functional regression and save/migration coverage.
- [ ] Phase 3 — deterministic autonomous soak player.
- [ ] Phase 4 — automated UX/layout/balance pass.
- [ ] Phase 5 — RC cleanup, immutable build, one final physical iPhone playthrough.

## NEXT ACTION
Inspect the exact CI run for implementation head `49bab29dc899e53077d14389fb0e0d71ad1f108b`; verify the strengthened camp-destruction regression first, then take only the first remaining factual full-suite failure from that run as the next bounded package.

## Completion signal
Change state to `READY_FOR_FINAL_DEVICE_TEST` only after every applicable gate in `QUALITY_GATES.md` is green and the branch has been cleaned into a Release Candidate. Do not merge automatically.
