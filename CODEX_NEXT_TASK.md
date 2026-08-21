# CODEX NEXT TASK

## Task ID
`MOBILE_RUNTIME_ARCHITECTURE_HARDENING_V1`

## Goal
Eliminate the mobile UI feedback-loop architecture that causes heat, flicker, frozen interactions and city-modal instability. Do not merely add another global observer patch.

## Context
The latest physical iPhone smoke failed even after observer coalescing:
- phone heated quickly;
- UI froze/intermittently flickered;
- events could be accepted;
- opening a city repeatedly appeared to start and cancel until the game became unusable.

Current work branch: `codex/coherence-capture-learning-v1`, Draft PR #84, base `prototype/humans-v1`.

## Required engineering work
1. Inventory all `MutationObserver`, `ResizeObserver`, recurring `requestAnimationFrame`, `setInterval`, and broad DOM-decorator loops in the loaded Humans runtime. Record the result in `RUNTIME_OBSERVER_MAP.md` with owner module, observed root, mutations it performs, scheduling behavior, and whether it is retained/refactored/removed.
2. Identify observer/decorator cycles involving at least map rendering, context panel, readiness UI, city modal, diplomacy/event overlays and worker UI.
3. Replace broad reactive DOM watching with explicit invalidation/render hooks where practical. Prefer one bounded UI scheduler/event bus over multiple modules observing and rewriting each other.
4. Remove or sharply narrow whole-`body`, whole-map subtree and modal-subtree observers that are only being used as polling substitutes.
5. Treat the current global `MutationObserver` safety wrapper as temporary scaffolding. The target is an architecture that remains bounded without depending on monkey-patching the browser API. Do not remove the safety layer until regression tests prove the replacement stable.
6. Keep accepted gameplay semantics unchanged. This is runtime architecture/performance work, not a balance/design rewrite.
7. Preserve debug APIs and save compatibility used by the existing suite.

## Required regression coverage
Strengthen `tests/mobile-performance-stability.spec.js` or add a dedicated runtime test file to cover at least:
- open/close the city sheet 30 times; it must stay open when requested and close only when requested;
- assign/reassign routes and switch selected units repeatedly; top readiness indicators must settle correctly;
- accept/decline event and diplomacy overlays repeatedly without dead input;
- idle for several seconds after heavy interaction and prove DOM/observer/scheduler activity settles to a bounded level;
- repeated action cycles must not show monotonically increasing callback/frame activity;
- no console errors/unhandled rejections.

Tests must run on both `chromium-mobile` and `webkit-mobile`.

## Acceptance criteria
- Static checks green.
- Focused mobile runtime suite green on Chromium and WebKit.
- Existing coherence/capture/diplomacy/context/combat suites remain green on Chromium and WebKit.
- City sheet no longer flickers in automated repeated-open scenarios.
- Idle UI reaches quiescence after interaction.
- `RUNTIME_OBSERVER_MAP.md` exists and clearly identifies any remaining broad observer as an explicit temporary debt item.
- `AUTONOMY_STATUS.md` updated with exact head SHA, exact CI/test results, what was structurally changed, and exactly one next action.

## Do not
- do not ask the user for another phone smoke;
- do not merge PR #84;
- do not touch `main`;
- do not disable valid tests to obtain green CI;
- do not hide a WebKit failure behind Chromium success;
- do not add another permanent observer monkey-patch as the primary fix.

## Next task after success
The orchestrator should advance to full cross-browser regression, then autonomous soak-player construction per `QUALITY_GATES.md`. Do not start unrelated feature expansion before runtime hardening is genuinely green.
