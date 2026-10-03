# Epohi rework checkpoint — 2026-10-03

Branch: `rework/epohi-next`. Baseline: `stable` at `f27fb61aa791a22d2b12420c8e2ed42c234b9b96`.

Stages 1 and 2 are implemented on this branch for the user's visual/playtest review. Do not promote to `stable` without that approval.

## Stage 2 — fractional movement

- Terrain movement costs: plains 0.5, forest 1, hill 1. Desert 1, swamp 3 and dead land 2 are unchanged; water remains impassable to land units. Unit `maxMoves` are unchanged: worker/warrior/settler 1, scout 2.
- `EpohiMovement` owns terrain cost, neutral unknown-tile planning cost (1), fractional MP spending and number formatting. Manual movement, weighted route finding/preview/execution and autonomous movement use it. Known autonomous guard/develop paths also use weighted costs.
- Manual movement keeps the exact remainder. Travel orders retain a paid movement bank for tiles costing more than one turn; completion/cancellation returns unspent MP, and reassignment carries the bank without granting extra MP. Revealing a higher-cost or blocked unknown tile waits and replans before any overspend. Attacks and point-of-interest actions still end movement.
- Unit inspection shows remaining/max MP such as `0.5 / 1`; tile inspection and route badges/ETA reflect fractional costs. Existing numeric `moves` saves preserve fractions, and legacy route banks normalize to zero when missing or invalid. No save schema version change was needed.
- Verification: syntax and diff checks passed; focused desktop movement/autonomy/worker scenarios 13/13 and 11/11; focused mobile movement/UI scenarios 9/9; mobile context scenarios 7/7; full desktop Chromium regression 242/242, including soak. Two legacy iPhone scenarios did not pass locally: one intermittent resource connection refusal and one map tile outside the mobile viewport. Neither occurred in the focused movement suite or desktop regression.
- Playtest question: does Scout movement of up to four plains tiles per turn feel too fast, or does the open-versus-rough contrast work well? Also inspect route ETA and the worker card after moving 0.5 MP.

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
