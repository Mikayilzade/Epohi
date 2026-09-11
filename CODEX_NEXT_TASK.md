# CODEX NEXT TASK

## Scope
Repository: `Mikayilzade/Epohi`.
Work only on existing PR #91 / remote branch `codex-tgmou0`.
Base is PR #90 branch `codex/work-on-existing-pr-and-follow-instructions`.
Do not create another remote branch or PR, do not retarget, force-push, or merge.

## Minimum-context rule
Do not broadly reread repository history or old chat context.
Start with this file, then inspect only:
- `tests/camera-2.spec.js`;
- `src/camera.js` and directly relevant layout/CSS/helpers;
- current PR #91 CI/artifacts when needed.
Read other files only if the evidence points there.

## Sandbox gate
Before editing/testing:
1. Run `git status --short --branch` and require a clean working tree.
2. Record `git rev-parse HEAD` and `git log -1 --oneline`.
3. Confirm this file contains the current checkpoint: Actions run `34619598135`, last tested source SHA `8e2ee5922a362f46c46ac1342e4ca2c14b412d6f`, and exactly two remaining WebKit Camera 2.0 failures.
4. If Codex preloads `codex-tgmou0` under local branch name `work`, treat `work` as a sandbox alias. Do not fetch/rename merely to match the remote name.
5. Do not create a replacement PR/branch if network publication is blocked. Preserve the local commit and report the exact commit/diff plus blocker.

## Known-good baseline
PR #90 SHA `2ac5522965db8bab8372632cbdd76f935f5ebd25` previously passed the full WebKit suite `185/185`.

Important comparison evidence:
- `tests/camera-2.spec.js` is unchanged between that baseline and the current tested SHA.
- `src/camera.js` is also unchanged in PR #91.
- PR #91 changes are workflow/test/docs/package-lock related, not production camera logic.
- `package-lock.json` was added in PR #91 and currently resolves Playwright `1.63.0`; treat this as a possible environment variable to verify, not as a proven root cause.

## Current authoritative checkpoint
GitHub Actions run: `34619598135`
Last tested source SHA: `8e2ee5922a362f46c46ac1342e4ca2c14b412d6f`

Results:
- Focused Chromium: `60/60` PASS.
- Focused WebKit: `60/60` PASS.
- Full Chromium: `185/185` PASS.
- Chromium long soak: PASS.
- WebKit representative soak: PASS.
- Full WebKit: `183/185` PASS, exactly 2 failures.

The previous hill-movement and WebKit soak seed `30303` failures are therefore closed. Do not reopen them unless a new run regresses.

### Remaining failure 1
`tests/camera-2.spec.js:176:3`
`Camera 2.0 › large map can fit short portrait and landscape viewports below legacy minimum`

Observed assertion:
- expected current scale to equal current `bounds.min`;
- received scale: `0.1865348980852378`;
- current `bounds.min`: `0.17850525015441632`;
- difference: about `0.00803`, larger than the current precision allowance.

### Remaining failure 2
`tests/camera-2.spec.js:198:3`
`Camera 2.0 › show entire map centers map and center control targets selected unit or capital`

Observed Y-centering assertion:
- expected: `18.99999999999997`;
- received: `25.49999999999997`;
- difference: exactly `6.5 px`.

A `6.5 px` center shift corresponds to a `13 px` change in effective viewport height. Combined with failure 1, the leading hypothesis is that WebKit layout geometry changes after the fit/center calculation, leaving camera state based on an earlier viewport size. This is a hypothesis to prove, not an instruction to change production code.

## Exact next task
1. Reproduce only these two Camera 2.0 cases on WebKit first. Also run them on Chromium as a control.
2. Add temporary or failure-only geometry diagnostics around `#showMapBtn`, sampling before click and over several animation frames after click. Record at minimum:
   - `mapViewport.clientWidth/clientHeight` and `getBoundingClientRect()`;
   - computed paddings and resulting content width/height;
   - `contextPanel` rect/height;
   - map `offsetWidth/offsetHeight` and rect;
   - camera `x/y/scale` and current scale bounds.
3. Determine whether the effective viewport changes after `showEntireMap()`, especially whether height shifts by about `13 px`.
4. Classify the root cause before editing behavior:
   - real product camera/layout defect;
   - test asserting before WebKit layout stabilizes;
   - browser/Playwright-version behavior change.
5. If possible, compare the exact Playwright/browser version used by the known-good run `34328409818` at SHA `2ac552...` with the current run. Do not downgrade/pin a browser merely to hide a valid defect.
6. Make the smallest evidence-based fix.
   - Do not broadly loosen `toBeCloseTo` tolerances; `6.5 px` is not floating-point noise.
   - Do not change production camera logic unless the diagnostics prove the user-visible camera should re-fit/re-center after the layout shift.
   - If this is only WebKit post-click layout settling, stabilize the test around the actual semantic state rather than adding arbitrary sleeps.
7. Verification order after the fix:
   - the two Camera 2.0 tests, Chromium + WebKit;
   - full non-soak Chromium + WebKit regression;
   - do not rerun long soaks unless the fix touches runtime/layout behavior that can affect them or CI automatically requires it.
8. Record the exact tested SHA/run and concise root-cause evidence in `AUTONOMY_STATUS.md` and refresh this file for the next step.

## Stop conditions
- Stop if the preloaded snapshot/checkpoint does not match this task or the tree is unexpectedly dirty before work.
- Do not create another PR or remote branch.
- Do not merge.
- Do not declare `READY_FOR_FINAL_DEVICE_TEST` until permanent CI is green and the complete PR #91 diff is independently reviewed against PR #90.
