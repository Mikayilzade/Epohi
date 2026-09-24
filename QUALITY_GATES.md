# QUALITY GATES — Humans v1 Release Candidate

For a release candidate, ask the user to test a build only after the automated
gates applicable to that target platform are satisfied or a specific exception
is documented. Ordinary PC development follows `AGENT_TESTING_POLICY.md`.

## Active development target
Ordinary development targets PC / desktop Chrome/Chromium, with local development and manual
playtesting on the user's PC. Mobile support is deferred and non-blocking; preserve its code
and tests. Mobile-specific failures are not ordinary PC development blockers unless evidence
shows a shared/runtime regression or impact on desktop Chromium. GitHub remains for commits,
PRs, CI, and history. Before a large graphics/assets rework, run a separate performance audit.

The mobile/WebKit gates below retain coverage for a future mobile-focused release. They are
not automatic blockers for ordinary PC gameplay development.

At the 2026-09-23 audit SHA (`2c6b2a1`), `playwright.config.js` defines only
`chromium-mobile` and `webkit-mobile`, and the workflow invokes those projects.
Desktop Chromium validation required for a PC release is therefore an open
coverage gap. Do not count a mobile-emulated Chromium job or a docs-only CI
scope-classifier success as proof that the desktop gate passed. See
[PROJECT_DECISION_AUDIT.md](PROJECT_DECISION_AUDIT.md), D23–D24.

## Gate A — static integrity
- `node --check` for all JavaScript in `src/`, `tests/`, service worker and Playwright config.
- `git diff --check` for the implementation range.
- No accidental debug files, temporary diagnostics, or dead workflow experiments in the final RC.

## Gate B — focused mobile runtime, Chromium
Required scenarios include:
- route assignment and repeated unit selection;
- city open/close stability;
- mandatory decisions;
- diplomatic proposal accept/decline;
- worker action and autonomous work;
- same-tile unit selection;
- capture modal and post-capture state;
- idle period with no runaway observer/DOM activity.

## Gate C — focused mobile runtime, WebKit (deferred)
Retain the same critical scenarios using Playwright WebKit with a 390×844 touch/mobile
context. A failure blocks a mobile-focused release, not ordinary PC development.

## Gate D — complete regression suite
For the active PC target, run the full Playwright suite on desktop Chromium. For a
mobile-focused release, also run the suite on:
1. `chromium-mobile`
2. `webkit-mobile`

No unexplained failures. Skips must be intentional and documented.

## Gate E — save / load / migration
At minimum verify:
- new campaign save/load;
- autosave/quick-save path used by existing tests;
- an older compatible save can migrate without corrupting city, unit, diplomacy, capture, worker or production-experience state;
- service-worker/cache changes do not serve stale runtime assets in the RC build.

## Gate F — runtime performance invariants
Automated tests must demonstrate:
- city sheet remains open after being opened and does not flicker closed/open;
- repeated route assignment does not make readiness indicators disappear permanently;
- no continuous UI mutation loop while idle;
- no continuously scheduled animation-frame loop while idle without a visible animation/reason;
- observer/decorator counters remain bounded during a quiet window;
- 30–50 repeated open/close/select actions do not progressively increase callback rate;
- no uncaught exceptions, unhandled rejections or console errors in critical flows.

The exact metric can evolve with the architecture; do not keep a broken global observer wrapper solely to preserve an old counter-based test.

## Gate G — autonomous soak player
Before RC, implement a deterministic test driver that can play without human input.

Minimum target:
- at least 5 deterministic seeds;
- at least 150 turns per seed, or until legitimate victory/defeat;
- at least Chromium + WebKit for a shorter representative soak, with the longest matrix allowed on Chromium if CI time makes full WebKit soak impractical;
- periodic save/reload during the run.

Continuously assert invariants such as:
- turn processing always returns to idle;
- at most one blocking decision/proposal/capture layer owns input at a time;
- living states with cities have a valid capital;
- defeated states do not own cities;
- city/unit/resource values are finite and structurally valid;
- production/research queues reference valid content;
- the bot can always resolve or intentionally defer the current required interaction;
- no runaway DOM/observer activity after each turn settles.

## Gate H — automated UX / layout smoke
For the active PC target, verify major sheets at desktop viewport sizes. For a
mobile-focused release, also verify mobile viewport fit/scroll behavior for:
- city;
- science;
- diplomacy;
- treasury/menu;
- capture choice;
- urgent decision;
- chronicle.

Generate/retain screenshots on failure for diagnosis. Do not make the user inspect routine screenshots.

## Gate I — Release Candidate cleanup
Before requesting release-candidate review or an applicable physical-device test:
- all gates applicable to the target platform green, with deferred mobile gates
  required again for a mobile-focused release;
- temporary branch-only workflow removed or replaced by a durable appropriately scoped workflow;
- temporary diagnostics removed;
- the actual integration PR body and `AUTONOMY_STATUS.md` updated to the exact
  RC SHA, executed jobs and exact test counts (a skipped job is not a pass);
- service-worker cache/version deliberately refreshed if runtime assets changed;
- immutable test URL prepared for the exact RC SHA.

## Gate J — one physical iPhone test (deferred)
Only for a mobile-focused release, after applicable gates pass, ask Mikayil for a real
playthrough. The purpose is tactile/device validation: heat, responsiveness, Safari-specific
behavior, scrolling and interaction feel—not basic functional QA.

If the device test finds a defect, add a regression, return to the relevant automated gate, and produce a new RC. Do not send a sequence of patch builds for manual micro-testing.
