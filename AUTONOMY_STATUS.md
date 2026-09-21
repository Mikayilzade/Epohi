# AUTONOMY STATUS — CURRENT

Updated: 2026-09-21 UTC.
State: PR_100_CI_V2_IMPLEMENTED_LOCALLY / AUTHORITATIVE_CI_PENDING / NO_MERGE.

## CI v2 phase checkpoint
- Scope remains existing PR #100 / `codex/fix-github-actions-output-issue` (the local checkout is the allowed `work` alias). No branch or replacement PR was created and no merge was attempted.
- Phase 0 baseline: the old workflow had one sequential full job (Chromium then WebKit), one five-seed serial Chromium soak job, and one two-seed serial WebKit soak job. `fullyParallel` was false, every command used one worker, and the full/soak job timeouts were 65/90/50 minutes. Run `34775550869` is the latest known representative green, but this snapshot has no authenticated GitHub API/remote, so exact historical job durations cannot be recovered. Safe targets were therefore established from the workflow's explicit sequential structure rather than invented timing data.
- Phase 1: Playwright now uses `trace: retain-on-failure` with existing failure screenshots/videos, plus a shared reporter that writes structured `failure.json` records under `test-results/`. Workflow commands no longer override that reporter, and every relevant artifact upload already includes `test-results/` and `playwright-report/`. A deliberately introduced local contract-test mistake proved that the first failure produced both `failure.json` and `trace.zip`; the mistake was fixed and the probe artifacts are not committed.
- Phase 2: soak runs as seven independent browser/seed jobs with `fail-fast: false`, exactly preserving Chromium seeds `10101/20202/30303/40404/50505` and WebKit seeds `10101/30303`. The spec rejects a matrix seed that does not belong to the selected long/short set.
- Phase 3: full non-soak regression is a browser × 3-shard matrix with diagnostic names and `fail-fast: false`. Playwright `--list` evidence showed the unsharded Chromium set had 186 entries and the combined shards had 186 entries / 186 unique entries.
- Phase 4 adaptive result: full shards remain at one worker. The planned two-worker experiment requires authoritative repeated CI evidence, unavailable before publication in this unauthenticated snapshot; choosing one worker preserves stability while job-level parallelism supplies the safe speedup. This is the closest evidence-based equivalent allowed by the phase's explicit “workers intentionally remain at 1” exit path.
- Phase 5: soak records seed and last successful boundary (creation, standing orders, turn transition, save/reload, outcome) and attaches compact turn/processing/outcome/modal/selection state on failure. Existing semantic turn waits, assertions, tolerances, and timeouts are unchanged.
- Phase 6: classifier semantics are unchanged. Tier 0 still stops after classification, Tier 2 remains focused, Tier 3/4 route to the new full/soak matrices, PR-range classification and feature-branch push de-duplication remain intact, and contract tests assert behavior rather than YAML layout alone.
- Phase 7 local evidence is green: JS syntax, selector/diagnostics unit contracts, workflow YAML parsing, workflow Playwright contracts, diff integrity, and exact shard-union enumeration. The mandatory authoritative browser gate and before/after Actions timing remain pending because `gh` has no authentication and the local checkout has no remote; no result is being claimed as green without execution.

## Adaptive criteria decisions
- Historical exact wall time was unavailable, so Phase 0 uses the closest provable baseline: known green run ID plus explicit sequential job topology and timeout ceilings. This preserves the bottleneck-identification intent without fabricating measurements.
- Phase 4 keeps workers at one because a stable two-worker improvement cannot be demonstrated locally or through unauthenticated Actions. This takes the plan's stability-first exit path rather than guessing.
- Phase 7 cannot be closed until PR #100's authoritative Actions run executes on the committed SHA. All safe local/static work is complete; per `AGENT_TESTING_POLICY.md`, the missing external CI capability is recorded rather than treated as a product failure or false green.

## Exact next action
- Publish the committed CI v2 change to the existing PR #100 branch and inspect its Tier 3 authoritative matrix. Root-cause any red job; if green, record run ID, total wall time, slowest job, and comparison with run `34775550869`, then stop for review. Do not merge.

---

## Previous checkpoint — 2026-09-12
State: PR_93_CAMERA_FIX_VERIFIED_GREEN / RISK_BASED_CI_FINALIZATION_PENDING_SINGLE_VALIDATION / NO_MERGE.

- Camera 2.0 fix was verified green in authoritative PR #93 run #210 at `8ae1ae9da6685218ae5dcd9e99deac151cd03df0`.
- Risk-based CI policy was finalized in `AGENT_TESTING_POLICY.md`.
- CI model classifies only the relevant pushed range, avoids duplicate feature-branch push runs, separates soak from ordinary regression, cancels superseded runs, and fails safe when scope is unknown.
- Camera root cause: WebKit could apply a later 13 px responsive viewport-height update after the synchronous fit; the fix waits for the production camera lifecycle to settle before checking exact fit.
- No arbitrary sleep, tolerance relaxation, or production camera/game-logic change was used.

---

## Historical note
Detailed pre-fix and intermediate CI-policy chronology is intentionally not duplicated here. Use git/Actions history only when a concrete investigation requires it.
