# Worker development rework checkpoint — 2026-10-03

Branch: `rework/epohi-next`. Baseline: `stable` at `f27fb61aa791a22d2b12420c8e2ed42c234b9b96`.

Stage 1 implementation is ready for the user's visual/playtest review on this branch. Do not promote to `stable` without that approval.

## Implemented

- Worker improvements and repair now use the single `EpohiWorkerProjects` validator, start, progress, completion and migration API. Manual buttons and autonomous `Develop city` call that API.
- Removed worker button interception, DOM rewriting and worker order correction from the learning/finalization layers. The context renderer owns the worker card and displays assigned city, tile/target, action status, project progress, choices and disabled reasons. The visible autonomy picker offers city selection when there are multiple cities and four priority buttons.
- Worker projects spend one worker action per turn and do not spend city or empire production. Explicit `workerActions` preserve prior pacing: lumber/farm/trading post 2; mine/harbor 3; repair 1. City production remains for city queues.
- Project state stores `totalWorkerActions`, `remainingWorkerActions`, target, city context, start/last action turn and cost version. Old `totalTurns`/`remainingTurns` saves migrate in place without granting an extra action.
- Territory resolution uses a valid explicit tile owner first, then eligible player territory. Autonomous workers see only revealed targets in their assigned city's territory and use the same validator.

## Verification

- JS syntax and `git diff --check`: passed.
- Focused worker, autonomy, save, state schema and context tests: 19 passed in the combined run; two context tests initially hit local HTTP resource errors, then passed when rerun against a persistent local server.
- Mobile context: 7 passed at 390×844; worker selection and harbor action: 1 passed at 390×844.
- Browser smoke: 9 passed.
- Broader desktop Playwright regression: 231 passed. The city-choice UI was added during that run; its desktop priority/city scenarios passed afterward (2/2), as did its mobile city-choice scenario (1/1).
- Final static syntax and diff checks passed. After the last picker cleanup, focused Chromium mobile UI/layout scenarios passed (4/4) and desktop UI scenarios passed (3/3). Risk tier: 3, because this package changes shared worker state, turn flow, save migration and several runtime files.

## Known UX follow-up

- The worker context panel is scrollable on small screens. User visual playtesting of its layout remains useful before any promotion to `stable`.
